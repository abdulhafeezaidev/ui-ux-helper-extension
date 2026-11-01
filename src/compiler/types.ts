/**
 * AI Design Compiler - Semantic Grammar Definitions & Contracts
 * 
 * Target Pipeline:
 * Website -> Browser Extraction -> Semantic Analysis ->
 * Design Grammar -> Component Grammar -> Layout Grammar -> Interaction Grammar ->
 * AI Clone Package
 * 
 * Invariants:
 * 1. The compiler operates strictly on ADS extraction output.
 * 2. It NEVER accesses the DOM directly.
 * 3. It produces semantic objects only (no duplicated DOM, no raw CSS stylesheets, no duplicated layout trees).
 */

// ============================================================================
// Compiler Pipeline & Context
// ============================================================================

export type CompilerDiagnosticLevel = 'info' | 'warn' | 'error';

export interface CompilerDiagnostic {
  level: CompilerDiagnosticLevel;
  message: string;
  pass: string;
  timestamp: number;
}

export interface CompilerMetrics {
  totalTokens: number;
  totalComponents: number;
  totalContainers: number;
  totalInteractions: number;
  compilationTimeMs: number;
}

export interface CompilerContext {
  adsVersion: string;
  pageUrl: string;
  pageTitle: string;
  passesExecuted: string[];
  diagnostics: CompilerDiagnostic[];
  metrics: CompilerMetrics;
  addDiagnostic(level: CompilerDiagnosticLevel, message: string, pass: string): void;
}

export interface CompilerPass<TInput, TOutput> {
  readonly name: string;
  readonly passNumber: number;
  compile(input: TInput, context: CompilerContext): TOutput;
}

// ============================================================================
// Pass 1: Design Grammar
// ============================================================================

export type ColorSemanticRole =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'background'
  | 'surface'
  | 'text-primary'
  | 'text-secondary'
  | 'text-muted'
  | 'border'
  | 'state-active'
  | 'state-hover'
  | 'status-success'
  | 'status-error'
  | 'status-warning';

export interface SemanticColorToken {
  id: string;
  role: ColorSemanticRole;
  hex: string;
  hsl: { h: number; s: number; l: number };
  contrastRatioWithBackground?: number;
  semanticIntent: string;
}

export type TypographyHierarchyRole =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body-lead'
  | 'body'
  | 'body-small'
  | 'caption'
  | 'code';

export interface SemanticTypographyToken {
  id: string;
  role: TypographyHierarchyRole;
  fontFamily: string;
  fontSizePx: number;
  fontWeight: string;
  lineHeightRatio: number;
  letterSpacing: string;
  hierarchyRank: number;
}

export interface SemanticSpacingScaleStep {
  step: number;
  valuePx: number;
  semanticRole: 'micro' | 'inline-gap' | 'component-padding' | 'layout-gap' | 'section-padding';
}

export type SurfaceElevationLevel = 0 | 1 | 2 | 3 | 4;

export interface SemanticSurfaceToken {
  id: string;
  elevation: SurfaceElevationLevel;
  radiusPx: number;
  hasShadow: boolean;
  shadowIntent: 'flat' | 'subtle-raised' | 'floating' | 'overlay';
  surfaceRole: string;
}

export type CanonicalTShirtScale =
  | 'none'
  | '4xs'
  | '3xs'
  | '2xs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | 'full';

export interface CanonicalToken<T = unknown> {
  name: string;
  canonicalRef: string;
  value: T;
  usageCount: number;
  description: string;
}

export interface DesignGrammarCompressionStats {
  before: {
    totalRawValues: number;
    repeatedValuesCount: number;
    rawPayloadSizeBytes: number;
  };
  after: {
    canonicalTokensCount: number;
    uniqueTokensCount: number;
    compressedPayloadSizeBytes: number;
  };
  reductionPercentage: number;
  compressionRatio: number;
}

export interface SemanticDesignGrammar {
  // 1. Canonical Color Palette
  colors: Record<string, CanonicalToken<string>>;

  // 2. Canonical Typography Roles & Scale
  typography: Record<string, CanonicalToken<{
    fontSizePx: number;
    lineHeightRatio: number;
    fontWeight: string;
    role: string;
  }>>;

  // 3. Canonical Spacing Scale (minimum token set)
  spacing: Record<string, CanonicalToken<number>>;

