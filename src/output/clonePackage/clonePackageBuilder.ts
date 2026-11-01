import { AnalyzePageResponseData, AIClonePackageResult, AIClonePackageManifest } from '../../types/index.ts';
import { exportCssVariables } from '../cssExporter.ts';
import { exportTailwindConfig } from '../tailwindExporter.ts';
import { exportDesignTokens } from '../tokenExporter.ts';
import { exportReconstructionJson } from './reconstructionJsonExporter.ts';
import { exportComponentsJson } from './componentsJsonExporter.ts';
import { exportLayoutJson } from './layoutJsonExporter.ts';
import { exportBehaviorJson } from './behaviorJsonExporter.ts';
import { exportAssetsJson } from './assetsJsonExporter.ts';
import { exportEvidenceJson } from './evidenceJsonExporter.ts';
import { exportDesignSystemJson } from './designSystemJsonExporter.ts';
import { exportAccessibilityJson } from './accessibilityJsonExporter.ts';
import { exportComponentTreeJson } from './componentTreeJsonExporter.ts';
import { exportResponsiveJson } from './responsiveJsonExporter.ts';
import { exportInteractionsJson } from './interactionsJsonExporter.ts';
import { exportAnimationsJson } from './animationsJsonExporter.ts';
import { exportSharedRegistryJson } from './sharedRegistryJsonExporter.ts';
import { exportPromptMarkdown } from './promptMarkdownExporter.ts';
import { exportReadmeForAi } from './readmeForAiExporter.ts';
import { exportRenderTreeJson } from './renderTreeJsonExporter.ts';
import { exportConstraintsJson } from './constraintsJsonExporter.ts';
import { exportResponsiveTransitionsJson } from './responsiveTransitionJsonExporter.ts';
import { exportTypographyJson } from './typographyJsonExporter.ts';
import { exportVariantsJson } from './variantsJsonExporter.ts';
import { exportMotionJson } from './motionJsonExporter.ts';
import { exportContentJson } from './contentJsonExporter.ts';
import { exportReconstructionGraphJson } from './reconstructionGraphJsonExporter.ts';
import {
  exportDesignKnowledgeGraph,
  exportComponentRegistry,
  exportVariantGraph,
  exportTokenRegistry,
  exportKnowledgeGraphAuditReport,
} from '../knowledgeGraph/index.ts';
import {
  exportIntentMapJson,
  exportIntentDictionaryJson,
} from '../intent/index.ts';
import {
  exportLayoutRelationshipGraphJson,
  exportContainerHierarchyJson,
  exportSectionFlowJson,
} from '../layout/index.ts';
import {
  exportBuildDependencyGraphJson,
  exportComponentDependencyGraphJson,
  exportReconstructionPlanMarkdown,
} from '../planner/index.ts';
import {
  exportOptimizationReportMarkdown,
  exportKnowledgeCompressionJson,
  exportConfidenceMapJson,
  exportPackageMetricsJson,
} from '../optimizer/index.ts';
import { ZipPackager } from './zipPackager.ts';

/**
 * Modular Collector Pipeline for the AI Clone Package.
 * Every current and future reverse engineering module plugs directly into this pipeline.
 */
