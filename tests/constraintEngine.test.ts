import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/domExtractor.ts';
import { ConstraintEngine, buildLayoutConstraintSpecification } from '../src/normalization/layout/constraintEngine.ts';
import { exportConstraintsJson } from '../src/output/clonePackage/constraintsJsonExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
import { exportReconstructionJson } from '../src/output/clonePackage/reconstructionJsonExporter.ts';
import { exportReadmeForAi } from '../src/output/clonePackage/readmeForAiExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

function createMockPageWithComplexConstraints(): AnalyzePageResponseData {
  document.body.innerHTML = `
    <div id="page-root" style="width: 1440px; background-color: #0f172a; color: #ffffff;">
      <!-- Sticky Navigation Header (Flexbox constraint) -->
      <header id="site-header" class="site-header" style="position: sticky; top: 0px; display: flex; flex-direction: row; justify-content: space-between; align-items: center; padding: 16px 24px; max-width: 1280px; margin: 0px auto; background-color: #1e293b;">
        <div id="logo">SaaSLogo</div>
        <nav id="nav-links" style="display: flex; flex-direction: row; gap: 16px; align-items: center;">
          <a href="/features">Features</a>
          <a href="/pricing">Pricing</a>
          <a href="/docs">Docs</a>
        </nav>
        <button id="cta-btn" style="padding: 8px 16px; background-color: #3b82f6;">Get Started</button>
      </header>

      <!-- Hero Section (Flex column centered) -->
      <section id="hero-section" class="hero-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 32px; gap: 24px; text-align: center;">
        <h1 id="hero-title" style="font-size: 48px; font-weight: 800; max-width: 800px;">Reverse Engineering for Frontend Engineering</h1>
        <p id="hero-desc" style="font-size: 20px; color: #94a3b8; max-width: 600px;">Extract pixel-perfect layouts using authentic CSS constraints.</p>
      </section>

      <!-- Products Grid Section (CSS Grid 3-column with 4 identical cards to test deduplication) -->
      <section id="grid-section" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 32px; max-width: 1280px; margin: 0px auto;">
        <div class="product-card" id="card-1" style="display: flex; flex-direction: column; padding: 24px; border-radius: 8px; background-color: #1e293b; gap: 12px;">
          <h2 style="font-size: 20px;">Card 1</h2>
          <p style="color: #94a3b8;">Feature description 1</p>
          <button style="margin-top: auto; padding: 8px 16px; align-self: flex-start;">Action</button>
        </div>
        <div class="product-card" id="card-2" style="display: flex; flex-direction: column; padding: 24px; border-radius: 8px; background-color: #1e293b; gap: 12px;">
          <h2 style="font-size: 20px;">Card 2</h2>
          <p style="color: #94a3b8;">Feature description 2</p>
          <button style="margin-top: auto; padding: 8px 16px; align-self: flex-start;">Action</button>
        </div>
        <div class="product-card" id="card-3" style="display: flex; flex-direction: column; padding: 24px; border-radius: 8px; background-color: #1e293b; gap: 12px;">
          <h2 style="font-size: 20px;">Card 3</h2>
          <p style="color: #94a3b8;">Feature description 3</p>
          <button style="margin-top: auto; padding: 8px 16px; align-self: flex-start;">Action</button>
        </div>
        <div class="product-card" id="card-4" style="display: flex; flex-direction: column; padding: 24px; border-radius: 8px; background-color: #1e293b; gap: 12px;">
          <h2 style="font-size: 20px;">Card 4</h2>
          <p style="color: #94a3b8;">Feature description 4</p>
          <button style="margin-top: auto; padding: 8px 16px; align-self: flex-start;">Action</button>
        </div>
      </section>

      <!-- Positioned Floating Action / Drawer -->
      <aside id="floating-drawer" style="position: fixed; top: 0px; right: 0px; width: 360px; height: 100%; display: flex; flex-direction: column; padding: 32px; background-color: #0b1329;">
        <h3 id="drawer-title">Sidebar Tools</h3>
      </aside>
    </div>
  `;

  const extractor = new DomExtractor();
  const rawResult = extractor.extract(document.body, { includeHidden: true });

  return {
    status: 'completed',
    timestamp: Date.now(),
    title: 'SaaS Platform - Constraint Test',
    pageUrl: 'https://example.com/constraints-test',
    extractionResult: rawResult,
  };
}

