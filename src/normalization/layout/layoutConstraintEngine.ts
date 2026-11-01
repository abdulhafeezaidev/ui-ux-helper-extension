import {
  AnalyzePageResponseData,
  RawElementNode,
} from '../../types/index.ts';

export type LayoutModelType =
  | 'grid'
  | 'flex'
  | 'block'
  | 'absolute'
  | 'sticky'
  | 'fixed'
  | 'inline-block'
  | 'inline-flex'
  | 'inline-grid';

export interface LayoutGapSpec {
  row: string;
  column: string;
  value: string;
}

export interface LayoutBoxSpacingSpec {
  top: string;
  right: string;
  bottom: string;
  left: string;
  raw: string;
}

export interface LayoutContainerConstraintsSpec {
  isCentered: boolean;
  isFullWidth: boolean;
  isFluid: boolean;
  aspectRatio?: number;
  overflowX: string;
  overflowY: string;
  zIndex?: number;
}

export interface LayoutWrappingSpec {
  flexWrap: 'wrap' | 'nowrap' | 'wrap-reverse';
  isWrapped: boolean;
}

export interface LayoutAlignmentSpec {
  justifyContent: string;
  alignItems: string;
  flexDirection: string;
  textAlignment?: string;
  alignSelf?: string;
  justifySelf?: string;
}

export interface LayoutNestingSpec {
  parentContainerId: string | null;
  childContainerIds: string[];
  depth: number;
  childCount: number;
  layoutRelationship:
    | 'root-viewport'
    | 'grid-cell'
    | 'flex-item'
    | 'block-flow'
    | 'positioned-overlay'
    | 'nested-container';
}

export interface LayoutContainerDefinition {
  id: string;
  elementId: string;
  selector: string;
  tagName: string;
  display: string;
  position: 'static' | 'relative' | 'absolute' | 'sticky' | 'fixed';
  layoutType: LayoutModelType;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gap: LayoutGapSpec;
  justifyContent: string;
  alignItems: string;
  flexDirection: string;
  padding: LayoutBoxSpacingSpec;
  margin: LayoutBoxSpacingSpec;
  width: string;
  minWidth: string;
  maxWidth: string;
  height: string;
  minHeight: string;
  maxHeight: string;
  containerConstraints: LayoutContainerConstraintsSpec;
  wrapping: LayoutWrappingSpec;
  alignment: LayoutAlignmentSpec;
  nesting: LayoutNestingSpec;
  positionOffsets?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  provenance: 'browser-derived' | 'computed' | 'algorithmically-inferred';
  evidence: string[];
}

export interface LayoutConstraintSystem {
  $schema: string;
  version: string;
  viewport: {
    width: number;
    height: number;
    documentHeight: number;
    devicePixelRatio: number;
  };
  totalContainers: number;
  summary: {
    gridContainers: number;
    flexContainers: number;
    blockContainers: number;
    absoluteElements: number;
    stickyElements: number;
    fixedElements: number;
  };
  containers: LayoutContainerDefinition[];
  responsiveBreakpoints: {
    breakpoint: 'desktop' | 'tablet' | 'mobile' | 'wide';
    minWidthPx: number;
    maxWidthPx: number | null;
    containerWidth: string;
    gridColumns: { default: number; featureGrid?: number; productGrid?: number };
    navigationStyle: string;
  }[];
  spacingScale: { valuePx: number; name: string; frequency: number }[];
  metadata: {
    generatedAt: string;
    pageTitle?: string;
    pageUrl?: string;
  };
}

/**
 * Classifies layout model type directly from computed CSS properties without relying on pixel inference.
 */
export function classifyLayoutType(
  display: string,
  position: string
): LayoutModelType {
  const normPos = (position || 'static').toLowerCase();
  const normDisp = (display || 'block').toLowerCase();

  if (normPos === 'fixed') return 'fixed';
  if (normPos === 'sticky') return 'sticky';
  if (normPos === 'absolute') return 'absolute';

  if (normDisp === 'grid' || normDisp === 'inline-grid') return 'grid';
  if (normDisp === 'flex' || normDisp === 'inline-flex') return 'flex';
  if (normDisp === 'inline-block') return 'inline-block';

  return 'block';
}

