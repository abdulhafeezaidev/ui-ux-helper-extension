/**
 * Agent Design Specification (ADS) Schema Definitions (Prompt 15 Reconstruction Quality & Semantic Abstraction)
 * Strongly-typed models for authoritative design intelligence context consumed by external coding agents.
 */

import {
  BoundingRect,
  SemanticRegionNode,
  SemanticRegionPurpose,
  RegionEntryPoint,
  RegionExitPoint,
  DesignTokenCategory,
  NormalizedDesignToken,
  DesignTokenDictionary,
  FinalReconstructionValidationResult,
  BlueprintNodeType,
  BlueprintLayoutSpec,
  BlueprintConstraintsSpec,
  BlueprintNode,
  ReusableComponentProp,
  ReusableComponentInstance,
  ReusableComponentDefinition,
  UIBlueprintConstraintRule,
  UIBlueprintConstraints,
  UIBlueprintResponsiveRule,
  UIBlueprintInteraction,
  UIBlueprint,
  SemanticDesignToken,
  DesignTokenSet,
  AutoLayoutMode,
  AutoLayoutDistribution,
  AutoLayoutAlignment,
  AutoLayoutSizing,
  LayoutConstraint,
  ComponentSlotDefinition,
  ComponentVariantDefinition,
  ComponentStateDefinition,
  ComponentTokenBinding,
  ComponentLibraryEntry,
  ComponentLibrary,
  LLMReconstructionContextMetrics,
  LLMReconstructionContext,
  AIClonePackageFileEntry,
  AIClonePackageManifest,
  AIClonePackageResult,
} from '../types/schema.ts';

export type {
  SemanticRegionNode,
  SemanticRegionPurpose,
  RegionEntryPoint,
  RegionExitPoint,
  DesignTokenCategory,
  NormalizedDesignToken,
  DesignTokenDictionary,
  SemanticDesignToken,
  DesignTokenSet,
  FinalReconstructionValidationResult,
  BlueprintNodeType,
  BlueprintLayoutSpec,
  BlueprintConstraintsSpec,
  BlueprintNode,
  ReusableComponentProp,
  ReusableComponentInstance,
  ReusableComponentDefinition,
  UIBlueprintConstraintRule,
  UIBlueprintConstraints,
  UIBlueprintResponsiveRule,
  UIBlueprintInteraction,
  UIBlueprint,
  AutoLayoutMode,
  AutoLayoutDistribution,
  AutoLayoutAlignment,
  AutoLayoutSizing,
  LayoutConstraint,
  ComponentSlotDefinition,
  ComponentVariantDefinition,
  ComponentStateDefinition,
  ComponentTokenBinding,
  ComponentLibraryEntry,
  ComponentLibrary,
  LLMReconstructionContextMetrics,
  LLMReconstructionContext,
  AIClonePackageFileEntry,
  AIClonePackageManifest,
  AIClonePackageResult,
};

export type EvidenceClassification = 'observed' | 'derived' | 'inferred';
export type EvidenceProvenance = 'browser-derived' | 'computed' | 'algorithmically-inferred' | 'fallback' | 'NOT_VERIFIED';

export type ComponentCategoryRole =
  | 'semantic-component'
  | 'interactive-control'
  | 'icon-control-primitive'
  | 'structural-wrapper'
  | 'decorative-element';

export interface ADSViewportMetadata {
  width: number;
  height: number;
  devicePixelRatio: number;
  scrollX: number;
  scrollY: number;
  documentWidth: number;
  documentHeight: number;
  visualViewportWidth: number;
  visualViewportHeight: number;
}

export interface ADSDocumentMetadata {
  title: string;
  pageUrl: string;
  timestamp: number;
  viewport: ADSViewportMetadata;
  extractedAt?: number;
  generator?: string;
}

export interface ADSGlobalReference {
  viewport: { width: number; height: number };
  pageBackground: string;
  dominantColors: string[];
  primaryColors: string[];
  textColors: string[];
  borderColors: string[];
  fontFamilies: string[];
  typographyScale: number[];
  spacingScale: number[];
  radiusScale: number[];
  shadowScale: string[];
  containerWidths: number[];
  sectionSpacing: number[];
  surfaceStyles: Record<string, number>;
}

export interface ADSColorReference {
  id: string;
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  alpha: number;
  hsl: { h: number; s: number; l: number };
  frequency: number;
  role: string;
  usageCount: number;
  classification: EvidenceClassification;
  provenance: EvidenceProvenance;
  sourceElementIds: string[];
}

export interface ADSTypographyReference {
  id: string;
  name: string;
  fontFamily: string;
  primaryFont: string;
  fontSizePx: number;
  fontWeight: string;
  lineHeightPx: number;
  letterSpacing: string;
  textTransform: string;
  textDecoration: string;
  textAlign: string;
  frequency: number;
  hierarchyRole: string;
  classification: EvidenceClassification;
  provenance: EvidenceProvenance;
  sourceElementIds: string[];
}

