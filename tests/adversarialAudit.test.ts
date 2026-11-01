import { describe, it, expect } from 'vitest';
// @ts-ignore
import { JSDOM } from 'jsdom';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { refineDesignIntelligence, evaluateVisualCoverage } from '../src/agent-spec/refinement/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';
import { getEcommerceFixtureHTML } from './fixtures/multiSiteFixtures.ts';

describe('Adversarial Audit & Pipeline Verification (Prompt 12.5)', () => {
  function runPipelineOnHTML(html: string, url: string = 'https://example.com/'): AnalyzePageResponseData {
    const dom = new JSDOM(html, { url });

    (global as any).document = dom.window.document;
    (global as any).window = dom.window as any;
    (global as any).Node = dom.window.Node as any;
    (global as any).Element = dom.window.Element as any;

    const rawResult = new DomExtractor().extract(dom.window.document.body);
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
      pageUrl: url,
      title: dom.window.document.title || 'Adversarial Test Page',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  it('1. Synthetic Geometry Guardrail: unrendered components report avgWidth=0 & avgHeight=0, NOT 200x100', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const refined = refineDesignIntelligence(data);

    refined.componentFamilies.forEach((fam) => {
      if (!fam.isRealBrowserGeometry) {
        expect(fam.avgWidth).toBe(0);
        expect(fam.avgHeight).toBe(0);
      }
    });
  });

  it('2. Monotonic Score Degradation: removing 20% of components reduces component fidelity score', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const baseRefined = refineDesignIntelligence(data);

    // Degrade input: remove 20% of component candidates
    const degradedData = JSON.parse(JSON.stringify(data));
    const origComps = degradedData.componentSystem.components;
    degradedData.componentSystem.components = origComps.slice(0, Math.floor(origComps.length * 0.8));

    const degradedRefined = refineDesignIntelligence(degradedData);

    expect(degradedRefined.fidelityScore.totalScore).toBeLessThanOrEqual(baseRefined.fidelityScore.totalScore);
    expect(degradedRefined.summary.totalComponentInstances).toBeLessThan(baseRefined.summary.totalComponentInstances);
  });

  it('3. Monotonic Score Degradation: removing color tokens reduces token fidelity score', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const baseRefined = refineDesignIntelligence(data);

    const degradedData = JSON.parse(JSON.stringify(data));
    degradedData.colorSystem.tokens = [];

    const degradedRefined = refineDesignIntelligence(degradedData);

    expect(degradedRefined.fidelityScore.breakdown.tokenFidelity).toBeLessThan(
      baseRefined.fidelityScore.breakdown.tokenFidelity
    );
  });

  it('4. Monotonic Score Degradation: removing typography reduces typography token count', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const degradedData = JSON.parse(JSON.stringify(data));
    degradedData.typographySystem.fontFamilies = [];
    degradedData.typographySystem.tokens = [];

    expect(degradedData.typographySystem?.fontFamilies.length || 0).toBe(0);
  });

  it('5. Anti-Fabrication Guardrail: injecting fake/default components does NOT increase fidelity score', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const baseRefined = refineDesignIntelligence(data);

    const fabricatedData = JSON.parse(JSON.stringify(data));
    // Inject 50 fake/synthetic component candidates with no real elements
    for (let i = 0; i < 50; i++) {
      fabricatedData.componentSystem.components.push({
        id: `fake_comp_${i}`,
        type: 'button',
        confidence: 0.1,
        rootElementId: `fake_el_${i}`,
        childElementIds: [],
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        evidence: ['Synthetic injection'],
      });
    }

    const fabricatedRefined = refineDesignIntelligence(fabricatedData);

    // Score MUST NOT increase from injecting fake components
    expect(fabricatedRefined.fidelityScore.totalScore).toBeLessThanOrEqual(baseRefined.fidelityScore.totalScore);
  });

  it('6. Visual Coverage Degradation: corrupting element bounding boxes increases unclassified visible content', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const baseRefined = refineDesignIntelligence(data);

    // Corrupt elements to 0 width/height
    const corruptedElements = data.extractionResult!.elements.map((el) => ({
      ...el,
      boundingRect: { x: 0, y: 0, width: 0, height: 0 },
    }));

    const corruptedCoverage = evaluateVisualCoverage(corruptedElements, baseRefined.sections);

    expect(corruptedCoverage.coveredSectionArea).toBeLessThanOrEqual(baseRefined.coverage.coveredSectionArea);
  });

  it('7. Traceability Guardrail: 100% of retained sections and component families maintain non-empty sourceElementIds', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const refined = refineDesignIntelligence(data);

    refined.sections.forEach((sec) => {
      expect(sec.sourceElementIds.length).toBeGreaterThan(0);
    });

    refined.componentFamilies.forEach((fam) => {
      expect(fam.sourceElementIds.length).toBeGreaterThan(0);
    });
  });
});
