import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/domExtractor.ts';
import {
  ResponsiveTransitionEngine,
  buildResponsiveTransitionSpecification,
  TARGET_VIEWPORTS,
} from '../src/normalization/layout/responsiveTransitionEngine.ts';
import { exportResponsiveTransitionsJson } from '../src/output/clonePackage/responsiveTransitionJsonExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
import { exportReconstructionJson } from '../src/output/clonePackage/reconstructionJsonExporter.ts';
import { exportReadmeForAi } from '../src/output/clonePackage/readmeForAiExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

function createMockResponsivePage(): AnalyzePageResponseData {
  document.body.innerHTML = `
    <div id="app" style="width: 1440px; background-color: #050505; color: #ffffff;">
      <!-- Header with Navigation -->
      <header id="site-header" class="site-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 32px;">
        <div id="brand-logo">TitanTech</div>
        <nav id="desktop-nav" class="desktop-only" style="display: flex; gap: 24px;">
          <a href="/features">Features</a>
          <a href="/pricing">Pricing</a>
        </nav>
        <button id="mobile-toggle" class="hamburger-btn mobile-only" style="display: none;">Menu</button>
      </header>

      <!-- Hero Section with Split Row/Column Layout -->
      <section id="hero-banner" class="hero-container split-layout" style="display: flex; flex-direction: row; gap: 32px; padding: 64px 32px;">
        <div id="hero-text" style="flex: 1;">
          <h1 id="hero-title" style="font-size: 48px; font-weight: 800;">Autonomous Intelligence Platform</h1>
          <p id="hero-subtitle" style="font-size: 20px; color: #888888;">Deploy coding agents with deterministic fidelity.</p>
        </div>
        <div id="hero-image-wrap" style="flex: 1;">
          <img id="hero-img" src="https://example.com/hero.jpg" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;" />
        </div>
      </section>

      <!-- 4-Column Product Grid -->
      <section id="products-grid-section" class="product-grid grid-section" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 32px;">
        <div class="product-card" id="card-1"><h3>Alpha</h3></div>
        <div class="product-card" id="card-2"><h3>Beta</h3></div>
        <div class="product-card" id="card-3"><h3>Gamma</h3></div>
        <div class="product-card" id="card-4"><h3>Delta</h3></div>
      </section>

      <!-- Secondary Info with Desktop-Only Helper -->
      <div id="desktop-sidebar-helper" class="desktop-only hide-mobile" style="padding: 16px;">
        <span>Desktop Shortcuts</span>
      </div>
    </div>
  `;

  const extractor = new DomExtractor();
  const rawResult = extractor.extract(document.body, { includeHidden: true });

  return {
    status: 'completed',
    timestamp: Date.now(),
    title: 'TitanTech Platform - Responsive Transition Test',
    pageUrl: 'https://example.com/responsive-test',
    extractionResult: rawResult,
    typographySystem: {
      hierarchy: {
        h1: { fontSizePx: 48, lineHeightPx: 56, fontWeight: 800, fontFamily: 'Inter' },
        h2: { fontSizePx: 36, lineHeightPx: 44, fontWeight: 700, fontFamily: 'Inter' },
        body: { fontSizePx: 16, lineHeightPx: 24, fontWeight: 400, fontFamily: 'Inter' },
      },
    } as any,
  };
}

