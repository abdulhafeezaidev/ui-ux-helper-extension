import { FontFamilyStack } from '../../types/schema.ts';

/**
 * Clean unquoted font family stack and extract primary family and fallbacks.
 * Examples:
 * '"Inter", "Helvetica Neue", sans-serif' -> primary: 'Inter', fallbacks: ['Helvetica Neue', 'sans-serif']
 */
export function parseFontFamily(fontFamilyStr: string): FontFamilyStack {
  if (!fontFamilyStr || typeof fontFamilyStr !== 'string') {
    return {
      name: 'sans-serif',
      primary: 'sans-serif',
      fallbacks: [],
      usageCount: 1,
    };
  }

  // Split by comma and strip quotes/extra whitespace
  const parts = fontFamilyStr
    .split(',')
    .map((part) => part.trim().replace(/['"]/g, '').replace(/^var\(--[^)]+\)/, ''))
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return {
      name: 'sans-serif',
      primary: 'sans-serif',
      fallbacks: [],
      usageCount: 1,
    };
  }

  const primary = parts[0];
  const fallbacks = parts.slice(1);
  const name = parts.join(', ');

  return {
    name,
    primary,
    fallbacks,
    usageCount: 1,
  };
}
