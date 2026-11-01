/**
 * Outlier Filter & Radius Token Classifier
 * Classifies border radius observations into circular, pill, reusable global tokens, and component-specific values.
 */

import { RawElementNode } from '../../types/schema.ts';

export type RadiusClassification = 'reusableToken' | 'pill' | 'circular' | 'componentSpecific' | 'oneOff';

export interface RefinedRadiusToken {
  id: string;
  valuePx: number;
  classification: RadiusClassification;
  frequency: number;
  sourceElementIds: string[];
  confidence: number;
}

export function refineRadiusTokens(elements: RawElementNode[]): RefinedRadiusToken[] {
  const radiusMap = new Map<number, { elementIds: Set<string>; isPill: boolean; isCircular: boolean }>();

  elements.forEach((el) => {
    if (!el.borderRadius) return;

    const topLeftStr = el.borderRadius.topLeft || '0px';
    let val = parseFloat(topLeftStr);
    if (isNaN(val) || val <= 0) return;
    if (val >= 9999) val = 9999;

    const width = el.boundingRect.width || 0;
    const height = el.boundingRect.height || 0;

    const isCircular = (width > 0 && Math.abs(width - height) < 5 && val >= width / 2 - 2) || topLeftStr.includes('%');
    const isPill = val >= 999 || (height > 0 && val >= height / 2 - 2 && width > height * 1.5);

    if (!radiusMap.has(val)) {
      radiusMap.set(val, { elementIds: new Set(), isPill: false, isCircular: false });
    }

    const entry = radiusMap.get(val)!;
    entry.elementIds.add(el.id);
    if (isPill) entry.isPill = true;
    if (isCircular) entry.isCircular = true;
  });

  const result: RefinedRadiusToken[] = [];

  // Sort values deterministically
  const sortedValues = Array.from(radiusMap.keys()).sort((a, b) => a - b);

  sortedValues.forEach((val) => {
    const entry = radiusMap.get(val)!;
    const freq = entry.elementIds.size;
    let classification: RadiusClassification = 'reusableToken';

    if (entry.isPill || val >= 999) {
      classification = 'pill';
    } else if (entry.isCircular || val >= 100) {
      classification = 'circular';
    } else if (freq >= 2) {
      classification = 'reusableToken';
    } else {
      classification = 'oneOff';
    }

    const confidence = classification === 'reusableToken' ? 0.9 : classification === 'circular' || classification === 'pill' ? 0.95 : 0.6;

    result.push({
      id: `radius-${val}`,
      valuePx: val,
      classification,
      frequency: freq,
      sourceElementIds: Array.from(entry.elementIds),
      confidence,
    });
  });

  return result;
}
