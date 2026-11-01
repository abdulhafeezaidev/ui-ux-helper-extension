import {
  AnalyzePageResponseData,
  RawElementNode,
  RenderTreeNode,
  StackingContextInfo,
  RenderTreeSpecification,
  PaintLayerBand,
} from '../../types/index.ts';

export class RenderingOrderEngine {
  /**
   * Builds the complete browser-observed Render Tree and paint order specification.
   */
  public normalize(data: AnalyzePageResponseData): RenderTreeSpecification {
    return this.buildRenderTree(data);
  }

  public buildRenderTree(data: AnalyzePageResponseData): RenderTreeSpecification {
    const rawElements = data.extractionResult?.elements || [];
    const elMap = new Map<string, RawElementNode>(rawElements.map((e) => [e.id, e]));

    const viewportWidth =
      data.extractionResult?.pageMeta.viewport.width || data.layoutSystem?.viewport.width || 1440;
    const viewportHeight =
      data.extractionResult?.pageMeta.viewport.height || data.layoutSystem?.viewport.height || 900;
    const dpr = data.extractionResult?.pageMeta.devicePixelRatio || 1;

    if (rawElements.length === 0) {
      return this.buildEmptySpecification(data, viewportWidth, viewportHeight, dpr);
    }

    // 1. Identify Root Element
    const rootElement = rawElements.find((e) => !e.parentId || !elMap.has(e.parentId)) || rawElements[0];

    // 2. Detect Stacking Context Creation for Every Element
    const stackingContextCreationMap = new Map<string, { creates: boolean; reasons: string[] }>();
    for (const el of rawElements) {
      const isRoot = el.id === rootElement.id;
      const creation = this.detectStackingContextCreation(el, elMap, isRoot);
      stackingContextCreationMap.set(el.id, creation);
    }

    // 3. Resolve Enclosing Stacking Context for Every Element
    const enclosingContextMap = new Map<string, string>();
    for (const el of rawElements) {
      if (el.id === rootElement.id || stackingContextCreationMap.get(el.id)?.creates) {
        enclosingContextMap.set(el.id, `sc_${el.id}`);
      } else {
        // Walk up parent chain to find nearest ancestor that creates a stacking context
        let curr = el.parentId ? elMap.get(el.parentId) : null;
        let found = `sc_${rootElement.id}`;
        while (curr) {
          if (stackingContextCreationMap.get(curr.id)?.creates || curr.id === rootElement.id) {
            found = `sc_${curr.id}`;
            break;
          }
          curr = curr.parentId ? elMap.get(curr.parentId) : null;
        }
        enclosingContextMap.set(el.id, found);
      }
    }

    // 4. Resolve Positioned Ancestor & Clipping Parent for Every Element
    const positionedAncestorMap = new Map<string, string | null>();
    const clippingParentMap = new Map<string, string | null>();

    for (const el of rawElements) {
      // Positioned Ancestor: first parent with position !== 'static'
      let pCurr = el.parentId ? elMap.get(el.parentId) : null;
      let posAnc: string | null = null;
      while (pCurr) {
        if (pCurr.position && pCurr.position !== 'static') {
          posAnc = pCurr.id;
          break;
        }
        pCurr = pCurr.parentId ? elMap.get(pCurr.parentId) : null;
      }
      positionedAncestorMap.set(el.id, posAnc);

      // Clipping Parent: first parent with overflow !== 'visible'
      let cCurr = el.parentId ? elMap.get(el.parentId) : null;
      let clipAnc: string | null = null;
      while (cCurr) {
        const ox = cCurr.overflow?.x || 'visible';
        const oy = cCurr.overflow?.y || 'visible';
        if (ox !== 'visible' || oy !== 'visible') {
          clipAnc = cCurr.id;
          break;
        }
        cCurr = cCurr.parentId ? elMap.get(cCurr.parentId) : null;
      }
      clippingParentMap.set(el.id, clipAnc);
    }

    // 5. Build Stacking Context Hierarchy
    const stackingContexts = new Map<string, StackingContextInfo>();
    for (const el of rawElements) {
      const creation = stackingContextCreationMap.get(el.id);
      if (creation?.creates || el.id === rootElement.id) {
        const scId = `sc_${el.id}`;
        // Find parent stacking context
        let parentContextId: string | null = null;
        if (el.id !== rootElement.id) {
          let curr = el.parentId ? elMap.get(el.parentId) : null;
          while (curr) {
            if (stackingContextCreationMap.get(curr.id)?.creates || curr.id === rootElement.id) {
              parentContextId = `sc_${curr.id}`;
              break;
            }
            curr = curr.parentId ? elMap.get(curr.parentId) : null;
          }
          if (!parentContextId) {
            parentContextId = `sc_${rootElement.id}`;
          }
        }

        const zVal = this.parseZIndex(el.zIndex);
        const isFixedOrSticky = el.position === 'fixed' || el.position === 'sticky';
        const isOverlay = this.isOverlayElement(el);

        stackingContexts.set(scId, {
          id: scId,
          rootElementId: el.id,
          parentContextId,
          reason: creation ? creation.reasons : ['root-document-element'],
          childContextIds: [],
          zIndex: zVal,
          isFixedOrSticky,
          isOverlay,
        });
      }
    }

    // Link child contexts to parent contexts
    for (const sc of stackingContexts.values()) {
      if (sc.parentContextId && stackingContexts.has(sc.parentContextId)) {
        stackingContexts.get(sc.parentContextId)!.childContextIds.push(sc.id);
      }
    }

    // 6. Categorize Paint Layers for Each Element
    const paintLayerMap = new Map<string, PaintLayerBand>();
    for (const el of rawElements) {
      paintLayerMap.set(el.id, this.determinePaintLayer(el, rootElement.id));
    }

    // 7. Compute Global Deterministic Sequential Paint Order (CSS 2.1 Appendix E)
    const renderOrderMap = new Map<string, number>();
    let currentOrder = 1;

    const visitedNodes = new Set<string>();

    const traverseStackingContext = (scId: string) => {
      const scInfo = stackingContexts.get(scId);
      if (!scInfo) return;

      const rootEl = elMap.get(scInfo.rootElementId);
      if (rootEl && !visitedNodes.has(rootEl.id)) {
        visitedNodes.add(rootEl.id);
        renderOrderMap.set(rootEl.id, currentOrder++);
      }

      // Collect all elements belonging immediately to this stacking context
      const elementsInContext: RawElementNode[] = [];
      for (const el of rawElements) {
        if (el.id === scInfo.rootElementId) continue;
        if (enclosingContextMap.get(el.id) === scId) {
          elementsInContext.push(el);
        }
      }

      // Group elements into CSS 2.1 Appendix E paint bands
      const negativeZ: { el: RawElementNode; z: number; isChildContext: boolean }[] = [];
      const blocks: RawElementNode[] = [];
      const floats: RawElementNode[] = [];
      const inlines: RawElementNode[] = [];
      const positionedZero: { el: RawElementNode; isChildContext: boolean }[] = [];
      const positiveZ: { el: RawElementNode; z: number; isChildContext: boolean }[] = [];
      const fixedSticky: { el: RawElementNode; z: number; isChildContext: boolean }[] = [];
      const overlays: { el: RawElementNode; z: number; isChildContext: boolean }[] = [];

      for (const el of elementsInContext) {
        const isChildContext = stackingContextCreationMap.get(el.id)?.creates || false;
        const layer = paintLayerMap.get(el.id) || 'block';
        const numZ = typeof el.zIndex === 'string' && el.zIndex !== 'auto' ? parseInt(el.zIndex, 10) || 0 : 0;

        if (layer === 'overlay') {
          overlays.push({ el, z: numZ, isChildContext });
        } else if (layer === 'fixed-sticky') {
          fixedSticky.push({ el, z: numZ, isChildContext });
        } else if (layer === 'negative-z') {
          negativeZ.push({ el, z: numZ, isChildContext });
        } else if (layer === 'positive-z') {
          positiveZ.push({ el, z: numZ, isChildContext });
        } else if (layer === 'positioned-zero') {
          positionedZero.push({ el, isChildContext });
        } else if (layer === 'float') {
          floats.push(el);
        } else if (layer === 'inline') {
          inlines.push(el);
        } else {
          blocks.push(el);
        }
      }

      // Band 1: Negative Z-index elements (sorted ascending by zIndex, DOM order tiebreaker)
      negativeZ.sort((a, b) => a.z - b.z);
      for (const item of negativeZ) {
        if (item.isChildContext && stackingContexts.has(`sc_${item.el.id}`)) {
          traverseStackingContext(`sc_${item.el.id}`);
        } else if (!visitedNodes.has(item.el.id)) {
          visitedNodes.add(item.el.id);
          renderOrderMap.set(item.el.id, currentOrder++);
        }
      }

      // Band 2: In-flow Block descendants (DOM order)
      for (const el of blocks) {
        if (!visitedNodes.has(el.id)) {
          visitedNodes.add(el.id);
          renderOrderMap.set(el.id, currentOrder++);
        }
      }

      // Band 3: Non-positioned Floats (DOM order)
      for (const el of floats) {
        if (!visitedNodes.has(el.id)) {
          visitedNodes.add(el.id);
          renderOrderMap.set(el.id, currentOrder++);
        }
      }

      // Band 4: In-flow Inline / Text descendants (DOM order)
      for (const el of inlines) {
        if (!visitedNodes.has(el.id)) {
          visitedNodes.add(el.id);
          renderOrderMap.set(el.id, currentOrder++);
        }
      }

      // Band 5: Positioned Auto / Zero elements (DOM order)
      for (const item of positionedZero) {
        if (item.isChildContext && stackingContexts.has(`sc_${item.el.id}`)) {
          traverseStackingContext(`sc_${item.el.id}`);
        } else if (!visitedNodes.has(item.el.id)) {
          visitedNodes.add(item.el.id);
          renderOrderMap.set(item.el.id, currentOrder++);
        }
      }

      // Band 6: Positive Z-index elements (sorted ascending by zIndex, DOM order tiebreaker)
      positiveZ.sort((a, b) => a.z - b.z);
      for (const item of positiveZ) {
        if (item.isChildContext && stackingContexts.has(`sc_${item.el.id}`)) {
          traverseStackingContext(`sc_${item.el.id}`);
        } else if (!visitedNodes.has(item.el.id)) {
          visitedNodes.add(item.el.id);
          renderOrderMap.set(item.el.id, currentOrder++);
        }
      }

      // Band 7: Fixed & Sticky Layers (sorted ascending by zIndex)
      fixedSticky.sort((a, b) => a.z - b.z);
      for (const item of fixedSticky) {
        if (item.isChildContext && stackingContexts.has(`sc_${item.el.id}`)) {
          traverseStackingContext(`sc_${item.el.id}`);
        } else if (!visitedNodes.has(item.el.id)) {
          visitedNodes.add(item.el.id);
          renderOrderMap.set(item.el.id, currentOrder++);
        }
      }

      // Band 8: Floating Overlays / Modals / Drawers (sorted ascending by zIndex)
      overlays.sort((a, b) => a.z - b.z);
      for (const item of overlays) {
        if (item.isChildContext && stackingContexts.has(`sc_${item.el.id}`)) {
          traverseStackingContext(`sc_${item.el.id}`);
        } else if (!visitedNodes.has(item.el.id)) {
          visitedNodes.add(item.el.id);
          renderOrderMap.set(item.el.id, currentOrder++);
        }
      }

      // Process any remaining child stacking contexts attached directly to this context
      for (const childScId of scInfo.childContextIds) {
        const childSc = stackingContexts.get(childScId);
        if (childSc && !visitedNodes.has(childSc.rootElementId)) {
          traverseStackingContext(childScId);
        }
      }
    };

    // Begin paint traversal from root stacking context
    traverseStackingContext(`sc_${rootElement.id}`);

    // Ensure any detached or unvisited nodes are assigned paint order
    for (const el of rawElements) {
      if (!visitedNodes.has(el.id)) {
        visitedNodes.add(el.id);
        renderOrderMap.set(el.id, currentOrder++);
      }
    }

    // 8. Construct Final RenderTreeNode Array
    let maxZ = 0;
    let minZ = 0;
    let fixedStickyCount = 0;
    let overlayCount = 0;

    const layerBreakdown = {
      backgroundCount: 0,
      negativeZCount: 0,
      blockCount: 0,
      floatCount: 0,
      inlineCount: 0,
      positionedZeroCount: 0,
      positiveZCount: 0,
      fixedStickyCount: 0,
      overlayCount: 0,
    };

    const renderTreeNodes: RenderTreeNode[] = rawElements.map((el) => {
      const createsSC = stackingContextCreationMap.get(el.id)?.creates || false;
      const scReasons = stackingContextCreationMap.get(el.id)?.reasons || [];
      const scId = enclosingContextMap.get(el.id) || `sc_${rootElement.id}`;
      const posAnc = positionedAncestorMap.get(el.id) || null;
      const clipAnc = clippingParentMap.get(el.id) || null;
      const zIndexVal = this.parseZIndex(el.zIndex);
      const paintLayer = paintLayerMap.get(el.id) || 'block';
      const order = renderOrderMap.get(el.id) || 1;

      if (typeof zIndexVal === 'number') {
        if (zIndexVal > maxZ) maxZ = zIndexVal;
        if (zIndexVal < minZ) minZ = zIndexVal;
      }

      if (paintLayer === 'fixed-sticky') fixedStickyCount++;
      if (paintLayer === 'overlay') overlayCount++;

      switch (paintLayer) {
        case 'background':
          layerBreakdown.backgroundCount++;
          break;
        case 'negative-z':
          layerBreakdown.negativeZCount++;
          break;
        case 'block':
          layerBreakdown.blockCount++;
          break;
        case 'float':
          layerBreakdown.floatCount++;
          break;
        case 'inline':
          layerBreakdown.inlineCount++;
          break;
        case 'positioned-zero':
          layerBreakdown.positionedZeroCount++;
          break;
        case 'positive-z':
          layerBreakdown.positiveZCount++;
          break;
        case 'fixed-sticky':
          layerBreakdown.fixedStickyCount++;
          break;
        case 'overlay':
          layerBreakdown.overlayCount++;
          break;
      }

      const compositingReason: string[] = [];
      if (createsSC) {
        compositingReason.push(...scReasons);
      }
      if (el.position === 'fixed') compositingReason.push('fixed-viewport-layer');
      if (el.position === 'sticky') compositingReason.push('sticky-scroll-layer');
      if (el.transform && el.transform !== 'none') compositingReason.push('css-transform-layer');
      if (el.opacity < 1) compositingReason.push('opacity-alpha-composite');
      if (el.boxShadow && el.boxShadow !== 'none') compositingReason.push('box-shadow-composite');

      const isClipping = (el.overflow?.x && el.overflow.x !== 'visible') || (el.overflow?.y && el.overflow.y !== 'visible');

      const browserEvidence: string[] = [
        `Computed position: ${el.position || 'static'}`,
        `Computed zIndex: ${el.zIndex || 'auto'}`,
        `Enclosing stacking context: ${scId}`,
        `Positioned ancestor: ${posAnc ? posAnc : 'none (in-flow document root)'}`,
        `Clipping parent: ${clipAnc ? `${clipAnc} (overflow: ${elMap.get(clipAnc)?.overflow?.x || 'hidden'})` : 'none (unclipped)'}`,
      ];

      if (createsSC) {
        browserEvidence.push(`Stacking context created: true (${scReasons.join('; ')})`);
      }
      if (el.opacity < 1) {
        browserEvidence.push(`Computed opacity: ${el.opacity}`);
      }
      if (el.transform && el.transform !== 'none') {
        browserEvidence.push(`Computed transform: ${el.transform}`);
      }
      if (el.isolation && el.isolation !== 'auto') {
        browserEvidence.push(`Computed isolation: ${el.isolation}`);
      }
      if (el.mixBlendMode && el.mixBlendMode !== 'normal') {
        browserEvidence.push(`Computed mixBlendMode: ${el.mixBlendMode}`);
      }
      if (el.filter && el.filter !== 'none') {
        browserEvidence.push(`Computed filter: ${el.filter}`);
      }
      if (el.willChange && el.willChange !== 'auto') {
        browserEvidence.push(`Computed willChange: ${el.willChange}`);
      }

      return {
        elementId: el.id,
        parentId: el.parentId,
        renderOrder: order,
        stackingContextId: scId,
        createsStackingContext: createsSC,
        positionedAncestor: posAnc,
        zIndex: zIndexVal,
        overflow: {
          x: el.overflow?.x || 'visible',
          y: el.overflow?.y || 'visible',
          isClipping: !!isClipping,
        },
        clippingParent: clipAnc,
        paintLayer,
        compositingReason: compositingReason.length > 0 ? compositingReason : undefined,
        browserEvidence,
      };
    });

    // 9. Construct Paint Order Sequence (sorted by renderOrder)
    const paintOrderSequence = [...renderTreeNodes]
      .sort((a, b) => a.renderOrder - b.renderOrder)
      .map((node) => {
        const el = elMap.get(node.elementId);
        return {
          renderOrder: node.renderOrder,
          elementId: node.elementId,
          tagName: el?.tagName || 'div',
          stackingContextId: node.stackingContextId,
          zIndex: node.zIndex,
          paintLayer: node.paintLayer,
          selector: el?.className ? `${el.tagName.toLowerCase()}.${el.className.split(' ')[0]}` : el?.tagName.toLowerCase(),
        };
      });

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/render-tree-v1.json',
      version: '1.0.0',
      target: {
        title: data.title || 'Web Application',
        url: data.pageUrl || '',
        viewport: {
          width: viewportWidth,
          height: viewportHeight,
          devicePixelRatio: dpr,
        },
      },
      summary: {
        totalNodes: renderTreeNodes.length,
        totalStackingContexts: stackingContexts.size,
        fixedStickyLayersCount: fixedStickyCount,
        overlayLayersCount: overlayCount,
        maxZIndex: maxZ,
        minZIndex: minZ,
      },
      stackingContextHierarchy: Array.from(stackingContexts.values()),
      renderTree: renderTreeNodes,
      paintOrderSequence,
      layerBreakdown,
      metadata: {
        generatedAt: new Date().toISOString(),
        extractorVersion: 'UI/UX Helper Rendering Order Engine 1.0.0',
        guidanceForAI: [
          'Stacking Context Isolation: Never render elements belonging to child stacking contexts above parent siblings unless their stacking context itself has a higher renderOrder.',
          'Positioned Ancestors: An absolute positioned element calculates its coordinate offsets (top, left, right, bottom) relative to its positionedAncestor.',
          'Clipping Boundaries: Elements whose clippingParent is defined are visually clipped if they extend beyond that ancestor bounding box.',
          'Paint Layer Hierarchy: Elements with higher renderOrder paint chronologically on top of lower renderOrder elements within overlapping bounding boxes.',
          'Sticky Headers & Overlays: Fixed and sticky navigation elements, mobile drawers, and modal backdrops create top-level stacking contexts and must be assigned corresponding z-index levels in CSS.',
        ],
      },
    };
  }

  /**
   * Detects whether an element creates a CSS stacking context according to W3C CSS specifications.
   */
  private detectStackingContextCreation(
    el: RawElementNode,
    elMap: Map<string, RawElementNode>,
    isRoot: boolean
  ): { creates: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // 1. Root element of document
    if (isRoot) {
      reasons.push('root-document-element');
    }

    // 2. Fixed or Sticky position (creates stacking context in all modern Blink/WebKit engines)
    if (el.position === 'fixed') {
      reasons.push('position-fixed');
    } else if (el.position === 'sticky') {
      reasons.push('position-sticky');
    }

    // 3. Absolute or Relative position with explicit z-index
    if ((el.position === 'absolute' || el.position === 'relative') && el.zIndex && el.zIndex !== 'auto') {
      reasons.push(`positioned-with-z-index-${el.zIndex}`);
    }

    // 4. Flex or Grid item with explicit z-index
    if (el.parentId && el.zIndex && el.zIndex !== 'auto') {
      const parent = elMap.get(el.parentId);
      if (parent) {
        const pDisp = parent.display || '';
        if (pDisp === 'flex' || pDisp === 'inline-flex' || pDisp === 'grid' || pDisp === 'inline-grid') {
          reasons.push(`flex-or-grid-child-with-z-index-${el.zIndex}`);
        }
      }
    }

    // 5. Opacity less than 1
    if (typeof el.opacity === 'number' && el.opacity < 1 && el.opacity >= 0) {
      reasons.push(`opacity-${el.opacity}`);
    }

    // 6. Transform other than none
    if (el.transform && el.transform !== 'none') {
      reasons.push('css-transform');
    }

    // 7. Filter other than none
    if (el.filter && el.filter !== 'none') {
      reasons.push('css-filter');
    }

    // 8. Isolation: isolate
    if (el.isolation === 'isolate') {
      reasons.push('isolation-isolate');
    }

    // 9. Mix-blend-mode other than normal
    if (el.mixBlendMode && el.mixBlendMode !== 'normal') {
      reasons.push(`mix-blend-mode-${el.mixBlendMode}`);
    }

    // 10. Containment (layout, paint, strict, content)
    if (el.contain && (el.contain.includes('paint') || el.contain.includes('layout') || el.contain.includes('strict') || el.contain.includes('content'))) {
      reasons.push(`contain-${el.contain}`);
    }

    // 11. Will-change on stacking properties
    if (el.willChange && (el.willChange.includes('transform') || el.willChange.includes('opacity') || el.willChange.includes('filter') || el.willChange.includes('z-index'))) {
      reasons.push(`will-change-${el.willChange}`);
    }

    // 12. Backdrop-filter other than none
    if (el.backdropFilter && el.backdropFilter !== 'none') {
      reasons.push('backdrop-filter');
    }

    // 13. Perspective other than none
    if (el.perspective && el.perspective !== 'none') {
      reasons.push('perspective');
    }

    // 14. Clip-path other than none
    if (el.clipPath && el.clipPath !== 'none') {
      reasons.push('clip-path');
    }

    return {
      creates: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Identifies the paint layer band for an element.
   */
  private determinePaintLayer(el: RawElementNode, rootId: string): PaintLayerBand {
    if (el.id === rootId) {
      return 'background';
    }

    if (this.isOverlayElement(el)) {
      return 'overlay';
    }

    if (el.position === 'fixed' || el.position === 'sticky') {
      return 'fixed-sticky';
    }

    const zIndexNum = typeof el.zIndex === 'string' && el.zIndex !== 'auto' ? parseInt(el.zIndex, 10) : NaN;

    if (!isNaN(zIndexNum) && zIndexNum < 0) {
      return 'negative-z';
    }

    if (!isNaN(zIndexNum) && zIndexNum > 0) {
      return 'positive-z';
    }

    if (el.position && el.position !== 'static' && (el.zIndex === 'auto' || zIndexNum === 0)) {
      return 'positioned-zero';
    }

    // Inline elements & text nodes
    const isInline =
      el.display === 'inline' ||
      el.display === 'inline-block' ||
      el.display === 'inline-flex' ||
      el.display === 'inline-grid' ||
      (el.textMeta?.hasText && (!el.childIds || el.childIds.length === 0));

    if (isInline) {
      return 'inline';
    }

    return 'block';
  }

  /**
   * Identifies modal overlays, drawers, tooltips, dialogs, and floating badges.
   */
  private isOverlayElement(el: RawElementNode): boolean {
    const role = (el.role || '').toLowerCase();
    const tag = el.tagName.toLowerCase();
    const cls = (el.className || '').toLowerCase();
    const id = el.id.toLowerCase();

    if (role === 'dialog' || role === 'alertdialog' || tag === 'dialog') {
      return true;
    }

    const isFloatingOrFixed = el.position === 'fixed' || el.position === 'absolute';
    const isHighZ = typeof el.zIndex === 'string' && el.zIndex !== 'auto' && parseInt(el.zIndex, 10) >= 50;

    const overlayKeywords = ['modal', 'drawer', 'overlay', 'backdrop', 'popup', 'toast', 'snackbar', 'sheet'];
    const hasOverlayKeyword = overlayKeywords.some((k) => cls.includes(k) || id.includes(k));

    return isFloatingOrFixed && (hasOverlayKeyword || isHighZ);
  }

  private parseZIndex(z: string | undefined): number | 'auto' {
    if (!z || z === 'auto') return 'auto';
    const parsed = parseInt(z, 10);
    return isNaN(parsed) ? 'auto' : parsed;
  }

  private buildEmptySpecification(
    data: AnalyzePageResponseData,
    width: number,
    height: number,
    dpr: number
  ): RenderTreeSpecification {
    return {
      $schema: 'https://ui-ux-helper.internal/schemas/render-tree-v1.json',
      version: '1.0.0',
      target: {
        title: data.title || 'Empty Document',
        url: data.pageUrl || '',
        viewport: { width, height, devicePixelRatio: dpr },
      },
      summary: {
        totalNodes: 0,
        totalStackingContexts: 0,
        fixedStickyLayersCount: 0,
        overlayLayersCount: 0,
        maxZIndex: 0,
        minZIndex: 0,
      },
      stackingContextHierarchy: [],
      renderTree: [],
      paintOrderSequence: [],
      layerBreakdown: {
        backgroundCount: 0,
        negativeZCount: 0,
        blockCount: 0,
        floatCount: 0,
        inlineCount: 0,
        positionedZeroCount: 0,
        positiveZCount: 0,
        fixedStickyCount: 0,
        overlayCount: 0,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        extractorVersion: 'UI/UX Helper Rendering Order Engine 1.0.0',
        guidanceForAI: [],
      },
    };
  }
}

export function buildRenderTree(data: AnalyzePageResponseData): RenderTreeSpecification {
  return new RenderingOrderEngine().normalize(data);
}
