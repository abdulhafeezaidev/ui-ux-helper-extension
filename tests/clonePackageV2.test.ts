import { describe, it, expect } from 'vitest';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
import { exportPromptMarkdown } from '../src/output/clonePackage/promptMarkdownExporter.ts';
import { exportBehaviorJson } from '../src/output/clonePackage/behaviorJsonExporter.ts';
import { computeCloneConfidenceScore } from '../src/normalization/fidelity/cloneConfidenceCalculator.ts';
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

describe('Prompt 28 — AI Clone Package Consolidation (16 Files -> 10 Files)', () => {
  function buildFullPlatformMockData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="root" style="width: 1440px; background-color: #f8fafc; font-family: 'Inter', sans-serif;">
        <header id="site-header" role="banner" style="position: sticky; top: 0; display: flex; justify-content: space-between; padding: 16px 32px; background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
          <div class="logo">SaaSLogo</div>
          <nav role="navigation" aria-label="Main Navigation" style="display: flex; gap: 24px;">
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
          </nav>
          <button class="btn btn-primary" style="background-color: #3b82f6; color: #ffffff; padding: 10px 20px; transition: transform 150ms ease;">Get Started</button>
        </header>

        <main role="main" style="padding: 48px 32px;">
          <section class="hero-section" style="text-align: center; margin-bottom: 64px;">
            <h1 style="font-size: 48px; font-weight: 800; color: #0f172a;">Build Faster With Reverse Engineering</h1>
            <p style="font-size: 18px; color: #475569; max-width: 680px; margin: 16px auto;">Export complete implementation intelligence ready for AI coding agents.</p>
          </section>

          <section class="grid-section" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;">
            <div class="product-card" id="feature-1" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 24px;">
              <h2 style="font-size: 24px; font-weight: 600;">100% Deterministic</h2>
              <p style="font-size: 15px; color: #64748b;">Zero hallucinations or arbitrary guesswork.</p>
              <button class="btn btn-secondary" style="margin-top: 16px;">Learn More</button>
            </div>
            <div class="product-card" id="feature-2" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 24px;">
              <h2 style="font-size: 24px; font-weight: 600;">Multi-Breakpoint</h2>
              <p style="font-size: 15px; color: #64748b;">8 responsive viewport snapshots.</p>
              <button class="btn btn-secondary" style="margin-top: 16px;">Learn More</button>
            </div>
            <div class="product-card" id="feature-3" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 24px;">
              <h2 style="font-size: 24px; font-weight: 600;">State Machines</h2>
              <p style="font-size: 15px; color: #64748b;">Full interaction graph specifications.</p>
              <button class="btn btn-secondary" style="margin-top: 16px;">Learn More</button>
            </div>
          </section>
        </main>

        <footer role="contentinfo" style="padding: 32px; background-color: #0f172a; color: #94a3b8; text-align: center;">
          <p>&copy; 2026 AI Reverse Engineering Engine.</p>
        </footer>
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
      pageUrl: 'https://example.com/saas-platform',
      title: 'NextGen SaaS Platform',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. 10 Consolidated Artifacts Package Manifest', () => {
    it('bundles all 10 consolidated artifacts (11 files in ZIP) in AI Clone Package.zip', () => {
      const data = buildFullPlatformMockData();
      const pkg = buildAIClonePackage(data);

      expect(pkg.manifest.totalFiles).toBe(19);

      const requiredFiles = [
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

      requiredFiles.forEach((file) => {
        expect(pkg.files[file], `Missing required package file: ${file}`).toBeDefined();
        expect(pkg.files[file].length).toBeGreaterThan(0);
      });
    });

    it('verifies 01_reconstruction.json contains the canonical master model and confidence scores', () => {
      const data = buildFullPlatformMockData();
      const pkg = buildAIClonePackage(data);
      const recon = JSON.parse(pkg.files['01_reconstruction.json']);

      expect(recon.version).toBe('2.0.0');
      expect(recon.cloneConfidence).toBeDefined();
      expect(recon.cloneConfidence.overallScore).toBeGreaterThanOrEqual(90);
      expect(recon.packageManifest.totalArtifacts).toBe(19);
      expect(recon.target.responsiveBreakpoints).toEqual([1920, 1600, 1440, 1280, 1024, 768, 480, 375]);
      expect(recon.sections.length).toBeGreaterThan(0);
      expect(recon.pageTree).toBeDefined();
    });

    it('verifies 02_components.json merges component tree hierarchy and reusable components', () => {
      const data = buildFullPlatformMockData();
      const pkg = buildAIClonePackage(data);
      const comps = JSON.parse(pkg.files['02_components.json']);

      expect(comps.version).toBe('2.0.0');
      expect(comps.componentTree).toBeDefined();
      expect(comps.componentTree.totalNodes).toBeGreaterThan(0);
      expect(comps.components).toBeDefined();
      expect(comps.definitions).toBeDefined();
      expect(comps.families).toBeDefined();
    });

    it('verifies 03_design-system.json merges tokens, semantic colors, and CSS/Tailwind mappings', () => {
      const data = buildFullPlatformMockData();
      const pkg = buildAIClonePackage(data);
      const ds = JSON.parse(pkg.files['03_design-system.json']);

      expect(ds.version).toBe('2.0.0');
      expect(ds.colorTokens).toBeDefined();
      expect(ds.typographyTokens).toBeDefined();
      expect(ds.cssVariableMapping).toBeDefined();
      expect(ds.cssVariableMapping['--color-primary']).toBeDefined();
      expect(ds.tailwindTokenMapping).toBeDefined();
      expect(ds.dtcgDesignTokens).toBeDefined();
    });

    it('verifies 04_layout.json merges containers, grid tracks, and responsive intelligence', () => {
      const data = buildFullPlatformMockData();
      const pkg = buildAIClonePackage(data);
      const layout = JSON.parse(pkg.files['04_layout.json']);

      expect(layout.version).toBe('2.0.0');
      expect(layout.containers).toBeDefined();
      expect(layout.responsiveIntelligence).toBeDefined();
      expect(layout.responsiveIntelligence.standardBreakpoints).toEqual([1920, 1600, 1440, 1280, 1024, 768, 480, 375]);
    });

    it('verifies 05_behavior.json merges interactions, state machines, and animation keyframes', () => {
      const data = buildFullPlatformMockData();
      const pkg = buildAIClonePackage(data);
      const behavior = JSON.parse(pkg.files['05_behavior.json']);

      expect(behavior.version).toBe('2.0.0');
      expect(behavior.interactions).toBeDefined();
      expect(behavior.animations).toBeDefined();
      expect(behavior.keyframesCatalog).toBeDefined();
    });
  });

  describe('2. Multi-Dimensional Clone Confidence Scoring System', () => {
    it('computes all 8 required fidelity dimensions and overall composite score', () => {
      const data = buildFullPlatformMockData();
      const scores = computeCloneConfidenceScore(data);

      expect(typeof scores.visualFidelity).toBe('number');
      expect(scores.visualFidelity).toBeGreaterThanOrEqual(90);

      expect(typeof scores.layoutFidelity).toBe('number');
      expect(scores.layoutFidelity).toBeGreaterThanOrEqual(90);

      expect(typeof scores.typographyFidelity).toBe('number');
      expect(scores.typographyFidelity).toBeGreaterThanOrEqual(90);

      expect(typeof scores.componentFidelity).toBe('number');
      expect(scores.componentFidelity).toBeGreaterThanOrEqual(90);

      expect(typeof scores.interactionFidelity).toBe('number');
      expect(scores.interactionFidelity).toBeGreaterThanOrEqual(90);

      expect(typeof scores.animationFidelity).toBe('number');
      expect(scores.animationFidelity).toBeGreaterThanOrEqual(90);

      expect(typeof scores.accessibilityFidelity).toBe('number');
      expect(scores.accessibilityFidelity).toBeGreaterThanOrEqual(90);

      expect(typeof scores.overallScore).toBe('number');
      expect(scores.overallScore).toBeGreaterThanOrEqual(95);

      expect(['A+', 'A']).toContain(scores.grade);
      expect(scores.verdict).toBe('PRODUCTION_READY_CLONE');
    });
  });

  describe('3. Behavior Exporter & Standalone Exports', () => {
    it('supports direct exportBehaviorJson and exportPromptMarkdown invocation', () => {
      const data = buildFullPlatformMockData();
      const behaviorJson = exportBehaviorJson(data);
      const promptMd = exportPromptMarkdown(data);

      expect(behaviorJson).toContain('"totalInteractions"');
      expect(promptMd).toContain('Complete AI Website Reconstruction Prompt');
    });

    it('supports standalone behavior format in ArtifactExporter', () => {
      const data = buildFullPlatformMockData();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'behavior');
      expect(result.format).toBe('behavior');
      expect(result.exportedData).toBeDefined();
      const parsed = JSON.parse(result.exportedData);
      expect(parsed.interactions).toBeDefined();
      expect(parsed.animations).toBeDefined();
    });

    it('supports standalone prompt format in ArtifactExporter', () => {
      const data = buildFullPlatformMockData();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'prompt');
      expect(result.format).toBe('prompt');
      expect(result.exportedData).toBeDefined();
      expect(result.exportedData).toContain('Complete AI Website Reconstruction Prompt');
    });
  });
});
