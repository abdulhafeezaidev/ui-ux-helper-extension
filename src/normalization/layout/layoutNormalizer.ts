import {
  RawExtractionResult,
  NormalizedLayoutSystem,
  FlexLayoutDetail,
  GridLayoutDetail,
} from '../../types/schema.ts';
import { Normalizer } from '../index.ts';
import { analyzeFlexLayout, analyzeGridLayout } from './flexGridAnalyzer.ts';
import { detectSpatialRelations } from './spatialRelations.ts';
import { extractSpacingScale } from './spacingScale.ts';
import { detectContainersAndSections } from './sectionDetector.ts';

export interface LayoutNormalizerOptions {
  includeHiddenElements?: boolean;
  tolerancePx?: number;
}

export class LayoutNormalizer
  implements Normalizer<RawExtractionResult, NormalizedLayoutSystem> {
  public readonly name = 'LayoutNormalizer';
  private options: LayoutNormalizerOptions;

  constructor(options: LayoutNormalizerOptions = {}) {
    this.options = {
      includeHiddenElements: false,
      tolerancePx: 5.0,
      ...options,
    };
  }

  public normalize(raw: RawExtractionResult): NormalizedLayoutSystem {
    if (!raw || !Array.isArray(raw.elements)) {
      return this.createEmptySystem();
    }

    const targetElements = this.options.includeHiddenElements
      ? raw.elements
      : raw.elements.filter((e) => e.isVisible);

    const viewport = raw.pageMeta?.viewport || { width: 1024, height: 768 };
    const documentHeight = Math.max(
      ...targetElements.map((e) => e.boundingRect.y + e.boundingRect.height),
      viewport.height
    );

    const hasHorizontalOverflow = targetElements.some(
      (e) => e.boundingRect.x + e.boundingRect.width > viewport.width + 10
    );

    const flexLayouts: FlexLayoutDetail[] = [];
    const gridLayouts: GridLayoutDetail[] = [];

    for (const el of targetElements) {
      const flex = analyzeFlexLayout(el);
      if (flex) flexLayouts.push(flex);

      const grid = analyzeGridLayout(el);
      if (grid) gridLayouts.push(grid);
    }

    const spatialRelations = detectSpatialRelations(targetElements, this.options.tolerancePx);
    const spacingScale = extractSpacingScale(targetElements);
    const { containers, sections } = detectContainersAndSections(targetElements, viewport.width);

    return {
      containers,
      flexLayouts,
      gridLayouts,
      spatialRelations,
      spacingScale,
      sections,
      viewport: {
        width: viewport.width,
        height: viewport.height,
        documentHeight,
        hasHorizontalOverflow,
      },
      stats: {
        containerCount: containers.length,
        flexCount: flexLayouts.length,
        gridCount: gridLayouts.length,
        sectionCount: sections.length,
        relationCount: spatialRelations.length,
      },
    };
  }

  private createEmptySystem(): NormalizedLayoutSystem {
    return {
      containers: [],
      flexLayouts: [],
      gridLayouts: [],
      spatialRelations: [],
      spacingScale: [],
      sections: [],
      viewport: {
        width: 1024,
        height: 768,
        documentHeight: 768,
        hasHorizontalOverflow: false,
      },
      stats: {
        containerCount: 0,
        flexCount: 0,
        gridCount: 0,
        sectionCount: 0,
        relationCount: 0,
      },
    };
  }
}
