import {
  RawExtractionResult,
  NormalizedComponentSystem,
  NormalizedColorSystem,
  NormalizedTypographySystem,
  NormalizedShapeSystem,
  NormalizedLayoutSystem,
} from '../../types/schema.ts';
import { Normalizer } from '../index.ts';
import { detectComponentCandidates } from './componentDetector.ts';
import { detectComponentFamilies } from './familyGrouper.ts';
import { classifySemanticSections } from './sectionClassifier.ts';
import { detectDesignPatterns } from './patternDetector.ts';

export interface ComponentNormalizerOptions {
  confidenceThreshold?: number; // Minimum confidence to accept candidates (default: 0.4)
  colorSystem?: NormalizedColorSystem;
  typographySystem?: NormalizedTypographySystem;
  shapeSystem?: NormalizedShapeSystem;
  layoutSystem?: NormalizedLayoutSystem;
}

export class ComponentNormalizer
  implements Normalizer<RawExtractionResult, NormalizedComponentSystem> {
  public readonly name = 'ComponentNormalizer';
  private options: ComponentNormalizerOptions;

  constructor(options: ComponentNormalizerOptions = {}) {
    this.options = {
      confidenceThreshold: 0.4,
      ...options,
    };
  }

  public normalize(
    raw: RawExtractionResult,
    colorSys?: NormalizedColorSystem,
    typoSys?: NormalizedTypographySystem,
    shapeSys?: NormalizedShapeSystem,
    layoutSys?: NormalizedLayoutSystem
  ): NormalizedComponentSystem {
    if (!raw || !Array.isArray(raw.elements)) {
      return this.createEmptySystem();
    }

    const activeColorSys = colorSys || this.options.colorSystem;
    const activeTypoSys = typoSys || this.options.typographySystem;
    const activeShapeSys = shapeSys || this.options.shapeSystem;
    const activeLayoutSys = layoutSys || this.options.layoutSystem;

    // 1. Detect Component Candidates
    const rawCandidates = detectComponentCandidates(
      raw.elements,
      activeColorSys,
      activeTypoSys,
      activeShapeSys
    );

    // Filter by confidence threshold
    const components = rawCandidates.filter(
      (c) => c.confidence >= (this.options.confidenceThreshold ?? 0.4)
    );

    // 2. Detect Component Families
    const families = detectComponentFamilies(components);

    // 3. Classify Semantic Section Patterns
    const layoutSections = activeLayoutSys ? activeLayoutSys.sections : [];
    const sections = classifySemanticSections(layoutSections, components, raw.elements);

    // 4. Detect Visual Design Patterns
    const patterns = detectDesignPatterns(components, families, activeShapeSys, activeLayoutSys);

    return {
      components,
      families,
      sections,
      patterns,
      stats: {
        totalComponents: components.length,
        familyCount: families.length,
        sectionCount: sections.length,
        patternCount: patterns.length,
      },
    };
  }

  private createEmptySystem(): NormalizedComponentSystem {
    return {
      components: [],
      families: [],
      sections: [],
      patterns: [],
      stats: {
        totalComponents: 0,
        familyCount: 0,
        sectionCount: 0,
        patternCount: 0,
      },
    };
  }
}
