import { AnalyzePageResponseData } from '../../types/index.ts';
import { DesignKnowledgeGraphEngine } from '../../normalization/knowledgeGraph/designKnowledgeGraphEngine.ts';

export function exportComponentRegistry(data: AnalyzePageResponseData): string {
  const engine = new DesignKnowledgeGraphEngine();
  const { components } = engine.normalize(data);
  return JSON.stringify(components, null, 2);
}
