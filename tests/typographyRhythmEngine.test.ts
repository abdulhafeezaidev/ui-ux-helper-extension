import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/domExtractor.ts';
import {
  TypographyRhythmEngine,
  buildTypographyRhythmSpecification,
} from '../src/normalization/typography/typographyRhythmEngine.ts';
import { exportTypographyJson } from '../src/output/clonePackage/typographyJsonExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
import { exportReconstructionJson } from '../src/output/clonePackage/reconstructionJsonExporter.ts';
import { exportReadmeForAi } from '../src/output/clonePackage/readmeForAiExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

function createMockTypographyPage(): AnalyzePageResponseData {
  document.body.innerHTML = `
    <div id="app" style="width: 1440px; font-family: 'Inter', sans-serif; background-color: #0d1117; color: #ffffff;">
      <!-- Hero Display -->
      <div id="hero" style="padding: 64px 32px;">
        <h1 class="hero-title display-hero" style="font-size: 48px; font-weight: 800; line-height: 56px; letter-spacing: -0.02em; margin-bottom: 16px; text-wrap: balance;">
          Next-Generation Autonomous Systems
        </h1>
        <p class="body-text lead-text" style="font-size: 16px; font-weight: 400; line-height: 24px; margin-bottom: 16px; width: 650px;">
          Build high-performance web applications with automated design system extraction, layout constraints, and deterministic component trees.
        </p>
        <button id="cta-button" class="btn btn-primary" style="font-size: 14px; font-weight: 600; line-height: 20px; letter-spacing: 0.01em; padding: 12px 24px;">
          Deploy Now
        </button>
      </div>

      <!-- Main Article with H1-H4 Heading Hierarchy -->
      <article id="content" style="padding: 32px; width: 720px;">
        <h1 id="art-h1" class="page-title" style="font-size: 38px; font-weight: 700; line-height: 48px; letter-spacing: -0.02em; margin-bottom: 16px;">
          Architecture Deep Dive
        </h1>
        <p class="body-text" style="font-size: 16px; font-weight: 400; line-height: 24px; margin-bottom: 16px;">
          The typography engine extracts authentic vertical rhythm beyond simple font sizes. Every heading is aligned to a modular 4px/8px vertical grid.
        </p>

        <h2 id="art-h2" class="section-heading" style="font-size: 30px; font-weight: 700; line-height: 38px; letter-spacing: -0.01em; margin-top: 32px; margin-bottom: 12px;">
          Modular Scale & Vertical Baseline
        </h2>
        <p class="body-text" style="font-size: 16px; font-weight: 400; line-height: 24px; margin-bottom: 16px;">
          Paragraphs maintain optimal reading widths between 45 and 75 characters per line to minimize reader fatigue.
        </p>

        <h3 id="art-h3" class="card-title" style="font-size: 24px; font-weight: 600; line-height: 32px; margin-top: 24px; margin-bottom: 8px;">
          Component Token Normalization
        </h3>
        <p class="body-text" style="font-size: 16px; font-weight: 400; line-height: 24px; margin-bottom: 16px;">
          Tokens are shared in a global dictionary to ensure high compression efficiency without losing fidelity.
        </p>

        <h4 id="art-h4" class="group-header" style="font-size: 20px; font-weight: 600; line-height: 28px; margin-top: 16px; margin-bottom: 8px;">
          Implementation Specifics
        </h4>
        <small class="caption-text footnote" style="font-size: 12px; font-weight: 400; line-height: 16px; color: #8b949e;">
          * Based on Chrome DOM computed metrics.
        </small>
      </article>

      <!-- Form Inputs & Labels -->
      <form id="contact-form" style="padding: 32px;">
        <label for="user-email" class="input-label" style="font-size: 14px; font-weight: 500; line-height: 20px; letter-spacing: 0.01em; margin-bottom: 4px;">
          Work Email
        </label>
        <input type="email" id="user-email" placeholder="name@company.com" style="font-size: 14px; font-weight: 400; line-height: 20px;" />
      </form>
    </div>
  `;

  const extractor = new DomExtractor();
  const rawResult = extractor.extract(document.body, { includeHidden: true });

  return {
    status: 'completed',
    timestamp: Date.now(),
    title: 'Autonomous Systems - Typography Rhythm Test',
    pageUrl: 'https://example.com/typography-test',
    extractionResult: rawResult,
    typographySystem: {
      hierarchy: {
        h1: { fontSizePx: 38, lineHeightPx: 48, fontWeight: 700, fontFamily: 'Inter' },
        h2: { fontSizePx: 30, lineHeightPx: 38, fontWeight: 700, fontFamily: 'Inter' },
        body: { fontSizePx: 16, lineHeightPx: 24, fontWeight: 400, fontFamily: 'Inter' },
      },
    } as any,
  };
}

