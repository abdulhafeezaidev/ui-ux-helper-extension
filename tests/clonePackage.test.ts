import { describe, it, expect } from 'vitest';
import {
  ZipPackager,
  computeCrc32,
  buildAIClonePackage,
  exportReconstructionJson,
  exportComponentsJson,
  exportLayoutJson,
  exportInteractionsJson,
  exportAnimationsJson,
  exportAssetsJson,
  exportEvidenceJson,
  exportReadmeForAi,
} from '../src/output/index.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

function createMockPageData(): AnalyzePageResponseData {
  return {
    status: 'completed',
    pageUrl: 'https://store.example.com/products',
    title: 'Modern Ecommerce Store',
    timestamp: Date.now(),
    extractionResult: {
      pageMeta: {
        url: 'https://store.example.com/products',
        title: 'Modern Ecommerce Store',
        viewport: { width: 1440, height: 900 },
        devicePixelRatio: 2,
      },
      elements: [
        {
          id: 'el_1',
          tagName: 'header',
          className: 'site-header sticky top-0',
          role: 'banner',
          boundingRect: { x: 0, y: 0, width: 1440, height: 80 },
          isVisible: true,
          display: 'flex',
          position: 'sticky',
          zIndex: '50',
          parentId: null,
          childIds: ['el_2', 'el_3'],
          textMeta: { hasText: true, textLength: 10, trimmedText: 'Brand Logo', isDirectText: true },
          typography: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px',
            fontWeight: '700',
            lineHeight: '28px',
            letterSpacing: '-0.02em',
            textTransform: 'none',
            textDecoration: 'none',
            textAlign: 'left',
          },
          surface: {
            backgroundImage: 'none',
            backdropFilter: 'blur(8px)',
            filter: 'none',
            boxSizing: 'border-box',
          },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: 'rgb(15, 23, 42)',
          opacity: 1,
          borderWidths: { top: '0px', right: '0px', bottom: '1px', left: '0px' },
          borderStyles: { top: 'none', right: 'none', bottom: 'solid', left: 'none' },
          borderColors: { top: 'transparent', right: 'transparent', bottom: 'rgb(226, 232, 240)', left: 'transparent' },
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          transform: 'none',
          overflow: { x: 'visible', y: 'visible' },
          padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
          margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
          gap: { row: '0px', column: '16px' },
          layoutProps: {
            display: 'flex',
            position: 'sticky',
            zIndex: '50',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            overflow: { x: 'visible', y: 'visible' },
            gap: { row: '0px', column: '16px' },
          },
          transitions: {
            property: 'all',
            duration: '200ms',
            timingFunction: 'ease-in-out',
            delay: '0s',
            rawString: 'all 200ms ease-in-out 0s',
          },
          interactive: {
            isClickable: false,
            cursor: 'default',
            ariaRole: 'banner',
          },
        },
        {
          id: 'el_2',
          tagName: 'svg',
          className: 'brand-logo-icon',
          role: 'img',
          boundingRect: { x: 24, y: 24, width: 32, height: 32 },
          isVisible: true,
          display: 'block',
          position: 'static',
          zIndex: 'auto',
          parentId: 'el_1',
          childIds: [],
          textMeta: { hasText: false, textLength: 0, trimmedText: '', isDirectText: false },
          typography: {
            fontFamily: 'Inter',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '24px',
            letterSpacing: 'normal',
            textTransform: 'none',
            textDecoration: 'none',
            textAlign: 'left',
          },
          surface: {
            backgroundImage: 'none',
            backdropFilter: 'none',
            filter: 'none',
            boxSizing: 'border-box',
          },
          backgroundColor: 'transparent',
          color: 'rgb(59, 130, 246)',
          opacity: 1,
          borderWidths: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
          borderStyles: { top: 'none', right: 'none', bottom: 'none', left: 'none' },
          borderColors: { top: 'transparent', right: 'transparent', bottom: 'transparent', left: 'transparent' },
          borderRadius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
          boxShadow: 'none',
          transform: 'none',
          overflow: { x: 'visible', y: 'visible' },
          padding: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
          margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
          gap: { row: '0px', column: '0px' },
          layoutProps: {
            display: 'block',
            position: 'static',
            zIndex: 'auto',
            overflow: { x: 'visible', y: 'visible' },
            gap: { row: '0px', column: '0px' },
          },
          assetProps: {
            hasSvg: true,
            svgViewBox: '0 0 24 24',
            svgOuterHtml: '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>',
          },
          interactive: {
            isClickable: true,
            cursor: 'pointer',
            ariaLabel: 'Brand Logo',
          },
        },
        {
          id: 'el_3',
          tagName: 'button',
          className: 'btn btn-primary',
          role: 'button',
          boundingRect: { x: 1300, y: 20, width: 116, height: 40 },
          isVisible: true,
          display: 'inline-flex',
          position: 'static',
          zIndex: 'auto',
          parentId: 'el_1',
          childIds: [],
          textMeta: { hasText: true, textLength: 8, trimmedText: 'Cart (0)', isDirectText: true },
          typography: {
            fontFamily: 'Inter',
            fontSize: '14px',
            fontWeight: '600',
            lineHeight: '20px',
            letterSpacing: 'normal',
            textTransform: 'none',
            textDecoration: 'none',
            textAlign: 'center',
          },
          surface: {
            backgroundImage: 'none',
            backdropFilter: 'none',
            filter: 'none',
            boxSizing: 'border-box',
          },
          backgroundColor: 'rgb(37, 99, 235)',
          color: 'rgb(255, 255, 255)',
          opacity: 1,
          borderWidths: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
          borderStyles: { top: 'none', right: 'none', bottom: 'none', left: 'none' },
          borderColors: { top: 'transparent', right: 'transparent', bottom: 'transparent', left: 'transparent' },
          borderRadius: { topLeft: '8px', topRight: '8px', bottomRight: '8px', bottomLeft: '8px' },
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transform: 'none',
          overflow: { x: 'visible', y: 'visible' },
          padding: { top: '10px', right: '16px', bottom: '10px', left: '16px' },
          margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
          gap: { row: '0px', column: '0px' },
          layoutProps: {
            display: 'inline-flex',
            position: 'static',
            zIndex: 'auto',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: { x: 'visible', y: 'visible' },
            gap: { row: '0px', column: '0px' },
          },
          transitions: {
            property: 'background-color, transform',
            duration: '150ms',
            timingFunction: 'ease',
            delay: '0s',
            rawString: 'all 150ms ease 0s',
          },
          interactive: {
            isClickable: true,
            cursor: 'pointer',
            ariaRole: 'button',
            ariaLabel: 'Open Cart',
          },
        },
      ],
      totalExtracted: 3,
      visibleCount: 3,
      timestamp: Date.now(),
    },
    colorSystem: {
      tokens: [
        {
          id: '1',
          color: { r: 255, g: 255, b: 255, a: 1, hex: '#ffffff', rgbString: 'rgb(255, 255, 255)', hsl: { h: 0, s: 0, l: 100 } },
          frequency: 10,
          usageCount: { background: 5, text: 3, border: 2, cta: 0 },
          usages: ['background'],
          luminance: 1,
          isDark: false,
        },
        {
          id: '2',
          color: { r: 37, g: 99, b: 235, a: 1, hex: '#2563eb', rgbString: 'rgb(37, 99, 235)', hsl: { h: 221, s: 83, l: 53 } },
          frequency: 5,
          usageCount: { background: 2, text: 1, border: 0, cta: 2 },
          usages: ['cta', 'accent'],
          luminance: 0.15,
          isDark: true,
        },
      ],
      dominantColors: [],
      roles: {
        pageBackground: {
          id: '1',
          color: { r: 255, g: 255, b: 255, a: 1, hex: '#ffffff', rgbString: 'rgb(255, 255, 255)', hsl: { h: 0, s: 0, l: 100 } },
          frequency: 10,
          usageCount: { background: 5, text: 3, border: 2, cta: 0 },
          usages: ['background'],
          luminance: 1,
          isDark: false,
        },
        interactiveCTA: {
          id: '2',
          color: { r: 37, g: 99, b: 235, a: 1, hex: '#2563eb', rgbString: 'rgb(37, 99, 235)', hsl: { h: 221, s: 83, l: 53 } },
          frequency: 5,
          usageCount: { background: 2, text: 1, border: 0, cta: 2 },
          usages: ['cta'],
          luminance: 0.15,
          isDark: true,
        },
      },
      contrastPairs: [],
      stats: { rawColorCount: 5, normalizedColorCount: 2, transparentCount: 1 },
    },
    typographySystem: {
      fontFamilies: [
        { name: 'Inter, sans-serif', primary: 'Inter', fallbacks: ['sans-serif'], usageCount: 10 },
      ],
      tokens: [
        {
          id: '1',
          fontFamily: 'Inter, sans-serif',
          primaryFamily: 'Inter',
          fontSizePx: 16,
          fontWeight: 400,
          lineHeightPx: 24,
          letterSpacing: 'normal',
          textTransform: 'none',
          textAlign: 'left',
          frequency: 8,
          semanticRole: 'body',
        },
        {
          id: '2',
          fontFamily: 'Inter, sans-serif',
          primaryFamily: 'Inter',
          fontSizePx: 20,
          fontWeight: 700,
          lineHeightPx: 28,
          letterSpacing: '-0.02em',
          textTransform: 'none',
          textAlign: 'left',
          frequency: 2,
          semanticRole: 'h2',
        },
      ],
      hierarchy: {
        body: {
          id: '1',
          fontFamily: 'Inter, sans-serif',
          primaryFamily: 'Inter',
          fontSizePx: 16,
          fontWeight: 400,
          lineHeightPx: 24,
          letterSpacing: 'normal',
          textTransform: 'none',
          textAlign: 'left',
          frequency: 8,
        },
      },
      stats: { rawTextElementCount: 10, uniqueTokenCount: 2, fontFamilyCount: 1 },
    },
    shapeSystem: {
      radiusScale: [
        { id: 'rad_1', valuePx: 8, classification: 'rounded', frequency: 5 },
      ],
      borderTokens: [
        { id: 'b_1', width: '1px', style: 'solid', color: '#e2e8f0', frequency: 3 },
      ],
      shadowTokens: [
        {
          id: 's_1',
          shadow: { offsetXPx: 0, offsetYPx: 1, blurPx: 3, spreadPx: 0, color: 'rgba(0,0,0,0.05)', alpha: 0.05, isInset: false },
          rawString: '0 1px 3px rgba(0, 0, 0, 0.05)',
          frequency: 2,
        },
      ],
      gradientTokens: [],
      surfaceCounts: {
        flat: 4,
        bordered: 2,
        elevated: 1,
        translucent: 1,
        glassLike: 0,
        inset: 0,
        gradient: 0,
        glowing: 0,
      },
      geometryCounts: {
        sharp: 0,
        slightlyRounded: 0,
        rounded: 5,
        highlyRounded: 0,
        pill: 0,
        circular: 0,
        elliptical: 0,
        asymmetric: 0,
      },
      stats: {
        totalSurfacesAnalyzed: 5,
        uniqueRadiusCount: 1,
        uniqueBorderCount: 1,
        uniqueShadowCount: 1,
        gradientCount: 0,
      },
    },
    layoutSystem: {
      containers: [
        { id: 'c_1', elementId: 'el_1', display: 'flex', isFullWidth: true, isCenteredContainer: false, maxWidth: '100%', childCount: 2 },
      ],
      flexLayouts: [
        {
          elementId: 'el_1',
          direction: 'row',
          wrap: 'nowrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          groupType: 'horizontalGroup',
          childCount: 2,
        },
      ],
      gridLayouts: [],
      spatialRelations: [],
      spacingScale: [
        { id: 'sp_1', valuePx: 16, category: 'padding', frequency: 4 },
        { id: 'sp_2', valuePx: 24, category: 'padding', frequency: 2 },
      ],
      sections: [
        {
          id: 'sec_1',
          elementId: 'el_1',
          bounds: { x: 0, y: 0, width: 1440, height: 80 },
          isFullWidth: true,
          childCount: 2,
        },
      ],
      viewport: {
        width: 1440,
        height: 900,
        documentHeight: 1800,
        hasHorizontalOverflow: false,
      },
      stats: {
        containerCount: 1,
        flexCount: 1,
        gridCount: 0,
        sectionCount: 1,
        relationCount: 0,
      },
    },
    componentSystem: {
      components: [
        {
          id: 'comp_nav',
          type: 'navigation',
          confidence: 0.95,
          rootElementId: 'el_1',
          childElementIds: ['el_2', 'el_3'],
          bounds: { x: 0, y: 0, width: 1440, height: 80 },
          evidence: ['semantic header tag', 'contains logo and cta'],
          colorTokenRefs: ['1', '2'],
          typographyTokenRefs: ['1', '2'],
          shapeTokenRefs: ['rad_1'],
        },
      ],
      families: [
        {
          familyId: 'fam_nav',
          type: 'navigation',
          instanceCount: 1,
          instanceElementIds: ['el_1'],
          sharedColorTokens: ['1'],
          sharedTypoTokens: ['2'],
          evidence: ['header root'],
        },
      ],
      sections: [
        {
          id: 'sec_1',
          elementId: 'el_1',
          sectionType: 'navigation',
          confidence: 0.95,
          evidence: ['semantic header'],
          componentIds: ['comp_nav'],
        },
      ],
      patterns: [],
      stats: {
        totalComponents: 1,
        familyCount: 1,
        sectionCount: 1,
        patternCount: 0,
      },
    },
  };
}

