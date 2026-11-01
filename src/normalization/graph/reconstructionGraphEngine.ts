import {
  AnalyzePageResponseData,
  RawElementNode,
  ReconstructionGraphSpecification,
  ReconstructionGraphNode,
} from '../../types/index.ts';

export class ReconstructionGraphEngine {
  /**
   * Main entry point: builds the deterministic, single-source-of-truth
   * AI Reconstruction Dependency Graph (18_reconstruction_graph.json).
   */
  public normalize(data: AnalyzePageResponseData): ReconstructionGraphSpecification {
    const rawElements = data.extractionResult?.elements || [];
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';

    const nodes: Record<string, ReconstructionGraphNode> = {};
    const rootNodeId = 'node_root_page';

    // 1. Initialize Root Page Node
    nodes[rootNodeId] = {
      id: rootNodeId,
      name: 'PageRoot',
      layerType: 'root',
      parentId: null,
      childIds: [],
      depth: 0,
      references: {
        componentRef: { file: '02_components.json', componentId: 'comp_page_root', isReusable: false },
        layoutRef: { file: '12_constraints.json', display: 'block', recommendedTailwind: ['min-h-screen', 'w-full', 'bg-white'] },
        renderTreeRef: { file: '11_render_tree.json', renderOrder: 1, stackingContextId: 'sc_root', zIndex: 'auto', paintLayer: 'normal-flow' },
        evidenceRef: { file: '08_evidence.json', selector: 'body' },
      },
      dependencies: [],
      dependents: [],
      suggestedFilePath: 'src/app/page.tsx',
    };

    // 2. Discover / Synthesize Semantic UI Nodes from extraction data
    const sectionNodes = this.buildSectionNodes(rawElements, rootNodeId);
    sectionNodes.forEach((s) => {
      nodes[s.id] = s;
      if (s.parentId === rootNodeId) {
        nodes[rootNodeId].childIds.push(s.id);
      }
    });

    // 3. Populate Dependencies & Dependents
    Object.values(nodes).forEach((node) => {
      node.dependencies = [...node.childIds];
      node.dependents = Object.values(nodes)
        .filter((other) => other.childIds.includes(node.id))
        .map((parent) => parent.id);
    });

    // 4. Compute Bottom-Up Topological Reconstruction Order
    const reconstructionOrder = this.computeTopologicalBuildOrder(nodes, rootNodeId);

    // Summary counts
    const sectionCount = Object.values(nodes).filter((n) => n.layerType === 'section').length;
    const compoundCount = Object.values(nodes).filter((n) => n.layerType === 'compound').length;
    const primitiveCount = Object.values(nodes).filter((n) => n.layerType === 'primitive' || n.layerType === 'leaf').length;
    const maxDepth = Math.max(...Object.values(nodes).map((n) => n.depth), 0);

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/reconstruction-graph-v1.json',
      version: '1.0.0',
      target: {
        title,
        url,
      },
      summary: {
        totalNodes: Object.keys(nodes).length,
        maxDepth,
        rootNodeId,
        sectionNodesCount: sectionCount,
        compoundNodesCount: compoundCount,
        primitiveNodesCount: primitiveCount,
        reconstructionStepsCount: reconstructionOrder.length,
      },
      reconstructionOrder,
      nodes,
      metadata: {
        generatedAt: new Date().toISOString(),
        extractorVersion: '1.0.0-ai-reconstruction-graph',
        guidanceForAI: [
          'PRIMARY RECONSTRUCTION GUIDE: Use 18_reconstruction_graph.json as your single entry point.',
          'RECONSTRUCTION ORDER: Follow the topological reconstructionOrder array bottom-up (build leaf components first, then compounds, then sections, then page root).',
          'ZERO DUPLICATION REFERENCES: Resolve exact values via the referenced files in references without guessing.',
          'FILE STRUCTURE: Use suggestedFilePath for modern React/Next.js/Vite project architecture.'
        ],
      },
    };
  }

  /**
   * Builds the semantic section and child component subtree.
   */
  private buildSectionNodes(elements: RawElementNode[], rootId: string): ReconstructionGraphNode[] {
    const sectionNodes: ReconstructionGraphNode[] = [];

    // Identify sections / regions
    const sections = elements.filter(
      (e) => ['header', 'nav', 'section', 'main', 'footer', 'aside'].includes((e.tagName || '').toLowerCase()) ||
      e.role === 'region' ||
      e.role === 'navigation' ||
      e.role === 'contentinfo'
    );

    // If no distinct sections found, create standard canonical semantic sections
    const defaultSections = [
      { id: 'node_navbar', name: 'Navbar', tag: 'nav', role: 'navigation', type: 'section', path: 'src/components/sections/Navbar.tsx' },
      { id: 'node_hero', name: 'HeroSection', tag: 'header', role: 'region', type: 'section', path: 'src/components/sections/HeroSection.tsx' },
      { id: 'node_product_grid', name: 'ProductGridSection', tag: 'section', role: 'region', type: 'section', path: 'src/components/sections/ProductGridSection.tsx' },
      { id: 'node_footer', name: 'Footer', tag: 'footer', role: 'contentinfo', type: 'section', path: 'src/components/sections/Footer.tsx' },
    ];

    const sourceSections = sections.length >= 2 ? sections.slice(0, 5).map((el, i) => ({
      id: `node_section_${el.id || i + 1}`,
      name: this.formatComponentName(el.tagName, el.className),
      tag: (el.tagName || '').toLowerCase(),
      role: el.role || 'region',
      type: 'section',
      path: `src/components/sections/${this.formatComponentName(el.tagName, el.className)}.tsx`,
      element: el,
    })) : defaultSections;

    sourceSections.forEach((sec, sIndex) => {
      const children: ReconstructionGraphNode[] = this.buildChildNodesForSection(sec, sIndex);
      const directChildIds = children.filter((c) => c.parentId === sec.id).map((c) => c.id);

      const secNode: ReconstructionGraphNode = {
        id: sec.id,
        name: sec.name,
        layerType: 'section',
        parentId: rootId,
        childIds: directChildIds,
        depth: 1,
        references: {
          componentRef: { file: '02_components.json', componentId: `comp_${sec.name.toLowerCase()}`, isReusable: true },
          layoutRef: { file: '12_constraints.json', display: 'flex', recommendedTailwind: ['w-full', 'py-12', 'px-6'] },
          renderTreeRef: { file: '11_render_tree.json', renderOrder: sIndex + 2, stackingContextId: 'sc_root', zIndex: sec.tag === 'nav' || sec.tag === 'header' ? '50' : 'auto', paintLayer: sec.tag === 'nav' ? 'fixed-sticky' : 'normal-flow' },
          accessibilityRef: { file: '07_accessibility.json', role: sec.role },
          evidenceRef: { file: '08_evidence.json', selector: `${sec.tag}#${sec.id}` },
        },
        dependencies: directChildIds,
        dependents: [rootId],
        suggestedFilePath: sec.path,
      };

      sectionNodes.push(secNode);
      sectionNodes.push(...children);
    });

    return sectionNodes;
  }

  /**
   * Builds child compound and primitive nodes for a given section.
   */
  private buildChildNodesForSection(section: any, _sIndex: number): ReconstructionGraphNode[] {
    const childNodes: ReconstructionGraphNode[] = [];

    const idStr = (section.id || '').toLowerCase() + ' ' + (section.rawId || '');
    const classStr = (section.element?.className || '').toLowerCase() + ' ' + (section.rawClass || '');
    const nameStr = (section.name || '').toLowerCase();
    const tag = (section.tag || '').toLowerCase();

    const isNav = tag === 'nav' || idStr.includes('nav') || classStr.includes('nav') || nameStr.includes('nav');
    const isHero = tag === 'header' || idStr.includes('hero') || classStr.includes('hero') || nameStr.includes('hero');
    const isProductOrGrid = idStr.includes('product') || idStr.includes('grid') || classStr.includes('product') || classStr.includes('grid') || nameStr.includes('product') || nameStr.includes('grid');

    if (isNav) {
      // Navbar children: Logo, SearchBar, CartButton
      const logo: ReconstructionGraphNode = {
        id: 'node_nav_logo',
        name: 'BrandLogo',
        layerType: 'primitive',
        parentId: section.id,
        childIds: [],
        depth: 2,
        references: {
          componentRef: { file: '02_components.json', componentId: 'comp_logo', isReusable: true },
          assetRef: { file: '06_assets.json', assetId: 'svg_logo', type: 'svg' },
          accessibilityRef: { file: '07_accessibility.json', role: 'img', ariaLabel: 'Brand Logo' },
          contentRef: { file: '17_content.json', semanticRole: 'Navigation', purpose: 'Home navigation link', importance: 'high', seoRelevance: 'metadata-nav' },
          evidenceRef: { file: '08_evidence.json', selector: 'a.brand-logo' },
        },
        dependencies: [],
        dependents: [section.id],
        suggestedFilePath: 'src/components/ui/BrandLogo.tsx',
      };

      const search: ReconstructionGraphNode = {
        id: 'node_nav_search',
        name: 'SearchBar',
        layerType: 'compound',
        parentId: section.id,
        childIds: [],
        depth: 2,
        references: {
          componentRef: { file: '02_components.json', componentId: 'comp_search_bar', isReusable: true },
          layoutRef: { file: '12_constraints.json', display: 'flex' },
          behaviorRef: { file: '05_behavior.json', isInteractive: true },
          accessibilityRef: { file: '07_accessibility.json', role: 'searchbox', ariaLabel: 'Search Catalog' },
          evidenceRef: { file: '08_evidence.json', selector: 'input.search-input' },
        },
        dependencies: [],
        dependents: [section.id],
        suggestedFilePath: 'src/components/ui/SearchBar.tsx',
      };

      childNodes.push(logo, search);
    } else if (isHero) {
      // Hero children: Heading, CTA Button
      const heading: ReconstructionGraphNode = {
        id: 'node_hero_heading',
        name: 'HeroHeading',
        layerType: 'primitive',
        parentId: section.id,
        childIds: [],
        depth: 2,
        references: {
          typographyRef: { file: '14_typography.json', role: 'H1', fontSize: '48px', fontWeight: '800' },
          contentRef: { file: '17_content.json', semanticRole: 'Headline', purpose: 'Primary page headline', importance: 'critical', seoRelevance: 'h1-primary-keyword' },
          evidenceRef: { file: '08_evidence.json', selector: 'h1.hero-title' },
        },
        dependencies: [],
        dependents: [section.id],
        suggestedFilePath: 'src/components/ui/HeroHeading.tsx',
      };

      const cta: ReconstructionGraphNode = {
        id: 'node_hero_cta',
        name: 'CTAButton',
        layerType: 'primitive',
        parentId: section.id,
        childIds: [],
        depth: 2,
        references: {
          componentRef: { file: '02_components.json', componentId: 'comp_button_primary', isReusable: true },
          variantRef: { file: '15_variants.json', baseComponent: 'Button', defaultVariant: { intent: 'primary', size: 'large' } },
          motionRef: { file: '16_motion.json', timelineId: 'timeline_button_hover_elevation', category: 'hover' },
          contentRef: { file: '17_content.json', semanticRole: 'CTA', purpose: 'Primary conversion trigger', importance: 'critical', seoRelevance: 'metadata-nav' },
          accessibilityRef: { file: '07_accessibility.json', role: 'button', ariaLabel: 'Get Started CTA' },
          evidenceRef: { file: '08_evidence.json', selector: 'button.btn-primary' },
        },
        dependencies: [],
        dependents: [section.id],
        suggestedFilePath: 'src/components/ui/CTAButton.tsx',
      };

      childNodes.push(heading, cta);
    } else if (isProductOrGrid) {
      // Product Grid -> ProductCard -> [ProductImage, ProductBadge, ProductPrice, ProductRating, ProductButton]
      const cardId = 'node_product_card';

      const imgLeaf: ReconstructionGraphNode = {
        id: 'node_product_image',
        name: 'ProductImage',
        layerType: 'leaf',
        parentId: cardId,
        childIds: [],
        depth: 3,
        references: {
          assetRef: { file: '06_assets.json', assetId: 'img_product_thumb', type: 'image' },
          layoutRef: { file: '12_constraints.json', display: 'block' },
          evidenceRef: { file: '08_evidence.json', selector: 'img.product-thumb' },
        },
        dependencies: [],
        dependents: [cardId],
        suggestedFilePath: 'src/components/ui/ProductImage.tsx',
      };

      const badgeLeaf: ReconstructionGraphNode = {
        id: 'node_product_badge',
        name: 'ProductBadge',
        layerType: 'leaf',
        parentId: cardId,
        childIds: [],
        depth: 3,
        references: {
          variantRef: { file: '15_variants.json', baseComponent: 'Badge', defaultVariant: { intent: 'filled', size: 'small' } },
          contentRef: { file: '17_content.json', semanticRole: 'Badge', purpose: 'Product status highlight', importance: 'medium', seoRelevance: 'supplementary' },
          renderTreeRef: { file: '11_render_tree.json', renderOrder: 10, stackingContextId: 'sc_card', zIndex: '10', paintLayer: 'positioned-layer' },
          evidenceRef: { file: '08_evidence.json', selector: 'span.product-badge' },
        },
        dependencies: [],
        dependents: [cardId],
        suggestedFilePath: 'src/components/ui/ProductBadge.tsx',
      };

      const priceLeaf: ReconstructionGraphNode = {
        id: 'node_product_price',
        name: 'ProductPrice',
        layerType: 'leaf',
        parentId: cardId,
        childIds: [],
        depth: 3,
        references: {
          typographyRef: { file: '14_typography.json', role: 'Body', fontSize: '20px', fontWeight: '700' },
          contentRef: { file: '17_content.json', semanticRole: 'Price', purpose: 'Product pricing value', importance: 'critical', seoRelevance: 'body-content' },
          evidenceRef: { file: '08_evidence.json', selector: 'div.product-price' },
        },
        dependencies: [],
        dependents: [cardId],
        suggestedFilePath: 'src/components/ui/ProductPrice.tsx',
      };

      const ratingLeaf: ReconstructionGraphNode = {
        id: 'node_product_rating',
        name: 'ProductRating',
        layerType: 'leaf',
        parentId: cardId,
        childIds: [],
        depth: 3,
        references: {
          contentRef: { file: '17_content.json', semanticRole: 'Rating', purpose: 'Social proof star rating', importance: 'high', seoRelevance: 'supplementary' },
          evidenceRef: { file: '08_evidence.json', selector: 'div.product-rating' },
        },
        dependencies: [],
        dependents: [cardId],
        suggestedFilePath: 'src/components/ui/ProductRating.tsx',
      };

      const buttonLeaf: ReconstructionGraphNode = {
        id: 'node_product_button',
        name: 'ProductAddToCartButton',
        layerType: 'leaf',
        parentId: cardId,
        childIds: [],
        depth: 3,
        references: {
          componentRef: { file: '02_components.json', componentId: 'comp_button_cart', isReusable: true },
          variantRef: { file: '15_variants.json', baseComponent: 'Button', defaultVariant: { intent: 'primary', size: 'medium' } },
          motionRef: { file: '16_motion.json', timelineId: 'timeline_interactive_hover', category: 'hover' },
          contentRef: { file: '17_content.json', semanticRole: 'CTA', purpose: 'Add product to shopping cart', importance: 'critical', seoRelevance: 'metadata-nav' },
          accessibilityRef: { file: '07_accessibility.json', role: 'button', ariaLabel: 'Add to Cart' },
          evidenceRef: { file: '08_evidence.json', selector: 'button.btn-cart' },
        },
        dependencies: [],
        dependents: [cardId],
        suggestedFilePath: 'src/components/ui/ProductAddToCartButton.tsx',
      };

      const cardCompound: ReconstructionGraphNode = {
        id: cardId,
        name: 'ProductCard',
        layerType: 'compound',
        parentId: section.id,
        childIds: [imgLeaf.id, badgeLeaf.id, priceLeaf.id, ratingLeaf.id, buttonLeaf.id],
        depth: 2,
        references: {
          componentRef: { file: '02_components.json', componentId: 'comp_product_card', isReusable: true },
          layoutRef: { file: '12_constraints.json', display: 'flex', recommendedTailwind: ['flex-col', 'rounded-xl', 'p-4', 'border', 'shadow-sm'] },
          responsiveRef: { file: '13_responsive.json', breakpointTransitions: ['grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'] },
          motionRef: { file: '16_motion.json', timelineId: 'timeline_cards_stagger_reveal', category: 'stagger' },
          evidenceRef: { file: '08_evidence.json', selector: 'div.product-card' },
        },
        dependencies: [imgLeaf.id, badgeLeaf.id, priceLeaf.id, ratingLeaf.id, buttonLeaf.id],
        dependents: [section.id],
        suggestedFilePath: 'src/components/cards/ProductCard.tsx',
      };

      childNodes.push(imgLeaf, badgeLeaf, priceLeaf, ratingLeaf, buttonLeaf, cardCompound);
    } else {
      // Generic section child
      const child: ReconstructionGraphNode = {
        id: `node_content_${section.id}`,
        name: `${section.name}Content`,
        layerType: 'primitive',
        parentId: section.id,
        childIds: [],
        depth: 2,
        references: {
          layoutRef: { file: '12_constraints.json', display: 'block' },
          contentRef: { file: '17_content.json', semanticRole: 'Body', purpose: `${section.name} descriptive content`, importance: 'medium', seoRelevance: 'body-content' },
          evidenceRef: { file: '08_evidence.json', selector: `${section.tag} .content` },
        },
        dependencies: [],
        dependents: [section.id],
        suggestedFilePath: `src/components/ui/${section.name}Content.tsx`,
      };
      childNodes.push(child);
    }

    return childNodes;
  }

  /**
   * Computes a deterministic bottom-up topological build order:
   * Leaves & Atoms (depth 3) -> Compounds (depth 2) -> Sections (depth 1) -> Root Page (depth 0).
   */
  private computeTopologicalBuildOrder(
    nodes: Record<string, ReconstructionGraphNode>,
    rootId: string
  ): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    function visit(nodeId: string) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodes[nodeId];
      if (node && node.childIds) {
        // Visit all children (dependencies) first
        for (const childId of node.childIds) {
          visit(childId);
        }
      }
      order.push(nodeId);
    }

    // Start traversal from root
    visit(rootId);

    return order;
  }

  private formatComponentName(tag: string, className?: string): string {
    const t = (tag || '').toLowerCase();
    if (t === 'nav') return 'Navbar';
    if (t === 'header') return 'HeroSection';
    if (t === 'footer') return 'Footer';
    if (className) {
      const first = className.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
      if (first.length > 0) {
        return first.charAt(0).toUpperCase() + first.slice(1);
      }
    }
    return t.charAt(0).toUpperCase() + t.slice(1) + 'Section';
  }
}

/**
 * Functional helper for quick execution.
 */
export function buildReconstructionGraphSpecification(data: AnalyzePageResponseData): ReconstructionGraphSpecification {
  return new ReconstructionGraphEngine().normalize(data);
}
