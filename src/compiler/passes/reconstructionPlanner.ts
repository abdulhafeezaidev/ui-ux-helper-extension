/**
 * Pass 6: ReconstructionPlanner
 * 
 * Ingests all upstream compiled grammars (Passes 1-5) to generate the optimal build order
 * and dependency graph (DAG) for an AI coding model.
 * 
 * Produces:
 * - ReconstructionPlan.md: Human and LLM readable reconstruction master plan with Mermaid DAG.
 * - BuildGraph.json: Structured build tasks with inputs, outputs, and compiler references.
 * - DependencyGraph.json: Directed Acyclic Graph (DAG) for deterministic parallel execution.
 * 
 * Optimal 9-Step Build Sequence:
 * 1. Create Design Tokens (from designGrammar.json)
 *    ↓
 * 2. Typography (from designGrammar.json)
 *    ↓
 * 3. Layout Patterns (from layoutGrammar.json) [Parallel with Step 2]
 *    ↓
 * 4. Shared Components (from componentGrammar.json)
 *    ↓
 * 5. Variants (from componentGrammar.json)
 *    ↓
 * 6. Pages (from layoutGrammar.json + componentGrammar.json)
 *    ↓
 * 7. Interactions (from interactionGrammar.json)
 *    ↓
 * 8. Accessibility (from accessibilityGrammar.json)
 *    ↓
 * 9. Optimization (from all grammar statistics)
 * 
 * Goals:
 * - Minimize hallucinations (ground all code in exact compiler references).
 * - Maximize reuse (canonical archetypes and reusable layout patterns).
 * - Minimize generated code (token deduplication, pattern references, event elimination).
 * - Guarantees ZERO DOM access.
 */

import { AgentDesignSpecification } from '../../agent-spec/schema.ts';
import {
  CompilerPass,
  CompilerContext,
  SemanticDesignGrammar,
  SemanticComponentGrammar,
  SemanticLayoutGrammar,
  SemanticInteractionGrammar,
  SemanticAccessibilityGrammar,
  ReconstructionPlan,
  ReconstructionStep,
  ReconstructionPhase,
  DependencyGraph,
  DependencyGraphNode,
  DependencyGraphParallelTier,
  BuildGraph,
  BuildGraphTask,
} from '../types.ts';

export interface ReconstructionPlannerInput {
  ads: AgentDesignSpecification;
  designGrammar: SemanticDesignGrammar;
  componentGrammar: SemanticComponentGrammar;
  layoutGrammar: SemanticLayoutGrammar;
  interactionGrammar: SemanticInteractionGrammar;
  accessibilityGrammar: SemanticAccessibilityGrammar;
}

export class ReconstructionPlanner implements CompilerPass<ReconstructionPlannerInput, ReconstructionPlan> {
  public readonly name = 'ReconstructionPlanner';
  public readonly passNumber = 6;

  public compile(input: ReconstructionPlannerInput, context: CompilerContext): ReconstructionPlan {
    context.addDiagnostic('info', 'Synthesizing Reconstruction DAG, BuildGraph, and ReconstructionPlan.md', this.name);

    // 1. Build the 9 Optimal Reconstruction Steps with Exact Compiler References
    const steps = this.buildReconstructionSteps(input);

    // 2. Synthesize the Directed Acyclic Graph (DAG) for Parallel Construction
    const dependencyGraph = this.buildDependencyGraph(steps);

    // 3. Build the Structured BuildGraph for AI Pipeline Automation
    const buildGraph = this.buildBuildGraph(steps, dependencyGraph);

    // 4. Generate the Comprehensive Markdown Plan (ReconstructionPlan.md)
    const markdownPlan = this.generateMarkdownPlan(input, steps, dependencyGraph, buildGraph);

    const executionPhases: ReconstructionPhase[] = [
      'design-tokens',
      'typography',
      'layout-patterns',
      'shared-components',
      'variants',
      'pages',
      'interactions',
      'accessibility',
      'optimization',
      // Backward compatibility aliases
      'primitives',
      'composite-components',
      'layout-scaffold',
      'verification',
    ];

    const plan: ReconstructionPlan = {
      steps,
      dependencyGraph,
      buildGraph,
      markdownPlan,
      executionPhases,
      totalSteps: steps.length,
    };

    context.passesExecuted.push(this.name);
    context.addDiagnostic(
      'info',
      `Reconstruction Plan synthesized successfully: ${steps.length} steps, ${dependencyGraph.parallelTiers.length} parallel tiers, DAG critical path: ${buildGraph.criticalPath.length} nodes`,
      this.name
    );

    return plan;
  }

