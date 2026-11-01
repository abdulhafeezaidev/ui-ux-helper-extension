import { AnalyzePageResponseData, ContainerHierarchySpecification } from '../../types/index.ts';
import { ContainerHierarchyEngine } from '../../normalization/layout/relationships/containerHierarchyEngine.ts';

/**
 * Exporter for ContainerHierarchy.json
 * Generates the strict nesting container hierarchy tree with layout models, alignments, and gap tokens.
 */
export function exportContainerHierarchyJson(data: AnalyzePageResponseData): string {
  const engine = new ContainerHierarchyEngine();
  const spec: ContainerHierarchySpecification = engine.normalize(data);
  return JSON.stringify(spec, null, 2);
}

export function exportContainerHierarchyObject(data: AnalyzePageResponseData): ContainerHierarchySpecification {
  const engine = new ContainerHierarchyEngine();
  return engine.normalize(data);
}
