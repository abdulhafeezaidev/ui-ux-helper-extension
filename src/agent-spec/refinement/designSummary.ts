/**
 * High-Level Semantic Design Summary
 * Summarizes measurable design system characteristics without hallucinated adjectives.
 */

import { RefinedSpacingToken } from './tokenRefiner.ts';
import { RefinedRadiusToken } from './outlierFilter.ts';
import { RefinedSectionPattern } from './sectionRefiner.ts';
import { RefinedComponentFamily } from './componentFamilyRefiner.ts';

export interface MeasurableDesignSummary {
  colorPaletteCount: number;
  primaryFontFamily: string;
  spacingScale: number[];
  radiusScale: number[];
  sectionPatternCount: number;
  componentFamilyCount: number;
  totalComponentInstances: number;
  dominantSurfaceCategories: string[];
}

export function generateDesignSummary(
  colorCount: number,
  primaryFont: string,
  spacing: RefinedSpacingToken[],
  radii: RefinedRadiusToken[],
  sections: RefinedSectionPattern[],
  families: RefinedComponentFamily[],
  surfaceCounts: Record<string, number>
): MeasurableDesignSummary {
  const spacingScale = spacing.map((s) => s.valuePx);
  const radiusScale = radii.filter((r) => r.classification === 'reusableToken').map((r) => r.valuePx);
  const totalComponentInstances = families.reduce((acc, f) => acc + f.instanceCount, 0);

  const dominantSurfaces = Object.entries(surfaceCounts)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a)
    .map(([cat]) => cat);

  return {
    colorPaletteCount: colorCount,
    primaryFontFamily: primaryFont,
    spacingScale,
    radiusScale,
    sectionPatternCount: sections.length,
    componentFamilyCount: families.length,
    totalComponentInstances,
    dominantSurfaceCategories: dominantSurfaces,
  };
}
