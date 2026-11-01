import { describe, it, expect } from 'vitest';
import { LayoutCompiler } from '../src/compiler/passes/layoutCompiler.ts';
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

describe('LayoutCompiler Reusable Patterns & Spatial Compression Engine', () => {
  function createMultiSectionPage(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="root" style="width: 100%; background-color: #ffffff;">
        <!-- Header Bar -->
        <header id="header-sec" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; height: 72px;">
          <div class="logo">Brand</div>
          <nav style="display: flex; gap: 20px;">
            <a href="#">Home</a>
            <a href="#">Catalog</a>
            <a href="#">Contact</a>
          </nav>
          <div class="actions"><button>Account</button></div>
        </header>

        <!-- Hero Split -->
        <section id="hero-sec" style="display: flex; justify-content: space-between; align-items: center; padding: 64px 32px; min-height: 450px;">
          <div class="hero-content" style="max-width: 50%;">
            <h1 style="font-size: 44px; line-height: 52px;">Next Generation Design</h1>
            <p style="font-size: 18px; margin: 16px 0;">Transforming raw implementation into semantic design grammars.</p>
            <button style="padding: 12px 24px;">Get Started</button>
          </div>
          <div class="hero-visual" style="max-width: 45%;">
            <img src="https://example.com/hero.jpg" alt="Hero illustration" style="width: 100%;" />
          </div>
        </section>

        <!-- Feature Grid (3 columns) -->
        <section id="features-sec" style="padding: 48px 32px; max-width: 1280px; margin: 0 auto;">
          <h2 style="text-align: center; margin-bottom: 32px;">Core Capabilities</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;">
            <div class="feature-item" style="padding: 24px; border: 1px solid #e5e7eb;">
              <h3>Semantic Tokens</h3>
              <p>Canonical design tokens.</p>
            </div>
            <div class="feature-item" style="padding: 24px; border: 1px solid #e5e7eb;">
              <h3>Component Archetypes</h3>
              <p>Canonical component contracts.</p>
            </div>
            <div class="feature-item" style="padding: 24px; border: 1px solid #e5e7eb;">
              <h3>Layout Patterns</h3>
              <p>Reusable responsive topologies.</p>
            </div>
          </div>
        </section>

        <!-- Card Grid / Product Feed -->
        <section id="products-sec" style="padding: 48px 32px; max-width: 1280px; margin: 0 auto;">
          <h2>Featured Products</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
            <div class="card" style="padding: 16px; border: 1px solid #e5e7eb;">Product 1</div>
            <div class="card" style="padding: 16px; border: 1px solid #e5e7eb;">Product 2</div>
            <div class="card" style="padding: 16px; border: 1px solid #e5e7eb;">Product 3</div>
          </div>
        </section>

        <!-- Footer Columns -->
        <footer id="footer-sec" style="padding: 48px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px;">
            <div class="col"><h4>Company</h4><p>About Us</p></div>
            <div class="col"><h4>Products</h4><p>Features</p></div>
            <div class="col"><h4>Resources</h4><p>Docs</p></div>
            <div class="col"><h4>Legal</h4><p>Privacy</p></div>
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
      pageUrl: 'https://layoutdemo.example.com',
      title: 'Layout Pattern Demonstration',
      timestamp: Date.now(),
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Reusable Layout Pattern Detection vs. Raw Geometry Dumps', () => {
    it('detects high-level reusable layout patterns instead of dumping per-element x/y coordinates', () => {
      const data = createMultiSectionPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const lg = pkg.layoutGrammar;

      expect(lg.patterns).toBeDefined();

      const patternIds = Object.keys(lg.patterns);
      expect(patternIds.length).toBeGreaterThan(0);

      // Verify canonical patterns were detected
      expect(patternIds.some((p) => p.includes('header') || p.includes('split') || p.includes('grid') || p.includes('container'))).toBe(true);

      // Verify no raw coordinate dumps exist in patterns
      const serialized = JSON.stringify(lg.patterns);
      expect(serialized).not.toContain('"boundingRect"');
      expect(serialized).not.toContain('"clientRect"');
    });

    it('structures patterns through Pattern -> Container -> Columns -> Gap -> Alignment -> Responsive rules', () => {
      const data = createMultiSectionPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const patterns = Object.values(pkg.layoutGrammar.patterns);

      expect(patterns.length).toBeGreaterThan(0);

      patterns.forEach((pat) => {
        // Step 1: Pattern metadata
        expect(pat.id).toBeTruthy();
        expect(pat.name).toBeTruthy();
        expect(pat.category).toBeTruthy();
        expect(pat.description).toBeTruthy();

        // Step 2: Container
        expect(pat.container).toBeDefined();
        expect(pat.container.maxWidth).toBeTruthy();
        expect(typeof pat.container.centered).toBe('boolean');
        expect(pat.container.padding).toBeTruthy();

        // Step 3: Columns
        expect(pat.columns).toBeDefined();
        expect(pat.columns.desktop).toBeGreaterThanOrEqual(1);
        expect(pat.columns.tablet).toBeGreaterThanOrEqual(1);
        expect(pat.columns.mobile).toBe(1);
        expect(pat.columns.distribution).toBeTruthy();

        // Step 4: Gap
        expect(pat.gap).toBeDefined();
        expect(pat.gap.row).toBeTruthy();
        expect(pat.gap.column).toBeTruthy();

        // Step 5: Alignment
        expect(pat.alignment).toBeDefined();
        expect(pat.alignment.horizontal).toBeTruthy();
        expect(pat.alignment.vertical).toBeTruthy();

        // Step 6: Responsive rules
        expect(pat.responsiveRules).toBeDefined();
        expect(pat.responsiveRules.length).toBeGreaterThanOrEqual(3);
        expect(pat.responsiveRules.some((r) => r.breakpoint === 'desktop')).toBe(true);
        expect(pat.responsiveRules.some((r) => r.breakpoint === 'tablet')).toBe(true);
        expect(pat.responsiveRules.some((r) => r.breakpoint === 'mobile')).toBe(true);
      });
    });
  });

  describe('2. Section Pattern References (patternRef)', () => {
    it('ensures each page section references a pattern without duplicating geometry', () => {
      const data = createMultiSectionPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const sections = pkg.layoutGrammar.sections;

      expect(sections.length).toBeGreaterThan(0);

      sections.forEach((sec) => {
        expect(sec.sectionId).toBeTruthy();
        expect(sec.semanticRole).toBeTruthy();
        expect(sec.patternRef).toBeTruthy();
        expect(pkg.layoutGrammar.patterns[sec.patternRef]).toBeDefined();
        expect(typeof sec.flowOrder).toBe('number');
      });
    });
  });

  describe('3. Preserved Responsive Behavior', () => {
    it('retains explicit responsive rules for desktop, tablet, and mobile across all patterns', () => {
      const data = createMultiSectionPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const patterns = Object.values(pkg.layoutGrammar.patterns);

      patterns.forEach((pat) => {
        const desktop = pat.responsiveRules.find((r) => r.breakpoint === 'desktop')!;
        const tablet = pat.responsiveRules.find((r) => r.breakpoint === 'tablet')!;
        const mobile = pat.responsiveRules.find((r) => r.breakpoint === 'mobile')!;

        expect(desktop).toBeDefined();
        expect(tablet).toBeDefined();
        expect(mobile).toBeDefined();

        // Mobile always collapses columns into single column vertical flow
        expect(mobile.columns).toBe(1);
        expect(mobile.direction).toBe('column');
        expect(mobile.maxWidthPx).toBeLessThanOrEqual(500);

        // Desktop supports multi-column layouts
        expect(desktop.maxWidthPx).toBeGreaterThan(1000);
      });
    });
  });

  describe('4. Layout Statistics & Compression Calculation', () => {
    it('calculates and reports layout compression and eliminated coordinates', () => {
      const data = createMultiSectionPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const stats = pkg.layoutGrammar.statistics;

      expect(stats).toBeDefined();
      expect(stats.totalElementsWithGeometry).toBeGreaterThan(0);
      expect(stats.rawCoordinatesCount).toBeGreaterThan(0);
      expect(stats.detectedPatternsCount).toBeGreaterThan(0);
      expect(stats.sectionsCount).toBeGreaterThan(0);
      expect(stats.eliminatedCoordinatesCount).toBeGreaterThan(0);

      // Estimated compression metrics
      expect(stats.estimatedCompression.rawGeometrySizeBytes).toBeGreaterThan(stats.estimatedCompression.patternGrammarSizeBytes);
      expect(stats.estimatedCompression.reductionPercentage).toBeGreaterThan(50.0);
      expect(stats.estimatedCompression.compressionRatio).toBeGreaterThan(2.0);

      // Diagnostics verification
      const layoutDiag = pkg.diagnostics.find((d) => d.message.includes('reusable layout patterns'));
      expect(layoutDiag).toBeDefined();
    });
  });

  describe('5. layoutGrammar.json Export Artifact Generation', () => {
    it('exports layoutGrammar.json directly via ArtifactExporter', () => {
      const data = createMultiSectionPage();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'layout-grammar');
      expect(result.format).toBe('layout-grammar');
      expect(result.exportedData).toBeTruthy();
      expect(result.artifacts['layoutGrammar.json']).toBeDefined();

      const parsed = JSON.parse(result.exportedData);
      expect(parsed.patterns).toBeDefined();
      expect(parsed.sections).toBeDefined();
      expect(parsed.statistics).toBeDefined();
      expect(parsed.viewport).toBeDefined();
    });

    it('bundles layoutGrammar.json inside compiled-design format', () => {
      const data = createMultiSectionPage();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'compiled-design');
      expect(result.artifacts['layoutGrammar.json']).toBeDefined();
      expect(result.artifacts['layout-grammar']).toBeDefined();

      const lg = JSON.parse(result.artifacts['layoutGrammar.json']);
      expect(Object.keys(lg.patterns).length).toBeGreaterThan(0);
      expect(lg.sections.length).toBeGreaterThan(0);
    });
  });

  describe('6. Standalone Pass Invocation & Backward Compatibility', () => {
    it('allows standalone invocation of LayoutCompiler pass', () => {
      const data = createMultiSectionPage();
      const ads = buildAgentDesignSpecification(data);

      const pass = new LayoutCompiler();
      expect(pass.name).toBe('LayoutCompiler');
      expect(pass.passNumber).toBe(3);

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
      expect(grammar.patterns).toBeDefined();
      expect(grammar.sections).toBeDefined();
      expect(grammar.statistics).toBeDefined();
      expect(grammar.containers.length).toBeGreaterThan(0); // Legacy container flows preserved for Pass 6
    });
  });
});
