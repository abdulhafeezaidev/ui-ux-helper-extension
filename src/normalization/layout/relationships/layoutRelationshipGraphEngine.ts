import {
  AnalyzePageResponseData,
  LayoutRelationshipGraphSpecification,
  LayoutRelationshipNode,
  RawElementNode,
  ComponentRegistrySpecification,
} from '../../../types/index.ts';
import { SpatialRelationshipAnalyzer } from './spatialRelationshipAnalyzer.ts';
import { CanonicalComponentRegistryEngine } from '../../knowledgeGraph/canonicalComponentRegistryEngine.ts';

export class LayoutRelationshipGraphEngine {
  private spatialAnalyzer = new SpatialRelationshipAnalyzer();
  private componentRegistryEngine = new CanonicalComponentRegistryEngine();

  public normalize(
    data: AnalyzePageResponseData,
    componentRegistry?: ComponentRegistrySpecification
  ): LayoutRelationshipGraphSpecification {
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';
    const rawElements: RawElementNode[] = data.extractionResult?.elements || [];

    const compReg = componentRegistry || this.componentRegistryEngine.normalize(data);
    const relationships: LayoutRelationshipNode[] = [];

    // 1. Analyze parent-child & sibling relationships across all elements
    for (const el of rawElements) {
      if ((el.childIds?.length || 0) > 0) {
        const nodeRels = this.spatialAnalyzer.analyzeElementRelationships(el, rawElements);
        relationships.push(...nodeRels);
      }
    }

    // 2. High-level Component-to-Component / Section Relationships
    this.extractComponentLevelRelationships(compReg, rawElements, relationships);

    // 3. Calculate Summary Metrics
    let spatialRelations = 0;
    let containmentRelations = 0;
    let alignmentRelations = 0;
    let gridRelations = 0;
    let entitiesWithRelativeOnly = 0;
    let entitiesRequiringFallbackGeometry = 0;

    for (const rel of relationships) {
      if (rel.relation === 'Above' || rel.relation === 'Below' || rel.relation === 'Adjacent') {
        spatialRelations++;
      } else if (rel.relation === 'Inside') {
        containmentRelations++;
      } else if (rel.relation === 'Centered' || rel.relation === 'Stretch') {
        alignmentRelations++;
      } else if (rel.relation === 'Grid Column' || rel.relation === 'Grid Row') {
        gridRelations++;
      }

      if (rel.fallbackGeometry) {
        entitiesRequiringFallbackGeometry++;
      } else {
        entitiesWithRelativeOnly++;
      }
    }

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/layout-relationship-graph-v2.json',
      version: '2.0.0',
      target: { title, url },
      summary: {
        totalRelationships: relationships.length,
        spatialRelations,
        containmentRelations,
        alignmentRelations,
        gridRelations,
        entitiesWithRelativeOnly,
        entitiesRequiringFallbackGeometry,
      },
      relationships,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private extractComponentLevelRelationships(
    compReg: ComponentRegistrySpecification,
    rawElements: RawElementNode[],
    relationships: LayoutRelationshipNode[]
  ): void {
    const components = Object.values(compReg.components);

    for (const comp of components) {
      const repEl = rawElements.find((e) => comp.instanceElementIds.includes(e.id));
      if (!repEl) continue;

      // Find parent element and map to parent component/section
      const parentEl = rawElements.find((e) => (e.childIds || []).includes(repEl.id));
      if (parentEl) {
        const parentName = this.spatialAnalyzer.formatNodeName(parentEl);
        const parentType = this.spatialAnalyzer.inferNodeType(parentEl);
        const isCentered = this.spatialAnalyzer.isCenteredHorizontally(repEl, parentEl);

        const compRel: LayoutRelationshipNode = {
          sourceId: comp.componentId,
          sourceType: 'component',
          sourceName: comp.name,
          targetId: parentEl.id,
          targetType: parentType,
          targetName: parentName,
          relation: isCentered ? 'Centered' : 'Inside',
          alignment: isCentered ? 'center' : 'start',
          gapToken: null,
          gapPx: null,
          confidence: 0.95,
          rationale: `${comp.name} is placed inside ${parentName}${isCentered ? ' and centered horizontally' : ''}.`,
        };

        // Avoid adding exact duplicate
        const alreadyExists = relationships.some(
          (r) => r.sourceId === compRel.sourceId && r.targetId === compRel.targetId && r.relation === compRel.relation
        );
        if (!alreadyExists) {
          relationships.push(compRel);
        }
      }
    }
  }
}
