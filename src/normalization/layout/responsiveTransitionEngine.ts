import {
  AnalyzePageResponseData,
  TargetViewportWidth,
  ViewportLayoutState,
  TransitionEdgeDelta,
  ResponsiveTransitionSpecification,
  GridColumnTransition,
  GapTransition,
  FontScalingTransition,
  SpacingTransition,
  HiddenElementDelta,
  ReorderDelta,
  MenuTransformationDelta,
  ImageResizingDelta,
  LayoutDirectionTransition,
} from '../../types/index.ts';

export const TARGET_VIEWPORTS: TargetViewportWidth[] = [1440, 1280, 1024, 768, 640, 480, 375];

export class ResponsiveTransitionEngine {
  /**
   * Main entry point: builds complete 13_responsive.json specification
   * with snapshots and transition graph edges across all 7 target viewports.
   */
  public normalize(data: AnalyzePageResponseData): ResponsiveTransitionSpecification {
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';

    // 1. Build Viewport Layout State for each of the 7 Target Viewports
    const viewports: Record<TargetViewportWidth, ViewportLayoutState> = {
      1440: this.buildViewportState(1440, data),
      1280: this.buildViewportState(1280, data),
      1024: this.buildViewportState(1024, data),
      768: this.buildViewportState(768, data),
      640: this.buildViewportState(640, data),
      480: this.buildViewportState(480, data),
      375: this.buildViewportState(375, data),
    };

    // 2. Build Chronological Transition Graph between Consecutive Viewport Pairs
    const transitionGraph: TransitionEdgeDelta[] = [];
    for (let i = 0; i < TARGET_VIEWPORTS.length - 1; i++) {
      const fromVp = TARGET_VIEWPORTS[i];
      const toVp = TARGET_VIEWPORTS[i + 1];
      const fromState = viewports[fromVp];
      const toState = viewports[toVp];

      transitionGraph.push(this.computeTransitionEdge(fromState, toState, toVp));
    }

    // 3. Compute Summary Indicators
    const hasNavCollapse = transitionGraph.some((t) => t.menuTransformations.some((m) => m.isCollapsing));
    const hasGridStepDown = transitionGraph.some((t) => t.gridColumnTransitions.some((g) => g.delta < 0));
    const hasFluidScaling = transitionGraph.some((t) => t.fontScalingTransitions.length > 0);

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/responsive-transitions-v1.json',
      version: '1.0.0',
      target: {
        title,
        url,
      },
      summary: {
        totalViewportsTested: TARGET_VIEWPORTS.length,
        totalTransitionEdges: transitionGraph.length,
        targetBreakpoints: TARGET_VIEWPORTS,
        hasNavigationCollapse: hasNavCollapse,
        hasGridColumnStepDown: hasGridStepDown,
        hasFluidTypographyScaling: hasFluidScaling,
      },
      viewports,
      transitionGraph,
      metadata: {
        generatedAt: new Date().toISOString(),
        extractorVersion: '1.0.0-responsive-transition-engine',
        guidanceForAI: [
          'RESPONSIVE TRANSITIONS DIRECTIVE: Reconstruct responsive layouts by following the chronological transitionGraph in 13_responsive.json.',
          'GRID STEP-DOWN: Implement responsive CSS Grid columns using recommendedTailwindClasses (e.g. grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4).',
          'NAVIGATION COLLAPSE: At the <= 768px transition, collapse the top navigation bar into a drawer-hamburger menu with mobile toggle trigger.',
          'FLUID TYPOGRAPHY: Use the provided clampFormula for headings (H1/H2/H3) to smoothly scale fonts across viewport ranges.',
          'FLEX DIRECTION: Switch multi-column hero and feature containers from flex-row to flex-col at mobile breakpoints.'
        ],
      },
    };
  }

  /**
   * Constructs the layout state snapshot for a single viewport width.
   */
  private buildViewportState(vp: TargetViewportWidth, data: AnalyzePageResponseData): ViewportLayoutState {
    const rawElements = data.extractionResult?.elements || [];
    const typoSys = data.typographySystem;

    // Baseline Typography
    const baseH1 = typoSys?.hierarchy?.h1?.fontSizePx || 48;
    const baseH2 = typoSys?.hierarchy?.h2?.fontSizePx || 36;
    const baseH3 = 24;
    const baseBody = typoSys?.hierarchy?.body?.fontSizePx || 16;
    const baseSmall = 14;

    let name: ViewportLayoutState['name'];
    let containerWidth: string;
    let containerPadding: string;
    let gridCols: ViewportLayoutState['gridColumns'];
    let gaps: ViewportLayoutState['gaps'];
    let fontScaling: ViewportLayoutState['fontScaling'];
    let spacingChanges: ViewportLayoutState['spacingChanges'];
    let menuMode: ViewportLayoutState['menuTransformation']['mode'];
    let isDrawer: boolean;
    let isHamburger: boolean;
    let heroMode: ViewportLayoutState['imageResizing']['heroMode'];
    let cardAspectRatio: number;

    if (vp >= 1440) {
      name = 'desktop-large';
      containerWidth = '1280px';
      containerPadding = '32px';
      gridCols = { productGrid: 4, featureGrid: 3, footerGrid: 4, defaultGrid: 4 };
      gaps = { sectionGapPx: 64, gridGapPx: 24, rowGap: '24px', columnGap: '24px' };
      fontScaling = { h1Px: baseH1, h2Px: baseH2, h3Px: baseH3, bodyPx: baseBody, smallPx: baseSmall };
      spacingChanges = { sectionPaddingPx: 64, containerPaddingPx: 32, cardPaddingPx: 24, pagePaddingPx: 32 };
      menuMode = 'horizontal-bar';
      isDrawer = false;
      isHamburger = false;
      heroMode = 'side-by-side';
      cardAspectRatio = 1.33;
    } else if (vp >= 1280) {
      name = 'desktop';
      containerWidth = '1200px';
      containerPadding = '24px';
      gridCols = { productGrid: 4, featureGrid: 3, footerGrid: 4, defaultGrid: 4 };
      gaps = { sectionGapPx: 56, gridGapPx: 24, rowGap: '24px', columnGap: '24px' };
      fontScaling = { h1Px: Math.round(baseH1 * 0.95), h2Px: Math.round(baseH2 * 0.95), h3Px: baseH3, bodyPx: baseBody, smallPx: baseSmall };
      spacingChanges = { sectionPaddingPx: 56, containerPaddingPx: 24, cardPaddingPx: 24, pagePaddingPx: 24 };
      menuMode = 'horizontal-bar';
      isDrawer = false;
      isHamburger = false;
      heroMode = 'side-by-side';
      cardAspectRatio = 1.33;
    } else if (vp >= 1024) {
      name = 'tablet-landscape';
      containerWidth = '960px';
      containerPadding = '24px';
      gridCols = { productGrid: 3, featureGrid: 3, footerGrid: 3, defaultGrid: 3 };
      gaps = { sectionGapPx: 48, gridGapPx: 20, rowGap: '20px', columnGap: '20px' };
      fontScaling = { h1Px: Math.round(baseH1 * 0.85), h2Px: Math.round(baseH2 * 0.85), h3Px: Math.round(baseH3 * 0.9), bodyPx: baseBody, smallPx: baseSmall };
      spacingChanges = { sectionPaddingPx: 48, containerPaddingPx: 24, cardPaddingPx: 20, pagePaddingPx: 24 };
      menuMode = 'compact-bar';
      isDrawer = false;
      isHamburger = false;
      heroMode = 'side-by-side';
      cardAspectRatio = 1.25;
    } else if (vp >= 768) {
      name = 'tablet-portrait';
      containerWidth = '720px';
      containerPadding = '20px';
      gridCols = { productGrid: 2, featureGrid: 2, footerGrid: 2, defaultGrid: 2 };
      gaps = { sectionGapPx: 40, gridGapPx: 16, rowGap: '16px', columnGap: '16px' };
      fontScaling = { h1Px: Math.round(baseH1 * 0.75), h2Px: Math.round(baseH2 * 0.75), h3Px: Math.round(baseH3 * 0.85), bodyPx: baseBody, smallPx: baseSmall };
      spacingChanges = { sectionPaddingPx: 40, containerPaddingPx: 20, cardPaddingPx: 16, pagePaddingPx: 20 };
      menuMode = 'drawer-hamburger';
      isDrawer = true;
      isHamburger = true;
      heroMode = 'full-width';
      cardAspectRatio = 1.2;
    } else if (vp >= 640) {
      name = 'mobile-large';
      containerWidth = '100%';
      containerPadding = '16px';
      gridCols = { productGrid: 2, featureGrid: 1, footerGrid: 2, defaultGrid: 2 };
      gaps = { sectionGapPx: 32, gridGapPx: 16, rowGap: '16px', columnGap: '16px' };
      fontScaling = { h1Px: Math.round(baseH1 * 0.7), h2Px: Math.round(baseH2 * 0.7), h3Px: Math.round(baseH3 * 0.8), bodyPx: baseBody, smallPx: baseSmall };
      spacingChanges = { sectionPaddingPx: 32, containerPaddingPx: 16, cardPaddingPx: 16, pagePaddingPx: 16 };
      menuMode = 'drawer-hamburger';
      isDrawer = true;
      isHamburger = true;
      heroMode = 'full-width';
      cardAspectRatio = 1.0;
    } else if (vp >= 480) {
      name = 'mobile-medium';
      containerWidth = '100%';
      containerPadding = '16px';
      gridCols = { productGrid: 1, featureGrid: 1, footerGrid: 1, defaultGrid: 1 };
      gaps = { sectionGapPx: 24, gridGapPx: 12, rowGap: '12px', columnGap: '12px' };
      fontScaling = { h1Px: Math.round(baseH1 * 0.65), h2Px: Math.round(baseH2 * 0.65), h3Px: Math.round(baseH3 * 0.75), bodyPx: baseBody, smallPx: baseSmall };
      spacingChanges = { sectionPaddingPx: 24, containerPaddingPx: 16, cardPaddingPx: 12, pagePaddingPx: 16 };
      menuMode = 'drawer-hamburger';
      isDrawer = true;
      isHamburger = true;
      heroMode = 'full-width';
      cardAspectRatio = 1.0;
    } else {
      name = 'mobile-small';
      containerWidth = '100%';
      containerPadding = '12px';
      gridCols = { productGrid: 1, featureGrid: 1, footerGrid: 1, defaultGrid: 1 };
      gaps = { sectionGapPx: 20, gridGapPx: 12, rowGap: '12px', columnGap: '12px' };
      fontScaling = { h1Px: Math.round(baseH1 * 0.6), h2Px: Math.round(baseH2 * 0.6), h3Px: Math.round(baseH3 * 0.7), bodyPx: 15, smallPx: 13 };
      spacingChanges = { sectionPaddingPx: 20, containerPaddingPx: 12, cardPaddingPx: 12, pagePaddingPx: 12 };
      menuMode = 'drawer-hamburger';
      isDrawer = true;
      isHamburger = true;
      heroMode = 'full-width';
      cardAspectRatio = 1.0;
    }

    // Identify hidden elements for this viewport
    const hiddenElements: string[] = [];
    const reorderedElements: ViewportLayoutState['reorderedElements'] = [];
    const layoutTransitions: ViewportLayoutState['layoutTransitions'] = [];

    const isMobileViewport = vp <= 768;

    for (const el of rawElements) {
      const cls = (typeof el.className === 'string' ? el.className : '').toLowerCase();

      // Hidden elements
      if (isMobileViewport && (cls.includes('hide-mobile') || cls.includes('desktop-only') || cls.includes('hidden-sm') || cls.includes('hidden-xs') || cls.includes('hidden-md'))) {
        hiddenElements.push(el.id);
      } else if (!isMobileViewport && (cls.includes('mobile-only') || cls.includes('show-mobile') || cls.includes('hamburger') || cls.includes('drawer-toggle') || cls.includes('nav-toggle'))) {
        hiddenElements.push(el.id);
      }

      // Reordered elements
      if (cls.includes('order-') || cls.includes('reorder')) {
        reorderedElements.push({
          elementId: el.id,
          selector: this.buildSelector(el),
          visualOrder: isMobileViewport ? 2 : 1,
          cssOrder: isMobileViewport ? 2 : 1,
        });
      }

      // Layout transitions (Flex direction switches)
      if (el.tagName?.toLowerCase() === 'header' || cls.includes('hero') || cls.includes('split') || cls.includes('banner')) {
        layoutTransitions.push({
          containerId: el.id,
          selector: this.buildSelector(el),
          layoutModel: 'flex',
          direction: isMobileViewport ? 'column' : 'row',
        });
      }
    }

    return {
      viewport: vp,
      name,
      containerWidth,
      containerPadding,
      gridColumns: gridCols,
      gaps,
      fontScaling,
      spacingChanges,
      hiddenElements,
      reorderedElements,
      menuTransformation: {
        mode: menuMode,
        isDrawer,
        isHamburger,
      },
      imageResizing: {
        heroMode,
        cardAspectRatio,
        objectFit: 'cover',
      },
      layoutTransitions,
    };
  }

  /**
   * Computes the step-by-step delta between two consecutive viewports.
   */
  private computeTransitionEdge(
    from: ViewportLayoutState,
    to: ViewportLayoutState,
    triggerBp: TargetViewportWidth
  ): TransitionEdgeDelta {
    const stepName = `${this.formatVpName(from.viewport)} (${from.viewport}px) → ${this.formatVpName(to.viewport)} (${to.viewport}px)`;
    const summaryParts: string[] = [];

    // 1. Grid Column Transitions
    const gridColumnTransitions: GridColumnTransition[] = [];
    if (from.gridColumns.productGrid !== to.gridColumns.productGrid) {
      const delta = to.gridColumns.productGrid - from.gridColumns.productGrid;
      gridColumnTransitions.push({
        containerId: 'product-grid-container',
        selector: '.product-grid, .grid-section',
        fromColumns: from.gridColumns.productGrid,
        toColumns: to.gridColumns.productGrid,
        delta,
        tailwindClass: this.buildGridTailwindClass(from.gridColumns.productGrid, to.gridColumns.productGrid, triggerBp),
      });
      summaryParts.push(`Product grid: ${from.gridColumns.productGrid} cols → ${to.gridColumns.productGrid} cols`);
    }

    if (from.gridColumns.featureGrid !== to.gridColumns.featureGrid) {
      const delta = to.gridColumns.featureGrid - from.gridColumns.featureGrid;
      gridColumnTransitions.push({
        containerId: 'feature-grid-container',
        selector: '.feature-grid, .features-section',
        fromColumns: from.gridColumns.featureGrid,
        toColumns: to.gridColumns.featureGrid,
        delta,
        tailwindClass: this.buildGridTailwindClass(from.gridColumns.featureGrid, to.gridColumns.featureGrid, triggerBp),
      });
    }

    // 2. Gap Transitions
    const gapTransitions: GapTransition[] = [];
    if (from.gaps.gridGapPx !== to.gaps.gridGapPx) {
      gapTransitions.push({
        containerId: 'main-grid-container',
        selector: '.grid-container, .products-grid',
        fromGap: `${from.gaps.gridGapPx}px`,
        toGap: `${to.gaps.gridGapPx}px`,
        tailwindClass: `gap-${Math.round(to.gaps.gridGapPx / 4)} ${this.bpPrefix(triggerBp)}:gap-${Math.round(from.gaps.gridGapPx / 4)}`,
      });
      summaryParts.push(`Grid gap: ${from.gaps.gridGapPx}px → ${to.gaps.gridGapPx}px`);
    }

    // 3. Font Scaling Transitions
    const fontScalingTransitions: FontScalingTransition[] = [];
    if (from.fontScaling.h1Px !== to.fontScaling.h1Px) {
      const ratio = parseFloat((to.fontScaling.h1Px / from.fontScaling.h1Px).toFixed(2));
      fontScalingTransitions.push({
        role: 'h1',
        fromPx: from.fontScaling.h1Px,
        toPx: to.fontScaling.h1Px,
        scaleRatio: ratio,
        clampFormula: `clamp(${to.fontScaling.h1Px}px, 5vw, ${from.fontScaling.h1Px}px)`,
        tailwindClass: `text-3xl ${this.bpPrefix(triggerBp)}:text-5xl`,
      });
      summaryParts.push(`H1 font: ${from.fontScaling.h1Px}px → ${to.fontScaling.h1Px}px`);
    }

    if (from.fontScaling.h2Px !== to.fontScaling.h2Px) {
      const ratio = parseFloat((to.fontScaling.h2Px / from.fontScaling.h2Px).toFixed(2));
      fontScalingTransitions.push({
        role: 'h2',
        fromPx: from.fontScaling.h2Px,
        toPx: to.fontScaling.h2Px,
        scaleRatio: ratio,
        clampFormula: `clamp(${to.fontScaling.h2Px}px, 4vw, ${from.fontScaling.h2Px}px)`,
        tailwindClass: `text-2xl ${this.bpPrefix(triggerBp)}:text-4xl`,
      });
    }

    // 4. Spacing Transitions
    const spacingTransitions: SpacingTransition[] = [];
    if (from.spacingChanges.sectionPaddingPx !== to.spacingChanges.sectionPaddingPx) {
      spacingTransitions.push({
        property: 'section-padding',
        fromPx: from.spacingChanges.sectionPaddingPx,
        toPx: to.spacingChanges.sectionPaddingPx,
        tailwindClass: `py-${Math.round(to.spacingChanges.sectionPaddingPx / 4)} ${this.bpPrefix(triggerBp)}:py-${Math.round(from.spacingChanges.sectionPaddingPx / 4)}`,
      });
      summaryParts.push(`Section padding: ${from.spacingChanges.sectionPaddingPx}px → ${to.spacingChanges.sectionPaddingPx}px`);
    }

    // 5. Hidden Element Deltas
    const hiddenElementDeltas: HiddenElementDelta[] = [];
    const newlyHidden = to.hiddenElements.filter((id) => !from.hiddenElements.includes(id));
    for (const id of newlyHidden) {
      hiddenElementDeltas.push({
        elementId: id,
        selector: `#${id}`,
        state: 'hidden',
        triggerReason: `Element collapses below ${triggerBp}px viewport breakpoint`,
      });
    }

    // 6. Reorder Deltas
    const reorderDeltas: ReorderDelta[] = [];
    if (to.reorderedElements.length > 0) {
      for (const re of to.reorderedElements) {
        reorderDeltas.push({
          elementId: re.elementId,
          selector: re.selector,
          fromOrder: 1,
          toOrder: re.visualOrder,
          rule: `order-${re.visualOrder} ${this.bpPrefix(triggerBp)}:order-1`,
        });
      }
    }

    // 7. Menu Transformations
    const menuTransformations: MenuTransformationDelta[] = [];
    if (from.menuTransformation.mode !== to.menuTransformation.mode) {
      const isCollapsing = to.menuTransformation.isDrawer;
      menuTransformations.push({
        menuId: 'main-navigation',
        fromMode: from.menuTransformation.mode,
        toMode: to.menuTransformation.mode,
        isCollapsing,
        triggerSelector: '.hamburger-btn, .menu-toggle',
      });
      summaryParts.push(`Navigation: ${from.menuTransformation.mode} → ${to.menuTransformation.mode}`);
    }

    // 8. Image Resizing Deltas
    const imageResizingDeltas: ImageResizingDelta[] = [];
    if (from.imageResizing.heroMode !== to.imageResizing.heroMode || from.imageResizing.cardAspectRatio !== to.imageResizing.cardAspectRatio) {
      imageResizingDeltas.push({
        imageId: 'hero-media-banner',
        fromMode: from.imageResizing.heroMode,
        toMode: to.imageResizing.heroMode,
        fromAspectRatio: from.imageResizing.cardAspectRatio,
        toAspectRatio: to.imageResizing.cardAspectRatio,
      });
    }

    // 9. Layout Direction Transitions (Flex Direction row -> col)
    const layoutDirectionTransitions: LayoutDirectionTransition[] = [];
    if (from.viewport >= 1024 && to.viewport <= 768) {
      layoutDirectionTransitions.push({
        containerId: 'hero-split-container',
        selector: '.hero-container, .split-layout',
        fromDirection: 'row',
        toDirection: 'column',
        tailwindClass: `flex-col ${this.bpPrefix(triggerBp)}:flex-row`,
      });
      summaryParts.push('Hero/split layout: flex-row → flex-col');
    }

    // Recommended Tailwind Classes for this edge
    const recommendedTailwindClasses: string[] = [
      ...gridColumnTransitions.map((g) => g.tailwindClass),
      ...gapTransitions.map((g) => g.tailwindClass),
      ...fontScalingTransitions.map((f) => f.tailwindClass),
      ...spacingTransitions.map((s) => s.tailwindClass),
      ...layoutDirectionTransitions.map((l) => l.tailwindClass),
    ].filter(Boolean);

    const humanSummary = summaryParts.length > 0 ? summaryParts.join('; ') : `Minor layout adjustments between ${from.viewport}px and ${to.viewport}px`;

    return {
      step: stepName,
      fromViewport: from.viewport,
      toViewport: to.viewport,
      triggerBreakpoint: triggerBp,
      humanSummary,
      gridColumnTransitions,
      gapTransitions,
      fontScalingTransitions,
      spacingTransitions,
      hiddenElementDeltas,
      reorderDeltas,
      menuTransformations,
      imageResizingDeltas,
      layoutDirectionTransitions,
      recommendedTailwindClasses,
    };
  }

  /**
   * Helper to format readable viewport name.
   */
  private formatVpName(vp: TargetViewportWidth): string {
    switch (vp) {
      case 1440: return 'Desktop Large';
      case 1280: return 'Desktop';
      case 1024: return 'Tablet Landscape';
      case 768: return 'Tablet Portrait';
      case 640: return 'Mobile Large';
      case 480: return 'Mobile Medium';
      case 375: return 'Mobile Small';
    }
  }

  /**
   * Maps breakpoint width to Tailwind breakpoint prefix.
   */
  private bpPrefix(bp: number): string {
    if (bp >= 1280) return 'xl';
    if (bp >= 1024) return 'lg';
    if (bp >= 768) return 'md';
    if (bp >= 640) return 'sm';
    return 'max-sm';
  }

  /**
   * Generates Tailwind grid class string for a column step-down.
   */
  private buildGridTailwindClass(fromCols: number, toCols: number, bp: number): string {
    const prefix = this.bpPrefix(bp);
    return `grid-cols-${toCols} ${prefix}:grid-cols-${fromCols}`;
  }

  /**
   * Builds human-readable CSS selector for element.
   */
  private buildSelector(el: any): string {
    const tag = el.tagName?.toLowerCase() || 'div';
    if (el.id && !el.id.startsWith('el_')) return `${tag}#${el.id}`;
    if (el.className) {
      const firstClass = String(el.className).trim().split(/\s+/)[0];
      if (firstClass) return `${tag}.${firstClass}`;
    }
    return tag;
  }
}

/**
 * Functional helper for quick execution.
 */
export function buildResponsiveTransitionSpecification(data: AnalyzePageResponseData): ResponsiveTransitionSpecification {
  return new ResponsiveTransitionEngine().normalize(data);
}
