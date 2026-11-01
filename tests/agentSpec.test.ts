import { describe, it, expect } from 'vitest';
import {
  buildAgentDesignSpecification,
  validateADS,
  exportAdsJson,
  exportAdsMarkdown,
  exportAdsContext,
} from '../src/agent-spec/index.ts';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { ArtifactExporter } from '../src/output/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

describe('Agent Design Specification (ADS) Subsystem Engine', () => {
  function buildMockAnalysisData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="wrapper" style="background-color: rgb(245, 247, 250); color: rgb(30, 41, 59); padding: 24px;">
        <nav id="nav">
          <a href="#" style="font-size: 14px; color: rgb(59, 130, 246);">Link 1</a>
        </nav>
        <h1 style="font-size: 32px; font-weight: 700;">Title</h1>
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
      pageUrl: 'https://example.com/test',
      title: 'Test Page',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. ADS Completeness Test', () => {
    it('verifies that ADS contains all major systems (color, typography, shape, layout, component, section, spacing, patterns, relationships, constraints)', () => {
      const data = buildMockAnalysisData();
      const ads = buildAgentDesignSpecification(data);

      expect(ads).toBeDefined();
      expect(ads.colors.length).toBeGreaterThan(0);
      expect(ads.typography.length).toBeGreaterThan(0);
      expect(ads.spacing.length).toBeGreaterThan(0);
      expect(ads.shapesAndSurfaces).toBeDefined();
      expect(ads.layout).toBeDefined();
      expect(ads.sections).toBeDefined();
      expect(ads.components).toBeDefined();
      expect(ads.relationships).toBeDefined();
      expect(ads.designPatterns).toBeDefined();
      expect(ads.fidelityConstraints.length).toBeGreaterThan(0);
      expect(ads.implementationGuidance.length).toBeGreaterThan(0);
    });
  });

  describe('2. ADS Validation Test', () => {
    it('verifies that validateADS passes cleanly for generated specifications', () => {
      const data = buildMockAnalysisData();
      const ads = buildAgentDesignSpecification(data);

      const validation = validateADS(ads);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
  });

  describe('3. Strict Byte-for-Byte Determinism Test', () => {
    it('produces byte-for-byte identical output for ads.json, ads.md, and ads-context across repeated runs', () => {
      const data = buildMockAnalysisData();

      const ads1 = buildAgentDesignSpecification(data);
      const ads2 = buildAgentDesignSpecification(data);

      const json1 = exportAdsJson(ads1);
      const json2 = exportAdsJson(ads2);

      const md1 = exportAdsMarkdown(ads1);
      const md2 = exportAdsMarkdown(ads2);

      const ctx1 = exportAdsContext(ads1);
      const ctx2 = exportAdsContext(ads2);

      expect(json1).toBe(json2);
      expect(md1).toBe(md2);
      expect(ctx1).toBe(ctx2);
    });
  });

  describe('4. No Code Generation Enforcement Test', () => {
    it('strictly verifies that ADS output does not contain HTML, JSX, React components, or visual UI code', () => {
      const data = buildMockAnalysisData();
      const ads = buildAgentDesignSpecification(data);

      const jsonStr = exportAdsJson(ads);
      const mdStr = exportAdsMarkdown(ads);

      expect(jsonStr).not.toContain('<div');
      expect(jsonStr).not.toContain('React.createElement');
      expect(jsonStr).not.toContain('export default function');

      expect(mdStr).not.toContain('```jsx');
      expect(mdStr).not.toContain('```tsx');
      expect(mdStr).not.toContain('```html');
    });
  });

  describe('5. ArtifactExporter Integration Test', () => {
    it('routes ADS formats cleanly through ArtifactExporter orchestrator', () => {
      const data = buildMockAnalysisData();
      const exporter = new ArtifactExporter();

      const res = exporter.export(data, 'ads-all');
      expect(res.artifacts['ads-json']).toBeDefined();
      expect(res.artifacts['ads-markdown']).toBeDefined();
      expect(res.artifacts['ads-context']).toBeDefined();
    });
  });
});
