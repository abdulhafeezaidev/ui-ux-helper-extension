import { describe, it, expect } from 'vitest';
import {
  exportJson,
  exportDesignTokens,
  exportCssVariables,
  exportTailwindConfig,
  exportComponentSpec,
  exportPageReconstruction,
  ArtifactExporter,
} from '../src/output/index.ts';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

describe('Deterministic Artifact & Export Pipeline Engine', () => {
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

  describe('1. JSON Exporter', () => {
    it('generates complete machine-readable lossless JSON export', () => {
      const data = buildMockAnalysisData();
      const jsonStr = exportJson(data);

      expect(jsonStr).toBeDefined();
      const parsed = JSON.parse(jsonStr);
      expect(parsed.title).toBe('Test Page');
      expect(parsed.colorSystem).toBeDefined();
      expect(parsed.typographySystem).toBeDefined();
      expect(parsed.shapeSystem).toBeDefined();
      expect(parsed.layoutSystem).toBeDefined();
      expect(parsed.componentSystem).toBeDefined();
    });
  });

  describe('2. Design Token Exporter', () => {
    it('generates platform-neutral design tokens with stable token naming', () => {
      const data = buildMockAnalysisData();
      const tokenStr = exportDesignTokens(data);

      const parsed = JSON.parse(tokenStr);
      expect(parsed.color).toBeDefined();
      expect(parsed.typography).toBeDefined();
      expect(parsed.spacing).toBeDefined();
      expect(parsed.borderRadius).toBeDefined();
      expect(parsed.color['color-bg-page'] || parsed.color['color-palette-1']).toBeDefined();
    });
  });

  describe('3. CSS Exporter', () => {
    it('generates valid CSS custom properties and utility classes', () => {
      const data = buildMockAnalysisData();
      const cssStr = exportCssVariables(data);

      expect(cssStr).toContain(':root {');
      expect(cssStr).toContain('--color-');
      expect(cssStr).toContain('--font-');
      expect(cssStr).toContain('--spacing-');
      expect(cssStr).toContain('.u-btn-primary');
    });
  });

  describe('4. Tailwind Exporter', () => {
    it('generates valid Tailwind configuration string', () => {
      const data = buildMockAnalysisData();
      const tailwindStr = exportTailwindConfig(data);

      expect(tailwindStr).toContain('module.exports = {');
      expect(tailwindStr).toContain('"theme": {');
      expect(tailwindStr).toContain('"extend": {');
      expect(tailwindStr).toContain('"colors"');
      expect(tailwindStr).toContain('fontFamily');
    });
  });

  describe('5. Component Spec Exporter', () => {
    it('generates structured component family specifications in markdown', () => {
      const data = buildMockAnalysisData();
      const specStr = exportComponentSpec(data);

      expect(specStr).toContain('# UI Component Family Specifications');
      expect(specStr).toContain('Test Page');
    });
  });

  describe('6. Page Reconstruction Exporter', () => {
    it('generates page-level reconstruction specification document', () => {
      const data = buildMockAnalysisData();
      const reconStr = exportPageReconstruction(data);

      expect(reconStr).toContain('# Page Reconstruction Specification');
      expect(reconStr).toContain('## 1. Global Tokens Summary');
      expect(reconStr).toContain('## 2. Structural Page Sections');
    });
  });

  describe('7. Strict Byte-for-Byte Determinism across Repeated Executions', () => {
    it('produces byte-for-byte identical output for repeated exporter runs on identical input', () => {
      const data = buildMockAnalysisData();

      const exporter = new ArtifactExporter();
      const run1 = exporter.export(data, 'all');
      const run2 = exporter.export(data, 'all');

      expect(run1.exportedData).toBe(run2.exportedData);
      expect(run1.artifacts.json).toBe(run2.artifacts.json);
      expect(run1.artifacts.tokens).toBe(run2.artifacts.tokens);
      expect(run1.artifacts.css).toBe(run2.artifacts.css);
      expect(run1.artifacts.tailwind).toBe(run2.artifacts.tailwind);
      expect(run1.artifacts.components).toBe(run2.artifacts.components);
      expect(run1.artifacts.reconstruction).toBe(run2.artifacts.reconstruction);
    });
  });
});
