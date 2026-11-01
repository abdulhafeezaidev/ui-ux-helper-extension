import { describe, it, expect } from 'vitest';
import { ComponentCompiler } from '../src/compiler/passes/componentCompiler.ts';
import { DesignCompiler } from '../src/compiler/DesignCompiler.ts';
import { buildAgentDesignSpecification } from '../src/agent-spec/index.ts';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { ArtifactExporter } from '../src/output/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

describe('ComponentCompiler Archetype & Reuse Engine', () => {
  function createComplexMockPage(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="wrapper" style="background-color: #ffffff; color: #111827;">
        <!-- Navigation Archetype -->
        <header id="site-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px;">
          <div class="logo">StoreBrand</div>
          <nav>
            <a href="/shop">Shop</a>
            <a href="/about">About</a>
          </nav>
          <button class="primary-btn" style="background-color: #4f46e5; color: #ffffff; padding: 8px 16px;">Log In</button>
        </header>

        <!-- Main Product Feed: Multiple repeated cards and buttons -->
        <main style="padding: 24px;">
          <div class="product-feed" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
            <!-- Instance 1 -->
            <article class="product-card" style="border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
              <span class="badge" style="background: #fef3c7; color: #d97706;">New</span>
              <img src="https://example.com/p1.jpg" alt="Sneaker 1" style="width: 100%; height: 200px;" />
              <h3>Aero Runner</h3>
              <p class="price">$120.00</p>
              <button class="primary-btn" style="background-color: #4f46e5; color: #ffffff; padding: 8px 16px;">Add to Bag</button>
              <button class="secondary-btn" style="background-color: transparent; border: 1px solid #e5e7eb; padding: 8px 16px;">Details</button>
            </article>

            <!-- Instance 2 -->
            <article class="product-card" style="border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
              <span class="badge" style="background: #fef3c7; color: #d97706;">Popular</span>
              <img src="https://example.com/p2.jpg" alt="Sneaker 2" style="width: 100%; height: 200px;" />
              <h3>Cloud Stride</h3>
              <p class="price">$140.00</p>
              <button class="primary-btn" style="background-color: #4f46e5; color: #ffffff; padding: 8px 16px;">Add to Bag</button>
              <button class="secondary-btn" style="background-color: transparent; border: 1px solid #e5e7eb; padding: 8px 16px;">Details</button>
            </article>

            <!-- Instance 3 -->
            <article class="product-card" style="border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
              <span class="badge" style="background: #fef3c7; color: #d97706;">Sale</span>
              <img src="https://example.com/p3.jpg" alt="Sneaker 3" style="width: 100%; height: 200px;" />
              <h3>Trail Blazer</h3>
              <p class="price">$95.00</p>
              <button class="primary-btn" style="background-color: #4f46e5; color: #ffffff; padding: 8px 16px;">Add to Bag</button>
              <button class="secondary-btn" style="background-color: transparent; border: 1px solid #e5e7eb; padding: 8px 16px;">Details</button>
            </article>
          </div>
        </main>

        <!-- Footer Archetype -->
        <footer id="site-footer" style="padding: 32px; border-top: 1px solid #e5e7eb;">
          <p>© 2026 StoreBrand. All rights reserved.</p>
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
      pageUrl: 'https://ecommerce.example.com',
      title: 'StoreBrand Catalog',
      timestamp: Date.now(),
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Archetype Detection & Canonical Definition Purity', () => {
    it('detects canonical archetypes rather than exporting redundant component instances', () => {
      const data = createComplexMockPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const cg = pkg.componentGrammar;

      expect(cg.archetypes).toBeDefined();

      const archetypeIds = Object.keys(cg.archetypes);
      expect(archetypeIds.length).toBeGreaterThan(0);

      // Verify canonical archetypes exist
      expect(archetypeIds).toContain('archetype-primary-button');
      expect(archetypeIds).toContain('archetype-product-card');

      // Crucial: exactly ONE definition per archetype
      const primaryBtn = cg.archetypes['archetype-primary-button'];
      expect(primaryBtn).toBeDefined();
      expect(primaryBtn.semanticName).toBe('Primary Button');
      expect(primaryBtn.instanceCount).toBeGreaterThanOrEqual(1);

      const productCard = cg.archetypes['archetype-product-card'];
      expect(productCard).toBeDefined();
      expect(productCard.semanticName).toBe('Product Card');
    });

    it('ensures each archetype contains semantic name, slots, variants, states, tokens, children, and relationships', () => {
      const data = createComplexMockPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const archetypes = pkg.componentGrammar.archetypes;

      const productCard = archetypes['archetype-product-card'];
      expect(productCard).toBeDefined();

      // Semantic name
      expect(productCard.semanticName).toBe('Product Card');

      // Slots
      expect(productCard.slots.length).toBeGreaterThanOrEqual(3);
      expect(productCard.slots.some((s) => s.name === 'media')).toBe(true);
      expect(productCard.slots.some((s) => s.name === 'actions')).toBe(true);

      // Variants
      expect(productCard.variants.length).toBeGreaterThanOrEqual(1);

      // States
      expect(productCard.states).toContain('default');
      expect(productCard.states).toContain('hover');

      // Design Tokens (Bound to Pass 1 semantic tokens)
      expect(productCard.designTokens).toBeDefined();
      expect(productCard.designTokens.colors).toBeDefined();
      expect(productCard.designTokens.spacing).toBeDefined();
      expect(productCard.designTokens.radius).toBe('radius.md');
      expect(productCard.designTokens.shadow).toBe('shadow.md');

      // Required & optional children
      expect(productCard.requiredChildren).toContain('Typography');
      expect(productCard.optionalChildren).toContain('Badge');

      // Relationships
      expect(productCard.relationships.children).toContain('archetype-primary-button');
    });
  });

  describe('2. Occurrence Mapping & componentRef Substitution', () => {
    it('replaces every component instance with a componentRef pointing to its archetype', () => {
      const data = createComplexMockPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const occurrences = pkg.componentGrammar.occurrences;

      expect(occurrences.length).toBeGreaterThan(0);

      // Verify that every occurrence points to an existing archetype ID via componentRef
      occurrences.forEach((occ) => {
        expect(occ.occurrenceId).toBeTruthy();
        expect(occ.componentRef).toBeTruthy();
        expect(pkg.componentGrammar.archetypes[occ.componentRef]).toBeDefined();
        expect(occ.sourceElementId).toBeTruthy();
      });

      // Verify multiple occurrences point to the same archetype
      const buttonOccurrences = occurrences.filter(
        (o) => o.componentRef === 'archetype-primary-button'
      );
      expect(buttonOccurrences.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Component Reuse & Compression Statistics', () => {
    it('calculates and reports original components, canonical components, compression ratio, and reuse ratio', () => {
      const data = createComplexMockPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const stats = pkg.componentGrammar.statistics;

      expect(stats).toBeDefined();
      expect(stats.originalComponents).toBeGreaterThanOrEqual(stats.canonicalComponents);
      expect(stats.canonicalComponents).toBeGreaterThan(0);
      expect(stats.compressionRatio).toBeGreaterThanOrEqual(1.0);
      expect(stats.reuseRatio).toBeGreaterThanOrEqual(0.0);
      expect(stats.averageInstancesPerArchetype).toBeGreaterThanOrEqual(1.0);

      // Verify diagnostics logged archetype compilation metrics
      const compDiag = pkg.diagnostics.find((d) => d.message.includes('canonical archetypes'));
      expect(compDiag).toBeDefined();
    });
  });

  describe('4. Traceability Preservation', () => {
    it('preserves sourceElementIds, provenance, confidence, and evidence on archetypes', () => {
      const data = createComplexMockPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const archetypes = Object.values(pkg.componentGrammar.archetypes);

      archetypes.forEach((arch) => {
        expect(arch.traceability).toBeDefined();
        expect(arch.traceability.sourceElementIds.length).toBeGreaterThan(0);
        expect(arch.traceability.provenance).toBeTruthy();
        expect(arch.traceability.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('5. componentGrammar.json Export Artifact Generation', () => {
    it('exports componentGrammar.json directly via ArtifactExporter', () => {
      const data = createComplexMockPage();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'component-grammar');
      expect(result.format).toBe('component-grammar');
      expect(result.exportedData).toBeTruthy();
      expect(result.artifacts['componentGrammar.json']).toBeDefined();

      const parsed = JSON.parse(result.exportedData);
      expect(parsed.archetypes).toBeDefined();
      expect(parsed.occurrences).toBeDefined();
      expect(parsed.statistics).toBeDefined();
      expect(parsed.statistics.canonicalComponents).toBeGreaterThan(0);
    });

    it('bundles componentGrammar.json inside compiled-design bundle', () => {
      const data = createComplexMockPage();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'compiled-design');
      expect(result.artifacts['componentGrammar.json']).toBeDefined();
      expect(result.artifacts['component-grammar']).toBeDefined();

      const cg = JSON.parse(result.artifacts['componentGrammar.json']);
      expect(cg.archetypes['archetype-primary-button']).toBeDefined();
      expect(cg.occurrences.length).toBeGreaterThan(0);
    });
  });

  describe('6. Standalone Pass Invocation & Backward Compatibility', () => {
    it('allows standalone invocation of ComponentCompiler pass', () => {
      const data = createComplexMockPage();
      const ads = buildAgentDesignSpecification(data);

      const pass = new ComponentCompiler();
      expect(pass.name).toBe('ComponentCompiler');
      expect(pass.passNumber).toBe(2);

      const dummyContext: any = {
        adsVersion: '1.0.0',
        pageUrl: ads.metadata?.pageUrl || '',
        pageTitle: ads.metadata?.title || '',
        passesExecuted: [],
        diagnostics: [],
        metrics: { totalTokens: 0, totalComponents: 0, totalContainers: 0, totalInteractions: 0, compilationTimeMs: 0 },
        addDiagnostic: () => {},
      };

      const grammar = pass.compile(ads, dummyContext);
      expect(grammar.archetypes).toBeDefined();
      expect(grammar.occurrences).toBeDefined();
      expect(grammar.statistics).toBeDefined();
      expect(grammar.registry.length).toBeGreaterThan(0); // Legacy registry maintained for Pass 6
    });
  });
});
