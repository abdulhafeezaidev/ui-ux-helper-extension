/**
 * Schema definitions for raw extraction data models and normalized design tokens.
 * Separates raw browser computed values from normalized design tokens.
 */

export interface PageMetadata {
  url: string;
  title: string;
  viewport: {
    width: number;
    height: number;
  };
  devicePixelRatio: number;
}

export interface ElementRef {
  id: string;
  selector: string;
  tagName: string;
  className: string;
}

export interface BoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoxSpacing {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export interface BorderCornerRadius {
  topLeft: string;
  topRight: string;
  bottomRight: string;
  bottomLeft: string;
}

export interface LayoutProperties {
  display: string;
  position: string;
  zIndex: string;
  overflow: {
    x: string;
    y: string;
  };
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  alignContent?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridAutoFlow?: string;
  gridAutoColumns?: string;
  gridAutoRows?: string;
  placeItems?: string;
  placeContent?: string;
  alignSelf?: string;
  justifySelf?: string;
  inset?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  gap: {
    row: string;
    column: string;
  };
}

export interface TextMetadata {
  hasText: boolean;
  textLength: number;
  trimmedText: string;
  isDirectText: boolean;
}

export interface RawTypographyProps {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  wordSpacing?: string;
  textTransform: string;
  textDecoration: string;
  textAlign: string;
  textWrap?: string;
  textOverflow?: string;
  whiteSpace?: string;
}

export interface RawSurfaceProps {
  backgroundImage: string;
  backdropFilter: string;
  filter: string;
  boxSizing: string;
}

export interface RawAssetProps {
  currentSrc?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  objectFit?: string;
  objectPosition?: string;
  backgroundImage?: string;
  hasSvg?: boolean;
  svgViewBox?: string;
  svgOuterHtml?: string;
  svgInnerMarkup?: string;
  srcset?: string;
  alt?: string;
}

export interface RawTransitionProps {
  property: string;
  duration: string;
  timingFunction: string;
  delay: string;
  rawString: string;
}

export interface RawAnimationProps {
  name: string;
  duration: string;
  timingFunction: string;
  delay: string;
  iterationCount: string;
  direction: string;
  rawString: string;
}

export interface RawInteractiveProps {
  isClickable: boolean;
  cursor: string;
  href?: string;
  tabIndex?: number;
  ariaRole?: string | null;
  ariaLabel?: string | null;
  ariaExpanded?: boolean | null;
  ariaHidden?: boolean | null;
  ariaSelected?: boolean | null;
  ariaControls?: string | null;
  hasFormControls?: boolean;
}

export interface RawDimensionalConstraints {
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  aspectRatio?: string;
  flexGrow?: string;
  flexShrink?: string;
  flexBasis?: string;
  alignSelf?: string;
  justifySelf?: string;
}

export interface RawElementNode {
  id: string;
  tagName: string;
  className?: string;
  role: string | null;
  boundingRect: BoundingRect;
  isVisible: boolean;
  display: string;
  position: string;
  zIndex: string;
  parentId: string | null;
  childIds: string[];
  textMeta: TextMetadata;
  typography: RawTypographyProps;
  surface: RawSurfaceProps;
  backgroundColor: string;
  color: string;
  opacity: number;
  borderWidths: BoxSpacing;
  borderStyles: BoxSpacing;
  borderColors: BoxSpacing;
  borderRadius: BorderCornerRadius;
  boxShadow: string;
  transform: string;
  overflow: {
    x: string;
    y: string;
  };
  padding: BoxSpacing;
  margin: BoxSpacing;
  gap: {
    row: string;
    column: string;
  };
  layoutProps: LayoutProperties;
  assetProps?: RawAssetProps;
  transitions?: RawTransitionProps;
  animations?: RawAnimationProps;
  interactive?: RawInteractiveProps;
  constraints?: RawDimensionalConstraints;
  pseudoStyles?: {
    before?: Record<string, string>;
    after?: Record<string, string>;
  };
  isolation?: string;
  mixBlendMode?: string;
  filter?: string;
  willChange?: string;
  contain?: string;
  backdropFilter?: string;
  perspective?: string;
  clipPath?: string;
}

export interface RawExtractionResult {
  pageMeta: PageMetadata;
  elements: RawElementNode[];
  totalExtracted: number;
  visibleCount: number;
  timestamp: number;
}

// Color Normalization & Design Token Schemas

export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface CanonicalColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
  hex: string; // e.g. #8b5cf6
  rgbString: string; // e.g. rgb(139, 92, 246)
  hsl: HSLColor;
}

export type ColorUsageCategory = 'background' | 'text' | 'border' | 'accent' | 'cta';

export interface ColorToken {
  id: string;
  color: CanonicalColor;
  frequency: number;
  usageCount: {
    background: number;
    text: number;
    border: number;
    cta: number;
  };
  usages: ColorUsageCategory[];
  luminance: number;
  isDark: boolean;
}

export interface SemanticColorRoles {
  pageBackground?: ColorToken;
  surfaceBackground?: ColorToken;
  primaryText?: ColorToken;
  secondaryText?: ColorToken;
  border?: ColorToken;
  primaryAccent?: ColorToken;
  secondaryAccent?: ColorToken;
  interactiveCTA?: ColorToken;
}

export interface ColorContrastPair {
  bgTokenId: string;
  fgTokenId: string;
  contrastRatio: number;
  isWCAGAA: boolean;
  isWCAGAAA: boolean;
}

export interface NormalizedColorSystem {
  tokens: ColorToken[];
  dominantColors: ColorToken[];
  roles: SemanticColorRoles;
  contrastPairs: ColorContrastPair[];
  stats: {
    rawColorCount: number;
    normalizedColorCount: number;
    transparentCount: number;
  };
}

// Typography Normalization & Token Schemas

export interface FontFamilyStack {
  name: string; // Clean unquoted stack string
  primary: string; // First family in stack (e.g. Inter)
  fallbacks: string[];
  usageCount: number;
}

export interface TypographyToken {
  id: string;
  fontFamily: string;
  primaryFamily: string;
  fontSizePx: number;
  fontWeight: number;
  lineHeightPx: number | 'normal';
  letterSpacing: string;
  textTransform: string;
  textAlign: string;
  frequency: number;
  semanticRole?: string;
}

export interface TypographyHierarchy {
  heroDisplay?: TypographyToken;
  h1?: TypographyToken;
  h2?: TypographyToken;
  h3?: TypographyToken;
  h4?: TypographyToken;
  h5?: TypographyToken;
  h6?: TypographyToken;
  body?: TypographyToken;
  secondaryBody?: TypographyToken;
  buttonText?: TypographyToken;
  caption?: TypographyToken;
}

export interface NormalizedTypographySystem {
  fontFamilies: FontFamilyStack[];
  tokens: TypographyToken[];
  hierarchy: TypographyHierarchy;
  stats: {
    rawTextElementCount: number;
    uniqueTokenCount: number;
    fontFamilyCount: number;
  };
}

// Shape, Border, Shadow, Gradient & Surface Schemas

export type GeometryClassification =
  | 'sharp'
  | 'slightlyRounded'
  | 'rounded'
  | 'highlyRounded'
  | 'pill'
  | 'circular'
  | 'elliptical'
  | 'asymmetric';

export interface RadiusToken {
  id: string;
  valuePx: number;
  classification: GeometryClassification;
  frequency: number;
}

export interface BorderToken {
  id: string;
  width: string;
  style: string;
  color: string;
  frequency: number;
}

export interface ParsedShadow {
  offsetXPx: number;
  offsetYPx: number;
  blurPx: number;
  spreadPx: number;
  color: string;
  alpha: number;
  isInset: boolean;
}

export interface ShadowToken {
  id: string;
  shadow: ParsedShadow;
  rawString: string;
  frequency: number;
}

export interface GradientStop {
  color: string;
  position?: string;
}

export interface GradientToken {
  id: string;
  type: 'linear' | 'radial' | 'conic';
  angleOrDirection: string;
  stops: GradientStop[];
  rawString: string;
  frequency: number;
}

export type SurfaceCategory =
  | 'flat'
  | 'bordered'
  | 'elevated'
  | 'translucent'
  | 'glassLike'
  | 'inset'
  | 'gradient'
  | 'glowing';

export interface NormalizedShapeSystem {
  radiusScale: RadiusToken[];
  borderTokens: BorderToken[];
  shadowTokens: ShadowToken[];
  gradientTokens: GradientToken[];
  surfaceCounts: Record<SurfaceCategory, number>;
  geometryCounts: Record<GeometryClassification, number>;
  stats: {
    totalSurfacesAnalyzed: number;
    uniqueRadiusCount: number;
    uniqueBorderCount: number;
    uniqueShadowCount: number;
    gradientCount: number;
  };
}

// Spatial Layout & Structural Schemas

export type FlexGroupType =
  | 'horizontalGroup'
  | 'verticalGroup'
  | 'centeredGroup'
  | 'distributedGroup';

