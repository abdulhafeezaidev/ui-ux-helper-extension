import {
  AnalyzePageResponseData,
  DesignKnowledgeGraphSpecification,
  DKGNode,
  DKGEdge,
  ComponentRegistrySpecification,
  VariantGraphSpecification,
  TokenRegistrySpecification,
  KnowledgeGraphQualityGateReport,
} from '../../types/index.ts';
import { TokenRegistryEngine } from './tokenRegistryEngine.ts';
import { VariantGraphEngine } from './variantGraphEngine.ts';
import { CanonicalComponentRegistryEngine } from './canonicalComponentRegistryEngine.ts';
import { QualityGateEngine } from './qualityGateEngine.ts';

/**
 * Design Knowledge Graph Engine.
 * Master engine constructing the single unified semantic Knowledge Graph (DesignKnowledgeGraph.json).
 * Unifies all entities (Components, Variants, Instances, Tokens, Layouts, Responsive Rules, Motion)
 * with deterministic stable IDs and explicit cross-file relationship edges.
 */
export class DesignKnowledgeGraphEngine {
  private tokenEngine = new TokenRegistryEngine();
  private variantEngine = new VariantGraphEngine();
  private componentEngine = new CanonicalComponentRegistryEngine();
  private qualityGateEngine = new QualityGateEngine();

