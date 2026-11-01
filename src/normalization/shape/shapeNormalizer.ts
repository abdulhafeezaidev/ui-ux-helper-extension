import {
  RawExtractionResult,
  NormalizedShapeSystem,
  RadiusToken,
  BorderToken,
  ShadowToken,
  GradientToken,
  SurfaceCategory,
  GeometryClassification,
} from '../../types/schema.ts';
import { Normalizer } from '../index.ts';
import { parseCornerRadiusPx, classifyGeometry, clusterRadiusTokens } from './radiusParser.ts';
import { parseBoxShadow } from './shadowParser.ts';
import { parseGradients } from './gradientParser.ts';
import { classifySurfaces } from './surfaceAnalyzer.ts';

export interface ShapeNormalizerOptions {
  includeHiddenElements?: boolean;
  radiusTolerancePx?: number; // default 1.0px
}

export class ShapeNormalizer implements Normalizer<RawExtractionResult, NormalizedShapeSystem> {
  public readonly name = 'ShapeNormalizer';
  private options: ShapeNormalizerOptions;

  constructor(options: ShapeNormalizerOptions = {}) {
    this.options = {
      includeHiddenElements: false,
      radiusTolerancePx: 1.0,
      ...options,
    };
  }

  public normalize(raw: RawExtractionResult): NormalizedShapeSystem {
    if (!raw || !Array.isArray(raw.elements)) {
      return this.createEmptySystem();
    }

    const targetElements = this.options.includeHiddenElements
      ? raw.elements
      : raw.elements.filter((e) => e.isVisible);

    const radiusMap = new Map<number, { classification: GeometryClassification; frequency: number }>();
    const borderMap = new Map<string, { width: string; style: string; color: string; frequency: number }>();
    const shadowMap = new Map<string, { shadow: any; frequency: number }>();
    const gradientMap = new Map<string, { token: GradientToken; frequency: number }>();

    const surfaceCounts: Record<SurfaceCategory, number> = {
      flat: 0,
      bordered: 0,
      elevated: 0,
      translucent: 0,
      glassLike: 0,
      inset: 0,
      gradient: 0,
      glowing: 0,
    };

    const geometryCounts: Record<GeometryClassification, number> = {
      sharp: 0,
      slightlyRounded: 0,
      rounded: 0,
      highlyRounded: 0,
      pill: 0,
      circular: 0,
      elliptical: 0,
      asymmetric: 0,
    };

    for (const el of targetElements) {
      // 1. Geometry & Radius
      const geometry = classifyGeometry(el.borderRadius, el.boundingRect);
      geometryCounts[geometry]++;

      const maxRadiusPx = Math.max(
        parseCornerRadiusPx(el.borderRadius.topLeft),
        parseCornerRadiusPx(el.borderRadius.topRight),
        parseCornerRadiusPx(el.borderRadius.bottomRight),
        parseCornerRadiusPx(el.borderRadius.bottomLeft)
      );

      const radRecord = radiusMap.get(maxRadiusPx);
      if (radRecord) {
        radRecord.frequency++;
      } else {
        radiusMap.set(maxRadiusPx, { classification: geometry, frequency: 1 });
      }

      // 2. Borders
      if (el.borderWidths && el.borderWidths.top !== '0px' && el.borderStyles?.top !== 'none') {
        const borderKey = `${el.borderWidths.top}_${el.borderStyles.top}_${el.borderColors.top}`;
        const borderRecord = borderMap.get(borderKey);
        if (borderRecord) {
          borderRecord.frequency++;
        } else {
          borderMap.set(borderKey, {
            width: el.borderWidths.top,
            style: el.borderStyles.top,
            color: el.borderColors.top,
            frequency: 1,
          });
        }
      }

      // 3. Shadows
      if (el.boxShadow && el.boxShadow !== 'none') {
        const parsedShadows = parseBoxShadow(el.boxShadow);
        for (const s of parsedShadows) {
          const shadowKey = `${s.isInset ? 'inset_' : ''}${s.offsetXPx}px_${s.offsetYPx}px_${s.blurPx}px_${s.spreadPx}px_${s.color}`;
          const shadowRecord = shadowMap.get(shadowKey);
          if (shadowRecord) {
            shadowRecord.frequency++;
          } else {
            shadowMap.set(shadowKey, { shadow: s, frequency: 1 });
          }
        }
      }

      // 4. Gradients
      if (el.surface && el.surface.backgroundImage && el.surface.backgroundImage.includes('gradient')) {
        const gradients = parseGradients(el.surface.backgroundImage);
        for (const g of gradients) {
          const gradRecord = gradientMap.get(g.rawString);
          if (gradRecord) {
            gradRecord.frequency++;
          } else {
            gradientMap.set(g.rawString, { token: g, frequency: 1 });
          }
        }
      }

      // 5. Surface Categories
      const categories = classifySurfaces(el);
      for (const cat of categories) {
        surfaceCounts[cat]++;
      }
    }

    // Convert raw radius Map records to preliminary RadiusTokens & cluster
    const rawRadiusTokens: RadiusToken[] = [];
    let rId = 1;
    for (const [valPx, rec] of radiusMap.entries()) {
      rawRadiusTokens.push({
        id: `raw_rad_${rId++}`,
        valuePx: valPx,
        classification: rec.classification,
        frequency: rec.frequency,
      });
    }

    const clusteredRadius = clusterRadiusTokens(rawRadiusTokens, this.options.radiusTolerancePx);
    const radiusScale: RadiusToken[] = clusteredRadius
      .sort((a, b) => b.frequency - a.frequency || a.valuePx - b.valuePx)
      .map((r, idx) => ({ ...r, id: `radius_${idx + 1}` }));

    // Deterministic Border Tokens
    const borderTokens: BorderToken[] = Array.from(borderMap.values())
      .sort((a, b) => b.frequency - a.frequency || a.width.localeCompare(b.width))
      .map((b, idx) => ({
        id: `border_${idx + 1}`,
        width: b.width,
        style: b.style,
        color: b.color,
        frequency: b.frequency,
      }));

    // Deterministic Shadow Tokens
    const shadowTokens: ShadowToken[] = Array.from(shadowMap.entries())
      .sort((a, b) => b[1].frequency - a[1].frequency || a[0].localeCompare(b[0]))
      .map(([rawString, rec], idx) => ({
        id: `shadow_${idx + 1}`,
        shadow: rec.shadow,
        rawString,
        frequency: rec.frequency,
      }));

    // Deterministic Gradient Tokens
    const gradientTokens: GradientToken[] = Array.from(gradientMap.values())
      .sort((a, b) => b.frequency - a.frequency || a.token.rawString.localeCompare(b.token.rawString))
      .map((g, idx) => ({
        ...g.token,
        id: `gradient_${idx + 1}`,
        frequency: g.frequency,
      }));

    return {
      radiusScale,
      borderTokens,
      shadowTokens,
      gradientTokens,
      surfaceCounts,
      geometryCounts,
      stats: {
        totalSurfacesAnalyzed: targetElements.length,
        uniqueRadiusCount: radiusScale.length,
        uniqueBorderCount: borderTokens.length,
        uniqueShadowCount: shadowTokens.length,
        gradientCount: gradientTokens.length,
      },
    };
  }

  private createEmptySystem(): NormalizedShapeSystem {
    return {
      radiusScale: [],
      borderTokens: [],
      shadowTokens: [],
      gradientTokens: [],
      surfaceCounts: {
        flat: 0,
        bordered: 0,
        elevated: 0,
        translucent: 0,
        glassLike: 0,
        inset: 0,
        gradient: 0,
        glowing: 0,
      },
      geometryCounts: {
        sharp: 0,
        slightlyRounded: 0,
        rounded: 0,
        highlyRounded: 0,
        pill: 0,
        circular: 0,
        elliptical: 0,
        asymmetric: 0,
      },
      stats: {
        totalSurfacesAnalyzed: 0,
        uniqueRadiusCount: 0,
        uniqueBorderCount: 0,
        uniqueShadowCount: 0,
        gradientCount: 0,
      },
    };
  }
}
