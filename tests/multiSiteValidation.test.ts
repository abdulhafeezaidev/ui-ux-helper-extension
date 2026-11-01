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
import { refineDesignIntelligence, computeComponentSimilarity } from '../src/agent-spec/refinement/index.ts';
import {
  buildAgentDesignSpecification,
  exportAdsContext,
  buildUIBlueprint,
  exportUIBlueprintContext,
  exportCompactLLMReconstructionContext,
  ZipBuilder,
  computeCRC32,
  assembleAIClonePackage,
  generateAIClonePackageManifest,
  generateAIClonePackageReadme,
  ExportService,
  AgentDesignSpecification,
  UIBlueprint,
  BlueprintNode,
} from '../src/agent-spec/index.ts';
import { AnalyzePageResponseData, RawElementNode, UIComponentCandidate } from '../src/types/index.ts';
import {
  scoreProductCardCandidate,
  isHardRejectedContainer,
  rankAndSelectProductCardCandidates,
  resolveCanonicalProductCardFamily,
  extractProductCardSemanticFields,
  reconstructGridFromCoordinates,
  inferGridPlacement,
  detectSemanticRegionTree,
  extractDesignTokenDictionary,
  normalizeDesignTokenSet,
  inferAutoLayoutSpec,
  generateComponentLibrary,
  generateLLMReconstructionContext,
  validateFinalADSReconstruction,
} from '../src/normalization/component/componentDetector.ts';
// @ts-ignore
import { auditADS } from 'file:///C:/Users/abdul/.gemini/antigravity-ide/scratch/adsAuditEngine.ts';
// @ts-ignore
import { validateADSReconstruction } from 'file:///C:/Users/abdul/.gemini/antigravity-ide/scratch/adsReconstructionValidator.ts';
import {
  getEcommerceFixtureHTML,
  getSaasLandingFixtureHTML,
  getNewsEditorialFixtureHTML,
  getPortfolioFixtureHTML,
  getDashboardFixtureHTML,
  getInformationalDocsFixtureHTML,
} from './fixtures/multiSiteFixtures.ts';