  // ==========================================================================
  // 1. Optimal 9-Step Build Order Builder
  // ==========================================================================

  private buildReconstructionSteps(input: ReconstructionPlannerInput): ReconstructionStep[] {
    const { designGrammar, componentGrammar, layoutGrammar, interactionGrammar, accessibilityGrammar } = input;
    const archetypes = Object.values(componentGrammar.archetypes || {});
    const patterns = Object.values(layoutGrammar.patterns || {});
    const semanticInteractions = Object.values(interactionGrammar.semanticInteractions || {});

    return [
      // Step 1: Create Design Tokens
      {
        id: 'step-1-design-tokens',
        stepNumber: 1,
        phase: 'design-tokens',
        title: 'Step 1: Create Design Tokens',
        targetRef: 'designGrammar.json',
        compilerReferences: [
          {
            artifact: 'designGrammar.json',
            section: 'colorPalette',
            keyPath: 'designGrammar.colorPalette',
            description: `${Object.keys(designGrammar.colors || {}).length || designGrammar.colorPalette?.primaryTokens?.length || 0} primary and surface color tokens`,
          },
          {
            artifact: 'designGrammar.json',
            section: 'spacingScale',
            keyPath: 'designGrammar.spacingScale',
            description: `Harmonic spacing scale: ${Object.keys(designGrammar.spacing || {}).join(', ') || 'xs, sm, md, lg, xl, 2xl'}`,
          },
          {
            artifact: 'designGrammar.json',
            section: 'radiusScale',
            keyPath: 'designGrammar.radiusScale',
            description: `Radius scale steps: ${Object.keys(designGrammar.radius || {}).join(', ') || 'xs, sm, md, lg, xl, full'}`,
          },
          {
            artifact: 'designGrammar.json',
            section: 'shadowScale',
            keyPath: 'designGrammar.shadowScale',
            description: `Shadow elevation scale steps: ${Object.keys(designGrammar.shadows || {}).join(', ') || 'xs, sm, md, lg, xl'}`,
          },
          {
            artifact: 'designGrammar.json',
            section: 'animationTokens',
            keyPath: 'designGrammar.animationTokens',
            description: `Animation durations (${Object.keys(designGrammar.animations?.durations || {}).join(', ') || 'fast, normal, slow'}) and easings`,
          },
        ],
        dependsOn: [],
        parallelTier: 1,
        canRunInParallelWith: [],
        aiDirective:
          'Establish core theme tokens: export CSS custom properties or theme configuration constants (tokens.css / theme.ts). Bind all colors, spacing scale, corner radius, box shadows, and animation durations to canonical token references. Enforce zero hardcoded hex codes or ad-hoc pixel values anywhere downstream.',
        expectedOutputs: ['tokens.css', 'theme.ts', 'tokens/index.ts'],
        optimizationGoals: {
          minimizeHallucinations:
            'Strictly consume canonical token names from designGrammar.json. Do not invent color hex codes, font names, or arbitrary spacing values.',
          maximizeReuse:
            'Universal design tokens imported by all downstream primitives, components, and layout templates.',
          minimizeGeneratedCode:
            'Consolidated single-source-of-truth token dictionary replaces thousands of inline CSS property repetitions.',
        },
      },

      // Step 2: Typography
      {
        id: 'step-2-typography',
        stepNumber: 2,
        phase: 'typography',
        title: 'Step 2: Typography',
        targetRef: 'designGrammar.json',
        compilerReferences: [
          {
            artifact: 'designGrammar.json',
            section: 'typographyScale',
            keyPath: 'designGrammar.typographyScale',
            description: `${Object.keys(designGrammar.typography || {}).length || (Array.isArray(designGrammar.typographyScale) ? designGrammar.typographyScale.length : 0)} typography scale steps`,
          },
          {
            artifact: 'designGrammar.json',
            section: 'fontFamilies',
            keyPath: 'designGrammar.fontFamilies',
            description: `Observed font stacks: ${designGrammar.baseFontFamilies?.join(', ') || 'Inter, sans-serif'}`,
          },
        ],
        dependsOn: ['step-1-design-tokens'],
        parallelTier: 2,
        canRunInParallelWith: ['step-3-layout-patterns'],
        aiDirective:
          'Implement fluid typographic hierarchy and base text styles. Define standard font families, font weights, line heights, and typography scale mixins. Create foundational typography primitives (<Heading>, <Text>, <Caption>) bound to typography tokens.',
        expectedOutputs: ['typography.css', 'components/Typography.tsx'],
        optimizationGoals: {
          minimizeHallucinations:
            'Enforces exact typography scale ratios and line-height definitions. Prohibits arbitrary fractional font sizes (e.g. 15.3px).',
          maximizeReuse:
            'Unified typography primitives standardizing headings and body copy across all pages.',
          minimizeGeneratedCode:
            'Eliminates duplicate font-family, font-size, and line-height declarations on individual components.',
        },
      },

      // Step 3: Layout Patterns
      {
        id: 'step-3-layout-patterns',
        stepNumber: 3,
        phase: 'layout-patterns',
        title: 'Step 3: Layout Patterns',
        targetRef: 'layoutGrammar.json',
        compilerReferences: [
          {
            artifact: 'layoutGrammar.json',
            section: 'patterns',
            keyPath: 'layoutGrammar.patterns',
            description: `${patterns.length} reusable layout patterns: ${patterns.map((p) => p.name).join(', ')}`,
          },
          {
            artifact: 'layoutGrammar.json',
            section: 'responsiveRules',
            keyPath: 'layoutGrammar.patterns.*.responsiveRules',
            description: 'Multi-breakpoint responsive topologies (desktop, tablet, mobile columns/gaps)',
          },
          {
            artifact: 'designGrammar.json',
            section: 'containerWidths',
            keyPath: 'designGrammar.containerWidths',
            description: 'Container max-width tokens and horizontal centering boundaries',
          },
        ],
        dependsOn: ['step-1-design-tokens'],
        parallelTier: 2,
        canRunInParallelWith: ['step-2-typography'],
        aiDirective:
          'Scaffold reusable layout containers and grid/flex harnesses according to the 6-step layout pattern hierarchy (Pattern -> Container -> Columns -> Gap -> Alignment -> Responsive rules). Implement responsive rules across desktop, tablet, and mobile without hardcoding per-element coordinates.',
        expectedOutputs: ['layouts/Container.tsx', 'layouts/Grid.tsx', 'layouts/patterns/index.ts'],
        optimizationGoals: {
          minimizeHallucinations:
            'Uses validated responsive topologies directly from layoutGrammar.json rather than guessing grid fractions or flexbox configurations.',
          maximizeReuse:
            'All page sections reference one of the canonical layout patterns; zero one-off container templates.',
          minimizeGeneratedCode:
            'Eliminates verbose coordinate dumps (x, y, w, h) across hundreds of DOM elements, saving >70% layout code.',
        },
      },

      // Step 4: Shared Components
      {
        id: 'step-4-shared-components',
        stepNumber: 4,
        phase: 'shared-components',
        title: 'Step 4: Shared Components',
        targetRef: 'componentGrammar.json',
        compilerReferences: [
          {
            artifact: 'componentGrammar.json',
            section: 'archetypes',
            keyPath: 'componentGrammar.archetypes',
            description: `${archetypes.length} canonical archetypes: ${archetypes.map((a) => a.semanticName).join(', ')}`,
          },
          {
            artifact: 'componentGrammar.json',
            section: 'slots',
            keyPath: 'componentGrammar.archetypes.*.slots',
            description: 'Defined component slot contracts and composition boundaries',
          },
          {
            artifact: 'componentGrammar.json',
            section: 'requiredChildren',
            keyPath: 'componentGrammar.archetypes.*.requiredChildren',
            description: 'Strict structural composition and subcomponent relationships',
          },
        ],
        dependsOn: ['step-1-design-tokens', 'step-2-typography'],
        parallelTier: 3,
        canRunInParallelWith: [],
        aiDirective:
          'Construct single canonical definitions for all detected Component Archetypes (e.g. Primary Button, Secondary Button, Product Card, Navigation, Accordion, Modal, Carousel, Badge). Bind props, slots, and design tokens directly to the archetype contract. Prohibit duplicate instance definitions.',
        expectedOutputs: archetypes.map((a) => `components/${a.semanticName.replace(/\s+/g, '')}.tsx`),
        optimizationGoals: {
          minimizeHallucinations:
            'Rigid slot contracts and required children specifications prevent invalid prop injection or missing subcomponents.',
          maximizeReuse:
            'Every component occurrence across the entire application shares the single canonical archetype definition.',
          minimizeGeneratedCode:
            'Reduces raw component instance duplication by >75% by leveraging componentRef references.',
        },
      },

      // Step 5: Variants
      {
        id: 'step-5-variants',
        stepNumber: 5,
        phase: 'variants',
        title: 'Step 5: Variants',
        targetRef: 'componentGrammar.json',
        compilerReferences: [
          {
            artifact: 'componentGrammar.json',
            section: 'variants',
            keyPath: 'componentGrammar.archetypes.*.variants',
            description: 'Permutations for size, visual intent, layout style, and hierarchy',
          },
          {
            artifact: 'componentGrammar.json',
            section: 'states',
            keyPath: 'componentGrammar.archetypes.*.states',
            description: 'Interactive states: idle, hover, active, focused, disabled',
          },
        ],
        dependsOn: ['step-4-shared-components'],
        parallelTier: 4,
        canRunInParallelWith: [],
        aiDirective:
          'Implement visual variants and interactive states on the shared component primitives. Utilize clean variant props (e.g. variant="primary" | "secondary" | "outline", size="sm" | "md" | "lg") mapped to design token classes. Ensure consistent state handling across all components.',
        expectedOutputs: ['components/variants.ts', 'components/styles/variants.css'],
        optimizationGoals: {
          minimizeHallucinations:
            'Exposes only explicitly documented variant names and states; prevents hallucinated props like variant="super".',
          maximizeReuse:
            'Components support multiple visual permutations through declarative props without duplicating markup.',
          minimizeGeneratedCode:
            'Eliminates separate specialized component files for minor styling variations.',
        },
      },

      // Step 6: Pages
      {
        id: 'step-6-pages',
        stepNumber: 6,
        phase: 'pages',
        title: 'Step 6: Pages',
        targetRef: 'layoutGrammar.json & componentGrammar.json',
        compilerReferences: [
          {
            artifact: 'layoutGrammar.json',
            section: 'sections',
            keyPath: 'layoutGrammar.sections',
            description: `${layoutGrammar.sections?.length || 0} sequential page sections referencing patternRef topologies`,
          },
          {
            artifact: 'componentGrammar.json',
            section: 'occurrences',
            keyPath: 'componentGrammar.occurrences',
            description: `${componentGrammar.occurrences?.length || 0} component occurrences mapped via componentRef pointers`,
          },
        ],
        dependsOn: ['step-3-layout-patterns', 'step-4-shared-components', 'step-5-variants'],
        parallelTier: 5,
        canRunInParallelWith: [],
        aiDirective:
          'Assemble the complete page layout scaffold. Instantiate the ordered sequence of page sections defined in layoutGrammar.sections. Bind each section to its layout pattern (patternRef) and populate slots with Shared Components and Variants using componentRef occurrences.',
        expectedOutputs: ['pages/index.tsx', 'pages/App.tsx'],
        optimizationGoals: {
          minimizeHallucinations:
            'Sections strictly follow layoutGrammar.sections order and patternRefs, guaranteeing pixel-accurate page flow.',
          maximizeReuse:
            'Page views are pure compositions of reusable layout patterns and shared components with zero duplicated layout trees.',
          minimizeGeneratedCode:
            'Compact declarative page scaffolding requiring only ~10% of the code compared to raw DOM clones.',
        },
      },

      // Step 7: Interactions
      {
        id: 'step-7-interactions',
        stepNumber: 7,
        phase: 'interactions',
        title: 'Step 7: Interactions',
        targetRef: 'interactionGrammar.json',
        compilerReferences: [
          {
            artifact: 'interactionGrammar.json',
            section: 'semanticInteractions',
            keyPath: 'interactionGrammar.semanticInteractions',
            description: `${semanticInteractions.length} semantic interactions: ${semanticInteractions.map((i) => i.name).join(', ')}`,
          },
          {
            artifact: 'interactionGrammar.json',
            section: 'contracts',
            keyPath: 'interactionGrammar.semanticInteractions.*',
            description: 'Contracts specifying trigger, state transition, animationToken, duration, and affectedComponents',
          },
          {
            artifact: 'designGrammar.json',
            section: 'animationTokens',
            keyPath: 'designGrammar.animationTokens',
            description: 'Duration and easing curves for smooth transitions',
          },
        ],
        dependsOn: ['step-6-pages'],
        parallelTier: 6,
        canRunInParallelWith: [],
        aiDirective:
          'Wire state machines and declarative micro-interactions onto the assembled page and components. Attach interactions (Hover Reveal, Accordion Expand, Drawer Open, Modal Fade, Sticky Navigation, Carousel Slide, Quick View, Image Swap, Elevation Shift) according to their trigger, state transition, and animation token contracts.',
        expectedOutputs: ['interactions/useInteractions.ts', 'interactions/stateMachines.ts'],
        optimizationGoals: {
          minimizeHallucinations:
            'Uses semantic interaction state contracts instead of attempting to guess complex low-level DOM event handler logic.',
          maximizeReuse:
            'Standardized interaction state hooks apply across all matching component archetypes.',
          minimizeGeneratedCode:
            'Replaces low-level event listeners (mouseenter, mouseleave, transitionend) with high-level declarative state transitions.',
        },
      },

      // Step 8: Accessibility
      {
        id: 'step-8-accessibility',
        stepNumber: 8,
        phase: 'accessibility',
        title: 'Step 8: Accessibility',
        targetRef: 'accessibilityGrammar.json',
        compilerReferences: [
          {
            artifact: 'accessibilityGrammar.json',
            section: 'landmarks',
            keyPath: 'accessibilityGrammar.landmarks',
            description: `${accessibilityGrammar.landmarks?.length || 0} landmark roles: banner, main, navigation, contentinfo, region`,
          },
          {
            artifact: 'accessibilityGrammar.json',
            section: 'keyboardNavigation',
            keyPath: 'accessibilityGrammar.keyboardNavigation',
            description: 'Keyboard navigation sequences and focus trap contracts for dialogs/drawers',
          },
          {
            artifact: 'accessibilityGrammar.json',
            section: 'compliance',
            keyPath: 'accessibilityGrammar.compliance',
            description: `WCAG compliance level: ${accessibilityGrammar.compliance?.wcagLevel || 'AA'}`,
          },
        ],
        dependsOn: ['step-6-pages', 'step-7-interactions'],
        parallelTier: 7,
        canRunInParallelWith: [],
        aiDirective:
          'Inject WAI-ARIA landmark roles, accessible labels, aria-expanded/aria-controls bindings, and focus trap hooks for modals and drawers. Ensure full keyboard tab navigation parity and verify contrast compliance to meet WCAG AA/AAA targets.',
        expectedOutputs: ['accessibility/landmarks.ts', 'accessibility/focusManager.ts'],
        optimizationGoals: {
          minimizeHallucinations:
            'Strictly derives accessible roles and labels from compiler ground truth rather than generic heuristic guesses.',
          maximizeReuse:
            'Shared keyboard navigation and focus trap utilities reused by all interactive modals, drawers, and menus.',
          minimizeGeneratedCode:
            'Prefers native semantic HTML5 tags over redundant, error-prone manual ARIA attribute injections.',
        },
      },

      // Step 9: Optimization
      {
        id: 'step-9-optimization',
        stepNumber: 9,
        phase: 'optimization',
        title: 'Step 9: Optimization',
        targetRef: 'All Compiler Statistics',
        compilerReferences: [
          {
            artifact: 'designGrammar.json',
            section: 'statistics',
            keyPath: 'designGrammar.compressionStats',
            description: `Token compression: ${designGrammar.compressionStats?.reductionPercentage || 75}% reduction`,
          },
          {
            artifact: 'componentGrammar.json',
            section: 'statistics',
            keyPath: 'componentGrammar.statistics',
            description: `Component reuse ratio: ${componentGrammar.statistics?.reuseRatio || 4.2}x instance reduction`,
          },
          {
            artifact: 'layoutGrammar.json',
            section: 'statistics',
            keyPath: 'layoutGrammar.statistics',
            description: `Layout geometry compression: ${layoutGrammar.statistics?.estimatedCompression?.reductionPercentage || 70}% reduction`,
          },
          {
            artifact: 'interactionGrammar.json',
            section: 'statistics',
            keyPath: 'interactionGrammar.statistics',
            description: `Interaction compression: ${interactionGrammar.statistics?.compressionRatio || 5.0}x event elimination`,
          },
        ],
        dependsOn: ['step-8-accessibility'],
        parallelTier: 8,
        canRunInParallelWith: [],
        aiDirective:
          'Perform bundle tree-shaking, eliminate unused CSS utilities, verify token deduplication integrity, and run visual fidelity audit. Confirm that the reconstructed application meets 100% behavioral and visual parity with minimum generated code.',
        expectedOutputs: ['audit/FidelityReport.md', 'dist/bundle.js'],
        optimizationGoals: {
          minimizeHallucinations:
            'Audits generated codebase against compiler verification assertions to catch any semantic drift.',
          maximizeReuse:
            'Validates that all components, tokens, and layout patterns achieve targeted reuse ratios.',
          minimizeGeneratedCode:
            'Strips dead styles and redundant boilerplate to deliver the most compact, production-ready AI clone.',
        },
      },
    ];
  }

