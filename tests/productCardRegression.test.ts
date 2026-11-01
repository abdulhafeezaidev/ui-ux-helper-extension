import { describe, it, expect } from 'vitest';
import { buildAgentDesignSpecification } from '../src/agent-spec/adsBuilder.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

describe('PROMPT 17 — ProductCard Semantic Regression Prevention Suite', () => {
  const mockRegressionDOM: AnalyzePageResponseData = {
    status: 'completed',
    pageUrl: 'https://www.limelight.pk/collections/co-ords-main',
    title: 'Limelight Co-ords',
    timestamp: Date.now(),
    extractionResult: {
      pageMeta: {
        title: 'Limelight Co-ords',
        url: 'https://www.limelight.pk/collections/co-ords-main',
        timestamp: Date.now(),
        viewport: { width: 1280, height: 632 },
        devicePixelRatio: 1,
      },
      totalExtracted: 10,
      visibleCount: 10,
      elements: [
        // 1. Top Announcement Bar (Contains "Free delivery above Rs 4999")
        {
          id: 'el_announcement',
          tagName: 'P',
          className: 'announcement-bar__message h5',
          textMeta: { hasText: true, trimmedText: 'Free delivery for orders above Rs 4999 within Pakistan', textLength: 54 },
          typography: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'center' },
          backgroundColor: 'rgb(0, 0, 0)',
          color: 'rgb(255, 255, 255)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'block', position: 'static', zIndex: 'auto', overflow: 'visible' },
          boundingRect: { x: 0, y: 0, width: 1280, height: 38 },
          isVisible: true,
          childIds: [],
        },

        // 2. Predictive Search Modal Form (Geometry 20x63, 1 column)
        {
          id: 'el_search_form',
          tagName: 'FORM',
          className: 'search search-modal__form',
          textMeta: { hasText: true, trimmedText: 'Search', textLength: 6 },
          typography: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
          backgroundColor: 'transparent',
          color: 'rgb(0, 0, 0)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'block', position: 'static', zIndex: 'auto', overflow: 'visible' },
          boundingRect: { x: 0, y: 0, width: 20, height: 63 },
          isVisible: true,
          childIds: [],
        },

        // 3. Facet Filter Button ("Apply")
        {
          id: 'el_apply_btn',
          tagName: 'BUTTON',
          className: 'button button--primary',
          textMeta: { hasText: true, trimmedText: 'Apply', textLength: 5 },
          typography: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '600', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'center' },
          backgroundColor: 'rgb(0, 0, 0)',
          color: 'rgb(255, 255, 255)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'inline-block', position: 'static', zIndex: 'auto', overflow: 'visible' },
          boundingRect: { x: 1000, y: 500, width: 60, height: 30 },
          isVisible: true,
          childIds: [],
        },

        // 4-7. Actual Product Cards (4 Column Grid at 1280x632, 299x453 geometry)
        {
          id: 'product_grid_ul',
          tagName: 'UL',
          className: 'grid product-grid grid--4-col-desktop',
          textMeta: { hasText: false, trimmedText: '', textLength: 0 },
          typography: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
          backgroundColor: 'transparent',
          color: 'rgb(0, 0, 0)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'flex', position: 'static', gap: { row: '8px', column: '8px' } },
          boundingRect: { x: 30, y: 800, width: 1220, height: 453 },
          isVisible: true,
          childIds: ['card_1', 'card_2', 'card_3', 'card_4'],
        },

        // Card 1
        {
          id: 'card_1',
          parentId: 'product_grid_ul',
          tagName: 'LI',
          className: 'grid__item card-wrapper product-card-wrapper',
          textMeta: { hasText: true, trimmedText: 'Viscose Slub Co-ord Set Rs. 4,499', textLength: 35 },
          typography: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
          backgroundColor: 'transparent',
          color: 'rgb(0, 0, 0)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'block', position: 'static' },
          boundingRect: { x: 30, y: 800, width: 299, height: 453 },
          isVisible: true,
          childIds: ['card_1_img', 'card_1_title', 'card_1_price'],
        },
        {
          id: 'card_1_img',
          parentId: 'card_1',
          tagName: 'IMG',
          className: 'motion-reduce',
          textMeta: { hasText: false, trimmedText: '', textLength: 0 },
          assetProps: { currentSrc: 'https://www.limelight.pk/cdn/shop/files/coord1.jpg', naturalWidth: 1000, naturalHeight: 1333, objectFit: 'cover', objectPosition: '50% 50%' },
          typography: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
          backgroundColor: 'transparent',
          color: 'rgb(0, 0, 0)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'block', position: 'static' },
          boundingRect: { x: 30, y: 800, width: 299, height: 399 },
          isVisible: true,
          childIds: [],
        },
        {
          id: 'card_1_title',
          parentId: 'card_1',
          tagName: 'H3',
          className: 'card__heading',
          textMeta: { hasText: true, trimmedText: 'Viscose Slub Co-ord Set', textLength: 23 },
          typography: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '700', lineHeight: '24px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
          backgroundColor: 'transparent',
          color: 'rgb(0, 0, 0)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'block', position: 'static' },
          boundingRect: { x: 30, y: 1205, width: 299, height: 20 },
          isVisible: true,
          childIds: [],
        },
        {
          id: 'card_1_price',
          parentId: 'card_1',
          tagName: 'SPAN',
          className: 'price-item price-item--sale',
          textMeta: { hasText: true, trimmedText: 'Rs. 4,499', textLength: 9 },
          typography: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '600', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
          backgroundColor: 'transparent',
          color: 'rgb(0, 0, 0)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'block', position: 'static' },
          boundingRect: { x: 30, y: 1230, width: 299, height: 20 },
          isVisible: true,
          childIds: [],
        },

        // Card 2 (Sibling at x: 337)
        {
          id: 'card_2',
          parentId: 'product_grid_ul',
          tagName: 'LI',
          className: 'grid__item card-wrapper product-card-wrapper',
          textMeta: { hasText: true, trimmedText: 'Silk Co-ord Set Rs. 6,449', textLength: 26 },
          typography: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
          backgroundColor: 'transparent',
          color: 'rgb(0, 0, 0)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'block', position: 'static' },
          boundingRect: { x: 337, y: 800, width: 299, height: 453 },
          isVisible: true,
          childIds: [],
        },
        // Card 3 (Sibling at x: 644)
        {
          id: 'card_3',
          parentId: 'product_grid_ul',
          tagName: 'LI',
          className: 'grid__item card-wrapper product-card-wrapper',
          textMeta: { hasText: true, trimmedText: 'Floral Stripe Co-ord Rs. 4,729', textLength: 31 },
          typography: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
          backgroundColor: 'transparent',
          color: 'rgb(0, 0, 0)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'block', position: 'static' },
          boundingRect: { x: 644, y: 800, width: 299, height: 453 },
          isVisible: true,
          childIds: [],
        },
        // Card 4 (Sibling at x: 951)
        {
          id: 'card_4',
          parentId: 'product_grid_ul',
          tagName: 'LI',
          className: 'grid__item card-wrapper product-card-wrapper',
          textMeta: { hasText: true, trimmedText: 'Piped Co-ord Set Rs. 5,499', textLength: 26 },
          typography: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0px', textTransform: 'none', textDecoration: 'none', textAlign: 'left' },
          backgroundColor: 'transparent',
          color: 'rgb(0, 0, 0)',
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          layoutProps: { display: 'block', position: 'static' },
          boundingRect: { x: 951, y: 800, width: 299, height: 453 },
          isVisible: true,
          childIds: [],
        },
      ],
    },
    colorSystem: { tokens: [], dominantColors: [], contrastPairs: [], roles: { pageBackground: { id: 'bg', color: { hex: '#ffffff', rgbString: 'rgb(255, 255, 255)', r: 255, g: 255, b: 255, a: 1, hsl: { h: 0, s: 0, l: 100 } }, frequency: 1, usages: ['background'] } }, stats: { totalColors: 0, tokenCount: 0 } },
    typographySystem: { fontFamilies: [], tokens: [], scale: [], primaryFont: 'sans-serif' },
    shapeSystem: { radiusTokens: [], shadowTokens: [], borderTokens: [], gradientTokens: [], surfaceCounts: { flat: 1, bordered: 0, elevated: 0, translucent: 0, circular: 0, rounded: 0, sharp: 1 } },
    layoutSystem: { viewport: { width: 1280, height: 632, documentHeight: 1250, hasHorizontalOverflow: false }, containers: [], gridContainers: [], spatialRelations: [], stats: { containerCount: 1, flexCount: 0, gridCount: 1, sectionCount: 1, relationCount: 0 } },
    componentSystem: { components: [], sections: [], families: [], patterns: [], stats: { totalComponents: 4, familyCount: 1, patternCount: 0 } },
  } as unknown as AnalyzePageResponseData;

  it('REGRESSION GATE 1: Form / Search Modal must NOT be selected as ProductCard', () => {
    const ads = buildAgentDesignSpecification(mockRegressionDOM);
    const spec = ads.productCardSpec;

    expect(spec).toBeDefined();
    expect(spec?.cardGeometry.sourceElementId).not.toBe('el_search_form');
    expect(spec?.cardGeometry.width).toBe(299);
    expect(spec?.cardGeometry.height).toBe(453);
  });

  it('REGRESSION GATE 2: Announcement Bar text "Rs 4999" must NOT contaminate ProductCard price', () => {
    const ads = buildAgentDesignSpecification(mockRegressionDOM);
    const spec = ads.productCardSpec;

    expect(spec?.price.currentPrice).toBe('Rs. 4,499');
    expect(spec?.price.sourceElementId).toBe('card_1_price');
    expect(spec?.price.currentPrice).not.toContain('4999');
  });

  it('REGRESSION GATE 3: Facet filter button "Apply" must NOT become ProductCard CTA', () => {
    const ads = buildAgentDesignSpecification(mockRegressionDOM);
    const spec = ads.productCardSpec;

    expect(spec?.cta).toBeUndefined();
  });

  it('REGRESSION GATE 4: Rendered sibling coordinates must correctly yield 4 grid columns', () => {
    const ads = buildAgentDesignSpecification(mockRegressionDOM);
    const spec = ads.productCardSpec;

    expect(spec?.gridPlacement.columns).toBe(4);
    expect(spec?.gridPlacement.gap).toBe('8px');
  });

  it('REGRESSION GATE 5: Asset evidence categorizes rendered vs unrendered browser assets', () => {
    const ads = buildAgentDesignSpecification(mockRegressionDOM);

    const renderedAsset = ads.assetEvidence.find((a) => a.assetCategory === 'rendered-browser-asset');
    expect(renderedAsset).toBeDefined();
    expect(renderedAsset?.renderedWidth).toBe(299);
    expect(renderedAsset?.renderedHeight).toBe(399);
  });
});
