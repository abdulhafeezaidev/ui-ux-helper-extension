import { AnalyzePageResponseData, KnowledgeCompressionSpecification } from '../../types/index.ts';
import { AIOptimizationEngine } from '../../normalization/optimizer/aiOptimizationEngine.ts';

/**
 * Exporter for KnowledgeCompression.json
 */
export function exportKnowledgeCompressionJson(data: AnalyzePageResponseData): string {
  const engine = new AIOptimizationEngine();
  const spec: KnowledgeCompressionSpecification = engine.generateKnowledgeCompression(data);
  return JSON.stringify(spec, null, 2);
}

export function exportKnowledgeCompressionObject(data: AnalyzePageResponseData): KnowledgeCompressionSpecification {
  const engine = new AIOptimizationEngine();
  return engine.generateKnowledgeCompression(data);
}
