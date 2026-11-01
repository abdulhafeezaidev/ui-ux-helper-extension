import { RawElementNode, SurfaceCategory } from '../../types/schema.ts';
import { parseColor } from '../color/colorParser.ts';

export function classifySurfaces(el: RawElementNode): SurfaceCategory[] {
  const categories: Set<SurfaceCategory> = new Set();

  const bgParsed = parseColor(el.backgroundColor);
  const isTranslucent = bgParsed.a > 0 && bgParsed.a < 1.0;
  if (isTranslucent) {
    categories.add('translucent');
  }

  // Border detection
  const hasBorder =
    el.borderWidths &&
    el.borderWidths.top !== '0px' &&
    el.borderStyles &&
    el.borderStyles.top !== 'none';

  if (hasBorder) {
    categories.add('bordered');
  }

  // Shadow detection
  const hasBoxShadow = el.boxShadow && el.boxShadow !== 'none';
  if (hasBoxShadow) {
    if (el.boxShadow.includes('inset')) {
      categories.add('inset');
    } else {
      categories.add('elevated');
    }

    // Glow detection (shadow blur > 8px or colored drop shadow)
    const blurMatch = el.boxShadow.match(/(\d+)px/g);
    if (blurMatch && blurMatch.some((m) => parseInt(m, 10) > 8)) {
      categories.add('glowing');
    }
  }

  // Backdrop filter (glass-like) detection
  const hasBackdropBlur =
    el.surface &&
    el.surface.backdropFilter &&
    el.surface.backdropFilter !== 'none' &&
    el.surface.backdropFilter.includes('blur');

  if (hasBackdropBlur || (isTranslucent && (hasBoxShadow || hasBorder))) {
    if (hasBackdropBlur) {
      categories.add('glassLike');
    }
  }

  // Gradient detection
  const hasGradient =
    el.surface &&
    el.surface.backgroundImage &&
    el.surface.backgroundImage !== 'none' &&
    el.surface.backgroundImage.includes('gradient');

  if (hasGradient) {
    categories.add('gradient');
  }

  // Filter drop-shadow glowing
  const hasFilterDropShadow =
    el.surface && el.surface.filter && el.surface.filter.includes('drop-shadow');

  if (hasFilterDropShadow) {
    categories.add('glowing');
  }

  if (categories.size === 0) {
    categories.add('flat');
  }

  return Array.from(categories);
}
