import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildReconstructionGraphSpecification } from '../../normalization/graph/reconstructionGraphEngine.ts';

/**
 * Serializes the complete master AI reconstruction dependency graph
 * into the canonical 18_reconstruction_graph.json format.
 */
export function exportReconstructionGraphJson(data: AnalyzePageResponseData): string {
  const spec = buildReconstructionGraphSpecification(data);
  return JSON.stringify(spec, null, 2);
}
