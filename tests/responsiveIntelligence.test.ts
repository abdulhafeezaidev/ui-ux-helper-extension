import { describe, it, expect } from 'vitest';
import {
  buildResponsiveIntelligenceSystem,
  STANDARD_BREAKPOINTS,
} from '../src/normalization/layout/responsiveIntelligenceEngine.ts';
import { exportResponsiveJson } from '../src/output/clonePackage/responsiveJsonExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
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

describe('Prompt 21 — Responsive Intelligence Engine', () => {
  function buildResponsiveMockData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="root" style="width: 1440px; display: block;">
        <header id="header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 32px;">
          <div class="logo">StoreLogo</div>
          <nav class="nav-links" id="main-nav" style="display: flex; gap: 24px;">
            <a href="#">Shop</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
          </nav>
          <button id="mobile-hamburger" class="hamburger-btn drawer-toggle show-mobile" style="display: none;">Menu</button>
        </header>

        <aside id="desktop-promo" class="desktop-only hide-mobile" style="padding: 8px 16px; background-color: #f3f4f6;">
          <span>Free worldwide shipping on all orders over $100</span>
        </aside>

        <main id="main">
          <section id="hero" class="hero-section" style="display: flex; flex-direction: row; gap: 32px; padding: 48px 32px;">
            <div class="hero-text" style="flex: 1;">
              <h1 style="font-size: 40px; font-weight: 700;">Summer Collection 2026</h1>
              <p style="font-size: 16px;">Explore the latest premium apparel designed for comfort.</p>
              <button class="cta-btn">Shop Now</button>
            </div>
            <div id="hero-media-wrap" class="hero-media" style="flex: 1;">
              <img src="/hero.jpg" alt="Hero" style="width: 100%; height: auto; object-fit: cover;" />
            </div>
          </section>

          <section id="catalog" class="product-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 32px;">
            <div class="product-card" style="display: flex; flex-direction: column;">
              <img src="/p1.jpg" alt="P1" style="width: 100%; aspect-ratio: 3/4; object-fit: cover;" />
              <h3>Summer Tee</h3>
              <span>$39.00</span>
            </div>
            <div class="product-card" style="display: flex; flex-direction: column;">
              <img src="/p2.jpg" alt="P2" style="width: 100%; aspect-ratio: 3/4; object-fit: cover;" />
              <h3>Linen Shirt</h3>
              <span>$59.00</span>
            </div>
            <div class="product-card" style="display: flex; flex-direction: column;">
              <img src="/p3.jpg" alt="P3" style="width: 100%; aspect-ratio: 3/4; object-fit: cover;" />
              <h3>Chino Shorts</h3>
              <span>$49.00</span>
            </div>
            <div class="product-card" style="display: flex; flex-direction: column;">
              <img src="/p4.jpg" alt="P4" style="width: 100%; aspect-ratio: 3/4; object-fit: cover;" />
              <h3>Canvas Cap</h3>
              <span>$29.00</span>
            </div>
          </section>
        </main>

        <footer id="footer" style="padding: 48px 32px;">
          <div class="footer-columns" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px;">
            <div class="col">Shop</div>
            <div class="col">Support</div>
            <div class="col">Company</div>
            <div class="col">Legal</div>
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
      pageUrl: 'https://example.com/store',
      title: 'Responsive Storefront',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Standard Breakpoint Multi-Viewport Analysis', () => {
    it('analyzes the page across all 8 required breakpoints', () => {
      const data = buildResponsiveMockData();
      const system = buildResponsiveIntelligenceSystem(data);

      expect(system.testedBreakpoints).toEqual([1920, 1600, 1440, 1280, 1024, 768, 480, 375]);

      STANDARD_BREAKPOINTS.forEach((bp) => {
        const snapshot = system.breakpointSnapshots[bp];
        expect(snapshot).toBeDefined();
        expect(snapshot.width).toBe(bp);
        expect(snapshot.name).toBeDefined();
        expect(snapshot.containerWidth).toBeDefined();
        expect(snapshot.containerPadding).toBeDefined();
        expect(snapshot.gridColumns).toBeDefined();
        expect(snapshot.navigation).toBeDefined();
        expect(snapshot.typographyScale).toBeDefined();
        expect(snapshot.spacingScale).toBeDefined();
      });
    });

    it('adapts container width and grid columns proportionally across viewports', () => {
      const data = buildResponsiveMockData();
      const system = buildResponsiveIntelligenceSystem(data);

      // Desktop
      expect(system.breakpointSnapshots[1440].gridColumns.productGrid).toBe(4);
      expect(system.breakpointSnapshots[1440].containerWidth).toBe('1200px');

      // Tablet
      expect(system.breakpointSnapshots[768].gridColumns.productGrid).toBe(2);
      expect(system.breakpointSnapshots[768].containerWidth).toBe('720px');

      // Mobile
      expect(system.breakpointSnapshots[375].gridColumns.productGrid).toBe(1);
      expect(system.breakpointSnapshots[375].containerWidth).toBe('100%');
    });
  });

  describe('2. Responsive Transformation Detection', () => {
    it('detects layout changes (flex direction collapses and grid collapses)', () => {
      const data = buildResponsiveMockData();
      const system = buildResponsiveIntelligenceSystem(data);

      expect(system.transformations.layoutChanges.length).toBeGreaterThan(0);
      const heroLayoutChange = system.transformations.layoutChanges.find((l) => l.elementId.includes('hero'));
      expect(heroLayoutChange).toBeDefined();
      expect(heroLayoutChange?.desktopValue).toBe('row');
      expect(heroLayoutChange?.mobileValue).toBe('column');
    });

    it('detects hidden elements on mobile and desktop', () => {
      const data = buildResponsiveMockData();
      const system = buildResponsiveIntelligenceSystem(data);

      expect(system.transformations.hiddenElements.length).toBeGreaterThan(0);

      // Mobile hidden element (desktop promo)
      const mobileHidden = system.transformations.hiddenElements.find((h) => h.hiddenAt.includes('mobile'));
      expect(mobileHidden).toBeDefined();

      // Desktop hidden element (mobile hamburger)
      const desktopHidden = system.transformations.hiddenElements.find((h) => h.hiddenAt.includes('desktop'));
      expect(desktopHidden).toBeDefined();
    });

    it('detects reordered sections for mobile optimization', () => {
      const data = buildResponsiveMockData();
      const system = buildResponsiveIntelligenceSystem(data);

      expect(system.transformations.reorderedSections.length).toBeGreaterThan(0);
      const heroReorder = system.transformations.reorderedSections.find((r) => r.elementId.includes('hero-media'));
      expect(heroReorder).toBeDefined();
    });

    it('derives fluid font scaling formulas and breakpoint typography values', () => {
      const data = buildResponsiveMockData();
      const system = buildResponsiveIntelligenceSystem(data);

      expect(system.transformations.fontScaling.length).toBeGreaterThan(0);
      const h1Scale = system.transformations.fontScaling.find((f) => f.role === 'h1');
      expect(h1Scale).toBeDefined();
      expect(h1Scale?.desktopPx).toBeGreaterThan(h1Scale!.mobilePx);
      expect(h1Scale?.clampFormula).toContain('clamp(');
    });

    it('derives fluid spacing scaling formulas for page padding and section gaps', () => {
      const data = buildResponsiveMockData();
      const system = buildResponsiveIntelligenceSystem(data);

      expect(system.transformations.spacingScaling.length).toBeGreaterThan(0);
      const paddingScale = system.transformations.spacingScaling.find((s) => s.role === 'page-padding');
      expect(paddingScale).toBeDefined();
      expect(paddingScale?.desktopPx).toBeGreaterThan(paddingScale!.mobilePx);
    });

    it('detects navigation transformation from horizontal bar to mobile drawer', () => {
      const data = buildResponsiveMockData();
      const system = buildResponsiveIntelligenceSystem(data);

      expect(system.transformations.navigationTransformation.desktopMode).toBe('horizontal-bar');
      expect(system.transformations.navigationTransformation.mobileMode).toBe('drawer-hamburger');
      expect(system.breakpointSnapshots[375].navigation.isDrawer).toBe(true);
      expect(system.breakpointSnapshots[1440].navigation.isDrawer).toBe(false);
    });
  });

  describe('3. Regression Guardrail: Desktop and Mobile Invariance', () => {
    it('guarantees that desktop and mobile layouts map to the exact same component tree', () => {
      const data = buildResponsiveMockData();
      const system = buildResponsiveIntelligenceSystem(data);

      expect(system.componentTreeMapping.isInvariantAcrossBreakpoints).toBe(true);
      expect(system.componentTreeMapping.totalSharedNodes).toBeGreaterThan(0);
      expect(system.componentTreeMapping.rootNodeId).toBeDefined();
      expect(system.componentTreeMapping.guarantee).toContain('100% component identity invariance');
    });
  });

  describe('4. Export Pipeline Integration', () => {
    it('exports a valid responsive.json artifact matching schema', () => {
      const data = buildResponsiveMockData();
      const jsonStr = exportResponsiveJson(data);

      expect(typeof jsonStr).toBe('string');
      const parsed = JSON.parse(jsonStr);

      expect(parsed.$schema).toContain('responsive-v1.json');
      expect(parsed.testedBreakpoints).toHaveLength(8);
      expect(parsed.breakpointSnapshots['375']).toBeDefined();
      expect(parsed.breakpointSnapshots['1440']).toBeDefined();
      expect(parsed.transformations).toBeDefined();
    });

    it('includes responsive.json inside the AI Clone Package (.zip)', () => {
      const data = buildResponsiveMockData();
      const pkg = buildAIClonePackage(data);

      expect(pkg.files['responsive.json']).toBeDefined();
      expect(pkg.manifest.files.some((f) => f.path === 'responsive.json')).toBe(true);
    });

    it('supports standalone responsive format in ArtifactExporter', () => {
      const data = buildResponsiveMockData();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'responsive');
      expect(result.format).toBe('responsive');
      expect(result.exportedData).toBeDefined();

      const parsed = JSON.parse(result.exportedData);
      expect(parsed.testedBreakpoints).toBeDefined();
    });
  });
});
