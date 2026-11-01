import { describe, it, expect, beforeEach } from 'vitest';
import { DomExtractor } from '../src/extraction/index.ts';
import { setupTestDom } from './fixtures/testDom.ts';

describe('DomExtractor - Deterministic DOM Inspection Engine', () => {
  let extractor: DomExtractor;

  beforeEach(() => {
    setupTestDom();
    extractor = new DomExtractor();
  });

  it('performs element discovery while filtering non-visual metadata nodes (script, style)', () => {
    const result = extractor.extract(document.body, { includeHidden: true });
    
    expect(result.totalExtracted).toBeGreaterThan(0);
    const tagNames = result.elements.map((e) => e.tagName);

    expect(tagNames).not.toContain('script');
    expect(tagNames).not.toContain('style');
    expect(tagNames).toContain('div');
    expect(tagNames).toContain('h1');
    expect(tagNames).toContain('p');
    expect(tagNames).toContain('button');
    expect(tagNames).toContain('span');
  });

  it('correctly assesses visibility state and supports visibility filtering', () => {
    const fullResult = extractor.extract(document.body, { includeHidden: true });
    const hiddenNode = fullResult.elements.find((e) => e.display === 'none');

    expect(hiddenNode).toBeDefined();
    expect(hiddenNode?.isVisible).toBe(false);

    const visibleOnlyResult = extractor.extract(document.body, { includeHidden: false });
    expect(visibleOnlyResult.elements.some((e) => e.display === 'none')).toBe(false);
    expect(visibleOnlyResult.totalExtracted).toBeLessThan(fullResult.totalExtracted);
  });

  it('builds accurate parent/child relationship hierarchy', () => {
    const result = extractor.extract(document.body);
    const rootNode = result.elements.find((e) => e.parentId === null || e.tagName === 'body');
    
    expect(rootNode).toBeDefined();

    const flexNode = result.elements.find((e) => e.childIds.length > 0 && e.display === 'flex');
    expect(flexNode).toBeDefined();

    const buttonNode = result.elements.find((e) => e.tagName === 'button');
    expect(buttonNode?.parentId).toBe(flexNode?.id);
    expect(flexNode?.childIds).toContain(buttonNode?.id);
  });

  it('extracts bounding geometry and positions correctly', () => {
    const result = extractor.extract(document.body);
    const buttonNode = result.elements.find((e) => e.tagName === 'button')!;

    expect(buttonNode).toBeDefined();
    expect(buttonNode.boundingRect).toHaveProperty('x');
    expect(buttonNode.boundingRect).toHaveProperty('y');
    expect(buttonNode.boundingRect).toHaveProperty('width');
    expect(buttonNode.boundingRect).toHaveProperty('height');
  });

  it('extracts computed colors and opacity', () => {
    const result = extractor.extract(document.body);
    const buttonNode = result.elements.find((e) => e.tagName === 'button')!;

    expect(buttonNode.backgroundColor).toBe('rgb(139, 92, 246)');
    expect(buttonNode.color).toBe('rgb(255, 255, 255)');
    expect(buttonNode.opacity).toBe(0.95);
  });

  it('extracts border widths, styles, colors, radius, and box-shadow', () => {
    const result = extractor.extract(document.body);
    const buttonNode = result.elements.find((e) => e.tagName === 'button')!;

    expect(buttonNode.borderWidths.top).toBe('2px');
    expect(buttonNode.borderStyles.top).toBe('solid');
    expect(buttonNode.borderColors.top).toBe('rgb(124, 58, 237)');
    expect(buttonNode.borderRadius.topLeft).toBe('6px');
    expect(buttonNode.boxShadow).toContain('rgba(0, 0, 0, 0.1)');
  });

  it('extracts padding, margin, and gap spacing properties', () => {
    const result = extractor.extract(document.body);
    const buttonNode = result.elements.find((e) => e.tagName === 'button')!;

    expect(buttonNode.padding.top).toBe('10px');
    expect(buttonNode.padding.right).toBe('18px');

    const flexNode = result.elements.find((e) => e.display === 'flex')!;
    expect(flexNode.gap.row).toBe('12px');
    expect(flexNode.gap.column).toBe('12px');
  });

  it('extracts flex and grid layout configuration properties', () => {
    const result = extractor.extract(document.body);
    const flexNode = result.elements.find((e) => e.display === 'flex')!;

    expect(flexNode.layoutProps.display).toBe('flex');
    expect(flexNode.layoutProps.flexDirection).toBe('row');
    expect(flexNode.layoutProps.justifyContent).toBe('space-between');

    const gridNode = result.elements.find((e) => e.display === 'grid')!;
    expect(gridNode.layoutProps.display).toBe('grid');
    expect(gridNode.layoutProps.gridTemplateColumns).toBe('1fr 1fr');
  });

  it('is strictly deterministic: produces identical IDs and structural tree for identical DOM state', () => {
    const result1 = extractor.extract(document.body);
    const result2 = extractor.extract(document.body);

    expect(result1.totalExtracted).toBe(result2.totalExtracted);
    expect(result1.elements.map((e) => e.id)).toEqual(result2.elements.map((e) => e.id));
    expect(result1.elements.map((e) => e.tagName)).toEqual(result2.elements.map((e) => e.tagName));
    expect(result1.elements.map((e) => e.childIds)).toEqual(result2.elements.map((e) => e.childIds));
  });

  it('captures text presence and direct/inherited text metadata', () => {
    const result = extractor.extract(document.body);
    const heading = result.elements.find((e) => e.tagName === 'h1')!;

    expect(heading.textMeta.hasText).toBe(true);
    expect(heading.textMeta.trimmedText).toContain('UI/UX Inspection Engine');
  });
});
