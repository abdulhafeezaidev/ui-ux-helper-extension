import {
  AnalyzePageResponseData,
  ContainerHierarchySpecification,
  ContainerHierarchyNode,
  ContainerHierarchyChild,
  ContainerLayoutModel,
  RawElementNode,
} from '../../../types/index.ts';
import { SpatialRelationshipAnalyzer } from './spatialRelationshipAnalyzer.ts';

export class ContainerHierarchyEngine {
  private spatialAnalyzer = new SpatialRelationshipAnalyzer();

  public normalize(data: AnalyzePageResponseData): ContainerHierarchySpecification {
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';
    const rawElements: RawElementNode[] = data.extractionResult?.elements || [];

    const containers: Record<string, ContainerHierarchyNode> = {};
    const containersByLayoutType: Record<ContainerLayoutModel, number> = {
      'flex-row': 0,
      'flex-column': 0,
      grid: 0,
      'block-flow': 0,
      'fixed-overlay': 0,
    };

    // 1. Root Container
    const rootId = 'container_root';
    containers[rootId] = {
      containerId: rootId,
      name: 'Root Viewport Container',
      containerType: 'RootContainer',
      layoutModel: 'block-flow',
      parentContainerId: null,
      nestingDepth: 0,
      alignment: {
        justify: 'flex-start',
        align: 'stretch',
        isCenteredHorizontally: false,
        isCenteredVertically: false,
      },
      gap: { token: 'token_spacing_none', px: 0 },
      padding: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      children: [],
      isFullWidth: true,
      hasIntrinsicAspectRatio: false,
    };
    containersByLayoutType['block-flow']++;

    // 2. Identify all candidate containers in DOM
    const containerCandidates = rawElements.filter(
      (el) =>
        (el.childIds?.length || 0) > 0 ||
        (el.display || '').includes('flex') ||
        (el.display || '').includes('grid') ||
        el.tagName === 'SECTION' ||
        el.tagName === 'HEADER' ||
        el.tagName === 'FOOTER' ||
        el.tagName === 'MAIN' ||
        (el.className || '').toLowerCase().includes('card')
    );

    let maxNestingDepth = 0;

    for (const el of containerCandidates) {
      const containerId = `container_${el.id}`;
      const layoutModel = this.inferLayoutModel(el);
      const containerType = this.inferContainerType(el, layoutModel);
      const nestingDepth = this.computeNestingDepth(el, rawElements);
      maxNestingDepth = Math.max(maxNestingDepth, nestingDepth);

      const parentContainer = this.findParentContainer(el, containerCandidates);
      const parentContainerId = parentContainer ? `container_${parentContainer.id}` : rootId;

      const gapPx = parseFloat(el.gap?.row || (el as any).rowGap || '0') || 0;
      const gapToken = this.spatialAnalyzer.mapGapToToken(gapPx) || 'token_spacing_none';

      const isCenteredH = (el.display || '').includes('flex')
        ? ((el as any).justifyContent || '').includes('center') || ((el as any).alignItems || '').includes('center')
        : false;
      const isCenteredV = (el.display || '').includes('flex')
        ? ((el as any).alignItems || '').includes('center') || ((el as any).justifyContent || '').includes('center')
        : false;

      // Children list
      const childElements = rawElements.filter((child) => (el.childIds || []).includes(child.id));
      const children: ContainerHierarchyChild[] = childElements.map((child, idx) => {
        const isGrid = layoutModel === 'grid';
        const isCenteredChild = this.spatialAnalyzer.isCenteredHorizontally(child, el);
        const isStretchChild = this.spatialAnalyzer.isStretch(child, el);

        let relationshipToParent: ContainerHierarchyChild['relationshipToParent'] = 'Inside';
        if (isGrid) {
          relationshipToParent = 'Grid Column';
        } else if (isCenteredChild) {
          relationshipToParent = 'Centered';
        } else if (isStretchChild) {
          relationshipToParent = 'Stretch';
        }

        const gridCoordinates = isGrid
          ? {
              col: (idx % 4) + 1,
              row: Math.floor(idx / 4) + 1,
              colSpan: 1,
              rowSpan: 1,
            }
          : undefined;

        return {
          childId: child.id,
          childName: this.spatialAnalyzer.formatNodeName(child),
          childType: this.spatialAnalyzer.inferNodeType(child) === 'container' ? 'container' : 'component',
          relationshipToParent,
          orderIndex: idx,
          gapFromPrevious: idx > 0 ? this.spatialAnalyzer.computeGapBetween(childElements[idx - 1], child, layoutModel === 'flex-row') : null,
          gridCoordinates,
        };
      });

      const node: ContainerHierarchyNode = {
        containerId,
        name: `${this.spatialAnalyzer.formatNodeName(el)} Container`,
        containerType,
        layoutModel,
        parentContainerId,
        nestingDepth,
        alignment: {
          justify: (el as any).justifyContent || 'flex-start',
          align: (el as any).alignItems || 'stretch',
          isCenteredHorizontally: isCenteredH,
          isCenteredVertically: isCenteredV,
        },
        gap: {
          token: gapToken,
          px: gapPx,
        },
        padding: {
          top: el.padding?.top || '0px',
          right: el.padding?.right || '0px',
          bottom: el.padding?.bottom || '0px',
          left: el.padding?.left || '0px',
        },
        children,
        isFullWidth: (el.boundingRect?.width || 0) >= 1200 || el.tagName === 'SECTION' || el.tagName === 'HEADER',
        hasIntrinsicAspectRatio: false,
      };

      containers[containerId] = node;
      containersByLayoutType[layoutModel]++;

      // Add to root children if parent is root
      if (parentContainerId === rootId) {
        containers[rootId].children.push({
          childId: containerId,
          childName: node.name,
          childType: 'container',
          relationshipToParent: 'Inside',
          orderIndex: containers[rootId].children.length,
          gapFromPrevious: null,
        });
      }
    }

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/container-hierarchy-v2.json',
      version: '2.0.0',
      target: { title, url },
      summary: {
        rootContainerId: rootId,
        totalContainers: Object.keys(containers).length,
        maxNestingDepth,
        containersByLayoutType,
      },
      containers,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private inferLayoutModel(el: RawElementNode): ContainerLayoutModel {
    const display = (el.display || '').toLowerCase();
    const flexDir = ((el as any).flexDirection || '').toLowerCase();
    const pos = el.position || 'static';

    if (['fixed', 'sticky'].includes(pos)) return 'fixed-overlay';
    if (display.includes('grid')) return 'grid';
    if (display.includes('flex')) {
      return flexDir.includes('column') ? 'flex-column' : 'flex-row';
    }
    return 'block-flow';
  }

  private inferContainerType(
    el: RawElementNode,
    model: ContainerLayoutModel
  ): ContainerHierarchyNode['containerType'] {
    const tag = (el.tagName || '').toUpperCase();
    const cls = (el.className || '').toLowerCase();

    if (tag === 'SECTION' || tag === 'HEADER' || tag === 'FOOTER' || tag === 'MAIN' || cls.includes('section') || cls.includes('hero')) {
      return 'SectionContainer';
    }
    if (model === 'grid' || cls.includes('grid')) return 'GridContainer';
    if (cls.includes('card')) return 'CardContainer';
    if (cls.includes('modal') || el.role === 'dialog') return 'ModalDialog';
    if (model === 'flex-column') return 'FlexColumn';
    return 'FlexRow';
  }

  private computeNestingDepth(el: RawElementNode, allElements: RawElementNode[]): number {
    let depth = 1;
    let current = el;
    while (current && current.parentId) {
      const parent = allElements.find((e) => e.id === current.parentId);
      if (!parent) break;
      depth++;
      current = parent;
      if (depth > 10) break;
    }
    return depth;
  }

  private findParentContainer(el: RawElementNode, containerCandidates: RawElementNode[]): RawElementNode | null {
    if (!el.parentId) return null;
    const directParent = containerCandidates.find((c) => c.id === el.parentId);
    if (directParent) return directParent;
    return null;
  }
}
