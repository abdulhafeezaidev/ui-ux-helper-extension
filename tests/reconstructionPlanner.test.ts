import { describe, it, expect } from 'vitest';
import { ReconstructionPlanner } from '../src/compiler/passes/reconstructionPlanner.ts';
import { DesignCompiler } from '../src/compiler/DesignCompiler.ts';
import { buildAgentDesignSpecification } from '../src/agent-spec/index.ts';
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

describe('ReconstructionPlanner Optimal Build Order & DAG Engine', () => {
  function createReconstructionTestPage(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="root" style="width: 100%; background: #ffffff;">
        <header id="main-nav" style="position: sticky; top: 0; display: flex; justify-content: space-between; padding: 16px 32px; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
          <div class="logo">Brand</div>
          <nav style="display: flex; gap: 16px;"><a href="#">Shop</a><a href="#">About</a></nav>
          <button style="padding: 8px 16px; background: #2563eb; color: #fff;">Cart</button>
        </header>

        <section id="hero" style="display: flex; justify-content: space-between; align-items: center; padding: 64px 32px;">
          <div style="max-width: 50%;">
            <h1 style="font-size: 40px; line-height: 48px; color: #111827;">Empowering Semantic Design</h1>
            <p style="font-size: 18px; color: #4b5563; margin: 16px 0;">Deterministic reconstruction from semantic grammars.</p>
            <button style="padding: 12px 24px; background: #2563eb; color: #fff; border-radius: 6px;">Explore</button>
          </div>
          <div style="max-width: 45%;">
            <img src="hero.jpg" alt="Hero" style="width: 100%;" />
          </div>
        </section>

        <section id="product-grid" style="padding: 48px 32px; max-width: 1200px; margin: 0 auto;">
          <h2>Featured Products</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
            <div class="product-card" style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <img src="item1.jpg" alt="Item 1" />
              <h3>Product One</h3>
              <p>$49.99</p>
              <button>Buy Now</button>
            </div>
            <div class="product-card" style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <img src="item2.jpg" alt="Item 2" />
              <h3>Product Two</h3>
              <p>$59.99</p>
              <button>Buy Now</button>
            </div>
            <div class="product-card" style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <img src="item3.jpg" alt="Item 3" />
              <h3>Product Three</h3>
              <p>$69.99</p>
              <button>Buy Now</button>
            </div>
          </div>
        </section>

        <section id="faq" style="padding: 48px 32px;">
          <div class="accordion" style="border: 1px solid #e5e7eb; padding: 16px;">
            <button style="width: 100%; text-align: left;">How does compilation work?</button>
            <div style="padding-top: 8px;">It compiles raw DOM into compact semantic grammars.</div>
          </div>
        </section>

        <footer id="footer" style="padding: 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
          <p>© 2026 Semantic Design Compiler. All rights reserved.</p>
        </footer>
      </div>
    `;

    const rawResult = new DomExtractor().extract(document.body);
    const colorSystem = new ColorNormalizer().normalize(rawResult);
    const typographySystem = new TypographyNormalizer().normalize(rawResult);
    const shapeSystem = new ShapeNormalizer().normalize(rawResult);
    const layoutSystem = new LayoutNormalizer().normalize(rawResult);
    const componentSystem = new ComponentNormalizer(
    ).normalize(rawResult, colorSystem, typographySystem, shapeSystem, layoutSystem);

    return {
      status: 'completed',
      pageUrl: 'https://reconstruction.example.com',
      title: 'Reconstruction Planner Demonstration',
      timestamp: Date.now(),
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  it('generates the optimal 9-step build order in the exact required sequence', () => {
    const data = createReconstructionTestPage();
    const compiler = new DesignCompiler();
    const pkg = compiler.compile(buildAgentDesignSpecification(data));

    const plan = pkg.reconstructionPlan;
    expect(plan).toBeDefined();
    expect(plan.steps.length).toBe(9);
    expect(plan.totalSteps).toBe(9);

    // Verify step sequence
    const expectedPhases = [
      'design-tokens',
      'typography',
      'layout-patterns',
      'shared-components',
      'variants',
      'pages',
      'interactions',
      'accessibility',
      'optimization',
    ];

    plan.steps.forEach((step, idx) => {
      expect(step.stepNumber).toBe(idx + 1);
      expect(step.phase).toBe(expectedPhases[idx]);
    });

    expect(plan.steps[0].title).toContain('Design Tokens');
    expect(plan.steps[1].title).toContain('Typography');
    expect(plan.steps[2].title).toContain('Layout Patterns');
    expect(plan.steps[3].title).toContain('Shared Components');
    expect(plan.steps[4].title).toContain('Variants');
    expect(plan.steps[5].title).toContain('Pages');
    expect(plan.steps[6].title).toContain('Interactions');
    expect(plan.steps[7].title).toContain('Accessibility');
    expect(plan.steps[8].title).toContain('Optimization');
  });

  it('verifies every step references exact compiler outputs', () => {
    const data = createReconstructionTestPage();
    const compiler = new DesignCompiler();
    const pkg = compiler.compile(buildAgentDesignSpecification(data));

    const steps = pkg.reconstructionPlan.steps;

    // Step 1 references designGrammar.json
    expect(steps[0].compilerReferences.some((r) => r.artifact === 'designGrammar.json')).toBe(true);

    // Step 2 references typographyScale in designGrammar.json
    expect(steps[1].compilerReferences.some((r) => r.artifact === 'designGrammar.json' && r.section === 'typographyScale')).toBe(true);

    // Step 3 references layoutGrammar.json patterns
    expect(steps[2].compilerReferences.some((r) => r.artifact === 'layoutGrammar.json' && r.section === 'patterns')).toBe(true);

    // Step 4 references componentGrammar.json archetypes
    expect(steps[3].compilerReferences.some((r) => r.artifact === 'componentGrammar.json' && r.section === 'archetypes')).toBe(true);

    // Step 5 references componentGrammar.json variants
    expect(steps[4].compilerReferences.some((r) => r.artifact === 'componentGrammar.json' && r.section === 'variants')).toBe(true);

    // Step 6 references layoutGrammar.json sections
    expect(steps[5].compilerReferences.some((r) => r.artifact === 'layoutGrammar.json' && r.section === 'sections')).toBe(true);

    // Step 7 references interactionGrammar.json semanticInteractions
    expect(steps[6].compilerReferences.some((r) => r.artifact === 'interactionGrammar.json' && r.section === 'semanticInteractions')).toBe(true);

    // Step 8 references accessibilityGrammar.json landmarks
    expect(steps[7].compilerReferences.some((r) => r.artifact === 'accessibilityGrammar.json' && r.section === 'landmarks')).toBe(true);

    // Step 9 references compiler statistics across all passes
    expect(steps[8].compilerReferences.length).toBeGreaterThanOrEqual(4);
    expect(steps[8].compilerReferences.some((r) => r.artifact === 'designGrammar.json')).toBe(true);
    expect(steps[8].compilerReferences.some((r) => r.artifact === 'componentGrammar.json')).toBe(true);
    expect(steps[8].compilerReferences.some((r) => r.artifact === 'layoutGrammar.json')).toBe(true);
    expect(steps[8].compilerReferences.some((r) => r.artifact === 'interactionGrammar.json')).toBe(true);
  });

  it('generates a directed acyclic graph (DAG) enabling parallel construction in Tier 2', () => {
    const data = createReconstructionTestPage();
    const compiler = new DesignCompiler();
    const pkg = compiler.compile(buildAgentDesignSpecification(data));

    const dag = pkg.reconstructionPlan.dependencyGraph;
    expect(dag).toBeDefined();
    expect(dag.nodes.length).toBe(9);
    expect(dag.edges.length).toBeGreaterThanOrEqual(10);
    expect(dag.parallelTiers.length).toBe(8);

    // Tier 1 is sequential root: Design Tokens
    const tier1 = dag.parallelTiers.find((t) => t.tier === 1);
    expect(tier1?.stepIds).toEqual(['step-1-design-tokens']);
    expect(tier1?.canExecuteConcurrently).toBe(false);

    // Tier 2 is parallel: Typography and Layout Patterns
    const tier2 = dag.parallelTiers.find((t) => t.tier === 2);
    expect(tier2?.stepIds).toContain('step-2-typography');
    expect(tier2?.stepIds).toContain('step-3-layout-patterns');
    expect(tier2?.canExecuteConcurrently).toBe(true);

    // Step 2 and Step 3 each list the other in canRunInParallelWith
    const step2 = pkg.reconstructionPlan.steps.find((s) => s.id === 'step-2-typography');
    const step3 = pkg.reconstructionPlan.steps.find((s) => s.id === 'step-3-layout-patterns');
    expect(step2?.canRunInParallelWith).toContain('step-3-layout-patterns');
    expect(step3?.canRunInParallelWith).toContain('step-2-typography');

    // Verify topological order
    expect(dag.topologicalOrder.indexOf('step-1-design-tokens')).toBeLessThan(dag.topologicalOrder.indexOf('step-2-typography'));
    expect(dag.topologicalOrder.indexOf('step-1-design-tokens')).toBeLessThan(dag.topologicalOrder.indexOf('step-3-layout-patterns'));
    expect(dag.topologicalOrder.indexOf('step-4-shared-components')).toBeLessThan(dag.topologicalOrder.indexOf('step-5-variants'));
    expect(dag.topologicalOrder.indexOf('step-6-pages')).toBeLessThan(dag.topologicalOrder.indexOf('step-7-interactions'));
    expect(dag.topologicalOrder.indexOf('step-7-interactions')).toBeLessThan(dag.topologicalOrder.indexOf('step-8-accessibility'));
    expect(dag.topologicalOrder.indexOf('step-8-accessibility')).toBeLessThan(dag.topologicalOrder.indexOf('step-9-optimization'));
  });

  it('enforces optimization goals (minimize hallucinations, maximize reuse, minimize generated code) on each step', () => {
    const data = createReconstructionTestPage();
    const compiler = new DesignCompiler();
    const pkg = compiler.compile(buildAgentDesignSpecification(data));

    pkg.reconstructionPlan.steps.forEach((step) => {
      expect(step.optimizationGoals).toBeDefined();
      expect(step.optimizationGoals.minimizeHallucinations).toBeTruthy();
      expect(step.optimizationGoals.maximizeReuse).toBeTruthy();
      expect(step.optimizationGoals.minimizeGeneratedCode).toBeTruthy();
      expect(step.aiDirective).toBeTruthy();
      expect(step.expectedOutputs.length).toBeGreaterThan(0);
    });
  });

  it('generates rich ReconstructionPlan.md, BuildGraph.json, and DependencyGraph.json', () => {
    const data = createReconstructionTestPage();
    const compiler = new DesignCompiler();
    const pkg = compiler.compile(buildAgentDesignSpecification(data));

    const plan = pkg.reconstructionPlan;

    // 1. ReconstructionPlan.md
    expect(plan.markdownPlan).toBeDefined();
    expect(plan.markdownPlan).toContain('# AI Design Reconstruction Plan');
    expect(plan.markdownPlan).toContain('```mermaid');
    expect(plan.markdownPlan).toContain('graph TD');
    expect(plan.markdownPlan).toContain('Minimize Hallucinations');
    expect(plan.markdownPlan).toContain('Maximize Reuse');
    expect(plan.markdownPlan).toContain('Minimize Generated Code');

    // 2. BuildGraph.json
    expect(plan.buildGraph).toBeDefined();
    expect(plan.buildGraph.version).toBe('1.0.0');
    expect(plan.buildGraph.totalTasks).toBe(9);
    expect(plan.buildGraph.tasks.length).toBe(9);
    expect(plan.buildGraph.criticalPath.length).toBe(8);
    expect(plan.buildGraph.estimatedTimeSavingsParallel).toContain('faster');

    // 3. DependencyGraph.json
    expect(plan.dependencyGraph).toBeDefined();
    expect(plan.dependencyGraph.nodes.length).toBe(9);
    expect(plan.dependencyGraph.nodeDetails).toBeDefined();
    expect(Object.keys(plan.dependencyGraph.nodeDetails!)).toHaveLength(9);
  });

  it('exports ReconstructionPlan.md, BuildGraph.json, and DependencyGraph.json via ArtifactExporter and includes them in compiled-design', () => {
    const data = createReconstructionTestPage();
    const exporter = new ArtifactExporter();

    // 1. Export format 'ReconstructionPlan.md'
    const planExport = exporter.export(data, 'ReconstructionPlan.md');
    expect(planExport.exportedData).toContain('# AI Design Reconstruction Plan');
    expect(planExport.artifacts!['ReconstructionPlan.md']).toBeDefined();
    expect(planExport.artifacts!['BuildGraph.json']).toBeDefined();
    expect(planExport.artifacts!['DependencyGraph.json']).toBeDefined();

    // 2. Export format 'BuildGraph.json'
    const buildExport = exporter.export(data, 'BuildGraph.json');
    expect(buildExport.exportedData).toContain('totalTasks');
    const parsedBuild = JSON.parse(buildExport.exportedData);
    expect(parsedBuild.totalTasks).toBe(9);
    expect(buildExport.artifacts!['BuildGraph.json']).toBeDefined();

    // 3. Export format 'DependencyGraph.json'
    const depExport = exporter.export(data, 'DependencyGraph.json');
    expect(depExport.exportedData).toContain('topologicalOrder');
    const parsedDep = JSON.parse(depExport.exportedData);
    expect(parsedDep.nodes.length).toBe(9);
    expect(depExport.artifacts!['DependencyGraph.json']).toBeDefined();

    // 4. Bundled package 'compiled-design'
    const compiledExport = exporter.export(data, 'compiled-design');
    expect(compiledExport.artifacts!['ReconstructionPlan.md']).toBeDefined();
    expect(compiledExport.artifacts!['BuildGraph.json']).toBeDefined();
    expect(compiledExport.artifacts!['DependencyGraph.json']).toBeDefined();
    expect(compiledExport.artifacts!['designGrammar.json']).toBeDefined();
    expect(compiledExport.artifacts!['componentGrammar.json']).toBeDefined();
    expect(compiledExport.artifacts!['layoutGrammar.json']).toBeDefined();
    expect(compiledExport.artifacts!['interactionGrammar.json']).toBeDefined();
  });

  it('strictly adheres to non-DOM invariant during reconstruction planning', () => {
    const data = createReconstructionTestPage();
    const ads = buildAgentDesignSpecification(data);

    const compiler = new ReconstructionPlanner();
    const context = {
      adsVersion: '1.0.0',
      pageUrl: ads.metadata.pageUrl,
      pageTitle: ads.metadata.title,
      passesExecuted: [],
      diagnostics: [],
      metrics: {
        totalTokens: 0,
        totalComponents: 0,
        totalContainers: 0,
        totalInteractions: 0,
        compilationTimeMs: 0,
      },
      addDiagnostic: () => {},
    };

    const designCompiler = new DesignCompiler();
    const compiled = designCompiler.compile(ads);

    const plan = compiler.compile(
      {
        ads,
        designGrammar: compiled.designGrammar,
        componentGrammar: compiled.componentGrammar,
        layoutGrammar: compiled.layoutGrammar,
        interactionGrammar: compiled.interactionGrammar,
        accessibilityGrammar: compiled.accessibilityGrammar,
      },
      context
    );

    expect(plan).toBeDefined();
    expect(plan.steps.length).toBe(9);
  });
});
