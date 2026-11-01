import {
  RawExtractionResult,
  NormalizedTypographySystem,
  TypographyToken,
  FontFamilyStack,
} from '../../types/schema.ts';
import { Normalizer } from '../index.ts';
import { parseFontFamily } from './fontParser.ts';
import {
  parseFontSizePx,
  parseFontWeight,
  parseLineHeightPx,
  clusterTypographyTokens,
} from './typographyClusterer.ts';
import { detectTypographyHierarchy } from './hierarchyDetector.ts';

export interface TypographyNormalizerOptions {
  includeHiddenElements?: boolean;
  clusterTolerancePx?: number; // Size tolerance in px for clustering (default: 0.5px)
}

export class TypographyNormalizer
  implements Normalizer<RawExtractionResult, NormalizedTypographySystem> {
  public readonly name = 'TypographyNormalizer';
  private options: TypographyNormalizerOptions;

  constructor(options: TypographyNormalizerOptions = {}) {
    this.options = {
      includeHiddenElements: false,
      clusterTolerancePx: 0.5,
      ...options,
    };
  }

  public normalize(raw: RawExtractionResult): NormalizedTypographySystem {
    if (!raw || !Array.isArray(raw.elements)) {
      return {
        fontFamilies: [],
        tokens: [],
        hierarchy: {},
        stats: { rawTextElementCount: 0, uniqueTokenCount: 0, fontFamilyCount: 0 },
      };
    }

    const textElements = raw.elements.filter((e) => {
      const isVisibleCheck = this.options.includeHiddenElements ? true : e.isVisible;
      return isVisibleCheck && e.textMeta && e.textMeta.hasText && e.typography;
    });

    const fontFamilyMap = new Map<string, FontFamilyStack>();
    const tokenMap = new Map<
      string,
      {
        rawToken: Omit<TypographyToken, 'id'>;
        frequency: number;
      }
    >();

    for (const el of textElements) {
      const typo = el.typography;
      const parsedFamily = parseFontFamily(typo.fontFamily);

      // Aggregate font family usage
      let familyRecord = fontFamilyMap.get(parsedFamily.primary);
      if (!familyRecord) {
        familyRecord = { ...parsedFamily, usageCount: 0 };
        fontFamilyMap.set(parsedFamily.primary, familyRecord);
      }
      familyRecord.usageCount++;

      const fontSizePx = parseFontSizePx(typo.fontSize);
      const fontWeight = parseFontWeight(typo.fontWeight);
      const lineHeightPx = parseLineHeightPx(typo.lineHeight, fontSizePx);
      const letterSpacing = typo.letterSpacing || 'normal';
      const textTransform = typo.textTransform || 'none';
      const textAlign = typo.textAlign || 'left';

      const tokenKey = `${parsedFamily.primary}_${fontSizePx}px_${fontWeight}_lh${lineHeightPx}_tt${textTransform}_ta${textAlign}`;

      let record = tokenMap.get(tokenKey);
      if (!record) {
        record = {
          rawToken: {
            fontFamily: parsedFamily.name,
            primaryFamily: parsedFamily.primary,
            fontSizePx,
            fontWeight,
            lineHeightPx,
            letterSpacing,
            textTransform,
            textAlign,
            frequency: 0,
          },
          frequency: 0,
        };
        tokenMap.set(tokenKey, record);
      }
      record.frequency++;
    }

    // Convert raw records to unclustered tokens
    const initialTokens: TypographyToken[] = [];
    let tempId = 1;

    for (const record of tokenMap.values()) {
      initialTokens.push({
        id: `raw_typo_${tempId++}`,
        ...record.rawToken,
        frequency: record.frequency,
      });
    }

    // Cluster typography tokens
    const clustered = clusterTypographyTokens(
      initialTokens,
      this.options.clusterTolerancePx
    );

    // Assign final deterministic token IDs (typo_1, typo_2, ...)
    const tokens: TypographyToken[] = clustered
      .sort((a, b) => b.frequency - a.frequency)
      .map((t, idx) => ({
        ...t,
        id: `typo_${idx + 1}`,
      }));

    const fontFamilies = Array.from(fontFamilyMap.values()).sort(
      (a, b) => b.usageCount - a.usageCount
    );

    const hierarchy = detectTypographyHierarchy(textElements, tokens);

    return {
      fontFamilies,
      tokens,
      hierarchy,
      stats: {
        rawTextElementCount: textElements.length,
        uniqueTokenCount: tokens.length,
        fontFamilyCount: fontFamilies.length,
      },
    };
  }
}
