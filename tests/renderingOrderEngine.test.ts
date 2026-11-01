import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/domExtractor.ts';
import { RenderingOrderEngine, buildRenderTree } from '../src/normalization/renderTree/renderingOrderEngine.ts';
import { exportRenderTreeJson } from '../src/output/clonePackage/renderTreeJsonExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
import { exportReconstructionJson } from '../src/output/clonePackage/reconstructionJsonExporter.ts';
import { exportReadmeForAi } from '../src/output/clonePackage/readmeForAiExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

function createMockPageWithComplexStacking(): AnalyzePageResponseData {
  document.body.innerHTML = `
    <div id="app-root" style="width: 1440px; background-color: #050505; color: #ffffff;">
      <!-- Sticky Navigation Header -->
      <header id="site-header" class="site-header" style="position: sticky; top: 0px; z-index: 50; height: 70px; background-color: #111111;">
        <div id="nav-brand" style="display: inline-block;">Zero Brand</div>
        <nav id="nav-menu" style="display: flex; gap: 20px;">
          <a href="/shop" id="nav-link-1">Shop</a>
          <div id="dropdown-parent" style="position: relative;">
            <button id="dropdown-trigger">Products</button>
            <div id="dropdown-menu" class="dropdown-menu" style="position: absolute; top: 100%; left: 0px; z-index: 60; background-color: #222222; width: 200px;">
              <a href="/watches" id="drop-item-1">Watches</a>
              <a href="/earbuds" id="drop-item-2">Earbuds</a>
            </div>
          </div>
        </nav>
      </header>

      <!-- Hero Section with Underlay, Text, and Badges -->
      <section id="hero-section" style="position: relative; overflow: hidden; padding: 60px 20px; background-color: #0a0a0a;">
        <div id="hero-bg-blur" style="position: absolute; top: 0px; left: 0px; z-index: -1; width: 100%; height: 100%; filter: blur(20px);"></div>
        <div id="hero-card" class="product-card" style="position: relative; border-radius: 12px; background-color: #1a1a1a; padding: 24px;">
          <span id="hero-badge" class="badge" style="position: absolute; top: 12px; right: 12px; z-index: 10; background-color: #ffd700; color: #000000;">SALE 50%</span>
          <h1 id="hero-title" style="font-size: 40px; font-weight: 800;">Flagship Smartwatch Pro</h1>
          <p id="hero-desc" style="color: #aaaaaa;">Experience the future of health tracking.</p>
        </div>
      </section>

      <!-- Transformed / Isolated Content Section -->
      <section id="features-section" style="padding: 40px 20px;">
        <div id="transformed-box" style="transform: translateY(-5px); background-color: #151515;">
          <p id="transformed-text">Smooth hardware sensors</p>
        </div>
        <div id="isolated-container" style="isolation: isolate; opacity: 0.95; background-color: #121212;">
          <span id="isolated-label">Isolated Stacking Context</span>
        </div>
      </section>

      <!-- Floating Action Button -->
      <button id="floating-cart-btn" class="floating-btn" style="position: fixed; bottom: 24px; right: 24px; z-index: 90; background-color: #ffd700; width: 56px; height: 56px;">
        Cart
      </button>

      <!-- Modal Overlay Dialog (Hidden or rendered in DOM) -->
      <div id="modal-backdrop" class="modal-overlay" role="dialog" style="position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; z-index: 100; background-color: rgba(0,0,0,0.8);">
        <div id="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 101; background-color: #202020; padding: 32px;">
          <h2 id="modal-title">Quick View</h2>
        </div>
      </div>
    </div>
  `;

  const extractor = new DomExtractor();
  const rawResult = extractor.extract(document.body, { includeHidden: true });

  return {
    status: 'completed',
    timestamp: Date.now(),
    title: 'Zero Brand - Rendering Order Test',
    pageUrl: 'https://example.com/render-test',
    extractionResult: rawResult,
  };
}

