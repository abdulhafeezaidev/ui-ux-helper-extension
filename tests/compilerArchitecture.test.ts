import { describe, it, expect } from 'vitest';
import {
  DesignCompiler,
  compileDesignSpecification,
  DesignSystemCompiler,
  ComponentCompiler,
  LayoutCompiler,
  InteractionCompiler,
  AccessibilityCompiler,
  ReconstructionPlanner,
} from '../src/compiler/index.ts';
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

describe('AI Design Compiler Architecture Subsystem', () => {
  function buildMockData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="root" style="background-color: #ffffff; color: #1f2937; padding: 32px;">
        <header id="site-header" style="display: flex; justify-content: space-between; align-items: center; height: 64px;">
          <div id="logo" style="font-weight: 700; font-size: 20px;">StoreBrand</div>
          <nav id="site-nav" style="display: flex; gap: 16px;">
            <a href="/shop" style="color: #4f46e5; text-decoration: none;">Shop</a>
            <a href="/about" style="color: #6b7280; text-decoration: none;">About</a>
          </nav>
        </header>
        <section id="hero-banner" style="padding: 48px 0; text-align: center;">
          <h1 style="font-size: 40px; font-weight: 800; line-height: 48px; margin-bottom: 16px;">Summer Collection</h1>
          <p style="font-size: 18px; color: #4b5563; margin-bottom: 24px;">Discover handcrafted essentials.</p>
          <button id="hero-cta" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer;">Shop Now</button>
        </section>
        <section id="product-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 32px;">
          <article class="product-card" style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background-color: #ffffff;">
            <img src="https://example.com/item.jpg" alt="Sneakers" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" />
            <span class="badge" style="background-color: #fef3c7; color: #d97706; padding: 4px 8px; font-size: 12px;">New</span>
            <h3 style="font-size: 18px; font-weight: 600; margin-top: 8px;">Aero Runner Sneaker</h3>
            <div style="font-size: 16px; font-weight: 700; color: #111827; margin: 4px 0;">$120.00</div>
            <button style="width: 100%; background-color: #4f46e5; color: #ffffff; padding: 8px 16px; border-radius: 6px;">Add to Bag</button>
          </article>
        </section>
        <footer id="site-footer" style="margin-top: 64px; padding: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #9ca3af;">
          <p>© 2026 StoreBrand Inc. All rights reserved.</p>
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
      pageUrl: 'https://storebrand.example.com',
      title: 'StoreBrand Collection',
      timestamp: Date.now(),
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Architectural Pipeline & Invariants', () => {
    it('compiles ADS into a complete CompiledDesignPackage with all 6 passes executed', () => {
      const data = buildMockData();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);

      expect(pkg).toBeDefined();
      expect(pkg.$schemaVersion).toBe('1.0.0');
      expect(pkg.metadata.compilerVersion).toBe(DesignCompiler.VERSION);
      expect(pkg.metadata.pageUrl).toBe('https://storebrand.example.com');
      expect(pkg.metadata.pageTitle).toBe('StoreBrand Collection');

      // Check all 6 Grammars / Outputs
      expect(pkg.designGrammar).toBeDefined();
      expect(pkg.componentGrammar).toBeDefined();
      expect(pkg.layoutGrammar).toBeDefined();
      expect(pkg.interactionGrammar).toBeDefined();
      expect(pkg.accessibilityGrammar).toBeDefined();
      expect(pkg.reconstructionPlan).toBeDefined();

      // Check execution diagnostics
      expect(pkg.diagnostics.length).toBeGreaterThan(0);
      expect(pkg.metrics.totalTokens).toBeGreaterThan(0);
      expect(pkg.metrics.compilationTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('enforces zero DOM and zero CSS duplication in emitted package', () => {
      const data = buildMockData();
      const ads = buildAgentDesignSpecification(data);
      const pkg = compileDesignSpecification(ads);
      const serialized = JSON.stringify(pkg);

      // Verify no raw DOM element representations, nodeTypes, or HTML tags leaked
      expect(serialized).not.toContain('<div');
      expect(serialized).not.toContain('<!DOCTYPE');
      expect(serialized).not.toContain('HTMLElement');
      expect(serialized).not.toContain('HTMLBodyElement');
      expect(serialized).not.toContain('childElementCount');

      // Verify no raw CSS stylesheet dumps
      expect(serialized).not.toContain('!important');
      expect(serialized).not.toContain('@media only screen');
    });
  });

  describe('2. Pass 1: DesignSystemCompiler (Design Grammar)', () => {
    it('compiles color palette, typography scale, spacing scale, and surface elevation', () => {
      const data = buildMockData();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const dg = pkg.designGrammar;

      expect(dg.colorPalette.primaryTokens.length).toBeGreaterThan(0);
      expect(dg.colorPalette.surfaceTokens.length).toBeGreaterThan(0);
      expect(dg.colorPalette.textTokens.length).toBeGreaterThan(0);

      // Verify typography scale hierarchy
      expect(dg.typographyScale.length).toBeGreaterThan(0);
      const h1Token = dg.typographyScale.find((t) => t.role === 'h1' || t.role === 'display');
      expect(h1Token).toBeDefined();
      expect(h1Token!.hierarchyRank).toBeLessThanOrEqual(2);

      // Spacing scale
      expect(dg.spacingScale.length).toBeGreaterThan(0);
      expect(dg.spacingScale[0].valuePx).toBeLessThanOrEqual(dg.spacingScale[dg.spacingScale.length - 1].valuePx);

      // Surface elevation
      expect(dg.surfaceElevation.length).toBeGreaterThanOrEqual(3);
      expect(dg.surfaceElevation.some((s) => s.elevation === 0)).toBe(true);
      expect(dg.surfaceElevation.some((s) => s.elevation === 1)).toBe(true);
    });
  });

  describe('3. Pass 2: ComponentCompiler (Component Grammar)', () => {
    it('compiles declarative component definitions with props, slots, and token bindings', () => {
      const data = buildMockData();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const cg = pkg.componentGrammar;

      expect(cg.componentCount).toBeGreaterThan(0);
      expect(cg.registry.length).toBeGreaterThan(0);

      const firstComp = cg.registry[0];
      expect(firstComp.id).toMatch(/^(comp-sem-|archetype-)/);
      expect(firstComp.name).toBeTruthy();
      expect(firstComp.props.length).toBeGreaterThan(0);
      expect(firstComp.slots.length).toBeGreaterThan(0);
      expect(firstComp.tokenBindings).toBeDefined();

      // Canonical product card check
      if (ads.productCardSpec) {
        expect(cg.canonicalProductCard).toBeDefined();
        expect(cg.canonicalProductCard?.isProductCard).toBe(true);
      }
    });
  });

  describe('4. Pass 3: LayoutCompiler (Layout Grammar)', () => {
    it('compiles responsive container flows with alignment and breakpoint rules', () => {
      const data = buildMockData();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const lg = pkg.layoutGrammar;

      expect(lg.viewport.width).toBeGreaterThan(0);
      expect(lg.containers.length).toBeGreaterThan(0);

      const firstContainer = lg.containers[0];
      expect(firstContainer.id).toMatch(/^container-sem-/);
      expect(firstContainer.flowPattern).toBeDefined();
      expect(firstContainer.responsiveness.length).toBeGreaterThanOrEqual(2);
      expect(firstContainer.responsiveness.some((r) => r.breakpoint === 'desktop')).toBe(true);
      expect(firstContainer.responsiveness.some((r) => r.breakpoint === 'mobile')).toBe(true);
    });
  });

  describe('5. Pass 4: InteractionCompiler (Interaction Grammar)', () => {
    it('compiles state transitions and discrete motion intent', () => {
      const data = buildMockData();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const ig = pkg.interactionGrammar;

      expect(ig.totalInteractions).toBeGreaterThan(0);
      const firstInteraction = ig.interactions[0];
      expect(firstInteraction.id).toMatch(/^interaction-sem-/);
      expect(firstInteraction.trigger).toBeDefined();
      expect(firstInteraction.effect).toBeDefined();
      expect(firstInteraction.motionIntent.durationMs).toBeGreaterThan(0);
      expect(firstInteraction.motionIntent.easing).toBeDefined();
    });
  });

  describe('6. Pass 5: AccessibilityCompiler (Accessibility Grammar)', () => {
    it('compiles WAI-ARIA landmarks, keyboard navigation sequence, and compliance attestations', () => {
      const data = buildMockData();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const ag = pkg.accessibilityGrammar;

      expect(ag.landmarks.length).toBeGreaterThan(0);
      expect(ag.landmarks.some((l) => l.role === 'main')).toBe(true);
      expect(ag.keyboardNavigation.length).toBeGreaterThan(0);
      expect(ag.compliance.landmarksPresent).toBe(true);
      expect(ag.compliance.keyboardNavigable).toBe(true);
    });
  });

  describe('7. Pass 6: ReconstructionPlanner (Reconstruction Plan & DAG)', () => {
    it('generates a 6-phase DAG with explicit AI Directives and topological dependency chain', () => {
      const data = buildMockData();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const plan = pkg.reconstructionPlan;

      expect(plan.totalSteps).toBeGreaterThanOrEqual(5);
      expect(plan.executionPhases).toContain('design-tokens');
      expect(plan.executionPhases).toContain('primitives');
      expect(plan.executionPhases).toContain('layout-scaffold');
      expect(plan.executionPhases).toContain('interactions');
      expect(plan.executionPhases).toContain('verification');

      // Verify dependency edges exist
      expect(plan.dependencyGraph.edges.length).toBeGreaterThan(0);
      const tokenStep = plan.steps.find((s) => s.phase === 'design-tokens');
      expect(tokenStep).toBeDefined();
      expect(tokenStep!.dependsOn.length).toBe(0);

      // Verify AI directives are present and non-empty
      plan.steps.forEach((step) => {
        expect(step.aiDirective).toBeTruthy();
        expect(step.aiDirective.length).toBeGreaterThan(15);
      });
    });
  });

  describe('8. ArtifactExporter Integration & Backward Compatibility', () => {
    it('exports compiled design package when format is "compiled-design" or "design-compiler"', () => {
      const data = buildMockData();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'compiled-design');
      expect(result.format).toBe('compiled-design');
      expect(result.exportedData).toBeTruthy();
      expect(result.artifacts['compiled-design']).toBeDefined();
      expect(result.artifacts['CompiledDesignPackage.json']).toBeDefined();
      expect(result.artifacts['design-grammar']).toBeDefined();
      expect(result.artifacts['component-grammar']).toBeDefined();
      expect(result.artifacts['layout-grammar']).toBeDefined();
      expect(result.artifacts['interaction-grammar']).toBeDefined();
      expect(result.artifacts['accessibility-grammar']).toBeDefined();
      expect(result.artifacts['reconstruction-plan']).toBeDefined();

      const parsed = JSON.parse(result.exportedData);
      expect(parsed.$schemaVersion).toBe('1.0.0');
      expect(parsed.designGrammar).toBeDefined();
    });

    it('guarantees existing export formats continue working without any regression', () => {
      const data = buildMockData();
      const exporter = new ArtifactExporter();

      const jsonRes = exporter.export(data, 'json');
      expect(jsonRes.format).toBe('json');
      expect(jsonRes.exportedData).toBeTruthy();

      const tokenRes = exporter.export(data, 'tokens');
      expect(tokenRes.format).toBe('tokens');

      const adsRes = exporter.export(data, 'ads-json');
      expect(adsRes.format).toBe('ads-json');

      const allRes = exporter.export(data, 'all');
      expect(allRes.format).toBe('all');
      expect(allRes.artifacts.json).toBeDefined();
    });
  });

  describe('9. Isolated Compiler Pass Contract Integrity', () => {
    it('verifies that each modular pass can be instantiated and exposes contract properties', () => {
      const p1 = new DesignSystemCompiler();
      const p2 = new ComponentCompiler();
      const p3 = new LayoutCompiler();
      const p4 = new InteractionCompiler();
      const p5 = new AccessibilityCompiler();
      const p6 = new ReconstructionPlanner();

      expect(p1.passNumber).toBe(1);
      expect(p1.name).toBe('DesignSystemCompiler');

      expect(p2.passNumber).toBe(2);
      expect(p2.name).toBe('ComponentCompiler');

      expect(p3.passNumber).toBe(3);
      expect(p3.name).toBe('LayoutCompiler');

      expect(p4.passNumber).toBe(4);
      expect(p4.name).toBe('InteractionCompiler');

      expect(p5.passNumber).toBe(5);
      expect(p5.name).toBe('AccessibilityCompiler');

      expect(p6.passNumber).toBe(6);
      expect(p6.name).toBe('ReconstructionPlanner');
    });
  });
});