describe('Responsive Transition Engine (13_responsive.json)', () => {
  it('1. Captures layout snapshots for all 7 standard viewports (1440, 1280, 1024, 768, 640, 480, 375)', () => {
    const data = createMockResponsivePage();
    const engine = new ResponsiveTransitionEngine();
    const spec = engine.normalize(data);

    expect(spec.$schema).toBe('https://ui-ux-helper.internal/schemas/responsive-transitions-v1.json');
    expect(spec.version).toBe('1.0.0');
    expect(spec.summary.totalViewportsTested).toBe(7);
    expect(spec.summary.targetBreakpoints).toEqual([1440, 1280, 1024, 768, 640, 480, 375]);

    TARGET_VIEWPORTS.forEach((vp) => {
      const state = spec.viewports[vp];
      expect(state, `Missing state for viewport ${vp}`).toBeDefined();
      expect(state.viewport).toBe(vp);
      expect(state.gridColumns).toBeDefined();
      expect(state.gaps).toBeDefined();
      expect(state.fontScaling).toBeDefined();
      expect(state.spacingChanges).toBeDefined();
      expect(state.menuTransformation).toBeDefined();
      expect(state.imageResizing).toBeDefined();
    });
  });

  it('2. Constructs 6 transition graph edges connecting consecutive viewport pairs', () => {
    const data = createMockResponsivePage();
    const spec = buildResponsiveTransitionSpecification(data);

    expect(spec.transitionGraph.length).toBe(6);

    const expectedSteps = [
      { from: 1440, to: 1280 },
      { from: 1280, to: 1024 },
      { from: 1024, to: 768 },
      { from: 768, to: 640 },
      { from: 640, to: 480 },
      { from: 480, to: 375 },
    ];

    expectedSteps.forEach((step, idx) => {
      const edge = spec.transitionGraph[idx];
      expect(edge.fromViewport).toBe(step.from);
      expect(edge.toViewport).toBe(step.to);
      expect(edge.triggerBreakpoint).toBe(step.to);
      expect(typeof edge.humanSummary).toBe('string');
      expect(edge.humanSummary.length).toBeGreaterThan(0);
    });
  });

  it('3. Captures grid column step-downs from 4 columns (Desktop) to 2 columns (Tablet) to 1 column (Mobile)', () => {
    const data = createMockResponsivePage();
    const spec = buildResponsiveTransitionSpecification(data);

    // Desktop large (1440px)
    expect(spec.viewports[1440].gridColumns.productGrid).toBe(4);

    // Tablet landscape (1024px)
    expect(spec.viewports[1024].gridColumns.productGrid).toBe(3);

    // Tablet portrait (768px)
    expect(spec.viewports[768].gridColumns.productGrid).toBe(2);

    // Mobile small (375px)
    expect(spec.viewports[375].gridColumns.productGrid).toBe(1);

    // Verify transition edge deltas
    const edge1024to768 = spec.transitionGraph.find((t) => t.fromViewport === 1024 && t.toViewport === 768);
    expect(edge1024to768).toBeDefined();
    const productGridDelta = edge1024to768?.gridColumnTransitions.find((g) => g.containerId.includes('product-grid'));
    expect(productGridDelta).toBeDefined();
    expect(productGridDelta?.fromColumns).toBe(3);
    expect(productGridDelta?.toColumns).toBe(2);
    expect(productGridDelta?.delta).toBe(-1);
    expect(productGridDelta?.tailwindClass).toContain('grid-cols-2 md:grid-cols-3');
  });

  it('4. Computes fluid typography scaling and clamp() formulas across viewports', () => {
    const data = createMockResponsivePage();
    const spec = buildResponsiveTransitionSpecification(data);

    const h1Desktop = spec.viewports[1440].fontScaling.h1Px;
    const h1Tablet = spec.viewports[768].fontScaling.h1Px;
    const h1Mobile = spec.viewports[375].fontScaling.h1Px;

    expect(h1Desktop).toBeGreaterThan(h1Tablet);
    expect(h1Tablet).toBeGreaterThan(h1Mobile);

    const edge1440to1280 = spec.transitionGraph[0];
    const h1Transition = edge1440to1280.fontScalingTransitions.find((f) => f.role === 'h1');
    if (h1Transition) {
      expect(h1Transition.clampFormula).toContain('clamp(');
      expect(h1Transition.tailwindClass).toBeDefined();
    }
  });

  it('5. Detects menu transformation from horizontal-bar to drawer-hamburger at <= 768px', () => {
    const data = createMockResponsivePage();
    const spec = buildResponsiveTransitionSpecification(data);

    expect(spec.viewports[1440].menuTransformation.mode).toBe('horizontal-bar');
    expect(spec.viewports[1440].menuTransformation.isDrawer).toBe(false);

    expect(spec.viewports[768].menuTransformation.mode).toBe('drawer-hamburger');
    expect(spec.viewports[768].menuTransformation.isDrawer).toBe(true);
    expect(spec.viewports[768].menuTransformation.isHamburger).toBe(true);

    const edge1024to768 = spec.transitionGraph.find((t) => t.fromViewport === 1024 && t.toViewport === 768);
    expect(edge1024to768?.menuTransformations.length).toBeGreaterThan(0);
    const navCollapse = edge1024to768?.menuTransformations[0];
    expect(navCollapse?.isCollapsing).toBe(true);
  });

  it('6. Detects hidden element deltas and layout direction transitions', () => {
    const data = createMockResponsivePage();
    const spec = buildResponsiveTransitionSpecification(data);

    const edge1024to768 = spec.transitionGraph.find((t) => t.fromViewport === 1024 && t.toViewport === 768);
    expect(edge1024to768).toBeDefined();

    // Layout direction transition (flex-row -> flex-col)
    expect(edge1024to768?.layoutDirectionTransitions.length).toBeGreaterThan(0);
    const flexDir = edge1024to768?.layoutDirectionTransitions[0];
    expect(flexDir?.fromDirection).toBe('row');
    expect(flexDir?.toDirection).toBe('column');
    expect(flexDir?.tailwindClass).toContain('flex-col md:flex-row');
  });

  it('7. exportResponsiveTransitionsJson generates valid 13_responsive.json', () => {
    const data = createMockResponsivePage();
    const jsonStr = exportResponsiveTransitionsJson(data);

    expect(typeof jsonStr).toBe('string');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.$schema).toBeDefined();
    expect(parsed.summary.totalViewportsTested).toBe(7);
    expect(parsed.summary.totalTransitionEdges).toBe(6);
    expect(parsed.viewports['1440']).toBeDefined();
    expect(parsed.viewports['375']).toBeDefined();
    expect(Array.isArray(parsed.transitionGraph)).toBe(true);
    expect(Array.isArray(parsed.metadata.guidanceForAI)).toBe(true);
  });

  it('8. AI Clone Package (.zip) builder includes 13_responsive.json in canonical package and manifest', () => {
    const data = createMockResponsivePage();
    const pkg = buildAIClonePackage(data);

    expect(pkg.files['13_responsive.json']).toBeDefined();
    expect(pkg.files['responsive-transitions.json']).toBeDefined();
    expect(pkg.manifest.totalFiles).toBe(19);

    const reconstructionJson = exportReconstructionJson(data);
    const recParsed = JSON.parse(reconstructionJson);
    expect(recParsed.packageManifest.totalArtifacts).toBe(19);
    const hasResponsiveArtifact = recParsed.packageManifest.artifacts.some((a: any) => a.file === '13_responsive.json');
    expect(hasResponsiveArtifact).toBe(true);

    const readme = exportReadmeForAi(data);
    expect(readme).toContain('13_responsive.json');
    expect(readme).toContain('Step 3: Implement Page Layout & Responsive Transitions');
  });

  it('9. ArtifactExporter handles responsive-transitions and 13_responsive export format dispatch', () => {
    const data = createMockResponsivePage();
    const exporter = new ArtifactExporter();

    const res1 = exporter.export(data, 'responsive-transitions');
    expect(res1.format).toBe('responsive-transitions');
    expect(res1.exportedData).toBeDefined();
    const parsed1 = JSON.parse(res1.exportedData);
    expect(parsed1.transitionGraph).toBeDefined();

    const res2 = exporter.export(data, '13_responsive');
    expect(res2.format).toBe('13_responsive');
    expect(res2.exportedData).toBeDefined();
  });
});
