import {
  RawElementNode,
  SpatialRelationshipType,
  LayoutRelationshipNode,
} from '../../../types/index.ts';

export class SpatialRelationshipAnalyzer {
  /**
   * Infers all directional and containment relationships between a parent container and its children,
   * as well as between adjacent sibling nodes.
   */
  public analyzeElementRelationships(
    element: RawElementNode,
    allElements: RawElementNode[]
  ): LayoutRelationshipNode[] {
    const relationships: LayoutRelationshipNode[] = [];
    const childIds = element.childIds || [];
    const children = allElements.filter((e) => childIds.includes(e.id));

    const parentName = this.formatNodeName(element);
    const parentType = this.inferNodeType(element);

    // 1. Parent -> Child Containment & Alignment Relationships
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childName = this.formatNodeName(child);
      const childType = this.inferNodeType(child);

      // A. Inside (Containment)
      const isCenteredHorizontally = this.isCenteredHorizontally(child, element);
      const isCenteredVertically = this.isCenteredVertically(child, element);
      const isStretch = this.isStretch(child, element);

      let primaryRelation: SpatialRelationshipType = 'Inside';
      let alignment: LayoutRelationshipNode['alignment'] = 'none';

      if (isCenteredHorizontally && isCenteredVertically) {
        primaryRelation = 'Centered';
        alignment = 'center';
      } else if (isCenteredHorizontally) {
        primaryRelation = 'Centered';
        alignment = 'center';
      } else if (isStretch) {
        primaryRelation = 'Stretch';
        alignment = 'stretch';
      }

      // Check Grid placement if parent is grid
      let gridPlacement: LayoutRelationshipNode['gridPlacement'];
      if ((element.display || '').includes('grid')) {
        primaryRelation = 'Grid Column';
        gridPlacement = {
          colSpan: 1,
          colStart: (i % 4) + 1,
          rowSpan: 1,
          rowStart: Math.floor(i / 4) + 1,
        };
      }

      const rationale = this.generateContainmentRationale(childName, parentName, primaryRelation, alignment);

      // Only include fallbackGeometry where strictly required (e.g. absolute overlays or fixed aspect ratios)
      const isAbsolute = child.position === 'absolute' || child.position === 'fixed';
      const fallbackGeometry = isAbsolute
        ? {
            width: child.boundingRect?.width,
            height: child.boundingRect?.height,
            isAbsoluteOverlay: true,
          }
        : undefined;

      relationships.push({
        sourceId: child.id,
        sourceType: childType,
        sourceName: childName,
        targetId: element.id,
        targetType: parentType,
        targetName: parentName,
        relation: primaryRelation,
        alignment,
        gapToken: null,
        gapPx: null,
        gridPlacement,
        confidence: 0.95,
        rationale,
        fallbackGeometry,
      });

      // B. Sibling Spatial Relationships (Above / Below / Adjacent)
      if (i > 0) {
        const prevChild = children[i - 1];
        const prevChildName = this.formatNodeName(prevChild);
        const prevChildType = this.inferNodeType(prevChild);

        const isRowLayout = (element.display || '').includes('flex') && !(element as any).flexDirection?.includes('column');
        const gapPx = this.computeGapBetween(prevChild, child, isRowLayout);
        const gapToken = this.mapGapToToken(gapPx);

        if (isRowLayout) {
          relationships.push({
            sourceId: child.id,
            sourceType: childType,
            sourceName: childName,
            targetId: prevChild.id,
            targetType: prevChildType,
            targetName: prevChildName,
            relation: 'Adjacent',
            alignment: 'start',
            gapToken,
            gapPx,
            confidence: 0.92,
            rationale: `${childName} is positioned adjacent to ${prevChildName} with ${gapPx}px gap (${gapToken || 'custom gap'}).`,
          });
        } else {
          relationships.push({
            sourceId: child.id,
            sourceType: childType,
            sourceName: childName,
            targetId: prevChild.id,
            targetType: prevChildType,
            targetName: prevChildName,
            relation: 'Below',
            alignment: isCenteredHorizontally ? 'center' : 'start',
            gapToken,
            gapPx,
            confidence: 0.94,
            rationale: `${childName} is positioned below ${prevChildName} with ${gapPx}px vertical gap (${gapToken || 'custom gap'}).`,
          });
        }
      }
    }

