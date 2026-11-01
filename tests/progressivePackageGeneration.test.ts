import { describe, it, expect } from 'vitest';
import { AnalyzePageResponseData, RawElementNode } from '../src/types/index.ts';
import {
  buildProgressivePackage,
} from '../src/output/clonePackage/progressivePackageEngine.ts';
import { exportArtifact } from '../src/output/artifactExporter.ts';

describe('V2.0 – Phase 5: Progressive Package Generation', () => {
  const createMockData = (): AnalyzePageResponseData => {
    const rawElements: RawElementNode[] = [
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
        childIds: ['el_logo', 'el_btn_nav'],
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
        id: 'el_btn_nav',
        tagName: 'BUTTON',
        className: 'btn btn-primary',
        parentId: 'el_header',
        role: 'button',
        backgroundColor: '#c45536',
        color: '#ffffff',
        borderRadius: { topLeft: '999px', topRight: '999px', bottomRight: '999px', bottomLeft: '999px' },
        padding: { top: '10px', right: '20px', bottom: '10px', left: '20px' },
        boundingRect: { x: 1300, y: 16, width: 108, height: 40 },
        childIds: [],
        interactive: { isClickable: true, cursor: 'pointer' },
      } as any,
      {
        id: 'el_hero',
        tagName: 'SECTION',
        className: 'hero-section',
        role: 'region',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: { top: '80px', right: '32px', bottom: '80px', left: '32px' },
        boundingRect: { x: 0, y: 72, width: 1440, height: 500 },
        childIds: ['el_hero_h1'],
      } as any,
      {
        id: 'el_hero_h1',
        tagName: 'H1',
        className: 'hero-headline',
        parentId: 'el_hero',
        role: 'heading',
        typography: { fontSize: '48px', fontWeight: '700' } as any,
        boundingRect: { x: 320, y: 152, width: 800, height: 60 },
        childIds: [],
      } as any,
    ];

    return {
      status: 'completed',
      timestamp: Date.now(),
      title: 'Progressive Store',
      pageUrl: 'https://progressive-store.io',
      colorSystem: {
        palette: [
          { hex: '#c45536', role: 'primary', count: 1 },
          { hex: '#ffffff', role: 'surface', count: 1 },
        ],
      } as any,
      layoutSystem: {
        viewport: { width: 1440, height: 1200 },
        containers: [],
        gridTracks: [],
        flexPatterns: [],
        spacingScale: [{ valuePx: 16, label: 'lg' }],
        stats: { containerCount: 2, flexCount: 2, gridCount: 0 },
      } as any,
      typographySystem: { hierarchy: [], fontFamilies: ['system-ui'], scale: [] } as any,
      shapeSystem: { radii: ['999px'], shadows: [], surfaces: [], shadowTokens: [], radiusTokens: [], surfaceStyleTokens: [], gradientTokens: [] } as any,
      componentSystem: { components: [], totalComponents: 2 } as any,
      extractionResult: {
        pageMeta: {
          url: 'https://progressive-store.io',
          title: 'Progressive Store',
          viewport: { width: 1440, height: 1200 },
          devicePixelRatio: 1,
          colorScheme: 'light',
        },
        elements: rawElements,
        viewport: { width: 1440, height: 1200 },
      } as any,
    };
  };

  it('1. Level 1 (Fast) generates package with Tokens, Typography, Layout, Components under 200k tokens', () => {
    const data = createMockData();
    const pkg = buildProgressivePackage(data, 'fast');

    expect(pkg.level).toBe('fast');
    expect(pkg.levelNumber).toBe(1);
    expect(pkg.tokenBudget).toBe('<200k');
    expect(pkg.estimatedTokens).toBeLessThanOrEqual(200000);
    expect(pkg.isWithinBudget).toBe(true);

    // Required Level 1 files
    expect(pkg.files['03_design-system.json']).toBeDefined();
    expect(pkg.files['09_styles/css-variables.css']).toBeDefined();
    expect(pkg.files['09_styles/tailwind.config.js']).toBeDefined();
    expect(pkg.files['14_typography.json']).toBeDefined();
    expect(pkg.files['04_layout.json']).toBeDefined();
    expect(pkg.files['ContainerHierarchy.json']).toBeDefined();
    expect(pkg.files['LayoutRelationshipGraph.json']).toBeDefined();
    expect(pkg.files['02_components.json']).toBeDefined();
    expect(pkg.files['IntentMap.json']).toBeDefined();
    expect(pkg.files['IntentDictionary.json']).toBeDefined();
    expect(pkg.files['package-manifest.json']).toBeDefined();

    // Must NOT contain heavy Level 2/3 files
    expect(pkg.files['16_motion.json']).toBeUndefined();
    expect(pkg.files['11_render_tree.json']).toBeUndefined();
    expect(pkg.files['08_evidence.json']).toBeUndefined();
    expect(pkg.files['18_reconstruction_graph.json']).toBeUndefined();
    expect(pkg.files['06_assets.json']).toBeUndefined();
  });

  it('2. Level 2 (Standard) includes Interactions, Responsive, Accessibility, Assets under 600k tokens', () => {
    const data = createMockData();
    const pkg = buildProgressivePackage(data, 'standard');

    expect(pkg.level).toBe('standard');
    expect(pkg.levelNumber).toBe(2);
    expect(pkg.tokenBudget).toBe('<600k');
    expect(pkg.estimatedTokens).toBeLessThanOrEqual(600000);
    expect(pkg.isWithinBudget).toBe(true);

    // Level 1 foundations
    expect(pkg.files['03_design-system.json']).toBeDefined();
    expect(pkg.files['02_components.json']).toBeDefined();

    // Level 2 additions
    expect(pkg.files['05_behavior.json']).toBeDefined();
    expect(pkg.files['13_responsive.json']).toBeDefined();
    expect(pkg.files['07_accessibility.json']).toBeDefined();
    expect(pkg.files['06_assets.json']).toBeDefined();
    expect(pkg.files['15_variants.json']).toBeDefined();
    expect(pkg.files['SectionFlow.json']).toBeDefined();
    expect(pkg.files['ComponentDependencyGraph.json']).toBeDefined();

    // Must NOT contain heavy Level 3 files
    expect(pkg.files['16_motion.json']).toBeUndefined();
    expect(pkg.files['11_render_tree.json']).toBeUndefined();
    expect(pkg.files['08_evidence.json']).toBeUndefined();
    expect(pkg.files['18_reconstruction_graph.json']).toBeUndefined();
  });

  it('3. Level 3 (Full Clone) includes 100% of all artifacts with unlimited budget', () => {
    const data = createMockData();
    const pkg = buildProgressivePackage(data, 'full');

    expect(pkg.level).toBe('full');
    expect(pkg.levelNumber).toBe(3);
    expect(pkg.tokenBudget).toBe('unlimited');
    expect(pkg.isWithinBudget).toBe(true);

    // Level 1 & 2
    expect(pkg.files['03_design-system.json']).toBeDefined();
    expect(pkg.files['05_behavior.json']).toBeDefined();
    expect(pkg.files['06_assets.json']).toBeDefined();

    // Level 3 Full Clone artifacts
    expect(pkg.files['01_reconstruction.json']).toBeDefined();
    expect(pkg.files['11_render_tree.json']).toBeDefined();
    expect(pkg.files['16_motion.json']).toBeDefined();
    expect(pkg.files['17_content.json']).toBeDefined();
    expect(pkg.files['18_reconstruction_graph.json']).toBeDefined();
    expect(pkg.files['08_evidence.json']).toBeDefined();
    expect(pkg.files['KnowledgeGraphAuditReport.md']).toBeDefined();
    expect(pkg.files['DesignKnowledgeGraph.json']).toBeDefined();
    expect(pkg.files['BuildDependencyGraph.json']).toBeDefined();
    expect(pkg.files['ReconstructionPlan.md']).toBeDefined();
  });

  it('4. Each package level contains an independent self-contained manifest and tailored README', () => {
    const data = createMockData();
    const levels: Array<'fast' | 'standard' | 'full'> = ['fast', 'standard', 'full'];

    for (const lvl of levels) {
      const pkg = buildProgressivePackage(data, lvl);
      expect(pkg.manifest).toBeDefined();
      expect(pkg.manifest.packageLevel).toBe(lvl);
      expect(pkg.manifest.includedCapabilities.length).toBeGreaterThan(0);
      expect(pkg.readme).toContain(pkg.packageName);
      expect(pkg.base64.length).toBeGreaterThan(50);
    }
  });

  it('5. Artifact Exporter correctly dispatches all progressive package formats', () => {
    const data = createMockData();

    const exp1 = exportArtifact(data, 'package-fast');
    expect(exp1.aiClonePackage).toBeDefined();
    expect(exp1.base64Zip).toBeDefined();

    const exp2 = exportArtifact(data, 'package-standard');
    expect(exp2.aiClonePackage).toBeDefined();
    expect(exp2.base64Zip).toBeDefined();

    const exp3 = exportArtifact(data, 'package-full');
    expect(exp3.aiClonePackage).toBeDefined();
    expect(exp3.base64Zip).toBeDefined();

    const expLevel1 = exportArtifact(data, 'package-level-1');
    expect(expLevel1.aiClonePackage).toBeDefined();
  });
});
