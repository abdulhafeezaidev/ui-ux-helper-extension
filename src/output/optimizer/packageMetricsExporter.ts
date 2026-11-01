import { AnalyzePageResponseData, PackageMetricsSpecification } from '../../types/index.ts';
import { AIOptimizationEngine } from '../../normalization/optimizer/aiOptimizationEngine.ts';

/**
 * Exporter for PackageMetrics.json
 */
export function exportPackageMetricsJson(data: AnalyzePageResponseData): string {
  const engine = new AIOptimizationEngine();
  const spec: PackageMetricsSpecification = engine.generatePackageMetrics(data);
  return JSON.stringify(spec, null, 2);
}

export function exportPackageMetricsObject(data: AnalyzePageResponseData): PackageMetricsSpecification {
  const engine = new AIOptimizationEngine();
  return engine.generatePackageMetrics(data);
}