export interface FlexLayoutDetail {
  elementId: string;
  direction: string;
  wrap: string;
  justifyContent: string;
  alignItems: string;
  gap: string;
  groupType: FlexGroupType;
  childCount: number;
}

export interface GridLayoutDetail {
  elementId: string;
  columns: string;
  rows: string;
  columnCount: number;
  rowCount: number;
  gap: string;
  childCount: number;
  trackWidths?: number[];
  trackHeights?: number[];
  columnGap?: string;
  rowGap?: string;
  alignment?: string;
  flow?: 'grid' | 'flex-wrap' | 'masonry' | 'single-column' | 'single-row';
  isMasonry?: boolean;
  wrapping?: 'wrap' | 'nowrap';
}

export type SpatialRelationType =
  | 'above'
  | 'below'
  | 'leftOf'
  | 'rightOf'
  | 'contains'
  | 'alignedLeft'
  | 'alignedRight'
  | 'centered'
  | 'sameWidth'
  | 'sameHeight'
  | 'overlapping';

export interface SpatialRelation {
  sourceId: string;
  targetId: string;
  relation: SpatialRelationType;
}

export interface SpacingToken {
  id: string;
  valuePx: number;
  category: 'padding' | 'margin' | 'gap';
  frequency: number;
}

export interface LayoutContainerToken {
  id: string;
  elementId: string;
  display: string;
  isFullWidth: boolean;
  isCenteredContainer: boolean;
  maxWidth: string;
  childCount: number;
}

export interface LayoutSectionNode {
  id: string;
  elementId: string;
  bounds: BoundingRect;
  isFullWidth: boolean;
  childCount: number;
}

export interface NormalizedLayoutSystem {
  containers: LayoutContainerToken[];
  flexLayouts: FlexLayoutDetail[];
  gridLayouts: GridLayoutDetail[];
  spatialRelations: SpatialRelation[];
  spacingScale: SpacingToken[];
  sections: LayoutSectionNode[];
  viewport: {
    width: number;
    height: number;
    documentHeight: number;
    hasHorizontalOverflow: boolean;
  };
  stats: {
    containerCount: number;
    flexCount: number;
    gridCount: number;
    sectionCount: number;
    relationCount: number;
  };
}

// Component & Design Pattern Schemas

export type ComponentType =
  | 'navigation'
  | 'hero'
  | 'button'
  | 'iconButton'
  | 'card'
  | 'cardGroup'
  | 'form'
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkboxRadio'
  | 'modal'
  | 'badge'
  | 'avatar'
  | 'imageMedia'
  | 'list'
  | 'gridGroup'
  | 'footer'
  | 'contentSection'
  | 'table'
  | 'tabs'
  | 'accordion'
  | 'pagination'
  | 'callout'
  | 'generic';

export interface UIComponentCandidate {
  id: string;
  type: ComponentType;
  confidence: number; // 0.0 - 1.0
  rootElementId: string;
  childElementIds: string[];
  bounds: BoundingRect;
  evidence: string[];
  colorTokenRefs: string[];
  typographyTokenRefs: string[];
  shapeTokenRefs: string[];
}

export interface ComponentFamily {
  familyId: string;
  type: ComponentType;
  instanceCount: number;
  instanceElementIds: string[];
  sharedColorTokens: string[];
  sharedTypoTokens: string[];
  evidence: string[];
}

export type SemanticSectionType =
  | 'navigation'
  | 'hero'
  | 'featureSection'
  | 'contentSection'
  | 'gallerySection'
  | 'formSection'
  | 'testimonialSection'
  | 'pricingSection'
  | 'ctaSection'
  | 'footer'
  | 'genericSection';

export type SemanticRegionPurpose =
  | 'page'
  | 'header'
  | 'announcement-bar'
  | 'primary-navigation'
  | 'secondary-navigation'
  | 'hero'
  | 'category-section'
  | 'featured-products'
  | 'product-grid'
  | 'newsletter'
  | 'footer'
  | 'content-section';

export interface RegionEntryPoint {
  elementId: string;
  selector: string;
  tagName: string;
  y: number;
}

export interface RegionExitPoint {
  bottomY: number;
  y: number;
  boundaryElementId?: string;
}

export interface SemanticRegionNode {
  id: string;
  semanticPurpose: SemanticRegionPurpose;
  entryPoint: RegionEntryPoint;
  exitPoint: RegionExitPoint;
  bounds: { x: number; y: number; width: number; height: number };
  parent: string | null;
  children: SemanticRegionNode[];
  confidence: number;
  sourceIds: string[];
  evidence: string[];
}

export interface SemanticSection {
  id: string;
  elementId: string;
  sectionType: SemanticSectionType;
  confidence: number;
  evidence: string[];
  componentIds: string[];
}

export interface UIDesignPattern {
  patternType: string;
  confidence: number;
  supportingComponentIds: string[];
  evidence: string[];
}

export interface NormalizedComponentSystem {
  components: UIComponentCandidate[];
  families: ComponentFamily[];
  sections: SemanticSection[];
  regionTree?: SemanticRegionNode;
  patterns: UIDesignPattern[];
  stats: {
    totalComponents: number;
    familyCount: number;
    sectionCount: number;
    patternCount: number;
  };
}

export type DesignTokenCategory =
  | 'color'
  | 'typography'
  | 'spacing'
  | 'radius'
  | 'shadow'
  | 'border'
  | 'animation'
  | 'opacity'
  | 'z-index'
  | 'container'
  | 'breakpoint';

export interface NormalizedDesignToken<T = any> {
  name: string;
  category: DesignTokenCategory;
  value: T;
  type: string;
  rawValues: string[];
  usageCount: number;
  confidence: number;
  description?: string;
}

export interface DesignTokenDictionary {
  version: string;
  colors: NormalizedDesignToken<string>[];
  typography: {
    fontFamilies: NormalizedDesignToken<string>[];
    fontSizes: NormalizedDesignToken<number>[];
    fontWeights: NormalizedDesignToken<number>[];
    lineHeights: NormalizedDesignToken<number | string>[];
    letterSpacings: NormalizedDesignToken<string>[];
  };
  spacing: NormalizedDesignToken<number>[];
  radius: NormalizedDesignToken<number | string>[];
  shadows: NormalizedDesignToken<string>[];
  borders: NormalizedDesignToken<{ width: string; style: string; color: string }>[];
  animations: NormalizedDesignToken<{ duration: string; timingFunction: string; property?: string }>[];
  opacities: NormalizedDesignToken<number>[];
  zIndices: NormalizedDesignToken<number>[];
  containerWidths: NormalizedDesignToken<number>[];
  breakpoints: NormalizedDesignToken<number>[];
  stats: {
    totalTokens: number;
    categoryCounts: Record<string, number>;
  };
}

// ==========================================
// SEMANTIC DESIGN TOKEN SET (Prompt 22)
// ==========================================

export interface SemanticDesignToken<T = any> {
  id: string;
  semanticName: string; // e.g. "Color.Primary.Text", "Spacing.M", "Radius.Small", "Typography.Body"
  category: 'color' | 'typography' | 'spacing' | 'radius' | 'shadow' | 'border' | 'opacity' | 'zIndex';
  role: string; // e.g. "primary-text", "page-background", "standard-spacing", "card-radius"
  value: T;
  cssVariable: string; // e.g. "--color-primary-text", "--spacing-m"
  isDominant: boolean;
  rawAliases: string[];
  usageCount: number;
  provenance: 'browser-derived' | 'computed' | 'algorithmically-inferred' | 'fallback' | 'NOT_VERIFIED';
  sourceElementIds: string[];
  confidence: number;
}

export interface DesignTokenSet {
  version: '1.0.0';
  tokens: Record<string, SemanticDesignToken>; // Keyed by semantic name e.g. "Color.Primary.Text"
  byCategory: {
    colors: SemanticDesignToken<string>[];
    typography: SemanticDesignToken<any>[];
    spacing: SemanticDesignToken<number>[];
    radius: SemanticDesignToken<number | string>[];
    shadows: SemanticDesignToken<string>[];
    borders: SemanticDesignToken<any>[];
    opacities: SemanticDesignToken<number>[];
    zIndices: SemanticDesignToken<number>[];
  };
  dominantTokens: {
    primaryText: SemanticDesignToken<string>;
    pageBackground: SemanticDesignToken<string>;
    brandAccent?: SemanticDesignToken<string>;
    baseFontFamily: SemanticDesignToken<string>;
    bodyTypography: SemanticDesignToken<any>;
    baseSpacing: SemanticDesignToken<number>;
  };
  stats: {
    totalTokens: number;
    mergedDuplicatesCount: number;
    dominantValueCount: number;
  };
}

