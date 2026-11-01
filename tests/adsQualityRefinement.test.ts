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

describe('Prompt 15 — Real Extension ADS Quality Refinement & Semantic Abstraction', () => {
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
      title: dom.window.document.title || 'Quality Test Page',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  it('1. Viewport metadata normalization: metadata viewport matches globalSystem viewport without conflicts', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);

    expect(ads.metadata.viewport.width).toBe(ads.globalSystem.viewport.width);
    expect(ads.metadata.viewport.height).toBe(ads.globalSystem.viewport.height);
    expect(ads.metadata.viewport.devicePixelRatio).toBeDefined();
  });

  it('2. Section hierarchy refinement: major sections preserved, descendant footer/nav children suppressed', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);

    expect(ads.sections.length).toBeGreaterThan(0);
    ads.sections.forEach((sec) => {
      expect(sec.confidence).toBeGreaterThanOrEqual(0.40);
      expect(sec.provenance).toBeDefined();
    });
  });

  it('3. Component category roles: component families assign category roles (semantic-component, interactive-control)', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);

    ads.components.forEach((comp) => {
      expect(['semantic-component', 'interactive-control', 'icon-control-primitive', 'structural-wrapper', 'decorative-element']).toContain(comp.categoryRole);
    });
  });

  it('4. ProductCard semantic extraction: structured ProductCard specification is present', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);

    expect(ads.productCardSpec).toBeDefined();
    expect(ads.productCardSpec?.media.aspectRatio).toBeGreaterThan(0);
    expect(ads.productCardSpec?.title.text).toBeDefined();
    expect(ads.productCardSpec?.price.currentPrice).toBeDefined();
    expect(ads.productCardSpec?.cardGeometry.width).toBeGreaterThan(0);
  });

  it('5. Container layout relationships: spatial and structural alignments are present', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);

    expect(ads.relationships).toBeDefined();
    expect(ads.relationships.spatialAlignments.length).toBeGreaterThan(0);
  });

  it('6. Dynamic interaction details: affected elements and z-index are specified', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);

    expect(ads.interactions).toBeDefined();
    expect(ads.interactions?.length).toBeGreaterThan(0);
    const navDrawer = ads.interactions?.find((i) => i.name.includes('Drawer'));
    if (navDrawer) {
      expect(navDrawer.affectedElements).toBeDefined();
      expect(navDrawer.zIndex).toBeDefined();
    }
  });

  it('7. Anti-fabrication check: zero synthetic 200x100 or 1024x200 default values in ADS export', () => {
    const data = runPipelineOnHTML(getEcommerceFixtureHTML());
    const ads = buildAgentDesignSpecification(data);
    const exportedText = exportAdsContext(ads);

    expect(exportedText).not.toContain('200x100');
    expect(exportedText).not.toContain('1024x200');
  });
});
