import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';
import { ArtifactExporter } from '../src/output/index.ts';

describe('Production Popup Design Reference Inspector Workflow Engine', () => {
  function buildMockResponseData(title = 'Test Page', url = 'https://example.com'): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="wrapper" style="background-color: rgb(245, 247, 250); color: rgb(30, 41, 59); padding: 24px;">
        <h1 style="font-size: 32px; font-weight: 700;">${title}</h1>
        <button role="button" style="background-color: rgb(99, 102, 241); color: white; padding: 8px 16px; border-radius: 6px;">Submit</button>
      </div>
    `;

    const rawResult = new DomExtractor().extract(document.body);
    const colorSystem = new ColorNormalizer().normalize(rawResult);
    const typographySystem = new TypographyNormalizer().normalize(rawResult);
    const shapeSystem = new ShapeNormalizer().normalize(rawResult);
    const layoutSystem = new LayoutNormalizer().normalize(rawResult);
    const componentSystem = new ComponentNormalizer().normalize(
      rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem
    );

    return {
      status: 'completed',
      pageUrl: url,
      title,
      timestamp: Date.now(),
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
      summary: {
        totalElements: rawResult.totalExtracted,
        visibleElements: rawResult.visibleCount,
        normalizedColorsCount: colorSystem.stats.normalizedColorCount,
        normalizedTypographyTokensCount: typographySystem.stats.uniqueTokenCount,
        radiusTokensCount: shapeSystem.stats.uniqueRadiusCount,
        shadowTokensCount: shapeSystem.stats.uniqueShadowCount,
        containerCount: layoutSystem.stats.containerCount,
        sectionCount: layoutSystem.stats.sectionCount,
        componentCount: componentSystem.stats.totalComponents,
        familyCount: componentSystem.stats.familyCount,
      },
    };
  }

  describe('1. Inspector Rendering & Data Flow', () => {
    it('verifies colors, typography, spacing, layout, components, and confidence indicators exist in analysis response data', () => {
      const data = buildMockResponseData();

      expect(data.colorSystem?.tokens.length).toBeGreaterThan(0);
      expect(data.typographySystem?.tokens.length).toBeGreaterThan(0);
      expect(data.shapeSystem?.radiusScale.length).toBeGreaterThan(0);
      expect(data.layoutSystem?.spacingScale.length).toBeGreaterThan(0);
      expect(data.componentSystem?.components.length).toBeGreaterThan(0);

      const comp = data.componentSystem?.components[0];
      expect(comp?.confidence).toBeGreaterThanOrEqual(0.0);
      expect(comp?.confidence).toBeLessThanOrEqual(1.0);
      expect(comp?.evidence.length).toBeGreaterThan(0);
    });
  });

  describe('2. ADS Export Actions Integration', () => {
    it('verifies that Copy ADS Context and Export formats generate expected artifact strings', () => {
      const data = buildMockResponseData();
      const exporter = new ArtifactExporter();

      const contextRes = exporter.export(data, 'ads-context');
      expect(contextRes.exportedData).toContain('AGENT DESIGN CONTEXT');

      const jsonRes = exporter.export(data, 'ads-json');
      expect(jsonRes.exportedData).toContain('"globalSystem"');

      const mdRes = exporter.export(data, 'ads-markdown');
      expect(mdRes.exportedData).toContain('# Agent Design Specification');
    });
  });

  describe('3. Empty & Extreme State Handling', () => {
    it('handles empty page response data without crashing', () => {
      document.body.innerHTML = '';
      const rawResult = new DomExtractor().extract(document.body);
      const data: AnalyzePageResponseData = {
        status: 'completed',
        pageUrl: 'about:blank',
        title: 'Empty',
        timestamp: Date.now(),
        extractionResult: rawResult,
        colorSystem: new ColorNormalizer().normalize(rawResult),
        typographySystem: new TypographyNormalizer().normalize(rawResult),
        shapeSystem: new ShapeNormalizer().normalize(rawResult),
        layoutSystem: new LayoutNormalizer().normalize(rawResult),
        componentSystem: new ComponentNormalizer().normalize(rawResult),
      };

      const exporter = new ArtifactExporter();
      const res = exporter.export(data, 'ads-all');

      expect(res.artifacts['ads-json']).toBeDefined();
      expect(res.artifacts['ads-markdown']).toBeDefined();
      expect(res.artifacts['ads-context']).toBeDefined();
    });
  });

  describe('4. Strict Non-Generation Guardrail Check', () => {
    it('verifies that Design Reference Inspector output contains zero HTML/CSS UI reconstruction code', () => {
      const data = buildMockResponseData();
      const exporter = new ArtifactExporter();
      const res = exporter.export(data, 'ads-all');

      const forbidden = ['<div', '<button', 'React.createElement', '<html', '<body'];
      for (const kw of forbidden) {
        expect(res.artifacts['ads-json']).not.toContain(kw);
        expect(res.artifacts['ads-markdown']).not.toContain(kw);
        expect(res.artifacts['ads-context']).not.toContain(kw);
      }
    });
  });
});
