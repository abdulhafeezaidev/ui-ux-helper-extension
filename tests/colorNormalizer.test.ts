import { describe, it, expect } from 'vitest';
import {
  parseColor,
  calculateRelativeLuminance,
  calculateContrastRatio,
  clusterColorTokens,
  ColorNormalizer,
} from '../src/normalization/index.ts';
import { DomExtractor } from '../src/extraction/index.ts';

describe('Color Normalization Engine', () => {
  describe('Canonical Color Parsing & Alpha Preservation', () => {
    it('parses rgb() and rgba() strings correctly into CanonicalColor', () => {
      const parsedRgb = parseColor('rgb(139, 92, 246)');
      expect(parsedRgb.r).toBe(139);
      expect(parsedRgb.g).toBe(92);
      expect(parsedRgb.b).toBe(246);
      expect(parsedRgb.a).toBe(1);
      expect(parsedRgb.hex).toBe('#8b5cf6');

      const parsedRgba = parseColor('rgba(139, 92, 246, 0.5)');
      expect(parsedRgba.a).toBe(0.5);
      expect(parsedRgba.rgbString).toBe('rgba(139, 92, 246, 0.5)');
    });

    it('parses Hex strings correctly (#rgb, #rrggbb, #rrggbbaa)', () => {
      const hex3 = parseColor('#f00');
      expect(hex3.r).toBe(255);
      expect(hex3.g).toBe(0);
      expect(hex3.b).toBe(0);

      const hex6 = parseColor('#8b5cf6');
      expect(hex6.hex).toBe('#8b5cf6');

      const hex8 = parseColor('#8b5cf680');
      expect(hex8.a).toBeCloseTo(0.5, 1);
    });

    it('handles transparent and invalid color inputs safely', () => {
      const transparent1 = parseColor('transparent');
      expect(transparent1.a).toBe(0);

      const transparent2 = parseColor('rgba(0, 0, 0, 0)');
      expect(transparent2.a).toBe(0);

      const invalid = parseColor('invalid-color-string');
      expect(invalid.a).toBe(0);
    });
  });

  describe('WCAG 2.1 Luminance & Contrast Ratio Calculation', () => {
    it('calculates relative luminance using exact WCAG formulas', () => {
      const whiteLum = calculateRelativeLuminance(255, 255, 255);
      const blackLum = calculateRelativeLuminance(0, 0, 0);

      expect(whiteLum).toBe(1);
      expect(blackLum).toBe(0);

      // Red (255, 0, 0) relative luminance
      const redLum = calculateRelativeLuminance(255, 0, 0);
      expect(redLum).toBeCloseTo(0.2126, 3);
    });

    it('calculates exact WCAG 2.1 contrast ratio between white and black', () => {
      const whiteLum = calculateRelativeLuminance(255, 255, 255);
      const blackLum = calculateRelativeLuminance(0, 0, 0);

      const contrast = calculateContrastRatio(whiteLum, blackLum);
      expect(contrast).toBe(21.0);
    });

    it('calculates contrast ratio between custom foreground and background colors', () => {
      // White (1.0) and Dark Slate Blue (rgb(15, 23, 42))
      const bgLum = calculateRelativeLuminance(15, 23, 42);
      const contrast = calculateContrastRatio(1.0, bgLum);

      expect(contrast).toBeGreaterThan(10.0);
    });
  });

  describe('Color Clustering & Distance Thresholds', () => {
    it('clusters visually/numerically similar colors within maxDistance threshold', () => {
      const token1 = {
        id: '1',
        color: parseColor('rgb(139, 92, 246)'),
        frequency: 5,
        usageCount: { background: 5, text: 0, border: 0, cta: 0 },
        usages: ['background' as const],
        luminance: 0.2,
        isDark: true,
      };

      const token2 = {
        id: '2',
        color: parseColor('rgb(141, 94, 248)'), // RGB distance ~ 3.4
        frequency: 3,
        usageCount: { background: 3, text: 0, border: 0, cta: 0 },
        usages: ['background' as const],
        luminance: 0.2,
        isDark: true,
      };

      const clustered = clusterColorTokens([token1, token2], 15.0);
      expect(clustered.length).toBe(1);
      expect(clustered[0].frequency).toBe(8);
    });

    it('keeps materially different colors separate', () => {
      const tokenPurple = {
        id: '1',
        color: parseColor('rgb(139, 92, 246)'),
        frequency: 5,
        usageCount: { background: 5, text: 0, border: 0, cta: 0 },
        usages: ['background' as const],
        luminance: 0.2,
        isDark: true,
      };

      const tokenRed = {
        id: '2',
        color: parseColor('rgb(239, 68, 68)'),
        frequency: 5,
        usageCount: { background: 5, text: 0, border: 0, cta: 0 },
        usages: ['background' as const],
        luminance: 0.2,
        isDark: true,
      };

      const clustered = clusterColorTokens([tokenPurple, tokenRed], 15.0);
      expect(clustered.length).toBe(2);
    });
  });

  describe('Full Color System Normalization & Semantic Role Detection', () => {
    it('normalizes Light Theme fixture page correctly', () => {
      document.body.innerHTML = `
        <div id="root" style="background-color: rgb(248, 250, 252); color: rgb(15, 23, 42); padding: 20px;">
          <h1 style="color: rgb(15, 23, 42);">Light Theme Title</h1>
          <p style="color: rgb(100, 116, 139);">Muted text color paragraph</p>
          <div style="background-color: rgb(255, 255, 255); border: 1px solid rgb(226, 232, 240); padding: 16px;">
            <button role="button" style="background-color: rgb(99, 102, 241); color: rgb(255, 255, 255);">Primary CTA</button>
          </div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const colorNormalizer = new ColorNormalizer();
      const colorSystem = colorNormalizer.normalize(rawResult);

      expect(colorSystem.tokens.length).toBeGreaterThan(0);
      expect(colorSystem.roles.pageBackground).toBeDefined();
      expect(colorSystem.roles.primaryText).toBeDefined();
      expect(colorSystem.roles.secondaryText).toBeDefined();
      expect(colorSystem.roles.interactiveCTA).toBeDefined();
      expect(colorSystem.roles.border).toBeDefined();

      expect(colorSystem.roles.interactiveCTA?.color.hex).toBe('#6366f1');
    });

    it('normalizes Dark Theme fixture page correctly', () => {
      document.body.innerHTML = `
        <div id="root" style="background-color: rgb(15, 23, 42); color: rgb(248, 250, 252); padding: 20px;">
          <h1 style="color: rgb(248, 250, 252);">Dark Theme Title</h1>
          <p style="color: rgb(148, 163, 184);">Dark mode secondary text</p>
          <button role="button" style="background-color: rgb(139, 92, 246); color: rgb(255, 255, 255);">Action</button>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const colorNormalizer = new ColorNormalizer();
      const colorSystem = colorNormalizer.normalize(rawResult);

      expect(colorSystem.roles.pageBackground?.color.hex).toBe('#0f172a');
      expect(colorSystem.roles.primaryText?.color.hex).toBe('#f8fafc');
      expect(colorSystem.roles.interactiveCTA?.color.hex).toBe('#8b5cf6');
    });

    it('prevents false palette inflation from hidden elements', () => {
      document.body.innerHTML = `
        <div id="root" style="background-color: rgb(255, 255, 255);">
          <p style="color: rgb(0, 0, 0);">Visible paragraph</p>
          <div style="display: none; background-color: rgb(255, 0, 0); color: rgb(0, 255, 0);">Hidden Node</div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body, { includeHidden: true });

      const colorNormalizer = new ColorNormalizer({ includeHiddenElements: false });
      const colorSystem = colorNormalizer.normalize(rawResult);

      // Red (#ff0000) and Green (#00ff00) from hidden element should not appear in normalized tokens
      const hexes = colorSystem.tokens.map((t) => t.color.hex);
      expect(hexes).not.toContain('#ff0000');
      expect(hexes).not.toContain('#00ff00');
    });
  });
});
