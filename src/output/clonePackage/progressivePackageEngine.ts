import {
  AnalyzePageResponseData,
  ProgressivePackageLevel,
  PackageLevelId,
  PackageManifestSpecification,
  ProgressivePackageResult,
} from '../../types/index.ts';
import { packageCollectors } from './clonePackageBuilder.ts';
import { ZipPackager } from './zipPackager.ts';

export class ProgressivePackageEngine {
  /**
   * Builds an adaptive progressive clone package tailored to specific token budgets and fidelity levels.
   */
  public buildPackage(
    data: AnalyzePageResponseData,
    requestedLevel: ProgressivePackageLevel = 'full'
  ): ProgressivePackageResult {
    const { level, levelNumber } = this.normalizeLevel(requestedLevel);
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';

    // 1. Collect all foundational artifacts
    const ds = packageCollectors.collectDesignSystem(data);
    const typo = packageCollectors.collectTypography(data);
    const layout = packageCollectors.collectLayout(data);
    const comps = packageCollectors.collectComponents(data);
    const dkg = packageCollectors.collectDesignKnowledgeGraph(data);
    const compRegistry = packageCollectors.collectComponentRegistry(data);
    const tokRegistry = packageCollectors.collectTokenRegistry(data);
    const intentMap = packageCollectors.collectIntentMap(data);
    const intentDict = packageCollectors.collectIntentDictionary(data);
    const layoutRelGraph = packageCollectors.collectLayoutRelationshipGraph(data);
    const containerHierarchy = packageCollectors.collectContainerHierarchy(data);

    // Level 1: Fast Files
    const level1Files: Record<string, string> = {
      '03_design-system.json': ds.json,
      '09_styles/css-variables.css': ds.css,
      '09_styles/tailwind.config.js': ds.tailwind,
      'TokenRegistry.json': tokRegistry,
      'design-tokens.json': ds.tokens,
      '14_typography.json': typo,
      'typography.json': typo,
      '04_layout.json': layout,
      'layout.json': layout,
      'ContainerHierarchy.json': containerHierarchy,
      'LayoutRelationshipGraph.json': layoutRelGraph,
      '02_components.json': comps.canonical,
      'components.json': comps.canonical,
      'ComponentRegistry.json': compRegistry,
      'IntentMap.json': intentMap,
      'IntentDictionary.json': intentDict,
    };

    let files: Record<string, string> = {};
    let tokenBudget = '<200k';
    let packageName = 'AI Clone Package (Level 1 - Fast)';
    let includedCapabilities: string[] = [
      'Design Tokens (Colors, Spacing, Radii, Shadows)',
      'Typography System & Font Scales',
      'Layout Containers & Container Hierarchy',
      'Canonical Component Registry & Design Intents',
    ];
    let excludedCapabilities: string[] = [
      'Interactive Behavior & State Graphs',
      'Responsive Transition Breakdown',
      'Accessibility Audit',
      'Asset Manifests',
      'Motion Timelines',
      'DOM Render Trees',
      'Visual Evidence & Screenshot Proofs',
    ];
    let excludedFiles: string[] = [
      '05_behavior.json',
      '13_responsive.json',
      '07_accessibility.json',
      '06_assets.json',
      '15_variants.json',
      '16_motion.json',
      '11_render_tree.json',
      '08_evidence.json',
      '18_reconstruction_graph.json',
    ];

    if (level === 'fast') {
      files = { ...level1Files };
      tokenBudget = '<200k';
      packageName = 'AI Clone Package (Level 1 - Fast)';
    } else if (level === 'standard') {
      const inter = packageCollectors.collectInteractions(data);
      const resp = packageCollectors.collectResponsive(data);
      const a11y = packageCollectors.collectAccessibility(data);
      const assets = packageCollectors.collectAssets(data);
      const variants = packageCollectors.collectVariants(data);
      const varGraph = packageCollectors.collectVariantGraph(data);
      const sectionFlow = packageCollectors.collectSectionFlow(data);
      const compDepGraph = packageCollectors.collectComponentDependencyGraph(data);

      files = {
        ...level1Files,
        '05_behavior.json': inter.behavior,
        'interactions.json': inter.legacy,
        '13_responsive.json': resp.transitions,
        'responsive.json': resp.legacy,
        '07_accessibility.json': a11y,
        'accessibility.json': a11y,
        '06_assets.json': assets,
        'assets.json': assets,
        '15_variants.json': variants,
        'VariantGraph.json': varGraph,
        'SectionFlow.json': sectionFlow,
        'ComponentDependencyGraph.json': compDepGraph,
      };

      tokenBudget = '<600k';
      packageName = 'AI Clone Package (Level 2 - Standard)';
      includedCapabilities = [
        ...includedCapabilities,
        'Interactive Triggers & Behavior State Machines',
        'Responsive Breakpoints & Layout Transitions',
        'Accessibility (ARIA, Contrast, Focus Management)',
        'Asset Manifests & Icons',
        'Component Variants & Variant Graph',
        'Section Flow Sequencing',
        'Component Dependency DAG',
      ];
      excludedCapabilities = [
        'Keyframe-by-keyframe Motion Timelines',
        'Full DOM Render Tree',
        'Deep Visual Evidence Dumps',
        'Global Reconstruction Graph',
      ];
      excludedFiles = [
        '16_motion.json',
        '11_render_tree.json',
        '08_evidence.json',
        '18_reconstruction_graph.json',
        '01_reconstruction.json',
      ];
    } else {
      // Level 3: Full Clone (Everything)
      const inter = packageCollectors.collectInteractions(data);
      const resp = packageCollectors.collectResponsive(data);
      const a11y = packageCollectors.collectAccessibility(data);
      const assets = packageCollectors.collectAssets(data);
      const variants = packageCollectors.collectVariants(data);
      const varGraph = packageCollectors.collectVariantGraph(data);
      const sectionFlow = packageCollectors.collectSectionFlow(data);
      const compDepGraph = packageCollectors.collectComponentDependencyGraph(data);
      const renderTree = packageCollectors.collectRenderTree(data);
      const constraints = packageCollectors.collectConstraints(data);
      const content = packageCollectors.collectContent(data);
      const motion = packageCollectors.collectMotion(data);
      const graph = packageCollectors.collectReconstructionGraph(data);
      const evidence = packageCollectors.collectEvidence(data);
      const sharedRegistry = packageCollectors.collectSharedRegistry(data);
      const kgAudit = packageCollectors.collectKnowledgeGraphAudit(data);
      const buildDepGraph = packageCollectors.collectBuildDependencyGraph(data);
      const reconPlan = packageCollectors.collectReconstructionPlan(data);
      const optReport = packageCollectors.collectOptimizationReport(data);
      const knowCompress = packageCollectors.collectKnowledgeCompression(data);
      const confMap = packageCollectors.collectConfidenceMap(data);
      const packMetrics = packageCollectors.collectPackageMetrics(data);
      const recon = packageCollectors.collectReconstructionMaster(data);

      files = {
        ...level1Files,
        '01_reconstruction.json': recon,
        '05_behavior.json': inter.behavior,
        'interactions.json': inter.legacy,
        '06_assets.json': assets,
        'assets.json': assets,
        '07_accessibility.json': a11y,
        'accessibility.json': a11y,
        '08_evidence.json': evidence,
        'evidence.json': evidence,
        '11_render_tree.json': renderTree,
        'render-tree.json': renderTree,
        '12_constraints.json': constraints,
        'constraints.json': constraints,
        '13_responsive.json': resp.transitions,
        'responsive.json': resp.legacy,
        '15_variants.json': variants,
        'VariantGraph.json': varGraph,
        '16_motion.json': motion,
        'motion.json': motion,
        '17_content.json': content,
        'content.json': content,
        '18_reconstruction_graph.json': graph,
        'reconstruction-graph.json': graph,
        'DesignKnowledgeGraph.json': dkg,
        'KnowledgeGraphAuditReport.md': kgAudit,
        'SectionFlow.json': sectionFlow,
        'BuildDependencyGraph.json': buildDepGraph,
        'ComponentDependencyGraph.json': compDepGraph,
        'ReconstructionPlan.md': reconPlan,
        'OptimizationReport.md': optReport,
        'KnowledgeCompression.json': knowCompress,
        'ConfidenceMap.json': confMap,
        'PackageMetrics.json': packMetrics,
        'SharedRegistry.json': sharedRegistry,
      };

      tokenBudget = 'unlimited';
      packageName = 'AI Clone Package (Level 3 - Full Clone)';
      includedCapabilities = [
        ...includedCapabilities,
        'Interactive Triggers & Behavior State Machines',
        'Responsive Breakpoints & Layout Transitions',
        'Accessibility (ARIA, Contrast, Focus Management)',
        'Asset Manifests & Icons',
        'Component Variants & Variant Graph',
        'Section Flow Sequencing',
        'Component Dependency DAG',
        'Keyframe Motion Timelines & Animation Sequences',
        'Full DOM Render Tree & Spatial Constraints',
        'Semantic Content Understanding',
        'Visual Proof Evidence & Computed Bounding Geometries',
        'Master Reconstruction Graph & 10-Phase Build Plan',
      ];
      excludedCapabilities = [];
      excludedFiles = [];
    }

    // 2. Generate custom tailored README and Manifest
    const readme = this.generateTailoredReadme(title, url, level, levelNumber, packageName, tokenBudget, includedCapabilities);
    files['10_README_FOR_AI.md'] = readme;
    files['README.md'] = readme;

    // Estimate tokens (~4 characters per token)
    let totalChars = 0;
    for (const content of Object.values(files)) {
      totalChars += content.length;
    }
    const estimatedTokenCount = Math.ceil(totalChars / 4);

    const isWithinBudget =
      level === 'fast'
        ? estimatedTokenCount <= 200000
        : level === 'standard'
        ? estimatedTokenCount <= 600000
        : true;

    const manifest: PackageManifestSpecification = {
      $schema: 'https://ui-ux-helper.internal/schemas/package-manifest-v2.json',
      version: '2.0.0',
      packageLevel: level,
      levelNumber,
      packageName,
      tokenBudget,
      estimatedTokenCount,
      isWithinBudget,
      target: { title, url },
      includedCapabilities,
      includedFiles: Object.keys(files),
      excludedCapabilities,
      excludedFiles,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    };

    files['package-manifest.json'] = JSON.stringify(manifest, null, 2);

    // 3. Package into ZIP
    const packager = new ZipPackager();
    packager.addFiles(files);
    const base64 = packager.toBase64();

    return {
      level,
      levelNumber,
      packageName,
      tokenBudget,
      estimatedTokens: estimatedTokenCount,
      isWithinBudget,
      manifest,
      readme,
      files,
      base64,
    };
  }

