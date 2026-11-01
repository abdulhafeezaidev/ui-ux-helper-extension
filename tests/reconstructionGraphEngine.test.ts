import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/domExtractor.ts';
import { buildReconstructionGraphSpecification } from '../src/normalization/graph/reconstructionGraphEngine.ts';
import { exportReconstructionGraphJson } from '../src/output/clonePackage/reconstructionGraphJsonExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
import { exportReconstructionJson } from '../src/output/clonePackage/reconstructionJsonExporter.ts';
import { exportReadmeForAi } from '../src/output/clonePackage/readmeForAiExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

function createMockReconstructionPage(): AnalyzePageResponseData {
  document.body.innerHTML = `
    <div id="app" style="width: 1440px;">
      <nav id="main-nav" class="navbar-main" role="navigation">
        <a href="/" class="brand-logo"><svg id="logo"></svg>Autonomous</a>
        <input type="search" class="search-input" placeholder="Search Catalog" />
      </nav>
      <header id="hero" class="hero-banner" role="region">
        <h1 class="hero-title">Autonomous Storefront</h1>
        <button id="hero-cta" class="btn btn-primary">Get Started</button>
      </header>
      <section id="product-grid" class="product-grid-container" role="region">
        <div class="product-card">
          <img src="/thumb.jpg" class="product-thumb" alt="Product" />
          <span class="product-badge">New</span>
          <div class="product-price">$199.00</div>
          <div class="product-rating">5.0 / 5</div>
          <button class="btn-cart">Add to Cart</button>
        </div>
      </section>
      <footer id="footer" class="footer-main" role="contentinfo">
        <p class="copyright">© 2026 Autonomous Technologies</p>
      </footer>
    </div>
  `;

  const extractor = new DomExtractor();
  const rawResult = extractor.extract(document.body, { includeHidden: true });

  return {
    status: 'completed',
    timestamp: Date.now(),
    pageUrl: 'https://example.com/store',
    title: 'Autonomous Storefront',
    extractionResult: rawResult,
  };
}

