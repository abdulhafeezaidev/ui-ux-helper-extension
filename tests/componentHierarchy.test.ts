import { describe, it, expect } from 'vitest';
import {
  buildComponentHierarchyTree,
  validateComponentTreeIntegrity,
  ComponentTreeNode,
} from '../src/normalization/component/componentHierarchyEngine.ts';
import { exportComponentTreeJson } from '../src/output/clonePackage/componentTreeJsonExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData, RawElementNode } from '../src/types/index.ts';

function createMockEcommercePageData(): AnalyzePageResponseData {
  const elements = [
    {
      id: 'el_0',
      tagName: 'body',
      className: 'storefront-body',
      xpath: '/html/body',
      depth: 0,
      boundingRect: { x: 0, y: 0, width: 1440, height: 2400 },
      clientRect: { x: 0, y: 0, width: 1440, height: 2400 },
      isVisible: true,
      display: 'block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      childIds: ['el_header', 'el_hero', 'el_grid_sec', 'el_footer'],
    },
    // Header Region & Subcomponents
    {
      id: 'el_header',
      parentId: 'el_0',
      tagName: 'header',
      className: 'site-header main-header',
      xpath: '/html/body/header',
      depth: 1,
      boundingRect: { x: 0, y: 0, width: 1440, height: 80 },
      clientRect: { x: 0, y: 0, width: 1440, height: 80 },
      isVisible: true,
      display: 'flex',
      position: 'sticky',
      zIndex: '100',
      overflow: 'visible',
      opacity: 1,
      childIds: ['el_logo', 'el_nav', 'el_search', 'el_cart'],
      layoutProps: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
    },
    {
      id: 'el_logo',
      parentId: 'el_header',
      tagName: 'a',
      className: 'brand-logo site-logo',
      xpath: '/html/body/header/a[1]',
      depth: 2,
      boundingRect: { x: 24, y: 20, width: 120, height: 40 },
      clientRect: { x: 24, y: 20, width: 120, height: 40 },
      isVisible: true,
      display: 'block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      assetProps: {
        hasSvg: true,
        svgViewBox: '0 0 120 40',
      },
      interactive: {
        isClickable: true,
        href: '/',
        ariaLabel: 'Brand Logo',
      },
    },
    {
      id: 'el_nav',
      parentId: 'el_header',
      tagName: 'nav',
      className: 'primary-nav menu-links',
      xpath: '/html/body/header/nav',
      depth: 2,
      boundingRect: { x: 200, y: 24, width: 600, height: 32 },
      clientRect: { x: 200, y: 24, width: 600, height: 32 },
      isVisible: true,
      display: 'flex',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      childIds: ['el_nav_link_1', 'el_nav_link_2'],
    },
    {
      id: 'el_nav_link_1',
      parentId: 'el_nav',
      tagName: 'a',
      className: 'nav-link',
      xpath: '/html/body/header/nav/a[1]',
      depth: 3,
      boundingRect: { x: 200, y: 24, width: 80, height: 32 },
      clientRect: { x: 200, y: 24, width: 80, height: 32 },
      isVisible: true,
      display: 'inline-block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      textMeta: { hasText: true, trimmedText: 'Shop All', textLength: 8, isUppercase: false },
    },
    {
      id: 'el_nav_link_2',
      parentId: 'el_nav',
      tagName: 'a',
      className: 'nav-link',
      xpath: '/html/body/header/nav/a[2]',
      depth: 3,
      boundingRect: { x: 300, y: 24, width: 80, height: 32 },
      clientRect: { x: 300, y: 24, width: 80, height: 32 },
      isVisible: true,
      display: 'inline-block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      textMeta: { hasText: true, trimmedText: 'New Arrivals', textLength: 12, isUppercase: false },
    },
    {
      id: 'el_search',
      parentId: 'el_header',
      tagName: 'input',
      className: 'search-input header-search',
      xpath: '/html/body/header/input',
      depth: 2,
      boundingRect: { x: 900, y: 20, width: 240, height: 40 },
      clientRect: { x: 900, y: 20, width: 240, height: 40 },
      isVisible: true,
      display: 'block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      interactive: {
        isClickable: true,
        ariaLabel: 'Search catalog',
      },
    },
    {
      id: 'el_cart',
      parentId: 'el_header',
      tagName: 'button',
      className: 'cart-button header-cart',
      xpath: '/html/body/header/button',
      depth: 2,
      boundingRect: { x: 1360, y: 20, width: 44, height: 40 },
      clientRect: { x: 1360, y: 20, width: 44, height: 40 },
      isVisible: true,
      display: 'flex',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      interactive: {
        isClickable: true,
        ariaLabel: 'Shopping cart (2 items)',
      },
      textMeta: { hasText: true, trimmedText: 'Cart (2)', textLength: 8, isUppercase: false },
    },

    // Hero Section & Subcomponents
    {
      id: 'el_hero',
      parentId: 'el_0',
      tagName: 'section',
      className: 'hero-banner hero-section',
      xpath: '/html/body/section[1]',
      depth: 1,
      boundingRect: { x: 0, y: 80, width: 1440, height: 600 },
      clientRect: { x: 0, y: 80, width: 1440, height: 600 },
      isVisible: true,
      display: 'flex',
      position: 'relative',
      zIndex: '1',
      overflow: 'hidden',
      opacity: 1,
      childIds: ['el_hero_h1', 'el_hero_p', 'el_hero_cta'],
    },
    {
      id: 'el_hero_h1',
      parentId: 'el_hero',
      tagName: 'h1',
      className: 'hero-headline',
      xpath: '/html/body/section[1]/h1',
      depth: 2,
      boundingRect: { x: 120, y: 200, width: 700, height: 64 },
      clientRect: { x: 120, y: 200, width: 700, height: 64 },
      isVisible: true,
      display: 'block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      typography: {
        fontSize: '48px',
        fontWeight: '700',
        lineHeight: '56px',
        fontFamily: 'Inter, sans-serif',
      },
      textMeta: { hasText: true, trimmedText: 'Next-Gen Wireless Audio', textLength: 23, isUppercase: false },
    },
    {
      id: 'el_hero_p',
      parentId: 'el_hero',
      tagName: 'p',
      className: 'hero-subhead',
      xpath: '/html/body/section[1]/p',
      depth: 2,
      boundingRect: { x: 120, y: 280, width: 550, height: 48 },
      clientRect: { x: 120, y: 280, width: 550, height: 48 },
      isVisible: true,
      display: 'block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      textMeta: { hasText: true, trimmedText: 'Experience industry-leading active noise cancellation and spatial sound.', textLength: 72, isUppercase: false },
    },
    {
      id: 'el_hero_cta',
      parentId: 'el_hero',
      tagName: 'button',
      className: 'btn btn-primary cta-button',
      xpath: '/html/body/section[1]/button',
      depth: 2,
      boundingRect: { x: 120, y: 350, width: 160, height: 48 },
      clientRect: { x: 120, y: 350, width: 160, height: 48 },
      isVisible: true,
      display: 'inline-flex',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      interactive: { isClickable: true },
      textMeta: { hasText: true, trimmedText: 'Shop Now', textLength: 8, isUppercase: false },
    },

    // Product Grid Section & Subcomponents
    {
      id: 'el_grid_sec',
      parentId: 'el_0',
      tagName: 'section',
      className: 'product-grid-section featured-products',
      xpath: '/html/body/section[2]',
      depth: 1,
      boundingRect: { x: 0, y: 680, width: 1440, height: 900 },
      clientRect: { x: 0, y: 680, width: 1440, height: 900 },
      isVisible: true,
      display: 'block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      childIds: ['el_card_1', 'el_card_2', 'el_card_3', 'el_card_4'],
    },
    {
      id: 'el_card_1',
      parentId: 'el_grid_sec',
      tagName: 'div',
      className: 'product-card item-card',
      xpath: '/html/body/section[2]/div[1]',
      depth: 2,
      boundingRect: { x: 120, y: 720, width: 270, height: 380 },
      clientRect: { x: 120, y: 720, width: 270, height: 380 },
      isVisible: true,
      display: 'flex',
      position: 'relative',
      zIndex: 'auto',
      overflow: 'hidden',
      opacity: 1,
      childIds: ['el_card_1_img', 'el_card_1_badge', 'el_card_1_title', 'el_card_1_price', 'el_card_1_fav'],
    },
    {
      id: 'el_card_1_img',
      parentId: 'el_card_1',
      tagName: 'img',
      className: 'product-image',
      xpath: '/html/body/section[2]/div[1]/img',
      depth: 3,
      boundingRect: { x: 120, y: 720, width: 270, height: 200 },
      clientRect: { x: 120, y: 720, width: 270, height: 200 },
      isVisible: true,
      display: 'block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'hidden',
      opacity: 1,
      assetProps: { currentSrc: 'https://example.com/item1.jpg', naturalWidth: 600, naturalHeight: 400, objectFit: 'cover' },
    },
    {
      id: 'el_card_1_badge',
      parentId: 'el_card_1',
      tagName: 'span',
      className: 'discount-badge sale-pill',
      xpath: '/html/body/section[2]/div[1]/span',
      depth: 3,
      boundingRect: { x: 130, y: 730, width: 60, height: 24 },
      clientRect: { x: 130, y: 730, width: 60, height: 24 },
      isVisible: true,
      display: 'inline-block',
      position: 'absolute',
      zIndex: '2',
      overflow: 'visible',
      opacity: 1,
      textMeta: { hasText: true, trimmedText: '25% OFF', textLength: 7, isUppercase: true },
    },
    {
      id: 'el_card_1_title',
      parentId: 'el_card_1',
      tagName: 'h3',
      className: 'product-title',
      xpath: '/html/body/section[2]/div[1]/h3',
      depth: 3,
      boundingRect: { x: 130, y: 930, width: 250, height: 24 },
      clientRect: { x: 130, y: 930, width: 250, height: 24 },
      isVisible: true,
      display: 'block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      textMeta: { hasText: true, trimmedText: 'Acoustic Pro Wireless', textLength: 21, isUppercase: false },
    },
    {
      id: 'el_card_1_price',
      parentId: 'el_card_1',
      tagName: 'div',
      className: 'product-price price-wrap',
      xpath: '/html/body/section[2]/div[1]/div',
      depth: 3,
      boundingRect: { x: 130, y: 960, width: 100, height: 24 },
      clientRect: { x: 130, y: 960, width: 100, height: 24 },
      isVisible: true,
      display: 'flex',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      textMeta: { hasText: true, trimmedText: '$149.00', textLength: 7, isUppercase: false },
    },
    {
      id: 'el_card_1_fav',
      parentId: 'el_card_1',
      tagName: 'button',
      className: 'wishlist-button fav-btn',
      xpath: '/html/body/section[2]/div[1]/button',
      depth: 3,
      boundingRect: { x: 350, y: 730, width: 32, height: 32 },
      clientRect: { x: 350, y: 730, width: 32, height: 32 },
      isVisible: true,
      display: 'inline-flex',
      position: 'absolute',
      zIndex: '2',
      overflow: 'visible',
      opacity: 1,
      interactive: { isClickable: true, ariaLabel: 'Add to wishlist' },
    },

    // Footer Region & Subcomponents
    {
      id: 'el_footer',
      parentId: 'el_0',
      tagName: 'footer',
      className: 'site-footer main-footer',
      xpath: '/html/body/footer',
      depth: 1,
      boundingRect: { x: 0, y: 1580, width: 1440, height: 400 },
      clientRect: { x: 0, y: 1580, width: 1440, height: 400 },
      isVisible: true,
      display: 'block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      childIds: ['el_footer_col_1', 'el_footer_copy'],
    },
    {
      id: 'el_footer_col_1',
      parentId: 'el_footer',
      tagName: 'div',
      className: 'footer-column',
      xpath: '/html/body/footer/div[1]',
      depth: 2,
      boundingRect: { x: 120, y: 1620, width: 240, height: 200 },
      clientRect: { x: 120, y: 1620, width: 240, height: 200 },
      isVisible: true,
      display: 'flex',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      childIds: ['el_f_link_1', 'el_f_link_2'],
    },
    {
      id: 'el_f_link_1',
      parentId: 'el_footer_col_1',
      tagName: 'a',
      className: 'footer-link',
      xpath: '/html/body/footer/div[1]/a[1]',
      depth: 3,
      boundingRect: { x: 120, y: 1620, width: 120, height: 24 },
      clientRect: { x: 120, y: 1620, width: 120, height: 24 },
      isVisible: true,
      display: 'block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      textMeta: { hasText: true, trimmedText: 'Privacy Policy', textLength: 14, isUppercase: false },
    },
    {
      id: 'el_f_link_2',
      parentId: 'el_footer_col_1',
      tagName: 'a',
      className: 'footer-link',
      xpath: '/html/body/footer/div[1]/a[2]',
      depth: 3,
      boundingRect: { x: 120, y: 1650, width: 120, height: 24 },
      clientRect: { x: 120, y: 1650, width: 120, height: 24 },
      isVisible: true,
      display: 'block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      textMeta: { hasText: true, trimmedText: 'Terms of Service', textLength: 16, isUppercase: false },
    },
    {
      id: 'el_footer_copy',
      parentId: 'el_footer',
      tagName: 'p',
      className: 'copyright-text',
      xpath: '/html/body/footer/p',
      depth: 2,
      boundingRect: { x: 120, y: 1900, width: 400, height: 24 },
      clientRect: { x: 120, y: 1900, width: 400, height: 24 },
      isVisible: true,
      display: 'block',
      position: 'static',
      zIndex: 'auto',
      overflow: 'visible',
      opacity: 1,
      textMeta: { hasText: true, trimmedText: '© 2026 Acme Audio Inc. All rights reserved.', textLength: 43, isUppercase: false },
    },
  ];

  return ({
    status: 'completed',
    pageUrl: 'https://store.example.com',
    title: 'Acme Audio Store',
    timestamp: Date.now(),
    extractionResult: {
      url: 'https://store.example.com',
      title: 'Acme Audio Store',
      timestamp: Date.now(),
      elements: elements as unknown as RawElementNode[],
      pageMeta: {
        title: 'Acme Audio Store',
        url: 'https://store.example.com',
        viewport: { width: 1440, height: 900 },
        devicePixelRatio: 1,
        colorScheme: 'light',
        totalElements: elements.length,
        visibleElements: elements.length,
      },
    },
    colorSystem: {
      tokens: [
        { id: '1', name: 'Primary Black', hex: '#0f172a', rgb: { r: 15, g: 23, b: 42 }, hsl: { h: 222, s: 47, l: 11 }, alpha: 1, frequency: 10, role: 'primary', isSemanticRole: true, sourceElementIds: ['el_0'] },
        { id: '2', name: 'Accent Blue', hex: '#3b82f6', rgb: { r: 59, g: 130, b: 246 }, hsl: { h: 217, s: 91, l: 60 }, alpha: 1, frequency: 5, role: 'accent', isSemanticRole: true, sourceElementIds: ['el_hero_cta'] },
      ],
      clusters: [],
      contrastPairs: [],
      stats: { totalColors: 2, distinctHues: 2, dominantPalette: ['#0f172a', '#3b82f6'] },
    },
    typographySystem: {
      tokens: [
        { id: '1', name: 'Heading 1', fontFamily: 'Inter', primaryFont: 'Inter', fontSizePx: 48, fontWeight: '700', lineHeightPx: 56, letterSpacing: 'normal', textTransform: 'none', textDecoration: 'none', textAlign: 'left', frequency: 1, hierarchyRole: 'h1', isSemanticScale: true, sourceElementIds: ['el_hero_h1'] },
      ],
      scale: [],
      stats: { totalFonts: 1, fontFamilies: ['Inter'], headingCount: 1, bodyCount: 3 },
    },
    shapeSystem: {
      radiusTokens: [{ id: 'rad_1', valuePx: 8, frequency: 4, classification: 'rounded' }],
      borderTokens: [],
      shadowTokens: [],
      gradientTokens: [],
      surfaceCounts: { flat: 8, rounded: 4 },
    },
    layoutSystem: {
      containers: [{ elementId: 'el_grid_sec', bounds: { x: 0, y: 680, width: 1440, height: 900 }, isCenteringContainer: true, hasConstrainedWidth: true, maxWidthPx: 1200, paddingPx: { top: 0, right: 24, bottom: 0, left: 24 }, childCount: 4 }],
      flexLayouts: [],
      gridLayouts: [],
      spatialRelations: [],
      spacingScale: [{ id: 'sp_1', valuePx: 16, category: 'padding', frequency: 8 }],
      sections: [
        { id: 'sec_1', elementId: 'el_header', bounds: { x: 0, y: 0, width: 1440, height: 80 }, isFullWidth: true, childCount: 4 },
        { id: 'sec_2', elementId: 'el_hero', bounds: { x: 0, y: 80, width: 1440, height: 600 }, isFullWidth: true, childCount: 3 },
        { id: 'sec_3', elementId: 'el_grid_sec', bounds: { x: 0, y: 680, width: 1440, height: 900 }, isFullWidth: true, childCount: 4 },
        { id: 'sec_4', elementId: 'el_footer', bounds: { x: 0, y: 1580, width: 1440, height: 400 }, isFullWidth: true, childCount: 2 },
      ],
      viewport: { width: 1440, height: 900, documentHeight: 2400, hasHorizontalOverflow: false },
      stats: { containerCount: 1, flexCount: 2, gridCount: 1, sectionCount: 4, relationCount: 0 },
    },
    componentSystem: {
      components: [
        { id: 'comp_header', type: 'navigation', confidence: 0.95, rootElementId: 'el_header', childElementIds: ['el_logo', 'el_nav', 'el_search', 'el_cart'], bounds: { x: 0, y: 0, width: 1440, height: 80 }, evidence: ['header tag'], colorTokenRefs: ['1'], typographyTokenRefs: ['1'], shapeTokenRefs: ['rad_1'] },
        { id: 'comp_hero', type: 'heroBanner', confidence: 0.95, rootElementId: 'el_hero', childElementIds: ['el_hero_h1', 'el_hero_p', 'el_hero_cta'], bounds: { x: 0, y: 80, width: 1440, height: 600 }, evidence: ['hero class'], colorTokenRefs: ['2'], typographyTokenRefs: ['1'], shapeTokenRefs: ['rad_1'] },
        { id: 'comp_card_1', type: 'card', confidence: 0.94, rootElementId: 'el_card_1', childElementIds: ['el_card_1_img', 'el_card_1_badge', 'el_card_1_title', 'el_card_1_price', 'el_card_1_fav'], bounds: { x: 120, y: 720, width: 270, height: 380 }, evidence: ['product-card class'], colorTokenRefs: ['1'], typographyTokenRefs: ['1'], shapeTokenRefs: ['rad_1'] },
        { id: 'comp_footer', type: 'footer', confidence: 0.95, rootElementId: 'el_footer', childElementIds: ['el_footer_col_1', 'el_footer_copy'], bounds: { x: 0, y: 1580, width: 1440, height: 400 }, evidence: ['footer tag'], colorTokenRefs: ['1'], typographyTokenRefs: ['1'], shapeTokenRefs: ['rad_1'] },
      ],
      families: [
        { familyId: 'fam_card', type: 'card', instanceCount: 4, instanceElementIds: ['el_card_1'], sharedColorTokens: ['1'], sharedTypoTokens: ['1'], evidence: ['repeated card layout'] },
      ],
      sections: [
        { id: 'sec_1', elementId: 'el_header', sectionType: 'navigation', confidence: 0.95, evidence: ['header'], componentIds: ['comp_header'] },
        { id: 'sec_2', elementId: 'el_hero', sectionType: 'heroBanner', confidence: 0.95, evidence: ['hero'], componentIds: ['comp_hero'] },
        { id: 'sec_3', elementId: 'el_grid_sec', sectionType: 'gallery', confidence: 0.92, evidence: ['products'], componentIds: ['comp_card_1'] },
        { id: 'sec_4', elementId: 'el_footer', sectionType: 'footer', confidence: 0.95, evidence: ['footer'], componentIds: ['comp_footer'] },
      ],
      patterns: [],
      stats: { totalComponents: 4, familyCount: 1, sectionCount: 4, patternCount: 0 },
    },
  } as unknown as AnalyzePageResponseData);
}

