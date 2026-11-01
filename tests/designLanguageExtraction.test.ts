import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/domExtractor.ts';
import { ColorNormalizer } from '../src/normalization/color/colorNormalizer.ts';
import { TypographyNormalizer } from '../src/normalization/typography/typographyNormalizer.ts';
import { ShapeNormalizer } from '../src/normalization/shape/shapeNormalizer.ts';
import { LayoutNormalizer } from '../src/normalization/layout/layoutNormalizer.ts';
import { ComponentNormalizer } from '../src/normalization/component/componentNormalizer.ts';
import { DesignPrinciplesEngine } from '../src/normalization/theme/designPrinciplesEngine.ts';
import { ComponentStyleEngine } from '../src/normalization/theme/componentStyleEngine.ts';
import { buildDesignLanguagePackage } from '../src/output/designLanguage/designLanguagePackageBuilder.ts';
import { exportApplyThemePrompt } from '../src/output/designLanguage/applyThemePromptExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

function createMockReferenceStore(): AnalyzePageResponseData {
  document.body.innerHTML = `
    <div id="app" style="width: 1440px; font-family: 'Inter', -apple-system, sans-serif; background-color: rgb(15, 23, 42); color: rgb(248, 250, 252);">
      <nav id="header-nav" class="navbar sticky" role="navigation" style="display: flex; justify-content: space-between; padding: 16px 32px; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(12px); border-bottom: 1px solid rgb(51, 65, 85);">
        <a href="/" class="brand-logo" style="font-weight: 800; font-size: 20px; color: rgb(248, 250, 252);">Apex Lifestyle</a>
        <div class="nav-links" style="display: flex; gap: 20px;">
          <a href="/smartwatches" class="nav-link" style="color: rgb(148, 163, 184); font-size: 14px;">Smartwatches</a>
          <a href="/audio" class="nav-link" style="color: rgb(148, 163, 184); font-size: 14px;">Audio</a>
        </div>
      </nav>
      <header id="hero" class="hero" style="padding: 96px 32px; text-align: center; background: rgb(30, 41, 59);">
        <h1 class="hero-title" style="font-size: 56px; font-weight: 800; line-height: 1.1; margin-bottom: 20px;">
          Next Gen Smart Wearables
        </h1>
        <p class="hero-subtitle" style="font-size: 20px; color: rgb(148, 163, 184); max-width: 680px; margin: 0 auto 36px;">
          Experience uncompromising precision engineering with titanium aerospace alloy.
        </p>
        <button id="hero-buy-btn" class="btn btn-primary" style="padding: 14px 28px; background-color: rgb(59, 130, 246); color: white; border-radius: 8px; font-weight: 700; border: none; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
          Order Now — $299.00
        </button>
      </header>
      <section id="products" class="product-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 64px 32px;">
        <div class="product-card" style="background: rgb(30, 41, 59); border: 1px solid rgb(51, 65, 85); border-radius: 12px; padding: 24px;">
          <img src="/watch1.png" alt="Apex Pro Ultra Watch" style="width: 100%; height: 200px; object-fit: cover;" />
          <h3 class="product-name" style="font-size: 18px; font-weight: 700; margin: 12px 0;">Apex Pro Ultra Titanium</h3>
          <p class="product-price" style="font-size: 22px; font-weight: 800; color: rgb(59, 130, 246);">$399.00</p>
          <button class="btn btn-cart" style="width: 100%; padding: 10px; background: rgb(59, 130, 246); color: white; border-radius: 6px; font-weight: 600;">Add to Cart</button>
        </div>
      </section>
      <footer id="footer" style="padding: 48px 32px; background: rgb(2, 6, 23); text-align: center; color: rgb(100, 116, 139);">
        <p>© 2026 Apex Lifestyle Global Corp. All rights reserved.</p>
      </footer>
    </div>
  `;

  const rawResult = new DomExtractor().extract(document.body, { includeHidden: true });
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
    timestamp: Date.now(),
    pageUrl: 'https://example.com/reference-store',
    title: 'Apex Lifestyle Store',
    extractionResult: rawResult,
    colorSystem,
    typographySystem,
    shapeSystem,
    layoutSystem,
    componentSystem,
  };
}

