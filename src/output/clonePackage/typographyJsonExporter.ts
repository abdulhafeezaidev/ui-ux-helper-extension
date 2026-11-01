import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildTypographyRhythmSpecification } from '../../normalization/typography/typographyRhythmEngine.ts';

/**
 * Serializes the complete typography rhythm system
 * into the canonical 14_typography.json format.
 */
export function exportTypographyJson(data: AnalyzePageResponseData): string {
  const spec = buildTypographyRhythmSpecification(data);
  return JSON.stringify(spec, null, 2);
}