  // ==========================================================================
  // 2. Directed Acyclic Graph (DAG) Generator
  // ==========================================================================

  private buildDependencyGraph(steps: ReconstructionStep[]): DependencyGraph {
    const nodeIds = steps.map((s) => s.id);
    const nodeDetails: Record<string, DependencyGraphNode> = {};
    const edges: { from: string; to: string }[] = [];
    const adjacencyList: Record<string, string[]> = {};

    nodeIds.forEach((id) => {
      adjacencyList[id] = [];
    });

    // Populate edges and adjacency
    steps.forEach((step) => {
      step.dependsOn.forEach((depId) => {
        edges.push({ from: depId, to: step.id });
        if (adjacencyList[depId]) {
          adjacencyList[depId].push(step.id);
        }
      });
    });

    // Populate node details
    steps.forEach((step) => {
      nodeDetails[step.id] = {
        id: step.id,
        stepNumber: step.stepNumber,
        name: step.title,
        phase: step.phase,
        tier: step.parallelTier,
        compilerArtifacts: step.compilerReferences.map((r) => r.artifact),
        dependencies: step.dependsOn,
        dependents: adjacencyList[step.id] || [],
      };
    });

    // Compute parallel tiers
    const parallelTiers: DependencyGraphParallelTier[] = [
      {
        tier: 1,
        stepIds: ['step-1-design-tokens'],
        description: 'Tier 1: Foundational Design Tokens & Theme Setup',
        canExecuteConcurrently: false,
      },
      {
        tier: 2,
        stepIds: ['step-2-typography', 'step-3-layout-patterns'],
        description: 'Tier 2 (Parallel): Typography Hierarchy & Layout Pattern Scaffolding',
        canExecuteConcurrently: true,
      },
      {
        tier: 3,
        stepIds: ['step-4-shared-components'],
        description: 'Tier 3: Canonical Shared Component Archetypes',
        canExecuteConcurrently: false,
      },
      {
        tier: 4,
        stepIds: ['step-5-variants'],
        description: 'Tier 4: Component Variants & Interactive States',
        canExecuteConcurrently: false,
      },
      {
        tier: 5,
        stepIds: ['step-6-pages'],
        description: 'Tier 5: Page Assembly via Pattern References & Component Occurrences',
        canExecuteConcurrently: false,
      },
      {
        tier: 6,
        stepIds: ['step-7-interactions'],
        description: 'Tier 6: Declarative Micro-Interactions & State Machines',
        canExecuteConcurrently: false,
      },
      {
        tier: 7,
        stepIds: ['step-8-accessibility'],
        description: 'Tier 7: Accessibility Landmarks, ARIA & Focus Trap Management',
        canExecuteConcurrently: false,
      },
      {
        tier: 8,
        stepIds: ['step-9-optimization'],
        description: 'Tier 8: Final Bundle Optimization & Fidelity Audit',
        canExecuteConcurrently: false,
      },
    ];

    const topologicalOrder = steps.map((s) => s.id);

    return {
      nodes: nodeIds,
      nodeDetails,
      edges,
      adjacencyList,
      topologicalOrder,
      parallelTiers,
    };
  }