export interface FinalReconstructionValidationResult {
  reconstructionScore: number; // 0 - 100
  verdict: 'RECONSTRUCTION_READY' | 'CONDITIONAL_RECONSTRUCTION' | 'RECONSTRUCTION_BLOCKED';
  completenessVector: {
    semantic: number;
    geometry: number;
    layout: number;
    typography: number;
    spacing: number;
    component: number;
    interaction: number;
    asset: number;
    evidence: number;
  };
  missingFields: {
    critical: string[];
    optional: string[];
  };
  weakEvidence: {
    field: string;
    confidence: number;
    reason: string;
  }[];
  unsafeInference: {
    field: string;
    risk: 'high' | 'medium' | 'low';
    explanation: string;
  }[];
  confidenceHeatmap: {
    dimension: string;
    score: number;
    status: 'EXCELLENT' | 'ADEQUATE' | 'DEFICIENT' | 'CRITICAL';
    evidenceCount: number;
  }[];
  diagnosticReport: string;
}

export interface AnalysisSession {
  sessionId: string;
  startTime: number;
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  pageMeta: PageMetadata;
  rawResult?: RawExtractionResult;
  colorSystem?: NormalizedColorSystem;
  typographySystem?: NormalizedTypographySystem;
  shapeSystem?: NormalizedShapeSystem;
  layoutSystem?: NormalizedLayoutSystem;
  componentSystem?: NormalizedComponentSystem;
}

// ==========================================
// UI BLUEPRINT SCHEMA DEFINITIONS (Prompt 21)
// ==========================================

export type BlueprintNodeType =
  | 'page'
  | 'region'
  | 'section'
  | 'container'
  | 'component_instance'
  | 'atomic';

export type AutoLayoutMode = 'row' | 'column' | 'grid' | 'wrap' | 'absolute';
export type AutoLayoutDistribution = 'start' | 'center' | 'space-between' | 'space-around' | 'stretch' | 'end';
export type AutoLayoutAlignment = 'start' | 'center' | 'stretch' | 'end' | 'baseline';
export type AutoLayoutSizing = 'fixed' | 'hug' | 'fill';

export interface LayoutConstraint {
  id?: string;
  target?: string;
  layoutMode: AutoLayoutMode;
  distribution: AutoLayoutDistribution;
  crossAlignment: AutoLayoutAlignment;
  horizontalSizing: AutoLayoutSizing;
  verticalSizing: AutoLayoutSizing;
  dimensions: {
    width?: string;
    height?: string;
    minWidth?: string;
    maxWidth?: string;
    minHeight?: string;
    maxHeight?: string;
  };
  flex?: {
    basis?: string;
    grow?: number;
    shrink?: number;
    wrap?: 'wrap' | 'nowrap';
  };
  spacing: {
    padding: { top: number; right: number; bottom: number; left: number };
    margin: { top: number; right: number; bottom: number; left: number };
    gap: { primary: number; counter: number; combined: string };
  };
  grid?: {
    columns: number;
    rows: number;
    trackWidths: number[];
    columnGap: string;
    rowGap: string;
  };
  confidence: number;
  provenance: 'browser-derived' | 'computed' | 'algorithmically-inferred';
}

export interface BlueprintLayoutSpec {
  display: 'flex' | 'grid' | 'block' | 'inline-block' | 'stack';
  direction?: 'horizontal' | 'vertical';
  alignment?: {
    horizontal?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
    vertical?: 'start' | 'center' | 'end' | 'stretch';
  };
  autoLayout?: LayoutConstraint;
  grid?: {
    columns: number;
    rows?: number;
    columnGap?: string;
    rowGap?: string;
    flow?: string;
  };
  dimensions?: {
    width?: string | number;
    maxWidth?: string | number;
    height?: string | number;
    minHeight?: string | number;
  };
  spacing?: {
    padding?: { top?: string; right?: string; bottom?: string; left?: string };
    margin?: { top?: string; right?: string; bottom?: string; left?: string };
    gap?: string;
  };
}

export interface BlueprintConstraintsSpec {
  sticky?: boolean;
  fullWidth?: boolean;
  aspectRatio?: number;
  fixedPosition?: 'top' | 'bottom' | 'none';
  overflow?: 'hidden' | 'visible' | 'scroll';
  zIndex?: number;
}

export interface BlueprintNode {
  id: string;
  name: string;
  type: BlueprintNodeType;
  componentRef?: string;
  props?: Record<string, any>;
  layout: BlueprintLayoutSpec;
  constraints: BlueprintConstraintsSpec;
  children: BlueprintNode[];
  evidenceIds: string[];
}

export interface ReusableComponentProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'image' | 'url' | 'color';
  required: boolean;
  default?: any;
}

export interface ReusableComponentInstance {
  id: string;
  props: Record<string, any>;
  evidenceIds: string[];
}

export interface ReusableComponentDefinition {
  name: string;
  role: string;
  schema: {
    props: ReusableComponentProp[];
  };
  template: {
    structure: string;
    layout: BlueprintLayoutSpec;
    constraints: BlueprintConstraintsSpec;
  };
  instanceCount: number;
  instances: ReusableComponentInstance[];
  evidenceIds: string[];
}

export interface UIBlueprintConstraintRule {
  target: string;
  property: string;
  rule: string;
  responsive?: {
    desktop?: string | number;
    tablet?: string | number;
    mobile?: string | number;
  };
}

export interface UIBlueprintConstraints {
  viewport: {
    minWidth: number;
    maxWidth: number;
    breakpoints: {
      mobile: number;
      tablet: number;
      desktop: number;
      wide: number;
    };
  };
  rules: UIBlueprintConstraintRule[];
}

export interface UIBlueprintResponsiveRule {
  breakpoint: 'desktop' | 'tablet' | 'mobile';
  containerWidth: string;
  gridColumns: Record<string, number>;
  navigationStyle: 'horizontal' | 'drawer' | 'dropdown';
}

export interface UIBlueprintInteraction {
  trigger: 'hover' | 'click' | 'focus' | 'scroll';
  target: string;
  effect: string;
  animation?: {
    duration: string;
    timingFunction: string;
  };
}

export interface ComponentSlotDefinition {
  name: string;
  description: string;
  allowedChildren?: string[];
  required?: boolean;
}

export interface ComponentVariantDefinition {
  name: string;
  type: 'style' | 'size' | 'layout' | 'behavior';
  values: string[];
  defaultValue: string;
}

export interface ComponentStateDefinition {
  name: 'default' | 'hover' | 'active' | 'focus' | 'disabled' | 'loading' | 'open' | 'closed' | 'selected';
  styleOverrides?: Record<string, string>;
  tokenOverrides?: Record<string, string>;
}

export interface ComponentTokenBinding {
  property: string;
  tokenRef: string;
  fallbackValue?: string;
}

export interface ComponentLibraryEntry {
  id: string;
  name: 'Button' | 'ProductCard' | 'Navbar' | 'Hero' | 'Footer' | 'Carousel' | 'Badge' | 'Accordion' | 'Tabs' | 'Modal' | string;
  role: string;
  category: 'primitive' | 'composite' | 'layout-region' | 'overlay';
  variants: ComponentVariantDefinition[];
  slots: ComponentSlotDefinition[];
  props: ReusableComponentProp[];
  states: ComponentStateDefinition[];
  constraints: BlueprintConstraintsSpec;
  tokens: ComponentTokenBinding[];
  interactions: UIBlueprintInteraction[];
  instances: ReusableComponentInstance[];
  templateStructure: string;
  evidenceIds: string[];
}

export interface ComponentLibrary {
  version: '1.0.0';
  targetTitle: string;
  totalComponents: number;
  components: Record<string, ComponentLibraryEntry>;
  evidenceLineage: {
    totalInstances: number;
    evidenceCoverage: number;
  };
}

export interface UIBlueprint {
  version: '1.0.0';
  target: {
    title: string;
    url: string;
    documentDimensions: {
      width: number;
      height: number;
      devicePixelRatio: number;
    };
  };
  layoutTree: BlueprintNode;
  components: Record<string, ReusableComponentDefinition>;
  componentLibrary?: ComponentLibrary;
  designTokens: DesignTokenDictionary;
  designTokenSet?: DesignTokenSet;
  constraints: UIBlueprintConstraints;
  responsiveRules: UIBlueprintResponsiveRule[];
  interactionModel: {
    interactions: UIBlueprintInteraction[];
  };
  metadata: {
    generator: string;
    blueprintTimestamp: number;
    totalNodes: number;
    totalReusableComponents: number;
    evidenceCoverage: number;
  };
}

export interface LLMReconstructionContextMetrics {
  rawAdsBytes: number;
  rawAdsTokensEst: number;
  blueprintBytes: number;
  blueprintTokensEst: number;
  compressedContextBytes: number;
  compressedContextTokensEst: number;
  compressionRatio: number;
  tokenReductionPercent: number;
  reconstructionFidelityScore: number;
}

export interface LLMReconstructionContext {
  version: '1.0.0';
  target: {
    title: string;
    url: string;
    viewport: string;
  };
  compactPromptContext: string;
  metrics: LLMReconstructionContextMetrics;
}