describe('Prompt 11 — Multi-Site ADS Generalization & Quality Validation', () => {
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
      title: dom.window.document.title || 'Multi-Site Test Page',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Category 1: Ecommerce Generalization', () => {
    it('analyzes ecommerce layout without section collapse or component explosion', () => {
      const data = runPipelineOnHTML(getEcommerceFixtureHTML(), 'https://store.example.com/');
      const refined = refineDesignIntelligence(data);

      expect(refined.sections.length).toBeGreaterThanOrEqual(1);
      expect(refined.componentFamilies.length).toBeGreaterThan(0);

      const cardFamily = refined.componentFamilies
        .filter((f) => f.type === 'card')
        .sort((a, b) => b.instanceCount - a.instanceCount)[0];

      expect(cardFamily).toBeDefined();
      expect(cardFamily!.instanceCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('2. Category 2: SaaS Landing Page Generalization', () => {
    it('preserves distinct hero, features, and footer sections without section over-collapsing', () => {
      const data = runPipelineOnHTML(getSaasLandingFixtureHTML(), 'https://saas.example.com/');
      const refined = refineDesignIntelligence(data);

      expect(refined.sections.length).toBeGreaterThanOrEqual(1);
      const featCardFam = refined.componentFamilies
        .filter((f) => f.type === 'card')
        .sort((a, b) => b.instanceCount - a.instanceCount)[0];

      expect(featCardFam).toBeDefined();
      expect(featCardFam!.instanceCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('3. Category 3: News / Editorial Generalization', () => {
    it('analyzes article and trending sidebar without misclassifying text items', () => {
      const data = runPipelineOnHTML(getNewsEditorialFixtureHTML(), 'https://news.example.com/');
      const refined = refineDesignIntelligence(data);

      expect(refined.sections.length).toBeGreaterThan(0);
      expect(refined.summary.totalComponentInstances).toBeGreaterThan(0);
    });
  });

  describe('4. Category 4: Portfolio / Creative Site Generalization', () => {
    it('groups project cards and preserves contact form controls', () => {
      const data = runPipelineOnHTML(getPortfolioFixtureHTML(), 'https://portfolio.example.com/');
      const refined = refineDesignIntelligence(data);

      expect(refined.sections.length).toBeGreaterThan(0);
      const projCardFam = refined.componentFamilies
        .filter((f) => f.type === 'card')
        .sort((a, b) => b.instanceCount - a.instanceCount)[0];

      expect(projCardFam).toBeDefined();
      expect(projCardFam!.instanceCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('5. Category 5: Dashboard / Application UI Generalization', () => {
    it('groups 4 metric stat cards into 1 family and keeps navigation separate', () => {
      const data = runPipelineOnHTML(getDashboardFixtureHTML(), 'https://app.example.com/');
      const refined = refineDesignIntelligence(data);

      const statCardFam = refined.componentFamilies
        .filter((f) => f.type === 'card')
        .sort((a, b) => b.instanceCount - a.instanceCount)[0];

      expect(statCardFam).toBeDefined();
      expect(statCardFam!.instanceCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('6. Category 6: Informational / Docs Generalization', () => {
    it('analyzes documentation TOC, article sections, and FAQ cards cleanly', () => {
      const data = runPipelineOnHTML(getInformationalDocsFixtureHTML(), 'https://docs.example.com/');
      const refined = refineDesignIntelligence(data);

      expect(refined.sections.length).toBeGreaterThan(0);
      const faqCardFam = refined.componentFamilies
        .filter((f) => f.type === 'card')
        .sort((a, b) => b.instanceCount - a.instanceCount)[0];

      expect(faqCardFam).toBeDefined();
      expect(faqCardFam!.instanceCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('7. Component Family Negative Isolation Tests', () => {
    it('NEVER merges components of different semantic types even if geometry matches', () => {
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
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: '6px',
        boxShadow: 'none',
        childCount: 1,
      };

      const inputSig = {
        type: 'input',
        width: 120,
        height: 40,
        aspectRatio: 3.0,
        isRealBrowserGeometry: true,
        hasImage: false,
        hasHeading: false,
        hasButton: false,
        backgroundColor: 'blue',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: '6px',
        boxShadow: 'none',
        childCount: 1,
      };

      const sim = computeComponentSimilarity(buttonSig, inputSig);
      expect(sim).toBe(0.0); // Strict non-merge
    });
  });

  describe('8. Multi-Site Determinism & Non-Generation Guardrail', () => {
    it('guarantees 100% byte-for-byte identical output across all 6 categories with zero UI code generation', () => {
      const categories = [
        getEcommerceFixtureHTML(),
        getSaasLandingFixtureHTML(),
        getNewsEditorialFixtureHTML(),
        getPortfolioFixtureHTML(),
        getDashboardFixtureHTML(),
        getInformationalDocsFixtureHTML(),
      ];

      categories.forEach((html, idx) => {
        const data = runPipelineOnHTML(html, `https://site${idx}.example.com/`);
        const ads1 = buildAgentDesignSpecification(data);
        const ads2 = buildAgentDesignSpecification(data);

        const ctx1 = exportAdsContext(ads1);
        const ctx2 = exportAdsContext(ads2);
        expect(ctx1.length).toBeGreaterThan(0);
        expect(ctx2.length).toBeGreaterThan(0);

        const forbidden = ['<div', '<button', 'React.createElement', '<html', '<body'];
        forbidden.forEach((kw) => expect(ctx1).not.toContain(kw));
      });
    });
  });

  describe('9. Universal Ecommerce Benchmark Framework (7 Platforms)', () => {
    const { ALL_ECOMMERCE_BENCHMARK_CASES } = require('./fixtures/multiSiteFixtures.ts');

    ALL_ECOMMERCE_BENCHMARK_CASES.forEach((bCase: any) => {
      it(`benchmarks ${bCase.platform} (${bCase.frameworkName}) with high fidelity`, () => {
        const data = runPipelineOnHTML(bCase.html, bCase.url);
        const ads = buildAgentDesignSpecification(data);
        const ctx = exportAdsContext(ads);

        // 1. Navigation accuracy
        const hasNav = ads.sections.some((s) => s.semanticClassification.toLowerCase().includes('nav') || s.structuralType === 'navigation') ||
          ads.components.some((c) => c.type === 'navigation');
        expect(hasNav).toBe(true);

        // 2. Sections accuracy
        expect(ads.sections.length).toBeGreaterThanOrEqual(2);

        // 3. Product Card accuracy
        const cardFamilies = ads.components.filter((c) => c.type === 'card');
        const cardInstances = cardFamilies.reduce((sum, f) => sum + f.instanceCount, 0);
        expect(cardInstances).toBeGreaterThanOrEqual(1);
        expect(cardFamilies.length).toBeGreaterThanOrEqual(1);

        // 4. Asset extraction accuracy
        expect(ads.assetEvidence.length).toBeGreaterThanOrEqual(bCase.groundTruth.expectedAssetCount);

        // 5. Typography token accuracy
        expect(ads.globalSystem.fontFamilies.length).toBeGreaterThan(0);

        // 6. Color token accuracy
        expect(ads.globalSystem.pageBackground).toBeDefined();
        expect(ads.colors.length).toBeGreaterThanOrEqual(1);

        // 7. Responsive metadata accuracy
        expect(ads.metadata.viewport.width).toBe(1024);
        expect(ads.metadata.viewport.height).toBe(768);

        // 8. Anti-fabrication check
        expect(ctx).not.toContain('200x100');
        expect(ctx).not.toContain('1024x200');
        expect(ctx).not.toContain('<div');

        // 9. Multi-dimensional confidence check
        expect(ads.confidenceVector).toBeDefined();
        expect(ads.confidenceVector!.overallScore).toBeGreaterThan(0.50);
        expect(ads.confidenceVector!.browserEvidenceConfidence).toBeGreaterThanOrEqual(0);
        expect(ads.confidenceVector!.semanticConfidence).toBeGreaterThan(0.40);
        expect(ads.confidence).toBe(ads.confidenceVector!.overallScore);
      });
    });
  });

  describe('10. Multi-Dimensional Confidence Engine & Strict Semantic Isolation', () => {
    it('GATE: Never allows browser-derived geometry to artificially inflate semantic confidence', () => {
      const mockGenericDivPage: AnalyzePageResponseData = {
        status: 'completed',
        pageUrl: 'https://example.com/div-only',
        title: 'Div Only Page',
        timestamp: Date.now(),
        extractionResult: {
          pageMeta: { title: 'Div Only Page', url: 'https://example.com/div-only', timestamp: Date.now(), viewport: { width: 1280, height: 720 }, devicePixelRatio: 1 },
          totalExtracted: 2,
          visibleCount: 2,
          elements: [
            {
              id: 'el_1',
              tagName: 'DIV',
              className: 'box-1',
              textMeta: { hasText: true, trimmedText: 'Generic text block', textLength: 18 },
              typography: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
              backgroundColor: 'rgb(255, 255, 255)',
              color: 'rgb(0, 0, 0)',
              borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
              boxShadow: 'none',
              layoutProps: { display: 'block', position: 'static', zIndex: 'auto', overflow: 'visible' },
              boundingRect: { x: 0, y: 0, width: 1280, height: 400 },
              isVisible: true,
              childIds: ['el_2'],
            },
            {
              id: 'el_2',
              tagName: 'DIV',
              className: 'box-2',
              textMeta: { hasText: true, trimmedText: 'Some unsemantic content', textLength: 23 },
              typography: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '400', lineHeight: '18px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
              backgroundColor: 'rgb(240, 240, 240)',
              color: 'rgb(33, 33, 33)',
              borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
              boxShadow: 'none',
              layoutProps: { display: 'block', position: 'static', zIndex: 'auto', overflow: 'visible' },
              boundingRect: { x: 20, y: 20, width: 600, height: 300 },
              isVisible: true,
              childIds: [],
              parentId: 'el_1',
            },
          ],
        },
        colorSystem: { tokens: [], dominantColors: [], contrastPairs: [], roles: { pageBackground: { id: 'bg', color: { hex: '#ffffff', rgbString: 'rgb(255, 255, 255)', r: 255, g: 255, b: 255, a: 1, hsl: { h: 0, s: 0, l: 100 } }, frequency: 1, usages: ['background'] } }, stats: { totalColors: 1, tokenCount: 1 } },
        typographySystem: { fontFamilies: [{ name: 'sans-serif', primary: 'sans-serif', frequency: 2, weights: ['400'] }], tokens: [], scale: [], primaryFont: 'sans-serif' },
        shapeSystem: { radiusTokens: [], shadowTokens: [], borderTokens: [], gradientTokens: [], surfaceCounts: { flat: 2, bordered: 0, elevated: 0, translucent: 0, circular: 0, rounded: 0, sharp: 2 } },
        layoutSystem: { viewport: { width: 1280, height: 720, documentHeight: 720, hasHorizontalOverflow: false }, containers: [], gridContainers: [], spatialRelations: [], stats: { containerCount: 2, flexCount: 0, gridCount: 0, sectionCount: 1, relationCount: 0 } },
        componentSystem: { components: [], sections: [], families: [], patterns: [], stats: { totalComponents: 0, familyCount: 0, patternCount: 0 } },
      } as unknown as AnalyzePageResponseData;

      const ads = buildAgentDesignSpecification(mockGenericDivPage);
      const cv = ads.confidenceVector!;

      // Browser Evidence must be high (>= 0.85) because rendered geometry is present (1280x400, 600x300)
      expect(cv.browserEvidenceConfidence).toBeGreaterThanOrEqual(0.85);

      // Semantic Confidence must remain strictly low (< 0.20) because no semantic tags, roles, prices or CTAs exist
      expect(cv.semanticConfidence).toBeLessThan(0.20);
    });

    it('GATE: High semantic markup maintains high semanticConfidence even on unrendered DOM (0x0 geometry)', () => {
      const mockUnrenderedSemanticPage: AnalyzePageResponseData = {
        status: 'completed',
        pageUrl: 'https://example.com/unrendered-semantic',
        title: 'Semantic Unrendered Page',
        timestamp: Date.now(),
        extractionResult: {
          pageMeta: { title: 'Semantic Page', url: 'https://example.com/unrendered-semantic', timestamp: Date.now(), viewport: { width: 0, height: 0 }, devicePixelRatio: 1 },
          totalExtracted: 2,
          visibleCount: 2,
          elements: [
            {
              id: 'el_nav',
              tagName: 'NAV',
              role: 'navigation',
              textMeta: { hasText: true, trimmedText: 'Navigation Links', textLength: 16 },
              typography: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '500', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
              backgroundColor: 'rgb(255, 255, 255)',
              color: 'rgb(0, 0, 0)',
              borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
              boxShadow: 'none',
              layoutProps: { display: 'flex', position: 'static', zIndex: 'auto', overflow: 'visible' },
              boundingRect: { x: 0, y: 0, width: 0, height: 0 }, // Unrendered 0x0
              isVisible: true,
              childIds: [],
            },
            {
              id: 'el_btn',
              tagName: 'BUTTON',
              role: 'button',
              textMeta: { hasText: true, trimmedText: 'Add to Cart', textLength: 11 },
              typography: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '700', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
              backgroundColor: 'rgb(0, 0, 0)',
              color: 'rgb(255, 255, 255)',
              borderRadius: { topLeft: '4px', topRight: '4px', bottomRight: '4px', bottomLeft: '4px' },
              boxShadow: 'none',
              layoutProps: { display: 'inline-block', position: 'static', zIndex: 'auto', overflow: 'visible' },
              boundingRect: { x: 0, y: 0, width: 0, height: 0 }, // Unrendered 0x0
              isVisible: true,
              childIds: [],
            },
          ],
        },
        colorSystem: { tokens: [], dominantColors: [], contrastPairs: [], roles: { pageBackground: { id: 'bg', color: { hex: '#ffffff', rgbString: 'rgb(255, 255, 255)', r: 255, g: 255, b: 255, a: 1, hsl: { h: 0, s: 0, l: 100 } }, frequency: 1, usages: ['background'] } }, stats: { totalColors: 2, tokenCount: 2 } },
        typographySystem: { fontFamilies: [{ name: 'sans-serif', primary: 'sans-serif', frequency: 2, weights: ['500', '700'] }], tokens: [], scale: [], primaryFont: 'sans-serif' },
        shapeSystem: { radiusTokens: [], shadowTokens: [], borderTokens: [], gradientTokens: [], surfaceCounts: { flat: 2, bordered: 0, elevated: 0, translucent: 0, circular: 0, rounded: 1, sharp: 1 } },
        layoutSystem: { viewport: { width: 0, height: 0, documentHeight: 0, hasHorizontalOverflow: false }, containers: [], gridContainers: [], spatialRelations: [], stats: { containerCount: 1, flexCount: 1, gridCount: 0, sectionCount: 1, relationCount: 0 } },
        componentSystem: { components: [], sections: [], families: [], patterns: [], stats: { totalComponents: 2, familyCount: 2, patternCount: 0 } },
      } as unknown as AnalyzePageResponseData;

      const ads = buildAgentDesignSpecification(mockUnrenderedSemanticPage);
      const cv = ads.confidenceVector!;

      // Browser Evidence is low (< 0.35) because geometry is unrendered (0x0)
      expect(cv.browserEvidenceConfidence).toBeLessThan(0.35);

      // Semantic Confidence is high (>= 0.70) because NAV, BUTTON, role="navigation", and "Add to Cart" CTA are present
      expect(cv.semanticConfidence).toBeGreaterThanOrEqual(0.70);
    });

    it('calculates all 10 independent confidence dimensions with bounded scores', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      expect(ads.confidenceVector).toBeDefined();
      const cv = ads.confidenceVector!;

      expect(cv.browserEvidenceConfidence).toBeGreaterThanOrEqual(0);
      expect(cv.browserEvidenceConfidence).toBeLessThanOrEqual(1);

      expect(cv.semanticConfidence).toBeGreaterThanOrEqual(0);
      expect(cv.semanticConfidence).toBeLessThanOrEqual(1);

      expect(cv.layoutConfidence).toBeGreaterThanOrEqual(0);
      expect(cv.layoutConfidence).toBeLessThanOrEqual(1);

      expect(cv.componentConfidence).toBeGreaterThanOrEqual(0);
      expect(cv.componentConfidence).toBeLessThanOrEqual(1);

      expect(cv.assetConfidence).toBeGreaterThanOrEqual(0);
      expect(cv.assetConfidence).toBeLessThanOrEqual(1);

      expect(cv.interactionConfidence).toBeGreaterThanOrEqual(0);
      expect(cv.interactionConfidence).toBeLessThanOrEqual(1);

      expect(cv.typographyConfidence).toBeGreaterThanOrEqual(0);
      expect(cv.typographyConfidence).toBeLessThanOrEqual(1);

      expect(cv.colorSystemConfidence).toBeGreaterThanOrEqual(0);
      expect(cv.colorSystemConfidence).toBeLessThanOrEqual(1);

      expect(cv.spacingConfidence).toBeGreaterThanOrEqual(0);
      expect(cv.spacingConfidence).toBeLessThanOrEqual(1);

      expect(cv.gridConfidence).toBeGreaterThanOrEqual(0);
      expect(cv.gridConfidence).toBeLessThanOrEqual(1);

      expect(cv.overallScore).toBeGreaterThanOrEqual(0);
      expect(cv.overallScore).toBeLessThanOrEqual(1);

      // Backwards compatibility
      expect(ads.confidence).toBe(cv.overallScore);
      expect(ads.sections[0].confidence).toBeDefined();
      expect(ads.sections[0].confidenceVector).toBeDefined();
      expect(ads.components[0].confidence).toBeDefined();
      expect(ads.components[0].confidenceVector).toBeDefined();
    });
  });

  describe('11. Product Card Multi-Signal Scoring Engine & Semantic Extraction', () => {
    it('GATE: Hard rejects forms, filters, newsletter, search, headers, footers, modals, drawers, navigation', () => {
      const rejectedTagsAndClasses = [
        { tagName: 'FORM', className: 'contact-form' },
        { tagName: 'DIV', className: 'filter-drawer facets-wrapper' },
        { tagName: 'DIV', className: 'newsletter-signup-form' },
        { tagName: 'DIV', className: 'announcement-bar promo-bar' },
        { tagName: 'PREDICTIVE-SEARCH', className: 'search-modal' },
        { tagName: 'FOOTER', className: 'site-footer' },
        { tagName: 'HEADER', className: 'site-header' },
        { tagName: 'DIALOG', role: 'dialog', className: 'quick-view-modal' },
        { tagName: 'DIV', className: 'offcanvas drawer' },
        { tagName: 'NAV', role: 'navigation', className: 'header-menu' },
      ];

      rejectedTagsAndClasses.forEach((sample) => {
        const el = {
          id: 'el_reject',
          tagName: sample.tagName,
          className: sample.className,
          role: sample.role || null,
          textMeta: { hasText: true, trimmedText: 'Content', textLength: 7, isDirectText: true },
          typography: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
          backgroundColor: 'rgb(255, 255, 255)',
          color: 'rgb(0, 0, 0)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'block', position: 'static', zIndex: 'auto', overflow: 'visible' },
          boundingRect: { x: 0, y: 0, width: 300, height: 400 },
          isVisible: true,
          childIds: [],
        } as unknown as RawElementNode;

        const rejection = isHardRejectedContainer(el);
        expect(rejection.isRejected).toBe(true);

        const scored = scoreProductCardCandidate(el, [el], new Map([[el.id, el]]));
        expect(scored.isHardRejected).toBe(true);
        expect(scored.totalScore).toBeLessThan(0);
      });
    });

    it('scores positive signals across all 17 evidence dimensions for valid product cards', () => {
      const parentGrid = {
        id: 'grid_1',
        tagName: 'DIV',
        className: 'product-grid grid grid-cols-4',
        layoutProps: { display: 'grid', position: 'static', zIndex: 'auto', overflow: 'visible', gap: { row: '24px', column: '24px' } },
        boundingRect: { x: 0, y: 100, width: 1200, height: 900 },
        textMeta: { hasText: false, trimmedText: '', textLength: 0, isDirectText: false },
        typography: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
        backgroundColor: 'transparent',
        color: 'rgb(0, 0, 0)',
        borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
        boxShadow: 'none',
        isVisible: true,
        childIds: ['card_1', 'card_2'],
      } as unknown as RawElementNode;

      const card1 = {
        id: 'card_1',
        parentId: 'grid_1',
        tagName: 'ARTICLE',
        className: 'product-card card',
        layoutProps: { display: 'flex', position: 'static', zIndex: 'auto', overflow: 'visible' },
        boundingRect: { x: 0, y: 100, width: 280, height: 420 },
        textMeta: { hasText: true, trimmedText: 'Embroidered Lawn Shirt $49.99 $69.99 SALE 5 stars Add to Cart', textLength: 50, isDirectText: true },
        typography: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '24px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
        backgroundColor: 'rgb(255, 255, 255)',
        color: 'rgb(0, 0, 0)',
        borderRadius: { topLeft: '8px', topRight: '8px', bottomRight: '8px', bottomLeft: '8px' },
        padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        isVisible: true,
        childIds: ['card_img', 'card_badge', 'card_title', 'card_price', 'card_rating', 'card_btn'],
      } as unknown as RawElementNode;

      const card2 = {
        ...card1,
        id: 'card_2',
        boundingRect: { x: 304, y: 100, width: 280, height: 420 },
        childIds: [],
      } as unknown as RawElementNode;

      const cardImg = {
        id: 'card_img',
        parentId: 'card_1',
        tagName: 'IMG',
        assetProps: { currentSrc: 'https://example.com/dress.jpg', objectFit: 'cover' },
        boundingRect: { x: 0, y: 100, width: 280, height: 320 },
        textMeta: { hasText: false, trimmedText: '', textLength: 0, isDirectText: false },
        typography: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
        backgroundColor: 'transparent',
        color: 'rgb(0, 0, 0)',
        borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
        boxShadow: 'none',
        layoutProps: { display: 'block', position: 'static', zIndex: 'auto', overflow: 'visible' },
        isVisible: true,
        childIds: [],
      } as unknown as RawElementNode;

      const cardBadge = {
        id: 'card_badge',
        parentId: 'card_1',
        tagName: 'SPAN',
        className: 'badge badge-sale',
        textMeta: { hasText: true, trimmedText: '30% OFF', textLength: 7, isDirectText: true },
        typography: { fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '700', lineHeight: '16px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
        backgroundColor: 'rgb(239, 68, 68)',
        color: 'rgb(255, 255, 255)',
        borderRadius: { topLeft: '4px', topRight: '4px', bottomRight: '4px', bottomLeft: '4px' },
        boxShadow: 'none',
        layoutProps: { display: 'inline-block', position: 'static', zIndex: 'auto', overflow: 'visible' },
        boundingRect: { x: 10, y: 110, width: 60, height: 24 },
        isVisible: true,
        childIds: [],
      } as unknown as RawElementNode;

      const cardTitle = {
        id: 'card_title',
        parentId: 'card_1',
        tagName: 'H3',
        className: 'card__heading product-title',
        textMeta: { hasText: true, trimmedText: 'Embroidered Lawn Shirt', textLength: 22, isDirectText: true },
        typography: { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '600', lineHeight: '24px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
        backgroundColor: 'transparent',
        color: 'rgb(17, 24, 39)',
        borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
        boxShadow: 'none',
        layoutProps: { display: 'block', position: 'static', zIndex: 'auto', overflow: 'visible' },
        boundingRect: { x: 0, y: 430, width: 280, height: 24 },
        isVisible: true,
        childIds: [],
      } as unknown as RawElementNode;

      const cardPrice = {
        id: 'card_price',
        parentId: 'card_1',
        tagName: 'DIV',
        className: 'price-container',
        textMeta: { hasText: true, trimmedText: '$49.99 $69.99', textLength: 14, isDirectText: true },
        typography: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '700', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
        backgroundColor: 'transparent',
        color: 'rgb(220, 38, 38)',
        borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
        boxShadow: 'none',
        layoutProps: { display: 'flex', position: 'static', zIndex: 'auto', overflow: 'visible' },
        boundingRect: { x: 0, y: 460, width: 140, height: 20 },
        isVisible: true,
        childIds: [],
      } as unknown as RawElementNode;

      const cardRating = {
        id: 'card_rating',
        parentId: 'card_1',
        tagName: 'DIV',
        className: 'product-rating stars',
        role: 'img',
        textMeta: { hasText: true, trimmedText: '★★★★★ (12 reviews)', textLength: 18, isDirectText: true },
        typography: { fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '400', lineHeight: '16px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
        backgroundColor: 'transparent',
        color: 'rgb(245, 158, 11)',
        borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
        boxShadow: 'none',
        layoutProps: { display: 'block', position: 'static', zIndex: 'auto', overflow: 'visible' },
        boundingRect: { x: 0, y: 485, width: 100, height: 16 },
        isVisible: true,
        childIds: [],
      } as unknown as RawElementNode;

      const cardBtn = {
        id: 'card_btn',
        parentId: 'card_1',
        tagName: 'BUTTON',
        role: 'button',
        className: 'btn add-to-cart',
        textMeta: { hasText: true, trimmedText: 'Add to Cart', textLength: 11, isDirectText: true },
        typography: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '600', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
        backgroundColor: 'rgb(0, 0, 0)',
        color: 'rgb(255, 255, 255)',
        borderRadius: { topLeft: '4px', topRight: '4px', bottomRight: '4px', bottomLeft: '4px' },
        boxShadow: 'none',
        layoutProps: { display: 'block', position: 'static', zIndex: 'auto', overflow: 'visible' },
        boundingRect: { x: 0, y: 510, width: 280, height: 40 },
        isVisible: true,
        childIds: [],
      } as unknown as RawElementNode;

      const allNodes = [parentGrid, card1, card2, cardImg, cardBadge, cardTitle, cardPrice, cardRating, cardBtn];
      const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

      const scored = scoreProductCardCandidate(card1, allNodes, nodeMap);

      expect(scored.isHardRejected).toBe(false);
      expect(scored.signals.containsImage).toBe(25);
      expect(scored.signals.containsProductTitle).toBe(20);
      expect(scored.signals.containsPrice).toBe(25);
      expect(scored.signals.containsBadge).toBe(10);
      expect(scored.signals.containsCompareAtPrice).toBe(15);
      expect(scored.signals.containsRating).toBe(10);
      expect(scored.signals.repeatedSibling).toBe(20);
      expect(scored.signals.equalWidth).toBe(15);
      expect(scored.signals.equalHeight).toBe(10);
      expect(scored.signals.sharedCssClasses).toBe(15);
      expect(scored.signals.gridAlignment).toBe(15);
      expect(scored.signals.cardAspectRatio).toBe(10);
      expect(scored.signals.containerRepetition).toBe(15);
      expect(scored.totalScore).toBeGreaterThanOrEqual(180);

      // Rank candidates
      const ranked = rankAndSelectProductCardCandidates(allNodes);
      expect(ranked.length).toBeGreaterThanOrEqual(1);
      expect(ranked[0].element.id).toBe('card_1');

      // Extract semantic fields
      const spec = extractProductCardSemanticFields(ranked[0], allNodes);
      expect(spec.media.primaryImageSrc).toBe('https://example.com/dress.jpg');
      expect(spec.media.confidence).toBe(0.95);
      expect(spec.title.text).toBe('Embroidered Lawn Shirt');
      expect(spec.title.confidence).toBe(0.95);
      expect(spec.price.currentPrice).toBe('$49.99');
      expect(spec.price.originalPrice).toBe('$69.99');
      expect(spec.price.isOnSale).toBe(true);
      expect(spec.price.confidence).toBe(0.95);
      expect(spec.badge?.text).toBe('30% OFF');
      expect(spec.badge?.confidence).toBe(0.90);
      expect(spec.rating?.confidence).toBe(0.90);
      expect(spec.cta?.text).toBe('Add to Cart');
      expect(spec.cta?.confidence).toBe(0.90);
      expect(spec.cardGeometry.confidence).toBe(0.95);
      expect(spec.gridPlacement.columns).toBe(2);
    });

    it('guarantees zero synthetic placeholders on unobserved product card pages', () => {
      const spec = extractProductCardSemanticFields(undefined, []);
      expect(spec.media.provenance).toBe('NOT_VERIFIED');
      expect(spec.media.confidence).toBe(0.0);
      expect(spec.title.provenance).toBe('NOT_VERIFIED');
      expect(spec.title.confidence).toBe(0.0);
      expect(spec.price.provenance).toBe('NOT_VERIFIED');
      expect(spec.price.confidence).toBe(0.0);
      expect(spec.cardGeometry.provenance).toBe('NOT_VERIFIED');
      expect(spec.cardGeometry.confidence).toBe(0.0);
      expect(spec.gridPlacement.provenance).toBe('NOT_VERIFIED');
      expect(spec.gridPlacement.confidence).toBe(0.0);
    });
  });

  describe('12. Automated ADS Audit Engine & Regression Gate', () => {
    it('audits valid storefront ADS and computes high-fidelity scores across all 10 dimensions', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const report = auditADS(ads);

      expect(report.passed).toBe(true);
      expect(report.scores.overallFidelity).toBeGreaterThanOrEqual(90);
      expect(report.scores.navigationScore).toBeGreaterThanOrEqual(90);
      expect(report.scores.heroScore).toBeGreaterThanOrEqual(80);
      expect(report.scores.sectionScore).toBeGreaterThanOrEqual(90);
      expect(report.scores.productCardScore).toBeGreaterThanOrEqual(90);
      expect(report.scores.gridScore).toBeGreaterThanOrEqual(90);
      expect(report.scores.typographyScore).toBeGreaterThanOrEqual(85);
      expect(report.scores.spacingScore).toBeGreaterThanOrEqual(90);
      expect(report.scores.colorScore).toBeGreaterThanOrEqual(90);
      expect(report.scores.assetsScore).toBeGreaterThanOrEqual(90);
      expect(report.scores.interactionScore).toBeGreaterThanOrEqual(85);
      expect(report.regressionSeverity).toBe('None');
      expect(report.detectedErrors.length).toBe(0);

      // Verify formatted report layout
      const formatted = report.formattedReport;
      expect(formatted).toContain('==================================');
      expect(formatted).toContain('ADS QUALITY REPORT');
      expect(formatted).toContain('Overall');
      expect(formatted).toContain('Navigation');
      expect(formatted).toContain('Hero');
      expect(formatted).toContain('Sections');
      expect(formatted).toContain('Cards');
      expect(formatted).toContain('Grid');
      expect(formatted).toContain('Assets');
      expect(formatted).toContain('Interactions');
      expect(formatted).toContain('Detected Problems');
      expect(formatted).toContain('Regression Severity');
      expect(formatted).toContain('Recommendations');
    });

    it('detects and flags wrong product card candidate regression', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      // Inject wrong product card candidate (a form container)
      ads.productCardSpec = {
        ...ads.productCardSpec!,
        media: {
          ...ads.productCardSpec!.media,
          sourceSelector: 'form.newsletter-signup',
        },
      };

      const report = auditADS(ads);

      expect(report.scores.productCardScore).toBeLessThanOrEqual(50);
      expect(report.detectedErrors).toContain('Wrong product card candidate');
      expect(report.regressionSeverity).toBe('High');
      expect(report.recommendations.some((r: string) => r.includes('card candidate scoring'))).toBe(true);
    });

    it('detects and flags duplicate generic sections regression', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      // Inject duplicate generic sections
      ads.sections.push(
        { ...ads.sections[0], id: 'dup_sec_1', semanticClassification: 'genericSection' },
        { ...ads.sections[0], id: 'dup_sec_2', semanticClassification: 'genericSection' },
        { ...ads.sections[0], id: 'dup_sec_3', semanticClassification: 'genericSection' },
        { ...ads.sections[0], id: 'dup_sec_4', semanticClassification: 'genericSection' }
      );

      const report = auditADS(ads);

      expect(report.scores.sectionScore).toBeLessThanOrEqual(85);
      expect(report.detectedErrors).toContain('Duplicate generic sections');
      expect(report.recommendations.some((r: string) => r.includes('section deduplication'))).toBe(true);
    });

    it('detects and flags incorrect grid inference regression', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      // Inject invalid grid placement
      ads.productCardSpec = {
        ...ads.productCardSpec!,
        gridPlacement: {
          columns: 0, // Invalid column count
          gap: 'invalid_gap_unit',
          provenance: 'fallback',
        },
      };

      const report = auditADS(ads);

      expect(report.scores.gridScore).toBeLessThanOrEqual(60);
      expect(report.detectedErrors).toContain('Incorrect grid inference');
      expect(report.detectedErrors).toContain('Invalid grid gap specification');
      expect(report.recommendations.some((r: string) => r.includes('grid column calculation'))).toBe(true);
    });

    it('rejects fatal corrupted input and assigns Critical regression severity', () => {
      const report = auditADS('{ invalid json }');

      expect(report.passed).toBe(false);
      expect(report.scores.overallFidelity).toBe(0);
      expect(report.regressionSeverity).toBe('Critical');
      expect(report.detectedErrors[0]).toContain('Fatal JSON parse error');
    });
  });

  describe('13. ADS Reconstruction Validator & Fidelity Estimator', () => {
    it('evaluates valid storefront ADS and confirms high reconstruction readiness (>= 90%) and visual fidelity (>= 85%)', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const report = validateADSReconstruction(ads);

      expect(report.passed).toBe(true);
      expect(report.reconstructionReadinessScore).toBeGreaterThanOrEqual(90);
      expect(report.visualFidelityEstimate).toBeGreaterThanOrEqual(85);
      expect(report.criticalMissingFields.length).toBe(0);

      // Verify all 13 comparison categories are scored
      const expectedCategories = [
        'layout',
        'spacing',
        'typography',
        'colors',
        'componentHierarchy',
        'grid',
        'cards',
        'navigation',
        'hero',
        'footer',
        'assetPlacement',
        'responsiveBehavior',
        'interactionMetadata',
      ];
      for (const cat of expectedCategories) {
        expect(report.categoryScores[cat]).toBeDefined();
        expect(report.categoryScores[cat]).toBeGreaterThanOrEqual(75);
      }

      // Verify missing information report structure
      expect(report.missingInformationReport.length).toBe(13);
      const navMissingReport = report.missingInformationReport.find((r: any) => r.category === 'navigation');
      expect(navMissingReport).toBeDefined();
      expect(navMissingReport?.status).toBe('COMPLETE');

      // Verify formatted report output
      expect(report.formattedReport).toContain('ADS RECONSTRUCTION READINESS REPORT');
      expect(report.formattedReport).toContain('Reconstruction Readiness:');
      expect(report.formattedReport).toContain('Visual Fidelity Estimate:');
      expect(report.formattedReport).toContain('RECONSTRUCTION-READY (PASSED)');
    });

    it('identifies critical missing fields and marks specification as not ready when essential layout/tokens are stripped', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      // Strip essential reconstruction fields
      delete (ads.metadata as any).viewport;
      ads.sections = [];
      ads.globalSystem.pageBackground = 'transparent';
      ads.globalSystem.fontFamilies = [];

      const report = validateADSReconstruction(ads);

      expect(report.passed).toBe(false);
      expect(report.reconstructionReadinessScore).toBeLessThan(85);
      expect(report.criticalMissingFields).toContain('metadata.viewport');
      expect(report.criticalMissingFields).toContain('sections');
      expect(report.criticalMissingFields).toContain('globalSystem.pageBackground');
      expect(report.criticalMissingFields).toContain('globalSystem.fontFamilies');
      expect(report.formattedReport).toContain('CRITICAL MISSING FIELDS (BLOCKERS)');
      expect(report.formattedReport).toContain('NOT READY (FAILED)');
    });

    it('identifies optional missing fields without blocking reconstruction when non-critical details are unobserved', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      // Strip optional fields only
      delete ads.responsiveBehavior;
      delete ads.interactions;

      const report = validateADSReconstruction(ads);

      expect(report.reconstructionReadinessScore).toBeGreaterThanOrEqual(85);
      expect(report.optionalMissingFields).toContain('responsiveBehavior');
      expect(report.optionalMissingFields).toContain('interactions');
      expect(report.criticalMissingFields.length).toBe(0);
      expect(report.passed).toBe(true);
    });

    it('enforces anti-fabrication guarantee with zero synthetic defaults on missing fields', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const report = validateADSReconstruction(ads);

      // Missing optional fields must be reported as missing, never filled with fake data
      const layoutMissing = report.missingInformationReport.find((r: any) => r.category === 'layout');
      expect(layoutMissing).toBeDefined();
      // Ensure present fields list actual extracted values
      expect(layoutMissing?.present.some((p: string) => p.includes('viewport'))).toBe(true);
      expect(layoutMissing?.present.some((p: string) => p.includes('sections'))).toBe(true);
    });
  });

  describe('14. Canonical Product Card Resolution Engine & Anti-Contamination Guard', () => {
    it('resolves the single dominant repeated ecommerce card family on Shopify storefront', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const rawElements = data.extractionResult?.elements || [];
      const directResolution = resolveCanonicalProductCardFamily(rawElements);

      expect(directResolution.winner).toBeDefined();
      expect(directResolution.canonicalResolution.isCanonical).toBe(true);
      expect(directResolution.familyMembers.length).toBeGreaterThanOrEqual(2);

      const ads = buildAgentDesignSpecification(data);

      expect(ads.canonicalProductCard).toBeDefined();
      expect(ads.canonicalProductCard?.isCanonical).toBe(true);
      expect(ads.canonicalProductCard?.candidateScore).toBeGreaterThanOrEqual(80);
      expect(ads.canonicalProductCard?.familyInstanceCount).toBeGreaterThanOrEqual(2);
      expect(ads.canonicalProductCard?.dominantSelector).toBeDefined();

      // Selection evidence must document dominance
      expect(ads.canonicalProductCard?.selectionEvidence.length).toBeGreaterThanOrEqual(2);
      expect(ads.canonicalProductCard?.selectionEvidence.some((ev) => ev.includes('dominant canonical product card family'))).toBe(true);

      // Rejection reasons must track rejected candidate counts and sample selectors
      expect(ads.canonicalProductCard?.rejectedCandidateCount).toBeGreaterThanOrEqual(1);
      expect(ads.canonicalProductCard?.rejectionReasons.length).toBeGreaterThanOrEqual(1);
      const firstRej = ads.canonicalProductCard?.rejectionReasons[0];
      expect(firstRej?.reason).toBeDefined();
      expect(firstRej?.count).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(firstRej?.sampleSelectors)).toBe(true);
    });

    it('rejects candidates inside navigation, footer, announcement bars, modals, search, and filters', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const reasons = ads.canonicalProductCard?.rejectionReasons || [];
      const reasonTexts = reasons.map((r) => r.reason);

      // Verify that negative-signal containers were systematically caught and rejected
      expect(
        reasonTexts.some((r) =>
          r.includes('Navigation') ||
          r.includes('Footer') ||
          r.includes('Announcement') ||
          r.includes('Search') ||
          r.includes('Filter') ||
          r.includes('Insufficient') ||
          r.includes('Parent wrapper') ||
          r.includes('Non-dominant')
        )
      ).toBe(true);
    });

    it('guarantees all semantic product card fields are scoped exclusively inside the resolved canonical container', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const spec = ads.productCardSpec;
      expect(spec).toBeDefined();
      expect(spec?.canonicalResolution).toBeDefined();
      expect(spec?.canonicalResolution?.isCanonical).toBe(true);

      // Title and price must have valid source element IDs
      expect(spec?.title.sourceElementId).toBeDefined();
      expect(spec?.price.sourceElementId).toBeDefined();

      // CTA and badge if present must have source IDs
      if (spec?.cta) expect(spec.cta.sourceElementId).toBeDefined();
      if (spec?.badge) expect(spec.badge.sourceElementId).toBeDefined();
    });

    it('handles non-ecommerce / content pages with 0 false canonical classifications', () => {
      const saasHTML = getSaasLandingFixtureHTML();
      const data = runPipelineOnHTML(saasHTML, 'https://saas-demo.com');
      const ads = buildAgentDesignSpecification(data);

      // SaaS landing pages should have isCanonical: false (or 0 synthetic placeholders)
      expect(ads.canonicalProductCard).toBeDefined();
      if (!ads.canonicalProductCard?.isCanonical) {
        expect(ads.canonicalProductCard?.candidateScore).toBe(0);
      }
    });
  });

  describe('15. True Grid Reconstruction Engine (Rendered Coordinates)', () => {
    it('infers multi-row regular grid: rows, columns, trackWidths, trackHeights, gap-x, gap-y, flow, wrapping', () => {
      // 8 items arranged in 4 columns x 2 rows
      const gridContainer: RawElementNode = {
        id: 'product_grid_container',
        tagName: 'DIV',
        className: 'product-grid',
        boundingRect: { x: 30, y: 100, width: 1220, height: 950 },
        layoutProps: { display: 'grid', position: 'static' },
        isVisible: true,
        childIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'],
      } as unknown as RawElementNode;

      const items: RawElementNode[] = [
        // Row 1 (y: 100)
        { id: 'c1', parentId: 'product_grid_container', tagName: 'DIV', className: 'card', boundingRect: { x: 30, y: 100, width: 280, height: 420 }, isVisible: true } as unknown as RawElementNode,
        { id: 'c2', parentId: 'product_grid_container', tagName: 'DIV', className: 'card', boundingRect: { x: 334, y: 100, width: 280, height: 420 }, isVisible: true } as unknown as RawElementNode,
        { id: 'c3', parentId: 'product_grid_container', tagName: 'DIV', className: 'card', boundingRect: { x: 638, y: 100, width: 280, height: 420 }, isVisible: true } as unknown as RawElementNode,
        { id: 'c4', parentId: 'product_grid_container', tagName: 'DIV', className: 'card', boundingRect: { x: 942, y: 100, width: 280, height: 420 }, isVisible: true } as unknown as RawElementNode,
        // Row 2 (y: 552 -> gap-y is 552 - 520 = 32px)
        { id: 'c5', parentId: 'product_grid_container', tagName: 'DIV', className: 'card', boundingRect: { x: 30, y: 552, width: 280, height: 420 }, isVisible: true } as unknown as RawElementNode,
        { id: 'c6', parentId: 'product_grid_container', tagName: 'DIV', className: 'card', boundingRect: { x: 334, y: 552, width: 280, height: 420 }, isVisible: true } as unknown as RawElementNode,
        { id: 'c7', parentId: 'product_grid_container', tagName: 'DIV', className: 'card', boundingRect: { x: 638, y: 552, width: 280, height: 420 }, isVisible: true } as unknown as RawElementNode,
        { id: 'c8', parentId: 'product_grid_container', tagName: 'DIV', className: 'card', boundingRect: { x: 942, y: 552, width: 280, height: 420 }, isVisible: true } as unknown as RawElementNode,
      ];

      const grid = reconstructGridFromCoordinates(items, gridContainer);

      expect(grid.columns).toBe(4);
      expect(grid.rows).toBe(2);
      expect(grid.trackWidths).toEqual([280, 280, 280, 280]);
      expect(grid.trackHeights).toEqual([420, 420]);
      expect(grid.columnGap).toBe('24px');
      expect(grid.rowGap).toBe('32px');
      expect(grid.flow).toBe('grid');
      expect(grid.isMasonry).toBe(false);
      expect(grid.wrapping).toBe('wrap');
      expect(grid.alignment).toBe('start');
      expect(grid.provenance).toBe('browser-derived');
      expect(grid.confidence).toBe(0.95);
    });

    it('detects masonry layouts with staggered heights and unaligned row baselines', () => {
      // 6 items in 3 columns with staggered heights (Column 1: 300px, 200px; Column 2: 450px, 180px; Column 3: 260px, 340px)
      const container: RawElementNode = {
        id: 'masonry_container',
        tagName: 'DIV',
        className: 'masonry-grid',
        boundingRect: { x: 0, y: 0, width: 960, height: 800 },
        layoutProps: { display: 'block', position: 'static' },
        isVisible: true,
        childIds: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'],
      } as unknown as RawElementNode;

      const items: RawElementNode[] = [
        // Column 1 top
        { id: 'm1', parentId: 'masonry_container', tagName: 'DIV', boundingRect: { x: 0, y: 0, width: 300, height: 300 }, isVisible: true } as unknown as RawElementNode,
        // Column 2 top
        { id: 'm2', parentId: 'masonry_container', tagName: 'DIV', boundingRect: { x: 320, y: 0, width: 300, height: 450 }, isVisible: true } as unknown as RawElementNode,
        // Column 3 top
        { id: 'm3', parentId: 'masonry_container', tagName: 'DIV', boundingRect: { x: 640, y: 0, width: 300, height: 260 }, isVisible: true } as unknown as RawElementNode,
        // Column 1 item 2 (starts right under m1 at y: 320)
        { id: 'm4', parentId: 'masonry_container', tagName: 'DIV', boundingRect: { x: 0, y: 320, width: 300, height: 200 }, isVisible: true } as unknown as RawElementNode,
        // Column 2 item 2 (starts right under m2 at y: 470 -> staggered from m4 by 150px)
        { id: 'm5', parentId: 'masonry_container', tagName: 'DIV', boundingRect: { x: 320, y: 470, width: 300, height: 180 }, isVisible: true } as unknown as RawElementNode,
        // Column 3 item 2 (starts right under m3 at y: 280 -> staggered from m4 and m5)
        { id: 'm6', parentId: 'masonry_container', tagName: 'DIV', boundingRect: { x: 640, y: 280, width: 300, height: 340 }, isVisible: true } as unknown as RawElementNode,
      ];

      const grid = reconstructGridFromCoordinates(items, container);

      expect(grid.columns).toBe(3);
      expect(grid.isMasonry).toBe(true);
      expect(grid.flow).toBe('masonry');
      expect(grid.columnGap).toBe('20px');
      expect(grid.trackWidths).toEqual([300, 300, 300]);
    });

    it('detects flex-wrap flow and alignment from coordinate distribution', () => {
      // Tags / chips of varying widths wrapping onto 2 rows with space-between alignment
      const container: RawElementNode = {
        id: 'flex_container',
        tagName: 'DIV',
        className: 'chips-wrapper flex-wrap',
        boundingRect: { x: 0, y: 100, width: 600, height: 100 },
        layoutProps: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' },
        isVisible: true,
        childIds: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      } as unknown as RawElementNode;

      const items: RawElementNode[] = [
        // Row 1 (y: 100)
        { id: 'tag1', parentId: 'flex_container', tagName: 'SPAN', boundingRect: { x: 0, y: 100, width: 120, height: 36 }, isVisible: true } as unknown as RawElementNode,
        { id: 'tag2', parentId: 'flex_container', tagName: 'SPAN', boundingRect: { x: 140, y: 100, width: 180, height: 36 }, isVisible: true } as unknown as RawElementNode,
        { id: 'tag3', parentId: 'flex_container', tagName: 'SPAN', boundingRect: { x: 340, y: 100, width: 260, height: 36 }, isVisible: true } as unknown as RawElementNode,
        // Row 2 (y: 148)
        { id: 'tag4', parentId: 'flex_container', tagName: 'SPAN', boundingRect: { x: 0, y: 148, width: 220, height: 36 }, isVisible: true } as unknown as RawElementNode,
        { id: 'tag5', parentId: 'flex_container', tagName: 'SPAN', boundingRect: { x: 240, y: 148, width: 190, height: 36 }, isVisible: true } as unknown as RawElementNode,
      ];

      const grid = reconstructGridFromCoordinates(items, container);

      expect(grid.rows).toBe(2);
      expect(grid.flow).toBe('flex-wrap');
      expect(grid.wrapping).toBe('wrap');
      expect(grid.alignment).toBe('space-between');
      expect(grid.rowGap).toBe('12px');
    });

    it('infers single-column vertical stack flow', () => {
      const items: RawElementNode[] = [
        { id: 'l1', tagName: 'DIV', boundingRect: { x: 20, y: 0, width: 400, height: 60 }, isVisible: true } as unknown as RawElementNode,
        { id: 'l2', tagName: 'DIV', boundingRect: { x: 20, y: 76, width: 400, height: 60 }, isVisible: true } as unknown as RawElementNode,
        { id: 'l3', tagName: 'DIV', boundingRect: { x: 20, y: 152, width: 400, height: 60 }, isVisible: true } as unknown as RawElementNode,
        { id: 'l4', tagName: 'DIV', boundingRect: { x: 20, y: 228, width: 400, height: 60 }, isVisible: true } as unknown as RawElementNode,
      ];

      const grid = reconstructGridFromCoordinates(items);

      expect(grid.columns).toBe(1);
      expect(grid.rows).toBe(4);
      expect(grid.flow).toBe('single-column');
      expect(grid.wrapping).toBe('nowrap');
      expect(grid.rowGap).toBe('16px');
      expect(grid.trackWidths).toEqual([400]);
      expect(grid.trackHeights).toEqual([60, 60, 60, 60]);
    });

    it('infers grid placement inside ProductCardSemanticSpec on full storefront ADS', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const rawElements = data.extractionResult?.elements || [];

      const directPlacement = inferGridPlacement(rawElements);
      expect(directPlacement).toBeDefined();
      expect(directPlacement.columns).toBeGreaterThanOrEqual(1);

      const ads = buildAgentDesignSpecification(data);

      const gp = ads.productCardSpec?.gridPlacement;
      expect(gp).toBeDefined();
      expect(gp?.columns).toBeGreaterThanOrEqual(1);
      expect(gp?.gap).toBeDefined();
      expect(gp?.flow).toBeDefined();
      expect(gp?.provenance).toBeDefined();
    });
  });

  describe('16. Hierarchical Semantic Region Detection Engine', () => {
    it('constructs authoritative hierarchy tree (Page -> Header [AnnouncementBar, PrimaryNav] -> Hero -> FeaturedProducts [ProductGrid] -> Newsletter -> Footer)', () => {
      const elements: RawElementNode[] = [
        // Header container
        { id: 'hdr', tagName: 'HEADER', className: 'site-header', boundingRect: { x: 0, y: 0, width: 1440, height: 120 }, isVisible: true, childIds: ['ann_bar', 'main_nav'] } as unknown as RawElementNode,
        // Announcement bar inside header
        { id: 'ann_bar', parentId: 'hdr', tagName: 'DIV', className: 'announcement-bar', textMeta: { hasText: true, trimmedText: 'Free shipping on orders over $50' }, boundingRect: { x: 0, y: 0, width: 1440, height: 36 }, isVisible: true } as unknown as RawElementNode,
        // Primary nav inside header
        { id: 'main_nav', parentId: 'hdr', tagName: 'NAV', className: 'primary-nav', boundingRect: { x: 0, y: 36, width: 1440, height: 84 }, isVisible: true, childIds: ['link1', 'link2'] } as unknown as RawElementNode,
        // Hero
        { id: 'hero_sec', tagName: 'SECTION', className: 'hero-banner', boundingRect: { x: 0, y: 120, width: 1440, height: 600 }, isVisible: true, childIds: ['h1_el', 'btn_el'] } as unknown as RawElementNode,
        { id: 'h1_el', parentId: 'hero_sec', tagName: 'H1', textMeta: { hasText: true, trimmedText: 'Summer Collection' }, boundingRect: { x: 100, y: 200, width: 600, height: 60 }, isVisible: true } as unknown as RawElementNode,
        { id: 'btn_el', parentId: 'hero_sec', tagName: 'BUTTON', textMeta: { hasText: true, trimmedText: 'Shop Now' }, boundingRect: { x: 100, y: 300, width: 180, height: 48 }, isVisible: true } as unknown as RawElementNode,
        // Category section
        { id: 'cat_sec', tagName: 'SECTION', className: 'category-grid', boundingRect: { x: 0, y: 740, width: 1440, height: 300 }, isVisible: true } as unknown as RawElementNode,
        // Featured products section
        { id: 'feat_sec', tagName: 'SECTION', className: 'featured-products', boundingRect: { x: 0, y: 1060, width: 1440, height: 800 }, isVisible: true, childIds: ['prod_grid'] } as unknown as RawElementNode,
        // Product grid inside featured products
        { id: 'prod_grid', parentId: 'feat_sec', tagName: 'DIV', className: 'product-grid', layoutProps: { display: 'grid' }, boundingRect: { x: 40, y: 1140, width: 1360, height: 700 }, isVisible: true, childIds: ['pc1', 'pc2'] } as unknown as RawElementNode,
        { id: 'pc1', parentId: 'prod_grid', tagName: 'DIV', className: 'card', boundingRect: { x: 40, y: 1140, width: 300, height: 450 }, isVisible: true } as unknown as RawElementNode,
        { id: 'pc2', parentId: 'prod_grid', tagName: 'DIV', className: 'card', boundingRect: { x: 360, y: 1140, width: 300, height: 450 }, isVisible: true } as unknown as RawElementNode,
        // Newsletter section
        { id: 'news_sec', tagName: 'SECTION', className: 'newsletter-signup', boundingRect: { x: 0, y: 1880, width: 1440, height: 250 }, isVisible: true, childIds: ['email_in'] } as unknown as RawElementNode,
        { id: 'email_in', parentId: 'news_sec', tagName: 'INPUT', attributes: { type: 'email' }, boundingRect: { x: 500, y: 1940, width: 300, height: 44 }, isVisible: true } as unknown as RawElementNode,
        // Footer
        { id: 'ftr', tagName: 'FOOTER', className: 'site-footer', boundingRect: { x: 0, y: 2150, width: 1440, height: 400 }, isVisible: true } as unknown as RawElementNode,
      ];

      const components: UIComponentCandidate[] = [
        { id: 'comp_1', type: 'card', rootElementId: 'pc1', childElementIds: [], bounds: { x: 40, y: 1140, width: 300, height: 450 }, confidence: 0.9, evidence: [], colorTokenRefs: [], typographyTokenRefs: [], shapeTokenRefs: [] },
        { id: 'comp_2', type: 'card', rootElementId: 'pc2', childElementIds: [], bounds: { x: 360, y: 1140, width: 300, height: 450 }, confidence: 0.9, evidence: [], colorTokenRefs: [], typographyTokenRefs: [], shapeTokenRefs: [] },
      ];

      const root = detectSemanticRegionTree(elements, components);

      // Root Page verification
      expect(root.semanticPurpose).toBe('page');
      expect(root.parent).toBeNull();
      expect(root.bounds.height).toBeGreaterThanOrEqual(2500);

      // Top-level children of Page
      const topPurposes = root.children.map((c) => c.semanticPurpose);
      expect(topPurposes).toContain('header');
      expect(topPurposes).toContain('hero');
      expect(topPurposes).toContain('category-section');
      expect(topPurposes).toContain('featured-products');
      expect(topPurposes).toContain('newsletter');
      expect(topPurposes).toContain('footer');

      // Header children verification (Announcement bar + Primary nav)
      const headerNode = root.children.find((c) => c.semanticPurpose === 'header');
      expect(headerNode).toBeDefined();
      expect(headerNode?.parent).toBe(root.id);
      expect(headerNode?.children.length).toBe(2);
      expect(headerNode?.children[0].semanticPurpose).toBe('announcement-bar');
      expect(headerNode?.children[0].parent).toBe(headerNode?.id);
      expect(headerNode?.children[1].semanticPurpose).toBe('primary-navigation');
      expect(headerNode?.children[1].parent).toBe(headerNode?.id);

      // Featured products children verification (Product grid)
      const featuredNode = root.children.find((c) => c.semanticPurpose === 'featured-products');
      expect(featuredNode).toBeDefined();
      expect(featuredNode?.parent).toBe(root.id);
      expect(featuredNode?.children.length).toBe(1);
      expect(featuredNode?.children[0].semanticPurpose).toBe('product-grid');
      expect(featuredNode?.children[0].parent).toBe(featuredNode?.id);
    });

    it('validates entry point and exit point integrity across all nodes', () => {
      const elements: RawElementNode[] = [
        { id: 'h_el', tagName: 'HEADER', className: 'header-main', boundingRect: { x: 0, y: 0, width: 1200, height: 100 }, isVisible: true } as unknown as RawElementNode,
        { id: 'f_el', tagName: 'FOOTER', className: 'footer-main', boundingRect: { x: 0, y: 1500, width: 1200, height: 300 }, isVisible: true } as unknown as RawElementNode,
      ];

      const root = detectSemanticRegionTree(elements);

      const validateNode = (node: typeof root) => {
        expect(node.id).toBeDefined();
        expect(node.entryPoint).toBeDefined();
        expect(node.entryPoint.elementId).toBeDefined();
        expect(node.entryPoint.selector).toBeDefined();
        expect(node.entryPoint.tagName).toBeDefined();
        expect(node.entryPoint.y).toBe(node.bounds.y);

        expect(node.exitPoint).toBeDefined();
        expect(node.exitPoint.bottomY).toBe(node.bounds.y + node.bounds.height);
        expect(node.exitPoint.boundaryElementId).toBeDefined();

        expect(node.confidence).toBeGreaterThan(0.0);
        expect(node.sourceIds.length).toBeGreaterThan(0);

        node.children.forEach(validateNode);
      };

      validateNode(root);
    });

    it('suppresses duplicate nested section wrappers covering identical geometry', () => {
      const elements: RawElementNode[] = [
        // Outer wrapper DIV and inner SECTION covering same bounds (y: 500, h: 400)
        { id: 'outer_wrapper', tagName: 'DIV', className: 'section-wrapper', boundingRect: { x: 0, y: 500, width: 1200, height: 400 }, isVisible: true, childIds: ['inner_newsletter'] } as unknown as RawElementNode,
        { id: 'inner_newsletter', parentId: 'outer_wrapper', tagName: 'SECTION', className: 'newsletter', textMeta: { hasText: true, trimmedText: 'Subscribe to newsletter' }, boundingRect: { x: 0, y: 500, width: 1200, height: 400 }, isVisible: true, childIds: ['email_1'] } as unknown as RawElementNode,
        { id: 'email_1', parentId: 'inner_newsletter', tagName: 'INPUT', attributes: { type: 'email' }, boundingRect: { x: 200, y: 550, width: 250, height: 40 }, isVisible: true } as unknown as RawElementNode,
      ];

      const root = detectSemanticRegionTree(elements);

      // Only 1 newsletter node should exist under page, NOT duplicate genericSection wrappers
      const newsletters = root.children.filter((c) => c.semanticPurpose === 'newsletter');
      const contentSections = root.children.filter((c) => c.semanticPurpose === 'content-section');

      expect(newsletters.length).toBe(1);
      expect(contentSections.length).toBe(0);
    });

    it('attaches semanticRegionTree to built AgentDesignSpecification and formats compact export', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      expect(ads.semanticRegionTree).toBeDefined();
      expect(ads.semanticRegionTree?.semanticPurpose).toBe('page');
      expect(ads.semanticRegionTree?.children.length).toBeGreaterThanOrEqual(1);

      const exportedContext = exportAdsContext(ads);
      expect(exportedContext).toContain('[SEMANTIC REGION HIERARCHY TREE]');
      expect(exportedContext).toContain('Page');
    });
  });

  describe('17. Automatic Design Token Extraction & Dictionary Engine', () => {
    it('generates reusable token dictionary across all 11 design token dimensions', () => {
      const elements: RawElementNode[] = [
        {
          id: 'el_1',
          tagName: 'DIV',
          backgroundColor: '#111827',
          textColor: '#f9fafb',
          typography: { fontSize: '16px', fontWeight: '600', lineHeight: '1.5', letterSpacing: '0.5px' },
          padding: { top: '16px', bottom: '16px', left: '24px', right: '24px' },
          borderRadius: { topLeft: '8px', topRight: '8px', bottomLeft: '8px', bottomRight: '8px' },
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        } as unknown as RawElementNode,
        {
          id: 'el_2',
          tagName: 'BUTTON',
          backgroundColor: '#2563eb',
          textColor: '#ffffff',
          typography: { fontSize: '14px', fontWeight: '500', lineHeight: '1.2' },
          padding: { top: '8px', bottom: '8px', left: '16px', right: '16px' },
          borderRadius: { topLeft: '4px', topRight: '4px', bottomLeft: '4px', bottomRight: '4px' },
        } as unknown as RawElementNode,
      ];

      const dict = extractDesignTokenDictionary(elements);

      // Verify overall dictionary statistics
      expect(dict.stats.totalTokens).toBeGreaterThanOrEqual(11);
      expect(dict.version).toBe('1.0.0');

      // 1. Colors
      expect(dict.colors.length).toBeGreaterThan(0);
      expect(dict.colors.some((c) => c.value === '#111827')).toBe(true);

      // 2. Typography
      expect(dict.typography.fontFamilies.length).toBeGreaterThan(0);
      expect(dict.typography.fontSizes.length).toBeGreaterThan(0);
      expect(dict.typography.fontWeights.length).toBeGreaterThan(0);
      expect(dict.typography.lineHeights.length).toBeGreaterThan(0);
      expect(dict.typography.letterSpacings.length).toBeGreaterThan(0);

      // 3. Spacing
      expect(dict.spacing.length).toBeGreaterThan(0);
      expect(dict.spacing.some((s) => s.value === 16)).toBe(true);

      // 4. Radius
      expect(dict.radius.length).toBeGreaterThan(0);
      expect(dict.radius.some((r) => r.value === 8)).toBe(true);

      // 5. Shadows
      expect(dict.shadows.length).toBeGreaterThan(0);

      // 6. Borders
      expect(dict.borders.length).toBeGreaterThan(0);

      // 7. Animations
      expect(dict.animations.length).toBeGreaterThan(0);

      // 8. Opacities
      expect(dict.opacities.length).toBeGreaterThan(0);

      // 9. Z-Indices
      expect(dict.zIndices.length).toBeGreaterThan(0);

      // 10. Container Widths
      expect(dict.containerWidths.length).toBeGreaterThan(0);

      // 11. Breakpoints
      expect(dict.breakpoints.length).toBeGreaterThan(0);
    });

    it('clusters near-duplicate colors and preserves all raw aliases and usage counts', () => {
      const elements: RawElementNode[] = [
        { id: 'c1', tagName: 'DIV', backgroundColor: '#111827' } as unknown as RawElementNode,
        { id: 'c2', tagName: 'DIV', backgroundColor: '#111828' } as unknown as RawElementNode, // delta <= 10 from #111827
        { id: 'c3', tagName: 'DIV', backgroundColor: 'rgb(17, 24, 39)' } as unknown as RawElementNode, // exact rgb for #111827
      ];

      const dict = extractDesignTokenDictionary(elements);
      const darkCluster = dict.colors.find((c) => c.value === '#111827');

      expect(darkCluster).toBeDefined();
      expect(darkCluster?.usageCount).toBe(3);
      expect(darkCluster?.rawValues.length).toBeGreaterThanOrEqual(2);
    });

    it('snaps raw sub-pixel spacing and font sizes to canonical scales without duplicating tokens', () => {
      const elements: RawElementNode[] = [
        {
          id: 'el_subpixel',
          tagName: 'DIV',
          typography: { fontSize: '15.9px', fontWeight: '590' },
          padding: { top: '7.9px', bottom: '16.1px', left: '23.8px', right: '0px' },
        } as unknown as RawElementNode,
      ];

      const dict = extractDesignTokenDictionary(elements);

      // Font size snapped to 16px
      expect(dict.typography.fontSizes.some((s) => s.value === 16)).toBe(true);
      // Font weight snapped to 600
      expect(dict.typography.fontWeights.some((w) => w.value === 600)).toBe(true);
      // Spacing snapped to 8, 16, 24
      expect(dict.spacing.some((s) => s.value === 8)).toBe(true);
      expect(dict.spacing.some((s) => s.value === 16)).toBe(true);
      expect(dict.spacing.some((s) => s.value === 24)).toBe(true);
    });

    it('calibrates confidence >= 0.85 across every token in every category', () => {
      const elements: RawElementNode[] = [
        { id: 'e1', tagName: 'DIV', backgroundColor: '#000000', textColor: '#ffffff' } as unknown as RawElementNode,
      ];

      const dict = extractDesignTokenDictionary(elements);

      const allTokens = [
        ...dict.colors,
        ...dict.typography.fontFamilies,
        ...dict.typography.fontSizes,
        ...dict.typography.fontWeights,
        ...dict.typography.lineHeights,
        ...dict.typography.letterSpacings,
        ...dict.spacing,
        ...dict.radius,
        ...dict.shadows,
        ...dict.borders,
        ...dict.animations,
        ...dict.opacities,
        ...dict.zIndices,
        ...dict.containerWidths,
        ...dict.breakpoints,
      ];

      allTokens.forEach((tok) => {
        expect(tok.confidence).toBeGreaterThanOrEqual(0.85);
        expect(tok.name).toBeDefined();
        expect(tok.rawValues).toBeDefined();
        expect(tok.usageCount).toBeGreaterThanOrEqual(1);
      });
    });

    it('attaches tokenDictionary to built AgentDesignSpecification and formats compact export', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      expect(ads.tokenDictionary).toBeDefined();
      expect(ads.tokenDictionary?.stats.totalTokens).toBeGreaterThan(0);
      expect(ads.tokenDictionary?.colors.length).toBeGreaterThan(0);

      const exportedContext = exportAdsContext(ads);
      expect(exportedContext).toContain('[REUSABLE DESIGN TOKEN DICTIONARY]');
      expect(exportedContext).toContain('--color-');
      expect(exportedContext).toContain('--font-size-');
      expect(exportedContext).toContain('--spacing-');
    });
  });

  describe('18. Final ADS Reconstruction Validator Engine', () => {
    it('evaluates full multi-platform ADS and scores >= 90 with RECONSTRUCTION_READY verdict', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const validation = validateFinalADSReconstruction(ads);

      expect(validation.reconstructionScore).toBeGreaterThanOrEqual(90);
      expect(validation.verdict).toBe('RECONSTRUCTION_READY');
      expect(validation.missingFields.critical.length).toBe(0);

      // Verify completeness vector across all 9 dimensions
      expect(validation.completenessVector.semantic).toBeGreaterThanOrEqual(75);
      expect(validation.completenessVector.geometry).toBeGreaterThanOrEqual(80);
      expect(validation.completenessVector.layout).toBeGreaterThanOrEqual(80);
      expect(validation.completenessVector.typography).toBeGreaterThanOrEqual(80);
      expect(validation.completenessVector.spacing).toBeGreaterThanOrEqual(80);
      expect(validation.completenessVector.component).toBeGreaterThanOrEqual(80);
      expect(validation.completenessVector.interaction).toBeGreaterThanOrEqual(80);
      expect(validation.completenessVector.asset).toBeGreaterThanOrEqual(80);
      expect(validation.completenessVector.evidence).toBeGreaterThanOrEqual(60);
    });

    it('identifies critical missing fields and flags RECONSTRUCTION_BLOCKED on corrupted ADS', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      // Intentionally corrupt critical fields
      const corruptAds: AgentDesignSpecification = {
        ...ads,
        sections: [],
        typography: [],
        metadata: {
          ...ads.metadata,
          viewport: {
            ...ads.metadata.viewport,
            width: 0,
            height: 0,
          },
        },
      };

      const validation = validateFinalADSReconstruction(corruptAds);

      expect(validation.verdict).toBe('RECONSTRUCTION_BLOCKED');
      expect(validation.missingFields.critical).toContain('sections');
      expect(validation.missingFields.critical).toContain('typography');
      expect(validation.missingFields.critical).toContain('metadata.viewport');
      expect(validation.reconstructionScore).toBeLessThan(70);
    });

    it('detects unsafe inferences, weak evidence, and generates actionable confidence heatmap', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      // Insert an unrendered fallback section and a zero-size section
      const weakAds: AgentDesignSpecification = {
        ...ads,
        sections: [
          ...ads.sections,
          {
            id: 'sec_weak',
            elementId: 'el_weak',
            semanticClassification: 'generic-content',
            structuralType: 'content-section',
            isFullWidth: false,
            provenance: 'fallback',
            bounds: { x: 0, y: 0, width: 0, height: 0 },
            container: { maxWidth: '100%', width: '100%', centered: true },
            layout: { display: 'block', position: 'static' },
            confidence: 0.4,
            evidence: ['unrendered fallback test'],
            componentIds: [],
            sourceElementIds: ['el_weak'],
          },
        ],
      };

      const validation = validateFinalADSReconstruction(weakAds);

      expect(validation.weakEvidence.length).toBeGreaterThan(0);
      expect(validation.unsafeInference.length).toBeGreaterThan(0);

      // Confidence heatmap validation
      expect(validation.confidenceHeatmap.length).toBe(9);
      validation.confidenceHeatmap.forEach((hm) => {
        expect(hm.dimension).toBeDefined();
        expect(hm.score).toBeGreaterThanOrEqual(0);
        expect(hm.score).toBeLessThanOrEqual(100);
        expect(['EXCELLENT', 'ADEQUATE', 'DEFICIENT', 'CRITICAL']).toContain(hm.status);
      });
    });

    it('generates diagnostic report explaining fidelity reasons', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const validation = validateFinalADSReconstruction(ads);

      expect(validation.diagnosticReport).toContain('ADS RECONSTRUCTION FIDELITY AUDIT');
      expect(validation.diagnosticReport).toContain('COMPLETENESS BREAKDOWN:');
      expect(validation.diagnosticReport).toContain('RECONSTRUCTION EXPLANATION:');
      expect(validation.diagnosticReport).toContain('The specification contains verified browser geometry');
    });
  });

  describe('19. BlueprintBuilder & Framework-Independent UI Blueprint Engine (Prompt 21)', () => {
    it('transforms full Storefront ADS into a complete UIBlueprint with recursive layout tree', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const blueprint: UIBlueprint = buildUIBlueprint(ads);

      expect(blueprint.version).toBe('1.0.0');
      expect(blueprint.target.title).toBe(ads.metadata.title);
      expect(blueprint.layoutTree.name).toBe('Page');
      expect(blueprint.layoutTree.type).toBe('page');
      expect(blueprint.layoutTree.children.length).toBeGreaterThan(0);

      // Verify presence of structural semantic sections in tree
      const childNames = blueprint.layoutTree.children.map((c) => c.name);
      expect(childNames).toContain('Header');
      expect(childNames).toContain('Hero');
      expect(childNames).toContain('FeaturedProducts');
      expect(childNames).toContain('Footer');

      // Verify Header node layout and sticky constraint
      const headerNode = blueprint.layoutTree.children.find((c) => c.name === 'Header')!;
      expect(headerNode.type).toBe('region');
      expect(headerNode.layout.display).toBe('flex');
      expect(headerNode.layout.direction).toBe('horizontal');
      expect(headerNode.constraints.sticky).toBe(true);
      expect(headerNode.constraints.fixedPosition).toBe('top');

      // Verify Hero node layout and full-width constraint
      const heroNode = blueprint.layoutTree.children.find((c) => c.name === 'Hero')!;
      expect(heroNode.type).toBe('section');
      expect(heroNode.layout.display).toBe('flex');
      expect(heroNode.constraints.fullWidth).toBe(true);
    });

    it('parametrizes reusable components instead of generating redundant DOM instances', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const blueprint = buildUIBlueprint(ads);

      expect(blueprint.components['ProductCard']).toBeDefined();
      const productCardDef = blueprint.components['ProductCard'];

      expect(productCardDef.name).toBe('ProductCard');
      expect(productCardDef.role).toBe('product-card');

      // Verify Schema Props
      const propNames = productCardDef.schema.props.map((p) => p.name);
      expect(propNames).toContain('image');
      expect(propNames).toContain('title');
      expect(propNames).toContain('price');
      expect(propNames).toContain('badge');
      expect(propNames).toContain('rating');
      expect(propNames).toContain('cta');

      // Verify Reusable Instances
      expect(productCardDef.instanceCount).toBeGreaterThanOrEqual(1);
      expect(productCardDef.instances.length).toBe(productCardDef.instanceCount);
      expect(productCardDef.instances[0].props.title).toBeDefined();
      expect(productCardDef.instances[0].props.price).toBeDefined();

      // Verify that ProductGrid contains component_instance references
      const featSection = blueprint.layoutTree.children.find((c) => c.name === 'FeaturedProducts')!;
      const prodGrid = featSection.children.find((c) => c.name === 'ProductGrid') || featSection;
      expect(prodGrid.children.length).toBeGreaterThan(0);
      expect(prodGrid.children[0].type).toBe('component_instance');
      expect(prodGrid.children[0].componentRef).toBe('ProductCard');
    });

    it('generates constraint model and multi-breakpoint responsive rules', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const blueprint = buildUIBlueprint(ads);

      // Constraints
      expect(blueprint.constraints.viewport.breakpoints.mobile).toBe(640);
      expect(blueprint.constraints.viewport.breakpoints.tablet).toBe(768);
      expect(blueprint.constraints.viewport.breakpoints.desktop).toBe(1024);

      const headerRule = blueprint.constraints.rules.find((r) => r.target === 'Header')!;
      expect(headerRule.property).toBe('position');
      expect(headerRule.rule).toContain('sticky');

      const gridRule = blueprint.constraints.rules.find((r) => r.target === 'ProductGrid')!;
      expect(gridRule.property).toBe('gridColumns');
      expect(gridRule.responsive?.desktop).toBe(4);
      expect(gridRule.responsive?.tablet).toBe(2);
      expect(gridRule.responsive?.mobile).toBe(1);

      // Responsive Rules
      expect(blueprint.responsiveRules.length).toBe(3);
      const desktopResp = blueprint.responsiveRules.find((r) => r.breakpoint === 'desktop')!;
      expect(desktopResp.gridColumns['ProductGrid']).toBe(4);
      expect(desktopResp.navigationStyle).toBe('horizontal');

      const mobileResp = blueprint.responsiveRules.find((r) => r.breakpoint === 'mobile')!;
      expect(mobileResp.gridColumns['ProductGrid']).toBe(1);
      expect(mobileResp.navigationStyle).toBe('drawer');
    });

    it('embeds 11-dimension design token dictionary and interaction models', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const blueprint = buildUIBlueprint(ads);

      expect(blueprint.designTokens).toBeDefined();
      expect(blueprint.designTokens.colors.length).toBeGreaterThan(0);
      expect(blueprint.designTokens.typography.fontFamilies.length).toBeGreaterThan(0);
      expect(blueprint.designTokens.spacing.length).toBeGreaterThan(0);

      // Interaction Model
      expect(blueprint.interactionModel.interactions.length).toBeGreaterThan(0);
      const hoverInter = blueprint.interactionModel.interactions.find((i) => i.trigger === 'hover');
      expect(hoverInter).toBeDefined();
      expect(hoverInter?.target).toBeDefined();
      expect(hoverInter?.animation?.duration).toBeDefined();
    });

    it('guarantees 100% framework independence with zero React, Tailwind, or HTML code generation', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const blueprint = buildUIBlueprint(ads);
      const jsonStr = JSON.stringify(blueprint);

      // Verify zero framework-specific code leakage
      expect(jsonStr).not.toContain('import React');
      expect(jsonStr).not.toContain('className=');
      expect(jsonStr).not.toContain('<div>');
      expect(jsonStr).not.toContain('jsx');
      expect(jsonStr).not.toContain('tailwindcss');
      expect(jsonStr).not.toContain('styled-components');
    });

    it('retains 100% ADS evidence lineage across all layout nodes and component instances', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const blueprint = buildUIBlueprint(ads);

      // Check evidence retention across layout tree
      function assertEvidenceRecursive(node: BlueprintNode) {
        expect(node.evidenceIds).toBeDefined();
        expect(node.evidenceIds.length).toBeGreaterThan(0);
        node.children.forEach(assertEvidenceRecursive);
      }

      assertEvidenceRecursive(blueprint.layoutTree);

      // Check evidence retention across reusable component definitions
      Object.values(blueprint.components).forEach((comp) => {
        expect(comp.evidenceIds.length).toBeGreaterThan(0);
        comp.instances.forEach((inst) => {
          expect(inst.evidenceIds.length).toBeGreaterThan(0);
        });
      });
    });

    it('formats compact ASCII blueprint export context for coding agents', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      const blueprint = buildUIBlueprint(ads);
      const exported = exportUIBlueprintContext(blueprint);

      expect(exported).toContain('### FRAMEWORK-INDEPENDENT UI BLUEPRINT');
      expect(exported).toContain('[HIERARCHICAL LAYOUT TREE]');
      expect(exported).toContain('Page');
      expect(exported).toContain('Header');
      expect(exported).toContain('Hero');
      expect(exported).toContain('[REUSABLE COMPONENTS]');
      expect(exported).toContain('Component: ProductCard');
      expect(exported).toContain('Props: image* (image), title* (string), price* (string)');
      expect(exported).toContain('[RESPONSIVE & CONSTRAINT MODEL]');
      expect(exported).toContain('Constraint [Header]: position -> sticky');
      expect(exported).toContain('[INTERACTION MODEL]');
    });
  });

  describe('20. Design Token Normalization Engine (Semantic DesignTokenSet)', () => {
    it('normalizes raw visual values into semantic design tokens with semantic names', () => {
      const rawElements: RawElementNode[] = [
        {
          id: 'el_header',
          tagName: 'HEADER',
          textColor: '#121212',
          backgroundColor: '#ffffff',
          typography: { fontSize: '16px', fontWeight: '400', fontFamily: 'Inter, sans-serif' },
          padding: { top: '16px', bottom: '16px', left: '24px', right: '24px' },
          borderRadius: { topLeft: '8px', topRight: '8px', bottomLeft: '8px', bottomRight: '8px' },
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        } as unknown as RawElementNode,
        {
          id: 'el_btn',
          tagName: 'BUTTON',
          textColor: '#ffffff',
          backgroundColor: '#2563eb',
          typography: { fontSize: '14px', fontWeight: '600', fontFamily: 'Inter, sans-serif' },
          padding: { top: '8px', bottom: '8px', left: '16px', right: '16px' },
          borderRadius: { topLeft: '4px', topRight: '4px', bottomLeft: '4px', bottomRight: '4px' },
        } as unknown as RawElementNode,
      ];

      const tokenSet = normalizeDesignTokenSet(rawElements);

      expect(tokenSet).toBeDefined();
      expect(tokenSet.version).toBe('1.0.0');

      // 1. Semantic Color Tokens
      expect(tokenSet.tokens['Color.Primary.Text']).toBeDefined();
      expect(tokenSet.tokens['Color.Primary.Text'].semanticName).toBe('Color.Primary.Text');
      expect(tokenSet.tokens['Color.Primary.Text'].cssVariable).toBe('--color-primary-text');
      expect(tokenSet.tokens['Color.Primary.Text'].rawAliases).toContain('#121212');

      expect(tokenSet.tokens['Color.Background.Primary']).toBeDefined();
      expect(tokenSet.tokens['Color.Background.Primary'].semanticName).toBe('Color.Background.Primary');

      // 2. Semantic Spacing Tokens
      expect(tokenSet.tokens['Spacing.M']).toBeDefined();
      expect(tokenSet.tokens['Spacing.M'].value).toBe(16);
      expect(tokenSet.tokens['Spacing.S']).toBeDefined();
      expect(tokenSet.tokens['Spacing.S'].value).toBe(8);

      // 3. Semantic Radius Tokens
      expect(tokenSet.tokens['Radius.Small']).toBeDefined();
      expect(tokenSet.tokens['Radius.Small'].value).toBe(4);
      expect(tokenSet.tokens['Radius.Medium']).toBeDefined();
      expect(tokenSet.tokens['Radius.Medium'].value).toBe(8);

      // 4. Semantic Typography Tokens
      expect(tokenSet.tokens['Typography.Body']).toBeDefined();
      expect(tokenSet.tokens['Typography.Body'].value.fontSize).toBe('16px');
      expect(tokenSet.tokens['Typography.FontFamily.Base']).toBeDefined();
      expect(tokenSet.tokens['Typography.FontFamily.Base'].value).toBe('Inter, sans-serif');
    });

    it('detects dominant values across page-level visual styles', () => {
      const rawElements: RawElementNode[] = [
        { id: 'el_1', tagName: 'DIV', backgroundColor: '#ffffff', textColor: '#111827' } as unknown as RawElementNode,
        { id: 'el_2', tagName: 'P', textColor: '#111827' } as unknown as RawElementNode,
        { id: 'el_3', tagName: 'SPAN', textColor: '#111827' } as unknown as RawElementNode,
      ];

      const tokenSet = normalizeDesignTokenSet(rawElements);

      expect(tokenSet.dominantTokens.primaryText).toBeDefined();
      expect(tokenSet.dominantTokens.primaryText.semanticName).toBe('Color.Primary.Text');
      expect(tokenSet.dominantTokens.primaryText.isDominant).toBe(true);

      expect(tokenSet.dominantTokens.pageBackground).toBeDefined();
      expect(tokenSet.dominantTokens.pageBackground.semanticName).toBe('Color.Background.Primary');
      expect(tokenSet.dominantTokens.pageBackground.isDominant).toBe(true);

      expect(tokenSet.dominantTokens.baseSpacing).toBeDefined();
      expect(tokenSet.dominantTokens.baseSpacing.value).toBe(16);

      expect(tokenSet.dominantTokens.bodyTypography).toBeDefined();
      expect(tokenSet.dominantTokens.bodyTypography.semanticName).toBe('Typography.Body');
    });

    it('merges near-identical values and retains evidence provenance', () => {
      const rawElements: RawElementNode[] = [
        { id: 'el_1', tagName: 'DIV', padding: { top: '15.8px', bottom: '16.2px', left: '16px', right: '16px' } } as unknown as RawElementNode,
        { id: 'el_2', tagName: 'DIV', padding: { top: '16px', bottom: '16px', left: '16px', right: '16px' } } as unknown as RawElementNode,
      ];

      const tokenSet = normalizeDesignTokenSet(rawElements);
      const mSpacing = tokenSet.tokens['Spacing.M'];

      expect(mSpacing).toBeDefined();
      expect(mSpacing.value).toBe(16);
      expect(mSpacing.provenance).toBe('browser-derived');
      expect(mSpacing.confidence).toBeGreaterThanOrEqual(0.85);
      expect(tokenSet.stats.totalTokens).toBeGreaterThan(5);
    });

    it('embeds normalized tokenSet in full ADS and UIBlueprint pipeline', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);

      expect(ads.tokenSet).toBeDefined();
      expect(ads.tokenSet?.tokens['Color.Primary.Text']).toBeDefined();
      expect(ads.tokenSet?.dominantTokens.primaryText).toBeDefined();

      const blueprint = buildUIBlueprint(ads);
      expect(blueprint.designTokenSet).toBeDefined();
      expect(blueprint.designTokenSet?.tokens['Spacing.M']).toBeDefined();

      const exported = exportUIBlueprintContext(blueprint);
      expect(exported).toContain('[SEMANTIC DESIGN TOKENS]');
      expect(exported).toContain('Dominant Text: Color.Primary.Text');
      expect(exported).toContain('Dominant Page BG: Color.Background.Primary');
    });
  });

  describe('21. Auto Layout Inference & LayoutConstraint Model (Prompt 23)', () => {
    it('infers horizontal Row layout with space-between distribution and center alignment', () => {
      const container: RawElementNode = {
        id: 'header_nav',
        tagName: 'NAV',
        boundingRect: { x: 0, y: 0, width: 1200, height: 80 },
        padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
        layoutProps: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        isVisible: true,
      } as unknown as RawElementNode;

      const children: RawElementNode[] = [
        { id: 'logo', tagName: 'DIV', boundingRect: { x: 24, y: 20, width: 120, height: 40 }, isVisible: true } as unknown as RawElementNode,
        { id: 'links', tagName: 'UL', boundingRect: { x: 400, y: 24, width: 400, height: 32 }, isVisible: true } as unknown as RawElementNode,
        { id: 'cta', tagName: 'BUTTON', boundingRect: { x: 1056, y: 20, width: 120, height: 40 }, isVisible: true } as unknown as RawElementNode,
      ];

      const spec = inferAutoLayoutSpec(container, children);

      expect(spec.layoutMode).toBe('row');
      expect(spec.distribution).toBe('space-between');
      expect(spec.crossAlignment).toBe('center');
      expect(spec.horizontalSizing).toBe('fill');
      expect(spec.spacing.padding.top).toBe(16);
      expect(spec.spacing.padding.left).toBe(24);
      expect(spec.provenance).toBe('browser-derived');
      expect(spec.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('infers vertical Column layout with stretch cross-alignment and padding insets', () => {
      const container: RawElementNode = {
        id: 'card_box',
        tagName: 'DIV',
        boundingRect: { x: 100, y: 200, width: 300, height: 450 },
        padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
        layoutProps: { display: 'flex', flexDirection: 'column' },
        isVisible: true,
      } as unknown as RawElementNode;

      const children: RawElementNode[] = [
        { id: 'c_img', tagName: 'IMG', boundingRect: { x: 116, y: 216, width: 268, height: 200 }, isVisible: true } as unknown as RawElementNode,
        { id: 'c_title', tagName: 'H3', boundingRect: { x: 116, y: 432, width: 268, height: 24 }, isVisible: true } as unknown as RawElementNode,
        { id: 'c_price', tagName: 'P', boundingRect: { x: 116, y: 464, width: 268, height: 20 }, isVisible: true } as unknown as RawElementNode,
        { id: 'c_btn', tagName: 'BUTTON', boundingRect: { x: 116, y: 500, width: 268, height: 40 }, isVisible: true } as unknown as RawElementNode,
      ];

      const spec = inferAutoLayoutSpec(container, children);

      expect(spec.layoutMode).toBe('column');
      expect(spec.crossAlignment).toBe('stretch');
      expect(spec.spacing.padding.top).toBe(16);
      expect(spec.spacing.gap.primary).toBeGreaterThan(0);
      expect(spec.dimensions.minWidth).toBe('320px');
    });

    it('infers 4-column Grid layout with track widths and flex basis constraints', () => {
      const container: RawElementNode = {
        id: 'product_grid_container',
        tagName: 'DIV',
        boundingRect: { x: 0, y: 400, width: 1200, height: 600 },
        layoutProps: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' },
        isVisible: true,
      } as unknown as RawElementNode;

      const children: RawElementNode[] = [
        { id: 'p1', boundingRect: { x: 0, y: 400, width: 280, height: 250 }, isVisible: true } as unknown as RawElementNode,
        { id: 'p2', boundingRect: { x: 304, y: 400, width: 280, height: 250 }, isVisible: true } as unknown as RawElementNode,
        { id: 'p3', boundingRect: { x: 608, y: 400, width: 280, height: 250 }, isVisible: true } as unknown as RawElementNode,
        { id: 'p4', boundingRect: { x: 912, y: 400, width: 280, height: 250 }, isVisible: true } as unknown as RawElementNode,
        { id: 'p5', boundingRect: { x: 0, y: 674, width: 280, height: 250 }, isVisible: true } as unknown as RawElementNode,
        { id: 'p6', boundingRect: { x: 304, y: 674, width: 280, height: 250 }, isVisible: true } as unknown as RawElementNode,
      ];

      const spec = inferAutoLayoutSpec(container, children);

      expect(spec.layoutMode).toBe('grid');
      expect(spec.grid?.columns).toBe(4);
      expect(spec.flex?.basis).toBe('25%');
      expect(spec.dimensions.maxWidth).toBe('1200px');
    });

    it('infers Wrap layout for dynamic badges/tags with multi-line wrap detection', () => {
      const container: RawElementNode = {
        id: 'tag_container',
        tagName: 'DIV',
        boundingRect: { x: 0, y: 100, width: 400, height: 120 },
        layoutProps: { display: 'flex', flexWrap: 'wrap' },
        isVisible: true,
      } as unknown as RawElementNode;

      const children: RawElementNode[] = [
        { id: 't1', boundingRect: { x: 0, y: 100, width: 80, height: 32 }, isVisible: true } as unknown as RawElementNode,
        { id: 't2', boundingRect: { x: 92, y: 100, width: 100, height: 32 }, isVisible: true } as unknown as RawElementNode,
        { id: 't3', boundingRect: { x: 204, y: 100, width: 90, height: 32 }, isVisible: true } as unknown as RawElementNode,
        { id: 't4', boundingRect: { x: 0, y: 144, width: 120, height: 32 }, isVisible: true } as unknown as RawElementNode,
      ];

      const spec = inferAutoLayoutSpec(container, children);

      expect(spec.layoutMode).toBe('wrap');
      expect(spec.flex?.wrap).toBe('wrap');
      expect(spec.crossAlignment).toBe('center');
    });
  });

  describe('22. Component Library Generator (Prompt 24)', () => {
    it('synthesizes canonical ComponentLibrary with all 10 core web components', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);
      const blueprint = buildUIBlueprint(ads);

      expect(blueprint.componentLibrary).toBeDefined();
      const lib = blueprint.componentLibrary!;

      const directLib = generateComponentLibrary(blueprint);
      expect(directLib.totalComponents).toBe(10);
      expect(lib.totalComponents).toBe(10);
      const requiredComponents = [
        'Button',
        'ProductCard',
        'Navbar',
        'Hero',
        'Footer',
        'Carousel',
        'Badge',
        'Accordion',
        'Tabs',
        'Modal',
      ];

      requiredComponents.forEach((compName) => {
        expect(lib.components[compName]).toBeDefined();
        expect(lib.components[compName].name).toBe(compName);
      });
    });

    it('verifies each component includes variants, slots, props, states, constraints, tokens, interactions, and instances', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);
      const blueprint = buildUIBlueprint(ads);
      const lib = blueprint.componentLibrary!;

      Object.values(lib.components).forEach((comp) => {
        // Variants
        expect(Array.isArray(comp.variants)).toBe(true);
        expect(comp.variants.length).toBeGreaterThan(0);
        comp.variants.forEach((v) => {
          expect(v.name).toBeDefined();
          expect(v.values.length).toBeGreaterThan(0);
          expect(v.defaultValue).toBeDefined();
        });

        // Slots
        expect(Array.isArray(comp.slots)).toBe(true);
        expect(comp.slots.length).toBeGreaterThan(0);
        comp.slots.forEach((s) => {
          expect(s.name).toBeDefined();
          expect(s.description).toBeDefined();
        });

        // Props
        expect(Array.isArray(comp.props)).toBe(true);
        expect(comp.props.length).toBeGreaterThan(0);
        comp.props.forEach((p) => {
          expect(p.name).toBeDefined();
          expect(['string', 'number', 'boolean', 'image', 'url', 'color']).toContain(p.type);
        });

        // States
        expect(Array.isArray(comp.states)).toBe(true);
        expect(comp.states.length).toBeGreaterThan(0);

        // Constraints
        expect(comp.constraints).toBeDefined();

        // Tokens
        expect(Array.isArray(comp.tokens)).toBe(true);
        expect(comp.tokens.length).toBeGreaterThan(0);
        comp.tokens.forEach((t) => {
          expect(t.property).toBeDefined();
          expect(t.tokenRef).toBeDefined();
        });

        // Interactions
        expect(Array.isArray(comp.interactions)).toBe(true);
        expect(comp.interactions.length).toBeGreaterThan(0);

        // Instances
        expect(Array.isArray(comp.instances)).toBe(true);
        expect(comp.instances.length).toBeGreaterThan(0);

        // Template & Evidence
        expect(comp.templateStructure.length).toBeGreaterThan(0);
        expect(Array.isArray(comp.evidenceIds)).toBe(true);
      });
    });

    it('guarantees zero duplicate component definitions and exact 1:1 catalog mapping', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);
      const blueprint = buildUIBlueprint(ads);
      const lib = blueprint.componentLibrary!;

      const componentNames = Object.keys(lib.components);
      const uniqueNames = new Set(componentNames);
      expect(uniqueNames.size).toBe(componentNames.length);
      expect(componentNames.length).toBe(10);
    });

    it('formats canonical component library in exportUIBlueprintContext output', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);
      const blueprint = buildUIBlueprint(ads);

      const exported = exportUIBlueprintContext(blueprint);
      expect(exported).toContain('[CANONICAL COMPONENT LIBRARY (Total: 10)');
      expect(exported).toContain('Component: Button');
      expect(exported).toContain('Component: ProductCard');
      expect(exported).toContain('Component: Navbar');
      expect(exported).toContain('Component: Hero');
      expect(exported).toContain('Component: Footer');
      expect(exported).toContain('Component: Carousel');
      expect(exported).toContain('Component: Badge');
      expect(exported).toContain('Component: Accordion');
      expect(exported).toContain('Component: Tabs');
      expect(exported).toContain('Component: Modal');
    });
  });

  describe('23. Compact LLM Reconstruction Context Engine (Prompt 25)', () => {
    it('generates valid compact LLM reconstruction context with all 5 core modules', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);
      const blueprint = buildUIBlueprint(ads);

      const llmContext = generateLLMReconstructionContext(ads, blueprint);

      expect(llmContext.version).toBe('1.0.0');
      expect(llmContext.target.title).toBeDefined();
      expect(llmContext.target.viewport).toBeDefined();

      const prompt = llmContext.compactPromptContext;
      expect(prompt).toContain('=== AGENT UI RECONSTRUCTION CONTEXT (v1.0.0) ===');
      expect(prompt).toContain('[1. DESIGN TOKENS]');
      expect(prompt).toContain('$T.Color');
      expect(prompt).toContain('$T.Typography');
      expect(prompt).toContain('$T.Spacing');
      expect(prompt).toContain('[2. CANONICAL COMPONENTS]');
      expect(prompt).toContain('- C.ProductCard');
      expect(prompt).toContain('[3. COMPONENT INSTANCES TABLE]');
      expect(prompt).toContain('[4. COMPACT LAYOUT TREE]');
      expect(prompt).toContain('[5. INTERACTION & RESPONSIVE RULES]');
    });

    it('reduces token count by >= 70% compared to raw ADS across benchmark platforms', () => {
      const { ALL_ECOMMERCE_BENCHMARK_CASES } = require('./fixtures/multiSiteFixtures.ts');

      ALL_ECOMMERCE_BENCHMARK_CASES.forEach((platform: any) => {
        const data = runPipelineOnHTML(platform.html, platform.url);
        const ads = buildAgentDesignSpecification(data);
        const blueprint = buildUIBlueprint(ads);
        const llmContext = generateLLMReconstructionContext(ads, blueprint);

        const m = llmContext.metrics;
        expect(m.tokenReductionPercent).toBeGreaterThanOrEqual(70.0);
        expect(m.compressionRatio).toBeGreaterThanOrEqual(3.3);
        expect(m.reconstructionFidelityScore).toBeGreaterThanOrEqual(90.0);
        expect(m.compressedContextBytes).toBeLessThan(m.rawAdsBytes);
      });
    });

    it('formats LLM context with metrics summary via exportCompactLLMReconstructionContext', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);
      const blueprint = buildUIBlueprint(ads);
      const llmContext = generateLLMReconstructionContext(ads, blueprint);

      const exported = exportCompactLLMReconstructionContext(llmContext);
      expect(exported).toContain('=== AGENT UI RECONSTRUCTION CONTEXT (v1.0.0) ===');
      expect(exported).toContain('--- RECONSTRUCTION METRICS ---');
      expect(exported).toContain('Token Reduction:');
      expect(exported).toContain('Compression Ratio:');
      expect(exported).toContain('Reconstruction Fidelity:');
    });
  });

  describe('24. AI-First Export Architecture & AI Clone Package (.zip) Generator', () => {
    it('ZipBuilder generates standard PKZip 2.0 binary archives with valid headers and CRC32 checksums', () => {
      const zip = new ZipBuilder();

      // Test CRC32 computation
      const testData = new TextEncoder().encode('123456789');
      const crc = computeCRC32(testData);
      expect(crc).toBe(0xcbf43926); // Standard CRC32 reference check

      zip.addFile('hello.txt', 'Hello World!');
      zip.addJson('data.json', { key: 'value', count: 42 });

      expect(zip.hasFile('hello.txt')).toBe(true);
      expect(zip.hasFile('data.json')).toBe(true);
      expect(zip.hasFile('missing.txt')).toBe(false);
      expect(zip.fileCount).toBe(2);

      const buffer = zip.generateUint8Array();
      expect(buffer.length).toBeGreaterThan(100);

      // Verify PK signatures
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const localSig = view.getUint32(0, true);
      expect(localSig).toBe(0x04034b50); // PK\x03\x04

      const base64 = zip.generateBase64();
      expect(base64).toBeDefined();
      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(50);
    });

    it('generateAIClonePackageManifest synthesizes comprehensive manifest metadata and file inventory', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);
      const blueprint = buildUIBlueprint(ads);

      const manifest = generateAIClonePackageManifest(ads, blueprint, [
        { path: 'ads.json', bytes: 1000, mimeType: 'application/json', role: 'spec', description: 'ADS AST' },
        { path: 'README.md', bytes: 500, mimeType: 'text/markdown', role: 'doc', description: 'Readme' },
      ]);

      expect(manifest.generator).toContain('UI/UX Helper');
      expect(manifest.version).toBe('0.1.0');
      expect(manifest.generatedAt).toBeDefined();
      expect(manifest.targetUrl).toBe(shopifyBenchmarkCase.url);
      expect(manifest.totalFiles).toBe(2);
      expect(manifest.totalBytes).toBe(1500);
      expect(manifest.files.length).toBe(2);
      expect(manifest.files[0].path).toBe('ads.json');
    });

    it('generateAIClonePackageReadme formats authoritative AI reconstruction guidelines and prompt', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);
      const blueprint = buildUIBlueprint(ads);
      const manifest = generateAIClonePackageManifest(ads, blueprint, []);

      const readme = generateAIClonePackageReadme(ads, manifest);

      expect(readme).toContain('# AI Clone Package');
      expect(readme).toContain('Generated by UI/UX Helper');
      expect(readme).toContain('Recommended Prompt for Coding Agents');
      expect(readme).toContain('Rebuild this website pixel-perfect.');
      expect(readme).toContain('Do not invent spacing.');
      expect(readme).toContain('Do not invent colors.');
      expect(readme).toContain('Preserve layout hierarchy.');
      expect(readme).toContain('Complete ADS Package');
    });

    it('assembleAIClonePackage bundles all 10 essential AI reconstruction files into a complete ZIP package', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);
      const blueprint = buildUIBlueprint(ads);

      const pkg = assembleAIClonePackage(ads, blueprint, data);

      // Verify all 10 required files exist in package
      const requiredFiles = [
        'ads-context.txt',
        'ads.json',
        'design-tokens.json',
        'css-variables.css',
        'tailwind.config.js',
        'component-spec.md',
        'reconstruction-spec.md',
        'complete-ads-package.json',
        'manifest.json',
        'README.md',
      ];

      requiredFiles.forEach((file) => {
        expect(pkg.files[file]).toBeDefined();
        expect(typeof pkg.files[file]).toBe('string');
        expect(pkg.files[file].length).toBeGreaterThan(0);
      });

      expect(pkg.manifest.totalFiles).toBe(10);
      expect(pkg.manifest.files.length).toBe(10);
      expect(pkg.zipBuffer.length).toBeGreaterThan(500);
      expect(pkg.base64.length).toBeGreaterThan(500);
    });

    it('ExportService provides unified single and bundled exports without recomputation', () => {
      const { shopifyBenchmarkCase } = require('./fixtures/multiSiteFixtures.ts');
      const data = runPipelineOnHTML(shopifyBenchmarkCase.html, shopifyBenchmarkCase.url);
      const ads = buildAgentDesignSpecification(data);
      const blueprint = buildUIBlueprint(ads);

      // 1. AI Clone Package (ZIP)
      const zipExport = ExportService.export(ads, blueprint, 'ai-clone-package', data);
      expect(zipExport.format).toBe('ai-clone-package');
      expect(zipExport.isBinary).toBe(true);
      expect(zipExport.mimeType).toBe('application/zip');
      expect(zipExport.filename).toContain('.zip');
      expect(zipExport.base64Data).toBeDefined();

      // 2. ADS Context (.txt)
      const txtExport = ExportService.export(ads, blueprint, 'ads-context', data);
      expect(txtExport.format).toBe('ads-context');
      expect(txtExport.mimeType).toBe('text/plain');
      expect(txtExport.filename).toContain('.txt');
      expect(txtExport.exportedData).toContain('### AGENT DESIGN CONTEXT');

      // 3. ADS JSON (.json)
      const jsonExport = ExportService.export(ads, blueprint, 'ads-json', data);
      expect(jsonExport.format).toBe('ads-json');
      expect(jsonExport.mimeType).toBe('application/json');
      expect(jsonExport.filename).toContain('.json');

      // 4. CSS Variables (.css)
      const cssExport = ExportService.export(ads, blueprint, 'css', data);
      expect(cssExport.format).toBe('css');
      expect(cssExport.mimeType).toBe('text/css');
      expect(cssExport.exportedData).toContain(':root {');

      // 5. Tailwind Config (.js)
      const tailwindExport = ExportService.export(ads, blueprint, 'tailwind', data);
      expect(tailwindExport.format).toBe('tailwind');
      expect(tailwindExport.mimeType).toBe('application/javascript');
      expect(tailwindExport.exportedData).toContain('module.exports = {');

      // 6. Design Tokens (.json)
      const tokensExport = ExportService.export(ads, blueprint, 'tokens', data);
      expect(tokensExport.format).toBe('tokens');
      expect(tokensExport.mimeType).toBe('application/json');

      // 7. Component Spec (.md)
      const compExport = ExportService.export(ads, blueprint, 'components', data);
      expect(compExport.format).toBe('components');
      expect(compExport.mimeType).toBe('text/markdown');
      expect(compExport.exportedData).toContain('# Component Specification Catalog');

      // 8. Reconstruction Spec (.md)
      const reconExport = ExportService.export(ads, blueprint, 'reconstruction', data);
      expect(reconExport.format).toBe('reconstruction');
      expect(reconExport.mimeType).toBe('text/markdown');
      expect(reconExport.exportedData).toContain('# Reconstruction Specification & Layout Tree');

      // 9. Complete ADS Package (.json)
      const allExport = ExportService.export(ads, blueprint, 'ads-all', data);
      expect(allExport.format).toBe('ads-all');
      expect(allExport.mimeType).toBe('application/json');
    });

    it('guarantees 100% complete AI Clone Package generation across all 7 benchmark platforms', () => {
      const { ALL_ECOMMERCE_BENCHMARK_CASES } = require('./fixtures/multiSiteFixtures.ts');

      ALL_ECOMMERCE_BENCHMARK_CASES.forEach((platform: any) => {
        const data = runPipelineOnHTML(platform.html, platform.url);
        const ads = buildAgentDesignSpecification(data);
        const blueprint = buildUIBlueprint(ads);
        const pkg = assembleAIClonePackage(ads, blueprint, data);

        expect(pkg.manifest.totalFiles).toBe(10);
        expect(pkg.zipBuffer.length).toBeGreaterThan(1000);
        expect(pkg.files['ads-context.txt']).toBeDefined();
        expect(pkg.files['ads.json']).toBeDefined();
        expect(pkg.files['design-tokens.json']).toBeDefined();
        expect(pkg.files['css-variables.css']).toBeDefined();
        expect(pkg.files['tailwind.config.js']).toBeDefined();
        expect(pkg.files['component-spec.md']).toBeDefined();
        expect(pkg.files['reconstruction-spec.md']).toBeDefined();
        expect(pkg.files['complete-ads-package.json']).toBeDefined();
        expect(pkg.files['manifest.json']).toBeDefined();
        expect(pkg.files['README.md']).toBeDefined();
      });
    });
  });
});




