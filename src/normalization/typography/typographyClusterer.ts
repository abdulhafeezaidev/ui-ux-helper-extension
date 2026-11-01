import { TypographyToken } from '../../types/schema.ts';

/**
 * Convert font size string (e.g. '16px', '1.2rem', '12pt') to float pixels.
 */
export function parseFontSizePx(fontSizeStr: string): number {
  if (!fontSizeStr || typeof fontSizeStr !== 'string') return 16;

  const trimmed = fontSizeStr.trim().toLowerCase();
  const num = parseFloat(trimmed);

  if (isNaN(num)) return 16;

  if (trimmed.endsWith('pt')) return Math.round(num * 1.333 * 100) / 100;
  if (trimmed.endsWith('rem') || trimmed.endsWith('em')) return Math.round(num * 16 * 100) / 100;

  return Math.round(num * 100) / 100;
}

/**
 * Convert font weight string ('normal', 'bold', '700') to numeric weight 100-900.
 */
export function parseFontWeight(fontWeightStr: string): number {
  if (!fontWeightStr || typeof fontWeightStr !== 'string') return 400;

  const trimmed = fontWeightStr.trim().toLowerCase();

  if (trimmed === 'normal') return 400;
  if (trimmed === 'bold') return 700;
  if (trimmed === 'bolder') return 800;
  if (trimmed === 'lighter') return 300;

  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 100 && num <= 900) {
    return num;
  }

  return 400;
}

/**
 * Convert line-height string ('normal', '24px', '1.5') to float pixels or 'normal'.
 */
export function parseLineHeightPx(lineHeightStr: string, fontSizePx: number): number | 'normal' {
  if (!lineHeightStr || typeof lineHeightStr !== 'string') return 'normal';

  const trimmed = lineHeightStr.trim().toLowerCase();

  if (trimmed === 'normal') return 'normal';

  const num = parseFloat(trimmed);
  if (isNaN(num)) return 'normal';

  if (trimmed.endsWith('px')) return Math.round(num * 100) / 100;
  if (!trimmed.match(/[a-z%]/i) && num > 0 && num <= 3.5) {
    // Relative multiplier (e.g. 1.5)
    return Math.round(num * fontSizePx * 100) / 100;
  }

  return Math.round(num * 100) / 100;
}

/**
 * Cluster typography tokens with close font size (within tolerancePx = 0.5px), same primary family, and weight.
 */
export function clusterTypographyTokens(
  tokens: TypographyToken[],
  tolerancePx: number = 0.5
): TypographyToken[] {
  if (tokens.length <= 1) return [...tokens];

  const sorted = [...tokens].sort((a, b) => b.frequency - a.frequency);
  const clusters: TypographyToken[] = [];

  for (const token of sorted) {
    let merged = false;

    for (const head of clusters) {
      const isSameFamily = head.primaryFamily.toLowerCase() === token.primaryFamily.toLowerCase();
      const isSameWeight = head.fontWeight === token.fontWeight;
      const isCloseSize = Math.abs(head.fontSizePx - token.fontSizePx) <= tolerancePx;

      if (isSameFamily && isSameWeight && isCloseSize) {
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
