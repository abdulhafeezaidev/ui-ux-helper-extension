import { RawElementNode, SpacingToken } from '../../types/schema.ts';

export function parseSpacingValuePx(spacingStr: string): number {
  if (!spacingStr || typeof spacingStr !== 'string') return 0;
  const num = parseFloat(spacingStr);
  return isNaN(num) || num < 0 ? 0 : Math.round(num * 100) / 100;
}

export function extractSpacingScale(
  elements: RawElementNode[],
  tolerancePx: number = 1.0
): SpacingToken[] {
  const spacingMap = new Map<string, { valuePx: number; category: 'padding' | 'margin' | 'gap'; frequency: number }>();

  const addSpacing = (valueStr: string, category: 'padding' | 'margin' | 'gap') => {
    const valPx = parseSpacingValuePx(valueStr);
    if (valPx <= 0) return;

    const key = `${category}_${valPx}`;
    let record = spacingMap.get(key);
    if (!record) {
      record = { valuePx: valPx, category, frequency: 0 };
      spacingMap.set(key, record);
    }
    record.frequency++;
  };

  for (const el of elements) {
    if (!el.isVisible) continue;

    if (el.padding) {
      addSpacing(el.padding.top, 'padding');
      addSpacing(el.padding.right, 'padding');
      addSpacing(el.padding.bottom, 'padding');
      addSpacing(el.padding.left, 'padding');
    }

    if (el.margin) {
      addSpacing(el.margin.top, 'margin');
      addSpacing(el.margin.right, 'margin');
      addSpacing(el.margin.bottom, 'margin');
      addSpacing(el.margin.left, 'margin');
    }

    if (el.gap) {
      addSpacing(el.gap.row, 'gap');
      addSpacing(el.gap.column, 'gap');
    }
  }

  // Cluster repeated spacing values
  const rawTokens = Array.from(spacingMap.values()).sort((a, b) => b.frequency - a.frequency);
  const clustered: SpacingToken[] = [];

  for (const token of rawTokens) {
    let merged = false;
    for (const head of clustered) {
      if (head.category === token.category && Math.abs(head.valuePx - token.valuePx) <= tolerancePx) {
        head.frequency += token.frequency;
        merged = true;
        break;
      }
    }

    if (!merged) {
      clustered.push({
        id: `spacing_${clustered.length + 1}`,
        valuePx: token.valuePx,
        category: token.category,
        frequency: token.frequency,
      });
    }
  }

  return clustered.sort((a, b) => b.frequency - a.frequency || a.valuePx - b.valuePx);
}