describe('Prompt 18 — Component Hierarchy & Reconstruction Tree Engine', () => {
  const mockData = createMockEcommercePageData();

  describe('1. Component Hierarchy Structure & Node Completeness', () => {
    it('builds a complete component tree from Page down to atomic subcomponents', () => {
      const treeSpec = buildComponentHierarchyTree(mockData);

      expect(treeSpec.root).toBeDefined();
      expect(treeSpec.root.name).toBe('Page');
      expect(treeSpec.root.semanticRole).toBe('page');
      expect(treeSpec.root.depth).toBe(0);
      expect(treeSpec.root.children.length).toBeGreaterThanOrEqual(4); // Header, Hero, Gallery/Grid, Footer
    });

    it('guarantees all required fields on every node in the hierarchy', () => {
      const treeSpec = buildComponentHierarchyTree(mockData);

      function assertNode(node: ComponentTreeNode) {
        expect(node.id).toBeDefined();
        expect(typeof node.id).toBe('string');
        expect(node.name).toBeDefined();
        expect(typeof node.name).toBe('string');
        expect(node.semanticRole).toBeDefined();
        expect(typeof node.semanticRole).toBe('string');
        expect(node.domSourceId).toBeDefined();
        expect(node.renderedGeometry).toBeDefined();
        expect(typeof node.renderedGeometry.width).toBe('number');
        expect(typeof node.renderedGeometry.height).toBe('number');
        expect(typeof node.depth).toBe('number');
        expect(typeof node.confidence).toBe('number');
        expect(node.confidence).toBeGreaterThanOrEqual(0);
        expect(node.confidence).toBeLessThanOrEqual(1.0);
        expect(node.provenance).toBeDefined();

        if (node.depth === 0) {
          expect(node.parentId).toBeNull();
        } else {
          expect(node.parentId).toBeDefined();
          expect(typeof node.parentId).toBe('string');
        }

        expect(Array.isArray(node.childIds)).toBe(true);
        expect(Array.isArray(node.children)).toBe(true);
        expect(node.childIds.length).toBe(node.children.length);

        for (const child of node.children) {
          assertNode(child);
        }
      }

      assertNode(treeSpec.root);
    });

    it('correctly decomposes Header into Logo, Navigation, Search, and Cart', () => {
      const treeSpec = buildComponentHierarchyTree(mockData);
      const headerNode = treeSpec.root.children.find((c) => c.name.toLowerCase().includes('nav') || c.semanticRole.includes('nav') || c.name.toLowerCase().includes('header'));

      expect(headerNode).toBeDefined();
      const childNames = headerNode!.children.map((c) => c.name);
      expect(childNames).toContain('Logo');
      expect(childNames).toContain('Navigation');
      expect(childNames).toContain('Search');
      expect(childNames).toContain('Cart');
    });

    it('correctly decomposes Hero into Heading, Description, and CTA', () => {
      const treeSpec = buildComponentHierarchyTree(mockData);
      const heroNode = treeSpec.root.children.find((c) => c.name.toLowerCase().includes('hero') || c.semanticRole.includes('hero'));

      expect(heroNode).toBeDefined();
      const childNames = heroNode!.children.map((c) => c.name);
      expect(childNames).toContain('Heading');
      expect(childNames).toContain('Description');
      expect(childNames).toContain('CTA');
    });

    it('correctly decomposes ProductGrid into ProductCards with Media, Badge, Title, Price, and WishlistButton', () => {
      const treeSpec = buildComponentHierarchyTree(mockData);
      const gridSection = treeSpec.root.children.find((c) => c.children.some((sub) => sub.name === 'ProductGrid'));

      expect(gridSection).toBeDefined();
      const productGrid = gridSection!.children.find((c) => c.name === 'ProductGrid');
      expect(productGrid).toBeDefined();
      expect(productGrid!.children.length).toBeGreaterThan(0);

      const firstCard = productGrid!.children[0];
      expect(firstCard.name).toBe('ProductCard');
      const cardChildNames = firstCard.children.map((c) => c.name);
      expect(cardChildNames).toContain('Media');
      expect(cardChildNames).toContain('Badge');
      expect(cardChildNames).toContain('Title');
      expect(cardChildNames).toContain('Price');
      expect(cardChildNames).toContain('WishlistButton');
    });

    it('correctly decomposes Footer into FooterColumn and Copyright', () => {
      const treeSpec = buildComponentHierarchyTree(mockData);
      const footerNode = treeSpec.root.children.find((c) => c.name.toLowerCase().includes('footer') || c.semanticRole.includes('footer'));

      expect(footerNode).toBeDefined();
      const childNames = footerNode!.children.map((c) => c.name);
      expect(childNames).toContain('FooterColumn');
      expect(childNames).toContain('Copyright');
    });
  });

  describe('2. Tree Integrity Guarantees', () => {
    it('guarantees zero orphan nodes throughout the entire tree', () => {
      const treeSpec = buildComponentHierarchyTree(mockData);
      const integrity = validateComponentTreeIntegrity(treeSpec.root, treeSpec.flatIndex);

      expect(integrity.zeroOrphans).toBe(true);
      expect(treeSpec.treeStats.integrity.zeroOrphans).toBe(true);

      for (const [nodeId, node] of Object.entries(treeSpec.flatIndex)) {
        if (nodeId === 'page_root') {
          expect(node.parentId).toBeNull();
        } else {
          expect(node.parentId).not.toBeNull();
          expect(treeSpec.flatIndex[node.parentId!]).toBeDefined();
        }
      }
    });

    it('guarantees an acyclic tree with no cyclic references', () => {
      const treeSpec = buildComponentHierarchyTree(mockData);
      const integrity = validateComponentTreeIntegrity(treeSpec.root, treeSpec.flatIndex);

      expect(integrity.acyclic).toBe(true);
      expect(treeSpec.treeStats.integrity.acyclic).toBe(true);
    });

    it('guarantees 100% DOM traceability for all component nodes', () => {
      const treeSpec = buildComponentHierarchyTree(mockData);
      expect(treeSpec.treeStats.integrity.domTraceabilityPct).toBe(100);

      for (const node of Object.values(treeSpec.flatIndex)) {
        expect(node.domSourceId).toBeDefined();
        expect(node.domSourceId.length).toBeGreaterThan(0);
      }
    });

    it('maintains deterministic visual and DOM ordering', () => {
      const treeSpec1 = buildComponentHierarchyTree(mockData);
      const treeSpec2 = buildComponentHierarchyTree(mockData);

      const json1 = JSON.stringify(treeSpec1.root);
      const json2 = JSON.stringify(treeSpec2.root);

      expect(json1).toBe(json2);
    });
  });

  describe('3. Export Pipeline & AI Clone Package Integration', () => {
    it('exports component-tree.json valid string with schema and flatIndex', () => {
      const jsonStr = exportComponentTreeJson(mockData);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.$schema).toContain('component-tree');
      expect(parsed.root).toBeDefined();
      expect(parsed.flatIndex).toBeDefined();
      expect(parsed.treeStats.integrity.zeroOrphans).toBe(true);
      expect(parsed.treeStats.integrity.acyclic).toBe(true);
    });

    it('bundles component-tree.json inside the AI Clone Package (.zip)', () => {
      const pkg = buildAIClonePackage(mockData);

      expect(pkg.files['component-tree.json']).toBeDefined();
      expect(pkg.files['component-tree.json'].length).toBeGreaterThan(200);

      const parsed = JSON.parse(pkg.files['component-tree.json']);
      expect(parsed.root.name).toBe('Page');
      expect(parsed.treeStats.totalNodes).toBeGreaterThan(10);
    });

    it('supports standalone artifact export for "component-tree" format', () => {
      const exporter = new ArtifactExporter();
      const res = exporter.export(mockData, 'component-tree');

      expect(res.format).toBe('component-tree');
      expect(res.exportedData).toContain('"name": "Page"');
      expect(res.artifacts['component-tree']).toBeDefined();
    });
  });
});