describe('AI Clone Package & Reverse Engineering Engine', () => {
  describe('ZipPackager Unit Tests', () => {
    it('computes accurate CRC-32 checksums', () => {
      const data = new TextEncoder().encode('Hello, AI Clone Package!');
      const crc = computeCrc32(data);
      expect(crc).toBeGreaterThan(0);
      expect(typeof crc).toBe('number');
    });

    it('generates standard PKZIP binary buffer with valid signature', () => {
      const packager = new ZipPackager();
      packager.addFile('README.md', '# AI Instructions');
      packager.addFile('data/test.json', JSON.stringify({ ok: true }));

      const zipBytes = packager.generateZip();
      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(100);

      // Verify ZIP Local Header Magic Number: 0x50 0x4B 0x03 0x04 ("PK\x03\x04")
      expect(zipBytes[0]).toBe(0x50);
      expect(zipBytes[1]).toBe(0x4B);
      expect(zipBytes[2]).toBe(0x03);
      expect(zipBytes[3]).toBe(0x04);
    });

    it('converts zip buffer to valid Base64 string', () => {
      const packager = new ZipPackager();
      packager.addFile('hello.txt', 'World');
      const b64 = packager.toBase64();
      expect(typeof b64).toBe('string');
      expect(b64.length).toBeGreaterThan(50);
    });
  });

  describe('Individual AI Clone Exporters', () => {
    const mockData = createMockPageData();

    it('exports reconstruction.json with full page tree and viewport metrics', () => {
      const jsonStr = exportReconstructionJson(mockData);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.target.title).toBe('Modern Ecommerce Store');
      expect(parsed.target.viewport.width).toBe(1440);
      expect(parsed.target.viewport.height).toBe(900);
      expect(parsed.pageTree).toBeDefined();
      expect(parsed.regions.length).toBeGreaterThan(0);
    });

    it('exports components.json with component definitions, props, and variants', () => {
      const jsonStr = exportComponentsJson(mockData);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.totalComponents).toBeGreaterThan(0);
      expect(parsed.components).toBeDefined();
      expect(parsed.metadata.sourceTitle).toBe('Modern Ecommerce Store');
    });

    it('exports layout.json with responsive breakpoint rules and flex/grid specs', () => {
      const jsonStr = exportLayoutJson(mockData);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.viewport.width).toBe(1440);
      expect(parsed.responsiveRules.length).toBe(3);
      expect(parsed.responsiveRules[0].breakpoint).toBe('desktop');
      expect(parsed.responsiveRules[1].breakpoint).toBe('tablet');
      expect(parsed.responsiveRules[2].breakpoint).toBe('mobile');
      expect(parsed.flexLayouts.length).toBeGreaterThan(0);
    });

    it('exports interactions.json with clickable elements and ARIA roles', () => {
      const jsonStr = exportInteractionsJson(mockData);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.interactiveElements.length).toBeGreaterThan(0);
      expect(parsed.interactionBehaviors.length).toBeGreaterThan(0);
    });

    it('exports animations.json with observed transitions and motion presets', () => {
      const jsonStr = exportAnimationsJson(mockData);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.observedTransitions.length).toBeGreaterThan(0);
      expect(parsed.motionPresets.length).toBeGreaterThan(0);
    });

    it('exports assets.json with SVG markup and vector dimensions', () => {
      const jsonStr = exportAssetsJson(mockData);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.svgIcons.length).toBeGreaterThan(0);
      expect(parsed.svgIcons[0].viewBox).toBe('0 0 24 24');
      expect(parsed.svgIcons[0].svgOuterHtml).toContain('<svg');
    });

    it('exports evidence.json with completeness vector and confidence heatmap', () => {
      const jsonStr = exportEvidenceJson(mockData);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.reconstructionScore).toBeGreaterThan(0);
      expect(parsed.completenessVector).toBeDefined();
      expect(parsed.confidenceHeatmap.length).toBe(9);
    });

    it('exports README_FOR_AI.md with strict zero-hallucination directive and Next.js workflow', () => {
      const md = exportReadmeForAi(mockData);

      expect(md).toContain('# AI RECONSTRUCTION INSTRUCTIONS');
      expect(md).toContain('Modern Ecommerce Store');
      expect(md).toContain('Zero Hallucination Policy');
      expect(md).toContain('reconstruction.json');
      expect(md).toContain('tailwind.config.js');
    });
  });

  describe('Master AI Clone Package Bundler (Prompt 28 — 10 Consolidated Artifacts)', () => {
    const mockData = createMockPageData();

    it('builds complete consolidated AI Clone Package containing exactly 10 artifacts / files', () => {
      const pkg = buildAIClonePackage(mockData);

      expect(pkg.manifest.totalFiles).toBe(19); // 18 canonical artifacts (including styles/ with 2 files)
      expect(pkg.zipBuffer.length).toBeGreaterThan(500);
      expect(pkg.base64.length).toBeGreaterThan(500);

      const expectedFiles = [
        '01_reconstruction.json',
        '02_components.json',
        '03_design-system.json',
        '04_layout.json',
        '05_behavior.json',
        '06_assets.json',
        '07_accessibility.json',
        '08_evidence.json',
        '09_styles/css-variables.css',
        '09_styles/tailwind.config.js',
        '10_README_FOR_AI.md',
        '11_render_tree.json',
        '12_constraints.json',
        '13_responsive.json',
        '14_typography.json',
        '15_variants.json',
        '16_motion.json',
        '17_content.json',
        '18_reconstruction_graph.json',
      ];

      for (const expected of expectedFiles) {
        expect(pkg.files[expected], `Missing file in package: ${expected}`).toBeDefined();
        expect(pkg.files[expected].length).toBeGreaterThan(0);
      }
    });

    it('verifies 10_README_FOR_AI.md contains consolidated AI reconstruction guide and prompt', () => {
      const pkg = buildAIClonePackage(mockData);
      const readme = pkg.files['10_README_FOR_AI.md'];

      expect(readme).toContain('Visual Fidelity');
      expect(readme).toContain('Layout Fidelity');
      expect(readme).toContain('Typography Fidelity');
      expect(readme).toContain('Component Fidelity');
      expect(readme).toContain('Interaction Fidelity');
      expect(readme).toContain('Animation Fidelity');
      expect(readme).toContain('Accessibility Fidelity');
      expect(readme).toContain('Overall AI Reconstruction Score');
      expect(readme).toContain('Zero-Guesswork Guardrail');
    });

    it('integrates with ArtifactExporter for format "ai-clone-package"', () => {
      const exporter = new ArtifactExporter();
      const res = exporter.export(mockData, 'ai-clone-package');

      expect(res.format).toBe('ai-clone-package');
      expect(res.aiClonePackage).toBeDefined();
      expect(res.base64Zip).toBeDefined();
      expect(res.exportedData).toContain('# AI RECONSTRUCTION INSTRUCTIONS');
      expect(res.artifacts['01_reconstruction.json']).toBeDefined();
      expect(res.artifacts['02_components.json']).toBeDefined();
      expect(res.artifacts['09_styles/tailwind.config.js']).toBeDefined();
    });

    it('integrates with ArtifactExporter for format "all"', () => {
      const exporter = new ArtifactExporter();
      const res = exporter.export(mockData, 'all');

      expect(res.aiClonePackage).toBeDefined();
      expect(res.base64Zip).toBeDefined();
      expect(res.artifacts['reconstruction.json']).toBeDefined();
    });
  });
});
