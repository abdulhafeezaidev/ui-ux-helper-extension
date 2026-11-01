/**
 * Extension Message Types and IPC Protocol Definitions
 */

import {
  RawExtractionResult,
  NormalizedColorSystem,
  NormalizedTypographySystem,
  NormalizedShapeSystem,
  NormalizedLayoutSystem,
  NormalizedComponentSystem,
  AIClonePackageResult,
  AIClonePackageV3Result,
} from './schema.ts';

export enum MessageType {
  ANALYZE_PAGE = 'ANALYZE_PAGE',
  SELECT_ELEMENT = 'SELECT_ELEMENT',
  ANALYZE_ELEMENT = 'ANALYZE_ELEMENT',
  GET_RESULT = 'GET_RESULT',
  EXPORT_RESULT = 'EXPORT_RESULT',
}

export type ExportFormat =
  | 'json'
  | 'tokens'
  | 'design-system'
  | 'css'
  | 'tailwind'
  | 'layout'
  | 'responsive'
  | 'interactions'
  | 'animations'
  | 'accessibility'
  | 'behavior'
  | 'registry'
  | 'shared-registry'
  | 'components'
  | 'components-json'
  | 'component-tree'
  | 'reconstruction'
  | 'ads-json'
  | 'ads-markdown'
  | 'ads-context'
  | 'prompt'
  | 'ads-all'
  | 'ai-clone-package'
  | 'ai-lightweight-bundle'
  | 'render-tree'
  | '11_render_tree'
  | 'constraints'
  | '12_constraints'
  | 'responsive-transitions'
  | '13_responsive'
  | 'typography-rhythm'
  | '14_typography'
  | 'component-variants'
  | '15_variants'
  | 'motion-timelines'
  | '16_motion'
  | 'content-semantics'
  | '17_content'
  | 'reconstruction-graph'
  | '18_reconstruction_graph'
  | 'design-language-package'
  | 'design-language'
  | 'design-principles'
  | 'theme-prompt'
  | 'design-knowledge-graph'
  | 'DesignKnowledgeGraph'
  | 'component-registry'
  | 'ComponentRegistry'
  | 'variant-graph'
  | 'VariantGraph'
  | 'token-registry'
  | 'TokenRegistry'
  | 'knowledge-graph-audit'
  | 'intent-map'
  | 'IntentMap'
  | 'intent-dictionary'
  | 'IntentDictionary'
  | 'intents'
  | 'layout-relationships'
  | 'LayoutRelationshipGraph'
  | 'container-hierarchy'
  | 'ContainerHierarchy'
  | 'section-flow'
  | 'SectionFlow'
  | 'reconstruction-plan'
  | 'ReconstructionPlan'
  | 'ReconstructionPlan.md'
  | 'build-graph'
  | 'BuildGraph'
  | 'BuildGraph.json'
  | 'dependency-graph'
  | 'DependencyGraph'
  | 'DependencyGraph.json'
  | 'build-dependency-graph'
  | 'BuildDependencyGraph'
  | 'component-dependency-graph'
  | 'ComponentDependencyGraph'
  | 'package-fast'
  | 'package-standard'
  | 'package-full'
  | 'package-level-1'
  | 'package-level-2'
  | 'package-level-3'
  | 'optimization-report'
  | 'OptimizationReport'
  | 'knowledge-compression'
  | 'KnowledgeCompression'
  | 'confidence-map'
  | 'ConfidenceMap'
  | 'package-metrics'
  | 'PackageMetrics'
  | 'compiled-design'
  | 'design-compiler'
  | 'design-grammar'
  | 'designGrammar'
  | 'designGrammar.json'
  | 'component-grammar'
  | 'componentGrammar'
  | 'componentGrammar.json'
  | 'layout-grammar'
  | 'layoutGrammar'
  | 'layoutGrammar.json'
  | 'interaction-grammar'
  | 'interactionGrammar'
  | 'interactionGrammar.json'
  | 'semantic-compression'
  | 'semanticCompression'
  | 'semanticCompression.json'
  | 'compression-report'
  | 'compressionReport'
  | 'compressionReport.json'
  | 'SemanticCompressionReport.md'
  | 'compressed-package'
  | 'compressedPackage'
  | 'compressedPackage.json'
  | 'package-v3'
  | 'PackageV3'
  | 'clone-v3'
  | 'CloneV3'
  | 'ai-clone-package-v3'
  | 'AIClonePackageV3'
  | 'AI_Clone_Package'
  | 'clone-package-v3'
  | 'all';

// Request Payload Contracts
export interface AnalyzePagePayload {
  includeHidden?: boolean;
  options?: Record<string, unknown>;
}

export interface SelectElementPayload {
  selector?: string;
  mode?: 'hover' | 'click';
}

export interface AnalyzeElementPayload {
  elementId?: string;
  selector?: string;
}

export interface GetResultPayload {
  resultId?: string;
}

export interface ExportResultPayload {
  format?: ExportFormat;
}

// Map of Payload Types per MessageType
export interface MessagePayloadMap {
  [MessageType.ANALYZE_PAGE]: AnalyzePagePayload;
  [MessageType.SELECT_ELEMENT]: SelectElementPayload;
  [MessageType.ANALYZE_ELEMENT]: AnalyzeElementPayload;
  [MessageType.GET_RESULT]: GetResultPayload;
  [MessageType.EXPORT_RESULT]: ExportResultPayload;
}

// Discriminated Union for Typed Messages
export interface TypedMessage<T extends MessageType = MessageType> {
  id: string;
  type: T;
  payload: MessagePayloadMap[T];
  timestamp: number;
}

// Extension Response Data Payloads
export interface AnalyzePageResponseData {
  status: 'initialized' | 'completed';
  pageUrl: string;
  title: string;
  timestamp: number;
  extractionResult?: RawExtractionResult;
  colorSystem?: NormalizedColorSystem;
  typographySystem?: NormalizedTypographySystem;
  shapeSystem?: NormalizedShapeSystem;
  layoutSystem?: NormalizedLayoutSystem;
  componentSystem?: NormalizedComponentSystem;
  summary?: {
    totalElements: number;
    visibleElements: number;
    normalizedColorsCount: number;
    normalizedTypographyTokensCount: number;
    radiusTokensCount: number;
    shadowTokensCount: number;
    containerCount: number;
    sectionCount: number;
    componentCount: number;
    familyCount: number;
  };
}

export interface SelectElementResponseData {
  selected: boolean;
  selector?: string;
  tagName?: string;
}

export interface AnalyzeElementResponseData {
  elementId: string;
  analyzed: boolean;
  elementNode?: unknown;
}

export interface GetResultResponseData {
  resultId: string;
  status: 'empty' | 'available';
  data: unknown;
}

export interface ExportResultResponseData {
  exportedData: string;
  format: ExportFormat;
  artifacts?: Record<string, string>;
  aiClonePackage?: AIClonePackageResult;
  aiClonePackageV3?: AIClonePackageV3Result;
  base64Zip?: string;
}

export interface MessageResponseMap {
  [MessageType.ANALYZE_PAGE]: AnalyzePageResponseData;
  [MessageType.SELECT_ELEMENT]: SelectElementResponseData;
  [MessageType.ANALYZE_ELEMENT]: AnalyzeElementResponseData;
  [MessageType.GET_RESULT]: GetResultPayload;
  [MessageType.EXPORT_RESULT]: ExportResultPayload;
}

// Generic Response Container
export interface ExtensionResponse<T = unknown> {
  success: boolean;
  type: MessageType;
  data?: T;
  error?: string;
  timestamp: number;
}
