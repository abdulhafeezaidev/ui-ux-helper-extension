import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildResponsiveTransitionSpecification } from '../../normalization/layout/responsiveTransitionEngine.ts';

/**
 * Serializes the complete 7-viewport responsive transition graph
 * into the canonical 13_responsive.json format.
 */
export function exportResponsiveTransitionsJson(data: AnalyzePageResponseData): string {
  const spec = buildResponsiveTransitionSpecification(data);
  return JSON.stringify(spec, null, 2);
}