describe('Typography Rhythm Engine (14_typography.json)', () => {
  it('1. Normalizes typography into structured rhythm specification with metadata', () => {
    const data = createMockTypographyPage();
    const engine = new TypographyRhythmEngine();
    const spec = engine.normalize(data);

    expect(spec.$schema).toBe('https://ui-ux-helper.internal/schemas/typography-rhythm-v1.json');
    expect(spec.version).toBe('1.0.0');
    expect(spec.target.title).toBe('Autonomous Systems - Typography Rhythm Test');
    expect(spec.summary.totalRolesIdentified).toBe(9);
    expect(spec.summary.totalTextElementsScanned).toBeGreaterThan(5);
    expect(spec.summary.verticalBaselineGrid).toContain('4px / 8px');
    expect(Array.isArray(spec.metadata.guidanceForAI)).toBe(true);
  });

  it('2. Captures all 9 semantic typography roles: Display, H1, H2, H3, H4, Body, Caption, Button, Label', () => {
    const data = createMockTypographyPage();
    const spec = buildTypographyRhythmSpecification(data);

    const requiredRoles = ['display', 'h1', 'h2', 'h3', 'h4', 'body', 'caption', 'button', 'label'];
    requiredRoles.forEach((role) => {
      expect(spec.roleRegistry[role], `Missing role in registry: ${role}`).toBeDefined();
      expect(spec.roleRegistry[role].role).toBe(role);
      expect(spec.roleRegistry[role].displayName).toBeDefined();
      expect(spec.roleRegistry[role].fontFamily).toBeDefined();
      expect(spec.roleRegistry[role].fontSizePx).toBeGreaterThan(0);
      expect(spec.roleRegistry[role].lineHeightPx).toBeGreaterThan(0);
    });
  });

  it('3. Extracts complete 15-property specification for every role', () => {
    const data = createMockTypographyPage();
    const spec = buildTypographyRhythmSpecification(data);

    const displayRole = spec.roleRegistry['display'];
    expect(displayRole.fontSizePx).toBe(48);
    expect(displayRole.fontSizeRem).toBe('3rem');
    expect(displayRole.fontWeight).toBe(800);
    expect(displayRole.lineHeightPx).toBe(56);
    expect(displayRole.lineHeightRatio).toBe(1.17);
    expect(displayRole.letterSpacing).toBe('-0.02em');
    expect(displayRole.textWrap).toBe('balance');
    expect(displayRole.textTransform).toBe('none');
    expect(displayRole.textAlign).toBe('left');
    expect(displayRole.textOverflow).toBe('clip');
    expect(displayRole.whiteSpace).toBe('normal');

    // Baseline rhythm
    expect(displayRole.baselineRhythm).toBeDefined();
    expect(displayRole.baselineRhythm.gridBasePx).toBe(4);
    expect(displayRole.baselineRhythm.lineHeightToFontSizeRatio).toBe(1.17);
    expect(displayRole.baselineRhythm.verticalGridAlignment).toBe('aligned-to-8px-grid'); // 56 % 8 === 0

    // Spacing
    expect(displayRole.headingSpacing).toBeDefined();
    expect(displayRole.headingSpacing.marginBottomPx).toBe(16);
    expect(displayRole.paragraphSpacing).toBeDefined();

    // Reading width
    expect(displayRole.readingWidth).toBeDefined();
    expect(displayRole.readingWidth.computedWidthPx).toBeGreaterThan(0);
  });

  it('4. Computes baseline rhythm and modular 4px/8px grid alignment', () => {
    const data = createMockTypographyPage();
    const spec = buildTypographyRhythmSpecification(data);

    const bodyRole = spec.roleRegistry['body'];
    expect(bodyRole.fontSizePx).toBe(16);
    expect(bodyRole.lineHeightPx).toBe(24);
    expect(bodyRole.lineHeightRatio).toBe(1.5);
    expect(bodyRole.baselineRhythm.verticalGridAlignment).toBe('aligned-to-8px-grid'); // 24 % 8 === 0
    expect(bodyRole.baselineRhythm.modularStep).toBe(6); // 24 / 4 = 6
  });

  it('5. Computes paragraph spacing and heading vertical margins with ratios to body', () => {
    const data = createMockTypographyPage();
    const spec = buildTypographyRhythmSpecification(data);

    const h2Role = spec.roleRegistry['h2'];
    expect(h2Role.headingSpacing.marginTopPx).toBe(32);
    expect(h2Role.headingSpacing.marginBottomPx).toBe(12);
    expect(h2Role.headingSpacing.ratioToBody).toBe(0.75); // 12 / 16 = 0.75
  });

  it('6. Measures reading width and optimal character capacity (45-75 ch)', () => {
    const data = createMockTypographyPage();
    const spec = buildTypographyRhythmSpecification(data);

    const bodyRole = spec.roleRegistry['body'];
    expect(bodyRole.readingWidth.optimalChWidth).toBe('65ch');
    expect(bodyRole.readingWidth.maxCharactersPerLine).toBeGreaterThanOrEqual(45);
    expect(bodyRole.readingWidth.maxCharactersPerLine).toBeLessThanOrEqual(95);
    expect(bodyRole.tailwindClasses).toContain('max-w-prose');
  });

  it('7. Automatically detects modular heading scale ratio', () => {
    const data = createMockTypographyPage();
    const spec = buildTypographyRhythmSpecification(data);

    expect(spec.modularScale).toBeDefined();
    expect(spec.modularScale.baseFontSizePx).toBe(16);
    expect(spec.modularScale.detectedRatio).toBeGreaterThan(1.1);
    expect(spec.modularScale.ratioName).toBeDefined();
    expect(spec.modularScale.scaleSteps['display']).toBe(48);
    expect(spec.modularScale.scaleSteps['h1']).toBe(38);
    expect(spec.modularScale.scaleSteps['h2']).toBe(30);
    expect(spec.modularScale.scaleSteps['h3']).toBe(24);
    expect(spec.modularScale.scaleSteps['h4']).toBe(20);
    expect(spec.modularScale.scaleSteps['body']).toBe(16);
  });

  it('8. Generates high-fidelity Tailwind utility classes and CSS snippet blocks', () => {
    const data = createMockTypographyPage();
    const spec = buildTypographyRhythmSpecification(data);

    const displayRole = spec.roleRegistry['display'];
    expect(displayRole.tailwindClasses).toContain('text-5xl');
    expect(displayRole.tailwindClasses).toContain('font-extrabold');
    expect(displayRole.tailwindClasses).toContain('tracking-tight');
    expect(displayRole.tailwindClasses).toContain('leading-tight');
    expect(displayRole.tailwindClasses).toContain('text-balance');

    expect(displayRole.cssSnippet).toContain('font-family:');
    expect(displayRole.cssSnippet).toContain('font-size: 3rem; /* 48px */');
    expect(displayRole.cssSnippet).toContain('line-height: 56px;');
  });

  it('9. exportTypographyJson generates valid 14_typography.json', () => {
    const data = createMockTypographyPage();
    const jsonStr = exportTypographyJson(data);

    expect(typeof jsonStr).toBe('string');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.$schema).toBeDefined();
    expect(parsed.summary.totalRolesIdentified).toBe(9);
    expect(parsed.roleRegistry).toBeDefined();
    expect(parsed.modularScale).toBeDefined();
    expect(Array.isArray(parsed.roles)).toBe(true);
    expect(Array.isArray(parsed.metadata.guidanceForAI)).toBe(true);
  });

  it('10. AI Clone Package (.zip) builder includes 14_typography.json in canonical package and manifest', () => {
    const data = createMockTypographyPage();
    const pkg = buildAIClonePackage(data);

    expect(pkg.files['14_typography.json']).toBeDefined();
    expect(pkg.files['typography-rhythm.json']).toBeDefined();
    expect(pkg.manifest.totalFiles).toBe(19);

    const reconstructionJson = exportReconstructionJson(data);
    const recParsed = JSON.parse(reconstructionJson);
    expect(recParsed.packageManifest.totalArtifacts).toBe(19);
    const hasTypographyArtifact = recParsed.packageManifest.artifacts.some((a: any) => a.file === '14_typography.json');
    expect(hasTypographyArtifact).toBe(true);

    const readme = exportReadmeForAi(data);
    expect(readme).toContain('14_typography.json');
    expect(readme).toContain('Step 1: Initialize Theme, Typography & Styles');
  });

  it('11. ArtifactExporter handles typography-rhythm and 14_typography export format dispatch', () => {
    const data = createMockTypographyPage();
    const exporter = new ArtifactExporter();

    const res1 = exporter.export(data, 'typography-rhythm');
    expect(res1.format).toBe('typography-rhythm');
    expect(res1.exportedData).toBeDefined();
    const parsed1 = JSON.parse(res1.exportedData);
    expect(parsed1.roleRegistry).toBeDefined();

    const res2 = exporter.export(data, '14_typography');
    expect(res2.format).toBe('14_typography');
    expect(res2.exportedData).toBeDefined();
  });
});
