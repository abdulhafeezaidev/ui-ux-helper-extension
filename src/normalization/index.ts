/**
 * Normalization Module Contract Definitions & Implementations.
 * Formats raw extraction data into standard design tokens, color systems, typography systems, shape systems, layout systems, and component systems.
 */

export interface Normalizer<TInput = unknown, TOutput = unknown> {
  name: string;
  normalize(raw: TInput): TOutput;
}

export class BaseNormalizer implements Normalizer<unknown, Record<string, unknown>> {
  public readonly name = 'BaseNormalizer';

  public normalize(raw: unknown): Record<string, unknown> {
    if (typeof raw === 'object' && raw !== null) {
      return { ...raw };
    }
    return { value: raw };
  }
}

export * from './color/colorParser.ts';
export * from './color/contrast.ts';
export * from './color/colorClusterer.ts';
export * from './color/roleDetector.ts';
export * from './color/colorNormalizer.ts';

export * from './typography/fontParser.ts';
export * from './typography/typographyClusterer.ts';
export * from './typography/hierarchyDetector.ts';
export * from './typography/typographyNormalizer.ts';
export * from './typography/typographyRhythmEngine.ts';

export * from './shape/radiusParser.ts';
export * from './shape/shadowParser.ts';
export * from './shape/gradientParser.ts';
export * from './shape/surfaceAnalyzer.ts';
export * from './shape/shapeNormalizer.ts';

export * from './layout/flexGridAnalyzer.ts';
export * from './layout/spatialRelations.ts';
export * from './layout/spacingScale.ts';
export * from './layout/sectionDetector.ts';
export * from './layout/layoutNormalizer.ts';
export * from './layout/layoutConstraintEngine.ts';
export * from './layout/constraintEngine.ts';
export * from './layout/responsiveIntelligenceEngine.ts';
export * from './layout/responsiveTransitionEngine.ts';

export * from './component/componentDetector.ts';
export * from './component/familyGrouper.ts';
export * from './component/sectionClassifier.ts';
export * from './component/patternDetector.ts';
export * from './component/componentNormalizer.ts';
export * from './component/componentHierarchyEngine.ts';
export * from './component/reusableComponentDetector.ts';
export * from './component/componentVariantEngine.ts';
export * from './interaction/interactionGraphEngine.ts';
export * from './animation/animationIntelligenceEngine.ts';
export * from './animation/motionTimelineEngine.ts';
export * from './color/designSystemSemanticEngine.ts';
export * from './accessibility/accessibilityExtractionEngine.ts';
export * from './content/contentSemanticEngine.ts';
export * from './graph/reconstructionGraphEngine.ts';
export * from './fidelity/cloneConfidenceCalculator.ts';
export * from './compression/sharedRegistryEngine.ts';
export * from './renderTree/index.ts';
export * from './theme/designPrinciplesEngine.ts';
export * from './theme/componentStyleEngine.ts';
export * from './knowledgeGraph/index.ts';
export * from './intent/index.ts';
export * from './layout/relationships/index.ts';
export * from './planner/index.ts';
export * from './optimizer/index.ts';



