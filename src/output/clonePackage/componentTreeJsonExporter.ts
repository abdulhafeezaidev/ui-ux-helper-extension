import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildComponentHierarchyTree } from '../../normalization/component/componentHierarchyEngine.ts';

export function exportComponentTreeJson(data: AnalyzePageResponseData): string {
  const treeSpec = buildComponentHierarchyTree(data);
  return JSON.stringify(treeSpec, null, 2);
}
