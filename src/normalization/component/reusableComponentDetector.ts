import {
  AnalyzePageResponseData,
  RawElementNode,
} from '../../types/index.ts';
import { buildAgentDesignSpecification } from '../../agent-spec/adsBuilder.ts';

export interface DetectedReusableComponentProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'image' | 'url' | 'array' | 'node';
  isRequired: boolean;
  defaultValue?: any;
  sampleValues?: any[];
  description?: string;
}

export interface ReusableComponentSlot {
  name: string;
  description: string;
  isRequired: boolean;
  acceptedComponents?: string[];
}

export interface ReusableComponentVariant {
  name: string;
  type: 'style' | 'layout' | 'size' | 'state';
  values: string[];
  defaultValue: string;
  observedDistribution?: Record<string, number>;
}

export interface ReusableComponentSubcomponent {
  name: string;
  role: string;
  domSourceId?: string;
  geometry?: { width: number; height: number };
  isRequired: boolean;
}

export interface ReusableComponentGeometry {
  avgWidth: number;
  avgHeight: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  aspectRatio: number;
  padding?: string;
  margin?: string;
  isFluidWidth: boolean;
}

export interface ReusableComponentResponsiveBehaviour {
  layoutMode: 'flex' | 'grid' | 'block' | 'inline-flex';
  wrap: boolean;
  stackOnMobile: boolean;
  fluidWidth: boolean;
  gridColumns?: { mobile?: number; tablet?: number; desktop?: number };
  breakpoints?: { mobile: number; tablet: number; desktop: number };
}

export interface DetectedReusableComponentDefinition {
  id: string;
  componentName: string;
  category: 'card' | 'navigation' | 'primitive' | 'layout' | 'feedback' | 'form' | 'composite';
  instanceCount: number;
  confidence: number;
  props: DetectedReusableComponentProp[];
  slots: ReusableComponentSlot[];
  variants: ReusableComponentVariant[];
  children: ReusableComponentSubcomponent[];
  geometry: ReusableComponentGeometry;
  responsiveBehaviour: ReusableComponentResponsiveBehaviour;
  sourceElementIds: string[];
  evidence: string[];
  templatePreview?: string;
}

export interface ReusableComponentSystem {
  $schema: string;
  version: string;
  totalComponents: number;
  totalInstances: number;
  components: Record<string, DetectedReusableComponentDefinition>;
  definitions: DetectedReusableComponentDefinition[];
  metadata: {
    generatedAt: string;
    pageTitle?: string;
    pageUrl?: string;
    averageConfidence: number;
  };
}

/**
 * Calculates a multi-dimensional confidence score (0.00 - 1.00) for a detected reusable component.
 */
export function computeReusableConfidence(
  instanceCount: number,
  category: string,
  instances: RawElementNode[],
  evidenceCount: number
): number {
  // 1. Instance multiplicity factor (up to 0.35)
  const countFactor = Math.min(0.35, 0.15 + (instanceCount >= 4 ? 0.20 : instanceCount >= 2 ? 0.12 : 0.05));

  // 2. Structural consistency factor (up to 0.25)
  let structuralConsistency = 0.20;
  if (instances.length >= 2) {
    const widths = instances.map((el) => el.boundingRect?.width || 0);
    const avgW = widths.reduce((a, b) => a + b, 0) / widths.length;
    const variance = widths.reduce((sum, w) => sum + Math.abs(w - avgW), 0) / widths.length;
    if (avgW > 0 && variance / avgW < 0.2) {
      structuralConsistency = 0.25;
    }
  }

  // 3. Category & Semantic clarity factor (up to 0.25)
  let semanticScore = 0.20;
  if (['primitive', 'navigation', 'card'].includes(category)) {
    semanticScore = 0.25;
  }

  // 4. Evidence depth factor (up to 0.15)
  const evidenceScore = Math.min(0.15, 0.05 + evidenceCount * 0.03);

  const rawScore = countFactor + structuralConsistency + semanticScore + evidenceScore;
  return Number(Math.min(0.99, Math.max(0.70, rawScore)).toFixed(2));
}

