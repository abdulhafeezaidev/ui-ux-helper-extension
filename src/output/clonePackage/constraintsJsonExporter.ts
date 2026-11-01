import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildLayoutConstraintSpecification } from '../../normalization/layout/constraintEngine.ts';

/**
 * Serializes the relational, deduplicated browser layout constraints
 * into the canonical 12_constraints.json format.
 */
export function exportConstraintsJson(data: AnalyzePageResponseData): string {
  const spec = buildLayoutConstraintSpecification(data);
  return JSON.stringify(spec, null, 2);
}