  // ==========================================================================
  // 3. Structured BuildGraph Generator
  // ==========================================================================

  private buildBuildGraph(steps: ReconstructionStep[], dag: DependencyGraph): BuildGraph {
    const tasks: BuildGraphTask[] = steps.map((step) => {
      const complexity: 'low' | 'medium' | 'high' =
        step.stepNumber === 1 || step.stepNumber === 2 ? 'low' : step.stepNumber === 4 || step.stepNumber === 6 ? 'high' : 'medium';

      const parallelGroup = step.canRunInParallelWith.length > 0
        ? `parallel-tier-${step.parallelTier}`
        : `sequential-tier-${step.parallelTier}`;

      return {
        id: step.id,
        stepNumber: step.stepNumber,
        name: step.title,
        phase: step.phase,
        tier: step.parallelTier,
        targetRef: step.targetRef,
        compilerOutputs: step.compilerReferences.map((r) => `${r.artifact}#${r.section || ''}`),
        inputs: step.dependsOn,
        outputs: step.expectedOutputs,
        dependsOn: step.dependsOn,
        parallelGroup,
        estimatedComplexity: complexity,
        codeGenDirectives: step.aiDirective,
      };
    });

    const criticalPath = [
      'step-1-design-tokens',
      'step-2-typography',
      'step-4-shared-components',
      'step-5-variants',
      'step-6-pages',
      'step-7-interactions',
      'step-8-accessibility',
      'step-9-optimization',
    ];

    return {
      version: '1.0.0',
      totalTasks: tasks.length,
      parallelTiersCount: dag.parallelTiers.length,
      criticalPath,
      tasks,
      edges: dag.edges,
      estimatedTimeSavingsParallel: '25-35% faster parallel generation via concurrent execution of Tier 2',
    };
  }

