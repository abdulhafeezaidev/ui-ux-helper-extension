/**
 * Multi-Dimensional Confidence Engine
 * Calculates independent, decoupled confidence dimensions:
 * 1. BrowserEvidenceConfidence
 * 2. SemanticConfidence
 * 3. LayoutConfidence
 * 4. ComponentConfidence
 * 5. AssetConfidence
 * 6. InteractionConfidence
 * 7. TypographyConfidence
 * 8. ColorSystemConfidence
 * 9. SpacingConfidence
 * 10. GridConfidence
 *
 * Strict Rule: Browser-derived geometry NEVER artificially inflates semantic confidence.
 */

import { RawElementNode } from '../../types/schema.ts';
import { ADSConfidenceVector } from '../schema.ts';

export interface ConfidenceEvidenceFactors {
  isSemanticTag?: boolean;
  hasHeading?: boolean;
  isLargeViewportRegion?: boolean;
  hasVisualBoundary?: boolean;
  hasMedia?: boolean;
  isRepeatedStructure?: boolean;
  hasExplicitAriaRole?: boolean;
  hasInteractiveControl?: boolean;
  isFormContainer?: boolean;
}

export interface CalibratedConfidenceResult {
  confidence: number;
  evidence: string[];
}

export const DEFAULT_CONFIDENCE_WEIGHTS = {
  browserEvidence: 0.15,
  semantic: 0.20,
  layout: 0.10,
  component: 0.15,
  asset: 0.10,
  interaction: 0.05,
  typography: 0.05,
  colorSystem: 0.05,
  spacing: 0.05,
  grid: 0.10,
};

// 1. Browser Evidence Confidence (Proportion of elements with non-zero rendered geometry & valid computed styles)
export function calculateBrowserEvidenceConfidence(rawElements: RawElementNode[]): number {
  if (!rawElements || rawElements.length === 0) return 0.0;

  let elementsWithRealBounds = 0;
  let elementsWithComputedStyles = 0;

  rawElements.forEach((el) => {
    if (el.boundingRect && el.boundingRect.width > 0 && el.boundingRect.height > 0) {
      elementsWithRealBounds++;
    }
    if (el.typography?.fontFamily && el.color && el.backgroundColor) {
      elementsWithComputedStyles++;
    }
  });

  const geomRatio = elementsWithRealBounds / rawElements.length;
  const styleRatio = elementsWithComputedStyles / rawElements.length;

  const score = (geomRatio * 0.7) + (styleRatio * 0.3);
  return Number(Math.min(1.0, Math.max(0.0, score)).toFixed(2));
}

// 2. Semantic Confidence (STRICTLY isolated from geometry / pixels / devicePixelRatio!)
export function calculateSemanticConfidence(rawElements: RawElementNode[]): number {
  if (!rawElements || rawElements.length === 0) return 0.0;

  const semanticTags = new Set([
    'header', 'nav', 'main', 'article', 'section', 'footer',
    'form', 'button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'ul', 'ol', 'li', 'figure', 'figcaption', 'aside', 'input', 'select', 'textarea'
  ]);

  let semanticTagCount = 0;
  let ariaRoleCount = 0;
  let priceTextCount = 0;
  let ctaTextCount = 0;

  rawElements.forEach((el) => {
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (semanticTags.has(tag)) {
      semanticTagCount++;
    }
    if (el.role && el.role.trim().length > 0) {
      ariaRoleCount++;
    }
    if (el.textMeta?.hasText) {
      const txt = el.textMeta.trimmedText;
      if (txt.match(/(?:Rs\.?|PKR|\$|€|£)\s*[\d,]+/i)) {
        priceTextCount++;
      }
      if (txt.match(/^(add to cart|buy now|shop now|checkout|view|select|order|submit)$/i)) {
        ctaTextCount++;
      }
    }
  });

  // Calculate semantic signal density without any bounding box influence
  const semanticTagRatio = Math.min(1.0, (semanticTagCount / Math.max(1, rawElements.length)) * 1.5);
  const ariaBonus = Math.min(0.2, (ariaRoleCount / Math.max(1, rawElements.length)) * 0.5);
  const priceBonus = priceTextCount > 0 ? 0.15 : 0.0;
  const ctaBonus = ctaTextCount > 0 ? 0.15 : 0.0;

  const score = (semanticTagRatio * 0.5) + ariaBonus + priceBonus + ctaBonus;
  return Number(Math.min(1.0, Math.max(0.0, score)).toFixed(2));
}

