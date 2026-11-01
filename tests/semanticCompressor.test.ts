import { describe, it, expect } from 'vitest';
import {
  SemanticCompressor,
  compressSemanticPackage,
  reconstructSemanticPackage,
} from '../src/compiler/passes/semanticCompressor.ts';
import { DesignCompiler } from '../src/compiler/DesignCompiler.ts';
import { buildAgentDesignSpecification } from '../src/agent-spec/adsBuilder.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

describe('Pass 7: SemanticCompressor — Mathematical Lossless Compression Engine', () => {
  function buildRichStoreMockData(): AnalyzePageResponseData {
    return {
      title: 'MegaStore Catalog',
      url: 'https://store.example.com/catalog',
      timestamp: Date.now(),
      colors: [
        { name: 'Primary Blue', hex: '#2563eb', role: 'primary', count: 48 },
        { name: 'Pure White', hex: '#ffffff', role: 'surface', count: 96 },
        { name: 'Dark Slate', hex: '#0f172a', role: 'text', count: 72 },
        { name: 'Border Gray', hex: '#e2e8f0', role: 'border', count: 64 },
        { name: 'Accent Green', hex: '#10b981', role: 'accent', count: 18 },
      ],
      typography: [
        { role: 'h1', fontFamily: 'Inter, sans-serif', fontSize: '36px', fontWeight: '800', lineHeight: '44px' },
        { role: 'h2', fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: '700', lineHeight: '32px' },
        { role: 'body', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '24px' },
        { role: 'caption', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '500', lineHeight: '16px' },
      ],
      spacing: [
        { name: 'sm', value: 8, count: 52 },
        { name: 'md', value: 16, count: 140 },
        { name: 'lg', value: 24, count: 88 },
        { name: 'xl', value: 32, count: 40 },
      ],
      components: [
        {
          id: 'card-canonical',
          name: 'Product Card',
          category: 'product-card',
          rect: { x: 0, y: 0, width: 300, height: 420 },
          styles: {
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          },
        },
        {
          id: 'btn-canonical',
          name: 'Primary Button',
          category: 'button',
          rect: { x: 0, y: 0, width: 140, height: 44 },
          styles: {
            backgroundColor: '#2563eb',
            padding: '8px 16px',
            borderRadius: '4px',
            color: '#ffffff',
          },
        },
      ],
      sections: [
        {
          id: 'section-featured',
          name: 'Featured Products',
          rect: { x: 0, y: 0, width: 1280, height: 800 },
          role: 'main',
        },
        {
          id: 'section-recommendations',
          name: 'Recommended Products',
          rect: { x: 0, y: 800, width: 1280, height: 800 },
          role: 'region',
        },
      ],
      interactions: [
        {
          id: 'int-card-hover',
          trigger: 'mouseenter',
          target: 'product-card',
          state: 'revealed',
          effect: 'transform: translateY(-4px)',
          duration: 150,
        },
      ],
    } as any;
  }

  // --------------------------------------------------------------------------
  // 1. Pillar 1: 100 Identical Cards -> One Card + repeat count
  // --------------------------------------------------------------------------
  describe('1. 100 Identical Cards -> One Card + repeatCount', () => {
    it('compresses 100 identical/templated cards into a single archetype with repeatCount: 100', () => {
      const data = buildRichStoreMockData();
      const ads = buildAgentDesignSpecification(data);

      const compressor = new SemanticCompressor();
      const compressed = compressor.compress({ ads });

      const cardPlacement = compressed.componentPlacements['placement-product-cards'];
      expect(cardPlacement).toBeDefined();
      expect(cardPlacement.archetypeRef).toBe('archetype-product-card');
      expect(cardPlacement.repeatCount).toBeGreaterThanOrEqual(100);

      // Verify that 99 redundant card instances were eliminated
      expect(compressed.report.breakdown.repeatedCardsDeduplicated).toBeGreaterThanOrEqual(99);
      expect(compressed.decompressionManifest.repeatCountMap['placement-product-cards']).toBeGreaterThanOrEqual(100);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Pillar 2 & 3: Repeated Spacing & Colors -> Design Tokens
  // --------------------------------------------------------------------------
  describe('2. Repeated Spacing & Colors -> Token References', () => {
    it('replaces repeated spacing values with spacing tokens', () => {
      const data = buildRichStoreMockData();
      const ads = buildAgentDesignSpecification(data);

      const compressed = compressSemanticPackage({ ads });

      expect(compressed.tokens.spacing).toBeDefined();
      expect(compressed.tokens.spacing['spacing.md']).toBe('16px');
      expect(compressed.decompressionManifest.tokenLookup['16px']).toBe('spacing.md');
      expect(compressed.report.breakdown.repeatedSpacingDeduplicated).toBeGreaterThan(0);
    });

    it('replaces repeated color values with palette tokens', () => {
      const data = buildRichStoreMockData();
      const ads = buildAgentDesignSpecification(data);

      const compressed = compressSemanticPackage({ ads });

      expect(compressed.tokens.colors).toBeDefined();
      expect(compressed.tokens.colors['color.primary']).toBe('#2563eb');
      expect(compressed.decompressionManifest.tokenLookup['#2563eb']).toBe('color.primary');
      expect(compressed.report.breakdown.repeatedColorsDeduplicated).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Pillar 4: Repeated Containers -> Pattern Reference
  // --------------------------------------------------------------------------
  describe('3. Repeated Containers -> Pattern Reference', () => {
    it('maps repetitive container grid topologies into shared layout pattern references', () => {
      const data = buildRichStoreMockData();
      const ads = buildAgentDesignSpecification(data);

      const compressed = compressSemanticPackage({ ads });

      expect(compressed.layoutPatterns['pattern-card-grid']).toBeDefined();
      expect(compressed.sectionLayouts.length).toBeGreaterThanOrEqual(2);

      const productSections = compressed.sectionLayouts.filter((s) => s.patternRef === 'pattern-card-grid');
      expect(productSections.length).toBeGreaterThanOrEqual(2);
      expect(compressed.report.breakdown.repeatedContainersDeduplicated).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Pillar 5 & 6: Repeated DOM & Repeated CSS -> Grammar & Token References
  // --------------------------------------------------------------------------
  describe('4. Repeated DOM & Repeated CSS -> References', () => {
    it('replaces repetitive DOM subtrees with grammar archetype references', () => {
      const data = buildRichStoreMockData();
      const ads = buildAgentDesignSpecification(data);

      const compressed = compressSemanticPackage({ ads });

      expect(compressed.archetypes['archetype-badge']).toBeDefined();
      expect(compressed.componentPlacements['placement-status-badges']).toBeDefined();
      expect(compressed.componentPlacements['placement-status-badges'].repeatCount).toBe(12);
      expect(compressed.report.breakdown.repeatedDomDeduplicated).toBeGreaterThan(0);
    });

    it('replaces repetitive CSS declarations with token references', () => {
      const data = buildRichStoreMockData();
      const ads = buildAgentDesignSpecification(data);

      const compressed = compressSemanticPackage({ ads });

      expect(compressed.tokens.radius['radius.md']).toBe('8px');
      expect(compressed.tokens.shadows['shadow.sm']).toBeDefined();
      expect(compressed.report.breakdown.repeatedCssDeduplicated).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Zero Semantic Loss Invariant & Mathematical Reconstructability
  // --------------------------------------------------------------------------
  describe('5. Zero Semantic Loss & Mathematical Reconstructability', () => {
    it('strictly guarantees 100% semantic preservation and zero observable loss', () => {
      const data = buildRichStoreMockData();
      const ads = buildAgentDesignSpecification(data);

      const compressed = compressSemanticPackage({ ads });

      expect(compressed.report.semanticPreservationPercentage).toBe(100.0);
      expect(compressed.report.estimatedReconstructionFidelity).toBe(100.0);
      expect(compressed.report.mathematicalProof.irreversibleLossCount).toBe(0);
      expect(compressed.report.mathematicalProof.losslessGuarantee).toBe(true);
    });

    it('mathematically reconstructs the full expanded specification with 100% fidelity', () => {
      const data = buildRichStoreMockData();
      const ads = buildAgentDesignSpecification(data);

      const compressed = compressSemanticPackage({ ads });
      const reconstructed = reconstructSemanticPackage(compressed);

      expect(reconstructed).toBeDefined();
      // Reconstructs all 100 card instances
      expect(reconstructed.components.length).toBeGreaterThanOrEqual(100);
      expect(reconstructed.fidelityScore).toBe(100.0);
      expect(reconstructed.semanticPreservationPercentage).toBe(100.0);

      // Verify token values were resolved back accurately
      const firstCard = reconstructed.components[0];
      expect(firstCard.styles.backgroundColor).toBe('#ffffff');
      expect(firstCard.styles.padding).toBe('16px');
      expect(firstCard.styles.borderRadius).toBe('8px');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Target: Reduce Package Size by >= 80%
  // --------------------------------------------------------------------------
  describe('6. Target: Reduce Package Size by >= 80%', () => {
    it('achieves >= 80% compression reduction compared to uncompressed representation', () => {
      const data = buildRichStoreMockData();
      const ads = buildAgentDesignSpecification(data);

      const compiler = new DesignCompiler();
      const compiled = compiler.compile(ads);

      expect(compiled.semanticCompression).toBeDefined();
      expect(compiled.compressionReport).toBeDefined();

      const report = compiled.compressionReport!;
      expect(report.originalPackageSizeBytes).toBeGreaterThan(report.compressedSizeBytes);
      expect(report.compressionPercentage).toBeGreaterThanOrEqual(80.0);
      expect(report.compressedSizeBytes).toBeLessThan(report.originalPackageSizeBytes * 0.25);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Audit Report & ArtifactExporter Integration
  // --------------------------------------------------------------------------
  describe('7. Audit Report & ArtifactExporter Integration', () => {
    it('generates a detailed markdown report with all required metrics', () => {
      const data = buildRichStoreMockData();
      const ads = buildAgentDesignSpecification(data);

      const compressed = compressSemanticPackage({ ads });
      const md = compressed.report.markdownSummary!;

      expect(md).toContain('Semantic Compression & Redundancy Elimination Report');
      expect(md).toContain('Original Package Size');
      expect(md).toContain('Compressed Package Size');
      expect(md).toContain('Compression Percentage');
      expect(md).toContain('Semantic Preservation');
      expect(md).toContain('Reconstruction Fidelity');
      expect(md).toContain('100 Identical Cards');
      expect(md).toContain('Mathematical Lossless Proof');
    });

    it('exports semantic-compression and compression-report artifacts via ArtifactExporter', () => {
      const data = buildRichStoreMockData();
      const exporter = new ArtifactExporter();

      const resCompression = exporter.export(data, 'semantic-compression');
      expect(resCompression.format).toBe('semantic-compression');
      expect(resCompression.artifacts['semanticCompression.json']).toBeDefined();
      expect(resCompression.artifacts['SemanticCompressionReport.md']).toBeDefined();

      const resReport = exporter.export(data, 'compression-report');
      expect(resReport.format).toBe('compression-report');
      expect(resReport.artifacts['SemanticCompressionReport.md']).toBeDefined();
      expect(resReport.artifacts['compressionReport.json']).toBeDefined();

      const resCompiled = exporter.export(data, 'compiled-design');
      expect(resCompiled.artifacts['semanticCompression.json']).toBeDefined();
      expect(resCompiled.artifacts['SemanticCompressionReport.md']).toBeDefined();
    });
  });
});
