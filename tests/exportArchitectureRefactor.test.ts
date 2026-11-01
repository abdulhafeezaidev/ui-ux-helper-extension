import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/domExtractor.ts';
import {
  buildAIClonePackage,
  packageCollectors,
} from '../src/output/clonePackage/clonePackageBuilder.ts';
import {
  buildLightweightBundle,
  exportLightweightBundleJson,
} from '../src/output/clonePackage/lightweightBundleBuilder.ts';
import { computeCloneConfidenceScore } from '../src/normalization/fidelity/cloneConfidenceCalculator.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

function createMockPlatformPage(): AnalyzePageResponseData {
  document.body.innerHTML = `
    <div id="root" style="width: 1440px; font-family: 'Inter', sans-serif;">
      <nav id="header-nav" class="navbar sticky" role="navigation" style="display: flex; justify-content: space-between; padding: 16px 32px; background: #0f172a; color: #ffffff;">
        <a href="/" class="brand-logo" style="font-weight: 800; font-size: 20px;">Autonomous AI</a>
        <div class="nav-links" style="display: flex; gap: 16px;">
          <a href="/features" class="nav-link">Features</a>
          <a href="/pricing" class="nav-link">Pricing</a>
        </div>
      </nav>
      <header id="hero-section" class="hero" style="padding: 80px 32px; text-align: center; background: #1e293b;">
        <h1 class="hero-title" style="font-size: 56px; font-weight: 800; color: #ffffff; margin-bottom: 16px;">
          Reverse Engineer Any Website
        </h1>
        <p class="hero-desc" style="font-size: 20px; color: #94a3b8; max-width: 700px; margin: 0 auto 32px;">
          Instant production-ready reconstruction packages for autonomous coding agents.
        </p>
        <button id="cta-button" class="btn btn-primary" style="padding: 14px 28px; background: #3b82f6; color: #ffffff; border-radius: 8px; font-weight: 700;">
          Generate AI Clone
        </button>
      </header>
      <section id="features" class="features-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 64px 32px;">
        <div class="feature-card" style="padding: 24px; border: 1px solid #334155; border-radius: 12px; background: #0f172a;">
          <h3 class="feature-title" style="color: #ffffff; font-size: 20px; font-weight: 700;">Design System</h3>
          <p class="feature-body" style="color: #94a3b8; font-size: 14px;">Automated token extraction and Tailwind configuration.</p>
        </div>
        <div class="feature-card" style="padding: 24px; border: 1px solid #334155; border-radius: 12px; background: #0f172a;">
          <h3 class="feature-title" style="color: #ffffff; font-size: 20px; font-weight: 700;">Variants & CVA</h3>
          <p class="feature-body" style="color: #94a3b8; font-size: 14px;">Delta overrides and component variant engines.</p>
        </div>
        <div class="feature-card" style="padding: 24px; border: 1px solid #334155; border-radius: 12px; background: #0f172a;">
          <h3 class="feature-title" style="color: #ffffff; font-size: 20px; font-weight: 700;">Motion Choreography</h3>
          <p class="feature-body" style="color: #94a3b8; font-size: 14px;">Framer Motion timelines and stagger sequencing.</p>
        </div>
      </section>
      <footer id="page-footer" style="padding: 32px; background: #020617; text-align: center; color: #64748b;" role="contentinfo">
        <p>© 2026 Autonomous Technologies Inc. All rights reserved.</p>
      </footer>
    </div>
  `;

  const extractor = new DomExtractor();
  const rawResult = extractor.extract(document.body, { includeHidden: true });

  return {
    status: 'completed',
    timestamp: Date.now(),
    pageUrl: 'https://example.com/reverse-engineering-platform',
    title: 'Autonomous AI Reverse Engineering Platform',
    extractionResult: rawResult,
  };
}

