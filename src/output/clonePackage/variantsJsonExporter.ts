import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildComponentVariantSpecification } from '../../normalization/component/componentVariantEngine.ts';

/**
 * Serializes the complete component variant system
 * into the canonical 15_variants.json format.
 */
export function exportVariantsJson(data: AnalyzePageResponseData): string {
  const spec = buildComponentVariantSpecification(data);
  return JSON.stringify(spec, null, 2);
}
