import {
  BorderCornerRadius,
  BoundingRect,
  GeometryClassification,
  RadiusToken,
} from '../../types/schema.ts';

export function parseCornerRadiusPx(radiusStr: string): number {
  if (!radiusStr || typeof radiusStr !== 'string') return 0;
  const trimmed = radiusStr.trim().toLowerCase();
  const num = parseFloat(trimmed);
  if (isNaN(num)) return 0;
  if (num >= 9999) return 9999;
  if (trimmed.endsWith('%')) {
    // 50% relative radius
    return Math.round(num * 100) / 100;
  }
  return Math.round(num * 100) / 100;
}

export function classifyGeometry(
  borderRadius: BorderCornerRadius,
  rect: BoundingRect
): GeometryClassification {
  const tl = parseCornerRadiusPx(borderRadius.topLeft);
  const tr = parseCornerRadiusPx(borderRadius.topRight);
  const br = parseCornerRadiusPx(borderRadius.bottomRight);
  const bl = parseCornerRadiusPx(borderRadius.bottomLeft);

  const maxRadius = Math.max(tl, tr, br, bl);

  if (maxRadius === 0) {
    return 'sharp';
  }

  // Check if corners are asymmetric
  const isAsymmetric = tl !== tr || tr !== br || br !== bl;
  if (isAsymmetric) {
    return 'asymmetric';
  }

  const minDim = Math.min(rect.width, rect.height);
  const isHalfHeight = minDim > 0 && maxRadius >= minDim / 2;

  if (isHalfHeight) {
    if (Math.abs(rect.width - rect.height) <= 2) {
      return 'circular';
    }
    return 'pill';
  }

  if (maxRadius <= 4) return 'slightlyRounded';
  if (maxRadius <= 12) return 'rounded';
  return 'highlyRounded';
}

export function clusterRadiusTokens(
  tokens: RadiusToken[],
  tolerancePx: number = 1.0
): RadiusToken[] {
  if (tokens.length <= 1) return [...tokens];

  const sorted = [...tokens].sort((a, b) => b.frequency - a.frequency);
  const clusters: RadiusToken[] = [];

  for (const token of sorted) {
    let merged = false;

    for (const head of clusters) {
      if (Math.abs(head.valuePx - token.valuePx) <= tolerancePx) {
        head.frequency += token.frequency;
        merged = true;
        break;
      }
    }

    if (!merged) {
      clusters.push({ ...token });
    }
  }

  return clusters;
}
