/**
 * Semantic Section Refiner (Prompt 15 Section Over-Classification & Hierarchy Refinement)
 * Evaluates raw section candidates, suppresses true duplicate DOM wrappers & nested semantic child nodes
 * inside major <header>, <nav>, and <footer> regions, and calibrates evidence-backed confidence scores.
 */

import { SemanticSection, RawElementNode } from '../../types/schema.ts';
import { calibrateConfidence } from './confidenceCalibrator.ts';

export type SuppressedSectionCategory =
  | 'TRUE_WRAPPER_DUPLICATE'
  | 'NESTED_REAL_SECTION'
  | 'EMPTY_STRUCTURAL_WRAPPER'
  | 'LOW_CONFIDENCE'
  | 'REDUNDANT_SEMANTIC_REGION';

export interface SuppressedSectionLog {
  sourceElementId: string;
  sectionType: string;
  category: SuppressedSectionCategory;
  reason: string;
}

export interface RefinedSectionPattern {
  id: string;
  sectionType: string;
  instanceCount: number;
  representativeElementId: string;
  confidence: number;
  evidence: string[];
  componentIds: string[];
  sourceElementIds: string[];
}

export interface RefinementSectionsResult {
  retained: RefinedSectionPattern[];
  suppressed: SuppressedSectionLog[];
}

function isDomAncestor(ancestorId: string, descendantId: string, elementMap: Map<string, RawElementNode>): boolean {
  let curr = elementMap.get(descendantId);
  while (curr && curr.parentId) {
    if (curr.parentId === ancestorId) return true;
    curr = elementMap.get(curr.parentId);
  }
  return false;
}

