import { ParsedShadow } from '../../types/schema.ts';
import { parseColor } from '../color/colorParser.ts';

/**
 * Parse computed box-shadow string into structured ParsedShadow objects.
 */
export function parseBoxShadow(shadowStr: string): ParsedShadow[] {
  if (!shadowStr || typeof shadowStr !== 'string' || shadowStr.trim() === 'none') {
    return [];
  }

  const results: ParsedShadow[] = [];

  // Split multiple shadows by comma while preserving rgba(...) commas
  const shadowParts = shadowStr.split(/,(?![^(]*\))/).map((s) => s.trim());

  for (const part of shadowParts) {
    if (!part || part === 'none') continue;

    const isInset = part.includes('inset');
    const cleanPart = part.replace('inset', '').trim();

    // Match color (rgba/rgb/hex) and length values
    const colorMatch = cleanPart.match(/(rgba?\([^)]+\)|#[a-f0-9]{3,8})/i);
    const colorStr = colorMatch ? colorMatch[0] : 'rgb(0, 0, 0)';

    const lengthsStr = cleanPart.replace(colorStr, '').trim();
    const lengthMatches = lengthsStr.match(/(-?\d+(?:\.\d+)?(?:px)?)/g) || [];

    const pxValues = lengthMatches.map((val) => parseFloat(val) || 0);

    const offsetXPx = pxValues[0] || 0;
    const offsetYPx = pxValues[1] || 0;
    const blurPx = pxValues[2] || 0;
    const spreadPx = pxValues[3] || 0;

    const parsedColor = parseColor(colorStr);

    results.push({
      offsetXPx,
      offsetYPx,
      blurPx,
      spreadPx,
      color: parsedColor.hex,
      alpha: parsedColor.a,
      isInset,
    });
  }

  return results;
}