/**
 * Derives normalized gap specification from computed styles and layout properties.
 */
function extractGapSpec(el: RawElementNode): LayoutGapSpec {
  const rowGap = el.gap?.row || (el.layoutProps as any)?.rowGap || '0px';
  const colGap = el.gap?.column || (el.layoutProps as any)?.columnGap || '0px';
  const combined = rowGap === colGap ? rowGap : `${rowGap} ${colGap}`;

  return {
    row: rowGap,
    column: colGap,
    value: combined,
  };
}

/**
 * Derives normalized box spacing specification (padding/margin) from computed styles.
 */
function extractBoxSpacing(spacing: { top: string; right: string; bottom: string; left: string } | undefined): LayoutBoxSpacingSpec {
  const top = spacing?.top || '0px';
  const right = spacing?.right || '0px';
  const bottom = spacing?.bottom || '0px';
  const left = spacing?.left || '0px';
  const raw = `${top} ${right} ${bottom} ${left}`;

  return { top, right, bottom, left, raw };
}

/**
 * Builds the Layout Constraint System by extracting rich CSS layout specifications for every container.
 */
export function buildLayoutConstraintSystem(data: AnalyzePageResponseData): LayoutConstraintSystem {
  const elements = data.extractionResult?.elements || [];
  const elMap = new Map<string, RawElementNode>(elements.map((e) => [e.id, e]));
  const viewportWidth = data.extractionResult?.pageMeta?.viewport?.width || data.layoutSystem?.viewport?.width || 1440;
  const viewportHeight = data.extractionResult?.pageMeta?.viewport?.height || data.layoutSystem?.viewport?.height || 900;
  const documentHeight = data.layoutSystem?.viewport?.documentHeight || (elements.length > 0 ? Math.max(...elements.map((e) => (e.boundingRect?.y || 0) + (e.boundingRect?.height || 0)), viewportHeight) : viewportHeight);

  // Compute nesting depth map
  const depthMap = new Map<string, number>();
  const parentMap = new Map<string, string>();

  elements.forEach((el) => {
    if (Array.isArray(el.childIds)) {
      el.childIds.forEach((childId) => {
        parentMap.set(childId, el.id);
      });
    }
  });

  function getDepth(id: string): number {
    if (depthMap.has(id)) return depthMap.get(id)!;
    const parentId = parentMap.get(id);
    const parentEl = parentId ? elMap.get(parentId) : undefined;
    if (!parentId || !parentEl || parentEl.tagName.toLowerCase() === 'body' || parentEl.tagName.toLowerCase() === 'html') {
      depthMap.set(id, 0);
      return 0;
    }
    const depth = getDepth(parentId) + 1;
    depthMap.set(id, depth);
    return depth;
  }

  // Filter meaningful layout containers and positioned elements
  const containerCandidates = elements.filter((el) => {
    const disp = (el.display || el.layoutProps?.display || '').toLowerCase();
    const pos = (el.position || (el as any).layoutProps?.position || '').toLowerCase();
    const isContainerTag = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer', 'div', 'ul', 'ol', 'form'].includes(el.tagName.toLowerCase());

    const isLayoutContainer =
      disp === 'flex' ||
      disp === 'inline-flex' ||
      disp === 'grid' ||
      disp === 'inline-grid' ||
      ['absolute', 'sticky', 'fixed'].includes(pos) ||
      (isContainerTag && el.childIds && el.childIds.length > 0) ||
      (el.boundingRect && el.boundingRect.width > 200 && el.boundingRect.height > 40);

    return isLayoutContainer;
  });

  const containers: LayoutContainerDefinition[] = containerCandidates.map((el, idx) => {
    const display = (el.display || el.layoutProps?.display || 'block').toLowerCase();
    const position = (el.position || 'static').toLowerCase() as any;
    const layoutType = classifyLayoutType(display, position);

    const gap = extractGapSpec(el);
    const padding = extractBoxSpacing(el.padding);
    const margin = extractBoxSpacing(el.margin);

    const flexDirection = el.layoutProps?.flexDirection || 'row';
    const flexWrap = (el.layoutProps?.flexWrap || 'nowrap') as 'wrap' | 'nowrap' | 'wrap-reverse';
    const justifyContent = el.layoutProps?.justifyContent || 'flex-start';
    const alignItems = el.layoutProps?.alignItems || 'stretch';

    const gridTemplateColumns = el.layoutProps?.gridTemplateColumns && el.layoutProps.gridTemplateColumns !== 'none'
      ? el.layoutProps.gridTemplateColumns
      : (layoutType === 'grid' ? `repeat(auto-fit, minmax(280px, 1fr))` : undefined);

    const gridTemplateRows = el.layoutProps?.gridTemplateRows && el.layoutProps.gridTemplateRows !== 'none'
      ? el.layoutProps.gridTemplateRows
      : (layoutType === 'grid' ? 'auto' : undefined);

    const width = `${el.boundingRect.width}px`;
    const height = `${el.boundingRect.height}px`;
    const maxWidth = (el.constraints?.maxWidth && el.constraints.maxWidth !== 'none')
      ? el.constraints.maxWidth
      : (el.boundingRect.width >= viewportWidth * 0.9 ? '100%' : `${el.boundingRect.width}px`);
    const minWidth = el.constraints?.minWidth || '0px';

    const minHeight = el.constraints?.minHeight || '0px';
    const maxHeight = el.constraints?.maxHeight || 'none';

    const isFullWidth = el.boundingRect.width >= viewportWidth * 0.95;
    const isCentered = (margin.left === 'auto' && margin.right === 'auto') ||
      (Math.abs((viewportWidth - el.boundingRect.width) / 2 - el.boundingRect.x) < 20 && !isFullWidth);
    const isFluid = isFullWidth || maxWidth.includes('%');

    const parentId = parentMap.get(el.id) || null;
    const parentEl = parentId ? elMap.get(parentId) : undefined;
    const parentDisplay = parentEl ? (parentEl.display || parentEl.layoutProps?.display || '').toLowerCase() : '';

    let layoutRelationship: LayoutNestingSpec['layoutRelationship'] = 'block-flow';
    if (!parentId || !parentEl || parentEl.tagName.toLowerCase() === 'body' || parentEl.tagName.toLowerCase() === 'html') {
      layoutRelationship = 'root-viewport';
    } else if (['absolute', 'fixed', 'sticky'].includes(position)) {
      layoutRelationship = 'positioned-overlay';
    } else if (parentDisplay.includes('grid')) {
      layoutRelationship = 'grid-cell';
    } else if (parentDisplay.includes('flex')) {
      layoutRelationship = 'flex-item';
    } else if ((el.childIds?.length || 0) > 0) {
      layoutRelationship = 'nested-container';
    }

    const evidence: string[] = [
      `Computed display: ${display}`,
      `Computed position: ${position}`,
      `Bounding dimension: ${el.boundingRect.width}px × ${el.boundingRect.height}px`,
    ];
    if (layoutType === 'grid') evidence.push(`Grid columns: ${gridTemplateColumns}`);
    if (layoutType === 'flex') evidence.push(`Flex direction: ${flexDirection}, wrap: ${flexWrap}, justify: ${justifyContent}, align: ${alignItems}`);
    if (isCentered) evidence.push('Centered container with symmetric margin offsets');

    const rawZ = (el as any).zIndex || (el.layoutProps as any)?.zIndex;
    const zIndexNum = rawZ && !isNaN(Number(rawZ)) ? Number(rawZ) : undefined;

    const containerDef: LayoutContainerDefinition = {
      id: `layout_c_${idx + 1}`,
      elementId: el.id,
      selector: el.className ? `${el.tagName.toLowerCase()}.${el.className.split(' ').filter(Boolean).join('.')}` : el.tagName.toLowerCase(),
      tagName: el.tagName.toLowerCase(),
      display,
      position,
      layoutType,
      gridTemplateColumns,
      gridTemplateRows,
      gap,
      justifyContent,
      alignItems,
      flexDirection,
      padding,
      margin,
      width,
      minWidth,
      maxWidth,
      height,
      minHeight,
      maxHeight,
      containerConstraints: {
        isCentered,
        isFullWidth,
        isFluid,
        aspectRatio: el.boundingRect.height > 0 ? Number((el.boundingRect.width / el.boundingRect.height).toFixed(2)) : 1.0,
        overflowX: el.overflow?.x || 'visible',
        overflowY: el.overflow?.y || 'visible',
        zIndex: zIndexNum,
      },
      wrapping: {
        flexWrap,
        isWrapped: flexWrap === 'wrap' || flexWrap === 'wrap-reverse',
      },
      alignment: {
        justifyContent,
        alignItems,
        flexDirection,
        textAlignment: el.typography?.textAlign || (el as any).textAlign || 'left',
      },
      nesting: {
        parentContainerId: parentId,
        childContainerIds: el.childIds || [],
        depth: getDepth(el.id),
        childCount: (el.childIds || []).length,
        layoutRelationship,
      },
      positionOffsets: ['absolute', 'fixed', 'sticky'].includes(position)
        ? {
            top: `${el.boundingRect.y}px`,
            bottom: `${Math.max(0, viewportHeight - (el.boundingRect.y + el.boundingRect.height))}px`,
            left: `${el.boundingRect.x}px`,
            right: `${Math.max(0, viewportWidth - (el.boundingRect.x + el.boundingRect.width))}px`,
          }
        : undefined,
      boundingRect: {
        x: el.boundingRect.x,
        y: el.boundingRect.y,
        width: el.boundingRect.width,
        height: el.boundingRect.height,
      },
      confidence: 0.95,
      provenance: 'computed',
      evidence,
    };

    return containerDef;
  });

  const summary = {
    gridContainers: containers.filter((c) => c.layoutType === 'grid').length,
    flexContainers: containers.filter((c) => c.layoutType === 'flex').length,
    blockContainers: containers.filter((c) => c.layoutType === 'block').length,
    absoluteElements: containers.filter((c) => c.layoutType === 'absolute').length,
    stickyElements: containers.filter((c) => c.layoutType === 'sticky').length,
    fixedElements: containers.filter((c) => c.layoutType === 'fixed').length,
  };

  const responsiveBreakpoints = [
    {
      breakpoint: 'desktop' as const,
      minWidthPx: 1024,
      maxWidthPx: null,
      containerWidth: '1200px',
      gridColumns: { default: 4, featureGrid: 3, productGrid: 4 },
      navigationStyle: 'horizontal',
    },
    {
      breakpoint: 'tablet' as const,
      minWidthPx: 768,
      maxWidthPx: 1023,
      containerWidth: '720px',
      gridColumns: { default: 2, featureGrid: 2, productGrid: 2 },
      navigationStyle: 'drawer',
    },
    {
      breakpoint: 'mobile' as const,
      minWidthPx: 0,
      maxWidthPx: 767,
      containerWidth: '100%',
      gridColumns: { default: 1, featureGrid: 1, productGrid: 1 },
      navigationStyle: 'hamburger',
    },
  ];

  return {
    $schema: 'https://ui-ux-helper.internal/schemas/layout-v1.json',
    version: '1.0.0',
    viewport: {
      width: viewportWidth,
      height: viewportHeight,
      documentHeight,
      devicePixelRatio: data.extractionResult?.pageMeta?.devicePixelRatio || 1,
    },
    totalContainers: containers.length,
    summary,
    containers,
    responsiveBreakpoints,
    spacingScale: data.layoutSystem?.spacingScale
      ? data.layoutSystem.spacingScale.map((s) => ({ valuePx: s.valuePx, name: `spacing-${s.valuePx}`, frequency: s.frequency || 1 }))
      : [],
    metadata: {
      generatedAt: new Date().toISOString(),
      pageTitle: data.title,
      pageUrl: data.pageUrl,
    },
  };
}
