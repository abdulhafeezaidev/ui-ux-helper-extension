import { AnalyzePageResponseData, ConfidenceMapSpecification } from '../../types/index.ts';
import { AIOptimizationEngine } from '../../normalization/optimizer/aiOptimizationEngine.ts';

/**
 * Exporter for ConfidenceMap.json
 */
export function exportConfidenceMapJson(data: AnalyzePageResponseData): string {
  const engine = new AIOptimizationEngine();
  const spec: ConfidenceMapSpecification = engine.generateConfidenceMap(data);
  return JSON.stringify(spec, null, 2);
}

export function exportConfidenceMapObject(data: AnalyzePageResponseData): ConfidenceMapSpecification {
  const engine = new AIOptimizationEngine();
  return engine.generateConfidenceMap(data);
}
