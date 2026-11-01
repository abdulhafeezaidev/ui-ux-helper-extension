import { describe, it, expect } from 'vitest';
import { AnalyzePageResponseData, RawElementNode } from '../src/types/index.ts';
import { AIOptimizationEngine } from '../src/normalization/optimizer/index.ts';
import {
  exportOptimizationReportMarkdown,
  exportKnowledgeCompressionJson,
  exportConfidenceMapJson,
  exportPackageMetricsJson,
} from '../src/output/optimizer/index.ts';
import { exportArtifact } from '../src/output/artifactExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
import { buildProgressivePackage } from '../src/output/clonePackage/progressivePackageEngine.ts';

describe('V2.0 – Phase 6: AI Optimization Engine', () => {
  const createMockData = (): AnalyzePageResponseData => {
    const rawElements: RawElementNode[] = [
      // 1. Header with logo and button
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
        childIds: ['el_logo', 'el_btn_1'],
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
        id: 'el_btn_1',
        tagName: 'BUTTON',
        className: 'btn btn-primary pill-btn',
        parentId: 'el_header',
        role: 'button',
        backgroundColor: '#c45536',
        color: '#ffffff',
        borderRadius: { topLeft: '999px', topRight: '999px', bottomRight: '999px', bottomLeft: '999px' },
        padding: { top: '10px', right: '20px', bottom: '10px', left: '20px' },
        typography: { fontSize: '16px', fontWeight: '600' } as any,
        boundingRect: { x: 1300, y: 16, width: 108, height: 40 },
        childIds: [],
        interactive: { isClickable: true, cursor: 'pointer' },
      } as any,

      // 2. Hero with heading and repeated button structure
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
        childIds: ['el_hero_h1', 'el_btn_2'],
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
      {
        id: 'el_btn_2',
        tagName: 'BUTTON',
        className: 'btn btn-primary pill-btn',
        parentId: 'el_hero',
        role: 'button',
        backgroundColor: '#c45536',
        color: '#ffffff',
        borderRadius: { topLeft: '999px', topRight: '999px', bottomRight: '999px', bottomLeft: '999px' },
        padding: { top: '14px', right: '28px', bottom: '14px', left: '28px' },
        typography: { fontSize: '18px', fontWeight: '600' } as any,
        boundingRect: { x: 620, y: 240, width: 200, height: 52 },
        childIds: [],
        interactive: { isClickable: true, cursor: 'pointer' },
      } as any,

      // 3. Product Cards with repeated buttons
      {
        id: 'el_grid',
        tagName: 'SECTION',
        className: 'product-grid',
        role: 'region',
        display: 'grid',
        boundingRect: { x: 0, y: 572, width: 1440, height: 400 },
        childIds: ['el_card_1', 'el_card_2'],
      } as any,
      {
        id: 'el_card_1',
        tagName: 'DIV',
        className: 'product-card',
        parentId: 'el_grid',
        borderRadius: { topLeft: '12px', topRight: '12px', bottomRight: '12px', bottomLeft: '12px' },
        boundingRect: { x: 32, y: 600, width: 320, height: 350 },
        childIds: ['el_btn_3'],
      } as any,
      {
        id: 'el_btn_3',
        tagName: 'BUTTON',
        className: 'btn btn-primary pill-btn',
        parentId: 'el_card_1',
        role: 'button',
        backgroundColor: '#c45536',
        color: '#ffffff',
        borderRadius: { topLeft: '999px', topRight: '999px', bottomRight: '999px', bottomLeft: '999px' },
        padding: { top: '10px', right: '20px', bottom: '10px', left: '20px' },
        typography: { fontSize: '14px', fontWeight: '600' } as any,
        boundingRect: { x: 50, y: 880, width: 280, height: 40 },
        childIds: [],
        interactive: { isClickable: true, cursor: 'pointer' },
      } as any,
      {
        id: 'el_card_2',
        tagName: 'DIV',
        className: 'product-card',
        parentId: 'el_grid',
        borderRadius: { topLeft: '12px', topRight: '12px', bottomRight: '12px', bottomLeft: '12px' },
        boundingRect: { x: 384, y: 600, width: 320, height: 350 },
        childIds: ['el_btn_4'],
      } as any,
      {
        id: 'el_btn_4',
        tagName: 'BUTTON',
        className: 'btn btn-primary pill-btn',
        parentId: 'el_card_2',
        role: 'button',
        backgroundColor: '#c45536',
        color: '#ffffff',
        borderRadius: { topLeft: '999px', topRight: '999px', bottomRight: '999px', bottomLeft: '999px' },
        padding: { top: '10px', right: '20px', bottom: '10px', left: '20px' },
        typography: { fontSize: '14px', fontWeight: '600' } as any,
        boundingRect: { x: 400, y: 880, width: 280, height: 40 },
        childIds: [],
        interactive: { isClickable: true, cursor: 'pointer' },
      } as any,
    ];

    return {
      status: 'completed',
      timestamp: Date.now(),
      title: 'Benchmark Store',
      pageUrl: 'https://benchmark-store.io',
      colorSystem: {
        palette: [
          { hex: '#c45536', role: 'primary', count: 4 },
          { hex: '#ffffff', role: 'surface', count: 4 },
        ],
      } as any,
      layoutSystem: {
        viewport: { width: 1440, height: 1000 },
        containers: [],
        gridTracks: [],
        flexPatterns: [],
        spacingScale: [{ valuePx: 16, label: 'lg' }],
        stats: { containerCount: 3, flexCount: 2, gridCount: 1 },
      } as any,
      typographySystem: { hierarchy: [], fontFamilies: ['system-ui'], scale: [] } as any,
      shapeSystem: { radii: ['12px', '999px'], shadows: [], surfaces: [], shadowTokens: [], radiusTokens: [], surfaceStyleTokens: [], gradientTokens: [] } as any,
      componentSystem: { components: [], totalComponents: 3 } as any,
      extractionResult: {
        pageMeta: {
          url: 'https://benchmark-store.io',
          title: 'Benchmark Store',
          viewport: { width: 1440, height: 1000 },
          devicePixelRatio: 1,
          colorScheme: 'light',
        },
        elements: rawElements,
        viewport: { width: 1440, height: 1000 },
      } as any,
    };
  };

  it('1. Generates KnowledgeCompression.json with references and tokenized styles', () => {
    const data = createMockData();
    const engine = new AIOptimizationEngine();
    const spec = engine.generateKnowledgeCompression(data);

    expect(spec.version).toBe('2.0.0');
    expect(Object.keys(spec.references).length).toBeGreaterThan(0);

    // References start with #ref:
    const refKeys = Object.keys(spec.references);
    expect(refKeys.some((k) => k.startsWith('#ref:tokens.'))).toBe(true);

    // Compressed components
    expect(Object.keys(spec.compressedComponents).length).toBeGreaterThan(0);

    // Tokenized styles replace raw CSS values with var(--)
    const tokenizedEntries = Object.values(spec.tokenizedStyles);
    expect(tokenizedEntries.length).toBeGreaterThan(0);
    expect(tokenizedEntries[0].tokenizedCss).toContain('var(');

    // Deduplication summary
    expect(spec.deduplicationSummary.rawNodesCount).toBe(11);
    expect(spec.deduplicationSummary.duplicatesEliminated).toBeGreaterThan(0);
  });

  it('2. Generates ConfidenceMap.json across all 6 subsystems and reconstruction priorities', () => {
    const data = createMockData();
    const engine = new AIOptimizationEngine();
    const conf = engine.generateConfidenceMap(data);

    expect(conf.version).toBe('2.0.0');
    expect(conf.overallScore).toBeGreaterThanOrEqual(90);
    expect(conf.subsystems.designSystem.confidence).toBeGreaterThanOrEqual(0.95);
    expect(conf.subsystems.components.confidence).toBeGreaterThanOrEqual(0.95);
    expect(conf.subsystems.layout.confidence).toBeGreaterThanOrEqual(0.95);
    expect(conf.subsystems.responsive.confidence).toBeGreaterThanOrEqual(0.9);
    expect(conf.subsystems.accessibility.confidence).toBeGreaterThanOrEqual(0.95);
    expect(conf.subsystems.motion.confidence).toBeGreaterThanOrEqual(0.9);

    // 5-tier reconstruction priorities
    expect(conf.reconstructionPriorities.length).toBe(5);
    expect(conf.reconstructionPriorities[0].priority).toBe('P1');
    expect(conf.reconstructionPriorities[4].priority).toBe('P5');
  });

  it('3. Generates PackageMetrics.json showing significant byte & token savings', () => {
    const data = createMockData();
    const engine = new AIOptimizationEngine();
    const metrics = engine.generatePackageMetrics(data);

    expect(metrics.version).toBe('2.0.0');
    const comp = metrics.comparison;

    // Optimized size < Raw size
    expect(comp.optimized.packageBytes).toBeLessThan(comp.raw.packageBytes);
    expect(comp.optimized.estimatedTokens).toBeLessThan(comp.raw.estimatedTokens);

    // Savings calculations
    expect(comp.savings.byteReductionPercent).toBeGreaterThanOrEqual(40);
    expect(comp.savings.tokenReductionPercent).toBeGreaterThanOrEqual(40);
    expect(comp.savings.duplicatesEliminatedCount).toBeGreaterThan(0);
    expect(comp.savings.reconstructionFidelityPercent).toBeGreaterThanOrEqual(95);
  });

  it('4. Generates OptimizationReport.md with markdown comparison table and agent instructions', () => {
    const data = createMockData();
    const engine = new AIOptimizationEngine();
    const report = engine.generateOptimizationReport(data);

    expect(report.title).toBe('Benchmark Store');
    expect(report.markdown).toContain('# AI Optimization & Compression Report: Benchmark Store');
    expect(report.markdown).toContain('## Raw vs. Optimized Extraction Comparison');
    expect(report.markdown).toContain('## Subsystem Confidence Scores');
    expect(report.markdown).toContain('## AI Reconstruction Priorities');
    expect(report.markdown).toContain('## Instructions for AI Coding Agents');
    expect(report.markdown).toContain('Reference Resolution');
  });

  it('5. Standalone Exporters and Packages bundle all 4 AI optimization deliverables', () => {
    const data = createMockData();

    // Direct string exporters
    const optReportMd = exportOptimizationReportMarkdown(data);
    const knowCompJson = exportKnowledgeCompressionJson(data);
    const confMapJson = exportConfidenceMapJson(data);
    const packMetJson = exportPackageMetricsJson(data);

    expect(optReportMd).toContain('# AI Optimization & Compression Report');
    expect(JSON.parse(knowCompJson).version).toBe('2.0.0');
    expect(JSON.parse(confMapJson).version).toBe('2.0.0');
    expect(JSON.parse(packMetJson).version).toBe('2.0.0');

    // Artifact Exporter format dispatches
    const res1 = exportArtifact(data, 'optimization-report');
    expect(res1.exportedData).toBeDefined();

    const res2 = exportArtifact(data, 'knowledge-compression');
    expect(res2.exportedData).toBeDefined();

    const res3 = exportArtifact(data, 'confidence-map');
    expect(res3.exportedData).toBeDefined();

    const res4 = exportArtifact(data, 'package-metrics');
    expect(res4.exportedData).toBeDefined();

    // Full Clone Package Bundles
    const clonePkg = buildAIClonePackage(data);
    expect(clonePkg.files['OptimizationReport.md']).toBeDefined();
    expect(clonePkg.files['KnowledgeCompression.json']).toBeDefined();
    expect(clonePkg.files['ConfidenceMap.json']).toBeDefined();
    expect(clonePkg.files['PackageMetrics.json']).toBeDefined();

    const progFullPkg = buildProgressivePackage(data, 'full');
    expect(progFullPkg.files['OptimizationReport.md']).toBeDefined();
    expect(progFullPkg.files['KnowledgeCompression.json']).toBeDefined();
    expect(progFullPkg.files['ConfidenceMap.json']).toBeDefined();
    expect(progFullPkg.files['PackageMetrics.json']).toBeDefined();
  });
});
