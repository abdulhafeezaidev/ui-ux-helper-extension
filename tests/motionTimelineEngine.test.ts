import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/domExtractor.ts';
import {
  MotionTimelineEngine,
  buildMotionTimelineSpecification,
} from '../src/normalization/animation/motionTimelineEngine.ts';
import { exportMotionJson } from '../src/output/clonePackage/motionJsonExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
import { exportReconstructionJson } from '../src/output/clonePackage/reconstructionJsonExporter.ts';
import { exportReadmeForAi } from '../src/output/clonePackage/readmeForAiExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

function createMockMotionPage(): AnalyzePageResponseData {
  document.body.innerHTML = `
    <div id="app" style="width: 1440px; font-family: 'Inter', sans-serif;">
      <!-- Hero Section -->
      <section id="hero" class="content-section" style="padding: 64px 32px;">
        <h1 class="hero-title" style="font-size: 48px; font-weight: 800; animation: fadeIn 0.4s ease-out forwards;">
          Autonomous Motion Intelligence
        </h1>
        <button id="cta-button" class="btn btn-primary" style="transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); transform: translateY(0);">
          Get Started
        </button>
      </section>

      <!-- Feature Card Grid with Staggering -->
      <section id="features" class="content-section" style="padding: 32px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
        <div id="card-1" class="card feature-card" style="padding: 24px; border-radius: 12px; transition: transform 0.3s ease-out;">
          Card 1 Content
        </div>
        <div id="card-2" class="card feature-card" style="padding: 24px; border-radius: 12px; transition: transform 0.3s ease-out;">
          Card 2 Content
        </div>
        <div id="card-3" class="card feature-card" style="padding: 24px; border-radius: 12px; transition: transform 0.3s ease-out;">
          Card 3 Content
        </div>
      </section>

      <!-- Modal Dialog Overlay -->
      <div id="modal-container" role="dialog" class="modal modal-open" style="display: block;">
        <div class="modal-backdrop" style="opacity: 0.6; transition: opacity 0.2s ease-out;"></div>
        <div class="modal-dialog" style="transform: scale(1); transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
          <h2>Modal Title</h2>
        </div>
      </div>

      <!-- Navigation Drawer Sheet -->
      <div id="nav-drawer" class="drawer drawer-open" style="display: block;">
        <div class="drawer-backdrop" style="opacity: 0.5; transition: opacity 0.25s ease-out;"></div>
        <div class="drawer-panel" style="transform: translateX(0); transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);">
          <nav>Menu Links</nav>
        </div>
      </div>
    </div>
  `;

  const extractor = new DomExtractor();
  const rawResult = extractor.extract(document.body, { includeHidden: true });

  return {
    status: 'completed',
    timestamp: Date.now(),
    title: 'Motion Timeline Test Page',
    pageUrl: 'https://example.com/motion-test',
    extractionResult: rawResult,
  };
}