export function refineSectionsDetailed(
  rawSections: SemanticSection[],
  elements: RawElementNode[]
): RefinementSectionsResult {
  if (!rawSections || rawSections.length === 0) {
    return { retained: [], suppressed: [] };
  }

  const elementMap = new Map<string, RawElementNode>();
  elements.forEach((el) => elementMap.set(el.id, el));

  const suppressed: SuppressedSectionLog[] = [];

  // 1. Calibrate Confidence for each section candidate (preserve initial classification confidence)
  const calibratedCandidates = rawSections.map((sec) => {
    const el = elementMap.get(sec.elementId);
    const tagName = el?.tagName.toLowerCase() || '';

    const isSemanticTag = ['header', 'nav', 'main', 'section', 'footer', 'article', 'aside'].includes(tagName);
    const hasHeading = sec.evidence.some((ev: string) => ev.toLowerCase().includes('heading'));
    const isLargeViewportRegion = sec.evidence.some((ev: string) => ev.toLowerCase().includes('viewport'));
    const hasVisualBoundary = sec.evidence.some((ev: string) => ev.toLowerCase().includes('background') || ev.toLowerCase().includes('border'));

    const cal = calibrateConfidence({
      isSemanticTag,
      hasHeading,
      isLargeViewportRegion,
      hasVisualBoundary,
      isRepeatedStructure: sec.componentIds.length > 1,
    });

    const finalConfidence = Math.max(sec.confidence || 0, cal.confidence);

    return {
      ...sec,
      confidence: finalConfidence,
      evidence: Array.from(new Set([...sec.evidence, ...cal.evidence])),
    };
  });

  // 2. Filter out Low-Confidence Noise (< 0.40)
  const validCandidates: typeof calibratedCandidates = [];
  calibratedCandidates.forEach((cand) => {
    if (cand.confidence < 0.40) {
      suppressed.push({
        sourceElementId: cand.elementId,
        sectionType: cand.sectionType,
        category: 'LOW_CONFIDENCE',
        reason: `Calibrated confidence (${cand.confidence}) below threshold 0.40`,
      });
    } else {
      validCandidates.push(cand);
    }
  });

  // 3. Container Parent Yielding: If Candidate A (main, body, page wrapper, or container spanning >80% height) contains 2+ valid child section candidates inside it, Candidate A yields to its child sections
  const nonParentContainerCandidates: typeof validCandidates = [];
  validCandidates.forEach((cand) => {
    const el = elementMap.get(cand.elementId);
    const tag = el?.tagName.toLowerCase() || '';
    const role = (el?.role || '').toLowerCase();
    const cls = (el?.className || '').toLowerCase();

    const isTopWrapperTag =
      tag === 'main' ||
      tag === 'body' ||
      role === 'main' ||
      cls.includes('layout') ||
      cls.includes('page') ||
      (el && el.boundingRect.height > 2000 && el.boundingRect.width >= 1000);

    if (isTopWrapperTag) {
      const childSectionCandidates = validCandidates.filter(
        (other) => other.elementId !== cand.elementId && isDomAncestor(cand.elementId, other.elementId, elementMap)
      );
      if (childSectionCandidates.length >= 2) {
        suppressed.push({
          sourceElementId: cand.elementId,
          sectionType: cand.sectionType,
          category: 'TRUE_WRAPPER_DUPLICATE',
          reason: `Parent container <${tag}> yields to its ${childSectionCandidates.length} distinct child sections`,
        });
        return;
      }
    }
    nonParentContainerCandidates.push(cand);
  });

  // 4. Major Semantic Region Child Suppression: Prevent descendants of <header>, <nav>, <footer> from spawning separate section entries
  const nonDuplicateCandidates: typeof nonParentContainerCandidates = [];

  for (const candidate of nonParentContainerCandidates) {
    const el = elementMap.get(candidate.elementId);
    if (!el) continue;

    // Check if candidate is inside a major semantic ancestor (<header>, <nav>, <footer>) already in retained list
    const majorAncestor = nonDuplicateCandidates.find((existing) => {
      const existingEl = elementMap.get(existing.elementId);
      const tag = existingEl?.tagName.toLowerCase() || '';
      const isMajorTag =
        ['header', 'nav', 'footer'].includes(tag) ||
        existing.sectionType === 'navigation' ||
        existing.sectionType === 'footer';
      return isMajorTag && isDomAncestor(existing.elementId, candidate.elementId, elementMap);
    });

    if (majorAncestor) {
      suppressed.push({
        sourceElementId: candidate.elementId,
        sectionType: candidate.sectionType,
        category: 'NESTED_REAL_SECTION',
        reason: `Suppressed descendant section candidate inside major <${elementMap.get(majorAncestor.elementId)?.tagName.toLowerCase()}> region ${majorAncestor.elementId}`,
      });
      majorAncestor.evidence.push(`Included nested structural child: ${candidate.elementId}`);
      continue;
    }

    // Check if candidate is an empty structural wrapper
    if (candidate.componentIds.length === 0 && (!el.childIds || el.childIds.length === 0)) {
      suppressed.push({
        sourceElementId: candidate.elementId,
        sectionType: candidate.sectionType,
        category: 'EMPTY_STRUCTURAL_WRAPPER',
        reason: 'Section candidate contains no child components or text content',
      });
      continue;
    }

    // Check if candidate is a true duplicate wrapper of an already accepted candidate
    const matchingDuplicate = nonDuplicateCandidates.find((existing) => {
      const existingEl = elementMap.get(existing.elementId);
      if (!existingEl) return false;

      const isRelated =
        isDomAncestor(existing.elementId, candidate.elementId, elementMap) ||
        isDomAncestor(candidate.elementId, existing.elementId, elementMap);

      if (!isRelated) return false;

      const hasRealBounds = existingEl.boundingRect.height > 0 && el.boundingRect.height > 0;
      let boundsMatch = false;

      if (hasRealBounds) {
        const sameWidth = Math.abs(existingEl.boundingRect.width - el.boundingRect.width) < 15;
        const sameHeight = Math.abs(existingEl.boundingRect.height - el.boundingRect.height) < 15;
        const sameY = Math.abs(existingEl.boundingRect.y - el.boundingRect.y) < 15;
        boundsMatch = sameWidth && sameHeight && sameY;
      } else {
        const candidateCompSet = new Set(candidate.componentIds);
        const existingCompSet = new Set(existing.componentIds);
        const sameComponents =
          candidateCompSet.size === existingCompSet.size &&
          [...candidateCompSet].every((id) => existingCompSet.has(id));
        boundsMatch = sameComponents;
      }

      const existingComps = new Set(existing.componentIds);
      const hasUniqueComps = candidate.componentIds.some((id) => !existingComps.has(id));

      return boundsMatch && !hasUniqueComps;
    });

    if (matchingDuplicate) {
      suppressed.push({
        sourceElementId: candidate.elementId,
        sectionType: candidate.sectionType,
        category: 'TRUE_WRAPPER_DUPLICATE',
        reason: `Nested DOM wrapper duplicate of ${matchingDuplicate.elementId} covering identical bounds without unique components`,
      });
      matchingDuplicate.evidence.push(`Included duplicate wrapper: ${candidate.elementId}`);
    } else {
      nonDuplicateCandidates.push(candidate);
    }
  }

  // 5. Preserve Distinct Sequential Sections in Document Flow Order (y position ascending)
  nonDuplicateCandidates.sort((a, b) => {
    const elA = elementMap.get(a.elementId);
    const elB = elementMap.get(b.elementId);
    const yA = elA ? elA.boundingRect.y : 0;
    const yB = elB ? elB.boundingRect.y : 0;
    return yA - yB;
  });

  let index = 1;
  const retained: RefinedSectionPattern[] = nonDuplicateCandidates.map((sec) => ({
    id: `sec_${index++}`,
    sectionType: sec.sectionType,
    instanceCount: 1,
    representativeElementId: sec.elementId,
    confidence: sec.confidence,
    evidence: sec.evidence,
    componentIds: sec.componentIds,
    sourceElementIds: [sec.elementId],
  }));

  return { retained, suppressed };
}

export function refineSections(
  rawSections: SemanticSection[],
  elements: RawElementNode[]
): RefinedSectionPattern[] {
  return refineSectionsDetailed(rawSections, elements).retained;
}
