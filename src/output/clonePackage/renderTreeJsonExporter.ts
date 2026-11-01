import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildRenderTree } from '../../normalization/renderTree/renderingOrderEngine.ts';

/**
 * Serializes the complete visual paint order and stacking context render tree
 * into the canonical 11_render_tree.json format.
 */
export function exportRenderTreeJson(data: AnalyzePageResponseData): string {
  const spec = buildRenderTree(data);
  return JSON.stringify(spec, null, 2);
}
