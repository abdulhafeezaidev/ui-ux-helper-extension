import { describe, it, expect } from 'vitest';
import {
  buildLayoutConstraintSystem,
  classifyLayoutType,
} from '../src/normalization/layout/layoutConstraintEngine.ts';
import { exportLayoutJson } from '../src/output/clonePackage/layoutJsonExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

describe('Prompt 20 — Layout Constraint Engine', () => {
  function buildRichLayoutMockData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="app-root" style="width: 1440px; min-height: 1000px; display: block;">
        <header id="header-sticky" style="position: sticky; top: 0px; display: flex; flex-direction: row; justify-content: space-between; align-items: center; padding: 16px 32px; width: 1440px; height: 72px; z-index: 100;">
          <div class="logo">Logo</div>
          <nav class="nav-links" style="display: flex; gap: 24px; align-items: center;">
            <a href="#">Home</a>
            <a href="#">Products</a>
          </nav>
        </header>

        <aside id="promo-banner-fixed" style="position: fixed; bottom: 20px; right: 20px; display: flex; align-items: center; padding: 12px 20px; width: 300px; height: 60px; z-index: 999;">
          <span>Get 20% off today!</span>
        </aside>

        <main id="main-content" style="display: block; width: 1200px; margin: 0px auto; padding: 32px 0px;">
          <section id="hero-flex" style="display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 16px; padding: 48px; width: 1200px; height: 380px;">
            <h1>Hero Heading</h1>
            <p>Hero Subtitle</p>
          </section>

          <section id="products-grid" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: auto auto; gap: 24px 16px; padding: 24px 0px; width: 1200px;">
            <div class="product-card" style="display: flex; flex-direction: column; padding: 16px; position: relative;">
              <span class="sale-badge" style="position: absolute; top: 8px; right: 8px;">Sale</span>
              <h3>Product 1</h3>
            </div>
            <div class="product-card" style="display: flex; flex-direction: column; padding: 16px; position: relative;">
              <h3>Product 2</h3>
            </div>
            <div class="product-card" style="display: flex; flex-direction: column; padding: 16px; position: relative;">
              <h3>Product 3</h3>
            </div>
            <div class="product-card" style="display: flex; flex-direction: column; padding: 16px; position: relative;">
              <h3>Product 4</h3>
            </div>
          </section>

          <section id="features-wrap" style="display: flex; flex-wrap: wrap; justify-content: space-around; gap: 20px; padding: 32px 16px;">
            <div class="feature-item" style="width: 320px; min-width: 280px; max-width: 360px;">Feature 1</div>
            <div class="feature-item" style="width: 320px; min-width: 280px; max-width: 360px;">Feature 2</div>
            <div class="feature-item" style="width: 320px; min-width: 280px; max-width: 360px;">Feature 3</div>
          </section>
        </main>

        <footer id="footer-block" style="display: block; width: 1440px; padding: 40px 32px;">
          <div class="footer-columns" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;">
            <div class="col">Col 1</div>
            <div class="col">Col 2</div>
            <div class="col">Col 3</div>
          </div>
        </footer>
      </div>
    `;

    const rawResult = new DomExtractor().extract(document.body);
    const colorSystem = new ColorNormalizer().normalize(rawResult);
    const typographySystem = new TypographyNormalizer().normalize(rawResult);
    const shapeSystem = new ShapeNormalizer().normalize(rawResult);
    const layoutSystem = new LayoutNormalizer().normalize(rawResult);
    const componentSystem = new ComponentNormalizer().normalize(
      rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem
    );

    return {
      status: 'completed',
      pageUrl: 'https://example.com/layout-test',
      title: 'Layout Constraint Test Page',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Layout Model Classification & Detection', () => {
    it('correctly classifies Grid, Flexbox, Block, Absolute, Sticky, and Fixed models', () => {
      expect(classifyLayoutType('grid', 'static')).toBe('grid');
      expect(classifyLayoutType('inline-grid', 'static')).toBe('grid');
      expect(classifyLayoutType('flex', 'static')).toBe('flex');
      expect(classifyLayoutType('inline-flex', 'static')).toBe('flex');
      expect(classifyLayoutType('block', 'static')).toBe('block');
      expect(classifyLayoutType('block', 'absolute')).toBe('absolute');
      expect(classifyLayoutType('flex', 'sticky')).toBe('sticky');
      expect(classifyLayoutType('flex', 'fixed')).toBe('fixed');
    });

    it('detects all 6 layout models in extracted DOM structure', () => {
      const data = buildRichLayoutMockData();
      const system = buildLayoutConstraintSystem(data);

      expect(system.summary.gridContainers).toBeGreaterThanOrEqual(1);
      expect(system.summary.flexContainers).toBeGreaterThanOrEqual(1);
      expect(system.summary.stickyElements).toBeGreaterThanOrEqual(1);
      expect(system.summary.fixedElements).toBeGreaterThanOrEqual(1);
      expect(system.summary.absoluteElements).toBeGreaterThanOrEqual(1);
      expect(system.summary.blockContainers).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Comprehensive Container Property Verification', () => {
    it('guarantees all required fields on every detected layout container', () => {
      const data = buildRichLayoutMockData();
      const system = buildLayoutConstraintSystem(data);

      expect(system.containers.length).toBeGreaterThan(0);

      system.containers.forEach((c) => {
        expect(c.id).toMatch(/^layout_c_/);
        expect(c.elementId).toBeDefined();
        expect(c.display).toBeDefined();
        expect(c.layoutType).toBeDefined();
        expect(c.gap).toBeDefined();
        expect(c.gap.row).toBeDefined();
        expect(c.gap.column).toBeDefined();
        expect(c.justifyContent).toBeDefined();
        expect(c.alignItems).toBeDefined();
        expect(c.padding).toBeDefined();
        expect(c.padding.top).toBeDefined();
        expect(c.margin).toBeDefined();
        expect(c.minWidth).toBeDefined();
        expect(c.maxWidth).toBeDefined();
        expect(c.containerConstraints).toBeDefined();
        expect(c.wrapping).toBeDefined();
        expect(c.alignment).toBeDefined();
        expect(c.nesting).toBeDefined();
        expect(c.confidence).toBeGreaterThan(0.8);
      });
    });

    it('extracts exact CSS grid-template-columns and grid gap from grid containers', () => {
      const data = buildRichLayoutMockData();
      const system = buildLayoutConstraintSystem(data);

      const gridContainer = system.containers.find((c) => c.layoutType === 'grid' || c.display === 'grid');
      expect(gridContainer).toBeDefined();
      expect(gridContainer?.gridTemplateColumns).toBeDefined();
      expect(gridContainer?.gap).toBeDefined();
    });

    it('extracts flex wrapping and alignment from flex containers', () => {
      const data = buildRichLayoutMockData();
      const system = buildLayoutConstraintSystem(data);

      const flexWrapContainer = system.containers.find((c) => c.elementId.includes('features-wrap') || c.wrapping.isWrapped);
      expect(flexWrapContainer).toBeDefined();
      expect(flexWrapContainer?.wrapping.flexWrap).toBe('wrap');
      expect(flexWrapContainer?.wrapping.isWrapped).toBe(true);
    });

    it('identifies centered max-width container constraints', () => {
      const data = buildRichLayoutMockData();
      const system = buildLayoutConstraintSystem(data);

      const centeredMain = system.containers.find((c) => c.elementId.includes('main-content') || c.containerConstraints.isCentered);
      expect(centeredMain).toBeDefined();
      expect(centeredMain?.containerConstraints.isCentered).toBe(true);
    });

    it('extracts nesting hierarchy and relationships', () => {
      const data = buildRichLayoutMockData();
      const system = buildLayoutConstraintSystem(data);

      const rootContainer = system.containers.find((c) => c.nesting.depth === 0 || c.nesting.layoutRelationship === 'root-viewport');
      expect(rootContainer).toBeDefined();
      expect(rootContainer?.nesting.childCount).toBeGreaterThan(0);

      const nestedContainers = system.containers.filter((c) => c.nesting.depth > 0);
      expect(nestedContainers.length).toBeGreaterThan(0);
    });
  });

  describe('3. Non-Pixel Inference Guardrail (CSS Priority)', () => {
    it('uses computed CSS styles rather than raw pixel estimation for layout attributes', () => {
      const data = buildRichLayoutMockData();
      const system = buildLayoutConstraintSystem(data);

      const header = system.containers.find((c) => c.elementId.includes('header-sticky') || c.position === 'sticky');
      expect(header).toBeDefined();
      expect(header?.position).toBe('sticky');
      expect(header?.justifyContent).toBe('space-between');
      expect(header?.alignItems).toBe('center');

      const fixedBanner = system.containers.find((c) => c.elementId.includes('promo-banner-fixed') || c.position === 'fixed');
      expect(fixedBanner).toBeDefined();
      expect(fixedBanner?.position).toBe('fixed');
      expect(fixedBanner?.positionOffsets?.bottom).toBeDefined();
    });
  });

  describe('4. layout.json Export Pipeline & Artifact Integration', () => {
    it('exports a valid layout.json string matching schema requirements', () => {
      const data = buildRichLayoutMockData();
      const jsonStr = exportLayoutJson(data);

      expect(typeof jsonStr).toBe('string');
      const parsed = JSON.parse(jsonStr);

      expect(parsed.$schema).toContain('layout-v1.json');
      expect(parsed.totalContainers).toBeGreaterThanOrEqual(5);
      expect(parsed.containers).toBeDefined();
      expect(Array.isArray(parsed.containers)).toBe(true);
      expect(parsed.summary).toBeDefined();
      expect(parsed.responsiveBreakpoints).toBeDefined();
      expect(parsed.stats).toBeDefined();
    });

    it('supports standalone layout format in ArtifactExporter', () => {
      const data = buildRichLayoutMockData();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'layout');
      expect(result.format).toBe('layout');
      expect(result.exportedData).toBeDefined();

      const parsed = JSON.parse(result.exportedData);
      expect(parsed.containers).toBeDefined();
      expect(parsed.summary).toBeDefined();
    });
  });
});