export interface ADSSpacingReference {
  id: string;
  valuePx: number;
  category: string;
  frequency: number;
  classification: EvidenceClassification;
  provenance: EvidenceProvenance;
  sourceElementIds: string[];
}

export interface ADSShapeSurfaceReference {
  radiusScale: { valuePx: number; classification: string }[];
  borderTokens: any[];
  shadowTokens: { rawString: string; isInset: boolean }[];
  gradientTokens: any[];
  surfaceCategories: Record<string, number>;
}

export interface ADSLayoutReference {
  viewportWidth: number;
  viewportHeight: number;
  documentHeight: number;
  containerCount: number;
  flexContainerCount: number;
  gridContainerCount: number;
  spatialRelationCount: number;
  hasHorizontalOverflow: boolean;
}

export interface ADSSectionReference {
  id: string;
  elementId: string;
  structuralType: string;
  semanticClassification: string;
  bounds: BoundingRect;
  layout: {
    display: string;
    position: string;
    flexDirection?: string;
    gridColumns?: number;
    gap?: string;
  };
  container: {
    maxWidth: string;
    width: string;
    centered: boolean;
  };
  isFullWidth: boolean;
  confidence: number;
  confidenceVector?: ADSConfidenceVector;
  evidence: string[];
  componentIds: string[];
  sourceElementIds: string[];
  provenance: EvidenceProvenance;
}

export interface ADSComponentVariantSpec {
  name: string;
  instanceCount: number;
  signature: string;
}

export interface ADSComponentReference {
  id: string;
  familyId: string;
  type: string;
  categoryRole: ComponentCategoryRole;
  instanceCount: number;
  representativeBounds: BoundingRect;
  geometry: {
    avgWidth: number;
    avgHeight: number;
    widthVariance: number;
    heightVariance: number;
    isRealBrowserGeometry: boolean;
  };
  layoutSignature: string;
  visualSignature: string;
  typographySignature: string;
  confidence: number;
  confidenceVector?: ADSConfidenceVector;
  evidence: string[];
  colorRefs: string[];
  typographyRefs: string[];
  sourceElementIds: string[];
  variants: ADSComponentVariantSpec[];
  provenance: EvidenceProvenance;
}

export interface ProductCardMediaSpec {
  primaryImageSrc?: string;
  secondaryImageSrc?: string;
  aspectRatio?: number;
  objectFit?: string;
  objectPosition?: string;
  provenance: EvidenceProvenance;
  sourceElementId?: string;
  sourceSelector?: string;
  evidence?: string[];
  confidence?: number;
}

export interface ProductCardBadgeSpec {
  text?: string;
  type?: string;
  backgroundColor?: string;
  provenance: EvidenceProvenance;
  sourceElementId?: string;
  sourceSelector?: string;
  rawDomText?: string;
  evidence?: string[];
  confidence?: number;
}

export interface ProductCardTitleSpec {
  text?: string;
  fontSize?: string;
  fontWeight?: string;
  provenance: EvidenceProvenance;
  sourceElementId?: string;
  sourceSelector?: string;
  rawDomText?: string;
  evidence?: string[];
  confidence?: number;
}

export interface ProductCardPriceSpec {
  currentPrice?: string;
  originalPrice?: string;
  isOnSale: boolean;
  provenance: EvidenceProvenance;
  sourceElementId?: string;
  sourceSelector?: string;
  rawDomText?: string;
  evidence?: string[];
  confidence?: number;
}

export interface ProductCardRatingSpec {
  ratingValue?: number;
  reviewCount?: number;
  provenance: EvidenceProvenance;
  sourceElementId?: string;
  sourceSelector?: string;
  rawDomText?: string;
  evidence?: string[];
  confidence?: number;
}

export interface ProductCardCtaSpec {
  text?: string;
  type?: string;
  backgroundColor?: string;
  provenance: EvidenceProvenance;
  sourceElementId?: string;
  sourceSelector?: string;
  rawDomText?: string;
  evidence?: string[];
  confidence?: number;
}

export interface ProductCardGeometrySpec {
  width?: number;
  height?: number;
  radius?: string;
  padding?: string;
  provenance: EvidenceProvenance;
  sourceElementId?: string;
  sourceSelector?: string;
  confidence?: number;
}

export interface ProductGridPlacementSpec {
  rows?: number;
  columns?: number;
  trackWidths?: number[];
  trackHeights?: number[];
  columnGap?: string;
  rowGap?: string;
  gap?: string;
  alignment?: string;
  flow?: 'grid' | 'flex-wrap' | 'masonry' | 'single-column' | 'single-row';
  isMasonry?: boolean;
  wrapping?: 'wrap' | 'nowrap';
  provenance: EvidenceProvenance;
  sourceElementId?: string;
  sourceSelector?: string;
  confidence?: number;
}