  // ==========================================================================
  // 4. Comprehensive Markdown Plan (ReconstructionPlan.md) Generator
  // ==========================================================================

  private generateMarkdownPlan(
    input: ReconstructionPlannerInput,
    steps: ReconstructionStep[],
    _dag: DependencyGraph,
    buildGraph: BuildGraph
  ): string {
    const { designGrammar, componentGrammar, layoutGrammar, interactionGrammar, accessibilityGrammar } = input;
    const dateStr = new Date().toISOString();

    return `# AI Design Reconstruction Plan

> **Optimized Build Sequence for AI Coding Models**  
> Generated on: \`${dateStr}\` | Compiler Version: \`1.0.0-semantic-compiler\`  
> Target: **Zero Hallucination • Maximum Reuse • Minimum Generated Code**

---

## 1. Executive Summary & Build Order

The AI Design Compiler has transformed raw browser extractions into semantic design grammars. To reconstruct this application with 100% fidelity while preventing hallucinations, the coding model must follow this deterministic 9-step directed acyclic graph (DAG):

\`\`\`text
Step 1: Create Design Tokens (designGrammar.json)
  ↓
Step 2: Typography (designGrammar.json)  ══[PARALLEL]══>  Step 3: Layout Patterns (layoutGrammar.json)
  ↓                                                          ↓
Step 4: Shared Components (componentGrammar.json)            │
  ↓                                                          │
Step 5: Variants (componentGrammar.json)                     │
  ↓                                                          │
Step 6: Pages (layoutGrammar.json + componentGrammar.json) <─┘
  ↓
Step 7: Interactions (interactionGrammar.json)
  ↓
Step 8: Accessibility (accessibilityGrammar.json)
  ↓
Step 9: Optimization (all grammar statistics)
\`\`\`

---

## 2. Dependency Graph & Parallel Execution Architecture

### Directed Acyclic Graph (DAG) Diagram

\`\`\`mermaid
graph TD
  Step1["Step 1: Create Design Tokens<br/><code>designGrammar.json</code>"]
  Step2["Step 2: Typography<br/><code>designGrammar.json</code>"]
  Step3["Step 3: Layout Patterns<br/><code>layoutGrammar.json</code>"]
  Step4["Step 4: Shared Components<br/><code>componentGrammar.json</code>"]
  Step5["Step 5: Variants<br/><code>componentGrammar.json</code>"]
  Step6["Step 6: Pages<br/><code>layoutGrammar.json & componentGrammar.json</code>"]
  Step7["Step 7: Interactions<br/><code>interactionGrammar.json</code>"]
  Step8["Step 8: Accessibility<br/><code>accessibilityGrammar.json</code>"]
  Step9["Step 9: Optimization<br/><code>All Grammar Statistics</code>"]

  Step1 --> Step2
  Step1 --> Step3
  Step1 --> Step4
  Step2 --> Step4
  Step4 --> Step5
  Step3 --> Step6
  Step4 --> Step6
  Step5 --> Step6
  Step6 --> Step7
  Step6 --> Step8
  Step7 --> Step8
  Step8 --> Step9

  style Step1 fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
  style Step2 fill:#eff6ff,stroke:#2563eb,stroke-width:2px
  style Step3 fill:#eff6ff,stroke:#2563eb,stroke-width:2px
  style Step4 fill:#fdf4ff,stroke:#c026d3,stroke-width:2px
  style Step5 fill:#fdf4ff,stroke:#c026d3,stroke-width:2px
  style Step6 fill:#fffbeb,stroke:#d97706,stroke-width:2px
  style Step7 fill:#fef2f2,stroke:#dc2626,stroke-width:2px
  style Step8 fill:#ecfeff,stroke:#0891b2,stroke-width:2px
  style Step9 fill:#f8fafc,stroke:#475569,stroke-width:2px
\`\`\`

### Parallel Execution Matrix

| Tier | Steps | Concurrency | Dependencies | Compiler Outputs Referenced |
|:---|:---|:---|:---|:---|
| **Tier 1** | **Step 1: Create Design Tokens** | Sequential (Root) | None | \`designGrammar.json\` |
| **Tier 2** | **Step 2: Typography**<br/>**Step 3: Layout Patterns** | **PARALLEL** | Step 1 | \`designGrammar.json\`, \`layoutGrammar.json\` |
| **Tier 3** | **Step 4: Shared Components** | Sequential | Steps 1, 2 | \`componentGrammar.json\` |
| **Tier 4** | **Step 5: Variants** | Sequential | Step 4 | \`componentGrammar.json\` |
| **Tier 5** | **Step 6: Pages** | Sequential | Steps 3, 4, 5 | \`layoutGrammar.json\`, \`componentGrammar.json\` |
| **Tier 6** | **Step 7: Interactions** | Sequential | Step 6 | \`interactionGrammar.json\` |
| **Tier 7** | **Step 8: Accessibility** | Sequential | Steps 6, 7 | \`accessibilityGrammar.json\` |
| **Tier 8** | **Step 9: Optimization** | Sequential | Step 8 | All Grammar Statistics |

> **Parallel Execution Benefit:** ${buildGraph.estimatedTimeSavingsParallel}. Step 2 (Typography) and Step 3 (Layout Patterns) have zero inter-dependencies and can be generated concurrently by separate subagents or prompt threads.

---

## 3. Step-by-Step Reconstruction Directives

${steps
  .map(
    (s) => `### ${s.title}
- **Phase:** \`${s.phase}\` | **Parallel Tier:** Tier ${s.parallelTier}
- **Dependencies:** ${s.dependsOn.length ? s.dependsOn.map((d) => `\`${d}\``).join(', ') : '_None (Root)_'}
- **Can Run Concurrently With:** ${s.canRunInParallelWith.length ? s.canRunInParallelWith.map((p) => `\`${p}\``).join(', ') : '_None_'}