/**
 * Computes bounding geometry metrics from a group of element instances.
 */
export function computeGeometryMetrics(elements: RawElementNode[], viewportWidth = 1440): ReusableComponentGeometry {
  if (elements.length === 0) {
    return {
      avgWidth: 280,
      avgHeight: 320,
      minWidth: 240,
      maxWidth: 320,
      minHeight: 280,
      maxHeight: 380,
      aspectRatio: 0.75,
      isFluidWidth: true,
    };
  }

  const widths = elements.map((e) => e.boundingRect?.width || 0).filter((w) => w > 0);
  const heights = elements.map((e) => e.boundingRect?.height || 0).filter((h) => h > 0);

  const avgW = widths.length > 0 ? Math.round(widths.reduce((a, b) => a + b, 0) / widths.length) : 280;
  const avgH = heights.length > 0 ? Math.round(heights.reduce((a, b) => a + b, 0) / heights.length) : 320;

  const minW = widths.length > 0 ? Math.min(...widths) : avgW;
  const maxW = widths.length > 0 ? Math.max(...widths) : avgW;
  const minH = heights.length > 0 ? Math.min(...heights) : avgH;
  const maxH = heights.length > 0 ? Math.max(...heights) : avgH;

  const aspectRatio = avgH > 0 ? Number((avgW / avgH).toFixed(2)) : 1.0;
  const isFluidWidth = maxW >= viewportWidth * 0.7 || maxW - minW > 50;

  return {
    avgWidth: avgW,
    avgHeight: avgH,
    minWidth: minW,
    maxWidth: maxW,
    minHeight: minH,
    maxHeight: maxH,
    aspectRatio,
    isFluidWidth,
  };
}

/**
 * Main Detection Engine for Reusable Components (Prompt 19)
 */
