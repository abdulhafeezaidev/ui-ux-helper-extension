import {
  AnalyzePageResponseData,
  ComponentDependencyGraphSpecification,
  ComponentDependencyNode,
  ComponentDependencyNodeType,
  ComponentRegistrySpecification,
  RawElementNode,
} from '../../types/index.ts';
import { CanonicalComponentRegistryEngine } from '../knowledgeGraph/canonicalComponentRegistryEngine.ts';

export class ComponentDependencyGraphEngine {
  private componentRegistryEngine = new CanonicalComponentRegistryEngine();

  public normalize(
    data: AnalyzePageResponseData,
    componentRegistry?: ComponentRegistrySpecification
  ): ComponentDependencyGraphSpecification {
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';
    const rawElements: RawElementNode[] = data.extractionResult?.elements || [];

    const compReg = componentRegistry || this.componentRegistryEngine.normalize(data);
    const nodes: Record<string, ComponentDependencyNode> = {};

    // 1. Identify and categorize all components
    for (const [compId, comp] of Object.entries(compReg.components)) {
      const nodeType = this.inferComponentNodeType(comp.category, comp.name);
      nodes[compId] = {
        componentId: compId,
        name: comp.name,
        nodeType,
        dependencies: [],
        dependents: [],
        buildOrder: nodeType === 'primitive' ? 1 : nodeType === 'composite' ? 2 : 3,
        isShared: (comp.instanceElementIds?.length || 0) > 1,
        instanceCount: comp.instanceElementIds?.length || 1,
      };
    }

    // 2. Identify and add Sections
    const sectionElements = rawElements.filter(
      (el) =>
        el.tagName === 'SECTION' ||
        el.tagName === 'HEADER' ||
        el.tagName === 'FOOTER' ||
        (el.className || '').toLowerCase().includes('hero') ||
        (el.className || '').toLowerCase().includes('section')
    );

    for (const sec of sectionElements) {
      const secId = `sec_${sec.id}`;
      const secName = this.formatSectionName(sec);

      // Find children components of this section
      const containedCompIds: string[] = [];
      for (const [compId, comp] of Object.entries(compReg.components)) {
        if (comp.instanceElementIds.some((elId) => (sec.childIds || []).includes(elId))) {
          containedCompIds.push(compId);
        }
      }

      nodes[secId] = {
        componentId: secId,
        name: secName,
        nodeType: 'section',
        dependencies: containedCompIds,
        dependents: ['page_root'],
        buildOrder: 3,
        isShared: false,
        instanceCount: 1,
      };

      // Mark dependents on child components
      for (const compId of containedCompIds) {
        if (nodes[compId]) {
          if (!nodes[compId].dependents.includes(secId)) {
            nodes[compId].dependents.push(secId);
          }
        }
      }
    }

    // 3. Add Page Root Node
    const allSectionIds = Object.values(nodes)
      .filter((n) => n.nodeType === 'section')
      .map((n) => n.componentId);

    nodes['page_root'] = {
      componentId: 'page_root',
      name: `${title} Page`,
      nodeType: 'page',
      dependencies: allSectionIds,
      dependents: [],
      buildOrder: 4,
      isShared: false,
      instanceCount: 1,
    };

    // 4. Map inter-component dependencies (e.g. Card contains Button or Badge)
    this.linkPrimitiveDependencies(nodes);

    // 5. Compute Topological Order
    const topologicalOrder = this.computeTopologicalOrder(nodes);

    // Count statistics
    let primitiveCount = 0;
    let compositeCount = 0;
    let sectionCount = 0;
    let pageCount = 0;

    for (const n of Object.values(nodes)) {
      if (n.nodeType === 'primitive') primitiveCount++;
      else if (n.nodeType === 'composite') compositeCount++;
      else if (n.nodeType === 'section') sectionCount++;
      else if (n.nodeType === 'page') pageCount++;
    }

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/component-dependency-graph-v2.json',
      version: '2.0.0',
      target: { title, url },
      summary: {
        totalNodes: Object.keys(nodes).length,
        primitiveCount,
        compositeCount,
        sectionCount,
        pageCount,
        maxDependencyDepth: 4,
        topologicalOrder,
      },
      nodes,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private inferComponentNodeType(category: string, name: string): ComponentDependencyNodeType {
    const lower = `${category} ${name}`.toLowerCase();
    if (lower.includes('button') || lower.includes('badge') || lower.includes('input') || lower.includes('avatar') || lower.includes('icon')) {
      return 'primitive';
    }
    if (lower.includes('card') || lower.includes('modal') || lower.includes('menu') || lower.includes('search') || lower.includes('item')) {
      return 'composite';
    }
    if (lower.includes('hero') || lower.includes('header') || lower.includes('grid') || lower.includes('footer') || lower.includes('section')) {
      return 'section';
    }
    return 'composite';
  }

  private formatSectionName(sec: RawElementNode): string {
    const cls = (sec.className || '').toLowerCase();
    const tag = (sec.tagName || 'SECTION').toUpperCase();

    if (tag === 'HEADER' || cls.includes('header')) return 'Header Section';
    if (cls.includes('hero')) return 'Hero Section';
    if (cls.includes('grid') || cls.includes('catalog') || cls.includes('product')) return 'Product Grid Section';
    if (tag === 'FOOTER' || cls.includes('footer')) return 'Footer Section';
    return `${tag} Section`;
  }

  private linkPrimitiveDependencies(nodes: Record<string, ComponentDependencyNode>): void {
    const primitives = Object.values(nodes).filter((n) => n.nodeType === 'primitive');
    const composites = Object.values(nodes).filter((n) => n.nodeType === 'composite');

    for (const comp of composites) {
      for (const prim of primitives) {
        // e.g. Card typically contains Button or Badge
        if (comp.name.includes('Card') && prim.name.includes('Button')) {
          if (!comp.dependencies.includes(prim.componentId)) comp.dependencies.push(prim.componentId);
          if (!prim.dependents.includes(comp.componentId)) prim.dependents.push(comp.componentId);
        }
      }
    }
  }

  private computeTopologicalOrder(nodes: Record<string, ComponentDependencyNode>): string[] {
    const sorted = Object.values(nodes).sort((a, b) => {
      if (a.buildOrder !== b.buildOrder) return a.buildOrder - b.buildOrder;
      return a.name.localeCompare(b.name);
    });
    return sorted.map((n) => `${n.name} (${n.nodeType})`);
  }
}