export interface AIClonePackageFileEntry {
  path: string;
  bytes: number;
  mimeType: string;
  role: string;
  description: string;
}

export interface AIClonePackageManifest {
  generator: string;
  version: string;
  generatedAt: string;
  targetUrl: string;
  title: string;
  viewport: string;
  browser: string;
  adsVersion: string;
  fidelityScore?: number;
  totalFiles: number;
  totalBytes: number;
  files: AIClonePackageFileEntry[];
}

export interface AIClonePackageResult {
  manifest: AIClonePackageManifest;
  readme: string;
  files: Record<string, string>;
  zipBuffer: Uint8Array;
  base64: string;
}

// AI Clone Package V3 (Semantic Compiler Package Architecture)

export interface PackageV3AuditReport {
  originalLineCount: number;
  newLineCount: number;
  compressionPercentage: number;
  estimatedTokenReduction: number;
  expectedAIReconstructionFidelity: number;
  fileBreakdown: Record<string, {
    lineCount: number;
    byteSize: number;
    description: string;
  }>;
}

export interface AIClonePackageV3Manifest {
  generator: string;
  version: string;
  packageArchitecture: string;
  generatedAt: string;
  targetUrl: string;
  title: string;
  totalFiles: number;
  totalLines: number;
  totalBytes: number;
  auditReport: PackageV3AuditReport;
  files: AIClonePackageFileEntry[];
}

export interface AIClonePackageV3Result {
  manifest: AIClonePackageV3Manifest;
  files: Record<string, string>;
  zipBuffer: Uint8Array;
  base64: string;
  auditReport: PackageV3AuditReport;
}


// Rendering Order & Stacking Context Schemas (Prompt: 11_render_tree.json)

export type PaintLayerBand =
  | 'background'
  | 'negative-z'
  | 'block'
  | 'float'
  | 'inline'
  | 'positioned-zero'
  | 'positive-z'
  | 'fixed-sticky'
  | 'overlay';

export interface RenderTreeNode {
  elementId: string;
  parentId: string | null;
  renderOrder: number;
  stackingContextId: string;
  createsStackingContext: boolean;
  positionedAncestor: string | null;
  zIndex: number | 'auto';
  overflow: {
    x: string;
    y: string;
    isClipping: boolean;
  };
  clippingParent: string | null;
  paintLayer: PaintLayerBand;
  compositingReason?: string[];
  browserEvidence: string[];
}

export interface StackingContextInfo {
  id: string;
  rootElementId: string;
  parentContextId: string | null;
  reason: string[];
  childContextIds: string[];
  zIndex: number | 'auto';
  isFixedOrSticky: boolean;
  isOverlay: boolean;
}

export interface RenderTreeSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
    viewport: {
      width: number;
      height: number;
      devicePixelRatio: number;
    };
  };
  summary: {
    totalNodes: number;
    totalStackingContexts: number;
    fixedStickyLayersCount: number;
    overlayLayersCount: number;
    maxZIndex: number;
    minZIndex: number;
  };
  stackingContextHierarchy: StackingContextInfo[];
  renderTree: RenderTreeNode[];
  paintOrderSequence: {
    renderOrder: number;
    elementId: string;
    tagName: string;
    stackingContextId: string;
    zIndex: number | 'auto';
    paintLayer: PaintLayerBand;
    selector?: string;
  }[];
  layerBreakdown: {
    backgroundCount: number;
    negativeZCount: number;
    blockCount: number;
    floatCount: number;
    inlineCount: number;
    positionedZeroCount: number;
    positiveZCount: number;
    fixedStickyCount: number;
    overlayCount: number;
  };
  metadata: {
    generatedAt: string;
    extractorVersion: string;
    guidanceForAI: string[];
  };
}

// Layout Constraint Schemas (Prompt: 12_constraints.json)

export interface ContainerConstraintDefinition {
  id: string;
  display: string;
  flex?: {
    direction: string;
    wrap: string;
    justifyContent: string;
    alignItems: string;
    alignContent: string;
  };
  grid?: {
    templateColumns: string;
    templateRows: string;
    autoFlow: string;
    autoColumns: string;
    autoRows: string;
    placeItems: string;
    placeContent: string;
  };
  gap: {
    row: string;
    column: string;
    raw: string;
  };
  dimensions: {
    minWidth: string;
    maxWidth: string;
    minHeight: string;
    maxHeight: string;
    aspectRatio: string;
  };
  box: {
    padding: BoxSpacing;
    margin: BoxSpacing;
    overflow: {
      x: string;
      y: string;
      isClipping: boolean;
    };
  };
  positioning: {
    position: string;
    inset: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
  };
  tailwindEquivalents: string[];
}

export interface ContainerReferenceNode {
  containerId: string;
  elementId: string;
  selector: string;
  tagName: string;
  semanticRole: string;
  constraintRef: string;
  parentContainerId: string | null;
  childContainerIds: string[];
  nestingDepth: number;
  layoutModel: 'flex' | 'grid' | 'block' | 'sticky' | 'fixed' | 'absolute' | 'flow';
  inferredPurpose: string;
  reconstructionGuidance: string;
}

export interface ItemConstraintSpec {
  elementId: string;
  parentContainerId: string;
  flexGrow?: string;
  flexShrink?: string;
  flexBasis?: string;
  alignSelf?: string;
  justifySelf?: string;
  gridColumn?: string;
  gridRow?: string;
  order?: number;
  tailwindClasses: string[];
}

export interface LayoutConstraintSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
    viewport: {
      width: number;
      height: number;
      devicePixelRatio: number;
    };
  };
  summary: {
    totalContainers: number;
    uniqueConstraintSignatures: number;
    deduplicationRatio: number;
    layoutModelDistribution: {
      flexCount: number;
      gridCount: number;
      blockCount: number;
      positionedCount: number;
    };
  };
  constraintRegistry: Record<string, ContainerConstraintDefinition>;
  containers: ContainerReferenceNode[];
  itemConstraints: ItemConstraintSpec[];
  metadata: {
    generatedAt: string;
    extractorVersion: string;
    guidanceForAI: string[];
  };
}

// Responsive Transition Engine Schemas (Prompt: 13_responsive.json)

export type TargetViewportWidth = 1440 | 1280 | 1024 | 768 | 640 | 480 | 375;

export interface ViewportLayoutState {
  viewport: TargetViewportWidth;
  name: 'desktop-large' | 'desktop' | 'tablet-landscape' | 'tablet-portrait' | 'mobile-large' | 'mobile-medium' | 'mobile-small';
  containerWidth: string;
  containerPadding: string;
  gridColumns: {
    productGrid: number;
    featureGrid: number;
    footerGrid: number;
    defaultGrid: number;
  };
  gaps: {
    sectionGapPx: number;
    gridGapPx: number;
    rowGap: string;
    columnGap: string;
  };
  fontScaling: {
    h1Px: number;
    h2Px: number;
    h3Px: number;
    bodyPx: number;
    smallPx: number;
  };
  spacingChanges: {
    sectionPaddingPx: number;
    containerPaddingPx: number;
    cardPaddingPx: number;
    pagePaddingPx: number;
  };
  hiddenElements: string[];
  reorderedElements: {
    elementId: string;
    selector: string;
    visualOrder: number;
    cssOrder?: number;
  }[];
  menuTransformation: {
    mode: 'horizontal-bar' | 'compact-bar' | 'drawer-hamburger' | 'bottom-bar';
    isDrawer: boolean;
    isHamburger: boolean;
  };
  imageResizing: {
    heroMode: 'side-by-side' | 'full-width' | 'background';
    cardAspectRatio: number;
    objectFit: 'cover' | 'contain';
  };
  layoutTransitions: {
    containerId: string;
    selector: string;
    layoutModel: 'flex' | 'grid' | 'block';
    direction: 'row' | 'column';
  }[];
}

export interface GridColumnTransition {
  containerId: string;
  selector: string;
  fromColumns: number;
  toColumns: number;
  delta: number;
  tailwindClass: string;
}

export interface GapTransition {
  containerId: string;
  selector: string;
  fromGap: string;
  toGap: string;
  tailwindClass: string;
}

export interface FontScalingTransition {
  role: string;
  fromPx: number;
  toPx: number;
  scaleRatio: number;
  clampFormula: string;
  tailwindClass: string;
}

export interface SpacingTransition {
  property: string;
  fromPx: number;
  toPx: number;
  tailwindClass: string;
}

export interface HiddenElementDelta {
  elementId: string;
  selector: string;
  state: 'hidden' | 'visible';
  triggerReason: string;
}

export interface ReorderDelta {
  elementId: string;
  selector: string;
  fromOrder: number;
  toOrder: number;
  rule: string;
}

export interface MenuTransformationDelta {
  menuId: string;
  fromMode: string;
  toMode: string;
  isCollapsing: boolean;
  triggerSelector?: string;
}

export interface ImageResizingDelta {
  imageId: string;
  fromMode: string;
  toMode: string;
  fromAspectRatio: number;
  toAspectRatio: number;
}