  private normalizeLevel(
    requested: ProgressivePackageLevel
  ): { level: PackageLevelId; levelNumber: 1 | 2 | 3 } {
    if (requested === 1 || requested === 'fast') return { level: 'fast', levelNumber: 1 };
    if (requested === 2 || requested === 'standard') return { level: 'standard', levelNumber: 2 };
    return { level: 'full', levelNumber: 3 };
  }

  private generateTailoredReadme(
    title: string,
    url: string,
    level: PackageLevelId,
    levelNumber: 1 | 2 | 3,
    packageName: string,
    tokenBudget: string,
    capabilities: string[]
  ): string {
    return `# ${packageName}
> Target Application: **${title}** (\`${url}\`)  
> Fidelity Tier: **Level ${levelNumber} (${level.toUpperCase()})** | Token Budget: **${tokenBudget}**

---

## Package Scope & Objective
This package is an **independently usable, self-contained AI Clone Package** optimized for **${
      level === 'fast'
        ? 'rapid design system extraction and atomic component scaffolding under 200k tokens'
        : level === 'standard'
        ? 'production-ready responsive UI implementation with micro-interactions and accessibility under 600k tokens'
        : 'pixel-perfect, high-fidelity reverse engineering with complete motion timelines, render trees, and evidence graphs'
    }**.

### Included Capabilities
${capabilities.map((c) => `- [x] ${c}`).join('\n')}

---

## Instructions for AI Coding Agent
1. **Initialize Styles**: Load \`09_styles/css-variables.css\` and \`09_styles/tailwind.config.js\`.
2. **Review Components**: Consult \`02_components.json\` and \`IntentMap.json\` to understand design intent before writing UI code.
3. **Assemble Layout**: Follow \`ContainerHierarchy.json\` and \`LayoutRelationshipGraph.json\` for nesting structure.
${
  level !== 'fast'
    ? '4. **Apply Responsive Rules & Behavior**: Refer to `13_responsive.json` and `05_behavior.json`.\n5. **Verify Accessibility**: Audit against `07_accessibility.json`.'
    : ''
}
${
  level === 'full'
    ? '6. **Execute Master Plan**: Follow `ReconstructionPlan.md` and verify against `18_reconstruction_graph.json`.'
    : ''
}
`;
  }
}

export function buildProgressivePackage(
  data: AnalyzePageResponseData,
  level: ProgressivePackageLevel = 'full'
): ProgressivePackageResult {
  const engine = new ProgressivePackageEngine();
  return engine.buildPackage(data, level);
}