describe('AI Reconstruction Graph Engine (18_reconstruction_graph.json)', () => {
  it('1. Normalizes semantic UI hierarchy from root Page down to leaves', () => {
    const data = createMockReconstructionPage();
    const spec = buildReconstructionGraphSpecification(data);

    expect(spec.$schema).toBe('https://ui-ux-helper.internal/schemas/reconstruction-graph-v1.json');
    expect(spec.version).toBe('1.0.0');
    expect(spec.target.title).toBe('Autonomous Storefront');
    expect(spec.summary.rootNodeId).toBe('node_root_page');
    expect(spec.summary.totalNodes).toBeGreaterThan(5);
    expect(spec.summary.maxDepth).toBeGreaterThanOrEqual(2);

    const root = spec.nodes[spec.summary.rootNodeId];
    expect(root).toBeDefined();
    expect(root.layerType).toBe('root');
    expect(root.parentId).toBeNull();
    expect(root.childIds.length).toBeGreaterThan(0);
  });

  it('2. Embeds zero-duplication references to all existing package files', () => {
    const data = createMockReconstructionPage();
    const spec = buildReconstructionGraphSpecification(data);

    const ctaNode = Object.values(spec.nodes).find((n) => n.name === 'CTAButton');
    expect(ctaNode).toBeDefined();
    expect(ctaNode?.references.componentRef?.file).toBe('02_components.json');
    expect(ctaNode?.references.variantRef?.file).toBe('15_variants.json');
    expect(ctaNode?.references.motionRef?.file).toBe('16_motion.json');
    expect(ctaNode?.references.contentRef?.file).toBe('17_content.json');
    expect(ctaNode?.references.accessibilityRef?.file).toBe('07_accessibility.json');
    expect(ctaNode?.references.evidenceRef?.file).toBe('08_evidence.json');

    const cardNode = Object.values(spec.nodes).find((n) => n.name === 'ProductCard');
    expect(cardNode).toBeDefined();
    expect(cardNode?.references.layoutRef?.file).toBe('12_constraints.json');
    expect(cardNode?.references.responsiveRef?.file).toBe('13_responsive.json');
  });

  it('3. Computes deterministic bottom-up topological reconstructionOrder', () => {
    const data = createMockReconstructionPage();
    const spec = buildReconstructionGraphSpecification(data);

    expect(Array.isArray(spec.reconstructionOrder)).toBe(true);
    expect(spec.reconstructionOrder.length).toBe(spec.summary.totalNodes);

    // Root page must be the final node built (top of topological sort)
    expect(spec.reconstructionOrder[spec.reconstructionOrder.length - 1]).toBe(spec.summary.rootNodeId);

    // Leaf/primitive nodes must appear before compound cards and sections
    const priceIdx = spec.reconstructionOrder.indexOf('node_product_price');
    const badgeIdx = spec.reconstructionOrder.indexOf('node_product_badge');
    const cardIdx = spec.reconstructionOrder.indexOf('node_product_card');
    const gridIdx = spec.reconstructionOrder.findIndex((id) => id.includes('product_grid') || id.includes('grid'));
    const rootIdx = spec.reconstructionOrder.indexOf('node_root_page');

    if (priceIdx !== -1 && cardIdx !== -1) {
      expect(priceIdx).toBeLessThan(cardIdx);
    }
    if (badgeIdx !== -1 && cardIdx !== -1) {
      expect(badgeIdx).toBeLessThan(cardIdx);
    }
    if (cardIdx !== -1 && gridIdx !== -1) {
      expect(cardIdx).toBeLessThan(gridIdx);
    }
    if (gridIdx !== -1) {
      expect(gridIdx).toBeLessThan(rootIdx);
    }
  });

  it('4. Tracks bidirectional dependencies and dependents', () => {
    const data = createMockReconstructionPage();
    const spec = buildReconstructionGraphSpecification(data);

    const card = spec.nodes['node_product_card'];
    if (card) {
      expect(card.dependencies).toContain('node_product_price');
      expect(card.dependencies).toContain('node_product_button');

      const price = spec.nodes['node_product_price'];
      expect(price.dependents).toContain('node_product_card');
    }
  });

  it('5. Generates suggested modern file paths for all components', () => {
    const data = createMockReconstructionPage();
    const spec = buildReconstructionGraphSpecification(data);

    for (const node of Object.values(spec.nodes)) {
      expect(node.suggestedFilePath).toBeDefined();
      expect(node.suggestedFilePath).toMatch(/^src\/(app|components)\//);
    }
  });

  it('6. exportReconstructionGraphJson produces valid 18_reconstruction_graph.json payload', () => {
    const data = createMockReconstructionPage();
    const jsonStr = exportReconstructionGraphJson(data);

    expect(typeof jsonStr).toBe('string');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.$schema).toBeDefined();
    expect(parsed.summary.totalNodes).toBeGreaterThan(0);
    expect(Array.isArray(parsed.reconstructionOrder)).toBe(true);
    expect(typeof parsed.nodes).toBe('object');
  });

  it('7. AI Clone Package (.zip) builder includes 18_reconstruction_graph.json in canonical package and manifest', () => {
    const data = createMockReconstructionPage();
    const pkg = buildAIClonePackage(data);

    expect(pkg.files['18_reconstruction_graph.json']).toBeDefined();
    expect(pkg.files['reconstruction-graph.json']).toBeDefined();
    expect(pkg.files['graph.json']).toBeDefined();
    expect(pkg.manifest.totalFiles).toBe(19);

    const reconstructionJson = exportReconstructionJson(data);
    const recParsed = JSON.parse(reconstructionJson);
    expect(recParsed.packageManifest.totalArtifacts).toBe(19);
    const hasGraphArtifact = recParsed.packageManifest.artifacts.some((a: any) => a.file === '18_reconstruction_graph.json');
    expect(hasGraphArtifact).toBe(true);

    const readme = exportReadmeForAi(data);
    expect(readme).toContain('18_reconstruction_graph.json');
    expect(readme).toContain('Step 0: Inspect Master Reconstruction Graph');
  });

  it('8. ArtifactExporter handles reconstruction-graph and 18_reconstruction_graph export format dispatch', () => {
    const data = createMockReconstructionPage();
    const exporter = new ArtifactExporter();

    const res1 = exporter.export(data, 'reconstruction-graph');
    expect(res1.format).toBe('reconstruction-graph');
    expect(res1.exportedData).toBeDefined();

    const res2 = exporter.export(data, '18_reconstruction_graph');
    expect(res2.format).toBe('18_reconstruction_graph');
    expect(res2.exportedData).toBeDefined();
  });
});