export interface LayoutDirectionTransition {
  containerId: string;
  selector: string;
  fromDirection: 'row' | 'column';
  toDirection: 'row' | 'column';
  tailwindClass: string;
}

export interface TransitionEdgeDelta {
  step: string;
  fromViewport: TargetViewportWidth;
  toViewport: TargetViewportWidth;
  triggerBreakpoint: number;
  humanSummary: string;
  gridColumnTransitions: GridColumnTransition[];
  gapTransitions: GapTransition[];
  fontScalingTransitions: FontScalingTransition[];
  spacingTransitions: SpacingTransition[];
  hiddenElementDeltas: HiddenElementDelta[];
  reorderDeltas: ReorderDelta[];
  menuTransformations: MenuTransformationDelta[];
  imageResizingDeltas: ImageResizingDelta[];
  layoutDirectionTransitions: LayoutDirectionTransition[];
  recommendedTailwindClasses: string[];
}

export interface ResponsiveTransitionSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalViewportsTested: number;
    totalTransitionEdges: number;
    targetBreakpoints: TargetViewportWidth[];
    hasNavigationCollapse: boolean;
    hasGridColumnStepDown: boolean;
    hasFluidTypographyScaling: boolean;
  };
  viewports: Record<TargetViewportWidth, ViewportLayoutState>;
  transitionGraph: TransitionEdgeDelta[];
  metadata: {
    generatedAt: string;
    extractorVersion: string;
    guidanceForAI: string[];
  };
}

// Typography Rhythm Engine Schemas (Prompt: 14_typography.json)

export type SemanticRoleName =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'caption'
  | 'button'
  | 'label'
  | string;

export interface BaselineRhythmMetrics {
  gridBasePx: number; // e.g. 4 or 8
  lineHeightToFontSizeRatio: number; // unitless, e.g. 1.25
  modularStep: number; // number of modular grid steps (e.g. 14 steps of 4px = 56px)
  verticalGridAlignment: 'aligned-to-4px-grid' | 'aligned-to-8px-grid' | 'custom';
  relativeUnit: 'rem' | 'em';
}

export interface SpacingMetrics {
  marginTopPx: number;
  marginBottomPx: number;
  rawMargin: string;
  ratioToBody: number;
}

export interface ReadingWidthMetrics {
  maxCharactersPerLine: number; // calculated from element width / avg char width
  optimalChWidth: string; // e.g. "65ch"
  computedWidthPx: number;
  isOptimalReadingWidth: boolean; // true if within 45 - 75 ch
}

export interface SemanticTypographyRole {
  role: SemanticRoleName;
  displayName: string;
  fontFamily: string;
  fontSize: string;
  fontSizePx: number;
  fontSizeRem: string;
  fontWeight: number;
  lineHeight: string;
  lineHeightPx: number;
  lineHeightRatio: number;
  letterSpacing: string;
  letterSpacingPx: number;
  wordSpacing: string;
  wordSpacingPx: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textAlign: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end';
  textWrap: 'wrap' | 'nowrap' | 'balance' | 'pretty' | 'auto';
  textOverflow: 'clip' | 'ellipsis' | 'none';
  whiteSpace: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces';
  baselineRhythm: BaselineRhythmMetrics;
  paragraphSpacing: SpacingMetrics;
  headingSpacing: SpacingMetrics;
  readingWidth: ReadingWidthMetrics;
  tailwindClasses: string[];
  cssSnippet: string;
  exampleSelectors: string[];
  observedCount: number;
}

export interface ModularHeadingScale {
  detectedRatio: number; // e.g. 1.25 (Major Third), 1.333 (Perfect Fourth)
  ratioName: string; // e.g. "Major Third (1.250)", "Perfect Fourth (1.333)"
  baseFontSizePx: number; // e.g. 16
  scaleSteps: Record<string, number>; // e.g. { display: 48, h1: 38, h2: 30, h3: 24, h4: 20, body: 16, caption: 12 }
}

export interface TypographyRhythmSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalRolesIdentified: number;
    totalTextElementsScanned: number;
    primaryFontFamily: string;
    secondaryFontFamily?: string;
    headingScaleRatio: string;
    verticalBaselineGrid: string;
    hasBalancedHeadings: boolean;
  };
  modularScale: ModularHeadingScale;
  roleRegistry: Record<string, SemanticTypographyRole>;
  roles: SemanticTypographyRole[];
  metadata: {
    generatedAt: string;
    extractorVersion: string;
    guidanceForAI: string[];
  };
}

// Component Variant Engine Schemas (Prompt: 15_variants.json)

export type IntentVariantName =
  | 'primary'
  | 'secondary'
  | 'outlined'
  | 'ghost'
  | 'filled'
  | 'elevated'
  | string;

export type SizeVariantName =
  | 'small'
  | 'medium'
  | 'large'
  | string;

export type StateVariantName =
  | 'disabled'
  | 'loading'
  | 'hover'
  | 'focus'
  | 'pressed'
  | 'selected'
  | 'active'
  | string;

export interface VariantDeltaSpec {
  variantName: string;
  variantType: 'intent' | 'size' | 'state';
  baseComponentId: string;
  overriddenProperties: Record<string, any>;
  tailwindDelta: string[];
  propsMapping: Record<string, any>;
  isObserved: boolean;
  evidence?: string[];
  cssOverridesSnippet?: string;
}

export interface ComponentWithVariants {
  baseComponentId: string;
  componentName: string;
  category: string;
  baseStyles: Record<string, any>;
  baseTailwindClasses: string[];
  variants: {
    intent: Record<string, VariantDeltaSpec>;
    size: Record<string, VariantDeltaSpec>;
    state: Record<string, VariantDeltaSpec>;
  };
  cvaCode: string;
  defaultProps: {
    intent: string;
    size: string;
  };
  observedInstances: number;
}

export interface ComponentVariantSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalBaseComponents: number;
    totalVariantsDetected: number;
    intentVariantsCount: number;
    sizeVariantsCount: number;
    stateVariantsCount: number;
    cvaReadyComponents: number;
    designSystemCoverage: string;
  };
  components: Record<string, ComponentWithVariants>;
  metadata: {
    generatedAt: string;
    extractorVersion: string;
    guidanceForAI: string[];
  };
}

// Motion Timeline Engine Schemas (Prompt: 16_motion.json)

export type TimelineCategory =
  | 'hover'
  | 'stagger'
  | 'scroll'
  | 'modal'
  | 'drawer'
  | 'mount'
  | 'generic';

export interface MotionPropertySpec {
  animationName?: string;
  durationMs: number;
  durationStr: string;
  delayMs: number;
  delayStr: string;
  easing: string;
  iterationCount: string | number;
  fillMode: 'none' | 'forwards' | 'backwards' | 'both';
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  playState: 'running' | 'paused';
  transitionProperty: string;
  transitionDurationMs: number;
  transitionDurationStr: string;
  transitionDelayMs: number;
  transitionDelayStr: string;
  transitionTimingFunction: string;
}

export interface TimelineKeyframePoint {
  offset: number; // 0.0 to 1.0
  timeMs?: number;
  styles: Record<string, string | number>;
  tailwindClassDelta?: string;
}

export interface TimelineActorTrack {
  actorId: string;
  actorSelector: string;
  role?: string;
  startTimeMs: number;
  durationMs: number;
  endTimeMs: number;
  easing: string;
  properties: string[];
  keyframes: TimelineKeyframePoint[];
  cssTransitionSnippet: string;
  tailwindClasses: string[];
}

export interface TimelineStaggerSpec {
  isStaggered: boolean;
  staggerIntervalMs: number;
  staggerDirection: 'start-to-end' | 'end-to-start' | 'center-out';
  totalActors: number;
  cumulativeDurationMs: number;
}

export interface ChoreographedTimeline {
  id: string;
  name: string;
  category: TimelineCategory;
  trigger: 'hover' | 'scroll' | 'click' | 'mount' | 'modal-open' | 'drawer-open' | 'focus';
  totalDurationMs: number;
  primaryEasing: string;
  tracks: TimelineActorTrack[];
  stagger?: TimelineStaggerSpec;
  framerMotionCode: string;
  cssKeyframesCode: string;
}

export interface MotionTimelineSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalTimelines: number;
    totalActorTracks: number;
    hoverTimelinesCount: number;
    staggerTimelinesCount: number;
    scrollTimelinesCount: number;
    modalTimelinesCount: number;
    drawerTimelinesCount: number;
    framerMotionReady: boolean;
    averageAnimationDurationMs: number;
  };
  timelines: ChoreographedTimeline[];
  metadata: {
    generatedAt: string;
    extractorVersion: string;
    guidanceForAI: string[];
  };
}

// Content Semantic Engine Schemas (Prompt: 17_content.json)

