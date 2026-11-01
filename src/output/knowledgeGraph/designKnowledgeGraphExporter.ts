import { AnalyzePageResponseData } from '../../types/index.ts';
import { DesignKnowledgeGraphEngine } from '../../normalization/knowledgeGraph/designKnowledgeGraphEngine.ts';

export function exportDesignKnowledgeGraph(data: AnalyzePageResponseData): string {
  const engine = new DesignKnowledgeGraphEngine();
  const { dkg } = engine.normalize(data);
  return JSON.stringify(dkg, null, 2);
}