    return relationships;
  }

  public isCenteredHorizontally(child: RawElementNode, parent: RawElementNode): boolean {
    // Check CSS alignment
    const parentDisplay = (parent.display || '').toLowerCase();
    const parentAlign = ((parent as any).alignItems || '').toLowerCase();
    const parentJustify = ((parent as any).justifyContent || '').toLowerCase();

    if (parentDisplay.includes('flex')) {
      const isColumn = ((parent as any).flexDirection || '').toLowerCase().includes('column');
      if (isColumn && parentAlign.includes('center')) return true;
      if (!isColumn && parentJustify.includes('center')) return true;
    }

    // Check spatial symmetry if bounding boxes exist
    if (child.boundingRect && parent.boundingRect && parent.boundingRect.width > 0) {
      const parentCenterX = parent.boundingRect.x + parent.boundingRect.width / 2;
      const childCenterX = child.boundingRect.x + child.boundingRect.width / 2;
      return Math.abs(parentCenterX - childCenterX) <= 12;
    }

    return false;
  }

  public isCenteredVertically(child: RawElementNode, parent: RawElementNode): boolean {
    const parentDisplay = (parent.display || '').toLowerCase();
    const parentAlign = ((parent as any).alignItems || '').toLowerCase();
    const parentJustify = ((parent as any).justifyContent || '').toLowerCase();

    if (parentDisplay.includes('flex')) {
      const isColumn = ((parent as any).flexDirection || '').toLowerCase().includes('column');
      if (isColumn && parentJustify.includes('center')) return true;
      if (!isColumn && parentAlign.includes('center')) return true;
    }

    if (child.boundingRect && parent.boundingRect && parent.boundingRect.height > 0) {
      const parentCenterY = parent.boundingRect.y + parent.boundingRect.height / 2;
      const childCenterY = child.boundingRect.y + child.boundingRect.height / 2;
      return Math.abs(parentCenterY - childCenterY) <= 12;
    }

    return false;
  }

  public isStretch(child: RawElementNode, parent: RawElementNode): boolean {
    if (child.boundingRect && parent.boundingRect && parent.boundingRect.width > 0) {
      const widthRatio = child.boundingRect.width / parent.boundingRect.width;
      return widthRatio >= 0.9;
    }
    return false;
  }

  public computeGapBetween(prev: RawElementNode, current: RawElementNode, isHorizontal: boolean): number {
    if (prev.boundingRect && current.boundingRect) {
      if (isHorizontal) {
        const gap = current.boundingRect.x - (prev.boundingRect.x + prev.boundingRect.width);
        return Math.max(0, Math.round(gap));
      } else {
        const gap = current.boundingRect.y - (prev.boundingRect.y + prev.boundingRect.height);
        return Math.max(0, Math.round(gap));
      }
    }
    return 16;
  }

  public mapGapToToken(gapPx: number): string | null {
    if (gapPx <= 4) return 'token_spacing_xs';
    if (gapPx <= 8) return 'token_spacing_sm';
    if (gapPx <= 12) return 'token_spacing_md';
    if (gapPx <= 16) return 'token_spacing_lg';
    if (gapPx <= 24) return 'token_spacing_xl';
    if (gapPx <= 32) return 'token_spacing_2xl';
    if (gapPx >= 48) return 'token_spacing_3xl';
    return `token_spacing_${gapPx}px`;
  }

  public formatNodeName(el: RawElementNode): string {
    const role = (el.role || '').toLowerCase();
    const tag = (el.tagName || 'DIV').toUpperCase();
    const cls = (el.className || '').toLowerCase();

    if (cls.includes('hero')) return 'Hero';
    if (cls.includes('cta') || (tag === 'BUTTON' && cls.includes('primary'))) return 'CTA';
    if (tag === 'BUTTON') return 'Button';
    if (tag === 'H1') return 'Hero Heading';
    if (tag === 'H2') return 'Section Heading';
    if (tag === 'NAV' || cls.includes('nav')) return 'Navbar';
    if (cls.includes('card') || cls.includes('product')) return 'Product Card';
    if (cls.includes('grid')) return 'Product Grid';
    if (role === 'region' || tag === 'SECTION') return 'Section';
    if (tag === 'FOOTER') return 'Footer';
    return tag;
  }

  public inferNodeType(el: RawElementNode): 'component' | 'section' | 'element' | 'container' {
    const tag = (el.tagName || '').toUpperCase();
    const cls = (el.className || '').toLowerCase();

    if (tag === 'SECTION' || tag === 'HEADER' || tag === 'FOOTER' || cls.includes('section') || cls.includes('hero')) {
      return 'section';
    }
    if (tag === 'BUTTON' || cls.includes('card') || cls.includes('modal') || cls.includes('badge')) {
      return 'component';
    }
    if ((el.display || '').includes('flex') || (el.display || '').includes('grid') || (el.childIds?.length || 0) > 0) {
      return 'container';
    }
    return 'element';
  }

  private generateContainmentRationale(
    childName: string,
    parentName: string,
    relation: SpatialRelationshipType,
    alignment: string
  ): string {
    if (relation === 'Centered') {
      return `${childName} is contained within ${parentName} and centered horizontally to maintain visual symmetry.`;
    }
    if (relation === 'Stretch') {
      return `${childName} stretches to fill the full width of container ${parentName}.`;
    }
    if (relation === 'Grid Column') {
      return `${childName} occupies a structured grid track cell inside ${parentName}.`;
    }
    return `${childName} is nested inside ${parentName} with ${alignment} alignment.`;
  }
}
