/**
 * WCAG 2.1 Relative Luminance & Contrast Ratio Calculations
 */

/**
 * Convert 8-bit sRGB channel (0-255) to linear luminance value.
 */
export function sRgbToLinear(c255: number): number {
  const c = c255 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Calculate WCAG 2.1 relative luminance for RGB (0-255).
 * Returns float in range [0.0, 1.0].
 */
export function calculateRelativeLuminance(r: number, g: number, b: number): number {
  const rLin = sRgbToLinear(r);
  const gLin = sRgbToLinear(g);
  const bLin = sRgbToLinear(b);
  const l = 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  return Math.round(l * 10000) / 10000;
}

/**
 * Calculate WCAG 2.1 contrast ratio between two relative luminance values.
 * Returns ratio float in range [1.0, 21.0].
 */
export function calculateContrastRatio(l1: number, l2: number): number {
  const maxL = Math.max(l1, l2);
  const minL = Math.min(l1, l2);
  const ratio = (maxL + 0.05) / (minL + 0.05);
  return Math.round(ratio * 100) / 100;
}
