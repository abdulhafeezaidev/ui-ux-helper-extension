import { AnalyzePageResponseData, ReconstructionPlanSpecification } from '../../types/index.ts';
import { ReconstructionPlanEngine } from '../../normalization/planner/reconstructionPlanEngine.ts';

/**
 * Exporter for ReconstructionPlan.md
 * Generates the step-by-step markdown implementation roadmap for AI coding agents.
 */
export function exportReconstructionPlanMarkdown(data: AnalyzePageResponseData): string {
  const engine = new ReconstructionPlanEngine();
  const spec: ReconstructionPlanSpecification = engine.normalize(data);
  return spec.markdown;
}

export function exportReconstructionPlanObject(data: AnalyzePageResponseData): ReconstructionPlanSpecification {
  const engine = new ReconstructionPlanEngine();
  return engine.normalize(data);
}
