import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildContentSemanticSpecification } from '../../normalization/content/contentSemanticEngine.ts';

/**
 * Serializes the complete content semantic understanding specification
 * into the canonical 17_content.json format.
 */
export function exportContentJson(data: AnalyzePageResponseData): string {
  const spec = buildContentSemanticSpecification(data);
  return JSON.stringify(spec, null, 2);
}