// 3. Layout Confidence
export function calculateLayoutConfidence(rawElements: RawElementNode[], layoutSystem?: any): number {
  if (!rawElements || rawElements.length === 0) return 0.0;

  let flexGridCount = 0;
  rawElements.forEach((el) => {
    if (el.layoutProps?.display === 'flex' || el.layoutProps?.display === 'grid' || el.layoutProps?.display === 'inline-flex') {
      flexGridCount++;
    }
  });

  const flexGridRatio = Math.min(1.0, (flexGridCount / Math.max(1, rawElements.length)) * 3.0);
  const overflowPenalty = layoutSystem?.viewport?.hasHorizontalOverflow ? 0.2 : 0.0;
  const containerScore = layoutSystem?.containers?.length > 0 ? 0.3 : 0.1;

  const score = (flexGridRatio * 0.5) + containerScore - overflowPenalty;
  return Number(Math.min(1.0, Math.max(0.0, score)).toFixed(2));
}

// 4. Component Confidence
export function calculateComponentConfidence(componentSystem?: any, refined?: any): number {
  const families = refined?.componentFamilies || componentSystem?.families || [];
  if (!families || families.length === 0) return 0.0;

  const maxInstance = Math.max(...families.map((f: any) => f.instanceCount || 1), 0);
  const distinctRoles = new Set(families.map((f: any) => f.categoryRole || f.type)).size;

  let score = 0.5;
  if (maxInstance >= 2) score += 0.25;
  if (distinctRoles >= 3) score += 0.25;

  return Number(Math.min(1.0, Math.max(0.0, score)).toFixed(2));
}

// 5. Asset Confidence
export function calculateAssetConfidence(rawElements: RawElementNode[], assetEvidence?: any[]): number {
  if (assetEvidence && assetEvidence.length > 0) {
    const renderedAssets = assetEvidence.filter((a) => a.renderedWidth > 0 && a.renderedHeight > 0);
    const ratio = renderedAssets.length / assetEvidence.length;
    return Number(Math.min(1.0, Math.max(0.0, 0.4 + ratio * 0.6)).toFixed(2));
  }

  const mediaElements = rawElements.filter((el) => el.tagName?.toLowerCase() === 'img' || el.tagName?.toLowerCase() === 'svg' || el.assetProps?.currentSrc);
  if (mediaElements.length === 0) return 0.8; // Clean page with no missing assets

  const withSrc = mediaElements.filter((el) => el.assetProps?.currentSrc || el.assetProps?.backgroundImage || el.tagName?.toLowerCase() === 'svg');
  return Number(Math.min(1.0, Math.max(0.0, withSrc.length / mediaElements.length)).toFixed(2));
}

// 6. Interaction Confidence
export function calculateInteractionConfidence(rawElements: RawElementNode[], interactions?: any[]): number {
  let score = 0.5;
  if (interactions && interactions.length > 0) {
    score += Math.min(0.3, interactions.length * 0.1);
  }

  const interactiveElements = rawElements.filter((el) => {
    const tag = el.tagName?.toLowerCase();
    return tag === 'button' || tag === 'a' || tag === 'input' || tag === 'select' || el.role === 'button';
  });

  if (interactiveElements.length > 0) {
    score += 0.2;
  }

  return Number(Math.min(1.0, Math.max(0.0, score)).toFixed(2));
}

// 7. Typography Confidence
export function calculateTypographyConfidence(_rawElements: RawElementNode[], typographySystem?: any): number {
  const fontFamilies = typographySystem?.fontFamilies || [];
  const tokens = typographySystem?.tokens || [];

  let score = 0.5;
  if (fontFamilies.length > 0) score += 0.25;
  if (tokens.length >= 3) score += 0.25;

  return Number(Math.min(1.0, Math.max(0.0, score)).toFixed(2));
}

// 8. Color System Confidence
export function calculateColorSystemConfidence(_rawElements: RawElementNode[], colorSystem?: any): number {
  const tokens = colorSystem?.tokens || [];
  const dominant = colorSystem?.dominantColors || [];

  let score = 0.5;
  if (colorSystem?.roles?.pageBackground) score += 0.25;
  if (tokens.length >= 2 || dominant.length >= 2) score += 0.25;

  return Number(Math.min(1.0, Math.max(0.0, score)).toFixed(2));
}

// 9. Spacing Confidence
export function calculateSpacingConfidence(rawElements: RawElementNode[], spacingTokens?: any[]): number {
  if (spacingTokens && spacingTokens.length > 0) {
    const validSpacing = spacingTokens.every((s: any) => s.valuePx <= 120);
    return validSpacing ? 0.95 : 0.70;
  }

  let elementsWithPaddingMargin = 0;
  rawElements.forEach((el) => {
    if (parseFloat(el.padding?.top || '0') > 0 || parseFloat(el.margin?.top || '0') > 0) {
      elementsWithPaddingMargin++;
    }
  });

  const ratio = rawElements.length > 0 ? elementsWithPaddingMargin / rawElements.length : 0;
  return Number(Math.min(1.0, Math.max(0.0, 0.5 + ratio * 0.5)).toFixed(2));
}