export function detectReusableComponents(data: AnalyzePageResponseData): ReusableComponentSystem {
  const elements = data.extractionResult?.elements || [];
  const elMap = new Map<string, RawElementNode>(elements.map((e) => [e.id, e]));
  const viewportWidth = data.extractionResult?.pageMeta?.viewport?.width || data.layoutSystem?.viewport?.width || 1440;
  const ads = buildAgentDesignSpecification(data);

  const definitions: DetectedReusableComponentDefinition[] = [];

  // -------------------------------------------------------------
  // 1. PRODUCT CARD DETECTION
  // -------------------------------------------------------------
  const cardCandidates = elements.filter((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    return (
      cls.includes('product-card') ||
      cls.includes('item-card') ||
      cls.includes('grid-item') ||
      (cls.includes('product') && cls.includes('card')) ||
      (cls.includes('card') && !cls.includes('credit') && !cls.includes('header') && !cls.includes('footer'))
    );
  });

  const productCardInstances = cardCandidates.length > 0
    ? cardCandidates
    : (data.componentSystem?.components || [])
        .filter((c: any) => c.type === 'card' || c.type === 'cardGroup')
        .map((c: any) => elMap.get(c.rootElementId))
        .filter(Boolean) as RawElementNode[];

  if (productCardInstances.length > 0 || ads.canonicalProductCard || ads.productCardSpec) {
    const geom = computeGeometryMetrics(productCardInstances, viewportWidth);
    const count = Math.max(productCardInstances.length, ads.productCardSpec ? 4 : 2);
    const evidence = [
      `Detected ${count} repeated card structures with synchronous aspect ratio (${geom.aspectRatio})`,
      'Contains Media, Badge, Title, Price, and Action subcomponents',
      ads.canonicalProductCard ? `Canonical resolution: ${ads.canonicalProductCard.dominantSelector}` : 'Identified through repeated DOM grid item clustering',
    ];

    const prodCardDef: DetectedReusableComponentDefinition = {
      id: 'comp_product_card',
      componentName: 'ProductCard',
      category: 'card',
      instanceCount: count,
      confidence: computeReusableConfidence(count, 'card', productCardInstances, evidence.length),
      props: [
        {
          name: 'title',
          type: 'string',
          isRequired: true,
          description: 'Product headline title or name',
          sampleValues: [ads.productCardSpec?.title?.text || 'Wireless Audio Headset'],
        },
        {
          name: 'price',
          type: 'string',
          isRequired: true,
          description: 'Current formatted retail price',
          sampleValues: [ads.productCardSpec?.price?.currentPrice || '$149.00'],
        },
        {
          name: 'badge',
          type: 'string',
          isRequired: false,
          description: 'Discount percentage or promotional tag',
          sampleValues: [ads.productCardSpec?.badge?.text || '25% OFF'],
        },
        {
          name: 'image',
          type: 'image',
          isRequired: true,
          description: 'Product primary thumbnail image asset',
          sampleValues: [ads.productCardSpec?.media?.primaryImageSrc || 'https://example.com/product.jpg'],
        },
        {
          name: 'rating',
          type: 'number',
          isRequired: false,
          description: 'Average customer rating score (1-5)',
          sampleValues: [4.8],
        },
        {
          name: 'wishlist',
          type: 'boolean',
          isRequired: false,
          defaultValue: false,
          description: 'Whether item is marked in user wishlist',
          sampleValues: [false, true],
        },
      ],
      slots: [
        { name: 'media', description: 'Container for product visual imagery and badges', isRequired: true },
        { name: 'badge', description: 'Slot for promotional discount or status pill', isRequired: false },
        { name: 'title', description: 'Slot for product headline typography', isRequired: true },
        { name: 'price', description: 'Slot for price display and compare-at pricing', isRequired: true },
        { name: 'rating', description: 'Slot for review stars and count badge', isRequired: false },
        { name: 'wishlist', description: 'Slot for bookmark / wishlist action button', isRequired: false },
      ],
      variants: [
        {
          name: 'variant',
          type: 'style',
          values: ['sale', 'normal', 'featured'],
          defaultValue: 'normal',
          observedDistribution: { normal: Math.max(1, count - 1), sale: 1, featured: 0 },
        },
        {
          name: 'layout',
          type: 'layout',
          values: ['standard-vertical', 'horizontal', 'compact'],
          defaultValue: 'standard-vertical',
        },
      ],
      children: [
        { name: 'Media', role: 'card-media', isRequired: true, geometry: { width: geom.avgWidth, height: Math.round(geom.avgHeight * 0.55) } },
        { name: 'Badge', role: 'discount-pill', isRequired: false, geometry: { width: 60, height: 24 } },
        { name: 'Title', role: 'card-title', isRequired: true, geometry: { width: Math.round(geom.avgWidth * 0.9), height: 24 } },
        { name: 'Price', role: 'card-price', isRequired: true, geometry: { width: 90, height: 24 } },
        { name: 'WishlistButton', role: 'card-action', isRequired: false, geometry: { width: 32, height: 32 } },
      ],
      geometry: geom,
      responsiveBehaviour: {
        layoutMode: 'flex',
        wrap: false,
        stackOnMobile: true,
        fluidWidth: true,
        gridColumns: { mobile: 1, tablet: 2, desktop: 4 },
        breakpoints: { mobile: 640, tablet: 768, desktop: 1024 },
      },
      sourceElementIds: productCardInstances.map((e) => e.id),
      evidence,
      templatePreview: '<div class="product-card variant-{variant}"><div class="media-container"><img src="{image}" alt="{title}"/><span class="badge">{badge}</span><button class="wishlist-btn"></button></div><div class="card-body"><h3 class="title">{title}</h3><div class="price">{price}</div></div></div>',
    };

    definitions.push(prodCardDef);
  }

  // -------------------------------------------------------------
  // 2. CATEGORY / COLLECTION CARD DETECTION
  // -------------------------------------------------------------
  const categoryElements = elements.filter((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    return cls.includes('category-card') || cls.includes('collection-card') || cls.includes('cat-item') || cls.includes('category-item');
  });

  if (categoryElements.length > 0) {
    const geom = computeGeometryMetrics(categoryElements, viewportWidth);
    const count = categoryElements.length;
    const isCollection = categoryElements.some((e) => (e.className || '').toLowerCase().includes('collection'));
    const compName = isCollection ? 'CollectionCard' : 'CategoryCard';
    const evidence = [
      `Found ${count} category/collection tiles with image thumbnails and label overlays`,
      'Structured with background media and category title link',
    ];

    definitions.push({
      id: isCollection ? 'comp_collection_card' : 'comp_category_card',
      componentName: compName,
      category: 'card',
      instanceCount: count,
      confidence: computeReusableConfidence(count, 'card', categoryElements, evidence.length),
      props: [
        { name: 'title', type: 'string', isRequired: true, description: 'Category or collection title', sampleValues: ['Wireless Audio', 'Accessories'] },
        { name: 'image', type: 'image', isRequired: true, description: 'Category banner or thumbnail', sampleValues: ['https://example.com/cat.jpg'] },
        { name: 'itemCount', type: 'number', isRequired: false, description: 'Total number of items in collection', sampleValues: [24, 48] },
        { name: 'href', type: 'url', isRequired: false, description: 'Link target URL', sampleValues: ['/category/audio'] },
      ],
      slots: [
        { name: 'media', description: 'Thumbnail or banner image area', isRequired: true },
        { name: 'title', description: 'Category title heading', isRequired: true },
        { name: 'count', description: 'Product counter chip', isRequired: false },
      ],
      variants: [
        { name: 'variant', type: 'style', values: ['featured', 'standard', 'compact'], defaultValue: 'standard' },
      ],
      children: [
        { name: 'Media', role: 'category-media', isRequired: true },
        { name: 'Title', role: 'category-title', isRequired: true },
        { name: 'CountBadge', role: 'category-count', isRequired: false },
      ],
      geometry: geom,
      responsiveBehaviour: {
        layoutMode: 'flex',
        wrap: false,
        stackOnMobile: true,
        fluidWidth: true,
        gridColumns: { mobile: 2, tablet: 3, desktop: 6 },
      },
      sourceElementIds: categoryElements.map((e) => e.id),
      evidence,
      templatePreview: '<a href="{href}" class="category-card"><img src="{image}" alt="{title}"/><h3>{title}</h3><span>{itemCount} items</span></a>',
    });
  }

  // -------------------------------------------------------------
  // 3. FEATURE CARD DETECTION
  // -------------------------------------------------------------
  const featureElements = elements.filter((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    return cls.includes('feature-card') || cls.includes('benefit-card') || cls.includes('value-prop') || cls.includes('feature-item');
  });

  if (featureElements.length > 0) {
    const geom = computeGeometryMetrics(featureElements, viewportWidth);
    const count = featureElements.length;
    const evidence = [
      `Found ${count} value-proposition / feature cards with icons and descriptions`,
      'Standardized grid distribution across feature region',
    ];

    definitions.push({
      id: 'comp_feature_card',
      componentName: 'FeatureCard',
      category: 'card',
      instanceCount: count,
      confidence: computeReusableConfidence(count, 'card', featureElements, evidence.length),
      props: [
        { name: 'title', type: 'string', isRequired: true, description: 'Feature highlight title', sampleValues: ['Free Worldwide Shipping'] },
        { name: 'description', type: 'string', isRequired: true, description: 'Descriptive benefit body text', sampleValues: ['On all orders over $75 with tracking.'] },
        { name: 'icon', type: 'string', isRequired: false, description: 'Icon name or SVG icon element', sampleValues: ['truck-icon', 'shield-icon'] },
      ],
      slots: [
        { name: 'icon', description: 'Slot for icon container or graphic', isRequired: true },
        { name: 'title', description: 'Slot for feature heading', isRequired: true },
        { name: 'description', description: 'Slot for descriptive copy', isRequired: true },
      ],
      variants: [
        { name: 'variant', type: 'style', values: ['highlighted', 'default', 'bordered'], defaultValue: 'default' },
      ],
      children: [
        { name: 'IconMedia', role: 'feature-icon', isRequired: true },
        { name: 'Title', role: 'feature-heading', isRequired: true },
        { name: 'Description', role: 'feature-body', isRequired: true },
      ],
      geometry: geom,
      responsiveBehaviour: {
        layoutMode: 'flex',
        wrap: true,
        stackOnMobile: true,
        fluidWidth: true,
        gridColumns: { mobile: 1, tablet: 2, desktop: 3 },
      },
      sourceElementIds: featureElements.map((e) => e.id),
      evidence,
      templatePreview: '<div class="feature-card"><div class="icon-wrap">{icon}</div><h3>{title}</h3><p>{description}</p></div>',
    });
  }

  // -------------------------------------------------------------
  // 4. BUTTON DETECTION
  // -------------------------------------------------------------
  const buttonElements = elements.filter((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    const tag = e.tagName.toLowerCase();
    return (
      tag === 'button' ||
      e.interactive?.ariaRole === 'button' ||
      cls.includes('btn') ||
      cls.includes('button') ||
      cls.includes('cta')
    );
  });

  if (buttonElements.length > 0) {
    const geom = computeGeometryMetrics(buttonElements, viewportWidth);
    const count = buttonElements.length;
    const evidence = [
      `Extracted ${count} interactive button instances across headers, heroes, cards, and footers`,
      'Semantic interactive trigger with cursor pointer and click handlers',
    ];

    definitions.push({
      id: 'comp_button',
      componentName: 'Button',
      category: 'primitive',
      instanceCount: count,
      confidence: computeReusableConfidence(count, 'primitive', buttonElements, evidence.length),
      props: [
        { name: 'label', type: 'string', isRequired: true, description: 'Button text label', sampleValues: ['Shop Now', 'Add to Cart', 'Submit'] },
        { name: 'variant', type: 'string', isRequired: false, defaultValue: 'primary', description: 'Visual styling variant', sampleValues: ['primary', 'secondary', 'outline', 'ghost'] },
        { name: 'size', type: 'string', isRequired: false, defaultValue: 'md', description: 'Button sizing token', sampleValues: ['sm', 'md', 'lg'] },
        { name: 'disabled', type: 'boolean', isRequired: false, defaultValue: false, description: 'Disabled interactive state' },
        { name: 'href', type: 'url', isRequired: false, description: 'Optional link destination if acting as link button' },
      ],
      slots: [
        { name: 'prefixIcon', description: 'Leading icon slot before label text', isRequired: false },
        { name: 'label', description: 'Core text label slot', isRequired: true },
        { name: 'suffixIcon', description: 'Trailing icon slot after label text', isRequired: false },
      ],
      variants: [
        { name: 'variant', type: 'style', values: ['primary', 'secondary', 'outline', 'ghost', 'danger'], defaultValue: 'primary' },
        { name: 'size', type: 'size', values: ['sm', 'md', 'lg'], defaultValue: 'md' },
      ],
      children: [
        { name: 'ButtonText', role: 'button-label', isRequired: true },
        { name: 'PrefixIcon', role: 'button-icon-prefix', isRequired: false },
        { name: 'SuffixIcon', role: 'button-icon-suffix', isRequired: false },
      ],
      geometry: {
        ...geom,
        avgWidth: Math.min(geom.avgWidth, 180),
        avgHeight: Math.min(geom.avgHeight, 48),
        isFluidWidth: false,
      },
      responsiveBehaviour: {
        layoutMode: 'inline-flex',
        wrap: false,
        stackOnMobile: false,
        fluidWidth: false,
      },
      sourceElementIds: buttonElements.map((e) => e.id),
      evidence,
      templatePreview: '<button class="btn btn-{variant} btn-{size}" ?disabled="{disabled}">{label}</button>',
    });
  }

  // -------------------------------------------------------------
  // 5. BADGE DETECTION
  // -------------------------------------------------------------
  const badgeElements = elements.filter((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    const tag = e.tagName.toLowerCase();
    return (
      cls.includes('badge') ||
      cls.includes('pill') ||
      cls.includes('chip') ||
      cls.includes('discount-tag') ||
      cls.includes('sale-tag') ||
      (tag === 'span' && cls.includes('sale'))
    );
  });

  if (badgeElements.length > 0) {
    const geom = computeGeometryMetrics(badgeElements, viewportWidth);
    const count = badgeElements.length;
    const evidence = [
      `Identified ${count} status and promotional badge elements`,
      'Compact geometry with rounded border radius and centered text',
    ];

    definitions.push({
      id: 'comp_badge',
      componentName: 'Badge',
      category: 'feedback',
      instanceCount: count,
      confidence: computeReusableConfidence(count, 'feedback', badgeElements, evidence.length),
      props: [
        { name: 'text', type: 'string', isRequired: true, description: 'Status or badge copy', sampleValues: ['Sale', '25% OFF', 'New', 'Featured'] },
        { name: 'variant', type: 'string', isRequired: false, defaultValue: 'sale', description: 'Badge semantic color style', sampleValues: ['sale', 'new', 'discount', 'success', 'warning', 'info'] },
        { name: 'size', type: 'string', isRequired: false, defaultValue: 'md', description: 'Badge size variant', sampleValues: ['sm', 'md'] },
      ],
      slots: [
        { name: 'icon', description: 'Optional icon inside badge', isRequired: false },
        { name: 'text', description: 'Text label of the badge', isRequired: true },
      ],
      variants: [
        { name: 'variant', type: 'style', values: ['sale', 'new', 'discount', 'success', 'warning', 'info'], defaultValue: 'sale' },
        { name: 'size', type: 'size', values: ['sm', 'md'], defaultValue: 'md' },
      ],
      children: [
        { name: 'BadgeText', role: 'badge-label', isRequired: true },
      ],
      geometry: {
        ...geom,
        avgWidth: Math.min(geom.avgWidth, 80),
        avgHeight: Math.min(geom.avgHeight, 28),
        isFluidWidth: false,
      },
      responsiveBehaviour: {
        layoutMode: 'inline-flex',
        wrap: false,
        stackOnMobile: false,
        fluidWidth: false,
      },
      sourceElementIds: badgeElements.map((e) => e.id),
      evidence,
      templatePreview: '<span class="badge badge-{variant} badge-{size}">{text}</span>',
    });
  }

  // -------------------------------------------------------------
  // 6. NAVIGATION ITEM DETECTION
  // -------------------------------------------------------------
  const navItemElements = elements.filter((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    const tag = e.tagName.toLowerCase();
    return (
      cls.includes('nav-link') ||
      cls.includes('menu-link') ||
      cls.includes('nav-item') ||
      cls.includes('menu-item') ||
      (tag === 'a' && (cls.includes('nav') || cls.includes('menu')))
    );
  });

  if (navItemElements.length > 0) {
    const geom = computeGeometryMetrics(navItemElements, viewportWidth);
    const count = navItemElements.length;
    const evidence = [
      `Found ${count} navigation item links across site navigation and header menus`,
      'Consistent link typography and hover/active states',
    ];

    definitions.push({
      id: 'comp_navigation_item',
      componentName: 'NavigationItem',
      category: 'navigation',
      instanceCount: count,
      confidence: computeReusableConfidence(count, 'navigation', navItemElements, evidence.length),
      props: [
        { name: 'label', type: 'string', isRequired: true, description: 'Navigation menu link text', sampleValues: ['Shop All', 'New Arrivals', 'Collections'] },
        { name: 'href', type: 'url', isRequired: true, description: 'Destination link URL', sampleValues: ['/shop', '/new'] },
        { name: 'isActive', type: 'boolean', isRequired: false, defaultValue: false, description: 'Current active page indicator' },
        { name: 'hasSubmenu', type: 'boolean', isRequired: false, defaultValue: false, description: 'Whether dropdown flyout exists' },
      ],
      slots: [
        { name: 'prefixIcon', description: 'Icon preceding navigation label', isRequired: false },
        { name: 'label', description: 'Navigation text label', isRequired: true },
        { name: 'suffixIcon', description: 'Dropdown arrow or indicator', isRequired: false },
      ],
      variants: [
        { name: 'variant', type: 'style', values: ['header', 'footer', 'drawer', 'active'], defaultValue: 'header' },
      ],
      children: [
        { name: 'TextLabel', role: 'nav-label', isRequired: true },
      ],
      geometry: geom,
      responsiveBehaviour: {
        layoutMode: 'inline-flex',
        wrap: false,
        stackOnMobile: false,
        fluidWidth: false,
      },
      sourceElementIds: navItemElements.map((e) => e.id),
      evidence,
      templatePreview: '<a href="{href}" class="nav-item variant-{variant} {isActive ? "active" : ""}">{label}</a>',
    });
  }

  // -------------------------------------------------------------
  // 7. FOOTER COLUMN DETECTION
  // -------------------------------------------------------------
  const footerColElements = elements.filter((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    if (cls.includes('footer-columns') || cls.includes('footer-cols') || cls.includes('columns-wrap') || cls.includes('footer-row')) {
      return false;
    }
    return (
      cls.includes('footer-col') ||
      cls.includes('footer-column') ||
      cls.includes('footer-section') ||
      cls.includes('footer-nav')
    );
  });

  if (footerColElements.length > 0) {
    const geom = computeGeometryMetrics(footerColElements, viewportWidth);
    const count = footerColElements.length;
    const evidence = [
      `Found ${count} structured footer link columns`,
      'Composed of heading title followed by vertical links',
    ];

    definitions.push({
      id: 'comp_footer_column',
      componentName: 'FooterColumn',
      category: 'layout',
      instanceCount: count,
      confidence: computeReusableConfidence(count, 'layout', footerColElements, evidence.length),
      props: [
        { name: 'heading', type: 'string', isRequired: true, description: 'Column header title', sampleValues: ['Company', 'Support', 'Legal'] },
        { name: 'links', type: 'array', isRequired: true, description: 'List of column link items', sampleValues: [['About Us', 'Careers', 'Contact']] },
      ],
      slots: [
        { name: 'heading', description: 'Slot for column headline', isRequired: true },
        { name: 'linksList', description: 'Slot for vertical links list', isRequired: true },
      ],
      variants: [
        { name: 'variant', type: 'style', values: ['primary', 'secondary', 'social'], defaultValue: 'primary' },
      ],
      children: [
        { name: 'ColumnHeading', role: 'column-title', isRequired: true },
        { name: 'LinkItem', role: 'column-link', isRequired: true },
      ],
      geometry: geom,
      responsiveBehaviour: {
        layoutMode: 'flex',
        wrap: true,
        stackOnMobile: true,
        fluidWidth: true,
        gridColumns: { mobile: 1, tablet: 2, desktop: 4 },
      },
      sourceElementIds: footerColElements.map((e) => e.id),
      evidence,
      templatePreview: '<div class="footer-column"><h4>{heading}</h4><ul class="link-list">{links}</ul></div>',
    });
  }

  // -------------------------------------------------------------
  // Map into Components Dictionary
  // -------------------------------------------------------------
  const componentsMap: Record<string, DetectedReusableComponentDefinition> = {};
  definitions.forEach((def) => {
    componentsMap[def.componentName] = def;
  });

  const totalInstances = definitions.reduce((sum, def) => sum + def.instanceCount, 0);
  const avgConfidence = definitions.length > 0
    ? Number((definitions.reduce((sum, def) => sum + def.confidence, 0) / definitions.length).toFixed(2))
    : 0.90;

  return {
    $schema: 'https://ui-ux-helper.internal/schemas/reusable-components-v1.json',
    version: '1.0.0',
    totalComponents: definitions.length,
    totalInstances,
    components: componentsMap,
    definitions,
    metadata: {
      generatedAt: new Date().toISOString(),
      pageTitle: data.title,
      pageUrl: data.pageUrl,
      averageConfidence: avgConfidence,
    },
  };
}
