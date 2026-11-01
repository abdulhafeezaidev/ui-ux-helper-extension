import { AnalyzePageResponseData, ExportFormat, AIClonePackageResult, AIClonePackageV3Result } from '../types/index.ts';
import { exportJson } from './jsonExporter.ts';
import { exportDesignTokens } from './tokenExporter.ts';
import { exportCssVariables } from './cssExporter.ts';
import { exportTailwindConfig } from './tailwindExporter.ts';
import { exportComponentSpec } from './componentSpecExporter.ts';
import { exportPageReconstruction } from './pageReconstructionExporter.ts';
import { exportComponentTreeJson } from './clonePackage/componentTreeJsonExporter.ts';
import { exportComponentsJson } from './clonePackage/componentsJsonExporter.ts';
import { exportLayoutJson } from './clonePackage/layoutJsonExporter.ts';
import { exportResponsiveJson } from './clonePackage/responsiveJsonExporter.ts';
import { exportInteractionsJson } from './clonePackage/interactionsJsonExporter.ts';
import { exportAnimationsJson } from './clonePackage/animationsJsonExporter.ts';
import { exportDesignSystemJson } from './clonePackage/designSystemJsonExporter.ts';
import { exportAccessibilityJson } from './clonePackage/accessibilityJsonExporter.ts';
import { exportBehaviorJson } from './clonePackage/behaviorJsonExporter.ts';
import { exportRenderTreeJson } from './clonePackage/renderTreeJsonExporter.ts';
import { exportConstraintsJson } from './clonePackage/constraintsJsonExporter.ts';
import { exportResponsiveTransitionsJson } from './clonePackage/responsiveTransitionJsonExporter.ts';
import { exportTypographyJson } from './clonePackage/typographyJsonExporter.ts';
import { exportVariantsJson } from './clonePackage/variantsJsonExporter.ts';
import { exportMotionJson } from './clonePackage/motionJsonExporter.ts';
import { exportContentJson } from './clonePackage/contentJsonExporter.ts';
import { exportReconstructionGraphJson } from './clonePackage/reconstructionGraphJsonExporter.ts';
import { exportLightweightBundleJson } from './clonePackage/lightweightBundleBuilder.ts';
import { exportPromptMarkdown } from './clonePackage/promptMarkdownExporter.ts';
import { exportSharedRegistryJson } from './clonePackage/sharedRegistryJsonExporter.ts';
import { buildAIClonePackage, buildProgressivePackage, buildAIClonePackageV3 } from './clonePackage/clonePackageBuilder.ts';
import { buildDesignLanguagePackage } from './designLanguage/designLanguagePackageBuilder.ts';
import {
  exportDesignKnowledgeGraph,
  exportComponentRegistry,
  exportVariantGraph,
  exportTokenRegistry,
  exportKnowledgeGraphAuditReport,
  exportKnowledgeGraphAuditJson,
} from './knowledgeGraph/index.ts';

import {
  exportIntentMapJson,
  exportIntentDictionaryJson,
} from './intent/index.ts';

import {
  exportLayoutRelationshipGraphJson,
  exportContainerHierarchyJson,
  exportSectionFlowJson,
} from './layout/index.ts';

import {
  exportBuildDependencyGraphJson,
  exportComponentDependencyGraphJson,
} from './planner/index.ts';

import {
  exportOptimizationReportMarkdown,
  exportKnowledgeCompressionJson,
  exportConfidenceMapJson,
  exportPackageMetricsJson,
} from './optimizer/index.ts';

import {
  buildAgentDesignSpecification,
  exportAdsJson,
  exportAdsMarkdown,
  exportAdsContext,
} from '../agent-spec/index.ts';

import { compileDesignSpecification } from '../compiler/index.ts';

export interface ArtifactExportResult {
  format: ExportFormat;
  exportedData: string;
  artifacts: Record<string, string>;
  aiClonePackage?: AIClonePackageResult;
  aiClonePackageV3?: AIClonePackageV3Result;
  base64Zip?: string;
}

