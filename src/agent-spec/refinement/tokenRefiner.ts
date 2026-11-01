/**
 * Spacing Token Refiner
 * Clusters raw geometric measurements into a concise, deterministic spacing scale.
 */

import { RawElementNode } from '../../types/schema.ts';

export interface RefinedSpacingToken {
  id: string;
  valuePx: number;
  observedValues: number[];
  category: 'padding' | 'margin' | 'gap' | 'mixed';
  frequency: number;
  sourceElementIds: string[];
  confidence: number;
}

export function refineSpacingTokens(elements: RawElementNode[]): RefinedSpacingToken[] {
  const rawValues: { value: number; elementId: string; category: 'padding' | 'margin' | 'gap' }[] = [];

  // 1. Collect candidate spacing measurements from elements
  elements.forEach((el) => {
    // Padding
    if (el.padding) {
      ['top', 'right', 'bottom', 'left'].forEach((dir) => {
        const val = parseFloat((el.padding as any)[dir] || '0');
        if (val > 0 && val <= 120) {
          rawValues.push({ value: val, elementId: el.id, category: 'padding' });
        }
      });
    }

    // Margin
    if (el.margin) {
      ['top', 'right', 'bottom', 'left'].forEach((dir) => {
        const val = parseFloat((el.margin as any)[dir] || '0');
        if (val > 0 && val <= 120) {
          rawValues.push({ value: val, elementId: el.id, category: 'margin' });
        }
      });
    }

    // Gap / Spacing (row & column)
    if (el.gap) {
      const rowVal = parseFloat(el.gap.row || '0');
      if (rowVal > 0 && rowVal <= 120) {
        rawValues.push({ value: rowVal, elementId: el.id, category: 'gap' });
      }
      const colVal = parseFloat(el.gap.column || '0');
      if (colVal > 0 && colVal <= 120) {
        rawValues.push({ value: colVal, elementId: el.id, category: 'gap' });
      }
    }
  });

  if (rawValues.length === 0) {
    // Fallback standard spacing scale if no measurements
    return [4, 8, 12, 16, 24, 32, 48].map((v) => ({
      id: `spacing-${v}`,
      valuePx: v,
      observedValues: [v],
      category: 'mixed',
      frequency: 1,
      sourceElementIds: ['el_root'],
      confidence: 0.8,
    }));
  }

  // 2. Deterministic Clustering (group values within ±2px or 10% threshold)
  const clusters: {
    canonicalValue: number;
    observedValues: Set<number>;
    elementIds: Set<string>;
    categories: Set<'padding' | 'margin' | 'gap'>;
    frequency: number;
  }[] = [];

  // Sort raw values deterministically
  rawValues.sort((a, b) => a.value - b.value);

  for (const item of rawValues) {
    const val = item.value;
    // Find existing cluster within tolerance
    let cluster = clusters.find((c) => Math.abs(c.canonicalValue - val) <= Math.max(1.5, c.canonicalValue * 0.1));

    if (!cluster) {
      cluster = {
        canonicalValue: Math.round(val),
        observedValues: new Set(),
        elementIds: new Set(),
        categories: new Set(),
        frequency: 0,
      };
      clusters.push(cluster);
    }

    cluster.observedValues.add(val);
    cluster.elementIds.add(item.elementId);
    cluster.categories.add(item.category);
    cluster.frequency += 1;
  }

  // 3. Filter & Rank Clusters
  clusters.sort((a, b) => b.frequency - a.frequency || a.canonicalValue - b.canonicalValue);

  // Limit to top 12 distinct meaningful tokens
  const selectedClusters = clusters.slice(0, 12);
  selectedClusters.sort((a, b) => a.canonicalValue - b.canonicalValue);

  return selectedClusters.map((c) => {
    const categoriesArr = Array.from(c.categories);
    const category = categoriesArr.length === 1 ? categoriesArr[0] : 'mixed';
    const confidence = Math.min(1.0, 0.7 + Math.min(0.25, c.frequency * 0.02));

    return {
      id: `spacing-${c.canonicalValue}`,
      valuePx: c.canonicalValue,
      observedValues: Array.from(c.observedValues).sort((a, b) => a - b),
      category,
      frequency: c.frequency,
      sourceElementIds: Array.from(c.elementIds),
      confidence: Number(confidence.toFixed(2)),
    };
  });
}
