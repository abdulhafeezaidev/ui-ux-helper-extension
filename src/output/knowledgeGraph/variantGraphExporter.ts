import { AnalyzePageResponseData } from '../../types/index.ts';
import { DesignKnowledgeGraphEngine } from '../../normalization/knowledgeGraph/designKnowledgeGraphEngine.ts';

export function exportVariantGraph(data: AnalyzePageResponseData): string {
  const engine = new DesignKnowledgeGraphEngine();
  const { variants } = engine.normalize(data);
  return JSON.stringify(variants, null, 2);
}
