import { GradientToken, GradientStop } from '../../types/schema.ts';

function splitCssParams(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      if (current.trim()) result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim().length > 0) {
    result.push(current.trim());
  }

  return result;
}

export function parseGradients(bgImageStr: string): GradientToken[] {
  if (!bgImageStr || typeof bgImageStr !== 'string' || bgImageStr === 'none') {
    return [];
  }

  const results: GradientToken[] = [];
  const gradientMatches = bgImageStr.match(/(linear|radial|conic)-gradient\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi);

  if (!gradientMatches) return results;

  let count = 1;
  for (const match of gradientMatches) {
    const typeMatch = match.match(/^(linear|radial|conic)-gradient/i);
    const type = (typeMatch ? typeMatch[1].toLowerCase() : 'linear') as 'linear' | 'radial' | 'conic';

    const firstParen = match.indexOf('(');
    const lastParen = match.lastIndexOf(')');
    const innerContent = firstParen !== -1 && lastParen !== -1 ? match.substring(firstParen + 1, lastParen).trim() : '';

    const parts = splitCssParams(innerContent);
    let angleOrDirection = 'to bottom';
    let stopsStartIdx = 0;

    if (
      parts.length > 0 &&
      (parts[0].includes('deg') || parts[0].startsWith('to ') || parts[0].includes('circle') || parts[0].includes('at '))
    ) {
      angleOrDirection = parts[0];
      stopsStartIdx = 1;
    }

    const stops: GradientStop[] = [];
    for (let i = stopsStartIdx; i < parts.length; i++) {
      const stopPart = parts[i];
      const colorMatch = stopPart.match(/(rgba?\([^)]+\)|#[a-f0-9]{3,8}|[a-z]+)/i);
      const color = colorMatch ? colorMatch[0] : stopPart;
      const posMatch = stopPart.replace(color, '').trim();

      stops.push({
        color,
        position: posMatch.length > 0 ? posMatch : undefined,
      });
    }

    results.push({
      id: `gradient_${count++}`,
      type,
      angleOrDirection,
      stops,
      rawString: match,
      frequency: 1,
    });
  }

  return results;
}