  // 4. Canonical Radius Scale
  radius: Record<string, CanonicalToken<number>>;

  // 5. Canonical Shadow Scale
  shadows: Record<string, CanonicalToken<string>>;

  // 6. Canonical Border Scale
  borders: Record<string, CanonicalToken<number>>;

  // 7. Canonical Elevation Tokens
  elevations: Record<string, CanonicalToken<number>>;

  // 8. Canonical Animation Tokens
  animations: {
    durations: Record<string, CanonicalToken<number>>;
    easings: Record<string, CanonicalToken<string>>;
  };

  // 9. Canonical Container Widths
  containers: Record<string, CanonicalToken<number>>;

  // Raw Value -> Canonical Token Reference Index (e.g. "16" -> "spacing.md", "#ffffff" -> "color.surface")
  tokenReferences: Record<string, string>;

  // Compression Statistics Report (Before vs After)
  compressionStats: DesignGrammarCompressionStats;

  // Backwards-compatible fields
  colorPalette: {
    primaryTokens: SemanticColorToken[];
    surfaceTokens: SemanticColorToken[];
    textTokens: SemanticColorToken[];
    borderTokens: SemanticColorToken[];
    accentTokens: SemanticColorToken[];
  };
  typographyScale: SemanticTypographyToken[];
  spacingScale: SemanticSpacingScaleStep[];
  surfaceElevation: SemanticSurfaceToken[];
  baseFontFamilies: string[];
}

// ============================================================================
// Pass 2: Component Grammar
// ============================================================================

export type SemanticComponentCategory =
  | 'navigation'
  | 'hero'
  | 'card'
  | 'form-control'
  | 'action'
  | 'media-display'
  | 'content-block'
  | 'feedback'
  | 'modal';

export interface ComponentPropertyContract {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'slot' | 'variant';
  required: boolean;
  defaultValue?: string | number | boolean;
  description: string;
}

export interface ComponentSlotContract {
  name: string;
  allowedTypes: string[];
  description: string;
}

export interface ComponentVariantContract {
  variantName: string;
  propValues: Record<string, string | number | boolean>;
  tokenBindings: Record<string, string>;
}

export interface CanonicalCardSemantics {
  isProductCard: boolean;
  hasMedia: boolean;
  hasTitle: boolean;
  hasPrice: boolean;
  hasRating: boolean;
  hasCta: boolean;
  hasBadge: boolean;
  semanticFields: Record<string, string>;
}

export interface SemanticComponentDefinition {
  id: string;
  name: string;
  category: SemanticComponentCategory;
  role: string;
  instanceCount: number;
  props: ComponentPropertyContract[];
  slots: ComponentSlotContract[];
  variants: ComponentVariantContract[];
  tokenBindings: {
    colorRoles: Record<string, string>;
    typographyRoles: Record<string, string>;
    spacingRoles: Record<string, string>;
  };
  composition: {
    subcomponents: string[];
    isComposite: boolean;
  };
  canonicalSemantics?: CanonicalCardSemantics;
}

export interface ComponentArchetype {
  id: string;
  semanticName: string;
  category: SemanticComponentCategory;
  description: string;
  slots: ComponentSlotContract[];
  variants: ComponentVariantContract[];
  states: string[];
  designTokens: {
    colors: Record<string, string>;
    typography: Record<string, string>;
    spacing: Record<string, string>;
    radius?: string;
    shadow?: string;
    border?: string;
  };
  requiredChildren: string[];
  optionalChildren: string[];
  relationships: {
    parents: string[];
    children: string[];
    coOccursWith: string[];
  };
  instanceCount: number;
  traceability: {
    sourceElementIds: string[];
    provenance: string;
    confidence: number;
    evidence: string[];
  };
}

export interface ComponentOccurrenceRef {
  occurrenceId: string;
  componentRef: string;
  sourceElementId: string;
  slotFills?: Record<string, string>;
  variantName?: string;
  state?: string;
}

export interface ComponentGrammarStatistics {
  originalComponents: number;
  canonicalComponents: number;
  compressionRatio: number;
  reuseRatio: number;
  averageInstancesPerArchetype: number;
}

export interface SemanticComponentGrammar {
  // Canonical Archetypes (One definition per archetype)
  archetypes: Record<string, ComponentArchetype>;

  // Every occurrence is represented as a componentRef instead of duplicated structure
  occurrences: ComponentOccurrenceRef[];

