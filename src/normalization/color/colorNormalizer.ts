import {
  RawExtractionResult,
  NormalizedColorSystem,
  ColorToken,
  CanonicalColor,
  ColorUsageCategory,
  ColorContrastPair,
} from '../../types/schema.ts';
import { Normalizer } from '../index.ts';
import { parseColor } from './colorParser.ts';
import { calculateRelativeLuminance, calculateContrastRatio } from './contrast.ts';
import { clusterColorTokens } from './colorClusterer.ts';
import { detectSemanticRoles } from './roleDetector.ts';

export interface ColorNormalizerOptions {
  clusterThreshold?: number; // Configurable RGB Euclidean distance threshold (default: 15.0)
  includeHiddenElements?: boolean;
}

export class ColorNormalizer
  implements Normalizer<RawExtractionResult, NormalizedColorSystem> {
  public readonly name = 'ColorNormalizer';
  private options: ColorNormalizerOptions;

  constructor(options: ColorNormalizerOptions = {}) {
    this.options = {
      clusterThreshold: 15.0,
      includeHiddenElements: false,
      ...options,
    };
  }

  public normalize(raw: RawExtractionResult): NormalizedColorSystem {
    if (!raw || !Array.isArray(raw.elements)) {
      return {
        tokens: [],
        dominantColors: [],
        roles: {},
        contrastPairs: [],
        stats: { rawColorCount: 0, normalizedColorCount: 0, transparentCount: 0 },
      };
    }

    // Filter elements to avoid false palette inflation from hidden nodes if specified
    const targetElements = this.options.includeHiddenElements
      ? raw.elements
      : raw.elements.filter((e) => e.isVisible);

    const colorMap = new Map<
      string,
      {
        canonical: CanonicalColor;
        frequency: number;
        usageCount: { background: number; text: number; border: number; cta: number };
        usages: Set<ColorUsageCategory>;
      }
    >();

    let transparentCount = 0;

    const addUsage = (colorStr: string, category: ColorUsageCategory) => {
      const canonical = parseColor(colorStr);

      if (canonical.a === 0) {
        transparentCount++;
        return;
      }

      const key = canonical.hex + `_a${canonical.a.toFixed(2)}`;
      let record = colorMap.get(key);

      if (!record) {
        record = {
          canonical,
          frequency: 0,
          usageCount: { background: 0, text: 0, border: 0, cta: 0 },
          usages: new Set<ColorUsageCategory>(),
        };
        colorMap.set(key, record);
      }

      record.frequency++;
      record.usages.add(category);

      if (category === 'background') record.usageCount.background++;
      if (category === 'text') record.usageCount.text++;
      if (category === 'border') record.usageCount.border++;
      if (category === 'cta') {
        record.usageCount.cta++;
        record.usageCount.background++;
        record.usages.add('background');
      }
    };

    // Analyze element color properties
    for (const el of targetElements) {
      const isInteractive =
        el.tagName === 'button' ||
        el.role === 'button' ||
        (el.tagName === 'a' && el.backgroundColor !== 'rgba(0, 0, 0, 0)');

      // Background usage
      if (el.backgroundColor) {
        addUsage(el.backgroundColor, isInteractive ? 'cta' : 'background');
      }

      // Text usage
      if (el.textMeta && el.textMeta.hasText && el.color) {
        addUsage(el.color, 'text');
      }

      // Border usage
      if (el.borderWidths && el.borderColors) {
        const hasTopBorder = el.borderWidths.top !== '0px' && el.borderStyles?.top !== 'none';
        if (hasTopBorder && el.borderColors.top) {
          addUsage(el.borderColors.top, 'border');
        }
      }
    }

    const rawColorCount = colorMap.size;

    // Convert raw colorMap records to preliminary ColorTokens
    const initialTokens: ColorToken[] = [];
    let tempId = 1;

    for (const record of colorMap.values()) {
      const luminance = calculateRelativeLuminance(
        record.canonical.r,
        record.canonical.g,
        record.canonical.b
      );

      initialTokens.push({
        id: `raw_color_${tempId++}`,
        color: record.canonical,
        frequency: record.frequency,
        usageCount: record.usageCount,
        usages: Array.from(record.usages),
        luminance,
        isDark: luminance < 0.5,
      });
    }

    // Cluster visually/numerically close colors
    const clusteredTokens = clusterColorTokens(
      initialTokens,
      this.options.clusterThreshold
    );

    // Assign deterministic final token IDs (color_1, color_2, ...)
    const tokens: ColorToken[] = clusteredTokens
      .sort((a, b) => b.frequency - a.frequency)
      .map((t, idx) => ({
        ...t,
        id: `color_${idx + 1}`,
      }));

    // Top dominant colors (top 5 by frequency)
    const dominantColors = tokens.slice(0, 5);

    // Detect semantic color roles
    const roles = detectSemanticRoles(targetElements, tokens);

    // Calculate WCAG contrast pairs between background and text colors
    const contrastPairs: ColorContrastPair[] = [];
    const bgTokens = tokens.filter((t) => t.usages.includes('background'));
    const textTokens = tokens.filter((t) => t.usages.includes('text'));

    for (const bg of bgTokens) {
      for (const fg of textTokens) {
        if (bg.id === fg.id) continue;
        const contrastRatio = calculateContrastRatio(bg.luminance, fg.luminance);
        contrastPairs.push({
          bgTokenId: bg.id,
          fgTokenId: fg.id,
          contrastRatio,
          isWCAGAA: contrastRatio >= 4.5,
          isWCAGAAA: contrastRatio >= 7.0,
        });
      }
    }

    return {
      tokens,
      dominantColors,
      roles,
      contrastPairs,
      stats: {
        rawColorCount,
        normalizedColorCount: tokens.length,
        transparentCount,
      },
    };
  }
}
