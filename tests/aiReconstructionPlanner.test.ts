import { describe, it, expect } from 'vitest';
import { AnalyzePageResponseData, RawElementNode } from '../src/types/index.ts';
import {
  BuildDependencyGraphEngine,
  ComponentDependencyGraphEngine,
  ReconstructionPlanEngine,
} from '../src/normalization/planner/index.ts';
import {
  exportBuildDependencyGraphJson,
  exportComponentDependencyGraphJson,
  exportReconstructionPlanMarkdown,
} from '../src/output/planner/index.ts';
import { exportArtifact } from '../src/output/artifactExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';

describe('V2.0 – Phase 4: AI Reconstruction Planner', () => {
  const createMockData = (): AnalyzePageResponseData => {
    const rawElements: RawElementNode[] = [
      // 1. Header Section
      {
        id: 'el_header',
        tagName: 'HEADER',
        className: 'main-header',
        role: 'banner',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: { top: '16px', right: '32px', bottom: '16px', left: '32px' },
        boundingRect: { x: 0, y: 0, width: 1440, height: 72 },
        childIds: ['el_logo', 'el_nav_links'],
      } as any,
      {
        id: 'el_logo',
        tagName: 'DIV',
        className: 'nav-logo',
        parentId: 'el_header',
        boundingRect: { x: 32, y: 16, width: 120, height: 40 },
        childIds: [],
      } as any,
      {
        id: 'el_nav_links',
        tagName: 'NAV',
        className: 'nav-links',
        parentId: 'el_header',
        boundingRect: { x: 1000, y: 16, width: 408, height: 40 },
        childIds: [],
      } as any,

      // 2. Hero Section
      {
        id: 'el_hero_section',
        tagName: 'SECTION',
        className: 'hero-section',
        role: 'region',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: { top: '80px', right: '32px', bottom: '80px', left: '32px' },
        boundingRect: { x: 0, y: 72, width: 1440, height: 600 },
        childIds: ['el_hero_h1', 'el_hero_btn'],
      } as any,
      {
        id: 'el_hero_h1',
        tagName: 'H1',
        className: 'hero-headline',
        parentId: 'el_hero_section',
        role: 'heading',
        typography: { fontSize: '48px', fontWeight: '700' } as any,
        boundingRect: { x: 320, y: 152, width: 800, height: 60 },
        childIds: [],
      } as any,
      {
        id: 'el_hero_btn',
        tagName: 'BUTTON',
        className: 'btn btn-primary pill-btn',
        parentId: 'el_hero_section',
        role: 'button',
        backgroundColor: '#c45536',
        color: '#ffffff',
        borderRadius: { topLeft: '999px', topRight: '999px', bottomRight: '999px', bottomLeft: '999px' },
        padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' },
        boundingRect: { x: 620, y: 236, width: 200, height: 48 },
        childIds: [],
        interactive: { isClickable: true, cursor: 'pointer' },
      } as any,

      // 3. Product Catalog Grid Section
      {
        id: 'el_catalog_section',
        tagName: 'SECTION',
        className: 'catalog-section',
        role: 'region',
        display: 'block',
        padding: { top: '64px', right: '32px', bottom: '64px', left: '32px' },
        boundingRect: { x: 0, y: 672, width: 1440, height: 800 },
        childIds: ['el_card_1', 'el_card_2'],
      } as any,
      {
        id: 'el_card_1',
        tagName: 'DIV',
        className: 'product-card',
        parentId: 'el_catalog_section',
        borderRadius: { topLeft: '12px', topRight: '12px', bottomRight: '12px', bottomLeft: '12px' },
        boundingRect: { x: 32, y: 736, width: 320, height: 380 },
        childIds: ['el_card_1_btn'],
      } as any,
      {
        id: 'el_card_1_btn',
        tagName: 'BUTTON',
        className: 'btn btn-secondary',
        parentId: 'el_card_1',
        role: 'button',
        boundingRect: { x: 56, y: 1040, width: 272, height: 40 },
        childIds: [],
      } as any,
      {
        id: 'el_card_2',
        tagName: 'DIV',
        className: 'product-card',
        parentId: 'el_catalog_section',
        borderRadius: { topLeft: '12px', topRight: '12px', bottomRight: '12px', bottomLeft: '12px' },
        boundingRect: { x: 384, y: 736, width: 320, height: 380 },
        childIds: ['el_card_2_btn'],
      } as any,
      {
        id: 'el_card_2_btn',
        tagName: 'BUTTON',
        className: 'btn btn-secondary',
        parentId: 'el_card_2',
        role: 'button',
        boundingRect: { x: 408, y: 1040, width: 272, height: 40 },
        childIds: [],
      } as any,

      // 4. Footer Section
      {
        id: 'el_footer_section',
        tagName: 'FOOTER',
        className: 'main-footer',
        role: 'contentinfo',
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '48px', left: '32px' },
        boundingRect: { x: 0, y: 1472, width: 1440, height: 180 },
        childIds: [],
      } as any,
    ];

    return {
      status: 'completed',
      timestamp: Date.now(),
      title: 'Storefront Benchmark',
      pageUrl: 'https://storefront.io',
      colorSystem: {
        palette: [
          { hex: '#c45536', role: 'primary', count: 1 },
          { hex: '#ffffff', role: 'surface', count: 1 },
        ],
      } as any,
      layoutSystem: {
        viewport: { width: 1440, height: 1652 },
        containers: [],
        gridTracks: [],
        flexPatterns: [],
        spacingScale: [{ valuePx: 24, label: 'xl' }],
        stats: { containerCount: 4, flexCount: 2, gridCount: 1 },
      } as any,
      typographySystem: { hierarchy: [], fontFamilies: ['system-ui'], scale: [] } as any,
      shapeSystem: { radii: ['12px', '999px'], shadows: [], surfaces: [], shadowTokens: [], radiusTokens: [], surfaceStyleTokens: [], gradientTokens: [] } as any,
      componentSystem: { components: [], totalComponents: 4 } as any,
      extractionResult: {
        pageMeta: {
          url: 'https://storefront.io',
          title: 'Storefront Benchmark',
          viewport: { width: 1440, height: 1652 },
          devicePixelRatio: 1,
          colorScheme: 'light',
        },
        elements: rawElements,
        viewport: { width: 1440, height: 1652 },
      } as any,
    };
  };

  it('1. Generates 10-Phase Build Plan in exact topological sequence', () => {
    const data = createMockData();
    const engine = new BuildDependencyGraphEngine();
    const buildGraph = engine.normalize(data);

    expect(buildGraph.version).toBe('2.0.0');
    expect(buildGraph.summary.totalPhases).toBe(10);
    expect(buildGraph.summary.executionPipeline.length).toBe(10);

    const expectedOrder = [
      '1. Create Design Tokens',
      '2. Create Typography',
      '3. Create Layout Containers',
      '4. Create Shared Components',
      '5. Create Variants',
      '6. Assemble Sections',
      '7. Build Pages',
      '8. Connect Interactions',
      '9. Optimize Responsive Layout',
      '10. Accessibility Pass',
    ];

    expect(buildGraph.summary.executionPipeline).toEqual(expectedOrder);
  });

  it('2. BuildDependencyGraph enforces strict prerequisite dependencies', () => {
    const data = createMockData();
    const engine = new BuildDependencyGraphEngine();
    const buildGraph = engine.normalize(data);

    // Tokens has no prerequisites
    expect(buildGraph.phases.tokens.prerequisites).toEqual([]);

    // Typography requires tokens
    expect(buildGraph.phases.typography.prerequisites).toContain('tokens');

    // Components requires tokens, typography, containers
    expect(buildGraph.phases.components.prerequisites).toContain('tokens');
    expect(buildGraph.phases.components.prerequisites).toContain('typography');
    expect(buildGraph.phases.components.prerequisites).toContain('containers');

    // Sections requires containers, components, variants
    expect(buildGraph.phases.sections.prerequisites).toContain('components');
    expect(buildGraph.phases.sections.prerequisites).toContain('containers');

    // Pages requires sections
    expect(buildGraph.phases.pages.prerequisites).toContain('sections');

    // Accessibility requires pages, interactions, responsive
    expect(buildGraph.phases.accessibility.prerequisites).toContain('pages');
  });

  it('3. ComponentDependencyGraph establishes bottom-up hierarchy to maximize reuse', () => {
    const data = createMockData();
    const engine = new ComponentDependencyGraphEngine();
    const compGraph = engine.normalize(data);

    expect(compGraph.version).toBe('2.0.0');
    expect(compGraph.summary.totalNodes).toBeGreaterThan(0);
    expect(compGraph.summary.primitiveCount).toBeGreaterThanOrEqual(1);
    expect(compGraph.summary.compositeCount).toBeGreaterThanOrEqual(1);
    expect(compGraph.summary.sectionCount).toBeGreaterThanOrEqual(1);
    expect(compGraph.summary.pageCount).toBe(1);

    // Primitives have lower build order than composites and sections
    const buttonNode = Object.values(compGraph.nodes).find((n) => n.name.includes('Button'));
    const cardNode = Object.values(compGraph.nodes).find((n) => n.name.includes('Card'));
    const sectionNode = Object.values(compGraph.nodes).find((n) => n.nodeType === 'section');
    const pageNode = compGraph.nodes['page_root'];

    expect(buttonNode).toBeDefined();
    expect(cardNode).toBeDefined();
    expect(sectionNode).toBeDefined();
    expect(pageNode).toBeDefined();

    expect(buttonNode!.buildOrder).toBeLessThanOrEqual(cardNode!.buildOrder);
    expect(cardNode!.buildOrder).toBeLessThanOrEqual(sectionNode!.buildOrder);
    expect(sectionNode!.buildOrder).toBeLessThanOrEqual(pageNode.buildOrder);
  });

  it('4. ReconstructionPlan.md contains actionable instructions and checklists for all 10 steps', () => {
    const data = createMockData();
    const engine = new ReconstructionPlanEngine();
    const plan = engine.normalize(data);

    expect(plan.totalSteps).toBe(10);
    expect(plan.markdown).toContain('# AI Reconstruction Plan: Storefront Benchmark');
    expect(plan.markdown).toContain('Phase 1: Create Design Tokens');
    expect(plan.markdown).toContain('Phase 2: Create Typography System');
    expect(plan.markdown).toContain('Phase 3: Create Layout Containers');
    expect(plan.markdown).toContain('Phase 4: Create Shared Components');
    expect(plan.markdown).toContain('Phase 5: Create Component Variants');
    expect(plan.markdown).toContain('Phase 6: Assemble Sections');
    expect(plan.markdown).toContain('Phase 7: Build Pages');
    expect(plan.markdown).toContain('Phase 8: Connect Interactions');
    expect(plan.markdown).toContain('Phase 9: Optimize Responsive Layout');
    expect(plan.markdown).toContain('Phase 10: Accessibility & Quality Pass');
    expect(plan.markdown).toContain('Validation Checklist');
  });

  it('5. Standalone Exporters and AI Clone Package bundle all 3 reconstruction planning files', () => {
    const data = createMockData();

    // Direct string exporters
    const bdgJson = exportBuildDependencyGraphJson(data);
    const cdgJson = exportComponentDependencyGraphJson(data);
    const rpMd = exportReconstructionPlanMarkdown(data);

    expect(JSON.parse(bdgJson).version).toBe('2.0.0');
    expect(JSON.parse(cdgJson).version).toBe('2.0.0');
    expect(rpMd).toContain('# AI Reconstruction Plan');

    // Artifact Exporter format dispatches
    const res1 = exportArtifact(data, 'build-dependency-graph');
    expect(res1.exportedData).toBeDefined();

    const res2 = exportArtifact(data, 'component-dependency-graph');
    expect(res2.exportedData).toBeDefined();

    const res3 = exportArtifact(data, 'reconstruction-plan');
    expect(res3.exportedData).toBeDefined();

    // Package bundle integration
    const clonePkg = buildAIClonePackage(data);
    expect(clonePkg.files['ReconstructionPlan.md']).toBeDefined();
    expect(clonePkg.files['BuildDependencyGraph.json']).toBeDefined();
    expect(clonePkg.files['ComponentDependencyGraph.json']).toBeDefined();
  });
});
