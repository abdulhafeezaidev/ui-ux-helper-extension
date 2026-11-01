import { AnalyzePageResponseData, OptimizationReportSpecification } from '../../types/index.ts';
import { AIOptimizationEngine } from '../../normalization/optimizer/aiOptimizationEngine.ts';

/**
 * Exporter for OptimizationReport.md
 */
export function exportOptimizationReportMarkdown(data: AnalyzePageResponseData): string {
  const engine = new AIOptimizationEngine();
  const spec: OptimizationReportSpecification = engine.generateOptimizationReport(data);
  return spec.markdown;
}

export function exportOptimizationReportObject(data: AnalyzePageResponseData): OptimizationReportSpecification {
  const engine = new AIOptimizationEngine();
  return engine.generateOptimizationReport(data);
}
