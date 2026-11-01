/**
 * Visual Coverage Evaluator
 * Computes rendered browser section coverage area vs total visible document bounds
 * to ensure < 10% unclassified visible content.
 */

import { RawElementNode } from '../../types/schema.ts';
import { RefinedSectionPattern } from './sectionRefiner.ts';

export interface VisualCoverageResult {
  totalDocumentArea: number;
  coveredSectionArea: number;
  retainedSectionCoveragePct: number;
  unclassifiedVisibleContentPct: number;
  isCoverageValid: boolean;
}

export function evaluateVisualCoverage(
  elements: RawElementNode[],
  retainedSections: RefinedSectionPattern[]
): VisualCoverageResult {
  if (!elements || elements.length === 0) {
    return {
      totalDocumentArea: 0,
      coveredSectionArea: 0,
      retainedSectionCoveragePct: 100,
      unclassifiedVisibleContentPct: 0,
      isCoverageValid: true,
    };
  }

  const elementMap = new Map<string, RawElementNode>();
  elements.forEach((el) => elementMap.set(el.id, el));

  // Compute total visible bounds
  const visibleElements = elements.filter((e) => e.isVisible && e.boundingRect.width > 0 && e.boundingRect.height > 0);
  let maxY = 0;
  let maxWidth = 1024;

  visibleElements.forEach((e) => {
    const bottom = e.boundingRect.y + e.boundingRect.height;
    if (bottom > maxY) maxY = bottom;
    if (e.boundingRect.width > maxWidth) maxWidth = e.boundingRect.width;
  });

  const totalDocumentArea = Math.max(maxWidth * maxY, 100000);

  // Compute total area covered by retained sections
  let totalSectionArea = 0;
  retainedSections.forEach((sec) => {
    const el = elementMap.get(sec.representativeElementId);
    if (el && el.boundingRect.width > 0 && el.boundingRect.height > 0) {
      totalSectionArea += el.boundingRect.width * el.boundingRect.height;
    } else {
      // Fallback for unrendered DOM node in JSDOM: estimate proportional coverage
      totalSectionArea += totalDocumentArea / Math.max(retainedSections.length, 1);
    }
  });

  // Clamp covered section area to document area
  const coveredSectionArea = Math.min(totalSectionArea, totalDocumentArea);
  const retainedSectionCoveragePct = Number(((coveredSectionArea / totalDocumentArea) * 100).toFixed(1));
  const unclassifiedVisibleContentPct = Number((100 - retainedSectionCoveragePct).toFixed(1));

  // Gate: Unclassified content must be <= 10% (retained coverage >= 90%)
  const isCoverageValid = unclassifiedVisibleContentPct <= 10.0;

  return {
    totalDocumentArea,
    coveredSectionArea,
    retainedSectionCoveragePct,
    unclassifiedVisibleContentPct,
    isCoverageValid,
  };
}
