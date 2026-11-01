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
import { refineDesignIntelligence, computeComponentSimilarity, refineSectionsDetailed } from '../src/agent-spec/refinement/index.ts';
import { buildAgentDesignSpecification, exportAdsContext } from '../src/agent-spec/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';
import { getEcommerceFixtureHTML, getSaasLandingFixtureHTML } from './fixtures/multiSiteFixtures.ts';

describe('Prompt 12 — Real Browser Fidelity Audit & ADS Accuracy Gate', () => {
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
      title: dom.window.document.title || 'Fidelity Test Page',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  it('1. Browser geometry capture: extracts element tags, visibility, and layout bounding rects', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    expect(data.extractionResult?.elements.length).toBeGreaterThan(0);
    const el = data.extractionResult?.elements[0];
    expect(el).toBeDefined();
    expect(el?.id).toBeDefined();
    expect(el?.tagName).toBeDefined();
    expect(el?.boundingRect).toBeDefined();
  });

  it('2. Section visual coverage: evaluates section coverage area with unclassified content <= 10%', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const refined = refineDesignIntelligence(data);

    expect(refined.coverage).toBeDefined();
    expect(refined.coverage.retainedSectionCoveragePct).toBeGreaterThanOrEqual(90.0);
    expect(refined.coverage.unclassifiedVisibleContentPct).toBeLessThanOrEqual(10.0);
    expect(refined.coverage.isCoverageValid).toBe(true);
  });

  it('3. Section suppression classification: logs exact categories (TRUE_WRAPPER_DUPLICATE, LOW_CONFIDENCE, etc.)', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const detailed = refineSectionsDetailed(data.componentSystem?.sections || [], data.extractionResult?.elements || []);

    expect(detailed.retained.length).toBeGreaterThan(0);
    expect(detailed.suppressed).toBeDefined();
    detailed.suppressed.forEach((log) => {
      expect([
        'TRUE_WRAPPER_DUPLICATE',
        'NESTED_REAL_SECTION',
        'EMPTY_STRUCTURAL_WRAPPER',
        'LOW_CONFIDENCE',
        'REDUNDANT_SEMANTIC_REGION',
      ]).toContain(log.category);
      expect(log.reason).toBeDefined();
    });
  });

  it('4. Component family false-merge prevention: guarantees pairwise similarity is 0.0 for cross-type components', () => {
    const buttonSig = {
      type: 'button',
      width: 120,
      height: 40,
      aspectRatio: 3.0,
      isRealBrowserGeometry: true,
      hasImage: false,
      hasHeading: false,
      hasButton: true,
      backgroundColor: 'blue',
      color: 'white',
      fontSize: '14px',
      fontWeight: '600',
      borderRadius: '6px',
      boxShadow: 'none',
      childCount: 1,
    };

    const cardSig = {
      type: 'card',
      width: 120,
      height: 40,
      aspectRatio: 3.0,
      isRealBrowserGeometry: true,
      hasImage: false,
      hasHeading: false,
      hasButton: true,
      backgroundColor: 'blue',
      color: 'white',
      fontSize: '14px',
      fontWeight: '600',
      borderRadius: '6px',
      boxShadow: 'none',
      childCount: 1,
    };

    expect(computeComponentSimilarity(buttonSig, cardSig)).toBe(0.0);
  });

  it('5. Token filtering: excludes layout dimensions (>120px) from primary spacing scale', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const refined = refineDesignIntelligence(data);

    refined.spacingScale.forEach((token) => {
      expect(token.valuePx).toBeLessThanOrEqual(120);
    });
  });

  it('6. Typography extraction: extracts font families and text style hierarchy', () => {
    const data = runPipelineOnHTML(getSaasLandingFixtureHTML());
    expect(data.typographySystem?.fontFamilies.length).toBeGreaterThan(0);
    expect(data.typographySystem?.tokens.length).toBeGreaterThan(0);
  });

  it('7. ADS fidelity score: computes deterministic score (0-100) and passes all critical failure gates', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const refined = refineDesignIntelligence(data);

    expect(refined.fidelityScore).toBeDefined();
    expect(refined.fidelityScore.totalScore).toBeGreaterThanOrEqual(70);
    expect(refined.fidelityScore.criticalGates.passedAllGates).toBe(true);
  });

  it('8. Deterministic output: produces 100% byte-for-byte identical output across repeated runs', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads1 = buildAgentDesignSpecification(data);
    const ads2 = buildAgentDesignSpecification(data);

    const ctx1 = exportAdsContext(ads1);
    const ctx2 = exportAdsContext(ads2);

    expect(ctx1).toBe(ctx2);
  });
});
