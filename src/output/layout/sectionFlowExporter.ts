import { AnalyzePageResponseData, SectionFlowSpecification } from '../../types/index.ts';
import { SectionFlowEngine } from '../../normalization/layout/relationships/sectionFlowEngine.ts';

/**
 * Exporter for SectionFlow.json
 * Generates the top-level vertical section flow sequence, inter-section rhythm tokens, and positioning rules.
 */
export function exportSectionFlowJson(data: AnalyzePageResponseData): string {
  const engine = new SectionFlowEngine();
  const spec: SectionFlowSpecification = engine.normalize(data);
  return JSON.stringify(spec, null, 2);
}

export function exportSectionFlowObject(data: AnalyzePageResponseData): SectionFlowSpecification {
  const engine = new SectionFlowEngine();
  return engine.normalize(data);
}