export const packageCollectors = {
  collectDesignSystem: (data: AnalyzePageResponseData) => ({
    json: exportDesignSystemJson(data),
    css: exportCssVariables(data),
    tailwind: exportTailwindConfig(data),
    tokens: exportDesignTokens(data),
  }),
  collectComponents: (data: AnalyzePageResponseData) => ({
    canonical: exportComponentsJson(data),
    tree: exportComponentTreeJson(data),
  }),
  collectVariants: (data: AnalyzePageResponseData) => exportVariantsJson(data),
  collectLayout: (data: AnalyzePageResponseData) => exportLayoutJson(data),
  collectResponsive: (data: AnalyzePageResponseData) => ({
    transitions: exportResponsiveTransitionsJson(data),
    legacy: exportResponsiveJson(data),
  }),
  collectInteractions: (data: AnalyzePageResponseData) => ({
    behavior: exportBehaviorJson(data),
    legacy: exportInteractionsJson(data),
  }),
  collectAnimations: (data: AnalyzePageResponseData) => exportAnimationsJson(data),
  collectMotion: (data: AnalyzePageResponseData) => exportMotionJson(data),
  collectTypography: (data: AnalyzePageResponseData) => exportTypographyJson(data),
  collectRenderTree: (data: AnalyzePageResponseData) => exportRenderTreeJson(data),
  collectConstraints: (data: AnalyzePageResponseData) => exportConstraintsJson(data),
  collectContent: (data: AnalyzePageResponseData) => exportContentJson(data),
  collectReconstructionGraph: (data: AnalyzePageResponseData) => exportReconstructionGraphJson(data),
  collectAccessibility: (data: AnalyzePageResponseData) => exportAccessibilityJson(data),
  collectAssets: (data: AnalyzePageResponseData) => exportAssetsJson(data),
  collectEvidence: (data: AnalyzePageResponseData) => exportEvidenceJson(data),
  collectSharedRegistry: (data: AnalyzePageResponseData) => exportSharedRegistryJson(data),
  collectDesignKnowledgeGraph: (data: AnalyzePageResponseData) => exportDesignKnowledgeGraph(data),
  collectComponentRegistry: (data: AnalyzePageResponseData) => exportComponentRegistry(data),
  collectVariantGraph: (data: AnalyzePageResponseData) => exportVariantGraph(data),
  collectTokenRegistry: (data: AnalyzePageResponseData) => exportTokenRegistry(data),
  collectKnowledgeGraphAudit: (data: AnalyzePageResponseData) => exportKnowledgeGraphAuditReport(data),
  collectIntentMap: (data: AnalyzePageResponseData) => exportIntentMapJson(data),
  collectIntentDictionary: (data: AnalyzePageResponseData) => exportIntentDictionaryJson(data),
  collectLayoutRelationshipGraph: (data: AnalyzePageResponseData) => exportLayoutRelationshipGraphJson(data),
  collectContainerHierarchy: (data: AnalyzePageResponseData) => exportContainerHierarchyJson(data),
  collectSectionFlow: (data: AnalyzePageResponseData) => exportSectionFlowJson(data),
  collectBuildDependencyGraph: (data: AnalyzePageResponseData) => exportBuildDependencyGraphJson(data),
  collectComponentDependencyGraph: (data: AnalyzePageResponseData) => exportComponentDependencyGraphJson(data),
  collectReconstructionPlan: (data: AnalyzePageResponseData) => exportReconstructionPlanMarkdown(data),
  collectOptimizationReport: (data: AnalyzePageResponseData) => exportOptimizationReportMarkdown(data),
  collectKnowledgeCompression: (data: AnalyzePageResponseData) => exportKnowledgeCompressionJson(data),
  collectConfidenceMap: (data: AnalyzePageResponseData) => exportConfidenceMapJson(data),
  collectPackageMetrics: (data: AnalyzePageResponseData) => exportPackageMetricsJson(data),
  collectPrompt: (data: AnalyzePageResponseData) => ({
    readme: exportReadmeForAi(data),
    promptMd: exportPromptMarkdown(data),
  }),
  collectReconstructionMaster: (data: AnalyzePageResponseData) => exportReconstructionJson(data),
};

/**
 * Builds the canonical AI Clone Package (.zip) containing all 18 numbered artifacts,
 * stylesheets, prompts, and reconstruction graphs.
 */