export type ContentSemanticRole =
  | 'Headline'
  | 'Subheadline'
  | 'CTA'
  | 'Body'
  | 'Caption'
  | 'Price'
  | 'Rating'
  | 'Badge'
  | 'Breadcrumb'
  | 'Navigation'
  | 'FAQ'
  | 'Legal'
  | 'Metadata'
  | 'Feature'
  | 'Testimonial'
  | 'Specification'
  | 'Product Name'
  | 'Category'
  | 'Promotion'
  | 'Footer';

export type ContentImportance = 'critical' | 'high' | 'medium' | 'low';

export type SeoRelevance =
  | 'h1-primary-keyword'
  | 'heading-secondary'
  | 'body-content'
  | 'metadata-nav'
  | 'supplementary'
  | 'none';

export type VisualPriority =
  | 'display-p1'
  | 'headline-p2'
  | 'body-p3'
  | 'caption-p4'
  | 'interactive-cta';

export interface SemanticContentBlockNode {
  elementId: string;
  selector: string;
  text: string;
  trimmedText: string;
  semanticRole: ContentSemanticRole;
  purpose: string;
  importance: ContentImportance;
  seoRelevance: SeoRelevance;
  visualPriority: VisualPriority;
  typographyRef?: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };
  browserEvidence: string[];
}

export interface ContentSemanticSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalContentBlocks: number;
    roleDistribution: Record<string, number>;
    criticalBlocksCount: number;
    highImportanceCount: number;
    primaryHeadline?: string;
    primaryCtaText?: string;
  };
  blocks: SemanticContentBlockNode[];
  metadata: {
    generatedAt: string;
    extractorVersion: string;
    guidanceForAI: string[];
  };
}

// AI Reconstruction Graph Engine Schemas (Prompt: 18_reconstruction_graph.json)

export type LayerType =
  | 'root'
  | 'section'
  | 'container'
  | 'compound'
  | 'primitive'
  | 'leaf';

export interface NodeArtifactReferences {
  componentRef?: {
    file: '02_components.json';
    componentId: string;
    isReusable: boolean;
  };
  layoutRef?: {
    file: '12_constraints.json';
    constraintId?: string;
    display?: string;
    recommendedTailwind?: string[];
  };
  designTokensRef?: {
    file: '03_design-system.json';
    colorToken?: string;
    spacingToken?: string;
    radiusToken?: string;
    shadowToken?: string;
  };
  behaviorRef?: {
    file: '05_behavior.json';
    interactionId?: string;
    isInteractive: boolean;
  };
  variantRef?: {
    file: '15_variants.json';
    baseComponent?: string;
    defaultVariant?: Record<string, string>;
  };
  renderTreeRef?: {
    file: '11_render_tree.json';
    renderOrder: number;
    stackingContextId: string;
    zIndex: string;
    paintLayer: string;
  };
  responsiveRef?: {
    file: '13_responsive.json';
    breakpointTransitions?: string[];
  };
  typographyRef?: {
    file: '14_typography.json';
    role?: string;
    fontSize?: string;
    fontWeight?: string;
  };
  motionRef?: {
    file: '16_motion.json';
    timelineId?: string;
    category?: string;
  };
  contentRef?: {
    file: '17_content.json';
    semanticRole: string;
    purpose: string;
    importance: string;
    seoRelevance: string;
  };
  accessibilityRef?: {
    file: '07_accessibility.json';
    role?: string;
    ariaLabel?: string;
  };
  assetRef?: {
    file: '06_assets.json';
    assetId?: string;
    type?: 'svg' | 'image';
  };
  evidenceRef?: {
    file: '08_evidence.json';
    selector: string;
  };
}

export interface ReconstructionGraphNode {
  id: string;
  name: string;
  layerType: LayerType;
  parentId: string | null;
  childIds: string[];
  depth: number;
  references: NodeArtifactReferences;
  dependencies: string[];
  dependents: string[];
  suggestedFilePath: string;
}

export interface ReconstructionGraphSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalNodes: number;
    maxDepth: number;
    rootNodeId: string;
    sectionNodesCount: number;
    compoundNodesCount: number;
    primitiveNodesCount: number;
    reconstructionStepsCount: number;
  };
  reconstructionOrder: string[];
  nodes: Record<string, ReconstructionGraphNode>;
  metadata: {
    generatedAt: string;
    extractorVersion: string;
    guidanceForAI: string[];
  };
}

// ---------------------------------------------------------------------------
// Design Language Extraction & Theme Transfer Mode Schemas
// ---------------------------------------------------------------------------

export type DesignPersonalityTrait =
  | 'minimal'
  | 'luxury'
  | 'playful'
  | 'corporate'
  | 'editorial'
  | 'modern'
  | 'tech'
  | 'fashion'
  | 'dark'
  | 'light'
  | 'dense'
  | 'airy'
  | 'high-contrast'
  | 'soft'
  | 'sharp';

export interface DesignPrinciplesSpecification {
  $schema: string;
  version: string;
  referenceMeta: {
    title: string;
    url: string;
  };
  traits: DesignPersonalityTrait[];
  moodSummary: string;
  visualDensity: 'compact' | 'comfortable' | 'spacious' | 'airy';
  contrastStyle: 'high' | 'medium' | 'soft';
  cornerStyle: 'sharp' | 'subtle-rounded' | 'smooth' | 'pill';
  surfaceElevation: 'flat' | 'subtle-border' | 'layered-shadow' | 'glassmorphism' | 'floating';
  colorHarmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'neutral-dominant';
  typographyStyle: 'clean-sans' | 'geometric-sans' | 'editorial-serif' | 'tech-mono' | 'humanist';
  motionPersonality: 'instant' | 'subtle-smooth' | 'snappy-elastic' | 'cinematic-slow';
  designRules: string[];
}

export interface ButtonVariantStyle {
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
  hoverText: string;
  activeScale: string;
  shadow?: string;
  radius: string;
  padding: string;
  fontWeight: string;
}

export interface ButtonSystemSpecification {
  variants: {
    primary: ButtonVariantStyle;
    secondary: ButtonVariantStyle;
    outline: ButtonVariantStyle;
    ghost: ButtonVariantStyle;
    destructive: ButtonVariantStyle;
  };
  sizes: {
    sm: { height: string; padding: string; fontSize: string; iconSize: string };
    md: { height: string; padding: string; fontSize: string; iconSize: string };
    lg: { height: string; padding: string; fontSize: string; iconSize: string };
  };
  focusRing: {
    ringColor: string;
    ringOffset: string;
    ringWidth: string;
  };
}

export interface FormSystemSpecification {
  input: {
    bg: string;
    border: string;
    focusBorder: string;
    focusRing: string;
    radius: string;
    padding: string;
    fontSize: string;
    placeholderColor: string;
  };
  label: {
    fontSize: string;
    fontWeight: string;
    color: string;
    marginBottom: string;
  };
  select: {
    bg: string;
    border: string;
    radius: string;
    padding: string;
  };
  checkbox: {
    size: string;
    radius: string;
    checkedBg: string;
    border: string;
  };
  validation: {
    errorBorder: string;
    errorText: string;
    successBorder: string;
    successText: string;
  };
}

export interface CardSystemSpecification {
  variants: {
    elevated: { bg: string; border: string; shadow: string; radius: string; padding: string };
    outlined: { bg: string; border: string; shadow: string; radius: string; padding: string };
    flat: { bg: string; border: string; shadow: string; radius: string; padding: string };
    interactive: { bg: string; border: string; shadow: string; hoverTransform: string; hoverShadow: string; radius: string; padding: string };
  };
  paddingScale: {
    sm: string;
    md: string;
    lg: string;
  };
}

export interface NavigationSystemSpecification {
  navbar: {
    bg: string;
    backdropBlur: string;
    borderBottom: string;
    height: string;
    padding: string;
    isSticky: boolean;
  };
  navLink: {
    color: string;
    hoverColor: string;
    activeColor: string;
    activeIndicator: string;
    fontSize: string;
    fontWeight: string;
  };
  mobileMenu: {
    bg: string;
    animation: string;
    overlay: string;
  };
  dropdown: {
    bg: string;
    border: string;
    shadow: string;
    radius: string;
    itemHoverBg: string;
  };
}

export interface IconStyleSpecification {
  strokeWidth: string;
  defaultSize: string;
  sizingScale: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  primaryTint: string;
  secondaryTint: string;
}

export interface ComponentStyleLanguageSpecification {
  $schema: string;
  version: string;
  buttons: ButtonSystemSpecification;
  forms: FormSystemSpecification;
  cards: CardSystemSpecification;
  navigation: NavigationSystemSpecification;
  icons: IconStyleSpecification;
  badges: Record<string, { bg: string; text: string; border: string; radius: string; padding: string; fontSize: string }>;
  modals: { overlayBg: string; contentBg: string; radius: string; shadow: string; maxWidth: string; padding: string };
  tabs: { listBg: string; tabColor: string; activeBg: string; activeColor: string; indicatorStyle: string; radius: string };
}

