import { AnalyzePageResponseData, ComponentDependencyGraphSpecification } from '../../types/index.ts';
import { ComponentDependencyGraphEngine } from '../../normalization/planner/componentDependencyGraphEngine.ts';

/**
 * Exporter for ComponentDependencyGraph.json
 * Exports bottom-up atomic component hierarchy (primitives -> composites -> sections -> pages).
 */
export function exportComponentDependencyGraphJson(data: AnalyzePageResponseData): string {
  const engine = new ComponentDependencyGraphEngine();
  const spec: ComponentDependencyGraphSpecification = engine.normalize(data);
  return JSON.stringify(spec, null, 2);
}

export function exportComponentDependencyGraphObject(data: AnalyzePageResponseData): ComponentDependencyGraphSpecification {
  const engine = new ComponentDependencyGraphEngine();
  return engine.normalize(data);
}
