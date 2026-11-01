import { describe, it, expect } from 'vitest';
import {
  buildDesignSystemSpecification,
} from '../src/normalization/color/designSystemSemanticEngine.ts';
import { exportDesignSystemJson } from '../src/output/clonePackage/designSystemJsonExporter.ts';
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

describe('Prompt 24 — Design System Semantic Engine', () => {
  function buildSemanticDesignSystemMockData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="app" style="background-color: #f8fafc; color: #0f172a; font-family: 'Inter', sans-serif;">
        <header style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 32px;">
          <h1 style="font-size: 40px; font-weight: 700; color: #0f172a;">Design System Suite</h1>
          <p style="font-size: 16px; color: #475569;">Converting raw token primitives into semantic tokens.</p>
          <button class="btn btn-primary" style="background-color: #3b82f6; color: #ffffff; padding: 10px 20px; font-weight: 600;">Action Button</button>
        </header>

        <main style="padding: 32px;">
          <section class="card" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 24px;">
            <h2 style="font-size: 28px; font-weight: 600;">Card Section Heading</h2>
            <h3 style="font-size: 20px; font-weight: 600;">Sub-heading component</h3>
            <p style="font-size: 15px; color: #0f172a;">Body text explaining the component specification.</p>
            <span class="badge badge-sale" style="background-color: #10b981; color: #ffffff; font-size: 12px; font-weight: 600;">Success 20% OFF</span>
            <small style="font-size: 12px; color: #64748b;">Terms and conditions apply.</small>
          </section>
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
      pageUrl: 'https://example.com/design-system',
      title: 'Semantic Design System',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Semantic Color Token Resolution', () => {
    it('detects all 13 required semantic color roles', () => {
      const data = buildSemanticDesignSystemMockData();
      const ds = buildDesignSystemSpecification(data);

      expect(ds.colorTokens.primary.name).toBe('Primary');
      expect(ds.colorTokens.primary.value).toBeDefined();

      expect(ds.colorTokens.secondary.name).toBe('Secondary');
      expect(ds.colorTokens.secondary.value).toBeDefined();

      expect(ds.colorTokens.accent.name).toBe('Accent');
      expect(ds.colorTokens.accent.value).toBeDefined();

      expect(ds.colorTokens.danger.name).toBe('Danger');
      expect(ds.colorTokens.danger.value).toBeDefined();

      expect(ds.colorTokens.warning.name).toBe('Warning');
      expect(ds.colorTokens.warning.value).toBeDefined();

      expect(ds.colorTokens.success.name).toBe('Success');
      expect(ds.colorTokens.success.value).toBeDefined();

      expect(ds.colorTokens.muted.name).toBe('Muted');
      expect(ds.colorTokens.muted.value).toBeDefined();

      expect(ds.colorTokens.border.name).toBe('Border');
      expect(ds.colorTokens.border.value).toBeDefined();

      expect(ds.colorTokens.surface.name).toBe('Surface Background');
      expect(ds.colorTokens.surface.value).toBeDefined();

      expect(ds.colorTokens.container.name).toBe('Container Background');
      expect(ds.colorTokens.container.value).toBeDefined();

      expect(ds.colorTokens.interactive.name).toBe('Interactive');
      expect(ds.colorTokens.interactive.value).toBeDefined();

      expect(ds.colorTokens.focus.name).toBe('Focus');
      expect(ds.colorTokens.focus.value).toBeDefined();

      expect(ds.colorTokens.disabled.name).toBe('Disabled');
      expect(ds.colorTokens.disabled.value).toBeDefined();
    });

    it('exports semantic text, background, and border palettes', () => {
      const data = buildSemanticDesignSystemMockData();
      const ds = buildDesignSystemSpecification(data);

      // Text tokens
      expect(ds.colorTokens.text.primary.name).toBe('Primary Text');
      expect(ds.colorTokens.text.secondary.name).toBe('Secondary Text');
      expect(ds.colorTokens.text.muted.name).toBe('Muted Text');
      expect(ds.colorTokens.text.inverse.name).toBe('Inverse Text');

      // Background tokens
      expect(ds.colorTokens.background.canvas.role).toBe('bg.canvas');
      expect(ds.colorTokens.background.surface.role).toBe('bg.surface');
      expect(ds.colorTokens.background.elevated.role).toBe('bg.elevated');
      expect(ds.colorTokens.background.container.role).toBe('bg.container');

      // Border tokens
      expect(ds.colorTokens.borderPalette.default.role).toBe('border.default');
      expect(ds.colorTokens.borderPalette.subtle.role).toBe('border.subtle');
      expect(ds.colorTokens.borderPalette.strong.role).toBe('border.strong');
      expect(ds.colorTokens.borderPalette.focus.role).toBe('border.focus');
    });
  });

  describe('2. Semantic Typography Role Generation', () => {
    it('generates all 9 standard typography roles with complete metrics', () => {
      const data = buildSemanticDesignSystemMockData();
      const ds = buildDesignSystemSpecification(data);

      const requiredRoles = ['Display', 'H1', 'H2', 'H3', 'Body', 'Caption', 'Button', 'Label', 'Small'] as const;

      requiredRoles.forEach((role) => {
        const token = ds.typographyTokens[role];
        expect(token, `Missing typography token for role: ${role}`).toBeDefined();
        expect(token.role).toBe(role);
        expect(token.fontSize.px).toBeGreaterThan(0);
        expect(token.fontSize.rem).toMatch(/rem$/);
        expect(token.fontWeight).toBeGreaterThanOrEqual(400);
        expect(token.lineHeight).toBeDefined();
        expect(token.letterSpacing).toBeDefined();
        expect(token.fontFamily).toBeDefined();
        expect(token.usage).toBeDefined();
      });
    });

    it('provides responsive clamp formulas for prominent heading roles', () => {
      const data = buildSemanticDesignSystemMockData();
      const ds = buildDesignSystemSpecification(data);

      expect(ds.typographyTokens.Display.fontSize.clamp).toContain('clamp(');
      expect(ds.typographyTokens.H1.fontSize.clamp).toContain('clamp(');
      expect(ds.typographyTokens.H2.fontSize.clamp).toContain('clamp(');
      expect(ds.typographyTokens.Body.fontSize.clamp).toContain('clamp(');
    });
  });

  describe('3. Spacing, Radius, Shadow, and Z-Index Systems', () => {
    it('exports structured semantic spacing scales and layout offsets', () => {
      const data = buildSemanticDesignSystemMockData();
      const ds = buildDesignSystemSpecification(data);

      expect(ds.spacingTokens.xs).toBe('4px');
      expect(ds.spacingTokens.sm).toBe('8px');
      expect(ds.spacingTokens.md).toBe('16px');
      expect(ds.spacingTokens.lg).toBe('24px');
      expect(ds.spacingTokens.xl).toBe('32px');
      expect(ds.spacingTokens.containerPadding).toBe('32px');
      expect(ds.spacingTokens.sectionGap).toBe('64px');
    });

    it('exports radius, shadow, and z-index elevation scales', () => {
      const data = buildSemanticDesignSystemMockData();
      const ds = buildDesignSystemSpecification(data);

      expect(ds.radiusTokens.full).toBe('9999px');
      expect(ds.shadowTokens.md).toBeDefined();
      expect(ds.zIndexTokens.modal).toBeGreaterThan(ds.zIndexTokens.sticky);
      expect(ds.zIndexTokens.tooltip).toBeGreaterThan(ds.zIndexTokens.modal);
    });
  });

  describe('4. Export Pipeline & AI Clone Package Integration', () => {
    it('exports a valid design-system.json artifact matching schema', () => {
      const data = buildSemanticDesignSystemMockData();
      const jsonStr = exportDesignSystemJson(data);

      expect(typeof jsonStr).toBe('string');
      const parsed = JSON.parse(jsonStr);

      expect(parsed.$schema).toContain('design-system-v1.json');
      expect(parsed.colorTokens).toBeDefined();
      expect(parsed.typographyTokens).toBeDefined();
      expect(parsed.spacingTokens).toBeDefined();
      expect(parsed.radiusTokens).toBeDefined();
      expect(parsed.shadowTokens).toBeDefined();
      expect(parsed.zIndexTokens).toBeDefined();
    });

    it('bundles design-system.json inside the AI Clone Package (.zip)', () => {
      const data = buildSemanticDesignSystemMockData();
      const pkg = buildAIClonePackage(data);

      expect(pkg.files['design-system.json']).toBeDefined();
      expect(pkg.manifest.files.some((f) => f.path === 'design-system.json')).toBe(true);
    });

    it('supports standalone design-system format in ArtifactExporter', () => {
      const data = buildSemanticDesignSystemMockData();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'design-system');
      expect(result.format).toBe('design-system');
      expect(result.exportedData).toBeDefined();

      const parsed = JSON.parse(result.exportedData);
      expect(parsed.colorTokens).toBeDefined();
      expect(parsed.typographyTokens).toBeDefined();
    });
  });
});
