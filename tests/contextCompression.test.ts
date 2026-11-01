import { describe, it, expect } from 'vitest';
import {
  buildSharedObjectRegistry,
} from '../src/normalization/compression/sharedRegistryEngine.ts';
import { exportSharedRegistryJson } from '../src/output/clonePackage/sharedRegistryJsonExporter.ts';
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

describe('Prompt 24 — Context Compression Without Fidelity Loss', () => {
  function buildRichStoreMockData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="root" style="width: 1440px; background-color: #f8fafc; font-family: 'Inter', sans-serif;">
        <!-- Header -->
        <header id="header" class="site-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background-color: #ffffff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 50;">
          <div id="logo" style="font-size: 24px; font-weight: 700; color: #0f172a;">STOREFRONT</div>
          <nav id="nav" style="display: flex; gap: 24px;">
            <a href="/shop" class="nav-item" style="color: #334155; text-decoration: none;">Shop</a>
            <a href="/categories" class="nav-item" style="color: #334155; text-decoration: none;">Categories</a>
            <a href="/deals" class="nav-item" style="color: #334155; text-decoration: none;">Deals</a>
          </nav>
          <div id="actions" style="display: flex; gap: 16px;">
            <button id="search-btn" aria-label="Search" style="padding: 8px 16px; background-color: #f1f5f9; border-radius: 6px;">Search</button>
            <button id="cart-btn" aria-label="Shopping Cart" style="padding: 8px 16px; background-color: #2563eb; color: #ffffff; border-radius: 6px;">Cart (2)</button>
          </div>
        </header>

        <!-- Hero Section -->
        <section id="hero" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px; text-align: center; background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);">
          <span id="hero-badge" class="badge" style="padding: 4px 12px; background-color: #dbeafe; color: #1e40af; border-radius: 9999px; font-size: 14px; margin-bottom: 16px;">SUMMER COLLECTION 2026</span>
          <h1 id="hero-title" style="font-size: 48px; font-weight: 800; color: #0f172a; line-height: 1.1; margin-bottom: 16px;">Elevate Your Digital Experience</h1>
          <p id="hero-desc" style="font-size: 18px; color: #64748b; max-width: 640px; margin-bottom: 32px;">Discover handcrafted minimalist products engineered for exceptional quality and comfort.</p>
          <div style="display: flex; gap: 16px;">
            <a href="/explore" id="hero-cta" style="padding: 14px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; font-weight: 600; text-decoration: none;">Explore Collection</a>
            <a href="/lookbook" id="hero-secondary" style="padding: 14px 28px; background-color: #ffffff; border: 1px solid #cbd5e1; color: #0f172a; border-radius: 8px; font-weight: 600; text-decoration: none;">View Lookbook</a>
          </div>
        </section>

        <!-- Featured Products Grid -->
        <section id="featured-products" style="padding: 64px 32px; max-width: 1280px; margin: 0 auto;">
          <h2 style="font-size: 32px; font-weight: 700; color: #0f172a; margin-bottom: 32px;">Featured Products</h2>
          <div id="product-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
            ${[1, 2, 3, 4]
              .map(
                (i) => `
              <article class="product-card" id="card-${i}" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; padding: 16px; display: flex; flex-direction: column;">
                <img src="/images/product-${i}.jpg" alt="Product ${i}" class="product-img" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; margin-bottom: 12px;" />
                <span class="product-badge" style="padding: 2px 8px; background-color: #fee2e2; color: #991b1b; border-radius: 4px; font-size: 12px; align-self: flex-start; margin-bottom: 8px;">SALE</span>
                <h3 class="product-title" style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">Minimalist Leather Bag ${i}</h3>
                <span class="product-price" style="font-size: 20px; font-weight: 700; color: #2563eb; margin-bottom: 12px;">$129.00</span>
                <button class="add-to-cart-btn" style="padding: 10px; background-color: #0f172a; color: #ffffff; border-radius: 6px; font-weight: 500; cursor: pointer; margin-top: auto;">Add to Cart</button>
              </article>
            `
              )
              .join('')}
          </div>
        </section>

        <!-- Newsletter Section -->
        <section id="newsletter" style="padding: 48px 32px; background-color: #1e293b; color: #ffffff; text-align: center;">
          <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 12px;">Join Our Newsletter</h2>
          <p style="color: #94a3b8; margin-bottom: 24px;">Get weekly updates on new arrivals and exclusive member discounts.</p>
          <form style="display: flex; justify-content: center; gap: 12px; max-width: 480px; margin: 0 auto;">
            <input type="email" placeholder="Enter your email" style="padding: 12px 16px; border-radius: 6px; border: none; flex: 1;" />
            <button type="submit" style="padding: 12px 24px; background-color: #2563eb; color: #ffffff; border-radius: 6px; font-weight: 600; border: none;">Subscribe</button>
          </form>
        </section>

        <!-- Footer -->
        <footer id="footer" style="padding: 48px 32px; background-color: #0f172a; color: #94a3b8;">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; max-width: 1280px; margin: 0 auto;">
            <div class="footer-col">
              <h4 style="color: #ffffff; font-weight: 600; margin-bottom: 12px;">Shop</h4>
              <p>Men's Apparel</p>
              <p>Women's Apparel</p>
              <p>Accessories</p>
            </div>
            <div class="footer-col">
              <h4 style="color: #ffffff; font-weight: 600; margin-bottom: 12px;">Support</h4>
              <p>Contact Us</p>
              <p>Shipping & Returns</p>
              <p>FAQ</p>
            </div>
            <div class="footer-col">
              <h4 style="color: #ffffff; font-weight: 600; margin-bottom: 12px;">Company</h4>
              <p>About Us</p>
              <p>Careers</p>
              <p>Sustainability</p>
            </div>
            <div class="footer-col">
              <h4 style="color: #ffffff; font-weight: 600; margin-bottom: 12px;">Follow</h4>
              <p>Instagram</p>
              <p>Twitter</p>
              <p>YouTube</p>
            </div>
          </div>
        </footer>
      </div>
    `;

    const extractor = new DomExtractor();
    const rawResult = extractor.extract();

    const colorNormalizer = new ColorNormalizer();
    const typographyNormalizer = new TypographyNormalizer();
    const shapeNormalizer = new ShapeNormalizer();
    const layoutNormalizer = new LayoutNormalizer();
    const componentNormalizer = new ComponentNormalizer();

    const colors = colorNormalizer.normalize(rawResult);
    const typography = typographyNormalizer.normalize(rawResult);
    const shapes = shapeNormalizer.normalize(rawResult);
    const layout = layoutNormalizer.normalize(rawResult);
    const components = componentNormalizer.normalize(rawResult, colors, typography, shapes, layout);

    return {
      status: 'completed',
      timestamp: Date.now(),
      title: 'Minimalist Storefront Platform',
      pageUrl: 'https://storefront.example.com',
      extractionResult: rawResult,
      colorSystem: colors,
      typographySystem: typography,
      shapeSystem: shapes,
      layoutSystem: layout,
      componentSystem: components,
    };
  }

  describe('1. Global Shared Object Registry & Component Deduplication', () => {
    it('creates global registry and registers repeated components as reusable objects', () => {
      const data = buildRichStoreMockData();
      const registry = buildSharedObjectRegistry(data);

      expect(registry).toBeDefined();
      expect(registry.version).toBe('2.0.0');
      expect(registry.components).toBeDefined();

      // Verify ProductCard or Button registration
      const compKeys = Object.keys(registry.components);
      expect(compKeys.length).toBeGreaterThanOrEqual(1);

      // Verify every component references shared styles, layouts, geometry, and interactions
      compKeys.forEach((key) => {
        const comp = registry.components[key];
        expect(comp.id).toBeDefined();
        expect(comp.styleRef).toBeDefined();
        expect(comp.layoutRef).toBeDefined();
        expect(comp.geometryRef).toBeDefined();
        expect(Array.isArray(comp.propsSchema)).toBe(true);
        expect(Array.isArray(comp.slots)).toBe(true);
        expect(Array.isArray(comp.variants)).toBe(true);
      });
    });
  });

  describe('2. Shared Style Registry', () => {
    it('stores styles once and ensures all elements reference style IDs', () => {
      const data = buildRichStoreMockData();
      const registry = buildSharedObjectRegistry(data);

      expect(registry.styles).toBeDefined();
      expect(registry.styles['style.surface.card']).toBeDefined();
      expect(registry.styles['style.button.primary']).toBeDefined();
      expect(registry.styles['style.badge.default']).toBeDefined();
      expect(registry.styles['style.header.navbar']).toBeDefined();
      expect(registry.styles['style.footer.standard']).toBeDefined();

      const cardStyle = registry.styles['style.surface.card'];
      expect(cardStyle.borderRadius).toBeDefined();
      expect(cardStyle.boxShadow).toBeDefined();
      expect(cardStyle.padding).toBeDefined();
    });
  });

  describe('3. Shared Interaction Registry', () => {
    it('stores repeated hover and modal micro-interactions once with references', () => {
      const data = buildRichStoreMockData();
      const registry = buildSharedObjectRegistry(data);

      expect(registry.interactions).toBeDefined();
      expect(registry.interactions['interaction.card.defaultHover']).toBeDefined();
      expect(registry.interactions['interaction.button.primaryHover']).toBeDefined();
      expect(registry.interactions['interaction.modal.openClose']).toBeDefined();

      const cardHover = registry.interactions['interaction.card.defaultHover'];
      expect(cardHover.trigger).toBe('hover');
      expect(cardHover.visualEffect).toContain('translateY');
      expect(cardHover.stateMachine).toBeDefined();
      expect(cardHover.stateMachine?.states).toContain('hover');
    });
  });

  describe('4. Shared Animation Registry', () => {
    it('stores motion presets with cubic-bezier easings and durations once', () => {
      const data = buildRichStoreMockData();
      const registry = buildSharedObjectRegistry(data);

      expect(registry.animations).toBeDefined();
      expect(registry.animations['animation.fadeIn']).toBeDefined();
      expect(registry.animations['animation.slideUp']).toBeDefined();
      expect(registry.animations['animation.scaleHover']).toBeDefined();
      expect(registry.animations['animation.drawerOpen']).toBeDefined();

      const fadeIn = registry.animations['animation.fadeIn'];
      expect(fadeIn.durationMs).toBe(250);
      expect(fadeIn.easing).toContain('cubic-bezier');
    });
  });

  describe('5. Shared Layout Registry', () => {
    it('stores container max-widths, CSS Grid tracks, and Flexbox layouts once', () => {
      const data = buildRichStoreMockData();
      const registry = buildSharedObjectRegistry(data);

      expect(registry.layouts).toBeDefined();
      expect(registry.layouts['layout.container.default']).toBeDefined();
      expect(registry.layouts['layout.grid.products4']).toBeDefined();
      expect(registry.layouts['layout.flex.navbar']).toBeDefined();
      expect(registry.layouts['layout.footer.columns']).toBeDefined();

      const grid4 = registry.layouts['layout.grid.products4'];
      expect(grid4.display).toBe('grid');
      expect(grid4.gridTemplateColumns).toContain('repeat(4');
    });
  });

  describe('6. Shared Typography Registry', () => {
    it('stores font family, weights, and clamp formulas once', () => {
      const data = buildRichStoreMockData();
      const registry = buildSharedObjectRegistry(data);

      expect(registry.typography).toBeDefined();
      const typoKeys = Object.keys(registry.typography);
      expect(typoKeys.length).toBeGreaterThanOrEqual(5);

      const h1 = registry.typography['typography.h1'] || registry.typography[typoKeys[0]];
      expect(h1).toBeDefined();
      expect(h1.fontFamily).toBeDefined();
      expect(h1.fontSize).toBeDefined();
    });
  });

  describe('7. Asset Deduplication', () => {
    it('deduplicates image formatting properties while keeping URLs unique', () => {
      const data = buildRichStoreMockData();
      const registry = buildSharedObjectRegistry(data);

      expect(registry.assets).toBeDefined();
      expect(registry.assets['asset.productCard.media']).toBeDefined();
      expect(registry.assets['asset.icon.standard']).toBeDefined();

      const mediaAsset = registry.assets['asset.productCard.media'];
      expect(mediaAsset.aspectRatio).toBe(1.0);
      expect(mediaAsset.objectFit).toBe('cover');
      expect(mediaAsset.lazyLoad).toBe(true);
    });
  });

  describe('8. Semantic IDs & Relationship Graph', () => {
    it('assigns stable semantic IDs and constructs an explicit relationship graph', () => {
      const data = buildRichStoreMockData();
      const registry = buildSharedObjectRegistry(data);

      expect(registry.relationshipGraph).toBeDefined();
      const graphNodes = Object.values(registry.relationshipGraph);
      expect(graphNodes.length).toBeGreaterThan(0);

      graphNodes.forEach((node) => {
        expect(node.semanticId).toBeDefined();
        expect(node.type).toBe('section');
        expect(node.parentId).toBe('page_root');
        expect(Array.isArray(node.childIds)).toBe(true);
        expect(Array.isArray(node.siblingIds)).toBe(true);
      });
    });
  });

  describe('9. Eliminate Duplicate Geometry', () => {
    it('stores recurring bounding box dimensions and aspect ratios once', () => {
      const data = buildRichStoreMockData();
      const registry = buildSharedObjectRegistry(data);

      expect(registry.geometry).toBeDefined();
      expect(registry.geometry['geometry.card.standard']).toBeDefined();
      expect(registry.geometry['geometry.button.primary']).toBeDefined();
      expect(registry.geometry['geometry.badge.sm']).toBeDefined();

      const cardGeo = registry.geometry['geometry.card.standard'];
      expect(cardGeo.width).toBe(320);
      expect(cardGeo.height).toBe(420);
      expect(cardGeo.aspectRatio).toBeCloseTo(320 / 420, 2);
    });
  });

  describe('10. Reconstruction Metadata & Dependency Graph', () => {
    it('provides an 8-stage dependency graph defining the strict reconstruction build order', () => {
      const data = buildRichStoreMockData();
      const registry = buildSharedObjectRegistry(data);

      expect(registry.reconstructionDependencyGraph).toBeDefined();
      expect(registry.reconstructionDependencyGraph.length).toBe(8);

      const stages = registry.reconstructionDependencyGraph.map((s) => s.stage);
      expect(stages[0]).toContain('Design Tokens');
      expect(stages[1]).toContain('Style & Geometry');
      expect(stages[2]).toContain('Layout');
      expect(stages[3]).toContain('Component Library');
      expect(stages[4]).toContain('Page Composition');
      expect(stages[5]).toContain('Interactions');
      expect(stages[6]).toContain('Animations');
      expect(stages[7]).toContain('Accessibility');
    });
  });

  describe('11. Compression Metrics & Validation Audit', () => {
    it('validates 20–35% compression ratio with zero information loss and zero placeholders', () => {
      const data = buildRichStoreMockData();
      const registry = buildSharedObjectRegistry(data);

      expect(registry.metrics).toBeDefined();
      expect(registry.metrics.originalSizeBytes).toBeGreaterThan(0);
      expect(registry.metrics.compressedSizeBytes).toBeLessThan(registry.metrics.originalSizeBytes);
      expect(registry.metrics.compressionRatio).toBeGreaterThanOrEqual(20);
      expect(registry.metrics.compressionRatio).toBeLessThanOrEqual(35);
      expect(registry.metrics.duplicateEntriesRemoved).toBeGreaterThan(0);
      expect(registry.metrics.sharedRegistryObjects).toBeGreaterThan(10);
      expect(registry.metrics.referenceCount).toBeGreaterThan(15);
      expect(registry.metrics.estimatedReconstructionFidelity).toBe(100);
      expect(registry.metrics.zeroInformationLoss).toBe(true);
      expect(registry.metrics.zeroPlaceholderGeneration).toBe(true);
    });
  });

  describe('12. Export Pipeline & Artifact Integration', () => {
    it('exports a valid registry.json artifact matching schema', () => {
      const data = buildRichStoreMockData();
      const jsonStr = exportSharedRegistryJson(data);

      expect(typeof jsonStr).toBe('string');
      const parsed = JSON.parse(jsonStr);

      expect(parsed.$schema).toContain('shared-registry-v1.json');
      expect(parsed.components).toBeDefined();
      expect(parsed.styles).toBeDefined();
      expect(parsed.layouts).toBeDefined();
      expect(parsed.metrics).toBeDefined();
    });

    it('bundles registry.json inside AI Clone Package (.zip)', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackage(data);

      expect(pkg.files['registry.json']).toBeDefined();
      expect(pkg.files['shared-registry.json']).toBeDefined();
      expect(pkg.manifest.files.some((f) => f.path === 'registry.json' || f.path === '01_reconstruction.json')).toBe(true);
    });

    it('supports standalone registry format in ArtifactExporter', () => {
      const data = buildRichStoreMockData();
      const exporter = new ArtifactExporter();

      const res = exporter.export(data, 'registry');
      expect(res.format).toBe('registry');
      expect(res.exportedData).toContain('shared-registry-v1.json');
      expect(res.artifacts.registry).toBeDefined();
    });
  });
});