  // Archetype Compression & Reuse Statistics
  statistics: ComponentGrammarStatistics;

  // Backwards-compatible fields
  registry: SemanticComponentDefinition[];
  canonicalProductCard?: CanonicalCardSemantics;
  componentCount: number;
}

// ============================================================================
// Pass 3: Layout Grammar
// ============================================================================

export type LayoutFlowPattern =
  | 'flex-row'
  | 'flex-column'
  | 'grid-responsive'
  | 'stacked'
  | 'sticky'
  | 'overlay';

export interface ResponsiveBreakpointRule {
  breakpoint: 'desktop' | 'tablet' | 'mobile';
  columns?: number;
  maxWidthPx?: number;
  direction?: 'row' | 'column';
}

export interface SemanticContainerFlow {
  id: string;
  sectionRole: 'header' | 'hero' | 'feature-grid' | 'product-feed' | 'content-section' | 'cta' | 'footer' | 'sidebar';
  flowPattern: LayoutFlowPattern;
  alignment: {
    horizontal: 'start' | 'center' | 'end' | 'stretch' | 'space-between';
    vertical: 'start' | 'center' | 'end' | 'stretch';
  };
  responsiveness: ResponsiveBreakpointRule[];
  containedComponentIds: string[];
  flowOrder: number;
}

export type LayoutPatternCategory =
  | 'container'
  | 'split'
  | 'grid'
  | 'sidebar'
  | 'columns'
  | 'table'
  | 'timeline'
  | 'gallery'
  | 'flow';

export interface LayoutPatternResponsiveRule {
  breakpoint: 'desktop' | 'tablet' | 'mobile';
  columns: number;
  direction: 'row' | 'column';
  wrap: boolean;
  maxWidthPx?: number;
  gap: string;
}

export interface ReusableLayoutPattern {
  id: string;
  name: string;
  category: LayoutPatternCategory;
  description: string;
  container: {
    maxWidth: string;
    centered: boolean;
    padding: string;
  };
  columns: {
    desktop: number;
    tablet: number;
    mobile: number;
    distribution: 'equal' | 'split-50-50' | 'split-sidebar-70-30' | 'auto-fill';
  };
  gap: {
    row: string;
    column: string;
  };
  alignment: {
    horizontal: 'start' | 'center' | 'end' | 'stretch' | 'space-between';
    vertical: 'start' | 'center' | 'end' | 'stretch';
  };
  responsiveRules: LayoutPatternResponsiveRule[];
}

export interface SectionLayoutNode {
  sectionId: string;
  semanticRole: 'header' | 'hero' | 'feature-grid' | 'product-feed' | 'content-section' | 'cta' | 'footer' | 'sidebar' | 'pricing' | 'timeline' | 'gallery';
  patternRef: string;
  flowOrder: number;
  containedComponentRefs: string[];
  overrides?: {
    gap?: string;
    maxWidth?: string;
    padding?: string;
  };
}

export interface LayoutGrammarStatistics {
  totalElementsWithGeometry: number;
  detectedPatternsCount: number;
  sectionsCount: number;
  rawCoordinatesCount: number;
  eliminatedCoordinatesCount: number;
  estimatedCompression: {
    rawGeometrySizeBytes: number;
    patternGrammarSizeBytes: number;
    reductionPercentage: number;
    compressionRatio: number;
  };
  patternReuseRatio: number;
}

export interface SemanticLayoutGrammar {
  viewport: {
    width: number;
    height: number;
    documentHeight: number;
  };
  // Reusable Layout Patterns
  patterns: Record<string, ReusableLayoutPattern>;

  // Each page section references a pattern instead of raw x/y coordinates
  sections: SectionLayoutNode[];

  // Layout Statistics & Estimated Compression
  statistics: LayoutGrammarStatistics;

  // Backwards-compatible fields
  containers: SemanticContainerFlow[];
  totalContainers: number;
}

// ============================================================================
// Pass 4: Interaction Grammar
// ============================================================================

export type InteractionTrigger =
  | 'hover'
  | 'click'
  | 'focus'
  | 'scroll-entry'
  | 'viewport-resize';

export type InteractionEffect =
  | 'state-toggle'
  | 'disclosure'
  | 'elevation-shift'
  | 'navigation'
  | 'modal-open'
  | 'drawer-open'
  | 'color-shift';

