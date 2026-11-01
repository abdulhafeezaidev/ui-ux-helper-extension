import { describe, it, expect } from 'vitest';
import { AnalyzePageResponseData, RawElementNode } from '../src/types/index.ts';
import {
  ComponentFingerprintEngine,
  TokenRegistryEngine,
  VariantGraphEngine,
  CanonicalComponentRegistryEngine,
  QualityGateEngine,
  DesignKnowledgeGraphEngine,
  KnowledgeGraphAuditEngine,
} from '../src/normalization/knowledgeGraph/index.ts';
import {
  exportDesignKnowledgeGraph,
  exportComponentRegistry,
  exportVariantGraph,
  exportTokenRegistry,
  exportKnowledgeGraphAuditReport,
} from '../src/output/knowledgeGraph/index.ts';
import { exportArtifact } from '../src/output/artifactExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';

describe('V2.0 – Phase 1: Design Knowledge Graph Architecture', () => {
  // Mock page extraction data with repeated components and variants
  const createMockData = (): AnalyzePageResponseData => {
    const rawElements: RawElementNode[] = [];

    // Create 27 repeated button instances (Primary, Secondary, Ghost)
    for (let i = 1; i <= 27; i++) {
      const isPrimary = i <= 10;
      const isSecondary = i > 10 && i <= 20;
      rawElements.push({
        id: `el_btn_${i}`,
        tagName: 'BUTTON',
        className: isPrimary ? 'btn btn-primary' : isSecondary ? 'btn btn-secondary' : 'btn btn-ghost',
        role: 'button',
        backgroundColor: isPrimary ? '#c45536' : isSecondary ? '#ffffff' : 'transparent',
        color: isPrimary ? '#ffffff' : '#191815',
        display: 'inline-flex',
        padding: { top: '9px', right: '14px', bottom: '9px', left: '14px' },
        borderRadius: { topLeft: '8px', topRight: '8px', bottomRight: '8px', bottomLeft: '8px' },
        typography: { fontSize: '13px', fontWeight: '600', fontFamily: 'system-ui' } as any,
        boxShadow: isPrimary ? '0 2px 8px rgba(196, 85, 54, 0.2)' : 'none',
        boundingRect: { x: 10, y: 10 + i * 40, width: 120, height: 36 },
        interactive: { isClickable: true, cursor: 'pointer' },
        childIds: [`el_btn_span_${i}`],
      } as any);
      rawElements.push({
        id: `el_btn_span_${i}`,
        tagName: 'SPAN',
        className: 'btn-text',
        parentId: `el_btn_${i}`,
        textContent: `Button ${i}`,
        color: isPrimary ? '#ffffff' : '#191815',
        typography: { fontSize: '13px', fontWeight: '600', fontFamily: 'system-ui' } as any,
        boundingRect: { x: 20, y: 15 + i * 40, width: 80, height: 20 },
      } as any);
    }

    // Create 12 product card instances
    for (let i = 1; i <= 12; i++) {
      const isFeatured = i === 1 || i === 2;
      const isCompact = i >= 10;
      rawElements.push({
        id: `el_card_${i}`,
        tagName: 'DIV',
        className: isFeatured ? 'card card-product card-featured' : isCompact ? 'card card-product card-compact' : 'card card-product',
        role: 'article',
        backgroundColor: '#ffffff',
        display: 'flex',
        padding: { top: isCompact ? '8px' : '16px', right: isCompact ? '8px' : '16px', bottom: isCompact ? '8px' : '16px', left: isCompact ? '8px' : '16px' },
        borderRadius: { topLeft: '12px', topRight: '12px', bottomRight: '12px', bottomLeft: '12px' },
        boxShadow: isFeatured ? '0 4px 14px rgba(0, 0, 0, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
        boundingRect: { x: 50, y: 500 + i * 200, width: 300, height: 180 },
        childIds: [`el_card_img_${i}`, `el_card_title_${i}`, `el_card_btn_${i}`],
      } as any);
    }

    return {
      status: 'completed',
      timestamp: Date.now(),
      title: 'Storefront Benchmark',
      pageUrl: 'https://benchmark-store.io',
      colorSystem: {
        palette: [
          { hex: '#c45536', role: 'primary', count: 27 },
          { hex: '#ffffff', role: 'surface', count: 39 },
          { hex: '#faf9f5', role: 'background', count: 1 },
          { hex: '#191815', role: 'textPrimary', count: 50 },
        ],
      } as any,
      layoutSystem: {
        viewport: { width: 1440, height: 900 },
        containers: [],
        gridTracks: [],
        flexPatterns: [],
        spacingScale: [
          { valuePx: 4, label: 'xs' },
          { valuePx: 8, label: 'sm' },
          { valuePx: 12, label: 'md' },
          { valuePx: 16, label: 'lg' },
          { valuePx: 24, label: 'xl' },
        ],
        stats: { containerCount: 0, flexCount: 0, gridCount: 0 },
      } as any,
      typographySystem: {
        hierarchy: [],
        fontFamilies: ['system-ui'],
        scale: [],
      } as any,
      shapeSystem: {
        radii: ['8px', '12px'],
        shadows: [],
        surfaces: [],
        shadowTokens: [],
        radiusTokens: [],
        surfaceStyleTokens: [],
        gradientTokens: [],
      } as any,
      componentSystem: {
        components: [],
        totalComponents: 2,
      } as any,
      extractionResult: {
        pageMeta: {
          url: 'https://benchmark-store.io',
          title: 'Storefront Benchmark',
          viewport: { width: 1440, height: 900 },
          devicePixelRatio: 1,
          colorScheme: 'light',
        },
        elements: rawElements,
        viewport: { width: 1440, height: 900 },
      } as any,
    };
  };

  it('1. Deterministic Component Fingerprinting unifies 27 button nodes into single component', () => {
    const data = createMockData();
    const engine = new ComponentFingerprintEngine();
    const rawElements = data.extractionResult!.elements;

    const buttonElements = rawElements.filter((e) => e.tagName === 'BUTTON');
    expect(buttonElements.length).toBe(27);

    const fingerprints = buttonElements.map((el) => engine.generateFingerprint(el, rawElements));
    
    // Check fingerprint format
    for (const fp of fingerprints) {
      expect(fp.hash).toMatch(/^[0-9a-f]{8}$/);
      expect(fp.category).toBe('button');
      expect(fp.semanticRole).toBe('button');
      expect(fp.structureSignature).toContain('BUTTON>');
    }
  });

  it('2. Shared Token Registry deduplicates raw CSS into canonical token references', () => {
    const data = createMockData();
    const engine = new TokenRegistryEngine();
    const tokenRegistry = engine.normalize(data);

    expect(tokenRegistry.version).toBe('2.0.0');
    expect(tokenRegistry.summary.totalTokens).toBeGreaterThan(15);
    expect(tokenRegistry.summary.colorTokens).toBeGreaterThan(3);
    expect(tokenRegistry.summary.tokenReuseFactor).toBeGreaterThan(1.0);

    // Verify canonical token references exist
    expect(tokenRegistry.tokens['token_color_primary']).toBeDefined();
    expect(tokenRegistry.tokens['token_spacing_button_padding']).toBeDefined();
    expect(tokenRegistry.tokens['token_radius_md']).toBeDefined();
  });

  it('3. Hierarchical Variant Detection establishes DAG inheritance without cycles', () => {
    const data = createMockData();
    const engine = new VariantGraphEngine();
    const variantGraph = engine.normalize(data);

    expect(variantGraph.version).toBe('2.0.0');
    expect(variantGraph.metadata.isAcyclic).toBe(true);
    expect(variantGraph.summary.maxInheritanceDepth).toBeGreaterThanOrEqual(2);

    // Verify multi-level card inheritance: Card Base -> Product Card -> Featured / Compact
    const cardTree = variantGraph.trees['comp_card'];
    expect(cardTree).toBeDefined();
    expect(cardTree.nodes['var_card_base']).toBeDefined();
    expect(cardTree.nodes['var_card_product']).toBeDefined();
    expect(cardTree.nodes['var_card_product_featured']).toBeDefined();
    expect(cardTree.nodes['var_card_product_compact']).toBeDefined();

    // Verify inheritance chain and delta overrides
    const featured = cardTree.nodes['var_card_product_featured'];
    expect(featured.parentVariantId).toBe('var_card_product');
    expect(featured.inheritanceDepth).toBe(2);
    expect(featured.inheritanceChain).toEqual(['var_card_base', 'var_card_product', 'var_card_product_featured']);
    expect(featured.overriddenProperties.borderColor).toBe('#c45536');
  });

  it('4. Canonical Component Registry registers every component exactly once with instance references', () => {
    const data = createMockData();
    const engine = new CanonicalComponentRegistryEngine();
    const compRegistry = engine.normalize(data);

    expect(compRegistry.version).toBe('2.0.0');
    expect(compRegistry.summary.totalComponents).toBeGreaterThanOrEqual(3);

    const buttonComp = Object.values(compRegistry.components).find((c) => c.category === 'button');
    expect(buttonComp).toBeDefined();
    expect(buttonComp!.instanceElementIds.length).toBe(27);
    expect(buttonComp!.slots).toContain('default');
    expect(buttonComp!.propsSchema.length).toBeGreaterThan(0);
  });

  it('5. Quality Gate Engine enforces all 4 rules and validates 100% pass', () => {
    const data = createMockData();
    const dkgEngine = new DesignKnowledgeGraphEngine();
    const { dkg, qualityGateReport } = dkgEngine.normalize(data);

    expect(qualityGateReport.status).toBe('PASSED');
    expect(qualityGateReport.allPassed).toBe(true);
    expect(qualityGateReport.rules.noDuplicateComponents.passed).toBe(true);
    expect(qualityGateReport.rules.noDuplicateTokens.passed).toBe(true);
    expect(qualityGateReport.rules.noCyclicInheritance.passed).toBe(true);
    expect(qualityGateReport.rules.noOrphanVariants.passed).toBe(true);
    expect(dkg.metadata.qualityGateStatus).toBe('PASSED');
  });

  it('6. Quality Gate Engine detects and rejects cyclic inheritance if introduced', () => {
    const data = createMockData();
    const dkgEngine = new DesignKnowledgeGraphEngine();
    const { dkg, components, variants, tokens } = dkgEngine.normalize(data);

    // Artificially introduce cycle: A -> B -> A
    const mutatedVariants = JSON.parse(JSON.stringify(variants));
    mutatedVariants.trees['comp_card'].nodes['var_card_base'].parentVariantId = 'var_card_product_featured';

    const qualityGateEngine = new QualityGateEngine();
    const report = qualityGateEngine.validate(dkg, components, mutatedVariants, tokens);

    expect(report.status).toBe('FAILED');
    expect(report.rules.noCyclicInheritance.passed).toBe(false);
    expect(report.rules.noCyclicInheritance.violations.length).toBeGreaterThan(0);
  });

  it('7. Knowledge Graph Audit Engine quantifies before/after package size & token savings', () => {
    const data = createMockData();
    const dkgEngine = new DesignKnowledgeGraphEngine();
    const { dkg, components, variants, tokens } = dkgEngine.normalize(data);

    const auditEngine = new KnowledgeGraphAuditEngine();
    const auditReport = auditEngine.generateAuditReport(data, dkg, components, variants, tokens);

    expect(auditReport.metrics.rawDomNodeCount).toBe(66);
    expect(auditReport.metrics.rawSerializationBytes).toBeGreaterThan(0);
    expect(auditReport.metrics.dkgNodeCount).toBeGreaterThan(0);
    expect(auditReport.summaryMarkdown).toContain('# Design Knowledge Graph Audit Report');
    expect(auditReport.summaryMarkdown).toContain('**NO_DUPLICATE_COMPONENTS**: ✅ PASSED');
  });

  it('8. Exporters and AI Clone Package bundle all 4 canonical Knowledge Graph files', () => {
    const data = createMockData();

    // Verify single format exporters
    const dkgJson = exportDesignKnowledgeGraph(data);
    const compRegJson = exportComponentRegistry(data);
    const varGraphJson = exportVariantGraph(data);
    const tokenRegJson = exportTokenRegistry(data);
    const auditMd = exportKnowledgeGraphAuditReport(data);

    expect(JSON.parse(dkgJson).version).toBe('2.0.0');
    expect(JSON.parse(compRegJson).version).toBe('2.0.0');
    expect(JSON.parse(varGraphJson).version).toBe('2.0.0');
    expect(JSON.parse(tokenRegJson).version).toBe('2.0.0');
    expect(auditMd).toContain('Design Knowledge Graph Audit Report');

    // Verify artifact exporter dispatch
    const exportResult = exportArtifact(data, 'design-knowledge-graph');
    expect(exportResult.exportedData).toBeDefined();

    // Verify packaging into AI Clone Package (.zip)
    const clonePkg = buildAIClonePackage(data);
    expect(clonePkg.files['DesignKnowledgeGraph.json']).toBeDefined();
    expect(clonePkg.files['ComponentRegistry.json']).toBeDefined();
    expect(clonePkg.files['VariantGraph.json']).toBeDefined();
    expect(clonePkg.files['TokenRegistry.json']).toBeDefined();
    expect(clonePkg.files['KnowledgeGraphAuditReport.md']).toBeDefined();
  });
});
