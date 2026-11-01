import { describe, it, expect } from 'vitest';
import {
  buildAnimationIntelligenceSystem,
} from '../src/normalization/animation/animationIntelligenceEngine.ts';
import { exportAnimationsJson } from '../src/output/clonePackage/animationsJsonExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

describe('Prompt 23 — Animation Intelligence Engine', () => {
  function buildRichAnimationMockData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="root-container" style="width: 1440px;">
        <header id="header-bar" style="position: sticky; top: 0px; display: flex; justify-content: space-between; padding: 16px 32px; transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), padding 200ms ease;">
          <div class="brand-logo" id="logo">Logo</div>
          <button id="cta-button" class="btn btn-primary" style="transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms ease;">Get Started</button>
        </header>

        <main id="main-content">
          <section id="hero-banner" class="hero-banner" style="animation: fadeIn 600ms cubic-bezier(0.16, 1, 0.3, 1) 100ms forwards; padding: 64px 32px;">
            <h1 id="hero-title">Intelligent Animation Engine</h1>
            <p id="hero-desc">Extracts transitions, keyframes, easings, and trigger behaviors.</p>
          </section>

          <section id="features-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 32px;">
            <div class="feature-card" id="card-alpha" style="transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1); padding: 24px;">
              <svg id="icon-chevron" class="chevron-icon" width="24" height="24" style="transition: transform 200ms ease;"><path d="M6 9l6 6 6-6"/></svg>
              <h3>Fast Processing</h3>
            </div>
            <div class="feature-card" id="card-beta" style="transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1); padding: 24px;">
              <h3>High Fidelity</h3>
            </div>
            <div class="feature-card" id="card-gamma" style="padding: 24px;">
              <h3>Zero Guesswork</h3>
            </div>
          </section>
        </main>

        <button id="floating-top-btn" class="scroll-top-btn" style="opacity: 0; transform: translateY(16px); transition: opacity 200ms ease, transform 200ms ease;">Top</button>
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
      pageUrl: 'https://example.com/animations',
      title: 'Animation Testing Suite',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Detected Animation Properties & Motion Curves', () => {
    it('detects opacity, transform, translate, rotate, and scale motion specs', () => {
      const data = buildRichAnimationMockData();
      const system = buildAnimationIntelligenceSystem(data);

      expect(system.totalAnimations).toBeGreaterThanOrEqual(6);

      const transforms = system.animations.filter((a) => a.motion.transform !== undefined);
      expect(transforms.length).toBeGreaterThan(0);

      const opacities = system.animations.filter((a) => a.motion.opacity !== undefined || a.motion.fade !== undefined);
      expect(opacities.length).toBeGreaterThan(0);

      const rotations = system.animations.filter((a) => a.motion.transform?.rotate !== undefined || a.motion.motionType === 'rotate');
      expect(rotations.length).toBeGreaterThan(0);

      const scales = system.animations.filter((a) => a.motion.transform?.scale !== undefined || a.motion.motionType === 'scale');
      expect(scales.length).toBeGreaterThan(0);
    });

    it('extracts transition duration, delay, and timing functions', () => {
      const data = buildRichAnimationMockData();
      const system = buildAnimationIntelligenceSystem(data);

      system.animations.forEach((anim) => {
        expect(typeof anim.timing.duration).toBe('number');
        expect(anim.timing.duration).toBeGreaterThanOrEqual(0);
        expect(anim.timing.durationStr).toMatch(/\d+ms/);
        expect(typeof anim.timing.delay).toBe('number');
        expect(anim.timing.timingFunction).toBeDefined();
        expect(anim.timing.fillMode).toBeDefined();
      });
    });

    it('indexes keyframe definitions in the keyframes catalog', () => {
      const data = buildRichAnimationMockData();
      const system = buildAnimationIntelligenceSystem(data);

      expect(system.keyframesCatalog).toBeDefined();
      expect(system.keyframesCatalog['fadeIn']).toBeDefined();
      expect(system.keyframesCatalog['shimmer']).toBeDefined();
      expect(system.keyframesCatalog['spin']).toBeDefined();
      expect(system.keyframesCatalog['pulse']).toBeDefined();
    });
  });

  describe('2. Animation Trigger Modes Detection', () => {
    it('detects hover, active, page entrance, and scroll animations', () => {
      const data = buildRichAnimationMockData();
      const system = buildAnimationIntelligenceSystem(data);

      expect(system.summary.hoverAnimations).toBeGreaterThan(0);
      expect(system.summary.activeAnimations).toBeGreaterThan(0);
      expect(system.summary.pageAnimations).toBeGreaterThan(0);
      expect(system.summary.scrollAnimations).toBeGreaterThan(0);
    });
  });

  describe('3. Regression Guardrail: Strict DOM Traceability', () => {
    it('guarantees 100% of exported animations map to valid extracted DOM elements with zero orphans', () => {
      const data = buildRichAnimationMockData();
      const system = buildAnimationIntelligenceSystem(data);
      const elements = data.extractionResult?.elements || [];
      const validElementIds = new Set(elements.map((e) => e.id));

      expect(system.domMappingIntegrity.zeroOrphans).toBe(true);
      expect(system.domMappingIntegrity.domTraceabilityPct).toBe(100);

      system.animations.forEach((anim) => {
        expect(validElementIds.has(anim.targetElementId), `Animation ${anim.id} targeted non-existent element: ${anim.targetElementId}`).toBe(true);
      });
    });
  });

  describe('4. animations.json Exporter & Artifact Integration', () => {
    it('exports a valid animations.json artifact matching schema', () => {
      const data = buildRichAnimationMockData();
      const jsonStr = exportAnimationsJson(data);

      expect(typeof jsonStr).toBe('string');
      const parsed = JSON.parse(jsonStr);

      expect(parsed.$schema).toContain('animations-v1.json');
      expect(parsed.totalAnimations).toBeGreaterThan(0);
      expect(parsed.animations).toBeDefined();
      expect(Array.isArray(parsed.animations)).toBe(true);
      expect(parsed.keyframesCatalog).toBeDefined();
      expect(parsed.domMappingIntegrity).toBeDefined();
    });

    it('supports standalone animations format in ArtifactExporter', () => {
      const data = buildRichAnimationMockData();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'animations');
      expect(result.format).toBe('animations');
      expect(result.exportedData).toBeDefined();

      const parsed = JSON.parse(result.exportedData);
      expect(parsed.animations).toBeDefined();
      expect(parsed.keyframesCatalog).toBeDefined();
    });
  });
});
