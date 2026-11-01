import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import {
  buildAgentDesignSpecification,
  validateADS,
  exportAdsJson,
  exportAdsMarkdown,
  exportAdsContext,
} from '../src/agent-spec/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

describe('Prompt 10 — Production-Grade ADS Quality & Fidelity Validation Engine', () => {
  function buildRichAnalysisData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="wrapper" style="font-family: 'Inter', sans-serif; background-color: rgb(245, 247, 250); color: rgb(30, 41, 59); padding: 24px;">
        <header id="site-header">
          <nav id="top-nav">
            <a href="#" style="font-size: 14px; color: rgb(59, 130, 246);">Home</a>
            <a href="#" style="font-size: 14px; color: rgb(59, 130, 246);">Docs</a>
          </nav>
        </header>
        <main>
          <section id="hero-sec" style="padding: 48px; background: white; margin-bottom: 32px;">
            <h1 style="font-size: 36px; font-weight: 800; color: rgb(30, 41, 59);">Hero Section Title</h1>
            <p style="font-size: 18px; color: rgb(100, 116, 139);">Hero descriptive paragraph text.</p>
            <button role="button" id="primary-cta" style="background-color: rgb(99, 102, 241); color: white; padding: 12px 24px; border-radius: 999px;">Get Started</button>
          </section>
          <section id="cards-sec" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div id="card-1" style="border: 1px solid rgb(226, 232, 240); border-radius: 8px; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.05); padding: 20px;">
              <h2>Feature Card 1</h2>
              <p>Card body 1</p>
            </div>
            <div id="card-2" style="border: 1px solid rgb(226, 232, 240); border-radius: 8px; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.05); padding: 20px;">
              <h2>Feature Card 2</h2>
              <p>Card body 2</p>
            </div>
          </section>
        </main>
        <footer id="site-footer" style="margin-top: 48px; padding: 24px; border-top: 1px solid gray;">
          <p>© 2026 Production Specification Test</p>
        </footer>
      </div>
    `;
    document.title = 'Production-Grade ADS Test';

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
      pageUrl: 'https://example.com/production-test',
      title: 'Production-Grade ADS Test',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Information Loss Audit (All 10 Systems Represented)', () => {
    it('verifies that color, typography, spacing, shape, layout, section, component, relationship, pattern, and constraint systems flow losslessly into ADS', () => {
      const data = buildRichAnalysisData();
      const ads = buildAgentDesignSpecification(data);

      expect(ads.colors.length).toBeGreaterThan(0);
      expect(ads.typography.length).toBeGreaterThan(0);
      expect(ads.spacing.length).toBeGreaterThan(0);
      expect(ads.shapesAndSurfaces.radiusScale.length).toBeGreaterThan(0);
      expect(ads.layout.containerCount).toBeGreaterThan(0);
      expect(ads.sections.length).toBeGreaterThan(0);
      expect(ads.components.length).toBeGreaterThan(0);
      expect(ads.relationships.spatialAlignments.length).toBeGreaterThan(0);
      expect(ads.designPatterns.length).toBeGreaterThan(0);
      expect(ads.fidelityConstraints.length).toBeGreaterThan(0);
    });
  });

  describe('2. Evidence Traceability Audit', () => {
    it('verifies that ADS color, typography, component, and section tokens map to non-empty sourceElementIds', () => {
      const data = buildRichAnalysisData();
      const ads = buildAgentDesignSpecification(data);

      ads.colors.forEach((c) => {
        expect(c.sourceElementIds).toBeDefined();
        expect(c.sourceElementIds.length).toBeGreaterThan(0);
      });

      ads.typography.forEach((t) => {
        expect(t.sourceElementIds).toBeDefined();
        expect(t.sourceElementIds.length).toBeGreaterThan(0);
      });

      ads.components.forEach((comp) => {
        expect(comp.sourceElementIds).toBeDefined();
        expect(comp.sourceElementIds.length).toBeGreaterThan(0);
        expect(comp.evidence.length).toBeGreaterThan(0);
      });
    });
  });

  describe('3. Confidence Model Audit & Bounded Validation', () => {
    it('validates confidence scores stay within [0.0, 1.0] and rejects out-of-bounds confidence values', () => {
      const data = buildRichAnalysisData();
      const ads = buildAgentDesignSpecification(data);

      const validation = validateADS(ads);
      expect(validation.valid).toBe(true);

      // Clone ADS and inject invalid confidence > 1.0
      const invalidAdsHigh = JSON.parse(JSON.stringify(ads));
      invalidAdsHigh.components[0].confidence = 1.5;
      const valHigh = validateADS(invalidAdsHigh);
      expect(valHigh.valid).toBe(false);

      // Clone ADS and inject negative confidence < 0.0
      const invalidAdsLow = JSON.parse(JSON.stringify(ads));
      invalidAdsLow.components[0].confidence = -0.2;
      const valLow = validateADS(invalidAdsLow);
      expect(valLow.valid).toBe(false);
    });
  });

  describe('4. Token Consistency Audit', () => {
    it('verifies token naming stability across repeated extraction and ADS generation runs', () => {
      const data = buildRichAnalysisData();
      const ads1 = buildAgentDesignSpecification(data);
      const ads2 = buildAgentDesignSpecification(data);

      expect(ads1.colors.map((c) => c.name)).toEqual(ads2.colors.map((c) => c.name));
      expect(ads1.typography.map((t) => t.name)).toEqual(ads2.typography.map((t) => t.name));
      expect(ads1.spacing.map((s) => s.id)).toEqual(ads2.spacing.map((s) => s.id));
    });
  });

  describe('5. Strict Byte-for-Byte Determinism', () => {
    it('produces byte-for-byte identical ads.json, ads.md, and ads-context string outputs across repeated executions', () => {
      const data = buildRichAnalysisData();

      const ads1 = buildAgentDesignSpecification(data);
      const ads2 = buildAgentDesignSpecification(data);

      expect(exportAdsJson(ads1)).toBe(exportAdsJson(ads2));
      expect(exportAdsMarkdown(ads1)).toBe(exportAdsMarkdown(ads2));
      expect(exportAdsContext(ads1)).toBe(exportAdsContext(ads2));
    });
  });

  describe('6. Negative & Ambiguous Cases Test', () => {
    it('remains conservative and avoids false-positive component or pattern classifications without sufficient evidence', () => {
      document.body.innerHTML = `
        <div id="plain-div" style="border-radius: 6px;">Plain div text</div>
        <h1 id="plain-heading">Top Heading</h1>
      `;

      const rawResult = new DomExtractor().extract(document.body);
      const colorSystem = new ColorNormalizer().normalize(rawResult);
      const typographySystem = new TypographyNormalizer().normalize(rawResult);
      const shapeSystem = new ShapeNormalizer().normalize(rawResult);
      const layoutSystem = new LayoutNormalizer().normalize(rawResult);
      const compSystem = new ComponentNormalizer().normalize(
        rawResult,
        colorSystem,
        typographySystem,
        shapeSystem,
        layoutSystem
      );

      const plainDivComp = compSystem.components.find((c) => c.rootElementId === 'plain-div');
      expect(plainDivComp?.type).not.toBe('card');

      const glassPattern = compSystem.patterns.find((p) => p.patternType === 'glassLikeSurfaces');
      expect(glassPattern).toBeUndefined();
    });
  });

  describe('7. Empty & Extreme Page Handling', () => {
    it('handles empty page <body></body> without crashing and returns valid empty systems', () => {
      document.body.innerHTML = '';
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

      const data: AnalyzePageResponseData = {
        status: 'completed',
        pageUrl: 'about:blank',
        title: 'Empty Page',
        timestamp: Date.now(),
        extractionResult: rawResult,
        colorSystem,
        typographySystem,
        shapeSystem,
        layoutSystem,
        componentSystem,
      };

      const ads = buildAgentDesignSpecification(data);
      expect(ads).toBeDefined();
      const validation = validateADS(ads);
      expect(validation.valid).toBe(true);
    });
  });

  describe('8. Strict Non-Generation Guardrail Check', () => {
    it('verifies that no HTML, CSS UI reconstruction, React, Vue, or JSX code is generated inside ADS outputs', () => {
      const data = buildRichAnalysisData();
      const ads = buildAgentDesignSpecification(data);

      const jsonStr = exportAdsJson(ads);
      const mdStr = exportAdsMarkdown(ads);
      const ctxStr = exportAdsContext(ads);

      const forbiddenKeywords = ['<div', '<button', 'React.createElement', 'export default function', '<html', '<body'];

      for (const kw of forbiddenKeywords) {
        expect(jsonStr).not.toContain(kw);
        expect(mdStr).not.toContain(kw);
        expect(ctxStr).not.toContain(kw);
      }
    });
  });
});
