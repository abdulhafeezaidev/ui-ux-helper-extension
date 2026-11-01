import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/domExtractor.ts';
import {
  ComponentVariantEngine,
  buildComponentVariantSpecification,
} from '../src/normalization/component/componentVariantEngine.ts';
import { exportVariantsJson } from '../src/output/clonePackage/variantsJsonExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
import { exportReconstructionJson } from '../src/output/clonePackage/reconstructionJsonExporter.ts';
import { exportReadmeForAi } from '../src/output/clonePackage/readmeForAiExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

function createMockComponentVariantPage(): AnalyzePageResponseData {
  document.body.innerHTML = `
    <div id="app" style="width: 1440px; font-family: 'Inter', sans-serif;">
      <!-- Buttons Section -->
      <section id="button-section" style="padding: 32px;">
        <button id="btn-primary" class="btn btn-primary" style="background-color: #2563eb; color: #ffffff; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Primary Action
        </button>
        <button id="btn-secondary" class="btn btn-secondary" style="background-color: #f3f4f6; color: #111827; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Secondary Action
        </button>
        <button id="btn-outlined" class="btn btn-outlined" style="background-color: transparent; border: 1px solid #2563eb; color: #2563eb; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Outlined Action
        </button>
        <button id="btn-ghost" class="btn btn-ghost" style="background-color: transparent; border: none; color: #2563eb; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Ghost Action
        </button>
        <button id="btn-sm" class="btn btn-primary btn-sm" style="background-color: #2563eb; color: #ffffff; padding: 6px 12px; border-radius: 8px; font-size: 12px;">
          Small Action
        </button>
        <button id="btn-lg" class="btn btn-primary btn-lg" style="background-color: #2563eb; color: #ffffff; padding: 14px 24px; border-radius: 8px; font-size: 16px;">
          Large Action
        </button>
        <button id="btn-disabled" class="btn btn-primary" disabled style="background-color: #2563eb; color: #ffffff; opacity: 0.5; cursor: not-allowed;">
          Disabled Action
        </button>
      </section>

      <!-- Cards Section -->
      <section id="card-section" style="padding: 32px;">
        <div id="card-standard" class="card card-standard" style="background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3>Standard Card</h3>
        </div>
        <div id="card-elevated" class="card card-elevated" style="background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 10px 15px rgba(0,0,0,0.1);">
          <h3>Elevated Card</h3>
        </div>
      </section>

      <!-- Badges Section -->
      <section id="badge-section" style="padding: 32px;">
        <span id="badge-filled" class="badge badge-filled" style="background-color: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 9999px; font-size: 12px;">
          New Feature
        </span>
        <span id="badge-outlined" class="badge badge-outlined" style="background-color: transparent; border: 1px solid #1d4ed8; color: #1d4ed8; padding: 2px 8px; border-radius: 9999px; font-size: 12px;">
          Beta
        </span>
      </section>
    </div>
  `;

  const extractor = new DomExtractor();
  const rawResult = extractor.extract(document.body, { includeHidden: true });

  return {
    status: 'completed',
    timestamp: Date.now(),
    title: 'Component Variant Engine Test Page',
    pageUrl: 'https://example.com/variants-test',
    extractionResult: rawResult,
    colorSystem: {
      palette: [
        { role: 'primary', hex: '#2563eb' },
        { role: 'textPrimary', hex: '#ffffff' },
      ],
    } as any,
    componentSystem: {
      stats: { totalComponents: 3 },
      components: [
        { id: 'comp_btn', type: 'button', rootElementId: 'btn-primary', childElementIds: [], evidence: [], bounds: { left: 0, top: 0, width: 120, height: 40, right: 120, bottom: 40 } },
        { id: 'comp_crd', type: 'card', rootElementId: 'card-standard', childElementIds: [], evidence: [], bounds: { left: 0, top: 100, width: 300, height: 200, right: 300, bottom: 300 } },
        { id: 'comp_bdg', type: 'badge', rootElementId: 'badge-filled', childElementIds: [], evidence: [], bounds: { left: 0, top: 350, width: 80, height: 24, right: 80, bottom: 374 } },
      ],
    } as any,
  };
}

