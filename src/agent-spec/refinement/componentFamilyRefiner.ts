/**
 * Component Family Refiner (Prompt 15 Component Category Role & Semantic Abstraction)
 * Computes structural & visual signatures for component candidates,
 * classifies component category roles (semantic-component, interactive-control, icon-control-primitive),
 * calculates width/height variance, visual/typography/color signatures,
 * groups repeated components into unified families, and identifies component variants.
 */

import { UIComponentCandidate, RawElementNode } from '../../types/schema.ts';
import { ComponentCategoryRole } from '../schema.ts';
import { calibrateConfidence } from './confidenceCalibrator.ts';

export interface ComponentVisualSignature {
  type: string;
  width: number;
  height: number;
  aspectRatio: number;
  isRealBrowserGeometry: boolean;
  hasImage: boolean;
  hasHeading: boolean;
  hasButton: boolean;
  backgroundColor: string;
  color: string;
  fontSize: string;
  fontWeight: string;
  borderRadius: string;
  boxShadow: string;
  childCount: number;
}

export interface ComponentVariantSpec {
  name: string;
  instanceCount: number;
  signature: string;
}

export interface RefinedComponentFamily {
  familyId: string;
  type: string;
  categoryRole: ComponentCategoryRole;
  instanceCount: number;
  representativeElementId: string;
  memberElementIds: string[];
  sharedProperties: string[];
  variableProperties: string[];
  confidence: number;
  evidence: string[];
  sourceElementIds: string[];
  isRealBrowserGeometry: boolean;
  avgWidth: number;
  avgHeight: number;
  widthVariance: number;
  heightVariance: number;
  visualSignature: string;
  typographySignature: string;
  colorSignature: string;
  variants: ComponentVariantSpec[];
}

export function buildComponentSignature(
  comp: UIComponentCandidate,
  elementsMap: Map<string, RawElementNode>
): ComponentVisualSignature {
  const rootEl = elementsMap.get(comp.rootElementId);
  const childEls = (comp.childElementIds || []).map((id: string) => elementsMap.get(id)).filter(Boolean) as RawElementNode[];

  const width = comp.bounds && comp.bounds.width > 0 ? comp.bounds.width : (rootEl?.boundingRect.width || 0);
  const height = comp.bounds && comp.bounds.height > 0 ? comp.bounds.height : (rootEl?.boundingRect.height || 0);
  const isRealBrowserGeometry = width > 0 && height > 0;
  const aspectRatio = isRealBrowserGeometry ? Number((width / height).toFixed(1)) : 1.0;

  const hasImage = childEls.some((e) => e.tagName.toLowerCase() === 'img' || e.tagName.toLowerCase() === 'svg');
  const hasHeading = childEls.some((e) => ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(e.tagName.toLowerCase()));
  const hasButton = childEls.some((e) => e.tagName.toLowerCase() === 'button' || e.role === 'button');

  return {
    type: comp.type,
    width,
    height,
    aspectRatio,
    isRealBrowserGeometry,
    hasImage,
    hasHeading,
    hasButton,
    backgroundColor: rootEl?.backgroundColor || 'transparent',
    color: rootEl?.color || 'initial',
    fontSize: rootEl?.typography?.fontSize || '16px',
    fontWeight: rootEl?.typography?.fontWeight || '400',
    borderRadius: rootEl?.borderRadius?.topLeft || '0px',
    boxShadow: rootEl?.boxShadow || 'none',
    childCount: childEls.length,
  };
}

export function computeComponentSimilarity(
  sigA: ComponentVisualSignature,
  sigB: ComponentVisualSignature
): number {
  if (sigA.type !== sigB.type) return 0.0;

  let matches = 0;
  let total = 7;

  if (isNaN(sigA.aspectRatio) || isNaN(sigB.aspectRatio) || Math.abs(sigA.aspectRatio - sigB.aspectRatio) <= 0.3) matches += 1;
  if (sigA.hasImage === sigB.hasImage) matches += 1;
  if (sigA.hasHeading === sigB.hasHeading) matches += 1;
  if (sigA.hasButton === sigB.hasButton) matches += 1;
  if (sigA.backgroundColor === sigB.backgroundColor) matches += 1;
  if (sigA.borderRadius === sigB.borderRadius) matches += 1;
  if (Math.abs(sigA.childCount - sigB.childCount) <= 2) matches += 1;

  return Number((matches / total).toFixed(2));
}