export interface DesignLanguagePackageManifest {
  generator: string;
  version: string;
  mode: 'design-language-theme-transfer';
  generatedAt: string;
  referenceUrl: string;
  referenceTitle: string;
  designPersonality: DesignPersonalityTrait[];
  totalFiles: number;
  totalBytes: number;
  files: AIClonePackageFileEntry[];
}

export interface DesignLanguagePackageResult {
  manifest: DesignLanguagePackageManifest;
  themePrompt: string;
  designPrinciples: string;
  files: Record<string, string>;
  zipBuffer: Uint8Array;
  base64: string;
}

// ---------------------------------------------------------------------------
// V2.0 Phase 1: Design Knowledge Graph, Canonical Registry & Variant Graph Schemas
// ---------------------------------------------------------------------------

export type DKGEntityType =
  | 'component'
  | 'variant'
  | 'instance'
  | 'design_token'
  | 'layout_container'
  | 'responsive_rule'
  | 'motion_pattern';

export type DKGEdgeRelationship =
  | 'instantiates'
  | 'inherits_from'
  | 'uses_token'
  | 'contains_layout'
  | 'applies_responsive_rule'
  | 'triggers_motion'
  | 'contains_slot'
  | 'overrides_property';

export interface DKGNode {
  id: string;
  name: string;
  entityType: DKGEntityType;
  fingerprint: string;
  parentEntityId: string | null;
  properties: Record<string, any>;
  tokenReferences: Record<string, string>;
  instanceCount: number;
  metadata: Record<string, any>;
}

export interface DKGEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: DKGEdgeRelationship;
  metadata?: Record<string, any>;
}

export interface DesignKnowledgeGraphSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalNodes: number;
    totalEdges: number;
    componentCount: number;
    variantCount: number;
    instanceCount: number;
    tokenCount: number;
    layoutCount: number;
    responsiveCount: number;
    motionCount: number;
    deduplicationRatio: number;
  };
  nodes: Record<string, DKGNode>;
  edges: DKGEdge[];
  metadata: {
    generatedAt: string;
    engineVersion: string;
    qualityGateStatus: 'PASSED' | 'FAILED';
  };
}

export interface CanonicalComponentDefinition {
  componentId: string;
  name: string;
  category: string;
  fingerprint: string;
  rootTagName: string;
  slots: string[];
  propsSchema: { name: string; type: string; defaultToken?: string; required?: boolean }[];
  defaultTokens: Record<string, string>;
  variants: Record<
    string,
    {
      variantId: string;
      name: string;
      parentVariantId?: string;
      overriddenTokens: Record<string, string>;
      overriddenProperties: Record<string, any>;
      instanceCount: number;
    }
  >;
  instanceElementIds: string[];
  layoutContainerRef?: string;
}

export interface ComponentRegistrySpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalComponents: number;
    totalVariants: number;
    totalInstances: number;
    averageInstancesPerComponent: number;
  };
  components: Record<string, CanonicalComponentDefinition>;
  metadata: {
    generatedAt: string;
  };
}

export interface VariantNode {
  variantId: string;
  componentId: string;
  name: string;
  parentVariantId: string | null;
  inheritanceDepth: number;
  inheritanceChain: string[];
  overriddenTokens: Record<string, string>;
  overriddenProperties: Record<string, any>;
  cvaConfig: {
    intent?: string;
    size?: string;
    state?: string;
    className: string;
  };
  instanceCount: number;
}

export interface VariantGraphSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalVariantTrees: number;
    maxInheritanceDepth: number;
    totalVariants: number;
    rootVariantsCount: number;
    childVariantsCount: number;
  };
  trees: Record<string, { rootComponentId: string; rootVariantId: string; nodes: Record<string, VariantNode> }>;
  metadata: {
    generatedAt: string;
    isAcyclic: boolean;
  };
}

export interface CanonicalTokenDefinition {
  tokenId: string;
  name: string;
  category: 'color' | 'typography' | 'spacing' | 'radius' | 'shadow' | 'motion';
  rawValue: any;
  cssVariable: string;
  usageCount: number;
  referencingEntityIds: string[];
}

export interface TokenRegistrySpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalTokens: number;
    colorTokens: number;
    typographyTokens: number;
    spacingTokens: number;
    radiusTokens: number;
    shadowTokens: number;
    totalValueReferences: number;
    tokenReuseFactor: number;
  };
  tokens: Record<string, CanonicalTokenDefinition>;
  categories: Record<string, string[]>;
  metadata: {
    generatedAt: string;
  };
}

export interface QualityGateRuleResult {
  rule: string;
  passed: boolean;
  details: string;
  violations: string[];
}

export interface KnowledgeGraphQualityGateReport {
  status: 'PASSED' | 'FAILED';
  timestamp: string;
  rules: {
    noDuplicateComponents: QualityGateRuleResult;
    noDuplicateTokens: QualityGateRuleResult;
    noCyclicInheritance: QualityGateRuleResult;
    noOrphanVariants: QualityGateRuleResult;
  };
  allPassed: boolean;
}

export interface KnowledgeGraphAuditReport {
  target: {
    title: string;
    url: string;
  };
  timestamp: string;
  metrics: {
    rawDomNodeCount: number;
    rawSerializationBytes: number;
    rawEstimatedTokens: number;
    dkgNodeCount: number;
    dkgSerializationBytes: number;
    dkgEstimatedTokens: number;
    byteReductionPercent: number;
    tokenReductionPercent: number;
    compressionRatio: number;
    componentReuseRatio: number;
    tokenReuseFactor: number;
  };
  summaryMarkdown: string;
}

/* ==========================================================================
   V2.0 Phase 2: Intent Extraction Engine Schema Definitions
   ========================================================================== */

export type IntentDomain =
  | 'layout'
  | 'typography'
  | 'shape'
  | 'spacing'
  | 'hierarchy'
  | 'motion'
  | 'interaction'
  | 'color';

export interface DesignIntentDefinition {
  intentId: string;
  name: string;
  domain: IntentDomain;
  description: string;
  rationale: string;
  patternMatcher: Record<string, any>;
  rawCssProperties: Record<string, string | number | boolean>;
  tokenReferences: string[];
  usageCount: number;
  componentReferences: string[];
  elementReferences: string[];
}

export interface IntentDictionarySpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalIntents: number;
    intentsByDomain: Record<IntentDomain, number>;
    totalIntentApplications: number;
    averageIntentsPerComponent: number;
    estimatedTokenReductionPercent: number;
  };
  domains: Record<IntentDomain, string[]>;
  intents: Record<string, DesignIntentDefinition>;
  metadata: {
    generatedAt: string;
  };
}

export interface AppliedIntent {
  intentId: string;
  name: string;
  domain: IntentDomain;
  confidence: number;
  matchedProperties: Record<string, any>;
  inferredPurpose: string;
}

export interface IntentMappingEntry {
  entityId: string;
  entityType: 'component' | 'variant' | 'element';
  entityName: string;
  appliedIntents: AppliedIntent[];
  rawCssBlock: Record<string, any>;
  semanticIntentSummary: string;
  tokenSavings: {
    rawCssEstimatedTokens: number;
    intentEstimatedTokens: number;
    reductionPercent: number;
  };
}

export interface IntentMapSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalEntitiesMapped: number;
    componentsMapped: number;
    variantsMapped: number;
    elementsMapped: number;
    totalIntentLinks: number;
    rawCssTotalTokens: number;
    intentTotalTokens: number;
    overallTokenReductionPercent: number;
  };
  mappings: Record<string, IntentMappingEntry>;
  metadata: {
    generatedAt: string;
  };
}

export interface IntentTokenReductionReport {
  rawCssTotalEstimatedTokens: number;
  intentTotalEstimatedTokens: number;
  tokenReductionPercent: number;
  savedTokens: number;
  averageTokensPerEntityRaw: number;
  averageTokensPerEntityIntent: number;
}

/* ==========================================================================
   V2.0 Phase 3: Layout Relationship Engine Schema Definitions
   ========================================================================== */

export type SpatialRelationshipType =
  | 'Above'
  | 'Below'
  | 'Inside'
  | 'Adjacent'
  | 'Centered'
  | 'Stretch'
  | 'Grid Column'
  | 'Grid Row';

export interface LayoutRelationshipNode {
  sourceId: string;
  sourceType: 'component' | 'section' | 'element' | 'container';
  sourceName: string;
  targetId: string;
  targetType: 'component' | 'section' | 'element' | 'container';
  targetName: string;
  relation: SpatialRelationshipType;
  alignment: 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'baseline' | 'none';
  gapToken: string | null;
  gapPx: number | null;
  gridPlacement?: {
    colSpan?: number;
    colStart?: number;
    rowSpan?: number;
    rowStart?: number;
  };
  confidence: number;
  rationale: string;
  fallbackGeometry?: {
    width?: number;
    height?: number;
    aspectRatio?: string;
    isAbsoluteOverlay?: boolean;
  };
}

export interface LayoutRelationshipGraphSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalRelationships: number;
    spatialRelations: number;
    containmentRelations: number;
    alignmentRelations: number;
    gridRelations: number;
    entitiesWithRelativeOnly: number;
    entitiesRequiringFallbackGeometry: number;
  };
  relationships: LayoutRelationshipNode[];
  metadata: {
    generatedAt: string;
  };
}

export type ContainerLayoutModel =
  | 'flex-row'
  | 'flex-column'
  | 'grid'
  | 'block-flow'
  | 'fixed-overlay';

export interface ContainerHierarchyChild {
  childId: string;
  childName: string;
  childType: 'component' | 'container' | 'element';
  relationshipToParent: 'Inside' | 'Stretch' | 'Centered' | 'Grid Column';
  orderIndex: number;
  gapFromPrevious: number | null;
  gridCoordinates?: {
    col: number;
    row: number;
    colSpan: number;
    rowSpan: number;
  };
}

export interface ContainerHierarchyNode {
  containerId: string;
  name: string;
  containerType:
    | 'SectionContainer'
    | 'GridContainer'
    | 'FlexRow'
    | 'FlexColumn'
    | 'CardContainer'
    | 'ModalDialog'
    | 'RootContainer';
  layoutModel: ContainerLayoutModel;
  parentContainerId: string | null;
  nestingDepth: number;
  alignment: {
    justify: string;
    align: string;
    isCenteredHorizontally: boolean;
    isCenteredVertically: boolean;
  };
  gap: {
    token: string;
    px: number;
  };
  padding: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  children: ContainerHierarchyChild[];
  isFullWidth: boolean;
  hasIntrinsicAspectRatio: boolean;
}

export interface ContainerHierarchySpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    rootContainerId: string;
    totalContainers: number;
    maxNestingDepth: number;
    containersByLayoutType: Record<ContainerLayoutModel, number>;
  };
  containers: Record<string, ContainerHierarchyNode>;
  metadata: {
    generatedAt: string;
  };
}

export type SectionFlowSemanticType =
  | 'header'
  | 'hero'
  | 'features'
  | 'catalog-grid'
  | 'cta'
  | 'testimonials'
  | 'pricing'
  | 'footer'
  | 'content';

export interface SectionFlowNode {
  sectionId: string;
  name: string;
  semanticType: SectionFlowSemanticType;
  orderIndex: number;
  positioning: 'in-flow' | 'sticky-top' | 'fixed' | 'persistent-bottom';
  relationshipToPrevious: 'Below' | 'Overlays' | 'None (First)';
  relationshipToNext: 'Above' | 'Underlays' | 'None (Last)';
  verticalGapToNext: {
    token: string;
    px: number;
  };
  internalAlignment: 'centered' | 'start' | 'stretch' | 'split';
  primaryComponentIds: string[];
  dominantIntent: string;
  containerWidthModel: 'full-viewport' | 'contained-max-width' | 'inset-card';
}

export interface SectionFlowSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalSections: number;
    flowDirection: 'vertical' | 'horizontal';
    hasStickyHeader: boolean;
    hasPersistentFooter: boolean;
    averageSectionHeightRatio: number;
    sectionRhythmTokens: string[];
  };
  flow: SectionFlowNode[];
  metadata: {
    generatedAt: string;
  };
}

/* ==========================================================================
   V2.0 Phase 4: AI Reconstruction Planner Schema Definitions
   ========================================================================== */

export type BuildPhaseId =
  | 'tokens'
  | 'typography'
  | 'containers'
  | 'components'
  | 'variants'
  | 'sections'
  | 'pages'
  | 'interactions'
  | 'responsive'
  | 'accessibility';

export interface BuildPhaseNode {
  phaseId: BuildPhaseId;
  stepNumber: number;
  name: string;
  description: string;
  prerequisites: BuildPhaseId[];
  outputs: string[];
  validationChecklist: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export interface BuildDependencyGraphSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalPhases: number;
    totalDependencies: number;
    executionPipeline: string[];
    criticalPathLength: number;
  };
  phases: Record<BuildPhaseId, BuildPhaseNode>;
  metadata: {
    generatedAt: string;
  };
}

export type ComponentDependencyNodeType =
  | 'primitive'
  | 'composite'
  | 'section'
  | 'page';

export interface ComponentDependencyNode {
  componentId: string;
  name: string;
  nodeType: ComponentDependencyNodeType;
  dependencies: string[];
  dependents: string[];
  buildOrder: number;
  isShared: boolean;
  instanceCount: number;
}

export interface ComponentDependencyGraphSpecification {
  $schema: string;
  version: string;
  target: {
    title: string;
    url: string;
  };
  summary: {
    totalNodes: number;
    primitiveCount: number;
    compositeCount: number;
    sectionCount: number;
    pageCount: number;
    maxDependencyDepth: number;
    topologicalOrder: string[];
  };
  nodes: Record<string, ComponentDependencyNode>;
  metadata: {
    generatedAt: string;
  };
}

export interface ReconstructionPlanSpecification {
  title: string;
  url: string;
  totalSteps: number;
  steps: Array<{
    step: number;
    phaseId: BuildPhaseId;
    title: string;
    description: string;
    targetFiles: string[];
    prerequisites: string[];
    codeSnippets?: string[];
    validationChecklist: string[];
  }>;
  markdown: string;
}

/* ==========================================================================
   V2.0 Phase 5: Progressive Package Generation Schema Definitions
   ========================================================================== */

export type PackageLevelId = 'fast' | 'standard' | 'full';
export type ProgressivePackageLevel = PackageLevelId | 1 | 2 | 3;

export interface PackageManifestSpecification {
  $schema: string;
  version: string;
  packageLevel: PackageLevelId;
  levelNumber: 1 | 2 | 3;
  packageName: string;
  tokenBudget: string;
  estimatedTokenCount: number;
  isWithinBudget: boolean;
  target: {
    title: string;
    url: string;
  };
  includedCapabilities: string[];
  includedFiles: string[];
  excludedCapabilities: string[];
  excludedFiles: string[];
  metadata: {
    generatedAt: string;
  };
}

export interface ProgressivePackageResult {
  level: PackageLevelId;
  levelNumber: 1 | 2 | 3;
  packageName: string;
  tokenBudget: string;
  estimatedTokens: number;
  isWithinBudget: boolean;
  manifest: PackageManifestSpecification;
  readme: string;
  files: Record<string, string>;
  base64: string;
}

/* ==========================================================================
   V2.0 Phase 6: AI Optimization Engine Schema Definitions
   ========================================================================== */

export interface KnowledgeCompressionSpecification {
  version: string;
  generatedAt: string;
  target: {
    title: string;
    url: string;
  };
  references: Record<string, {
    type: 'token' | 'component' | 'layout' | 'intent';
    target: string;
    resolvedValue: any;
  }>;
  compressedComponents: Record<string, {
    canonicalId: string;
    name: string;
    fingerprint: string;
    instanceCount: number;
    instanceElementIds: string[];
    sampleOverrides: Record<string, any>;
  }>;
  tokenizedStyles: Record<string, {
    rawCss: string;
    tokenizedCss: string;
    tokenRefs: string[];
  }>;
  deduplicationSummary: {
    rawNodesCount: number;
    uniqueCanonicalNodes: number;
    duplicatesEliminated: number;
    deduplicationRatio: string;
  };
}

export interface SubsystemConfidence {
  score: number;
  confidence: number;
  status: 'optimal' | 'good' | 'adequate';
  evidence: string[];
}

export interface ReconstructionPriorityItem {
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  tier: string;
  phase: string;
  description: string;
  confidence: number;
}

export interface ConfidenceMapSpecification {
  version: string;
  generatedAt: string;
  overallScore: number;
  overallFidelityPercent: number;
  grade: 'A+' | 'A' | 'B+' | 'B';
  verdict: string;
  subsystems: {
    designSystem: SubsystemConfidence;
    components: SubsystemConfidence;
    layout: SubsystemConfidence;
    responsive: SubsystemConfidence;
    accessibility: SubsystemConfidence;
    motion: SubsystemConfidence;
  };
  reconstructionPriorities: ReconstructionPriorityItem[];
}

export interface PackageMetricsSpecification {
  version: string;
  generatedAt: string;
  target: {
    title: string;
    url: string;
  };
  comparison: {
    raw: {
      packageBytes: number;
      estimatedTokens: number;
      elementCount: number;
    };
    optimized: {
      packageBytes: number;
      estimatedTokens: number;
      canonicalComponentCount: number;
    };
    savings: {
      byteReductionPercent: number;
      tokenReductionPercent: number;
      compressionRatio: string;
      duplicatesEliminatedCount: number;
      referencesCreatedCount: number;
      estimatedAiCostReductionPercent: number;
      reconstructionFidelityPercent: number;
    };
  };
}

export interface OptimizationReportSpecification {
  title: string;
  url: string;
  metrics: PackageMetricsSpecification;
  confidence: ConfidenceMapSpecification;
  markdown: string;
}
