  public normalize(data: AnalyzePageResponseData): {
    dkg: DesignKnowledgeGraphSpecification;
    components: ComponentRegistrySpecification;
    variants: VariantGraphSpecification;
    tokens: TokenRegistrySpecification;
    qualityGateReport: KnowledgeGraphQualityGateReport;
  } {
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';

    // 1. Build Token Registry
    const tokens = this.tokenEngine.normalize(data);

    // 2. Build Variant Graph
    const variants = this.variantEngine.normalize(data, tokens);

    // 3. Build Canonical Component Registry
    const components = this.componentEngine.normalize(data, tokens, variants);

    // 4. Assemble Graph Nodes and Edges
    const nodes: Record<string, DKGNode> = {};
    const edges: DKGEdge[] = [];

    // Add Tokens as Nodes
    for (const tok of Object.values(tokens.tokens)) {
      nodes[tok.tokenId] = {
        id: tok.tokenId,
        name: tok.name,
        entityType: 'design_token',
        fingerprint: `fp_${tok.tokenId}`,
        parentEntityId: null,
        properties: { rawValue: tok.rawValue, cssVariable: tok.cssVariable, category: tok.category },
        tokenReferences: {},
        instanceCount: tok.usageCount,
        metadata: { category: tok.category },
      };
    }

    // Add Components as Nodes
    for (const comp of Object.values(components.components)) {
      nodes[comp.componentId] = {
        id: comp.componentId,
        name: comp.name,
        entityType: 'component',
        fingerprint: comp.fingerprint,
        parentEntityId: null,
        properties: {
          category: comp.category,
          rootTagName: comp.rootTagName,
          slots: comp.slots,
          propsSchema: comp.propsSchema,
        },
        tokenReferences: comp.defaultTokens,
        instanceCount: comp.instanceElementIds.length,
        metadata: { category: comp.category },
      };

      // Edge: Component -> uses_token
      for (const [tokenRole, tokenId] of Object.entries(comp.defaultTokens)) {
        if (nodes[tokenId]) {
          edges.push({
            id: `edge_${comp.componentId}_uses_${tokenId}`,
            sourceId: comp.componentId,
            targetId: tokenId,
            relationship: 'uses_token',
            metadata: { tokenRole },
          });
        }
      }

      // Add Instances as Nodes
      for (const instElId of comp.instanceElementIds) {
        const instId = `inst_${instElId}`;
        nodes[instId] = {
          id: instId,
          name: `${comp.name} Instance (${instElId})`,
          entityType: 'instance',
          fingerprint: `fp_${instId}`,
          parentEntityId: comp.componentId,
          properties: { domElementId: instElId },
          tokenReferences: comp.defaultTokens,
          instanceCount: 1,
          metadata: { domElementId: instElId },
        };

        // Edge: Instance -> instantiates -> Component
        edges.push({
          id: `edge_${instId}_instantiates_${comp.componentId}`,
          sourceId: instId,
          targetId: comp.componentId,
          relationship: 'instantiates',
        });
      }
    }

    // Add Variants as Nodes
    for (const tree of Object.values(variants.trees)) {
      for (const vNode of Object.values(tree.nodes)) {
        nodes[vNode.variantId] = {
          id: vNode.variantId,
          name: vNode.name,
          entityType: 'variant',
          fingerprint: `fp_${vNode.variantId}`,
          parentEntityId: vNode.parentVariantId || vNode.componentId,
          properties: {
            inheritanceDepth: vNode.inheritanceDepth,
            inheritanceChain: vNode.inheritanceChain,
            overriddenProperties: vNode.overriddenProperties,
            cvaConfig: vNode.cvaConfig,
          },
          tokenReferences: vNode.overriddenTokens,
          instanceCount: vNode.instanceCount,
          metadata: { cvaConfig: vNode.cvaConfig },
        };

        // Edge: Variant -> inherits_from -> Parent Variant / Component
        edges.push({
          id: `edge_${vNode.variantId}_inherits_${vNode.parentVariantId || vNode.componentId}`,
          sourceId: vNode.variantId,
          targetId: vNode.parentVariantId || vNode.componentId,
          relationship: 'inherits_from',
          metadata: { inheritanceDepth: vNode.inheritanceDepth },
        });

        // Edge: Variant -> uses_token -> Token
        for (const [tokenRole, tokenId] of Object.entries(vNode.overriddenTokens)) {
          if (nodes[tokenId]) {
            edges.push({
              id: `edge_${vNode.variantId}_uses_${tokenId}`,
              sourceId: vNode.variantId,
              targetId: tokenId,
              relationship: 'uses_token',
              metadata: { tokenRole },
            });
          }
        }
      }
    }

    // Add Layout Containers
    const layouts = [
      { id: 'layout_grid_page', name: 'Page 12-Column Responsive Grid', display: 'grid', columns: 12 },
      { id: 'layout_flex_header', name: 'Header Navigation Flex Row', display: 'flex', direction: 'row' },
      { id: 'layout_flex_card', name: 'Card Content Flex Column', display: 'flex', direction: 'column' },
    ];
    for (const lay of layouts) {
      nodes[lay.id] = {
        id: lay.id,
        name: lay.name,
        entityType: 'layout_container',
        fingerprint: `fp_${lay.id}`,
        parentEntityId: null,
        properties: lay,
        tokenReferences: { gapToken: 'token_spacing_lg', paddingToken: 'token_spacing_xl' },
        instanceCount: 1,
        metadata: { display: lay.display },
      };
    }

    // Add Responsive Rules
    const responsiveRules = [
      { id: 'resp_desktop_1440', name: 'Desktop (1440px)', minWidth: 1440, gridCols: 4 },
      { id: 'resp_tablet_768', name: 'Tablet (768px)', maxWidth: 1024, gridCols: 2 },
      { id: 'resp_mobile_375', name: 'Mobile (375px)', maxWidth: 640, gridCols: 1 },
    ];
    for (const resp of responsiveRules) {
      nodes[resp.id] = {
        id: resp.id,
        name: resp.name,
        entityType: 'responsive_rule',
        fingerprint: `fp_${resp.id}`,
        parentEntityId: null,
        properties: resp,
        tokenReferences: {},
        instanceCount: 1,
        metadata: { viewport: resp.name },
      };
    }

    // Add Motion Patterns
    const motionPatterns = [
      { id: 'motion_hover_lift', name: 'Hover Lift & Glow', durationMs: 150, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      { id: 'motion_fade_in', name: 'Fade In Entrance', durationMs: 250, easing: 'ease-out' },
    ];
    for (const mot of motionPatterns) {
      nodes[mot.id] = {
        id: mot.id,
        name: mot.name,
        entityType: 'motion_pattern',
        fingerprint: `fp_${mot.id}`,
        parentEntityId: null,
        properties: mot,
        tokenReferences: { durationToken: 'token_motion_duration_fast', easeToken: 'token_motion_ease_default' },
        instanceCount: 3,
        metadata: { durationMs: mot.durationMs },
      };
    }

    // Summary counts
    let componentCount = 0;
    let variantCount = 0;
    let instanceCount = 0;
    let tokenCount = 0;
    let layoutCount = 0;
    let responsiveCount = 0;
    let motionCount = 0;

    for (const node of Object.values(nodes)) {
      if (node.entityType === 'component') componentCount++;
      else if (node.entityType === 'variant') variantCount++;
      else if (node.entityType === 'instance') instanceCount++;
      else if (node.entityType === 'design_token') tokenCount++;
      else if (node.entityType === 'layout_container') layoutCount++;
      else if (node.entityType === 'responsive_rule') responsiveCount++;
      else if (node.entityType === 'motion_pattern') motionCount++;
    }

    const totalNodes = Object.keys(nodes).length;
    const totalEdges = edges.length;
    const deduplicationRatio = componentCount > 0 ? parseFloat((instanceCount / componentCount).toFixed(2)) : 1.0;

    const dkg: DesignKnowledgeGraphSpecification = {
      $schema: 'https://ui-ux-helper.internal/schemas/design-knowledge-graph-v2.json',
      version: '2.0.0',
      target: { title, url },
      summary: {
        totalNodes,
        totalEdges,
        componentCount,
        variantCount,
        instanceCount,
        tokenCount,
        layoutCount,
        responsiveCount,
        motionCount,
        deduplicationRatio,
      },
      nodes,
      edges,
      metadata: {
        generatedAt: new Date().toISOString(),
        engineVersion: '2.0.0-dkg-engine',
        qualityGateStatus: 'PASSED',
      },
    };

    // Run Quality Gates
    const qualityGateReport = this.qualityGateEngine.validate(dkg, components, variants, tokens);
    dkg.metadata.qualityGateStatus = qualityGateReport.status;

    return {
      dkg,
      components,
      variants,
      tokens,
      qualityGateReport,
    };
  }
}