export type SemanticInteractionName =
  | 'Hover Reveal'
  | 'Accordion Expand'
  | 'Drawer Open'
  | 'Modal Fade'
  | 'Sticky Navigation'
  | 'Carousel Slide'
  | 'Quick View'
  | 'Image Swap'
  | 'Elevation Shift'
  | 'State Toggle';

export interface SemanticInteractionContract {
  id: string;
  targetComponentId: string;
  trigger: InteractionTrigger;
  sourceState: string;
  targetState: string;
  effect: InteractionEffect;
  motionIntent: {
    timingCategory: 'instant' | 'micro' | 'standard' | 'elaborate';
    durationMs: number;
    easing: 'linear' | 'ease-out' | 'ease-in-out' | 'spring';
  };
}

export interface SemanticInteraction {
  id: string;
  name: SemanticInteractionName;
  semanticType: string;
  description: string;
  trigger: 'hover' | 'click' | 'scroll-threshold' | 'viewport-entry' | 'focus';
  state: {
    from: string;
    to: string;
  };
  animationToken: string;
  'animation token'?: string;
  duration: number;
  easing: string;
  affectedComponents: string[];
  'affected components'?: string[];
  traceability: {
    provenance: string;
    confidence: number;
    evidence: string[];
  };
}

export interface InteractionGrammarStatistics {
  totalLowLevelEvents: number;
  semanticInteractionsCount: number;
  compressionRatio: number;
  eliminatedEventListenersCount: number;
}

export interface SemanticInteractionGrammar {
  // Semantic Interactions Dictionary (Hover Reveal, Accordion Expand, Drawer Open, etc.)
  semanticInteractions: Record<string, SemanticInteraction>;

  // Interaction Statistics
  statistics: InteractionGrammarStatistics;

  // Backwards-compatible fields
  interactions: SemanticInteractionContract[];
  totalInteractions: number;
}

// ============================================================================
// Pass 5: Accessibility Grammar
// ============================================================================

export interface SemanticLandmark {
  role: 'banner' | 'main' | 'navigation' | 'complementary' | 'contentinfo' | 'region';
  containerId: string;
  accessibleName?: string;
}

export interface KeyboardNavigationSequence {
  sequenceId: string;
  componentIds: string[];
  isTrap: boolean;
}

export interface AccessibilityComplianceAttestation {
  wcagLevel: 'AA' | 'AAA' | 'Partial';
  contrastPassed: boolean;
  landmarksPresent: boolean;
  keyboardNavigable: boolean;
}

export interface SemanticAccessibilityGrammar {
  landmarks: SemanticLandmark[];
  keyboardNavigation: KeyboardNavigationSequence[];
  compliance: AccessibilityComplianceAttestation;
}

// ============================================================================
// Pass 6: Reconstruction Planner
// ============================================================================

export type ReconstructionPhase =
  | 'design-tokens'
  | 'typography'
  | 'layout-patterns'
  | 'shared-components'
  | 'variants'
  | 'pages'
  | 'interactions'
  | 'accessibility'
  | 'optimization'
  | 'primitives'
  | 'composite-components'
  | 'layout-scaffold'
  | 'verification';

export interface ReconstructionCompilerReference {
  artifact: string;
  section?: string;
  keyPath?: string;
  description: string;
}

export interface ReconstructionStep {
  id: string;
  stepNumber: number;
  phase: ReconstructionPhase;
  title: string;
  targetRef: string;
  compilerReferences: ReconstructionCompilerReference[];
  dependsOn: string[];
  parallelTier: number;
  canRunInParallelWith: string[];
  aiDirective: string;
  expectedOutputs: string[];
  optimizationGoals: {
    minimizeHallucinations: string;
    maximizeReuse: string;
    minimizeGeneratedCode: string;
  };
}

export interface DependencyGraphNode {
  id: string;
  stepNumber: number;
  name: string;
  phase: ReconstructionPhase;
  tier: number;
  compilerArtifacts: string[];
  dependencies: string[];
  dependents: string[];
}

export interface DependencyGraphParallelTier {
  tier: number;
  stepIds: string[];
  description: string;
  canExecuteConcurrently: boolean;
}

export interface DependencyGraph {
  nodes: string[];
  nodeDetails?: Record<string, DependencyGraphNode>;
  edges: { from: string; to: string }[];
  adjacencyList?: Record<string, string[]>;
  topologicalOrder: string[];
  parallelTiers: DependencyGraphParallelTier[];
}

