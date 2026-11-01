import { AnalyzePageResponseData } from '../../types/index.ts';
import { DesignKnowledgeGraphEngine } from '../../normalization/knowledgeGraph/designKnowledgeGraphEngine.ts';

export function exportTokenRegistry(data: AnalyzePageResponseData): string {
  const engine = new DesignKnowledgeGraphEngine();
  const { tokens } = engine.normalize(data);
  return JSON.stringify(tokens, null, 2);
}