export function buildAIClonePackage(data: AnalyzePageResponseData): AIClonePackageResult {
  // Execute Collector Pipeline
  const ds = packageCollectors.collectDesignSystem(data);
  const comps = packageCollectors.collectComponents(data);
  const variants = packageCollectors.collectVariants(data);
  const layout = packageCollectors.collectLayout(data);
  const resp = packageCollectors.collectResponsive(data);
  const inter = packageCollectors.collectInteractions(data);
  const anims = packageCollectors.collectAnimations(data);
  const motion = packageCollectors.collectMotion(data);
  const typo = packageCollectors.collectTypography(data);
  const renderTree = packageCollectors.collectRenderTree(data);
  const constraints = packageCollectors.collectConstraints(data);
  const content = packageCollectors.collectContent(data);
  const graph = packageCollectors.collectReconstructionGraph(data);
  const a11y = packageCollectors.collectAccessibility(data);
  const assets = packageCollectors.collectAssets(data);
  const evidence = packageCollectors.collectEvidence(data);
  const registry = packageCollectors.collectSharedRegistry(data);
  const dkg = packageCollectors.collectDesignKnowledgeGraph(data);
  const compRegistry = packageCollectors.collectComponentRegistry(data);
  const varGraph = packageCollectors.collectVariantGraph(data);
  const tokRegistry = packageCollectors.collectTokenRegistry(data);
  const kgAudit = packageCollectors.collectKnowledgeGraphAudit(data);
  const intentMap = packageCollectors.collectIntentMap(data);
  const intentDict = packageCollectors.collectIntentDictionary(data);
  const layoutRelGraph = packageCollectors.collectLayoutRelationshipGraph(data);
  const containerHierarchy = packageCollectors.collectContainerHierarchy(data);
  const sectionFlow = packageCollectors.collectSectionFlow(data);
  const buildDepGraph = packageCollectors.collectBuildDependencyGraph(data);
  const compDepGraph = packageCollectors.collectComponentDependencyGraph(data);
  const reconPlan = packageCollectors.collectReconstructionPlan(data);
  const optReport = packageCollectors.collectOptimizationReport(data);
  const knowCompress = packageCollectors.collectKnowledgeCompression(data);
  const confMap = packageCollectors.collectConfidenceMap(data);
  const packMetrics = packageCollectors.collectPackageMetrics(data);
  const prompt = packageCollectors.collectPrompt(data);
  const recon = packageCollectors.collectReconstructionMaster(data);

  // 18 Consolidated Canonical Artifacts (19 files including 2 stylesheets)
  const canonicalPackageFiles: Record<string, string> = {
    '01_reconstruction.json': recon,
    '02_components.json': comps.canonical,
    '03_design-system.json': ds.json,
    '04_layout.json': layout,
    '05_behavior.json': inter.behavior,
    '06_assets.json': assets,
    '07_accessibility.json': a11y,
    '08_evidence.json': evidence,
    '09_styles/css-variables.css': ds.css,
    '09_styles/tailwind.config.js': ds.tailwind,
    '10_README_FOR_AI.md': prompt.readme,
    '11_render_tree.json': renderTree,
    '12_constraints.json': constraints,
    '13_responsive.json': resp.transitions,
    '14_typography.json': typo,
    '15_variants.json': variants,
    '16_motion.json': motion,
    '17_content.json': content,
    '18_reconstruction_graph.json': graph,
  };

  // Merge backward compatibility aliases and nested prompt path
  const files: Record<string, string> = {
    ...canonicalPackageFiles,
    'prompt/AI_Reconstruction.md': prompt.readme,
    'DesignKnowledgeGraph.json': dkg,
    'design-knowledge-graph.json': dkg,
    'ComponentRegistry.json': compRegistry,
    'component-registry.json': compRegistry,
    'VariantGraph.json': varGraph,
    'variant-graph.json': varGraph,
    'TokenRegistry.json': tokRegistry,
    'token-registry.json': tokRegistry,
    'KnowledgeGraphAuditReport.md': kgAudit,
    'IntentMap.json': intentMap,
    'intent-map.json': intentMap,
    'IntentDictionary.json': intentDict,
    'intent-dictionary.json': intentDict,
    'LayoutRelationshipGraph.json': layoutRelGraph,
    'layout-relationship-graph.json': layoutRelGraph,
    'ContainerHierarchy.json': containerHierarchy,
    'container-hierarchy.json': containerHierarchy,
    'SectionFlow.json': sectionFlow,
    'section-flow.json': sectionFlow,
    'ReconstructionPlan.md': reconPlan,
    'reconstruction-plan.md': reconPlan,
    'BuildDependencyGraph.json': buildDepGraph,
    'build-dependency-graph.json': buildDepGraph,
    'ComponentDependencyGraph.json': compDepGraph,
    'component-dependency-graph.json': compDepGraph,
    'OptimizationReport.md': optReport,
    'optimization-report.md': optReport,
    'KnowledgeCompression.json': knowCompress,
    'knowledge-compression.json': knowCompress,
    'ConfidenceMap.json': confMap,
    'confidence-map.json': confMap,
    'PackageMetrics.json': packMetrics,
    'package-metrics.json': packMetrics,
    'reconstruction-graph.json': graph,
    '18_reconstruction_graph.json': graph,
    'graph.json': graph,
    'content-semantics.json': content,
    '17_content.json': content,
    'content.json': content,
    'motion-timelines.json': motion,
    '16_motion.json': motion,
    'motion.json': motion,
    'component-variants.json': variants,
    '15_variants.json': variants,
    'variants.json': variants,
    'typography-rhythm.json': typo,
    '14_typography.json': typo,
    'typography.json': typo,
    'responsive-transitions.json': resp.transitions,
    '13_responsive.json': resp.transitions,
    'constraints.json': constraints,
    '12_constraints.json': constraints,
    'render-tree.json': renderTree,
    'render_tree.json': renderTree,
    '11_render_tree.json': renderTree,
    'registry.json': registry,
    'shared-registry.json': registry,
    'reconstruction.json': recon,
    'components.json': comps.canonical,
    'component-tree.json': comps.tree,
    'design-system.json': ds.json,
    'layout.json': layout,
    'responsive.json': resp.legacy,
    'interactions.json': inter.legacy,
    'animations.json': anims,
    'accessibility.json': a11y,
    'assets.json': assets,
    'design-tokens.json': ds.tokens,
    'css-variables.css': ds.css,
    'tailwind.config.js': ds.tailwind,
    'evidence.json': evidence,
    'prompt.md': prompt.promptMd,
    'README_FOR_AI.md': prompt.readme,
  };

  const packager = new ZipPackager();
  packager.addFiles(canonicalPackageFiles);
  // Also add prompt/AI_Reconstruction.md into the zip package
  packager.addFile('prompt/AI_Reconstruction.md', prompt.readme);

  const zipBuffer = packager.generateZip();
  const base64 = packager.toBase64();

  const fileEntries = Object.entries(files).map(([path, content]) => ({
    path,
    bytes: new TextEncoder().encode(content).length,
    mimeType: path.endsWith('.json') ? 'application/json' : path.endsWith('.css') ? 'text/css' : path.endsWith('.js') ? 'text/javascript' : 'text/markdown',
    role: path.replace(/\.[^.]+$/, ''),
    description: `Package artifact ${path}`,
  }));

  const manifest: AIClonePackageManifest = {
    generator: 'UI/UX Helper AI Website Reverse Engineering Engine (Consolidated 18-Artifact Architecture)',
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    targetUrl: data.pageUrl,
    title: data.title,
    viewport: `${data.layoutSystem?.viewport.width || 1440}x${data.layoutSystem?.viewport.height || 900}`,
    browser: 'Chromium MV3',
    adsVersion: '2.0.0',
    totalFiles: Object.keys(canonicalPackageFiles).length,
    totalBytes: zipBuffer.length,
    files: fileEntries,
  };

  return {
    manifest,
    readme: prompt.readme,
    files,
    zipBuffer,
    base64,
  };
}

export * from './progressivePackageEngine.ts';
export * from './clonePackageV3Builder.ts';

