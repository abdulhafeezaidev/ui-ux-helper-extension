import {
  UIComponentCandidate,
  ComponentFamily,
  UIDesignPattern,
  NormalizedShapeSystem,
  NormalizedLayoutSystem,
} from '../../types/schema.ts';

export function detectDesignPatterns(
  components: UIComponentCandidate[],
  _families: ComponentFamily[],
  shapeSys?: NormalizedShapeSystem,
  layoutSys?: NormalizedLayoutSystem
): UIDesignPattern[] {
  const patterns: UIDesignPattern[] = [];

  // 1. Card-based UI Pattern
  const cardComponents = components.filter((c) => c.type === 'card');
  if (cardComponents.length >= 2) {
    patterns.push({
      patternType: 'cardBasedUI',
      confidence: 0.9,
      supportingComponentIds: cardComponents.map((c) => c.id),
      evidence: [`Detected ${cardComponents.length} distinct card components`],
    });
  }

  // 2. Pill Controls Pattern
  const pillTokens = shapeSys?.radiusScale.filter((r) => r.classification === 'pill');
  if (pillTokens && pillTokens.length > 0) {
    patterns.push({
      patternType: 'pillControls',
      confidence: 0.85,
      supportingComponentIds: components.filter((c) => c.type === 'button' || c.type === 'badge').map((c) => c.id),
      evidence: ['Detected interactive controls styled with pill-shaped corner radius'],
    });
  }

  // 3. Glass-like Surfaces Pattern
  if (shapeSys?.surfaceCounts.glassLike && shapeSys.surfaceCounts.glassLike > 0) {
    patterns.push({
      patternType: 'glassLikeSurfaces',
      confidence: 0.9,
      supportingComponentIds: [],
      evidence: [`Detected ${shapeSys.surfaceCounts.glassLike} elements with backdrop-filter blur and translucent surfaces`],
    });
  }

  // 4. Elevated Surfaces Pattern
  if (shapeSys?.surfaceCounts.elevated && shapeSys.surfaceCounts.elevated > 0) {
    patterns.push({
      patternType: 'elevatedSurfaces',
      confidence: 0.85,
      supportingComponentIds: [],
      evidence: [`Detected ${shapeSys.surfaceCounts.elevated} elements with outset box shadow elevation`],
    });
  }

  // 5. Repeated Grid Cards Pattern
  if (layoutSys && layoutSys.gridLayouts.length > 0 && cardComponents.length >= 2) {
    patterns.push({
      patternType: 'repeatedGridCards',
      confidence: 0.9,
      supportingComponentIds: cardComponents.map((c) => c.id),
      evidence: ['Detected multiple card components arranged inside CSS grid layout containers'],
    });
  }

  return patterns;
}