export interface ADSConfidenceVector {
  browserEvidenceConfidence: number;
  semanticConfidence: number;
  layoutConfidence: number;
  componentConfidence: number;
  assetConfidence: number;
  interactionConfidence: number;
  typographyConfidence: number;
  colorSystemConfidence: number;
  spacingConfidence: number;
  gridConfidence: number;
  overallScore: number;
}

export interface CandidateRejectionReason {
  reason: string;
  count: number;
  sampleSelectors: string[];
}

export interface CanonicalProductCardResolution {
  isCanonical: boolean;
  winningFamilyId?: string;
  dominantSelector?: string;
  candidateScore: number;
  totalCandidatesEvaluated: number;
  rejectedCandidateCount: number;
  rejectionReasons: CandidateRejectionReason[];
  selectionEvidence: string[];
  familyInstanceCount: number;
}

export interface ProductCardSemanticSpec {
  media: ProductCardMediaSpec;
  badge?: ProductCardBadgeSpec;
  title: ProductCardTitleSpec;
  price: ProductCardPriceSpec;
  rating?: ProductCardRatingSpec;
  cta?: ProductCardCtaSpec;
  cardGeometry: ProductCardGeometrySpec;
  gridPlacement: ProductGridPlacementSpec;
  confidenceVector?: ADSConfidenceVector;
  canonicalResolution?: CanonicalProductCardResolution;
}

export interface ADSEvidenceCoverage {
  directBrowserPct: number;
  computedPct: number;
  algorithmicallyInferredPct: number;
  fallbackPct: number;
  unverifiedPct: number;
}

export interface ADSSemanticEvidenceIntegrity {
  fieldsWithSourceIds: number;
  fieldsWithDirectBrowserEvidence: number;
  fieldsUsingFallback: number;
  fieldsUsingPlaceholders: number;
  totalFieldsEvaluated: number;
}

export interface ADSAssetEvidence {
  id: string;
  sourceUrl?: string;
  currentSrc?: string;
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  renderedWidth: number;
  renderedHeight: number;
  aspectRatio: number;
  objectFit?: string;
  objectPosition?: string;
  backgroundImage?: string;
  hasSvg?: boolean;
  svgViewBox?: string;
  provenance: EvidenceProvenance;
  assetCategory?: 'rendered-browser-asset' | 'unrendered-browser-asset' | 'fallback-asset';
  sourceElementIds: string[];
}

export interface ADSComponentRelationships {
  parentChildPairs: { parentId: string; childId: string }[];
  spatialAlignments: { sourceId: string; targetId: string; relation: string }[];
}

export interface ADSDesignPatternReference {
  patternName: string;
  confidence: number;
  evidence: string[];
  supportingComponentIds: string[];
}

export interface ADSViewportStateSpec {
  viewport: string;
  gridColumns?: number;
  containerWidth?: number;
  navigationStyle?: string;
}

export interface ADSResponsiveBehavior {
  desktop: ADSViewportStateSpec;
  mobile: ADSViewportStateSpec;
  observedBreakpoints: string[];
}

export interface ADSInteractionSpec {
  id?: string;
  name: string;
  trigger: string;
  state: string;
  effect: string;
  duration?: number;
  affectedElements?: string[];
  geometryChanges?: string;
  visibilityChanges?: string | boolean;
  overlay?: boolean;
  zIndex?: string;
  bodyScrollBehavior?: string;
  provenance?: EvidenceProvenance;
}

export type ConstraintPriority = 'CRITICAL' | 'IMPORTANT' | 'INFORMATIONAL';
export type ConstraintCategory = 'color' | 'typography' | 'layout' | 'geometry' | 'component';

export interface ADSFidelityConstraints {
  id: string;
  category: ConstraintCategory;
  rule: string;
  priority: ConstraintPriority;
  evidenceStrength: number;
}

export interface AgentDesignSpecification {
  $schemaVersion: string;
  metadata: ADSDocumentMetadata;
  globalSystem: ADSGlobalReference;
  colors: ADSColorReference[];
  typography: ADSTypographyReference[];
  spacing: ADSSpacingReference[];
  shapesAndSurfaces: ADSShapeSurfaceReference;
  layout: ADSLayoutReference;
  sections: ADSSectionReference[];
  semanticRegionTree?: SemanticRegionNode;
  tokenDictionary?: DesignTokenDictionary;
  tokenSet?: DesignTokenSet;
  components: ADSComponentReference[];
  productCardSpec?: ProductCardSemanticSpec;
  canonicalProductCard?: CanonicalProductCardResolution;
  assetEvidence: ADSAssetEvidence[];
  relationships: ADSComponentRelationships;
  responsiveBehavior?: ADSResponsiveBehavior;
  interactions?: ADSInteractionSpec[];
  designPatterns: ADSDesignPatternReference[];
  fidelityConstraints: ADSFidelityConstraints[];
  implementationGuidance: string[];
  evidenceCoverage?: ADSEvidenceCoverage;
  evidenceIntegrity?: ADSSemanticEvidenceIntegrity;
  confidence?: number;
  confidenceVector?: ADSConfidenceVector;
}
