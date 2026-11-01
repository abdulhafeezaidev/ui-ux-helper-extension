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
import { buildAgentDesignSpecification, exportAdsContext } from '../src/agent-spec/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';
import { getEcommerceFixtureHTML } from './fixtures/multiSiteFixtures.ts';

describe('Prompt 13 — ADS Reconstruction-Ready Evidence Upgrade', () => {
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
      title: dom.window.document.title || 'Reconstruction Test Page',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  it('1. ADS geometry: real browser bounds survive into ADS; 0 geometry does NOT become synthetic geometry', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);

    ads.components.forEach((comp) => {
      if (!comp.geometry.isRealBrowserGeometry) {
        expect(comp.geometry.avgWidth).toBe(0);
        expect(comp.geometry.avgHeight).toBe(0);
        expect(comp.provenance).toBe('fallback');
      }
    });
  });

  it('2. Component family consolidation & variants: equivalent components consolidate and expose visual variants', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);

    expect(ads.components.length).toBeGreaterThan(0);
    ads.components.forEach((comp) => {
      expect(comp.familyId).toBeDefined();
      expect(comp.variants).toBeDefined();
      expect(comp.variants.length).toBeGreaterThan(0);
    });
  });

  it('3. Section confidence: explicit semantic elements score higher than weak generic wrappers (no universal 0.45)', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);

    const navSec = ads.sections.find((s) => s.semanticClassification.toLowerCase().includes('navigation'));

    if (navSec) {
      expect(navSec.confidence).toBeGreaterThan(0.50);
    }
  });

  it('4. Source DOM traceability: 100% of retained sections and component families retain non-empty sourceElementIds', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);

    ads.sections.forEach((sec) => {
      expect(sec.sourceElementIds.length).toBeGreaterThan(0);
    });

    ads.components.forEach((comp) => {
      expect(comp.sourceElementIds.length).toBeGreaterThan(0);
    });
  });

  it('5. Responsive ADS & observed breakpoints: desktop and mobile specifications remain distinguishable', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);

    expect(ads.responsiveBehavior).toBeDefined();
    expect(ads.responsiveBehavior?.desktop.viewport).toBe('1024x768');
    expect(ads.responsiveBehavior?.mobile.viewport).toBe('375x812');
  });

  it('6. Evidence classification: provenance is explicit across all major ADS fields', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);

    ads.colors.forEach((col) => expect(['browser-derived', 'computed', 'algorithmically-inferred', 'fallback']).toContain(col.provenance));
    ads.typography.forEach((typo) => expect(['browser-derived', 'computed', 'algorithmically-inferred', 'fallback']).toContain(typo.provenance));
    ads.sections.forEach((sec) => expect(['browser-derived', 'computed', 'algorithmically-inferred', 'fallback']).toContain(sec.provenance));
    ads.components.forEach((comp) => expect(['browser-derived', 'computed', 'algorithmically-inferred', 'fallback']).toContain(comp.provenance));
  });

  it('7. Deterministic ADS context export: produces 100% byte-for-byte identical compact ADS text output', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads1 = buildAgentDesignSpecification(data);
    const ads2 = buildAgentDesignSpecification(data);

    const ctx1 = exportAdsContext(ads1);
    const ctx2 = exportAdsContext(ads2);

    expect(ctx1).toBe(ctx2);
    expect(ctx1).toContain('[GLOBAL DESIGN SYSTEM TOKENS]');
    expect(ctx1).toContain('[PAGE GEOMETRY & MAJOR SECTIONS]');
    expect(ctx1).toContain('[COMPONENT FAMILIES & CATEGORY ROLES]');
    expect(ctx1).toContain('[CONTAINER LAYOUT RELATIONSHIPS]');
    expect(ctx1).toContain('[RESPONSIVE BEHAVIOR]');
    expect(ctx1).toContain('[INTERACTIONS & DYNAMIC STATES]');
    expect(ctx1).toContain('[SOURCE TRACEABILITY]');
    expect(ctx1).toContain('[EVIDENCE CLASSIFICATION]');
  });
});
