/**
 * Design Intelligence Refinement Engine
 * Integrates token refinement, radius classification, section containment suppression,
 * component family grouping, confidence calibration, visual coverage evaluation, and ADS fidelity scoring.
 */

import { AnalyzePageResponseData } from '../../types/index.ts';
import { refineSpacingTokens, RefinedSpacingToken } from './tokenRefiner.ts';
import { refineRadiusTokens, RefinedRadiusToken } from './outlierFilter.ts';
import { refineSections, RefinedSectionPattern } from './sectionRefiner.ts';
import { refineComponentFamilies, RefinedComponentFamily } from './componentFamilyRefiner.ts';
import { generateDesignSummary, MeasurableDesignSummary } from './designSummary.ts';
import { evaluateVisualCoverage, VisualCoverageResult } from './visualCoverageEvaluator.ts';
import { computeAdsFidelityScore, AdsFidelityScoreResult } from './fidelityScoreEngine.ts';

export * from './tokenRefiner.ts';
export * from './outlierFilter.ts';
export * from './sectionRefiner.ts';
export * from './componentFamilyRefiner.ts';
export * from './confidenceCalibrator.ts';
export * from './designSummary.ts';
export * from './visualCoverageEvaluator.ts';
export * from './fidelityScoreEngine.ts';

export interface RefinedDesignIntelligence {
  spacingScale: RefinedSpacingToken[];
  radiusTokens: RefinedRadiusToken[];
  sections: RefinedSectionPattern[];
  componentFamilies: RefinedComponentFamily[];
  summary: MeasurableDesignSummary;
  coverage: VisualCoverageResult;
  fidelityScore: AdsFidelityScoreResult;
}

export function refineDesignIntelligence(data: AnalyzePageResponseData): RefinedDesignIntelligence {
  const elements = data.extractionResult?.elements || [];
  const compSys = data.componentSystem;
  const colorSys = data.colorSystem;
  const typoSys = data.typographySystem;
  const shapeSys = data.shapeSystem;

  // 1. Refine Spacing Scale
  const spacingScale = refineSpacingTokens(elements);

  // 2. Refine Radius Scale
  const radiusTokens = refineRadiusTokens(elements);

  // 3. Refine Sections (Suppression of nested wrappers & grouping repeated section patterns)
  const sections = refineSections(compSys?.sections || [], elements);

  // 4. Refine Component Families (Similarity clustering with instanceCount > 1)
  const componentFamilies = refineComponentFamilies(compSys?.components || [], elements);

  // 5. Evaluate Visual Coverage
  const coverage = evaluateVisualCoverage(elements, sections);

  // 6. Generate Measurable Design Summary
  const summary = generateDesignSummary(
    colorSys?.tokens?.length || 0,
    typoSys?.fontFamilies?.[0]?.primary || (typoSys?.tokens?.[0] as any)?.primaryFont || 'sans-serif',
    spacingScale,
    radiusTokens,
    sections,
    componentFamilies,
    shapeSys?.surfaceCounts || {}
  );

  // 7. Compute ADS Fidelity Score (0-100)
  const tempRefined = {
    spacingScale,
    radiusTokens,
    sections,
    componentFamilies,
    summary,
    coverage,
    fidelityScore: null as any,
  };
  const fidelityScore = computeAdsFidelityScore(tempRefined, coverage, true, colorSys?.tokens?.length || 0);

  return {
    spacingScale,
    radiusTokens,
    sections,
    componentFamilies,
    summary,
    coverage,
    fidelityScore,
  };
}
