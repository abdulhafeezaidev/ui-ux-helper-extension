import { describe, it, expect } from 'vitest';
import { AnalyzePageResponseData, RawElementNode } from '../src/types/index.ts';
import {
  SpatialRelationshipAnalyzer,
  LayoutRelationshipGraphEngine,
  ContainerHierarchyEngine,
  SectionFlowEngine,
} from '../src/normalization/layout/relationships/index.ts';
import {
  exportLayoutRelationshipGraphJson,
  exportContainerHierarchyJson,
  exportSectionFlowJson,
} from '../src/output/layout/index.ts';
import { exportArtifact } from '../src/output/artifactExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';

describe('V2.0 – Phase 3: Layout Relationship Engine', () => {
  const createMockData = (): AnalyzePageResponseData => {
    const rawElements: RawElementNode[] = [
      // 1. Header (Sticky Top, Flex Row, Space-Between)
      {
        id: 'el_header',
        tagName: 'HEADER',
        className: 'main-header sticky-nav',
        role: 'banner',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        padding: { top: '16px', right: '32px', bottom: '16px', left: '32px' },
        boundingRect: { x: 0, y: 0, width: 1440, height: 72 },
        childIds: ['el_nav_logo', 'el_nav_links'],
      } as any,
      {
        id: 'el_nav_logo',
        tagName: 'DIV',
        className: 'nav-logo',
        parentId: 'el_header',
        display: 'block',
        boundingRect: { x: 32, y: 16, width: 120, height: 40 },
        childIds: [],
      } as any,
      {
        id: 'el_nav_links',
        tagName: 'NAV',
        className: 'nav-links flex-row',
        parentId: 'el_header',
        display: 'flex',
        boundingRect: { x: 1000, y: 16, width: 408, height: 40 },
        childIds: [],
      } as any,

      // 2. Hero Section (Flex Column, Centered, 80px Padding)
      {
        id: 'el_hero_section',
        tagName: 'SECTION',
        className: 'hero-section flex-col-centered',
        role: 'region',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { top: '80px', right: '32px', bottom: '80px', left: '32px' },
        boundingRect: { x: 0, y: 72, width: 1440, height: 600 },
        childIds: ['el_hero_heading', 'el_hero_cta'],
      } as any,
      {
        id: 'el_hero_heading',
        tagName: 'H1',
        className: 'hero-title',
        parentId: 'el_hero_section',
        role: 'heading',
        typography: { fontSize: '48px', fontWeight: '700' } as any,
        boundingRect: { x: 320, y: 180, width: 800, height: 60 },
        childIds: [],
      } as any,
      {
        id: 'el_hero_cta',
        tagName: 'BUTTON',
        className: 'btn btn-primary cta-btn',
        parentId: 'el_hero_section',
        role: 'button',
        borderRadius: { topLeft: '999px', topRight: '999px', bottomRight: '999px', bottomLeft: '999px' },
        padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' },
        boundingRect: { x: 620, y: 264, width: 200, height: 48 }, // 264 - (180 + 60) = 24px vertical gap
        childIds: [],
        interactive: { isClickable: true, cursor: 'pointer' },
      } as any,

      // 3. Product Catalog Section (Grid Container, 4-columns)
      {
        id: 'el_catalog_section',
        tagName: 'SECTION',
        className: 'catalog-section',
        role: 'region',
        display: 'block',
        padding: { top: '64px', right: '32px', bottom: '64px', left: '32px' },
        boundingRect: { x: 0, y: 672, width: 1440, height: 900 },
        childIds: ['el_product_grid'],
      } as any,
      {
        id: 'el_product_grid',
        tagName: 'DIV',
        className: 'product-grid-container grid-4col',
        parentId: 'el_catalog_section',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: { row: '24px', column: '24px' },
        boundingRect: { x: 32, y: 736, width: 1376, height: 800 },
        childIds: ['el_card_1', 'el_card_2', 'el_card_3', 'el_card_4'],
      } as any,
      {
        id: 'el_card_1',
        tagName: 'DIV',
        className: 'product-card',
        parentId: 'el_product_grid',
        boundingRect: { x: 32, y: 736, width: 320, height: 380 },
        childIds: [],
      } as any,
      {
        id: 'el_card_2',
        tagName: 'DIV',
        className: 'product-card',
        parentId: 'el_product_grid',
        boundingRect: { x: 384, y: 736, width: 320, height: 380 },
        childIds: [],
      } as any,
      {
        id: 'el_card_3',
        tagName: 'DIV',
        className: 'product-card',
        parentId: 'el_product_grid',
        boundingRect: { x: 736, y: 736, width: 320, height: 380 },
        childIds: [],
      } as any,
      {
        id: 'el_card_4',
        tagName: 'DIV',
        className: 'product-card',
        parentId: 'el_product_grid',
        boundingRect: { x: 1088, y: 736, width: 320, height: 380 },
        childIds: [],
      } as any,

      // 4. Footer Section (Persistent Bottom)
      {
        id: 'el_footer_section',
        tagName: 'FOOTER',
        className: 'main-footer',
        role: 'contentinfo',
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '48px', left: '32px' },
        boundingRect: { x: 0, y: 1572, width: 1440, height: 200 },
        childIds: [],
      } as any,
    ];

    return {
      status: 'completed',
      timestamp: Date.now(),
      title: 'Layout Relationship Store',
      pageUrl: 'https://layout-benchmark.io',
      colorSystem: {
        palette: [{ hex: '#c45536', role: 'primary', count: 1 }],
      } as any,
      layoutSystem: {
        viewport: { width: 1440, height: 1772 },
        containers: [],
        gridTracks: [],
        flexPatterns: [],
        spacingScale: [
          { valuePx: 16, label: 'lg' },
          { valuePx: 24, label: 'xl' },
          { valuePx: 80, label: '3xl' },
        ],
        stats: { containerCount: 4, flexCount: 2, gridCount: 1 },
      } as any,
      typographySystem: { hierarchy: [], fontFamilies: ['system-ui'], scale: [] } as any,
      shapeSystem: { radii: ['999px'], shadows: [], surfaces: [], shadowTokens: [], radiusTokens: [], surfaceStyleTokens: [], gradientTokens: [] } as any,
      componentSystem: { components: [], totalComponents: 4 } as any,
      extractionResult: {
        pageMeta: {
          url: 'https://layout-benchmark.io',
          title: 'Layout Relationship Store',
          viewport: { width: 1440, height: 1772 },
          devicePixelRatio: 1,
          colorScheme: 'light',
        },
        elements: rawElements,
        viewport: { width: 1440, height: 1772 },
      } as any,
    };
  };

  it('1. Hero contains CTA (Inside relationship) and CTA is centered horizontally', () => {
    const data = createMockData();
    const analyzer = new SpatialRelationshipAnalyzer();
    const heroEl = data.extractionResult!.elements.find((e) => e.id === 'el_hero_section')!;
    const allElements = data.extractionResult!.elements;

    const rels = analyzer.analyzeElementRelationships(heroEl, allElements);
    const ctaRel = rels.find((r) => r.sourceId === 'el_hero_cta' && r.targetId === 'el_hero_section');

    expect(ctaRel).toBeDefined();
    expect(ctaRel!.relation).toBe('Centered');
    expect(ctaRel!.alignment).toBe('center');
    expect(ctaRel!.rationale).toContain('centered horizontally');
  });

  it('2. CTA is positioned Below Heading with 24px gap (Gap Token)', () => {
    const data = createMockData();
    const analyzer = new SpatialRelationshipAnalyzer();
    const heroEl = data.extractionResult!.elements.find((e) => e.id === 'el_hero_section')!;
    const allElements = data.extractionResult!.elements;

    const rels = analyzer.analyzeElementRelationships(heroEl, allElements);
    const belowRel = rels.find((r) => r.sourceId === 'el_hero_cta' && r.targetId === 'el_hero_heading');

    expect(belowRel).toBeDefined();
    expect(belowRel!.relation).toBe('Below');
    expect(belowRel!.gapPx).toBe(24);
    expect(belowRel!.gapToken).toBe('token_spacing_xl');
    expect(belowRel!.rationale).toContain('24px vertical gap');
  });

  it('3. Grid Container assigns Grid Column relationships to product cards', () => {
    const data = createMockData();
    const analyzer = new SpatialRelationshipAnalyzer();
    const gridEl = data.extractionResult!.elements.find((e) => e.id === 'el_product_grid')!;
    const allElements = data.extractionResult!.elements;

    const rels = analyzer.analyzeElementRelationships(gridEl, allElements);
    const cardRels = rels.filter((r) => r.targetId === 'el_product_grid');

    expect(cardRels.length).toBe(4);
    expect(cardRels[0].relation).toBe('Grid Column');
    expect(cardRels[0].gridPlacement?.colStart).toBe(1);
    expect(cardRels[1].gridPlacement?.colStart).toBe(2);
    expect(cardRels[2].gridPlacement?.colStart).toBe(3);
    expect(cardRels[3].gridPlacement?.colStart).toBe(4);
  });

  it('4. Header children have Adjacent relationship in flex row layout', () => {
    const data = createMockData();
    const analyzer = new SpatialRelationshipAnalyzer();
    const headerEl = data.extractionResult!.elements.find((e) => e.id === 'el_header')!;
    const allElements = data.extractionResult!.elements;

    const rels = analyzer.analyzeElementRelationships(headerEl, allElements);
    const adjacentRel = rels.find((r) => r.sourceId === 'el_nav_links' && r.targetId === 'el_nav_logo');

    expect(adjacentRel).toBeDefined();
    expect(adjacentRel!.relation).toBe('Adjacent');
  });

  it('5. Generates LayoutRelationshipGraph.json replacing raw coordinates with relational descriptors', () => {
    const data = createMockData();
    const engine = new LayoutRelationshipGraphEngine();
    const graph = engine.normalize(data);

    expect(graph.version).toBe('2.0.0');
    expect(graph.relationships.length).toBeGreaterThan(0);
    expect(graph.summary.spatialRelations).toBeGreaterThan(0);
    expect(graph.summary.containmentRelations + graph.summary.alignmentRelations + graph.summary.gridRelations).toBeGreaterThan(0);
    expect(graph.summary.entitiesWithRelativeOnly).toBeGreaterThan(0);

    // Verify relative descriptors
    for (const rel of graph.relationships) {
      expect(['Above', 'Below', 'Inside', 'Adjacent', 'Centered', 'Stretch', 'Grid Column', 'Grid Row']).toContain(rel.relation);
      expect(rel.rationale).toBeDefined();
    }
  });

  it('6. Generates ContainerHierarchy.json with strict container hierarchy tree', () => {
    const data = createMockData();
    const engine = new ContainerHierarchyEngine();
    const containerHierarchy = engine.normalize(data);

    expect(containerHierarchy.version).toBe('2.0.0');
    expect(containerHierarchy.summary.totalContainers).toBeGreaterThanOrEqual(4);
    expect(containerHierarchy.summary.containersByLayoutType['flex-row']).toBeGreaterThanOrEqual(1);
    expect(containerHierarchy.summary.containersByLayoutType['grid']).toBeGreaterThanOrEqual(1);

    const root = containerHierarchy.containers['container_root'];
    expect(root).toBeDefined();
    expect(root.containerType).toBe('RootContainer');
    expect(root.children.length).toBeGreaterThan(0);

    const heroContainer = Object.values(containerHierarchy.containers).find((c) => c.name.includes('Hero'));
    expect(heroContainer).toBeDefined();
    expect(heroContainer!.alignment.isCenteredHorizontally).toBe(true);
  });

  it('7. Generates SectionFlow.json tracking vertical flow, rhythm tokens, and sticky headers', () => {
    const data = createMockData();
    const engine = new SectionFlowEngine();
    const sectionFlow = engine.normalize(data);

    expect(sectionFlow.version).toBe('2.0.0');
    expect(sectionFlow.summary.totalSections).toBe(4); // Header, Hero, Catalog, Footer
    expect(sectionFlow.summary.flowDirection).toBe('vertical');
    expect(sectionFlow.summary.hasStickyHeader).toBe(true);
    expect(sectionFlow.summary.hasPersistentFooter).toBe(true);

    const headerSec = sectionFlow.flow[0];
    expect(headerSec.semanticType).toBe('header');
    expect(headerSec.positioning).toBe('sticky-top');
    expect(headerSec.relationshipToPrevious).toBe('None (First)');

    const heroSec = sectionFlow.flow[1];
    expect(heroSec.semanticType).toBe('hero');
    expect(heroSec.relationshipToPrevious).toBe('Below');

    const footerSec = sectionFlow.flow[3];
    expect(footerSec.semanticType).toBe('footer');
    expect(footerSec.relationshipToNext).toBe('None (Last)');
  });

  it('8. Standalone Exporters and AI Clone Package bundle all 3 layout relationship artifacts', () => {
    const data = createMockData();

    // Direct exporters
    const lrgJson = exportLayoutRelationshipGraphJson(data);
    const chJson = exportContainerHierarchyJson(data);
    const sfJson = exportSectionFlowJson(data);

    expect(JSON.parse(lrgJson).version).toBe('2.0.0');
    expect(JSON.parse(chJson).version).toBe('2.0.0');
    expect(JSON.parse(sfJson).version).toBe('2.0.0');

    // Artifact Exporter format dispatch
    const exportResult1 = exportArtifact(data, 'layout-relationships');
    expect(exportResult1.exportedData).toBeDefined();

    const exportResult2 = exportArtifact(data, 'container-hierarchy');
    expect(exportResult2.exportedData).toBeDefined();

    const exportResult3 = exportArtifact(data, 'section-flow');
    expect(exportResult3.exportedData).toBeDefined();

    // AI Clone Package integration (.zip)
    const clonePkg = buildAIClonePackage(data);
    expect(clonePkg.files['LayoutRelationshipGraph.json']).toBeDefined();
    expect(clonePkg.files['ContainerHierarchy.json']).toBeDefined();
    expect(clonePkg.files['SectionFlow.json']).toBeDefined();
  });
});
