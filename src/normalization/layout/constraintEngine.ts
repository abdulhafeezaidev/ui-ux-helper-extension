import {
  AnalyzePageResponseData,
  RawElementNode,
  ContainerConstraintDefinition,
  ContainerReferenceNode,
  ItemConstraintSpec,
  LayoutConstraintSpecification,
  BoxSpacing,
} from '../../types/index.ts';

export class ConstraintEngine {
  /**
   * Main entry point: normalizes page layout into relational, deduplicated constraint specification.
   */
  public normalize(data: AnalyzePageResponseData): LayoutConstraintSpecification {
    const rawElements = data.extractionResult?.elements || [];
    const viewport = data.extractionResult?.pageMeta?.viewport || data.layoutSystem?.viewport || { width: 1440, height: 900, devicePixelRatio: 1 };

    if (rawElements.length === 0) {
      return this.buildEmptySpecification(data);
    }

    const elementMap = new Map<string, RawElementNode>();
    const childrenMap = new Map<string, string[]>();

    for (const el of rawElements) {
      elementMap.set(el.id, el);
      if (el.parentId) {
        if (!childrenMap.has(el.parentId)) {
          childrenMap.set(el.parentId, []);
        }
        childrenMap.get(el.parentId)!.push(el.id);
      }
    }

    // 1. Identify Layout Containers
    const containerElements = rawElements.filter((el) => this.isLayoutContainer(el, childrenMap.get(el.id) || []));

    // 2. Build and Deduplicate Container Constraints
    const constraintRegistry: Record<string, ContainerConstraintDefinition> = {};
    const signatureToIdMap = new Map<string, string>();
    const elementToConstraintIdMap = new Map<string, string>();

    for (const el of containerElements) {
      const rawDef = this.extractContainerConstraint(el);
      const signature = this.computeConstraintSignature(rawDef);

      let constraintId = signatureToIdMap.get(signature);
      if (!constraintId) {
        constraintId = this.generateSemanticConstraintId(rawDef, Object.keys(constraintRegistry).length + 1);
        rawDef.id = constraintId;
        constraintRegistry[constraintId] = rawDef;
        signatureToIdMap.set(signature, constraintId);
      }

      elementToConstraintIdMap.set(el.id, constraintId);
    }

    // 3. Build Container Reference Hierarchy
    const containerIdMap = new Map<string, string>();
    containerElements.forEach((el, idx) => {
      const semName = (el.tagName || 'container').toLowerCase();
      const classId = el.className ? `_${el.className.split(' ')[0].replace(/[^a-zA-Z0-9_-]/g, '')}` : '';
      containerIdMap.set(el.id, `cnt_${idx + 1}_${semName}${classId}`);
    });

    const containers: ContainerReferenceNode[] = [];

    for (const el of containerElements) {
      const containerId = containerIdMap.get(el.id)!;
      const constraintRef = elementToConstraintIdMap.get(el.id)!;
      const constraint = constraintRegistry[constraintRef];

      // Find parent container
      let parentContainerId: string | null = null;
      let curr = el.parentId ? elementMap.get(el.parentId) : undefined;
      while (curr) {
        if (containerIdMap.has(curr.id)) {
          parentContainerId = containerIdMap.get(curr.id)!;
          break;
        }
        curr = curr.parentId ? elementMap.get(curr.parentId) : undefined;
      }

      // Find direct child containers
      const directChildContainerIds: string[] = [];
      const collectDirectChildContainers = (nodeId: string) => {
        const children = childrenMap.get(nodeId) || [];
        for (const childId of children) {
          if (containerIdMap.has(childId)) {
            directChildContainerIds.push(containerIdMap.get(childId)!);
          } else {
            collectDirectChildContainers(childId);
          }
        }
      };
      collectDirectChildContainers(el.id);

      const layoutModel = this.determineLayoutModel(constraint);
      const inferredPurpose = this.inferContainerPurpose(el, constraint);
      const reconstructionGuidance = this.generateReconstructionGuidance(el, constraint, layoutModel);

      containers.push({
        containerId,
        elementId: el.id,
        selector: this.buildSelector(el),
        tagName: el.tagName || 'div',
        semanticRole: el.role || el.tagName?.toLowerCase() || 'generic',
        constraintRef,
        parentContainerId,
        childContainerIds: directChildContainerIds,
        nestingDepth: this.computeDepth(el, elementMap),
        layoutModel,
        inferredPurpose,
        reconstructionGuidance,
      });
    }

    // 4. Extract Item Constraints (for children of flex and grid containers)
    const itemConstraints: ItemConstraintSpec[] = [];
    const containerIdSet = new Set(containerElements.map((c) => c.id));

    for (const el of rawElements) {
      if (!el.parentId || !containerIdSet.has(el.parentId)) continue;

      const parentEl = elementMap.get(el.parentId);
      if (!parentEl) continue;

      const parentConstraintRef = elementToConstraintIdMap.get(parentEl.id);
      const parentConstraint = parentConstraintRef ? constraintRegistry[parentConstraintRef] : undefined;

      if (parentConstraint && (parentConstraint.display.includes('flex') || parentConstraint.display.includes('grid'))) {
        const itemSpec = this.extractItemConstraint(el, containerIdMap.get(parentEl.id)!);
        if (itemSpec) {
          itemConstraints.push(itemSpec);
        }
      }
    }

    // 5. Compute Distribution & Metrics
    let flexCount = 0;
    let gridCount = 0;
    let blockCount = 0;
    let positionedCount = 0;

    for (const c of Object.values(constraintRegistry)) {
      if (c.display.includes('flex')) flexCount++;
      else if (c.display.includes('grid')) gridCount++;
      else if (c.positioning.position !== 'static') positionedCount++;
      else blockCount++;
    }

    const uniqueSignatures = Object.keys(constraintRegistry).length;
    const totalContainers = containers.length;
    const deduplicationRatio = totalContainers > 0
      ? parseFloat(((totalContainers - uniqueSignatures) / totalContainers).toFixed(2))
      : 0;

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/constraints-v1.json',
      version: '1.0.0',
      target: {
        title: data.title || 'Web Application',
        url: data.pageUrl || '',
        viewport: {
          width: viewport.width,
          height: viewport.height,
          devicePixelRatio: (viewport as any).devicePixelRatio || 1,
        },
      },
      summary: {
        totalContainers,
        uniqueConstraintSignatures: uniqueSignatures,
        deduplicationRatio,
        layoutModelDistribution: {
          flexCount,
          gridCount,
          blockCount,
          positionedCount,
        },
      },
      constraintRegistry,
      containers,
      itemConstraints,
      metadata: {
        generatedAt: new Date().toISOString(),
        extractorVersion: '1.0.0-constraint-engine',
        guidanceForAI: [
          'RECONSTRUCTION DIRECTIVE: Build layouts using Flexbox, CSS Grid, and Box Model constraints from 12_constraints.json.',
          'ZERO ABSOLUTE COORDINATES: Never use hardcoded pixel absolute positions (left: 452px, top: 120px) to place components.',
          'TAILWIND UTILITY MAPPING: Use the tailwindEquivalents array on each referenced constraint object as drop-in Tailwind classes.',
          'HIERARCHY: Follow container parentContainerId -> childContainerIds nesting to structure JSX trees.',
          'ITEM CONSTRAINTS: Check itemConstraints for grid-column spans, align-self, and flex-grow child overrides.'
        ],
      },
    };
  }

  /**
   * Determines whether an element serves as a layout container.
   */
  private isLayoutContainer(el: RawElementNode, childrenIds: string[]): boolean {
    const display = (el.display || el.layoutProps?.display || 'block').toLowerCase();
    const position = (el.position || el.layoutProps?.position || 'static').toLowerCase();

    if (display.includes('flex') || display.includes('grid')) {
      return true;
    }

    if (['fixed', 'sticky', 'absolute'].includes(position)) {
      return true;
    }

    const tag = (el.tagName || '').toLowerCase();
    if (['header', 'main', 'footer', 'nav', 'section', 'article', 'aside', 'form'].includes(tag)) {
      return true;
    }

    if (childrenIds.length >= 2) {
      return true;
    }

    if (el.padding && (el.padding.top !== '0px' || el.padding.left !== '0px')) {
      return true;
    }

    if (el.margin && (el.margin.left === 'auto' || el.margin.right === 'auto')) {
      return true;
    }

    return false;
  }

  /**
   * Extracts layout constraint parameters from a raw element node.
   */
  private extractContainerConstraint(el: RawElementNode): ContainerConstraintDefinition {
    const layout = el.layoutProps || {};
    const display = (layout.display || el.display || 'block').toLowerCase();
    const position = (layout.position || el.position || 'static').toLowerCase();

    // Flex properties
    let flex: ContainerConstraintDefinition['flex'] | undefined;
    if (display.includes('flex')) {
      flex = {
        direction: layout.flexDirection || 'row',
        wrap: layout.flexWrap || 'nowrap',
        justifyContent: layout.justifyContent || 'flex-start',
        alignItems: layout.alignItems || 'stretch',
        alignContent: layout.alignContent || 'normal',
      };
    }

    // Grid properties
    let grid: ContainerConstraintDefinition['grid'] | undefined;
    if (display.includes('grid')) {
      grid = {
        templateColumns: layout.gridTemplateColumns || 'none',
        templateRows: layout.gridTemplateRows || 'none',
        autoFlow: layout.gridAutoFlow || 'row',
        autoColumns: layout.gridAutoColumns || 'auto',
        autoRows: layout.gridAutoRows || 'auto',
        placeItems: layout.placeItems || 'normal',
        placeContent: layout.placeContent || 'normal',
      };
    }

    // Gap properties
    const rowGap = layout.gap?.row || el.gap?.row || '0px';
    const colGap = layout.gap?.column || el.gap?.column || '0px';
    const rawGap = rowGap === colGap ? rowGap : `${rowGap} ${colGap}`;
    const gap = {
      row: rowGap,
      column: colGap,
      raw: rawGap,
    };

    // Dimensions
    const constraints = el.constraints || {};
    const dimensions = {
      minWidth: constraints.minWidth || '0px',
      maxWidth: constraints.maxWidth || 'none',
      minHeight: constraints.minHeight || 'auto',
      maxHeight: constraints.maxHeight || 'none',
      aspectRatio: constraints.aspectRatio || 'auto',
    };

    // Box model
    const padding: BoxSpacing = el.padding || { top: '0px', right: '0px', bottom: '0px', left: '0px', raw: '0px' };
    const margin: BoxSpacing = el.margin || { top: '0px', right: '0px', bottom: '0px', left: '0px', raw: '0px' };
    const overflowX = layout.overflow?.x || el.overflow?.x || 'visible';
    const overflowY = layout.overflow?.y || el.overflow?.y || 'visible';
    const isClipping = ['hidden', 'clip', 'scroll', 'auto'].includes(overflowX) || ['hidden', 'clip', 'scroll', 'auto'].includes(overflowY);

    const box = {
      padding,
      margin,
      overflow: {
        x: overflowX,
        y: overflowY,
        isClipping,
      },
    };

    // Positioning and Insets
    const inset = layout.inset || {
      top: position !== 'static' ? (el as any).top || 'auto' : 'auto',
      right: position !== 'static' ? (el as any).right || 'auto' : 'auto',
      bottom: position !== 'static' ? (el as any).bottom || 'auto' : 'auto',
      left: position !== 'static' ? (el as any).left || 'auto' : 'auto',
    };

    const positioning = {
      position,
      inset: {
        top: inset.top || 'auto',
        right: inset.right || 'auto',
        bottom: inset.bottom || 'auto',
        left: inset.left || 'auto',
      },
    };

    // Generate Tailwind equivalents
    const tailwindEquivalents = this.generateTailwindEquivalents({
      display,
      flex,
      grid,
      gap,
      dimensions,
      box,
      positioning,
    });

    return {
      id: '', // Will be assigned during deduplication
      display,
      flex,
      grid,
      gap,
      dimensions,
      box,
      positioning,
      tailwindEquivalents,
    };
  }

  /**
   * Generates a deterministic signature string for deduplication.
   */
  private computeConstraintSignature(def: ContainerConstraintDefinition): string {
    const parts = [
      `d:${def.display}`,
      `pos:${def.positioning.position}`,
      `gap:${def.gap.raw}`,
      `pad:${def.box.padding.top}_${def.box.padding.right}_${def.box.padding.bottom}_${def.box.padding.left}`,
      `mar:${def.box.margin.top}_${def.box.margin.right}_${def.box.margin.bottom}_${def.box.margin.left}`,
      `of:${def.box.overflow.x}_${def.box.overflow.y}`,
      `dim:${def.dimensions.maxWidth}_${def.dimensions.minWidth}_${def.dimensions.aspectRatio}`,
    ];

    if (def.flex) {
      parts.push(`flx:${def.flex.direction}_${def.flex.wrap}_${def.flex.justifyContent}_${def.flex.alignItems}`);
    }

    if (def.grid) {
      parts.push(`grd:${def.grid.templateColumns}_${def.grid.templateRows}_${def.grid.autoFlow}_${def.grid.placeItems}`);
    }

    if (def.positioning.position !== 'static') {
      parts.push(`ins:${def.positioning.inset.top}_${def.positioning.inset.right}_${def.positioning.inset.bottom}_${def.positioning.inset.left}`);
    }

    return parts.join('|');
  }

  /**
   * Generates a readable semantic constraint ID.
   */
  private generateSemanticConstraintId(def: ContainerConstraintDefinition, sequence: number): string {
    const prefix = 'const';
    let typeTag = 'block';

    if (def.display.includes('flex')) {
      const dir = def.flex?.direction === 'column' ? 'col' : 'row';
      const just = def.flex?.justifyContent?.replace('space-', '')?.replace('flex-', '') || 'start';
      typeTag = `flex_${dir}_${just}`;
    } else if (def.display.includes('grid')) {
      const cols = def.grid?.templateColumns?.includes('repeat') ? 'repeat' : 'grid';
      typeTag = `grid_${cols}`;
    } else if (def.positioning.position === 'sticky') {
      typeTag = 'sticky';
    } else if (def.positioning.position === 'fixed') {
      typeTag = 'fixed';
    }

    return `${prefix}_${sequence}_${typeTag}`;
  }

  /**
   * Maps constraint properties into idiomatic Tailwind CSS utility classes.
   */
  private generateTailwindEquivalents(spec: {
    display: string;
    flex?: ContainerConstraintDefinition['flex'];
    grid?: ContainerConstraintDefinition['grid'];
    gap: ContainerConstraintDefinition['gap'];
    dimensions: ContainerConstraintDefinition['dimensions'];
    box: ContainerConstraintDefinition['box'];
    positioning: ContainerConstraintDefinition['positioning'];
  }): string[] {
    const classes: string[] = [];

    // Display
    if (spec.display === 'flex') classes.push('flex');
    else if (spec.display === 'inline-flex') classes.push('inline-flex');
    else if (spec.display === 'grid') classes.push('grid');
    else if (spec.display === 'inline-grid') classes.push('inline-grid');
    else if (spec.display === 'block') classes.push('block');
    else if (spec.display === 'inline-block') classes.push('inline-block');

    // Flex
    if (spec.flex) {
      if (spec.flex.direction === 'column') classes.push('flex-col');
      else if (spec.flex.direction === 'column-reverse') classes.push('flex-col-reverse');
      else if (spec.flex.direction === 'row-reverse') classes.push('flex-row-reverse');
      else classes.push('flex-row');

      if (spec.flex.wrap === 'wrap') classes.push('flex-wrap');
      else if (spec.flex.wrap === 'wrap-reverse') classes.push('flex-wrap-reverse');

      // Justify Content
      const jc = spec.flex.justifyContent;
      if (jc === 'space-between' || jc === 'between') classes.push('justify-between');
      else if (jc === 'center') classes.push('justify-center');
      else if (jc === 'space-around') classes.push('justify-around');
      else if (jc === 'space-evenly') classes.push('justify-evenly');
      else if (jc === 'flex-end' || jc === 'end') classes.push('justify-end');
      else if (jc === 'flex-start' || jc === 'start') classes.push('justify-start');

      // Align Items
      const ai = spec.flex.alignItems;
      if (ai === 'center') classes.push('items-center');
      else if (ai === 'flex-start' || ai === 'start') classes.push('items-start');
      else if (ai === 'flex-end' || ai === 'end') classes.push('items-end');
      else if (ai === 'baseline') classes.push('items-baseline');
      else if (ai === 'stretch') classes.push('items-stretch');
    }

    // Grid
    if (spec.grid) {
      if (spec.grid.autoFlow === 'column') classes.push('grid-flow-col');
      if (spec.grid.placeItems === 'center') classes.push('place-items-center');

      // Match common repeat patterns
      const cols = spec.grid.templateColumns;
      if (cols.includes('repeat(1,')) classes.push('grid-cols-1');
      else if (cols.includes('repeat(2,')) classes.push('grid-cols-2');
      else if (cols.includes('repeat(3,')) classes.push('grid-cols-3');
      else if (cols.includes('repeat(4,')) classes.push('grid-cols-4');
      else if (cols.includes('repeat(6,')) classes.push('grid-cols-6');
      else if (cols.includes('repeat(12,')) classes.push('grid-cols-12');
    }

    // Gap
    if (spec.gap.raw !== '0px' && spec.gap.raw !== '0px 0px') {
      const colPx = parseInt(spec.gap.column, 10);
      const rowPx = parseInt(spec.gap.row, 10);

      if (!isNaN(colPx) && colPx === rowPx && colPx > 0) {
        const twGap = this.pxToTailwindSpacing(colPx);
        if (twGap) classes.push(`gap-${twGap}`);
      } else {
        if (!isNaN(colPx) && colPx > 0) {
          const twGapX = this.pxToTailwindSpacing(colPx);
          if (twGapX) classes.push(`gap-x-${twGapX}`);
        }
        if (!isNaN(rowPx) && rowPx > 0) {
          const twGapY = this.pxToTailwindSpacing(rowPx);
          if (twGapY) classes.push(`gap-y-${twGapY}`);
        }
      }
    }

    // Dimensions
    if (spec.dimensions.maxWidth && spec.dimensions.maxWidth !== 'none') {
      const maxW = parseInt(spec.dimensions.maxWidth, 10);
      if (maxW >= 1200 && maxW <= 1280) classes.push('max-w-7xl');
      else if (maxW >= 1000 && maxW < 1200) classes.push('max-w-6xl');
      else if (maxW >= 700 && maxW < 1000) classes.push('max-w-4xl');
      else if (maxW >= 500 && maxW < 700) classes.push('max-w-2xl');
      else if (maxW > 0) classes.push(`max-w-[${spec.dimensions.maxWidth}]`);
    }

    // Margin Auto
    if (spec.box.margin.left === 'auto' && spec.box.margin.right === 'auto') {
      classes.push('mx-auto');
    }

    // Padding
    const pTop = parseInt(spec.box.padding.top, 10) || 0;
    const pRight = parseInt(spec.box.padding.right, 10) || 0;
    const pBottom = parseInt(spec.box.padding.bottom, 10) || 0;
    const pLeft = parseInt(spec.box.padding.left, 10) || 0;

    if (pTop > 0 && pTop === pRight && pTop === pBottom && pTop === pLeft) {
      const pClass = this.pxToTailwindSpacing(pTop);
      if (pClass) classes.push(`p-${pClass}`);
    } else {
      if (pTop === pBottom && pTop > 0) {
        const py = this.pxToTailwindSpacing(pTop);
        if (py) classes.push(`py-${py}`);
      }
      if (pLeft === pRight && pLeft > 0) {
        const px = this.pxToTailwindSpacing(pLeft);
        if (px) classes.push(`px-${px}`);
      }
    }

    // Positioning
    if (spec.positioning.position === 'sticky') {
      classes.push('sticky');
      if (spec.positioning.inset.top === '0px') classes.push('top-0');
    } else if (spec.positioning.position === 'fixed') {
      classes.push('fixed');
      if (spec.positioning.inset.top === '0px' && spec.positioning.inset.left === '0px') classes.push('top-0', 'left-0');
    } else if (spec.positioning.position === 'relative') {
      classes.push('relative');
    } else if (spec.positioning.position === 'absolute') {
      classes.push('absolute');
    }

    // Overflow
    if (spec.box.overflow.isClipping) {
      classes.push('overflow-hidden');
    }

    return classes;
  }

  /**
   * Helper: maps pixel values to nearest standard Tailwind spacing token.
   */
  private pxToTailwindSpacing(px: number): string | null {
    const spacingMap: [number, string][] = [
      [0, '0'],
      [4, '1'],
      [8, '2'],
      [12, '3'],
      [16, '4'],
      [20, '5'],
      [24, '6'],
      [32, '8'],
      [40, '10'],
      [48, '12'],
      [64, '16'],
      [80, '20'],
      [96, '24'],
    ];

    for (const [val, cls] of spacingMap) {
      if (Math.abs(px - val) <= 2) return cls;
    }
    return `[${px}px]`;
  }

  /**
   * Extracts item-level constraints for children of flex/grid containers.
   */
  private extractItemConstraint(el: RawElementNode, parentContainerId: string): ItemConstraintSpec | null {
    const constraints = el.constraints || {};
    const layout = el.layoutProps || {};

    const flexGrow = constraints.flexGrow || (el as any).flexGrow;
    const flexShrink = constraints.flexShrink || (el as any).flexShrink;
    const flexBasis = constraints.flexBasis || (el as any).flexBasis;
    const alignSelf = constraints.alignSelf || layout.alignSelf;
    const justifySelf = constraints.justifySelf || layout.justifySelf;
    const gridColumn = (el as any).gridColumn || (el as any).gridColumnStart ? `${(el as any).gridColumnStart} / span ${(el as any).gridColumnEnd || 1}` : undefined;
    const gridRow = (el as any).gridRow;
    const order = typeof (el as any).order === 'number' ? (el as any).order : undefined;

    const tailwindClasses: string[] = [];
    if (flexGrow === '1') tailwindClasses.push('flex-1');
    if (flexShrink === '0') tailwindClasses.push('shrink-0');
    if (alignSelf === 'center') tailwindClasses.push('self-center');
    if (alignSelf === 'flex-start' || alignSelf === 'start') tailwindClasses.push('self-start');
    if (alignSelf === 'flex-end' || alignSelf === 'end') tailwindClasses.push('self-end');
    if (gridColumn?.includes('span 2')) tailwindClasses.push('col-span-2');
    if (gridColumn?.includes('span 3')) tailwindClasses.push('col-span-3');
    if (gridColumn?.includes('span 4')) tailwindClasses.push('col-span-4');
    if (gridColumn?.includes('span full') || gridColumn?.includes('1 / -1')) tailwindClasses.push('col-span-full');

    const hasOverrides = Boolean(flexGrow || flexShrink || alignSelf || justifySelf || gridColumn || gridRow || order !== undefined || tailwindClasses.length > 0);

    if (!hasOverrides) return null;

    return {
      elementId: el.id,
      parentContainerId,
      flexGrow,
      flexShrink,
      flexBasis,
      alignSelf,
      justifySelf,
      gridColumn,
      gridRow,
      order,
      tailwindClasses,
    };
  }

  /**
   * Infers layout model category from constraint definition.
   */
  private determineLayoutModel(c: ContainerConstraintDefinition): ContainerReferenceNode['layoutModel'] {
    if (c.display.includes('flex')) return 'flex';
    if (c.display.includes('grid')) return 'grid';
    if (c.positioning.position === 'sticky') return 'sticky';
    if (c.positioning.position === 'fixed') return 'fixed';
    if (c.positioning.position === 'absolute') return 'absolute';
    if (c.display === 'block') return 'block';
    return 'flow';
  }

  /**
   * Infers the semantic UI purpose of a layout container.
   */
  private inferContainerPurpose(el: RawElementNode, c: ContainerConstraintDefinition): string {
    const tag = (el.tagName || '').toLowerCase();
    const cls = (el.className || '').toLowerCase();

    if (tag === 'header' || cls.includes('header')) return 'site-header-navigation-bar';
    if (tag === 'footer' || cls.includes('footer')) return 'site-footer-content-grid';
    if (tag === 'nav' || cls.includes('nav')) return 'navigation-menu-bar';
    if (cls.includes('hero')) return 'hero-banner-layout';
    if (cls.includes('grid') || c.display.includes('grid')) return 'responsive-content-grid';
    if (cls.includes('card') || cls.includes('product')) return 'card-container-box';
    if (cls.includes('modal') || cls.includes('dialog')) return 'modal-dialog-backdrop';
    if (cls.includes('drawer') || cls.includes('sidebar')) return 'sidebar-drawer-column';
    if (c.dimensions.maxWidth !== 'none' && c.box.margin.left === 'auto') return 'max-width-page-wrapper';

    return `${c.display}-container`;
  }

  /**
   * Generates concise, actionable guidance for an AI reconstruction agent.
   */
  private generateReconstructionGuidance(
    _el: RawElementNode,
    c: ContainerConstraintDefinition,
    model: ContainerReferenceNode['layoutModel']
  ): string {
    const tw = c.tailwindEquivalents.join(' ');

    if (model === 'flex') {
      return `Use Flexbox container (<div className="${tw}">). Do NOT use absolute positioning.`;
    }
    if (model === 'grid') {
      return `Use CSS Grid container (<div className="${tw}">). Child items should align to grid tracks.`;
    }
    if (model === 'sticky') {
      return `Use sticky positioning (<header className="${tw}">). Stays fixed at top on scroll.`;
    }
    if (model === 'fixed') {
      return `Use fixed positioning (<div className="${tw}">) with inset anchoring.`;
    }

    return `Standard block wrapper (<div className="${tw}">).`;
  }

  /**
   * Computes the nesting depth of an element by traversing ancestors.
   */
  private computeDepth(el: RawElementNode, map: Map<string, RawElementNode>): number {
    let depth = 1;
    let curr = el.parentId ? map.get(el.parentId) : undefined;
    while (curr) {
      depth++;
      curr = curr.parentId ? map.get(curr.parentId) : undefined;
    }
    return depth;
  }

  /**
   * Builds a human-readable CSS selector for an element.
   */
  private buildSelector(el: RawElementNode): string {
    const tag = el.tagName?.toLowerCase() || 'div';
    if (el.id && !el.id.startsWith('el_')) return `${tag}#${el.id}`;
    if (el.className) {
      const firstClass = el.className.trim().split(/\s+/)[0];
      if (firstClass) return `${tag}.${firstClass}`;
    }
    return tag;
  }

  /**
   * Empty specification fallback.
   */
  private buildEmptySpecification(data: AnalyzePageResponseData): LayoutConstraintSpecification {
    return {
      $schema: 'https://ui-ux-helper.internal/schemas/constraints-v1.json',
      version: '1.0.0',
      target: {
        title: data.title || 'Web Application',
        url: data.pageUrl || '',
        viewport: { width: 1440, height: 900, devicePixelRatio: 1 },
      },
      summary: {
        totalContainers: 0,
        uniqueConstraintSignatures: 0,
        deduplicationRatio: 0,
        layoutModelDistribution: {
          flexCount: 0,
          gridCount: 0,
          blockCount: 0,
          positionedCount: 0,
        },
      },
      constraintRegistry: {},
      containers: [],
      itemConstraints: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        extractorVersion: '1.0.0-constraint-engine',
        guidanceForAI: ['Empty page DOM'],
      },
    };
  }
}

/**
 * Functional export for quick access.
 */
export function buildLayoutConstraintSpecification(data: AnalyzePageResponseData): LayoutConstraintSpecification {
  return new ConstraintEngine().normalize(data);
}
