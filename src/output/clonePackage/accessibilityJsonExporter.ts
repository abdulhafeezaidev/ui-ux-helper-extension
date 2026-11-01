import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildAccessibilityExtractionSystem } from '../../normalization/accessibility/accessibilityExtractionEngine.ts';

export function exportAccessibilityJson(data: AnalyzePageResponseData): string {
  const a11ySystem = buildAccessibilityExtractionSystem(data);
  return JSON.stringify(a11ySystem, null, 2);
}