describe('AI Clone Package UX & Export Architecture Refactor', () => {
  it('1. Central Collector Pipeline executes all modular collectors', () => {
    const data = createMockPlatformPage();

    const ds = packageCollectors.collectDesignSystem(data);
    expect(ds.json).toBeDefined();
    expect(ds.css).toContain(':root');
    expect(ds.tailwind).toContain('module.exports');

    const comps = packageCollectors.collectComponents(data);
    expect(comps.canonical).toBeDefined();

    const variants = packageCollectors.collectVariants(data);
    expect(variants).toBeDefined();

    const layout = packageCollectors.collectLayout(data);
    expect(layout).toBeDefined();

    const resp = packageCollectors.collectResponsive(data);
    expect(resp.transitions).toBeDefined();

    const motion = packageCollectors.collectMotion(data);
    expect(motion).toBeDefined();

    const content = packageCollectors.collectContent(data);
    expect(content).toBeDefined();

    const graph = packageCollectors.collectReconstructionGraph(data);
    expect(graph).toBeDefined();

    const prompt = packageCollectors.collectPrompt(data);
    expect(prompt.readme).toBeDefined();
  });

  it('2. AI Clone Package (.zip) includes all 18 numbered artifacts and prompt/AI_Reconstruction.md', () => {
    const data = createMockPlatformPage();
    const pkg = buildAIClonePackage(data);

    expect(pkg.manifest.totalFiles).toBe(19);
    expect(pkg.files['prompt/AI_Reconstruction.md']).toBeDefined();
    expect(pkg.files['10_README_FOR_AI.md']).toBeDefined();
    expect(pkg.files['18_reconstruction_graph.json']).toBeDefined();
    expect(pkg.files['17_content.json']).toBeDefined();
    expect(pkg.files['16_motion.json']).toBeDefined();
    expect(pkg.files['15_variants.json']).toBeDefined();
    expect(pkg.files['14_typography.json']).toBeDefined();
    expect(pkg.files['13_responsive.json']).toBeDefined();
    expect(pkg.files['12_constraints.json']).toBeDefined();
    expect(pkg.files['11_render_tree.json']).toBeDefined();
    expect(pkg.files['09_styles/css-variables.css']).toBeDefined();
    expect(pkg.files['09_styles/tailwind.config.js']).toBeDefined();
    expect(pkg.zipBuffer.length).toBeGreaterThan(1000);
  });

  it('3. Lightweight Bundle Builder creates a synchronized single payload under 1MB', () => {
    const data = createMockPlatformPage();
    const bundle = buildLightweightBundle(data);

    expect(bundle.$schema).toBe('https://ui-ux-helper.internal/schemas/ai-lightweight-bundle-v1.json');
    expect(bundle.bundleVersion).toBe('1.0.0');
    expect(bundle.cloneReadiness.overallScore).toBeGreaterThanOrEqual(90);
    expect(bundle.reconstructionPrompt).toBeDefined();
    expect(bundle.reconstructionGraph).toBeDefined();
    expect(bundle.designSystem).toBeDefined();
    expect(bundle.componentVariants).toBeDefined();
    expect(bundle.layoutConstraints).toBeDefined();
    expect(bundle.responsiveTransitions).toBeDefined();
    expect(bundle.motionTimelines).toBeDefined();
    expect(bundle.contentSemantics).toBeDefined();
    expect(bundle.styles.cssVariables).toContain(':root');

    const jsonStr = exportLightweightBundleJson(data);
    const sizeInBytes = new TextEncoder().encode(jsonStr).length;
    // Must be strictly less than 1MB (1,048,576 bytes)
    expect(sizeInBytes).toBeLessThan(1048576);
  });

  it('4. Clone Readiness Dashboard computes multi-dimensional quality metrics and verdict', () => {
    const data = createMockPlatformPage();
    const score = computeCloneConfidenceScore(data);

    expect(score.overallScore).toBeGreaterThanOrEqual(90);
    expect(score.visualFidelity).toBeGreaterThanOrEqual(90);
    expect(score.layoutFidelity).toBeGreaterThanOrEqual(90);
    expect(score.typographyFidelity).toBeGreaterThanOrEqual(90);
    expect(score.componentFidelity).toBeGreaterThanOrEqual(85);
    expect(score.interactionFidelity).toBeGreaterThanOrEqual(85);
    expect(score.animationFidelity).toBeGreaterThanOrEqual(85);
    expect(score.accessibilityFidelity).toBeGreaterThanOrEqual(84);
    expect(['A+', 'A', 'B+']).toContain(score.grade);
    expect(['PRODUCTION_READY_CLONE', 'HIGH_FIDELITY_CLONE']).toContain(score.verdict);
  });

  it('5. ArtifactExporter dispatches across all 3 tiers of the information architecture', () => {
    const data = createMockPlatformPage();
    const exporter = new ArtifactExporter();

    // Level 1: Primary Output & Lightweight Bundle
    const resPrimary = exporter.export(data, 'ai-clone-package');
    expect(resPrimary.format).toBe('ai-clone-package');
    expect(resPrimary.exportedData).toBeDefined();

    const resLightweight = exporter.export(data, 'ai-lightweight-bundle');
    expect(resLightweight.format).toBe('ai-lightweight-bundle');
    expect(resLightweight.exportedData).toContain('ai-lightweight-bundle-v1.json');

    // Level 2: Advanced (ADS Formats)
    const resContext = exporter.export(data, 'ads-context');
    expect(resContext.format).toBe('ads-context');
    expect(resContext.exportedData.length).toBeGreaterThan(0);

    const resAdsJson = exporter.export(data, 'ads-json');
    expect(resAdsJson.format).toBe('ads-json');
    expect(resAdsJson.exportedData.length).toBeGreaterThan(0);

    // Level 3: Developer Granular Artifacts
    const resGraph = exporter.export(data, 'reconstruction-graph');
    expect(resGraph.format).toBe('reconstruction-graph');

    const resContent = exporter.export(data, 'content-semantics');
    expect(resContent.format).toBe('content-semantics');

    const resMotion = exporter.export(data, 'motion-timelines');
    expect(resMotion.format).toBe('motion-timelines');

    const resVariants = exporter.export(data, 'component-variants');
    expect(resVariants.format).toBe('component-variants');
  });
});