export function refineComponentFamilies(
  rawComponents: UIComponentCandidate[],
  elements: RawElementNode[]
): RefinedComponentFamily[] {
  if (!rawComponents || rawComponents.length === 0) return [];

  const elementsMap = new Map<string, RawElementNode>();
  elements.forEach((el) => elementsMap.set(el.id, el));

  const signatures = rawComponents.map((c) => ({
    comp: c,
    sig: buildComponentSignature(c, elementsMap),
  }));

  const families: { members: typeof signatures; type: string }[] = [];

  signatures.forEach((item) => {
    let matchedFamily = families.find((fam) => {
      if (fam.type !== item.comp.type) return false;
      const sim = computeComponentSimilarity(fam.members[0].sig, item.sig);
      return sim >= 0.70;
    });

    if (!matchedFamily) {
      matchedFamily = { members: [], type: item.comp.type };
      families.push(matchedFamily);
    }
    matchedFamily.members.push(item);
  });

  const refinedFamilies: RefinedComponentFamily[] = [];
  let familyIndex = 1;

  families.forEach((fam) => {
    const memberIds = fam.members.map((m) => m.comp.rootElementId);
    const allSourceIds = Array.from(new Set(fam.members.flatMap((m) => [m.comp.rootElementId, ...m.comp.childElementIds])));
    const rep = fam.members[0];

    const hasRealGeom = fam.members.some((m) => m.sig.isRealBrowserGeometry);
    const realMembers = fam.members.filter((m) => m.sig.isRealBrowserGeometry);

    let avgWidth = 0;
    let avgHeight = 0;
    let widthVariance = 0;
    let heightVariance = 0;

    if (hasRealGeom && realMembers.length > 0) {
      const widths = realMembers.map((m) => m.sig.width);
      const heights = realMembers.map((m) => m.sig.height);

      avgWidth = Math.round(widths.reduce((a, b) => a + b, 0) / widths.length);
      avgHeight = Math.round(heights.reduce((a, b) => a + b, 0) / heights.length);

      widthVariance = Math.round(
        Math.sqrt(widths.reduce((sq, w) => sq + Math.pow(w - avgWidth, 2), 0) / widths.length)
      );
      heightVariance = Math.round(
        Math.sqrt(heights.reduce((sq, h) => sq + Math.pow(h - avgHeight, 2), 0) / heights.length)
      );
    }

    // Determine component category role
    let categoryRole: ComponentCategoryRole = 'semantic-component';
    if (avgWidth > 0 && avgHeight > 0 && avgWidth < 24 && avgHeight < 24) {
      categoryRole = 'icon-control-primitive';
    } else if (fam.type === 'input' || fam.type === 'form') {
      categoryRole = 'interactive-control';
    } else if (!hasRealGeom) {
      categoryRole = 'structural-wrapper';
    }

    const firstSig = rep.sig;
    const geomStatus = hasRealGeom ? `${avgWidth}x${avgHeight}px` : 'unrendered-dom-fallback';
    const visualSignature = `${fam.type} (${geomStatus}) [${firstSig.borderRadius} radius, ${firstSig.boxShadow !== 'none' ? 'elevation' : 'flat'}]`;
    const typographySignature = `${firstSig.fontSize} / ${firstSig.fontWeight}`;
    const colorSignature = `bg: ${firstSig.backgroundColor}, fg: ${firstSig.color}`;

    const variantMap = new Map<string, number>();
    fam.members.forEach((m) => {
      const vSig = `bg:${m.sig.backgroundColor}, radius:${m.sig.borderRadius}, media:${m.sig.hasImage}`;
      variantMap.set(vSig, (variantMap.get(vSig) || 0) + 1);
    });

    const variants: ComponentVariantSpec[] = [];
    let vIdx = 1;
    variantMap.forEach((count, vSig) => {
      const name = variantMap.size === 1 ? 'standard' : `variant-${vIdx++}`;
      variants.push({
        name,
        instanceCount: count,
        signature: vSig,
      });
    });

    const sharedProperties: string[] = [];
    const variableProperties: string[] = [];

    const allSameBg = fam.members.every((m) => m.sig.backgroundColor === firstSig.backgroundColor);
    const allSameRadius = fam.members.every((m) => m.sig.borderRadius === firstSig.borderRadius);
    const allSameImage = fam.members.every((m) => m.sig.hasImage === firstSig.hasImage);

    if (allSameBg) sharedProperties.push(`background: ${firstSig.backgroundColor}`);
    else variableProperties.push('background color');

    if (allSameRadius) sharedProperties.push(`radius: ${firstSig.borderRadius}`);
    else variableProperties.push('border radius');

    if (allSameImage && firstSig.hasImage) sharedProperties.push('image media component');
    variableProperties.push('text content', 'item dimensions');

    const cal = calibrateConfidence({
      isRepeatedStructure: fam.members.length > 1,
      hasVisualBoundary: firstSig.backgroundColor !== 'transparent' || firstSig.borderRadius !== '0px',
      hasMedia: firstSig.hasImage,
      hasInteractiveControl: firstSig.hasButton || fam.type === 'button',
    });

    refinedFamilies.push({
      familyId: `${fam.type}-${familyIndex++}`,
      type: fam.type,
      categoryRole,
      instanceCount: fam.members.length,
      representativeElementId: rep.comp.rootElementId,
      memberElementIds: memberIds,
      sharedProperties,
      variableProperties,
      confidence: cal.confidence,
      evidence: Array.from(new Set([...(rep.comp.evidence || []), ...(cal.evidence || [])])),
      sourceElementIds: allSourceIds,
      isRealBrowserGeometry: hasRealGeom,
      avgWidth,
      avgHeight,
      widthVariance,
      heightVariance,
      visualSignature,
      typographySignature,
      colorSignature,
      variants,
    });
  });

  return refinedFamilies;
}