describe('Layout Constraint Engine (12_constraints.json)', () => {
  it('1. Normalizes page layout into structured constraint specification', () => {
    const data = createMockPageWithComplexConstraints();
    const engine = new ConstraintEngine();
    const spec = engine.normalize(data);

    expect(spec.$schema).toBe('https://ui-ux-helper.internal/schemas/constraints-v1.json');
    expect(spec.version).toBe('1.0.0');
    expect(spec.summary.totalContainers).toBeGreaterThanOrEqual(5);
    expect(spec.summary.uniqueConstraintSignatures).toBeGreaterThan(0);
    expect(Object.keys(spec.constraintRegistry).length).toBe(spec.summary.uniqueConstraintSignatures);
    expect(spec.containers.length).toBe(spec.summary.totalContainers);
  });

  it('2. Extracts Flexbox container constraints (direction, justify, align, gap, padding, margin)', () => {
    const data = createMockPageWithComplexConstraints();
    const spec = buildLayoutConstraintSpecification(data);

    const headerContainer = spec.containers.find((c) => c.selector.includes('header') || c.tagName === 'header');
    expect(headerContainer).toBeDefined();

    const headerConstraint = spec.constraintRegistry[headerContainer!.constraintRef];
    expect(headerConstraint).toBeDefined();
    expect(headerConstraint.display).toBe('flex');
    expect(headerConstraint.flex).toBeDefined();
    expect(headerConstraint.flex?.direction).toBe('row');
    expect(headerConstraint.flex?.justifyContent).toContain('between');
    expect(headerConstraint.flex?.alignItems).toBe('center');
    expect(headerConstraint.dimensions.maxWidth).toBe('1280px');
    expect(headerConstraint.box.margin.left).toBe('auto');
    expect(headerConstraint.box.margin.right).toBe('auto');
    expect(headerConstraint.positioning.position).toBe('sticky');
  });

  it('3. Extracts CSS Grid container constraints (templateColumns, gap)', () => {
    const data = createMockPageWithComplexConstraints();
    const spec = buildLayoutConstraintSpecification(data);

    const gridContainer = spec.containers.find((c) => c.selector.includes('grid-section') || c.layoutModel === 'grid');
    expect(gridContainer).toBeDefined();

    const gridConstraint = spec.constraintRegistry[gridContainer!.constraintRef];
    expect(gridConstraint).toBeDefined();
    expect(gridConstraint.display).toBe('grid');
    expect(gridConstraint.grid).toBeDefined();
    expect(gridConstraint.grid?.templateColumns).toContain('repeat(3');
    expect(gridConstraint.gap.raw).toBe('24px');
  });

  it('4. Deduplicates identical container constraint signatures across cards', () => {
    const data = createMockPageWithComplexConstraints();
    const spec = buildLayoutConstraintSpecification(data);

    const cardContainers = spec.containers.filter((c) => c.selector.includes('product-card') || c.selector.includes('card-'));
    expect(cardContainers.length).toBeGreaterThanOrEqual(4);

    // All 4 cards have identical layout rules, so they MUST reference the exact same constraintRef
    const firstCardRef = cardContainers[0].constraintRef;
    for (const card of cardContainers) {
      expect(card.constraintRef).toBe(firstCardRef);
    }

    // Deduplication ratio must be strictly positive
    expect(spec.summary.deduplicationRatio).toBeGreaterThan(0);
  });

  it('5. Generates high-fidelity Tailwind utility classes for each constraint', () => {
    const data = createMockPageWithComplexConstraints();
    const spec = buildLayoutConstraintSpecification(data);

    const headerContainer = spec.containers.find((c) => c.selector.includes('header') || c.tagName === 'header');
    const headerConstraint = spec.constraintRegistry[headerContainer!.constraintRef];

    expect(headerConstraint.tailwindEquivalents).toContain('flex');
    expect(headerConstraint.tailwindEquivalents).toContain('flex-row');
    expect(headerConstraint.tailwindEquivalents).toContain('justify-between');
    expect(headerConstraint.tailwindEquivalents).toContain('items-center');
    expect(headerConstraint.tailwindEquivalents).toContain('max-w-7xl');
    expect(headerConstraint.tailwindEquivalents).toContain('mx-auto');
    expect(headerConstraint.tailwindEquivalents).toContain('sticky');
    expect(headerConstraint.tailwindEquivalents).toContain('top-0');
  });

  it('6. Extracts item-level constraints for child elements', () => {
    const data = createMockPageWithComplexConstraints();
    const spec = buildLayoutConstraintSpecification(data);

    expect(Array.isArray(spec.itemConstraints)).toBe(true);
    const buttonItem = spec.itemConstraints.find((item) => item.alignSelf === 'flex-start' || item.tailwindClasses.includes('self-start'));
    if (buttonItem) {
      expect(buttonItem.parentContainerId).toBeDefined();
      expect(buttonItem.tailwindClasses).toContain('self-start');
    }
  });

  it('7. exportConstraintsJson generates valid 12_constraints.json', () => {
    const data = createMockPageWithComplexConstraints();
    const jsonStr = exportConstraintsJson(data);

    expect(typeof jsonStr).toBe('string');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.$schema).toBeDefined();
    expect(parsed.summary.totalContainers).toBeGreaterThan(0);
    expect(parsed.summary.uniqueConstraintSignatures).toBeGreaterThan(0);
    expect(parsed.constraintRegistry).toBeDefined();
    expect(Array.isArray(parsed.containers)).toBe(true);
    expect(Array.isArray(parsed.itemConstraints)).toBe(true);
    expect(Array.isArray(parsed.metadata.guidanceForAI)).toBe(true);
  });

  it('8. AI Clone Package (.zip) builder includes 12_constraints.json in canonical package and manifest', () => {
    const data = createMockPageWithComplexConstraints();
    const pkg = buildAIClonePackage(data);

    expect(pkg.files['12_constraints.json']).toBeDefined();
    expect(pkg.files['constraints.json']).toBeDefined();
    expect(pkg.manifest.totalFiles).toBe(19);

    const reconstructionJson = exportReconstructionJson(data);
    const recParsed = JSON.parse(reconstructionJson);
    expect(recParsed.packageManifest.totalArtifacts).toBe(19);
    const hasConstraintsArtifact = recParsed.packageManifest.artifacts.some((a: any) => a.file === '12_constraints.json');
    expect(hasConstraintsArtifact).toBe(true);

    const readme = exportReadmeForAi(data);
    expect(readme).toContain('12_constraints.json');
    expect(readme).toContain('Step 3: Implement Page Layout');
  });

  it('9. ArtifactExporter handles constraints and 12_constraints export format dispatch', () => {
    const data = createMockPageWithComplexConstraints();
    const exporter = new ArtifactExporter();

    const res1 = exporter.export(data, 'constraints');
    expect(res1.format).toBe('constraints');
    expect(res1.exportedData).toBeDefined();
    const parsed1 = JSON.parse(res1.exportedData);
    expect(parsed1.constraintRegistry).toBeDefined();

    const res2 = exporter.export(data, '12_constraints');
    expect(res2.format).toBe('12_constraints');
    expect(res2.exportedData).toBeDefined();
  });
});
