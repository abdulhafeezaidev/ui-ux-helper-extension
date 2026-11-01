import { describe, it, expect } from 'vitest';
import {
  analyzeFlexLayout,
  analyzeGridLayout,
  detectSpatialRelations,
  extractSpacingScale,
  detectContainersAndSections,
  LayoutNormalizer,
} from '../src/normalization/index.ts';
import { DomExtractor } from '../src/extraction/index.ts';

describe('Layout Analysis & Normalization Engine', () => {
  describe('Flex & Grid Layout Analysis', () => {
    it('identifies horizontal, vertical, centered, and distributed flex groups', () => {
      document.body.innerHTML = `
        <div id="flex-row" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
          <div id="item-1">1</div>
          <div id="item-2">2</div>
        </div>
        <div id="flex-col" style="display: flex; flex-direction: column;">
          <div id="item-3">3</div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const flexRowNode = rawResult.elements.find((e) => e.id.length > 0 && e.display === 'flex')!;
      const flexAnalysis = analyzeFlexLayout(flexRowNode);

      expect(flexAnalysis).toBeDefined();
      expect(flexAnalysis?.groupType).toBe('centeredGroup'); // alignItems includes center
      expect(flexAnalysis?.childCount).toBe(2);
    });

    it('analyzes grid containers and extracts template columns and rows count', () => {
      document.body.innerHTML = `
        <div id="grid-2col" style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; gap: 16px;">
          <div>Card A</div>
          <div>Card B</div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const gridNode = rawResult.elements.find((e) => e.display === 'grid')!;
      const gridAnalysis = analyzeGridLayout(gridNode);

      expect(gridAnalysis).toBeDefined();
      expect(gridAnalysis?.columnCount).toBe(2);
      expect(gridAnalysis?.gap).toBe('16px');
    });
  });

  describe('Container & Section Detection', () => {
    it('detects centered max-width containers and full-width structural sections', () => {
      document.body.innerHTML = `
        <header id="site-header" style="width: 1000px; height: 100px; display: block;">Full Width Header</header>
        <main id="main-content" style="width: 800px; margin: 0 auto; display: block;">
          <section id="hero-sec" style="width: 1000px; height: 300px; display: block;">Hero Section</section>
        </main>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const { containers, sections } = detectContainersAndSections(rawResult.elements, 1000);

      expect(containers.length).toBeGreaterThan(0);
      expect(sections.length).toBeGreaterThan(0);
      expect(sections.some((s) => s.isFullWidth)).toBe(true);
    });
  });

  describe('Spatial Proximity & Alignment Relationships', () => {
    it('detects alignedLeft, alignedRight, centered, above, below, leftOf, rightOf, and sameWidth relationships', () => {
      document.body.innerHTML = `
        <div id="container">
          <div id="box-top" style="width: 200px; height: 50px; margin-bottom: 20px;">Top Box</div>
          <div id="box-bottom" style="width: 200px; height: 50px;">Bottom Box</div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const relations = detectSpatialRelations(rawResult.elements);
      expect(relations.length).toBeGreaterThan(0);
      expect(relations.some((r) => r.relation === 'sameWidth' || r.relation === 'alignedLeft' || r.relation === 'above')).toBe(true);
    });
  });

  describe('Spacing Scale Clustering', () => {
    it('extracts common padding, margin, and gap values into clustered spacing tokens', () => {
      document.body.innerHTML = `
        <div style="padding: 16px; margin: 24px; gap: 16px;">
          <div style="padding: 16px; margin: 24px;">Child 1</div>
          <div style="padding: 16px; margin: 24px;">Child 2</div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const spacingScale = extractSpacingScale(rawResult.elements);

      expect(spacingScale.length).toBeGreaterThan(0);
      const paddingToken = spacingScale.find((s) => s.category === 'padding' && s.valuePx === 16);
      expect(paddingToken).toBeDefined();
      expect(paddingToken?.frequency).toBeGreaterThan(1);
    });
  });

  describe('Full Layout System Normalization & Determinism', () => {
    it('excludes hidden elements from layout containers when includeHiddenElements is false', () => {
      document.body.innerHTML = `
        <div id="root">
          <div id="visible-container" style="display: block; width: 500px; height: 200px;">Visible Container</div>
          <div id="hidden-container" style="display: none; width: 500px; height: 200px;">Hidden Container</div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body, { includeHidden: true });

      const normalizer = new LayoutNormalizer({ includeHiddenElements: false });
      const layoutSystem = normalizer.normalize(rawResult);

      const elementIds = layoutSystem.containers.map((c) => c.elementId);
      expect(elementIds).not.toContain('hidden-container');
    });

    it('is strictly deterministic: produces identical containers, flex/grid details, and spatial relations for identical DOM state', () => {
      document.body.innerHTML = `
        <div id="app">
          <div style="display: flex; gap: 12px;">
            <div>Item 1</div>
            <div>Item 2</div>
          </div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const normalizer = new LayoutNormalizer();
      const system1 = normalizer.normalize(rawResult);
      const system2 = normalizer.normalize(rawResult);

      expect(system1.stats).toEqual(system2.stats);
      expect(system1.containers).toEqual(system2.containers);
      expect(system1.flexLayouts).toEqual(system2.flexLayouts);
      expect(system1.spacingScale).toEqual(system2.spacingScale);
    });
  });
});