describe('Rendering Order Engine (11_render_tree.json)', () => {
  it('1. Extracts complete render tree specification with zero stacking inferences', () => {
    const data = createMockPageWithComplexStacking();
    const engine = new RenderingOrderEngine();
    const spec = engine.normalize(data);

    expect(spec.$schema).toBe('https://ui-ux-helper.internal/schemas/render-tree-v1.json');
    expect(spec.version).toBe('1.0.0');
    expect(spec.summary.totalNodes).toBeGreaterThan(10);
    expect(spec.summary.totalStackingContexts).toBeGreaterThan(0);
    expect(spec.renderTree.length).toBe(spec.summary.totalNodes);
    expect(spec.paintOrderSequence.length).toBe(spec.summary.totalNodes);
  });

  it('2. Correctly detects Stacking Context creation across modern CSS triggers', () => {
    const data = createMockPageWithComplexStacking();
    const spec = buildRenderTree(data);

    const headerNode = spec.renderTree.find((n) => {
      const el = data.extractionResult?.elements.find((e) => e.id === n.elementId);
      return el?.tagName === 'header' || el?.className?.includes('site-header');
    });

    expect(headerNode).toBeDefined();
    expect(headerNode?.createsStackingContext).toBe(true);
    expect(headerNode?.paintLayer).toBe('fixed-sticky');

    // Transformed element creates stacking context
    const transformNode = spec.renderTree.find((n) => {
      const el = data.extractionResult?.elements.find((e) => e.id === n.elementId);
      return el?.id === 'transformed-box' || (el?.transform && el.transform !== 'none');
    });
    if (transformNode) {
      expect(transformNode.createsStackingContext).toBe(true);
    }

    // Isolated container creates stacking context
    const isolatedNode = spec.renderTree.find((n) => {
      const el = data.extractionResult?.elements.find((e) => e.id === n.elementId);
      return el?.id === 'isolated-container' || el?.isolation === 'isolate';
    });
    if (isolatedNode) {
      expect(isolatedNode.createsStackingContext).toBe(true);
    }
  });

  it('3. Resolves positioned ancestors and clipping parents accurately', () => {
    const data = createMockPageWithComplexStacking();
    const spec = buildRenderTree(data);

    const elList = data.extractionResult?.elements || [];
    const heroBadgeEl = elList.find((e) => e.id === 'hero-badge' || e.className?.includes('badge'));
    const heroCardEl = elList.find((e) => e.id === 'hero-card' || e.className?.includes('product-card'));

    if (heroBadgeEl && heroCardEl) {
      const badgeNode = spec.renderTree.find((n) => n.elementId === heroBadgeEl.id);
      expect(badgeNode).toBeDefined();
      expect(badgeNode?.positionedAncestor).toBe(heroCardEl.id);
    }

    const heroSectionEl = elList.find((e) => e.id === 'hero-section');
    if (heroBadgeEl && heroSectionEl) {
      const badgeNode = spec.renderTree.find((n) => n.elementId === heroBadgeEl.id);
      expect(badgeNode?.clippingParent).toBe(heroSectionEl.id);
    }
  });

  it('4. Orders visual paint sequence according to CSS 2.1 Appendix E', () => {
    const data = createMockPageWithComplexStacking();
    const spec = buildRenderTree(data);

    const elList = data.extractionResult?.elements || [];
    const rootNode = spec.renderTree[0];
    expect(rootNode.renderOrder).toBe(1);

    // Sticky header has higher renderOrder than normal in-flow content
    const headerEl = elList.find((e) => e.tagName === 'header');
    const heroDescEl = elList.find((e) => e.id === 'hero-desc');

    if (headerEl && heroDescEl) {
      const headerNode = spec.renderTree.find((n) => n.elementId === headerEl.id);
      const descNode = spec.renderTree.find((n) => n.elementId === heroDescEl.id);
      expect(headerNode).toBeDefined();
      expect(descNode).toBeDefined();
      expect(headerNode!.renderOrder).toBeGreaterThan(descNode!.renderOrder);
    }

    // Modal overlay has top renderOrder
    const modalEl = elList.find((e) => e.id === 'modal-backdrop' || e.role === 'dialog');
    if (modalEl) {
      const modalNode = spec.renderTree.find((n) => n.elementId === modalEl.id);
      expect(modalNode).toBeDefined();
      expect(modalNode!.paintLayer).toBe('overlay');
      expect(modalNode!.renderOrder).toBeGreaterThan(1);
    }
  });

  it('5. Records full browser-observed evidence without guessing', () => {
    const data = createMockPageWithComplexStacking();
    const spec = buildRenderTree(data);

    for (const node of spec.renderTree) {
      expect(Array.isArray(node.browserEvidence)).toBe(true);
      expect(node.browserEvidence.length).toBeGreaterThanOrEqual(3);

      const hasPositionEvidence = node.browserEvidence.some((e) => e.startsWith('Computed position:'));
      const hasZIndexEvidence = node.browserEvidence.some((e) => e.startsWith('Computed zIndex:'));
      const hasStackingContextEvidence = node.browserEvidence.some((e) => e.startsWith('Enclosing stacking context:'));

      expect(hasPositionEvidence).toBe(true);
      expect(hasZIndexEvidence).toBe(true);
      expect(hasStackingContextEvidence).toBe(true);
    }
  });

  it('6. exportRenderTreeJson generates valid 11_render_tree.json', () => {
    const data = createMockPageWithComplexStacking();
    const jsonStr = exportRenderTreeJson(data);

    expect(typeof jsonStr).toBe('string');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.$schema).toBeDefined();
    expect(parsed.summary.totalNodes).toBeGreaterThan(0);
    expect(Array.isArray(parsed.stackingContextHierarchy)).toBe(true);
    expect(Array.isArray(parsed.renderTree)).toBe(true);
    expect(Array.isArray(parsed.paintOrderSequence)).toBe(true);
    expect(parsed.layerBreakdown).toBeDefined();
    expect(Array.isArray(parsed.metadata.guidanceForAI)).toBe(true);
    expect(parsed.metadata.guidanceForAI.length).toBeGreaterThan(0);
  });

  it('7. AI Clone Package (.zip) builder includes 11_render_tree.json in canonical package and manifest', () => {
    const data = createMockPageWithComplexStacking();
    const pkg = buildAIClonePackage(data);

    expect(pkg.files['11_render_tree.json']).toBeDefined();
    expect(pkg.files['render-tree.json']).toBeDefined();
    expect(pkg.manifest.totalFiles).toBe(19);

    const reconstructionJson = exportReconstructionJson(data);
    const recParsed = JSON.parse(reconstructionJson);
    expect(recParsed.packageManifest.totalArtifacts).toBe(19);
    const hasRenderTreeArtifact = recParsed.packageManifest.artifacts.some((a: any) => a.file === '11_render_tree.json');
    expect(hasRenderTreeArtifact).toBe(true);

    const readme = exportReadmeForAi(data);
    expect(readme).toContain('11_render_tree.json');
    expect(readme).toContain('Step 4: Apply Visual Stacking & Layer Elevations');
  });

  it('8. ArtifactExporter handles render-tree and 11_render_tree export format dispatch', () => {
    const data = createMockPageWithComplexStacking();
    const exporter = new ArtifactExporter();

    const res1 = exporter.export(data, 'render-tree');
    expect(res1.format).toBe('render-tree');
    expect(res1.exportedData).toBeDefined();
    const parsed1 = JSON.parse(res1.exportedData);
    expect(parsed1.renderTree).toBeDefined();

    const res2 = exporter.export(data, '11_render_tree');
    expect(res2.format).toBe('11_render_tree');
    expect(res2.exportedData).toBeDefined();
  });
});