export interface BuildGraphTask {
  id: string;
  stepNumber: number;
  name: string;
  phase: ReconstructionPhase;
  tier: number;
  targetRef: string;
  compilerOutputs: string[];
  inputs: string[];
  outputs: string[];
  dependsOn: string[];
  parallelGroup: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
  codeGenDirectives: string;
}

export interface BuildGraph {
  version: string;
  totalTasks: number;
  parallelTiersCount: number;
  criticalPath: string[];
  tasks: BuildGraphTask[];
  edges: { from: string; to: string }[];
  estimatedTimeSavingsParallel: string;
}

export interface ReconstructionPlan {
  steps: ReconstructionStep[];
  dependencyGraph: DependencyGraph;
  buildGraph: BuildGraph;
  markdownPlan: string;
  executionPhases: ReconstructionPhase[];
  totalSteps: number;
}

// ============================================================================
// Pass 7: Semantic Compressor (Lossless Mathematical Redundancy Elimination)
// ============================================================================

export interface CompressionDeduplicationBreakdown {
  repeatedCardsDeduplicated: number;
  repeatedSpacingDeduplicated: number;
  repeatedColorsDeduplicated: number;
  repeatedContainersDeduplicated: number;
  repeatedDomDeduplicated: number;
  repeatedCssDeduplicated: number;
}

export interface SemanticCompressionReport {
  originalPackageSizeBytes: number;
  compressedSizeBytes: number;
  compressionPercentage: number;
  semanticPreservationPercentage: number;
  estimatedReconstructionFidelity: number;
  breakdown: CompressionDeduplicationBreakdown;
  mathematicalProof: {
    reconstructableItemsCount: number;
    irreversibleLossCount: 0;
    losslessGuarantee: true;
    formula: string;
  };
  markdownSummary?: string;
}

export interface CompressedComponentInstance {
  id: string;
  archetypeRef: string;
  repeatCount?: number;
  slotOverrides?: Record<string, any>;
  variantRef?: string;
  tokenOverrides?: Record<string, string>;
}

export interface CompressedSectionLayout {
  sectionId: string;
  semanticRole: string;
  patternRef: string;
  containedComponents: (string | { archetypeRef: string; repeatCount?: number; instances?: string[] })[];
  overrides?: Record<string, any>;
}

export interface SemanticCompressedPackage {
  $schemaVersion: string;
  metadata: {
    compressedAt: number;
    originalSizeBytes: number;
    compressedSizeBytes: number;
    compressionRatio: string;
    compressionPercentage: number;
    semanticPreservationPercentage: number;
    estimatedReconstructionFidelity: number;
  };
  tokens: {
    colors: Record<string, string>;
    spacing: Record<string, string>;
    radius: Record<string, string>;
    shadows: Record<string, string>;
    typography: Record<string, any>;
    containers: Record<string, string>;
  };
  archetypes: Record<string, any>;
  componentPlacements: Record<string, CompressedComponentInstance>;
  layoutPatterns: Record<string, any>;
  sectionLayouts: CompressedSectionLayout[];
  interactions: Record<string, any>;
  accessibility: any;
  decompressionManifest: {
    tokenLookup: Record<string, string>;
    patternLookup: Record<string, string>;
    archetypeLookup: Record<string, string>;
    repeatCountMap: Record<string, number>;
  };
  report: SemanticCompressionReport;
}

// ============================================================================
// Compiled AI Design Package (Target Output)
// ============================================================================

export interface CompiledDesignPackage {
  $schemaVersion: string;
  metadata: {
    compiledAt: number;
    compilerVersion: string;
    durationMs: number;
    pageUrl: string;
    pageTitle: string;
  };
  designGrammar: SemanticDesignGrammar;
  componentGrammar: SemanticComponentGrammar;
  layoutGrammar: SemanticLayoutGrammar;
  interactionGrammar: SemanticInteractionGrammar;
  accessibilityGrammar: SemanticAccessibilityGrammar;
  reconstructionPlan: ReconstructionPlan;
  semanticCompression?: SemanticCompressedPackage;
  compressionReport?: SemanticCompressionReport;
  diagnostics: CompilerDiagnostic[];
  metrics: CompilerMetrics;
}

