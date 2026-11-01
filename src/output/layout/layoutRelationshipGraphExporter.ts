import { AnalyzePageResponseData, LayoutRelationshipGraphSpecification } from '../../types/index.ts';
import { LayoutRelationshipGraphEngine } from '../../normalization/layout/relationships/layoutRelationshipGraphEngine.ts';

/**
 * Exporter for LayoutRelationshipGraph.json
 * Generates the semantic and spatial relationship graph, replacing absolute coordinates with relative descriptors.
 */
export function exportLayoutRelationshipGraphJson(data: AnalyzePageResponseData): string {
  const engine = new LayoutRelationshipGraphEngine();
  const spec: LayoutRelationshipGraphSpecification = engine.normalize(data);
  return JSON.stringify(spec, null, 2);
}

export function exportLayoutRelationshipGraphObject(data: AnalyzePageResponseData): LayoutRelationshipGraphSpecification {
  const engine = new LayoutRelationshipGraphEngine();
  return engine.normalize(data);
}
