import { AnalyzePageResponseData, BuildDependencyGraphSpecification } from '../../types/index.ts';
import { BuildDependencyGraphEngine } from '../../normalization/planner/buildDependencyGraphEngine.ts';

/**
 * Exporter for BuildDependencyGraph.json
 * Exports the 10-phase topological build DAG for AI coding agents.
 */
export function exportBuildDependencyGraphJson(data: AnalyzePageResponseData): string {
  const engine = new BuildDependencyGraphEngine();
  const spec: BuildDependencyGraphSpecification = engine.normalize(data);
  return JSON.stringify(spec, null, 2);
}

export function exportBuildDependencyGraphObject(data: AnalyzePageResponseData): BuildDependencyGraphSpecification {
  const engine = new BuildDependencyGraphEngine();
  return engine.normalize(data);
}