describe('Component Variant Engine (15_variants.json)', () => {
  it('1. Normalizes component variants into structured specification with metadata', () => {
    const data = createMockComponentVariantPage();
    const engine = new ComponentVariantEngine();
    const spec = engine.normalize(data);

    expect(spec.$schema).toBe('https://ui-ux-helper.internal/schemas/variants-v1.json');
    expect(spec.version).toBe('1.0.0');
    expect(spec.target.title).toBe('Component Variant Engine Test Page');
    expect(spec.summary.totalBaseComponents).toBeGreaterThanOrEqual(1);
    expect(spec.summary.totalVariantsDetected).toBeGreaterThanOrEqual(16);
    expect(spec.summary.intentVariantsCount).toBeGreaterThanOrEqual(6);
    expect(spec.summary.sizeVariantsCount).toBeGreaterThanOrEqual(3);
    expect(spec.summary.stateVariantsCount).toBeGreaterThanOrEqual(7);
    expect(spec.summary.cvaReadyComponents).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(spec.metadata.guidanceForAI)).toBe(true);
  });

  it('2. Detects all 6 Intent variants: Primary, Secondary, Outlined, Ghost, Filled, Elevated', () => {
    const data = createMockComponentVariantPage();
    const spec = buildComponentVariantSpecification(data);

    const firstComp = Object.values(spec.components)[0];
    expect(firstComp).toBeDefined();

    const requiredIntents = ['primary', 'secondary', 'outlined', 'ghost', 'filled', 'elevated'];
    requiredIntents.forEach((intent) => {
      const variant = firstComp.variants.intent[intent];
      expect(variant, `Missing intent variant: ${intent}`).toBeDefined();
      expect(variant.variantName).toBe(intent);
      expect(variant.variantType).toBe('intent');
      expect(variant.overriddenProperties).toBeDefined();
      expect(Array.isArray(variant.tailwindDelta)).toBe(true);
      expect(variant.tailwindDelta.length).toBeGreaterThan(0);
      expect(variant.cssOverridesSnippet).toContain(intent);
    });
  });

  it('3. Detects all 3 Size variants: Small, Medium, Large', () => {
    const data = createMockComponentVariantPage();
    const spec = buildComponentVariantSpecification(data);

    const firstComp = Object.values(spec.components)[0];
    expect(firstComp).toBeDefined();

    const requiredSizes = ['small', 'medium', 'large'];
    requiredSizes.forEach((size) => {
      const variant = firstComp.variants.size[size];
      expect(variant, `Missing size variant: ${size}`).toBeDefined();
      expect(variant.variantName).toBe(size);
      expect(variant.variantType).toBe('size');
      expect(variant.overriddenProperties.padding).toBeDefined();
      expect(variant.overriddenProperties.fontSize).toBeDefined();
      expect(variant.overriddenProperties.lineHeight).toBeDefined();
    });

    // Size delta comparisons (small < medium < large)
    const sm = firstComp.variants.size['small'];
    const lg = firstComp.variants.size['large'];
    expect(parseInt(sm.overriddenProperties.fontSize, 10)).toBeLessThan(parseInt(lg.overriddenProperties.fontSize, 10));
  });

  it('4. Detects all 7 State variants: Disabled, Loading, Hover, Focus, Pressed, Selected, Active', () => {
    const data = createMockComponentVariantPage();
    const spec = buildComponentVariantSpecification(data);

    const firstComp = Object.values(spec.components)[0];
    expect(firstComp).toBeDefined();

    const requiredStates = ['disabled', 'loading', 'hover', 'focus', 'pressed', 'selected', 'active'];
    requiredStates.forEach((state) => {
      const variant = firstComp.variants.state[state];
      expect(variant, `Missing state variant: ${state}`).toBeDefined();
      expect(variant.variantName).toBe(state);
      expect(variant.variantType).toBe('state');
      expect(variant.overriddenProperties).toBeDefined();
    });

    // Specific state assertions
    expect(firstComp.variants.state['disabled'].overriddenProperties.opacity).toBe(0.5);
    expect(firstComp.variants.state['disabled'].overriddenProperties.cursor).toBe('not-allowed');
    expect(firstComp.variants.state['loading'].overriddenProperties.cursor).toBe('wait');
    expect(firstComp.variants.state['pressed'].overriddenProperties.transform).toContain('scale');
  });

  it('5. Enforces variant inheritance from base component with delta-only overrides', () => {
    const data = createMockComponentVariantPage();
    const spec = buildComponentVariantSpecification(data);

    const firstComp = Object.values(spec.components)[0];
    expect(firstComp.baseStyles).toBeDefined();
    expect(firstComp.baseStyles.display).toBeDefined();
    expect(firstComp.baseStyles.fontFamily).toBeDefined();
    expect(firstComp.baseStyles.borderRadius).toBeDefined();

    // Outlined should override border & background
    const outlined = firstComp.variants.intent['outlined'];
    expect(outlined.overriddenProperties.backgroundColor).toBe('transparent');
    expect(outlined.overriddenProperties.border).toContain('1px solid');
  });

  it('6. Generates production-ready Class Variance Authority (CVA) code snippet', () => {
    const data = createMockComponentVariantPage();
    const spec = buildComponentVariantSpecification(data);

    const firstComp = Object.values(spec.components)[0];
    expect(firstComp.cvaCode).toBeDefined();
    expect(firstComp.cvaCode).toContain('import { cva, type VariantProps } from "class-variance-authority"');
    expect(firstComp.cvaCode).toContain('variants: {');
    expect(firstComp.cvaCode).toContain('intent: {');
    expect(firstComp.cvaCode).toContain('size: {');
    expect(firstComp.cvaCode).toContain('defaultVariants: {');
    expect(firstComp.cvaCode).toContain('intent: "primary"');
    expect(firstComp.cvaCode).toContain('size: "medium"');
  });

  it('7. exportVariantsJson produces valid 15_variants.json payload', () => {
    const data = createMockComponentVariantPage();
    const jsonStr = exportVariantsJson(data);

    expect(typeof jsonStr).toBe('string');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.$schema).toBeDefined();
    expect(parsed.summary.totalBaseComponents).toBeGreaterThan(0);
    expect(parsed.summary.totalVariantsDetected).toBeGreaterThanOrEqual(16);
    expect(parsed.components).toBeDefined();
    expect(Array.isArray(parsed.metadata.guidanceForAI)).toBe(true);
  });

  it('8. AI Clone Package (.zip) builder includes 15_variants.json in canonical package and manifest', () => {
    const data = createMockComponentVariantPage();
    const pkg = buildAIClonePackage(data);

    expect(pkg.files['15_variants.json']).toBeDefined();
    expect(pkg.files['component-variants.json']).toBeDefined();
    expect(pkg.manifest.totalFiles).toBe(19);

    const reconstructionJson = exportReconstructionJson(data);
    const recParsed = JSON.parse(reconstructionJson);
    expect(recParsed.packageManifest.totalArtifacts).toBe(19);
    const hasVariantsArtifact = recParsed.packageManifest.artifacts.some((a: any) => a.file === '15_variants.json');
    expect(hasVariantsArtifact).toBe(true);

    const readme = exportReadmeForAi(data);
    expect(readme).toContain('15_variants.json');
    expect(readme).toContain('Step 2: Build Component Library');
  });

  it('9. ArtifactExporter handles component-variants and 15_variants export format dispatch', () => {
    const data = createMockComponentVariantPage();
    const exporter = new ArtifactExporter();

    const res1 = exporter.export(data, 'component-variants');
    expect(res1.format).toBe('component-variants');
    expect(res1.exportedData).toBeDefined();
    const parsed1 = JSON.parse(res1.exportedData);
    expect(parsed1.components).toBeDefined();

    const res2 = exporter.export(data, '15_variants');
    expect(res2.format).toBe('15_variants');
    expect(res2.exportedData).toBeDefined();
  });
});