// 10. Grid Confidence
export function calculateGridConfidence(_rawElements: RawElementNode[], productCardSpec?: any, layoutSystem?: any): number {
  let score = 0.70;

  if (productCardSpec?.gridPlacement?.columns && productCardSpec.gridPlacement.columns >= 2) {
    score += 0.20;
  }

  if (layoutSystem?.gridContainers && layoutSystem.gridContainers.length > 0) {
    score += 0.10;
  }

  return Number(Math.min(1.0, Math.max(0.0, score)).toFixed(2));
}

// Full Multi-Dimensional Aggregation Engine
export function calculateMultiDimensionalConfidence(
  rawElements: RawElementNode[],
  options?: {
    colorSystem?: any;
    typographySystem?: any;
    shapeSystem?: any;
    layoutSystem?: any;
    componentSystem?: any;
    refined?: any;
    productCardSpec?: any;
    assetEvidence?: any[];
    interactions?: any[];
    spacingTokens?: any[];
  }
): ADSConfidenceVector {
  const browserEvidenceConfidence = calculateBrowserEvidenceConfidence(rawElements);
  const semanticConfidence = calculateSemanticConfidence(rawElements);
  const layoutConfidence = calculateLayoutConfidence(rawElements, options?.layoutSystem);
  const componentConfidence = calculateComponentConfidence(options?.componentSystem, options?.refined);
  const assetConfidence = calculateAssetConfidence(rawElements, options?.assetEvidence);
  const interactionConfidence = calculateInteractionConfidence(rawElements, options?.interactions);
  const typographyConfidence = calculateTypographyConfidence(rawElements, options?.typographySystem);
  const colorSystemConfidence = calculateColorSystemConfidence(rawElements, options?.colorSystem);
  const spacingConfidence = calculateSpacingConfidence(rawElements, options?.spacingTokens);
  const gridConfidence = calculateGridConfidence(rawElements, options?.productCardSpec, options?.layoutSystem);

  const w = DEFAULT_CONFIDENCE_WEIGHTS;
  const overallScore = Number((
    browserEvidenceConfidence * w.browserEvidence +
    semanticConfidence * w.semantic +
    layoutConfidence * w.layout +
    componentConfidence * w.component +
    assetConfidence * w.asset +
    interactionConfidence * w.interaction +
    typographyConfidence * w.typography +
    colorSystemConfidence * w.colorSystem +
    spacingConfidence * w.spacing +
    gridConfidence * w.grid
  ).toFixed(2));

  return {
    browserEvidenceConfidence,
    semanticConfidence,
    layoutConfidence,
    componentConfidence,
    assetConfidence,
    interactionConfidence,
    typographyConfidence,
    colorSystemConfidence,
    spacingConfidence,
    gridConfidence,
    overallScore,
  };
}

// Backwards compatibility legacy function
export function calibrateConfidence(factors: ConfidenceEvidenceFactors): CalibratedConfidenceResult {
  let score = 0.0;
  const evidence: string[] = [];

  if (factors.isSemanticTag) {
    score += 0.30;
    evidence.push('Explicit semantic HTML tag');
  }

  if (factors.hasExplicitAriaRole) {
    score += 0.20;
    evidence.push('Explicit ARIA role attribute');
  }

  if (factors.isLargeViewportRegion) {
    score += 0.15;
    evidence.push('Significant viewport region bounds');
  }

  if (factors.hasHeading) {
    score += 0.15;
    evidence.push('Distinct heading element present');
  }

  if (factors.hasVisualBoundary) {
    score += 0.10;
    evidence.push('Distinct visual background/border boundary');
  }

  if (factors.hasMedia) {
    score += 0.10;
    evidence.push('Embedded visual media/image content');
  }

  if (factors.isRepeatedStructure) {
    score += 0.15;
    evidence.push('Participates in repeated layout pattern');
  }

  if (factors.hasInteractiveControl) {
    score += 0.10;
    evidence.push('Interactive control element present');
  }

  if (factors.isFormContainer) {
    score += 0.15;
    evidence.push('Form input container structure');
  }

  const confidence = Math.min(1.0, Math.max(0.0, Number(score.toFixed(2))));

  return {
    confidence,
    evidence: evidence.length > 0 ? evidence : ['Observed structural DOM evidence'],
  };
}

