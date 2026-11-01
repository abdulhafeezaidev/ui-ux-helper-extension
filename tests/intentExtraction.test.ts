import { describe, it, expect } from 'vitest';
import { AnalyzePageResponseData, RawElementNode } from '../src/types/index.ts';
import {
  IntentInferenceEngine,
  IntentDictionaryEngine,
  IntentMapEngine,
} from '../src/normalization/intent/index.ts';
import {
  exportIntentMapJson,
  exportIntentDictionaryJson,
} from '../src/output/intent/index.ts';
import { exportArtifact } from '../src/output/artifactExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';

describe('V2.0 – Phase 2: Intent Extraction Engine', () => {
  const createMockData = (): AnalyzePageResponseData => {
    const rawElements: RawElementNode[] = [
      // 1. Pill Button
      {
        id: 'el_btn_pill',
        tagName: 'BUTTON',
        className: 'btn btn-primary pill-cta',
        role: 'button',
        backgroundColor: '#c45536',
        color: '#ffffff',
        display: 'inline-flex',
        padding: { top: '10px', right: '24px', bottom: '10px', left: '24px' },
        borderRadius: { topLeft: '999px', topRight: '999px', bottomRight: '999px', bottomLeft: '999px' },
        typography: { fontSize: '14px', fontWeight: '600', fontFamily: 'system-ui' } as any,
        boundingRect: { x: 100, y: 350, width: 160, height: 44 },
        interactive: { isClickable: true, cursor: 'pointer' },
        childIds: [],
      } as any,

      // 2. Centered Flexbox Container
      {
        id: 'el_flex_center',
        tagName: 'DIV',
        className: 'modal-body flex-centered',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
        boundingRect: { x: 200, y: 200, width: 400, height: 300 },
        childIds: [],
      } as any,

      // 3. 4-column Product Grid
      {
        id: 'el_grid_4col',
        tagName: 'DIV',
        className: 'catalog-grid product-grid',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: { row: '24px', column: '24px' },
        padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' },
        boundingRect: { x: 0, y: 500, width: 1440, height: 800 },
        childIds: [],
      } as any,

      // 4. Section with 80px Vertical Rhythm
      {
        id: 'el_section_hero',
        tagName: 'SECTION',
        className: 'hero-section',
        role: 'region',
        backgroundColor: '#faf9f5',
        display: 'block',
        padding: { top: '80px', right: '32px', bottom: '80px', left: '32px' },
        boundingRect: { x: 0, y: 0, width: 1440, height: 600 },
        childIds: ['el_hero_h1'],
      } as any,

      // 5. Primary Hero Heading (48px, 700 bold)
      {
        id: 'el_hero_h1',
        tagName: 'H1',
        className: 'hero-headline',
        parentId: 'el_section_hero',
        role: 'heading',
        color: '#191815',
        display: 'block',
        typography: {
          fontSize: '48px',
          fontWeight: '700',
          lineHeight: '56px',
          fontFamily: 'system-ui',
        } as any,
        boundingRect: { x: 100, y: 120, width: 800, height: 112 },
        childIds: [],
      } as any,
    ];

    return {
      status: 'completed',
      timestamp: Date.now(),
      title: 'Intent Benchmark Store',
      pageUrl: 'https://intent-benchmark.io',
      colorSystem: {
        palette: [
          { hex: '#c45536', role: 'primary', count: 1 },
          { hex: '#ffffff', role: 'surface', count: 1 },
          { hex: '#faf9f5', role: 'background', count: 1 },
          { hex: '#191815', role: 'textPrimary', count: 1 },
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
        stats: { containerCount: 1, flexCount: 1, gridCount: 1 },
      } as any,
      typographySystem: {
        hierarchy: [],
        fontFamilies: ['system-ui'],
        scale: [],
      } as any,
      shapeSystem: {
        radii: ['8px', '999px'],
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
          url: 'https://intent-benchmark.io',
          title: 'Intent Benchmark Store',
          viewport: { width: 1440, height: 900 },
          devicePixelRatio: 1,
          colorScheme: 'light',
        },
        elements: rawElements,
        viewport: { width: 1440, height: 900 },
      } as any,
    };
  };

  it('1. border-radius: 999px infers Pill Button intent', () => {
    const data = createMockData();
    const engine = new IntentInferenceEngine();
    const pillBtn = data.extractionResult!.elements.find((e) => e.id === 'el_btn_pill')!;

    const intents = engine.inferElementIntents(pillBtn);
    const pillIntent = intents.find((i) => i.intentId === 'intent_shape_pill_button');

    expect(pillIntent).toBeDefined();
    expect(pillIntent!.name).toBe('Pill Button');
    expect(pillIntent!.domain).toBe('shape');
    expect(pillIntent!.confidence).toBeGreaterThanOrEqual(0.9);
    expect(pillIntent!.inferredPurpose).toContain('touch target');
  });

  it('2. display: flex; justify-content: center; align-items: center infers Center Content intent', () => {
    const data = createMockData();
    const engine = new IntentInferenceEngine();
    const centerEl = data.extractionResult!.elements.find((e) => e.id === 'el_flex_center')!;

    const intents = engine.inferElementIntents(centerEl);
    const centerIntent = intents.find((i) => i.intentId === 'intent_layout_center_content');

    expect(centerIntent).toBeDefined();
    expect(centerIntent!.name).toBe('Center Content');
    expect(centerIntent!.domain).toBe('layout');
    expect(centerIntent!.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it('3. display: grid; grid-template-columns: repeat(4, 1fr) infers 4-column Product Grid intent', () => {
    const data = createMockData();
    const engine = new IntentInferenceEngine();
    const gridEl = data.extractionResult!.elements.find((e) => e.id === 'el_grid_4col')!;

    const intents = engine.inferElementIntents(gridEl);
    const gridIntent = intents.find((i) => i.intentId === 'intent_layout_4col_product_grid');

    expect(gridIntent).toBeDefined();
    expect(gridIntent!.name).toBe('4-column Product Grid');
    expect(gridIntent!.domain).toBe('layout');
    expect(gridIntent!.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it('4. padding: 80px infers Section Vertical Rhythm intent', () => {
    const data = createMockData();
    const engine = new IntentInferenceEngine();
    const sectionEl = data.extractionResult!.elements.find((e) => e.id === 'el_section_hero')!;

    const intents = engine.inferElementIntents(sectionEl);
    const spacingIntent = intents.find((i) => i.intentId === 'intent_spacing_section_vertical_rhythm');

    expect(spacingIntent).toBeDefined();
    expect(spacingIntent!.name).toBe('Section Vertical Rhythm');
    expect(spacingIntent!.domain).toBe('spacing');
    expect(spacingIntent!.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('5. font-weight: 700; font-size: 48px infers Primary Hero Heading intent', () => {
    const data = createMockData();
    const engine = new IntentInferenceEngine();
    const headingEl = data.extractionResult!.elements.find((e) => e.id === 'el_hero_h1')!;

    const intents = engine.inferElementIntents(headingEl);
    const typoIntent = intents.find((i) => i.intentId === 'intent_typography_hero_heading');

    expect(typoIntent).toBeDefined();
    expect(typoIntent!.name).toBe('Primary Hero Heading');
    expect(typoIntent!.domain).toBe('typography');
    expect(typoIntent!.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it('6. Dual Storage Contract stores both Raw values and Semantic intent', () => {
    const data = createMockData();
    const engine = new IntentMapEngine();
    const intentMap = engine.normalize(data);

    expect(intentMap.version).toBe('2.0.0');
    expect(Object.keys(intentMap.mappings).length).toBeGreaterThan(0);

    for (const mapping of Object.values(intentMap.mappings)) {
      // Must contain exact raw CSS declaration block
      expect(mapping.rawCssBlock).toBeDefined();
      expect(typeof mapping.rawCssBlock).toBe('object');

      // Must contain inferred semantic intents and high-level summary
      expect(mapping.appliedIntents).toBeDefined();
      expect(Array.isArray(mapping.appliedIntents)).toBe(true);
      expect(mapping.semanticIntentSummary).toBeDefined();
      expect(mapping.tokenSavings).toBeDefined();
    }
  });

  it('7. Generates canonical IntentDictionary.json and IntentMap.json', () => {
    const data = createMockData();
    const dictEngine = new IntentDictionaryEngine();
    const mapEngine = new IntentMapEngine();

    const dict = dictEngine.normalize(data);
    const map = mapEngine.normalize(data);

    expect(dict.version).toBe('2.0.0');
    expect(dict.summary.totalIntents).toBeGreaterThanOrEqual(10);
    expect(dict.domains.layout.length).toBeGreaterThan(0);
    expect(dict.domains.shape.length).toBeGreaterThan(0);
    expect(dict.domains.spacing.length).toBeGreaterThan(0);
    expect(dict.domains.typography.length).toBeGreaterThan(0);

    expect(map.version).toBe('2.0.0');
    expect(map.summary.totalEntitiesMapped).toBeGreaterThan(0);
    expect(map.summary.totalIntentLinks).toBeGreaterThan(0);
  });

  it('8. Components reference intents instead of repeating verbose raw CSS', () => {
    const data = createMockData();
    const mapEngine = new IntentMapEngine();
    const map = mapEngine.normalize(data);

    const buttonMapping = Object.values(map.mappings).find((m) => m.entityName === 'Button' || m.entityId.includes('button'));
    expect(buttonMapping).toBeDefined();
    expect(buttonMapping!.appliedIntents.length).toBeGreaterThan(0);

    const intentIds = buttonMapping!.appliedIntents.map((i) => i.intentId);
    expect(intentIds.some((id) => id.includes('shape') || id.includes('spacing') || id.includes('hierarchy'))).toBe(true);
  });

  it('9. Measures significant LLM token reduction when using intents', () => {
    const data = createMockData();
    const mapEngine = new IntentMapEngine();
    const map = mapEngine.normalize(data);
    const tokenReport = mapEngine.generateTokenReductionReport(map);

    expect(tokenReport.rawCssTotalEstimatedTokens).toBeGreaterThan(tokenReport.intentTotalEstimatedTokens);
    expect(tokenReport.savedTokens).toBeGreaterThan(0);
    expect(tokenReport.tokenReductionPercent).toBeGreaterThanOrEqual(50);
  });

  it('10. Exporters and AI Clone Package bundle IntentMap.json and IntentDictionary.json', () => {
    const data = createMockData();

    // Verify individual exports
    const mapJson = exportIntentMapJson(data);
    const dictJson = exportIntentDictionaryJson(data);

    expect(JSON.parse(mapJson).version).toBe('2.0.0');
    expect(JSON.parse(dictJson).version).toBe('2.0.0');

    // Verify artifact exporter dispatch
    const exportResult = exportArtifact(data, 'intent-map');
    expect(exportResult.exportedData).toBeDefined();

    // Verify packaging into AI Clone Package (.zip)
    const clonePkg = buildAIClonePackage(data);
    expect(clonePkg.files['IntentMap.json']).toBeDefined();
    expect(clonePkg.files['IntentDictionary.json']).toBeDefined();
  });
});