export class ArtifactExporter {
  public export(data: AnalyzePageResponseData, format: ExportFormat = 'all'): ArtifactExportResult {
    let clonePkg: AIClonePackageResult | undefined;
    const artifacts: Record<string, string> = {};

    if (format === 'package-v3' || format === 'PackageV3' || format === 'clone-v3' || format === 'CloneV3' ||
        format === 'ai-clone-package-v3' || format === 'AIClonePackageV3' || format === 'AI_Clone_Package' ||
        format === 'clone-package-v3') {
      const v3Pkg = buildAIClonePackageV3(data);
      const manifestStr = JSON.stringify(v3Pkg.manifest, null, 2);
      return {
        format,
        exportedData: manifestStr,
        artifacts: v3Pkg.files,
        aiClonePackageV3: v3Pkg,
        base64Zip: v3Pkg.base64,
      };
    }

    if (format === 'ai-clone-package') {
      clonePkg = buildAIClonePackage(data);
      return {
        format,
        exportedData: clonePkg.readme,
        artifacts: clonePkg.files,
        aiClonePackage: clonePkg,
        base64Zip: clonePkg.base64,
      };
    }

    if (format === 'package-fast' || format === 'package-level-1') {
      const progPkg = buildProgressivePackage(data, 'fast');
      return {
        format,
        exportedData: progPkg.readme,
        artifacts: progPkg.files,
        aiClonePackage: {
          manifest: progPkg.manifest as any,
          readme: progPkg.readme,
          files: progPkg.files,
          zipBuffer: new Uint8Array(),
          base64: progPkg.base64,
        },
        base64Zip: progPkg.base64,
      };
    }

    if (format === 'package-standard' || format === 'package-level-2') {
      const progPkg = buildProgressivePackage(data, 'standard');
      return {
        format,
        exportedData: progPkg.readme,
        artifacts: progPkg.files,
        aiClonePackage: {
          manifest: progPkg.manifest as any,
          readme: progPkg.readme,
          files: progPkg.files,
          zipBuffer: new Uint8Array(),
          base64: progPkg.base64,
        },
        base64Zip: progPkg.base64,
      };
    }

    if (format === 'package-full' || format === 'package-level-3') {
      const progPkg = buildProgressivePackage(data, 'full');
      return {
        format,
        exportedData: progPkg.readme,
        artifacts: progPkg.files,
        aiClonePackage: {
          manifest: progPkg.manifest as any,
          readme: progPkg.readme,
          files: progPkg.files,
          zipBuffer: new Uint8Array(),
          base64: progPkg.base64,
        },
        base64Zip: progPkg.base64,
      };
    }

    if (format === 'component-tree') {
      const treeJson = exportComponentTreeJson(data);
      return {
        format,
        exportedData: treeJson,
        artifacts: { 'component-tree': treeJson },
      };
    }

    if (format === 'components-json') {
      const compJson = exportComponentsJson(data);
      return {
        format,
        exportedData: compJson,
        artifacts: { 'components-json': compJson },
      };
    }

    if (format === 'layout') {
      const layoutStr = exportLayoutJson(data);
      return {
        format,
        exportedData: layoutStr,
        artifacts: { layout: layoutStr },
      };
    }

    if (format === 'responsive') {
      const respStr = exportResponsiveJson(data);
      return {
        format,
        exportedData: respStr,
        artifacts: { responsive: respStr },
      };
    }

    if (format === 'interactions') {
      const ixStr = exportInteractionsJson(data);
      return {
        format,
        exportedData: ixStr,
        artifacts: { interactions: ixStr },
      };
    }

    if (format === 'animations') {
      const animStr = exportAnimationsJson(data);
      return {
        format,
        exportedData: animStr,
        artifacts: { animations: animStr },
      };
    }

    if (format === 'behavior') {
      const bStr = exportBehaviorJson(data);
      return {
        format,
        exportedData: bStr,
        artifacts: { behavior: bStr },
      };
    }

    if (format === 'design-system') {
      const dsStr = exportDesignSystemJson(data);
      return {
        format,
        exportedData: dsStr,
        artifacts: { 'design-system': dsStr },
      };
    }

    if (format === 'accessibility') {
      const a11yStr = exportAccessibilityJson(data);
      return {
        format,
        exportedData: a11yStr,
        artifacts: { accessibility: a11yStr },
      };
    }

    if (format === 'prompt') {
      const promptStr = exportPromptMarkdown(data);
      return {
        format,
        exportedData: promptStr,
        artifacts: { prompt: promptStr },
      };
    }

    if (format === 'registry' || format === 'shared-registry') {
      const regStr = exportSharedRegistryJson(data);
      return {
        format,
        exportedData: regStr,
        artifacts: { registry: regStr, 'shared-registry': regStr },
      };
    }

    if (format === 'render-tree' || format === '11_render_tree') {
      const rtStr = exportRenderTreeJson(data);
      return {
        format,
        exportedData: rtStr,
        artifacts: { 'render-tree': rtStr, '11_render_tree': rtStr },
      };
    }

    if (format === 'constraints' || format === '12_constraints') {
      const cStr = exportConstraintsJson(data);
      return {
        format,
        exportedData: cStr,
        artifacts: { 'constraints': cStr, '12_constraints': cStr },
      };
    }

    if (format === 'responsive-transitions' || format === '13_responsive') {
      const rtStr = exportResponsiveTransitionsJson(data);
      return {
        format,
        exportedData: rtStr,
        artifacts: { 'responsive-transitions': rtStr, '13_responsive': rtStr },
      };
    }

    if (format === 'typography-rhythm' || format === '14_typography') {
      const trStr = exportTypographyJson(data);
      return {
        format,
        exportedData: trStr,
        artifacts: { 'typography-rhythm': trStr, '14_typography': trStr },
      };
    }

    if (format === 'component-variants' || format === '15_variants') {
      const vStr = exportVariantsJson(data);
      return {
        format,
        exportedData: vStr,
        artifacts: { 'component-variants': vStr, '15_variants': vStr },
      };
    }

    if (format === 'motion-timelines' || format === '16_motion') {
      const mStr = exportMotionJson(data);
      return {
        format,
        exportedData: mStr,
        artifacts: { 'motion-timelines': mStr, '16_motion': mStr },
      };
    }

    if (format === 'content-semantics' || format === '17_content') {
      const cStr = exportContentJson(data);
      return {
        format,
        exportedData: cStr,
        artifacts: { 'content-semantics': cStr, '17_content': cStr },
      };
    }

    if (format === 'reconstruction-graph' || format === '18_reconstruction_graph') {
      const gStr = exportReconstructionGraphJson(data);
      return {
        format,
        exportedData: gStr,
        artifacts: { 'reconstruction-graph': gStr, '18_reconstruction_graph': gStr },
      };
    }

    if (format === 'ai-lightweight-bundle') {
      const bundleStr = exportLightweightBundleJson(data);
      return {
        format,
        exportedData: bundleStr,
        artifacts: {
          'ai-lightweight-bundle': bundleStr,
        },
      };
    }

    if (format === 'design-language-package' || format === 'design-language') {
      const pkg = buildDesignLanguagePackage(data);
      return {
        format,
        exportedData: pkg.themePrompt,
        artifacts: pkg.files,
        base64Zip: pkg.base64,
      };
    }

    if (format === 'design-principles') {
      const pkg = buildDesignLanguagePackage(data);
      return {
        format,
        exportedData: pkg.designPrinciples,
        artifacts: { 'design-principles': pkg.designPrinciples },
      };
    }

    if (format === 'theme-prompt') {
      const pkg = buildDesignLanguagePackage(data);
      return {
        format,
        exportedData: pkg.themePrompt,
        artifacts: { 'theme-prompt': pkg.themePrompt },
      };
    }

    if (format === 'design-knowledge-graph' || format === 'DesignKnowledgeGraph') {
      const dkgStr = exportDesignKnowledgeGraph(data);
      return {
        format,
        exportedData: dkgStr,
        artifacts: { 'design-knowledge-graph': dkgStr, 'DesignKnowledgeGraph.json': dkgStr },
      };
    }

    if (format === 'component-registry' || format === 'ComponentRegistry') {
      const crStr = exportComponentRegistry(data);
      return {
        format,
        exportedData: crStr,
        artifacts: { 'component-registry': crStr, 'ComponentRegistry.json': crStr },
      };
    }

    if (format === 'variant-graph' || format === 'VariantGraph') {
      const vgStr = exportVariantGraph(data);
      return {
        format,
        exportedData: vgStr,
        artifacts: { 'variant-graph': vgStr, 'VariantGraph.json': vgStr },
      };
    }

    if (format === 'token-registry' || format === 'TokenRegistry') {
      const trStr = exportTokenRegistry(data);
      return {
        format,
        exportedData: trStr,
        artifacts: { 'token-registry': trStr, 'TokenRegistry.json': trStr },
      };
    }

    if (format === 'knowledge-graph-audit') {
      const auditMd = exportKnowledgeGraphAuditReport(data);
      const auditJson = exportKnowledgeGraphAuditJson(data);
      return {
        format,
        exportedData: auditMd,
        artifacts: {
          'knowledge-graph-audit': auditMd,
          'KnowledgeGraphAuditReport.md': auditMd,
          'KnowledgeGraphAudit.json': auditJson,
        },
      };
    }

    if (format === 'intent-map' || format === 'IntentMap') {
      const imStr = exportIntentMapJson(data);
      return {
        format,
        exportedData: imStr,
        artifacts: { 'intent-map': imStr, 'IntentMap.json': imStr },
      };
    }

    if (format === 'intent-dictionary' || format === 'IntentDictionary') {
      const idStr = exportIntentDictionaryJson(data);
      return {
        format,
        exportedData: idStr,
        artifacts: { 'intent-dictionary': idStr, 'IntentDictionary.json': idStr },
      };
    }

    if (format === 'intents') {
      const imStr = exportIntentMapJson(data);
      const idStr = exportIntentDictionaryJson(data);
      return {
        format,
        exportedData: imStr,
        artifacts: {
          'intent-map': imStr,
          'IntentMap.json': imStr,
          'intent-dictionary': idStr,
          'IntentDictionary.json': idStr,
        },
      };
    }

    if (format === 'layout-relationships' || format === 'LayoutRelationshipGraph') {
      const lrgStr = exportLayoutRelationshipGraphJson(data);
      return {
        format,
        exportedData: lrgStr,
        artifacts: {
          'layout-relationships': lrgStr,
          'LayoutRelationshipGraph.json': lrgStr,
        },
      };
    }

    if (format === 'container-hierarchy' || format === 'ContainerHierarchy') {
      const chStr = exportContainerHierarchyJson(data);
      return {
        format,
        exportedData: chStr,
        artifacts: {
          'container-hierarchy': chStr,
          'ContainerHierarchy.json': chStr,
        },
      };
    }

    if (format === 'section-flow' || format === 'SectionFlow') {
      const sfStr = exportSectionFlowJson(data);
      return {
        format,
        exportedData: sfStr,
        artifacts: {
          'section-flow': sfStr,
          'SectionFlow.json': sfStr,
        },
      };
    }

    if (format === 'reconstruction-plan' || format === 'ReconstructionPlan' || format === 'ReconstructionPlan.md') {
      const ads = buildAgentDesignSpecification(data);
      const compiledPkg = compileDesignSpecification(ads);
      const planMd = compiledPkg.reconstructionPlan.markdownPlan;
      const bgStr = JSON.stringify(compiledPkg.reconstructionPlan.buildGraph, null, 2);
      const dgStr = JSON.stringify(compiledPkg.reconstructionPlan.dependencyGraph, null, 2);
      return {
        format,
        exportedData: planMd,
        artifacts: {
          'ReconstructionPlan.md': planMd,
          'reconstruction-plan.md': planMd,
          'reconstruction-plan': planMd,
          'BuildGraph.json': bgStr,
          'build-graph.json': bgStr,
          'DependencyGraph.json': dgStr,
          'dependency-graph.json': dgStr,
        },
      };
    }

    if (format === 'build-dependency-graph' || format === 'BuildDependencyGraph') {
      const bdgStr = exportBuildDependencyGraphJson(data);
      return {
        format,
        exportedData: bdgStr,
        artifacts: {
          'build-dependency-graph': bdgStr,
          'BuildDependencyGraph.json': bdgStr,
        },
      };
    }

    if (format === 'component-dependency-graph' || format === 'ComponentDependencyGraph') {
      const cdgStr = exportComponentDependencyGraphJson(data);
      return {
        format,
        exportedData: cdgStr,
        artifacts: {
          'component-dependency-graph': cdgStr,
          'ComponentDependencyGraph.json': cdgStr,
        },
      };
    }

    if (format === 'optimization-report' || format === 'OptimizationReport') {
      const optMd = exportOptimizationReportMarkdown(data);
      return {
        format,
        exportedData: optMd,
        artifacts: {
          'optimization-report': optMd,
          'OptimizationReport.md': optMd,
        },
      };
    }

    if (format === 'knowledge-compression' || format === 'KnowledgeCompression') {
      const kcStr = exportKnowledgeCompressionJson(data);
      return {
        format,
        exportedData: kcStr,
        artifacts: {
          'knowledge-compression': kcStr,
          'KnowledgeCompression.json': kcStr,
        },
      };
    }

    if (format === 'confidence-map' || format === 'ConfidenceMap') {
      const cmStr = exportConfidenceMapJson(data);
      return {
        format,
        exportedData: cmStr,
        artifacts: {
          'confidence-map': cmStr,
          'ConfidenceMap.json': cmStr,
        },
      };
    }

    if (format === 'package-metrics' || format === 'PackageMetrics') {
      const pmStr = exportPackageMetricsJson(data);
      return {
        format,
        exportedData: pmStr,
        artifacts: {
          'package-metrics': pmStr,
          'PackageMetrics.json': pmStr,
        },
      };
    }

    if (format === 'design-grammar' || format === 'designGrammar' || format === 'designGrammar.json') {
      const ads = buildAgentDesignSpecification(data);
      const compiledPkg = compileDesignSpecification(ads);
      const dgStr = JSON.stringify(compiledPkg.designGrammar, null, 2);
      return {
        format,
        exportedData: dgStr,
        artifacts: {
          'designGrammar.json': dgStr,
          'design-grammar.json': dgStr,
          'design-grammar': dgStr,
        },
      };
    }

    if (format === 'component-grammar' || format === 'componentGrammar' || format === 'componentGrammar.json') {
      const ads = buildAgentDesignSpecification(data);
      const compiledPkg = compileDesignSpecification(ads);
      const cgStr = JSON.stringify(compiledPkg.componentGrammar, null, 2);
      return {
        format,
        exportedData: cgStr,
        artifacts: {
          'componentGrammar.json': cgStr,
          'component-grammar.json': cgStr,
          'component-grammar': cgStr,
        },
      };
    }

    if (format === 'layout-grammar' || format === 'layoutGrammar' || format === 'layoutGrammar.json') {
      const ads = buildAgentDesignSpecification(data);
      const compiledPkg = compileDesignSpecification(ads);
      const lgStr = JSON.stringify(compiledPkg.layoutGrammar, null, 2);
      return {
        format,
        exportedData: lgStr,
        artifacts: {
          'layoutGrammar.json': lgStr,
          'layout-grammar.json': lgStr,
          'layout-grammar': lgStr,
        },
      };
    }

    if (format === 'interaction-grammar' || format === 'interactionGrammar' || format === 'interactionGrammar.json') {
      const ads = buildAgentDesignSpecification(data);
      const compiledPkg = compileDesignSpecification(ads);
      const igStr = JSON.stringify(compiledPkg.interactionGrammar, null, 2);
      return {
        format,
        exportedData: igStr,
        artifacts: {
          'interactionGrammar.json': igStr,
          'interaction-grammar.json': igStr,
          'interaction-grammar': igStr,
        },
      };
    }


    if (format === 'build-graph' || format === 'BuildGraph' || format === 'BuildGraph.json') {
      const ads = buildAgentDesignSpecification(data);
      const compiledPkg = compileDesignSpecification(ads);
      const bgStr = JSON.stringify(compiledPkg.reconstructionPlan.buildGraph, null, 2);
      return {
        format,
        exportedData: bgStr,
        artifacts: {
          'BuildGraph.json': bgStr,
          'build-graph.json': bgStr,
          'build-graph': bgStr,
        },
      };
    }

    if (format === 'dependency-graph' || format === 'DependencyGraph' || format === 'DependencyGraph.json') {
      const ads = buildAgentDesignSpecification(data);
      const compiledPkg = compileDesignSpecification(ads);
      const dgStr = JSON.stringify(compiledPkg.reconstructionPlan.dependencyGraph, null, 2);
      return {
        format,
        exportedData: dgStr,
        artifacts: {
          'DependencyGraph.json': dgStr,
          'dependency-graph.json': dgStr,
          'dependency-graph': dgStr,
        },
      };
    }

    if (format === 'semantic-compression' || format === 'semanticCompression' || format === 'semanticCompression.json' ||
        format === 'compressed-package' || format === 'compressedPackage' || format === 'compressedPackage.json') {
      const ads = buildAgentDesignSpecification(data);
      const compiledPkg = compileDesignSpecification(ads);
      const scStr = JSON.stringify(compiledPkg.semanticCompression, null, 2);
      const reportMd = compiledPkg.semanticCompression?.report?.markdownSummary || '';
      return {
        format,
        exportedData: scStr,
        artifacts: {
          'semanticCompression.json': scStr,
          'semantic-compression.json': scStr,
          'compressedPackage.json': scStr,
          'compressed-package.json': scStr,
          'SemanticCompressionReport.md': reportMd,
          'compression-report.md': reportMd,
        },
      };
    }

    if (format === 'compression-report' || format === 'compressionReport' || format === 'compressionReport.json' ||
        format === 'SemanticCompressionReport.md') {
      const ads = buildAgentDesignSpecification(data);
      const compiledPkg = compileDesignSpecification(ads);
      const reportMd = compiledPkg.semanticCompression?.report?.markdownSummary || '';
      const reportJson = JSON.stringify(compiledPkg.compressionReport, null, 2);
      return {
        format,
        exportedData: reportMd,
        artifacts: {
          'SemanticCompressionReport.md': reportMd,
          'compression-report.md': reportMd,
          'compressionReport.json': reportJson,
          'compression-report.json': reportJson,
        },
      };
    }

    if (format === 'compiled-design' || format === 'design-compiler') {
      const ads = buildAgentDesignSpecification(data);
      const compiledPkg = compileDesignSpecification(ads);
      const compiledStr = JSON.stringify(compiledPkg, null, 2);
      const dgStr = JSON.stringify(compiledPkg.designGrammar, null, 2);
      const cgStr = JSON.stringify(compiledPkg.componentGrammar, null, 2);
      const lgStr = JSON.stringify(compiledPkg.layoutGrammar, null, 2);
      const igStr = JSON.stringify(compiledPkg.interactionGrammar, null, 2);
      const planMd = compiledPkg.reconstructionPlan.markdownPlan;
      const bgStr = JSON.stringify(compiledPkg.reconstructionPlan.buildGraph, null, 2);
      const depGraphStr = JSON.stringify(compiledPkg.reconstructionPlan.dependencyGraph, null, 2);
      const scStr = JSON.stringify(compiledPkg.semanticCompression, null, 2);
      const scReportMd = compiledPkg.semanticCompression?.report?.markdownSummary || '';
      const scReportJson = JSON.stringify(compiledPkg.compressionReport, null, 2);
      return {
        format,
        exportedData: compiledStr,
        artifacts: {
          'compiled-design': compiledStr,
          'CompiledDesignPackage.json': compiledStr,
          'designGrammar.json': dgStr,
          'design-grammar.json': dgStr,
          'design-grammar': dgStr,
          'componentGrammar.json': cgStr,
          'component-grammar.json': cgStr,
          'component-grammar': cgStr,
          'layoutGrammar.json': lgStr,
          'layout-grammar.json': lgStr,
          'layout-grammar': lgStr,
          'interactionGrammar.json': igStr,
          'interaction-grammar.json': igStr,
          'interaction-grammar': igStr,
          'accessibility-grammar': JSON.stringify(compiledPkg.accessibilityGrammar, null, 2),
          'reconstruction-plan': JSON.stringify(compiledPkg.reconstructionPlan, null, 2),
          'ReconstructionPlan.md': planMd,
          'reconstruction-plan.md': planMd,
          'BuildGraph.json': bgStr,
          'build-graph.json': bgStr,
          'DependencyGraph.json': depGraphStr,
          'dependency-graph.json': depGraphStr,
          'semanticCompression.json': scStr,
          'semantic-compression.json': scStr,
          'compressedPackage.json': scStr,
          'compressed-package.json': scStr,
          'SemanticCompressionReport.md': scReportMd,
          'compression-report.md': scReportMd,
          'compressionReport.json': scReportJson,
        },
      };
    }

    const ads = buildAgentDesignSpecification(data);

    artifacts.json = exportJson(data);
    artifacts.tokens = exportDesignTokens(data);
    artifacts['design-system'] = exportDesignSystemJson(data);
    artifacts.css = exportCssVariables(data);
    artifacts.tailwind = exportTailwindConfig(data);
    artifacts.layout = exportLayoutJson(data);
    artifacts.responsive = exportResponsiveJson(data);
    artifacts.interactions = exportInteractionsJson(data);
    artifacts.animations = exportAnimationsJson(data);
    artifacts.behavior = exportBehaviorJson(data);
    artifacts.accessibility = exportAccessibilityJson(data);
    artifacts.components = exportComponentSpec(data);
    artifacts['components-json'] = exportComponentsJson(data);
    artifacts['component-tree'] = exportComponentTreeJson(data);
    artifacts.reconstruction = exportPageReconstruction(data);
    artifacts['ads-json'] = exportAdsJson(ads);
    artifacts['ads-markdown'] = exportAdsMarkdown(ads);
    artifacts['ads-context'] = exportAdsContext(ads);
    artifacts.prompt = exportPromptMarkdown(data);

    if (format === 'all') {
      clonePkg = buildAIClonePackage(data);
      Object.assign(artifacts, clonePkg.files);
    }

    let mainData = artifacts.json;
    if (format === 'ads-all') {
      mainData = artifacts['ads-json'];
    } else if (format !== 'all' && artifacts[format]) {
      mainData = artifacts[format];
    }

    return {
      format,
      exportedData: mainData,
      artifacts,
      aiClonePackage: clonePkg,
      base64Zip: clonePkg?.base64,
    };
  }
}

export function exportArtifact(data: AnalyzePageResponseData, format: ExportFormat = 'all'): ArtifactExportResult {
  return new ArtifactExporter().export(data, format);
}



