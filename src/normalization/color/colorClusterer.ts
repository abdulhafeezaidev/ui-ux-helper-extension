import { ColorToken } from '../../types/schema.ts';

/**
 * Calculate Euclidean distance in RGB color space.
 * Ignores merging if alpha values differ significantly (> 0.1).
 */
export function colorDistance(t1: ColorToken, t2: ColorToken): number {
  const c1 = t1.color;
  const c2 = t2.color;

  if (Math.abs(c1.a - c2.a) > 0.1) {
    return Infinity;
  }

  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Cluster color tokens within a configurable numeric distance threshold (default: 15.0).
 * Merges visually similar tokens into the dominant representative token.
 */
export function clusterColorTokens(
  tokens: ColorToken[],
  maxDistance: number = 15.0
): ColorToken[] {
  if (tokens.length <= 1) return [...tokens];

  // Sort tokens by frequency descending so highest frequency becomes cluster head
  const sorted = [...tokens].sort((a, b) => b.frequency - a.frequency);
  const clusters: ColorToken[] = [];

  for (const token of sorted) {
    let merged = false;

    for (const clusterHead of clusters) {
      const dist = colorDistance(token, clusterHead);
      if (dist <= maxDistance) {
        // Merge token into clusterHead
        clusterHead.frequency += token.frequency;
        clusterHead.usageCount.background += token.usageCount.background;
        clusterHead.usageCount.text += token.usageCount.text;
        clusterHead.usageCount.border += token.usageCount.border;
        clusterHead.usageCount.cta += token.usageCount.cta;

        for (const usage of token.usages) {
          if (!clusterHead.usages.includes(usage)) {
            clusterHead.usages.push(usage);
          }
        }

        merged = true;
        break;
      }
    }

    if (!merged) {
      // Clone token to serve as a new cluster head
      clusters.push({
        ...token,
        usageCount: { ...token.usageCount },
        usages: [...token.usages],
      });
    }
  }

  return clusters;
}