describe('Motion Timeline Reconstruction Engine (16_motion.json)', () => {
  it('1. Normalizes animations and transitions into structured motion timeline specification', () => {
    const data = createMockMotionPage();
    const engine = new MotionTimelineEngine();
    const spec = engine.normalize(data);

    expect(spec.$schema).toBe('https://ui-ux-helper.internal/schemas/motion-timeline-v1.json');
    expect(spec.version).toBe('1.0.0');
    expect(spec.target.title).toBe('Motion Timeline Test Page');
    expect(spec.summary.totalTimelines).toBeGreaterThanOrEqual(4);
    expect(spec.summary.totalActorTracks).toBeGreaterThanOrEqual(5);
    expect(spec.summary.framerMotionReady).toBe(true);
    expect(spec.summary.averageAnimationDurationMs).toBeGreaterThan(0);
    expect(Array.isArray(spec.metadata.guidanceForAI)).toBe(true);
  });

  it('2. Detects all core timeline categories: Hover, Stagger, Scroll, Modal, Drawer', () => {
    const data = createMockMotionPage();
    const spec = buildMotionTimelineSpecification(data);

    const categories = spec.timelines.map((t) => t.category);
    expect(categories).toContain('hover');
    expect(categories).toContain('stagger');
    expect(categories).toContain('scroll');
    expect(categories).toContain('modal');
    expect(categories).toContain('drawer');
  });

  it('3. Computes accurate multi-actor Stagger timelines with millisecond offsets', () => {
    const data = createMockMotionPage();
    const spec = buildMotionTimelineSpecification(data);

    const staggerTimeline = spec.timelines.find((t) => t.category === 'stagger');
    expect(staggerTimeline).toBeDefined();
    expect(staggerTimeline?.stagger).toBeDefined();
    expect(staggerTimeline?.stagger?.isStaggered).toBe(true);
    expect(staggerTimeline?.stagger?.staggerIntervalMs).toBe(75);
    expect(staggerTimeline?.tracks.length).toBe(3);

    // Verify track start and end times
    const track0 = staggerTimeline!.tracks[0];
    const track1 = staggerTimeline!.tracks[1];
    const track2 = staggerTimeline!.tracks[2];

    expect(track0.startTimeMs).toBe(0);
    expect(track0.durationMs).toBe(350);
    expect(track0.endTimeMs).toBe(350);

    expect(track1.startTimeMs).toBe(75);
    expect(track1.durationMs).toBe(350);
    expect(track1.endTimeMs).toBe(425);

    expect(track2.startTimeMs).toBe(150);
    expect(track2.durationMs).toBe(350);
    expect(track2.endTimeMs).toBe(500);

    expect(staggerTimeline?.totalDurationMs).toBe(500);
  });

  it('4. Coordinates synchronized Modal Dialog tracks (Backdrop + Panel)', () => {
    const data = createMockMotionPage();
    const spec = buildMotionTimelineSpecification(data);

    const modalTimeline = spec.timelines.find((t) => t.category === 'modal');
    expect(modalTimeline).toBeDefined();
    expect(modalTimeline?.tracks.length).toBe(2);

    const backdropTrack = modalTimeline?.tracks.find((tr) => tr.role === 'overlay-backdrop');
    const panelTrack = modalTimeline?.tracks.find((tr) => tr.role === 'dialog-panel');

    expect(backdropTrack).toBeDefined();
    expect(panelTrack).toBeDefined();
    expect(backdropTrack?.properties).toContain('opacity');
    expect(panelTrack?.properties).toContain('transform');
  });

  it('5. Coordinates synchronized Navigation Drawer tracks (Backdrop + Slide Panel)', () => {
    const data = createMockMotionPage();
    const spec = buildMotionTimelineSpecification(data);

    const drawerTimeline = spec.timelines.find((t) => t.category === 'drawer');
    expect(drawerTimeline).toBeDefined();
    expect(drawerTimeline?.tracks.length).toBe(2);

    const slideTrack = drawerTimeline?.tracks.find((tr) => tr.role === 'slide-over-panel');
    expect(slideTrack).toBeDefined();
    expect(slideTrack?.keyframes[0].styles.transform).toBe('translateX(100%)');
    expect(slideTrack?.keyframes[1].styles.transform).toBe('translateX(0%)');
  });

  it('6. Generates production-ready Framer Motion React code with staggerChildren', () => {
    const data = createMockMotionPage();
    const spec = buildMotionTimelineSpecification(data);

    const staggerTimeline = spec.timelines.find((t) => t.category === 'stagger');
    expect(staggerTimeline?.framerMotionCode).toBeDefined();
    expect(staggerTimeline?.framerMotionCode).toContain('staggerChildren: 0.075');
    expect(staggerTimeline?.framerMotionCode).toContain('delayChildren: 0.1');
    expect(staggerTimeline?.framerMotionCode).toContain('hidden: { opacity: 0');
    expect(staggerTimeline?.framerMotionCode).toContain('visible: {');

    const modalTimeline = spec.timelines.find((t) => t.category === 'modal');
    expect(modalTimeline?.framerMotionCode).toContain('modalDialogVariants');
    expect(modalTimeline?.framerMotionCode).toContain('modalBackdropVariants');
  });

  it('7. Generates CSS keyframe rules and transition utility classes', () => {
    const data = createMockMotionPage();
    const spec = buildMotionTimelineSpecification(data);

    const staggerTimeline = spec.timelines.find((t) => t.category === 'stagger');
    expect(staggerTimeline?.cssKeyframesCode).toContain('@keyframes');
    expect(staggerTimeline?.cssKeyframesCode).toContain('transform: translateY');
    expect(staggerTimeline?.tracks[0].cssTransitionSnippet).toContain('transition:');
    expect(staggerTimeline?.tracks[0].tailwindClasses).toContain('transition-all');
  });

  it('8. exportMotionJson produces valid 16_motion.json payload', () => {
    const data = createMockMotionPage();
    const jsonStr = exportMotionJson(data);

    expect(typeof jsonStr).toBe('string');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.$schema).toBeDefined();
    expect(parsed.summary.totalTimelines).toBeGreaterThan(0);
    expect(parsed.summary.totalActorTracks).toBeGreaterThan(0);
    expect(Array.isArray(parsed.timelines)).toBe(true);
    expect(Array.isArray(parsed.metadata.guidanceForAI)).toBe(true);
  });

  it('9. AI Clone Package (.zip) builder includes 16_motion.json in canonical package and manifest', () => {
    const data = createMockMotionPage();
    const pkg = buildAIClonePackage(data);

    expect(pkg.files['16_motion.json']).toBeDefined();
    expect(pkg.files['motion-timelines.json']).toBeDefined();
    expect(pkg.manifest.totalFiles).toBe(19);

    const reconstructionJson = exportReconstructionJson(data);
    const recParsed = JSON.parse(reconstructionJson);
    expect(recParsed.packageManifest.totalArtifacts).toBe(19);
    const hasMotionArtifact = recParsed.packageManifest.artifacts.some((a: any) => a.file === '16_motion.json');
    expect(hasMotionArtifact).toBe(true);

    const readme = exportReadmeForAi(data);
    expect(readme).toContain('16_motion.json');
    expect(readme).toContain('Step 5: Wire Runtime Behavior, Interactions & Motion');
  });

  it('10. ArtifactExporter handles motion-timelines and 16_motion export format dispatch', () => {
    const data = createMockMotionPage();
    const exporter = new ArtifactExporter();

    const res1 = exporter.export(data, 'motion-timelines');
    expect(res1.format).toBe('motion-timelines');
    expect(res1.exportedData).toBeDefined();
    const parsed1 = JSON.parse(res1.exportedData);
    expect(Array.isArray(parsed1.timelines)).toBe(true);

    const res2 = exporter.export(data, '16_motion');
    expect(res2.format).toBe('16_motion');
    expect(res2.exportedData).toBeDefined();
  });
});
