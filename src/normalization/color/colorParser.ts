import { CanonicalColor, HSLColor } from '../../types/schema.ts';

/**
 * Convert RGB (0-255) to HSL (0-360, 0-100, 0-100).
 */
export function rgbToHsl(r: number, g: number, b: number): HSLColor {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / delta + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / delta + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Format RGB into canonical Hex string `#rrggbb`.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Parse arbitrary browser computed color strings into CanonicalColor.
 */
export function parseColor(colorStr: string): CanonicalColor {
  if (!colorStr || typeof colorStr !== 'string') {
    return createTransparentColor();
  }

  const trimmed = colorStr.trim().toLowerCase();

  if (trimmed === 'transparent' || trimmed === 'rgba(0, 0, 0, 0)' || trimmed === 'rgba(0,0,0,0)') {
    return createTransparentColor();
  }

  // Parse rgba(r, g, b, a) or rgb(r, g, b)
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;

    if (a === 0) return createTransparentColor();

    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    const rgbString = a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;

    return { r, g, b, a, hex, rgbString, hsl };
  }

  // Parse Hex #rgb, #rrggbb, #rrggbbaa
  if (trimmed.startsWith('#')) {
    const hexClean = trimmed.slice(1);
    let r = 0, g = 0, b = 0, a = 1;

    if (hexClean.length === 3) {
      r = parseInt(hexClean[0] + hexClean[0], 16);
      g = parseInt(hexClean[1] + hexClean[1], 16);
      b = parseInt(hexClean[2] + hexClean[2], 16);
    } else if (hexClean.length === 6) {
      r = parseInt(hexClean.substring(0, 2), 16);
      g = parseInt(hexClean.substring(2, 4), 16);
      b = parseInt(hexClean.substring(4, 6), 16);
    } else if (hexClean.length === 8) {
      r = parseInt(hexClean.substring(0, 2), 16);
      g = parseInt(hexClean.substring(2, 4), 16);
      b = parseInt(hexClean.substring(4, 6), 16);
      a = parseInt(hexClean.substring(6, 8), 16) / 255;
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) return createTransparentColor();
    if (a === 0) return createTransparentColor();

    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    const rgbString = a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;

    return { r, g, b, a, hex, rgbString, hsl };
  }

  return createTransparentColor();
}

function createTransparentColor(): CanonicalColor {
  return {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
    hex: '#000000',
    rgbString: 'rgba(0, 0, 0, 0)',
    hsl: { h: 0, s: 0, l: 0 },
  };
}
