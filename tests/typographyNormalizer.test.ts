import { describe, it, expect } from 'vitest';
import {
  parseFontFamily,
  parseFontSizePx,
  parseFontWeight,
  parseLineHeightPx,
  clusterTypographyTokens,
  TypographyNormalizer,
} from '../src/normalization/index.ts';
import { DomExtractor } from '../src/extraction/index.ts';

describe('Typography Normalization Engine', () => {
  describe('Font Stack Parsing & Unquoting', () => {
    it('parses unquoted and quoted font family stacks correctly', () => {
      const parsedQuoted = parseFontFamily('"Inter", "Helvetica Neue", sans-serif');
      expect(parsedQuoted.primary).toBe('Inter');
      expect(parsedQuoted.name).toBe('Inter, Helvetica Neue, sans-serif');
      expect(parsedQuoted.fallbacks).toEqual(['Helvetica Neue', 'sans-serif']);

      const parsedSingle = parseFontFamily('Roboto, Arial, sans-serif');
      expect(parsedSingle.primary).toBe('Roboto');
      expect(parsedSingle.fallbacks).toEqual(['Arial', 'sans-serif']);
    });
  });

  describe('Numeric Value Normalization (Size, Weight, Line-Height)', () => {
    it('parses px, rem, em, pt font sizes to numeric pixels', () => {
      expect(parseFontSizePx('16px')).toBe(16);
      expect(parseFontSizePx('1.5rem')).toBe(24);
      expect(parseFontSizePx('12pt')).toBeCloseTo(16, 0);
    });

    it('parses named and numeric font weights correctly', () => {
      expect(parseFontWeight('normal')).toBe(400);
      expect(parseFontWeight('bold')).toBe(700);
      expect(parseFontWeight('600')).toBe(600);
    });

    it('handles line-height normal and pixel/multiplier values', () => {
      expect(parseLineHeightPx('normal', 16)).toBe('normal');
      expect(parseLineHeightPx('24px', 16)).toBe(24);
      expect(parseLineHeightPx('1.5', 16)).toBe(24);
    });
  });

  describe('Typography Clustering', () => {
    it('clusters repeated and visually indistinguishable typography styles within tolerance', () => {
      const token1 = {
        id: '1',
        fontFamily: 'Inter, sans-serif',
        primaryFamily: 'Inter',
        fontSizePx: 16,
        fontWeight: 400,
        lineHeightPx: 24,
        letterSpacing: 'normal',
        textTransform: 'none',
        textAlign: 'left',
        frequency: 5,
      };

      const token2 = {
        id: '2',
        fontFamily: 'Inter, sans-serif',
        primaryFamily: 'Inter',
        fontSizePx: 16.2, // Within 0.5px tolerance
        fontWeight: 400,
        lineHeightPx: 24,
        letterSpacing: 'normal',
        textTransform: 'none',
        textAlign: 'left',
        frequency: 3,
      };

      const clustered = clusterTypographyTokens([token1, token2], 0.5);
      expect(clustered.length).toBe(1);
      expect(clustered[0].frequency).toBe(8);
    });
  });

  describe('Hierarchy Detection & System Normalization', () => {
    it('extracts h1-h6 hierarchy, hero display, body, button text, and captions from DOM', () => {
      document.body.innerHTML = `
        <div id="root" style="font-family: 'Inter', sans-serif;">
          <h1 style="font-size: 36px; font-weight: 700; line-height: 44px;">Hero Display Heading</h1>
          <h2 style="font-size: 28px; font-weight: 600;">Section Heading H2</h2>
          <h3 style="font-size: 22px; font-weight: 600;">Subheading H3</h3>
          <p style="font-size: 16px; font-weight: 400; line-height: 24px;">Normal body paragraph text content.</p>
          <span style="font-size: 11px; font-weight: 400; color: #888;">Small caption text</span>
          <button role="button" style="font-size: 14px; font-weight: 500; text-transform: uppercase;">Click Me</button>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const typographyNormalizer = new TypographyNormalizer();
      const typoSystem = typographyNormalizer.normalize(rawResult);

      expect(typoSystem.fontFamilies.length).toBeGreaterThan(0);
      expect(typoSystem.fontFamilies[0].primary).toBe('Inter');

      expect(typoSystem.hierarchy.h1).toBeDefined();
      expect(typoSystem.hierarchy.h1?.fontSizePx).toBe(36);
      expect(typoSystem.hierarchy.heroDisplay).toBeDefined();
      expect(typoSystem.hierarchy.h2?.fontSizePx).toBe(28);
      expect(typoSystem.hierarchy.h3?.fontSizePx).toBe(22);
      expect(typoSystem.hierarchy.body?.fontSizePx).toBe(16);
      expect(typoSystem.hierarchy.caption?.fontSizePx).toBe(11);
      expect(typoSystem.hierarchy.buttonText?.fontSizePx).toBe(14);
      expect(typoSystem.hierarchy.buttonText?.textTransform).toBe('uppercase');
    });

    it('excludes hidden text elements when includeHiddenElements is false', () => {
      document.body.innerHTML = `
        <div id="root">
          <p style="font-size: 16px; font-weight: 400;">Visible body paragraph</p>
          <div style="display: none; font-size: 72px; font-weight: 900;">Hidden Giant Banner</div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body, { includeHidden: true });

      const typographyNormalizer = new TypographyNormalizer({ includeHiddenElements: false });
      const typoSystem = typographyNormalizer.normalize(rawResult);

      const sizes = typoSystem.tokens.map((t) => t.fontSizePx);
      expect(sizes).not.toContain(72);
    });

    it('is strictly deterministic: returns identical tokens for identical DOM state', () => {
      document.body.innerHTML = `
        <div>
          <h1>Heading</h1>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const normalizer = new TypographyNormalizer();
      const system1 = normalizer.normalize(rawResult);
      const system2 = normalizer.normalize(rawResult);

      expect(system1.stats).toEqual(system2.stats);
      expect(system1.tokens.map((t) => t.id)).toEqual(system2.tokens.map((t) => t.id));
      expect(system1.fontFamilies).toEqual(system2.fontFamilies);
    });
  });
});
