import { describe, it, expect } from 'vitest';
import { buildAgentDesignSpecification } from '../src/agent-spec/adsBuilder.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

describe('PROMPT 16 — Anti-Fabrication & Evidence Integrity Test Suite', () => {
  const mockUnobservedData = {
    status: 'completed',
    pageUrl: 'https://example.com/test',
    title: 'Test Empty Page',
    timestamp: Date.now(),
    extractionResult: {
      pageMeta: {
        title: 'Test Empty Page',
        url: 'https://example.com/test',
        timestamp: Date.now(),
        viewport: { width: 1280, height: 632 },
        devicePixelRatio: 1,
      },
      totalExtracted: 1,
      visibleCount: 1,
      elements: [
        {
          id: 'el_root',
          tagName: 'DIV',
          className: 'root-container',
          textMeta: { hasText: false, trimmedText: '', textLength: 0 },
          typography: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
          backgroundColor: 'rgb(255, 255, 255)',
          color: 'rgb(0, 0, 0)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'block', position: 'static', zIndex: 'auto', overflow: 'visible' },
          boundingRect: { x: 0, y: 0, width: 1280, height: 632 },
          isVisible: true,
          childIds: [],
        },
      ],
    },
    colorSystem: {
      tokens: [],
      dominantColors: [],
      contrastPairs: [],
      roles: { pageBackground: { id: 'bg', color: { hex: '#ffffff', rgbString: 'rgb(255, 255, 255)', r: 255, g: 255, b: 255, a: 1, hsl: { h: 0, s: 0, l: 100 } }, frequency: 1, usages: ['background'] } },
      stats: { totalColors: 0, tokenCount: 0 },
    },
    typographySystem: { fontFamilies: [], tokens: [], scale: [], primaryFont: 'sans-serif' },
    shapeSystem: { radiusTokens: [], shadowTokens: [], borderTokens: [], gradientTokens: [], surfaceCounts: { flat: 1, bordered: 0, elevated: 0, translucent: 0, circular: 0, rounded: 0, sharp: 1 } },
    layoutSystem: { viewport: { width: 1280, height: 632, documentHeight: 632, hasHorizontalOverflow: false }, containers: [], gridContainers: [], spatialRelations: [], stats: { containerCount: 1, flexCount: 0, gridCount: 0, sectionCount: 1, relationCount: 0 } },
    componentSystem: { components: [], sections: [], families: [], patterns: [], stats: { totalComponents: 0, familyCount: 0, patternCount: 0 } },
  } as unknown as AnalyzePageResponseData;

  it('GATE 1: Must never return synthetic placeholder strings in production ADS output', () => {
    const ads = buildAgentDesignSpecification(mockUnobservedData);
    const jsonStr = JSON.stringify(ads, null, 2);

    const suspiciousPlaceholders = [
      'Product Name Title',
      'PKR 4,990',
      'PKR 5,990',
      'ADD TO CART',
      'product-image-placeholder.jpg',
    ];

    suspiciousPlaceholders.forEach((ph) => {
      expect(jsonStr).not.toContain(ph);
    });

    if (ads.evidenceIntegrity) {
      expect(ads.evidenceIntegrity.fieldsUsingPlaceholders).toBe(0);
    }
  });

  it('GATE 2: Every browser-derived field in productCardSpec must have a non-empty sourceElementId', () => {
    const ads = buildAgentDesignSpecification(mockUnobservedData);
    const spec = ads.productCardSpec;

    if (spec) {
      if (spec.media.provenance === 'browser-derived') {
        expect(spec.media.sourceElementId).toBeDefined();
        expect(spec.media.sourceElementId).not.toBe('');
      }
      if (spec.title.provenance === 'browser-derived') {
        expect(spec.title.sourceElementId).toBeDefined();
        expect(spec.title.sourceElementId).not.toBe('');
      }
      if (spec.price.provenance === 'browser-derived') {
        expect(spec.price.sourceElementId).toBeDefined();
        expect(spec.price.sourceElementId).not.toBe('');
      }
      if (spec.badge && spec.badge.provenance === 'browser-derived') {
        expect(spec.badge.sourceElementId).toBeDefined();
        expect(spec.badge.sourceElementId).not.toBe('');
      }
      if (spec.cta && spec.cta.provenance === 'browser-derived') {
        expect(spec.cta.sourceElementId).toBeDefined();
        expect(spec.cta.sourceElementId).not.toBe('');
      }
    }
  });

  it('GATE 3: Unobserved semantic fields must return NOT_VERIFIED or undefined, not fallback claims', () => {
    const ads = buildAgentDesignSpecification(mockUnobservedData);
    const spec = ads.productCardSpec;

    expect(spec).toBeDefined();
    if (spec) {
      expect(spec.media.primaryImageSrc).toBeUndefined();
      expect(spec.media.provenance).toBe('NOT_VERIFIED');
      expect(spec.title.text).toBeUndefined();
      expect(spec.title.provenance).toBe('NOT_VERIFIED');
      expect(spec.price.currentPrice).toBeUndefined();
      expect(spec.price.provenance).toBe('NOT_VERIFIED');
    }
  });

  it('GATE 4: Must compute evidence coverage and integrity metrics', () => {
    const ads = buildAgentDesignSpecification(mockUnobservedData);

    expect(ads.evidenceCoverage).toBeDefined();
    expect(ads.evidenceIntegrity).toBeDefined();
    expect(ads.evidenceCoverage?.unverifiedPct).toBeGreaterThanOrEqual(0);
    expect(ads.evidenceIntegrity?.fieldsUsingPlaceholders).toBe(0);
  });
});