describe('Design Language Extraction & Theme Transfer Mode', () => {
  it('1. DesignPrinciplesEngine infers high-level personality traits and guidelines', () => {
    const data = createMockReferenceStore();
    const engine = new DesignPrinciplesEngine();
    const principles = engine.inferPrinciples(data);

    expect(principles.$schema).toBe('https://ui-ux-helper.internal/schemas/design-principles-v1.json');
    expect(principles.traits.length).toBeGreaterThanOrEqual(3);
    expect(principles.traits).toContain('dark');
    expect(principles.contrastStyle).toBeDefined();
    expect(principles.cornerStyle).toBeDefined();
    expect(principles.surfaceElevation).toBeDefined();
    expect(principles.designRules.length).toBeGreaterThanOrEqual(3);

    const md = engine.generateMarkdown(principles);
    expect(md).toContain('# Design Principles & Visual Language');
    expect(md).toContain('Theme Transfer Guardrail');
    expect(md).toContain('Do NOT clone or copy text');
  });

  it('2. ComponentStyleEngine extracts clean, content-stripped component design systems', () => {
    const data = createMockReferenceStore();
    const engine = new ComponentStyleEngine();
    const styles = engine.extractComponentStyles(data);

    expect(styles.$schema).toBe('https://ui-ux-helper.internal/schemas/component-styles-v1.json');
    expect(styles.buttons.variants.primary).toBeDefined();
    expect(styles.buttons.variants.primary.bg).toBeDefined();
    expect(styles.buttons.variants.primary.hoverBg).toBeDefined();
    expect(styles.buttons.variants.primary.activeScale).toBe('scale(0.98)');
    expect(styles.buttons.sizes.sm).toBeDefined();
    expect(styles.buttons.sizes.lg).toBeDefined();

    expect(styles.forms.input).toBeDefined();
    expect(styles.forms.input.focusBorder).toBeDefined();
    expect(styles.forms.label).toBeDefined();

    expect(styles.cards.variants.elevated).toBeDefined();
    expect(styles.cards.variants.interactive.hoverTransform).toBe('translateY(-4px)');

    expect(styles.navigation.navbar.backdropBlur).toBe('12px');
    expect(styles.navigation.navbar.isSticky).toBe(true);

    expect(styles.icons.strokeWidth).toBeDefined();
    expect(styles.badges.success).toBeDefined();
  });

  it('3. AI_Apply_Theme.md prompt explicitly mandates content preservation and non-cloning', () => {
    const data = createMockReferenceStore();
    const engine = new DesignPrinciplesEngine();
    const principles = engine.inferPrinciples(data);
    const prompt = exportApplyThemePrompt(data, principles);

    expect(prompt).toContain('# AI Theme Transfer Guide — Apply Design Language');
    expect(prompt).toContain('DO NOT CLONE OR RECREATE THE REFERENCE WEBSITE');
    expect(prompt).toContain('Keep ALL Existing Content');
    expect(prompt).toContain('Keep ALL Existing Functionality');
    expect(prompt).toContain('Keep ALL Existing Assets');
    expect(prompt).toContain('Transform ONLY Visual Styling');
  });

  it('4. buildDesignLanguagePackage packages 17 canonical theme files in DesignLanguagePackage.zip', () => {
    const data = createMockReferenceStore();
    const pkg = buildDesignLanguagePackage(data);

    expect(pkg.manifest.mode).toBe('design-language-theme-transfer');
    expect(pkg.manifest.totalFiles).toBe(17);
    expect(pkg.files['design-system.json']).toBeDefined();
    expect(pkg.files['color-palette.json']).toBeDefined();
    expect(pkg.files['typography.json']).toBeDefined();
    expect(pkg.files['spacing.json']).toBeDefined();
    expect(pkg.files['layout-rules.json']).toBeDefined();
    expect(pkg.files['component-styles.json']).toBeDefined();
    expect(pkg.files['button-system.json']).toBeDefined();
    expect(pkg.files['form-system.json']).toBeDefined();
    expect(pkg.files['navigation-system.json']).toBeDefined();
    expect(pkg.files['card-system.json']).toBeDefined();
    expect(pkg.files['icon-style.json']).toBeDefined();
    expect(pkg.files['motion-system.json']).toBeDefined();
    expect(pkg.files['responsive-rules.json']).toBeDefined();
    expect(pkg.files['design-principles.md']).toBeDefined();
    expect(pkg.files['AI_Apply_Theme.md']).toBeDefined();
    expect(pkg.files['styles/css-variables.css']).toBeDefined();
    expect(pkg.files['styles/tailwind.config.js']).toBeDefined();

    expect(pkg.zipBuffer.length).toBeGreaterThan(500);
    expect(pkg.base64.length).toBeGreaterThan(500);
  });

  it('5. Guardrail check: Design Language files contain zero marketing copy, prices, or product titles', () => {
    const data = createMockReferenceStore();
    const pkg = buildDesignLanguagePackage(data);

    // Verify component, button, and card systems do not contain product copy or prices
    const btnSystem = pkg.files['button-system.json'];
    const cardSystem = pkg.files['card-system.json'];
    const formSystem = pkg.files['form-system.json'];
    const colorPalette = pkg.files['color-palette.json'];

    expect(btnSystem).not.toContain('Apex Pro Ultra');
    expect(btnSystem).not.toContain('Order Now');
    expect(btnSystem).not.toContain('$299');

    expect(cardSystem).not.toContain('Apex Pro Ultra Titanium');
    expect(cardSystem).not.toContain('$399');
    expect(cardSystem).not.toContain('watch1.png');

    expect(formSystem).not.toContain('Smartwatches');
    expect(colorPalette).not.toContain('Aerospace alloy');
  });

  it('6. ArtifactExporter dispatches design-language-package and related formats correctly', () => {
    const data = createMockReferenceStore();
    const exporter = new ArtifactExporter();

    const resPkg = exporter.export(data, 'design-language-package');
    expect(resPkg.format).toBe('design-language-package');
    expect(resPkg.base64Zip).toBeDefined();
    expect(resPkg.artifacts['button-system.json']).toBeDefined();

    const resPrinciples = exporter.export(data, 'design-principles');
    expect(resPrinciples.format).toBe('design-principles');
    expect(resPrinciples.exportedData).toContain('Design Principles & Visual Language');

    const resPrompt = exporter.export(data, 'theme-prompt');
    expect(resPrompt.format).toBe('theme-prompt');
    expect(resPrompt.exportedData).toContain('AI Theme Transfer Guide');
  });
});