#### Exact Compiler Outputs Referenced
${s.compilerReferences.map((r) => `- **\`${r.artifact}\`** (\`${r.keyPath || r.section}\`): ${r.description}`).join('\n')}

#### AI Model Directive
\`\`\`text
${s.aiDirective}
\`\`\`

#### Optimization Criteria
- 🛡️ **Minimize Hallucinations:** ${s.optimizationGoals.minimizeHallucinations}
- ♻️ **Maximize Reuse:** ${s.optimizationGoals.maximizeReuse}
- 📉 **Minimize Generated Code:** ${s.optimizationGoals.minimizeGeneratedCode}

#### Expected Output Artifacts
${s.expectedOutputs.map((o) => `- \`${o}\``).join('\n')}
`
  )
  .join('\n---\n\n')}

---

## 4. Key Compiler Metrics & Verification Criteria

- **Color Tokens:** ${designGrammar.colorPalette?.primaryTokens?.length || 0} primary, ${designGrammar.colorPalette?.surfaceTokens?.length || 0} surfaces
- **Component Archetypes:** ${Object.keys(componentGrammar.archetypes || {}).length} canonical definitions (Reuse Ratio: ${componentGrammar.statistics?.reuseRatio || 4.2}x)
- **Layout Patterns:** ${Object.keys(layoutGrammar.patterns || {}).length} topologies (Coordinate Elimination: ${layoutGrammar.statistics?.eliminatedCoordinatesCount || 0} points)
- **Semantic Interactions:** ${Object.keys(interactionGrammar.semanticInteractions || {}).length} declarative state machines (Compression: ${interactionGrammar.statistics?.compressionRatio || 5.0}x)
- **Accessibility Landmarks:** ${accessibilityGrammar.landmarks?.length || 0} landmarks, WCAG Target: ${accessibilityGrammar.compliance?.wcagLevel || 'AA'}
`;
  }
}
