import { describe, it, expect } from 'vitest';
import { DesignSystemCompiler } from '../src/compiler/passes/designSystemCompiler.ts';
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

describe('DesignSystemCompiler Semantic Grammar & Compression Engine', () => {
  function createMockDesignPage(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="app" style="background-color: #ffffff; color: #111827; padding: 16px;">
        <header style="padding: 16px; margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h1 style="font-size: 36px; font-weight: 800; line-height: 44px; color: #111827;">Storefront</h1>
          <nav style="display: flex; gap: 16px;">
            <a href="#" style="font-size: 14px; color: #4f46e5; text-decoration: none;">Products</a>
            <a href="#" style="font-size: 14px; color: #4b5563; text-decoration: none;">Pricing</a>
          </nav>
        </header>

        <main style="max-width: 1280px; margin: 0 auto; padding: 16px;">
          <!-- Repeated spacing 16px, repeated borders, repeated colors -->
          <div class="card-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div class="card" style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Card Alpha</h3>
              <p style="font-size: 14px; color: #4b5563; margin-bottom: 16px;">Sample descriptive copy with repeated 16px spacing.</p>
              <button style="padding: 8px 16px; background-color: #4f46e5; color: #ffffff; border-radius: 8px; border: none;">Action 1</button>
            </div>
            <div class="card" style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Card Beta</h3>
              <p style="font-size: 14px; color: #4b5563; margin-bottom: 16px;">Sample descriptive copy with repeated 16px spacing.</p>
              <button style="padding: 8px 16px; background-color: #4f46e5; color: #ffffff; border-radius: 8px; border: none;">Action 2</button>
            </div>
            <div class="card" style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Card Gamma</h3>
              <p style="font-size: 14px; color: #4b5563; margin-bottom: 16px;">Sample descriptive copy with repeated 16px spacing.</p>
              <button style="padding: 8px 16px; background-color: #4f46e5; color: #ffffff; border-radius: 8px; border: none;">Action 3</button>
            </div>
          </div>
        </main>
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
      pageUrl: 'https://storefront.example.com',
      title: 'Storefront Demo',
      timestamp: Date.now(),
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Authoritative 9-Scale Canonical Token Detection', () => {
    it('detects all 9 design scales with canonical names and metadata', () => {
      const data = createMockDesignPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const dg = pkg.designGrammar;

      // 1. Color Palette
      expect(dg.colors).toBeDefined();
      expect(dg.colors.primary).toBeDefined();
      expect(dg.colors.primary.canonicalRef).toBe('color.primary');
      expect(dg.colors.surface).toBeDefined();
      expect(dg.colors['text-primary']).toBeDefined();
      expect(dg.colors['border-subtle']).toBeDefined();

      // 2. Typography Roles & Scale
      expect(dg.typography).toBeDefined();
      expect(dg.typography.md).toBeDefined();
      expect(dg.typography.md.canonicalRef).toBe('typography.md');
      expect(dg.typography.md.value.fontSizePx).toBe(16);
      expect(dg.typography['4xl']).toBeDefined(); // H1 (36px)
      expect(dg.typography['4xl'].value.role).toBe('h1');

      // 3. Spacing Scale (minimum token set)
      expect(dg.spacing).toBeDefined();
      expect(dg.spacing.md).toBeDefined();
      expect(dg.spacing.md.canonicalRef).toBe('spacing.md');
      expect(dg.spacing.md.value).toBe(16);
      expect(dg.spacing.xs).toBeDefined();
      expect(dg.spacing.xs.value).toBe(8);

      // 4. Radius Scale
      expect(dg.radius).toBeDefined();
      expect(dg.radius.none).toBeDefined();
      expect(dg.radius.md).toBeDefined();
      expect(dg.radius.md.canonicalRef).toBe('radius.md');
      expect(dg.radius.md.value).toBe(8);

      // 5. Shadow Scale
      expect(dg.shadows).toBeDefined();
      expect(dg.shadows.none).toBeDefined();
      expect(dg.shadows.sm).toBeDefined();
      expect(dg.shadows.md).toBeDefined();
      expect(dg.shadows.md.canonicalRef).toBe('shadow.md');

      // 6. Border Scale
      expect(dg.borders).toBeDefined();
      expect(dg.borders.thin).toBeDefined();
      expect(dg.borders.thin.canonicalRef).toBe('border.thin');
      expect(dg.borders.thin.value).toBe(1);

      // 7. Elevation Tokens
      expect(dg.elevations).toBeDefined();
      expect(dg.elevations['level-0']).toBeDefined();
      expect(dg.elevations['level-1']).toBeDefined();
      expect(dg.elevations['level-1'].canonicalRef).toBe('elevation.1');

      // 8. Animation Tokens
      expect(dg.animations).toBeDefined();
      expect(dg.animations.durations.fast).toBeDefined();
      expect(dg.animations.durations.fast.canonicalRef).toBe('animation.duration.fast');
      expect(dg.animations.durations.fast.value).toBe(150);
      expect(dg.animations.easings.standard).toBeDefined();
      expect(dg.animations.easings.standard.canonicalRef).toBe('animation.easing.standard');

      // 9. Container Widths
      expect(dg.containers).toBeDefined();
      expect(dg.containers.xl).toBeDefined();
      expect(dg.containers.xl.canonicalRef).toBe('container.xl');
      expect(dg.containers.xl.value).toBe(1280);
    });
  });

  describe('2. Repeated Value Deduplication & Reference Resolution', () => {
    it('indexes raw values to canonical token references in tokenReferences', () => {
      const data = createMockDesignPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const refs = pkg.designGrammar.tokenReferences;

      expect(refs).toBeDefined();

      // Verify that raw 16px maps to spacing.md instead of duplicating 16
      expect(refs['16']).toBe('spacing.md');
      expect(refs['16px']).toBe('spacing.md');
      expect(refs['padding:16']).toBe('spacing.md');

      // Verify that raw 8px maps to spacing.xs or radius.md
      expect(refs['8']).toBe('spacing.xs');
      expect(refs['radius:8px']).toBe('radius.md');

      // Verify border 1px maps to border.thin
      expect(refs['border:1px']).toBe('border.thin');

      // Verify container 1280 maps to container.xl
      expect(refs['container:1280']).toBe('container.xl');
    });

    it('enforces canonical t-shirt naming (xs, sm, md, lg, xl, 2xl) across scales', () => {
      const data = createMockDesignPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);

      const spacingKeys = Object.keys(pkg.designGrammar.spacing);
      expect(spacingKeys).toContain('xs');
      expect(spacingKeys).toContain('sm');
      expect(spacingKeys).toContain('md');
      expect(spacingKeys).toContain('lg');
      expect(spacingKeys).toContain('xl');

      const typoKeys = Object.keys(pkg.designGrammar.typography);
      expect(typoKeys).toContain('xs');
      expect(typoKeys).toContain('sm');
      expect(typoKeys).toContain('md');
      expect(typoKeys).toContain('lg');
      expect(typoKeys).toContain('xl');
      expect(typoKeys).toContain('2xl');
      expect(typoKeys).toContain('3xl');
      expect(typoKeys).toContain('4xl');

      const radiusKeys = Object.keys(pkg.designGrammar.radius);
      expect(radiusKeys).toContain('none');
      expect(radiusKeys).toContain('sm');
      expect(radiusKeys).toContain('md');
      expect(radiusKeys).toContain('lg');
      expect(radiusKeys).toContain('xl');
      expect(radiusKeys).toContain('full');
    });
  });

  describe('3. Compression Statistics (Before vs After)', () => {
    it('reports before, after, reduction percentage, and compression ratio without data loss', () => {
      const data = createMockDesignPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const stats = pkg.designGrammar.compressionStats;

      expect(stats).toBeDefined();

      // Before metrics
      expect(stats.before.totalRawValues).toBeGreaterThan(0);
      expect(stats.before.rawPayloadSizeBytes).toBeGreaterThan(0);

      // After metrics
      expect(stats.after.canonicalTokensCount).toBeGreaterThan(0);
      expect(stats.after.uniqueTokensCount).toBe(stats.after.canonicalTokensCount);
      expect(stats.after.compressedPayloadSizeBytes).toBeLessThan(stats.before.rawPayloadSizeBytes);

      // Substantial compression ratio achieved by replacing repeated raw declarations
      expect(stats.reductionPercentage).toBeGreaterThan(50.0);
      expect(stats.compressionRatio).toBeGreaterThan(2.0);

      // Diagnostics verification
      const compDiag = pkg.diagnostics.find((d) => d.message.includes('Compressed'));
      expect(compDiag).toBeDefined();
    });
  });

  describe('4. designGrammar.json Export Artifact Generation', () => {
    it('exports designGrammar.json directly via ArtifactExporter', () => {
      const data = createMockDesignPage();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'design-grammar');
      expect(result.format).toBe('design-grammar');
      expect(result.exportedData).toBeTruthy();
      expect(result.artifacts['designGrammar.json']).toBeDefined();

      const parsed = JSON.parse(result.exportedData);
      expect(parsed.colors).toBeDefined();
      expect(parsed.typography).toBeDefined();
      expect(parsed.spacing).toBeDefined();
      expect(parsed.radius).toBeDefined();
      expect(parsed.shadows).toBeDefined();
      expect(parsed.borders).toBeDefined();
      expect(parsed.elevations).toBeDefined();
      expect(parsed.animations).toBeDefined();
      expect(parsed.containers).toBeDefined();
      expect(parsed.tokenReferences).toBeDefined();
      expect(parsed.compressionStats).toBeDefined();
    });

    it('bundles designGrammar.json inside compiled-design format', () => {
      const data = createMockDesignPage();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'compiled-design');
      expect(result.artifacts['designGrammar.json']).toBeDefined();
      expect(result.artifacts['design-grammar']).toBeDefined();

      const dg = JSON.parse(result.artifacts['designGrammar.json']);
      expect(dg.spacing.md.value).toBe(16);
      expect(dg.tokenReferences['16']).toBe('spacing.md');
    });
  });

  describe('5. Zero Functionality Loss & Backward Compatibility', () => {
    it('preserves legacy designGrammar fields for backward compatibility', () => {
      const data = createMockDesignPage();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const pkg = compiler.compile(ads);
      const dg = pkg.designGrammar;

      expect(dg.colorPalette).toBeDefined();
      expect(dg.colorPalette.primaryTokens.length).toBeGreaterThan(0);
      expect(dg.typographyScale.length).toBeGreaterThan(0);
      expect(dg.spacingScale.length).toBeGreaterThan(0);
      expect(dg.surfaceElevation.length).toBeGreaterThan(0);
      expect(dg.baseFontFamilies.length).toBeGreaterThan(0);
    });

    it('allows standalone invocation of DesignSystemCompiler pass', () => {
      const data = createMockDesignPage();
      const ads = buildAgentDesignSpecification(data);

      const pass = new DesignSystemCompiler();
      expect(pass.name).toBe('DesignSystemCompiler');
      expect(pass.passNumber).toBe(1);

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
      expect(grammar.colors.primary).toBeDefined();
      expect(grammar.spacing.md.value).toBe(16);
    });
  });
});
