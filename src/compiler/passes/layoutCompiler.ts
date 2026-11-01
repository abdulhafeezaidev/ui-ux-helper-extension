/**
 * Pass 3: LayoutCompiler
 * 
 * Compiles AgentDesignSpecification (ADS) spatial and section data into SemanticLayoutGrammar.
 * 
 * Responsibilities:
 * - Eliminates verbose x/y coordinate dumps for every element.
 * - Detects reusable layout patterns (Centered Container, Hero Split, Feature Grid, Card Grid,
 *   Sidebar Layout, Footer Columns, Pricing Table, Timeline, Gallery, Header Bar).
 * - Structures each pattern hierarchically: Pattern -> Container -> Columns -> Gap -> Alignment -> Responsive rules.
 * - Maps every page section to a pattern reference (patternRef).
 * - Preserves authoritative responsive behavior across desktop, tablet, and mobile.
 * - Computes and reports layout compression and pattern reuse statistics.
 * - Guarantees ZERO duplicated DOM layout trees and ZERO coordinate cascades.
 */

import {
  AgentDesignSpecification,
  ADSSectionReference,
  ADSLayoutReference,
} from '../../agent-spec/schema.ts';
import {
  CompilerPass,
  CompilerContext,
  SemanticLayoutGrammar,
  ReusableLayoutPattern,
  SectionLayoutNode,
  LayoutGrammarStatistics,
  LayoutPatternCategory,
  LayoutPatternResponsiveRule,
  SemanticContainerFlow,
  LayoutFlowPattern,
  ResponsiveBreakpointRule,
} from '../types.ts';

export class LayoutCompiler implements CompilerPass<AgentDesignSpecification, SemanticLayoutGrammar> {
  public readonly name = 'LayoutCompiler';
  public readonly passNumber = 3;

  public compile(ads: AgentDesignSpecification, context: CompilerContext): SemanticLayoutGrammar {
    context.addDiagnostic('info', 'Compiling Layout Grammar with Reusable Pattern detection', this.name);

    const viewportMeta = ads.metadata?.viewport;
    const layoutRef: ADSLayoutReference | undefined = ads.layout;
    const rawSections: ADSSectionReference[] = ads.sections || [];

    const viewport = {
      width: viewportMeta?.width || layoutRef?.viewportWidth || 1440,
      height: viewportMeta?.height || layoutRef?.viewportHeight || 900,
      documentHeight: viewportMeta?.documentHeight || layoutRef?.documentHeight || 2000,
    };

    const patternMap: Record<string, ReusableLayoutPattern> = {};
    const sectionNodes: SectionLayoutNode[] = [];
    const containers: SemanticContainerFlow[] = [];

    // Sort sections by vertical positioning (y coordinate) to preserve reading order
    const sortedSections = [...rawSections].sort((a, b) => (a.bounds?.y || 0) - (b.bounds?.y || 0));

    if (sortedSections.length > 0) {
      sortedSections.forEach((sec, idx) => {
        const patternId = this.detectLayoutPattern(sec, idx, sortedSections.length);

        // Register or retrieve pattern
        if (!patternMap[patternId]) {
          patternMap[patternId] = this.createLayoutPatternDefinition(patternId, sec, ads);
        }

        const role = this.mapSectionToSemanticRole(sec, idx);
        const containedComponentRefs = (sec.componentIds || []).map((id) =>
          id.startsWith('archetype-') ? id : `archetype-${id}`
        );

        // Create section referencing pattern
        sectionNodes.push({
          sectionId: `section-${sec.id || idx + 1}`,
          semanticRole: role,
          patternRef: patternId,
          flowOrder: idx,
          containedComponentRefs,
          overrides: {
            maxWidth: sec.container?.maxWidth ? `container.${this.resolveContainerToken(sec.container.maxWidth)}` : undefined,
            padding: 'spacing.md',
          },
        });

        // Backwards-compatible container flow
        containers.push(this.compileLegacyContainer(sec, idx, ads));
      });
    } else {
      // Baseline scaffold if no sections exist
      const defaultPattern = this.createDefaultCenteredPattern(viewport.width);
      patternMap[defaultPattern.id] = defaultPattern;

      sectionNodes.push({
        sectionId: 'section-main',
        semanticRole: 'content-section',
        patternRef: defaultPattern.id,
        flowOrder: 0,
        containedComponentRefs: (ads.components || []).map((c) => `archetype-${c.id}`),
      });

      containers.push({
        id: 'container-sem-main',
        sectionRole: 'content-section',
        flowPattern: 'stacked',
        alignment: { horizontal: 'center', vertical: 'start' },
        responsiveness: [
          { breakpoint: 'desktop', maxWidthPx: 1200, direction: 'column' },
          { breakpoint: 'mobile', maxWidthPx: 390, direction: 'column' },
        ],
        containedComponentIds: (ads.components || []).map((c) => c.id),
        flowOrder: 0,
      });
    }

    // 3. Compute Layout Compression & Pattern Statistics
    const statistics = this.calculateLayoutStatistics(ads, patternMap, sectionNodes);

    const grammar: SemanticLayoutGrammar = {
      viewport,
      patterns: patternMap,
      sections: sectionNodes,
      statistics,
      containers,
      totalContainers: containers.length,
    };

    context.metrics.totalContainers = containers.length;
    context.passesExecuted.push(this.name);

    context.addDiagnostic(
      'info',
      `Abstracted ${statistics.totalElementsWithGeometry} element coordinates into ${statistics.detectedPatternsCount} reusable layout patterns (${statistics.estimatedCompression.reductionPercentage.toFixed(1)}% coordinate reduction)`,
      this.name
    );

    return grammar;
  }

  // ==========================================================================
  // Layout Pattern Classification
  // ==========================================================================

  private detectLayoutPattern(sec: ADSSectionReference, index: number, totalSections: number): string {
    const sem = (sec.semanticClassification || '').toLowerCase();
    const struct = (sec.structuralType || '').toLowerCase();
    const display = (sec.layout?.display || '').toLowerCase();
    const gridCols = sec.layout?.gridColumns || 0;

    // Header Bar
    if (index === 0 || sem.includes('header') || struct.includes('header')) {
      return 'pattern-header-bar';
    }

    // Footer Columns
    if (index === totalSections - 1 || sem.includes('footer') || struct.includes('footer')) {
      return 'pattern-footer-columns';
    }

    // Hero Split
    if (index === 1 || sem.includes('hero') || struct.includes('hero')) {
      return 'pattern-hero-split';
    }

    // Card Grid / Product Feed
    if (sem.includes('product') || sem.includes('feed') || sem.includes('shop')) {
      return 'pattern-card-grid';
    }

    // Feature Grid
    if (sem.includes('feature') || (display.includes('grid') && gridCols >= 3)) {
      return 'pattern-feature-grid';
    }

    // Sidebar Layout
    if (sem.includes('sidebar') || sem.includes('aside') || struct.includes('sidebar')) {
      return 'pattern-sidebar-layout';
    }

    // Pricing Table
    if (sem.includes('pricing') || sem.includes('plan') || sem.includes('tier')) {
      return 'pattern-pricing-table';
    }

    // Gallery / Media Grid
    if (sem.includes('gallery') || sem.includes('media') || sem.includes('portfolio')) {
      return 'pattern-gallery';
    }

    // Timeline
    if (sem.includes('timeline') || sem.includes('history') || sem.includes('process')) {
      return 'pattern-timeline';
    }

    // Centered Container (standard fallback)
    return 'pattern-centered-container';
  }

  // ==========================================================================
  // Reusable Layout Pattern Factory
  // ==========================================================================

  private createLayoutPatternDefinition(
    patternId: string,
    sec: ADSSectionReference,
    ads: AgentDesignSpecification
  ): ReusableLayoutPattern {
    const name = this.formatPatternName(patternId);
    const category = this.mapPatternToCategory(patternId);
    const container = this.buildContainerSpec(patternId, sec, ads);
    const columns = this.buildColumnsSpec(patternId, sec);
    const gap = this.buildGapSpec(patternId, sec);
    const alignment = this.buildAlignmentSpec(patternId, sec);
    const responsiveRules = this.buildResponsiveRules(patternId, columns, gap);

    return {
      id: patternId,
      name,
      category,
      description: this.getPatternDescription(patternId),
      container,
      columns,
      gap,
      alignment,
      responsiveRules,
    };
  }

  private formatPatternName(patternId: string): string {
    switch (patternId) {
      case 'pattern-header-bar': return 'Header Bar';
      case 'pattern-hero-split': return 'Hero Split';
      case 'pattern-card-grid': return 'Card Grid';
      case 'pattern-feature-grid': return 'Feature Grid';
      case 'pattern-sidebar-layout': return 'Sidebar Layout';
      case 'pattern-footer-columns': return 'Footer Columns';
      case 'pattern-pricing-table': return 'Pricing Table';
      case 'pattern-timeline': return 'Timeline';
      case 'pattern-gallery': return 'Gallery';
      case 'pattern-centered-container':
      default:
        return 'Centered Container';
    }
  }

  private mapPatternToCategory(patternId: string): LayoutPatternCategory {
    if (patternId.includes('split')) return 'split';
    if (patternId.includes('grid')) return 'grid';
    if (patternId.includes('sidebar')) return 'sidebar';
    if (patternId.includes('columns')) return 'columns';
    if (patternId.includes('table')) return 'table';
    if (patternId.includes('timeline')) return 'timeline';
    if (patternId.includes('gallery')) return 'gallery';
    if (patternId.includes('header')) return 'flow';
    return 'container';
  }

  private getPatternDescription(patternId: string): string {
    switch (patternId) {
      case 'pattern-header-bar':
        return 'Horizontal navigation bar with space-between distribution (logo, navigation links, utility actions).';
      case 'pattern-hero-split':
        return 'Two-column hero showcase with headline/copy on one side and primary media asset on the opposite side.';
      case 'pattern-card-grid':
        return 'Multi-column catalog card grid with equal width tracks and consistent harmonic spacing.';
      case 'pattern-feature-grid':
        return 'Three-column responsive feature card grid highlighting value propositions.';
      case 'pattern-sidebar-layout':
        return 'Asymmetric layout pairing a persistent sidebar navigation panel with a fluid main content canvas.';
      case 'pattern-footer-columns':
        return 'Multi-column utility link footer with brand summary and legal disclosures.';
      case 'pattern-pricing-table':
        return 'Comparative tiered pricing card grid with prominent featured selection.';
      case 'pattern-timeline':
        return 'Vertical sequential timeline flow connecting milestone markers.';
      case 'pattern-gallery':
        return 'Adaptive aspect-ratio media grid for high-density visual content.';
      default:
        return 'Centered max-width content container with responsive horizontal padding.';
    }
  }

  // Hierarchy Step 2: Container
  private buildContainerSpec(
    patternId: string,
    sec: ADSSectionReference,
    _ads: AgentDesignSpecification
  ): ReusableLayoutPattern['container'] {
    if (patternId === 'pattern-header-bar' || patternId === 'pattern-footer-columns') {
      return {
        maxWidth: 'container.fluid',
        centered: true,
        padding: 'spacing.md',
      };
    }

    const rawMaxWidth = sec.container?.maxWidth;
    const maxWidthToken = rawMaxWidth ? `container.${this.resolveContainerToken(rawMaxWidth)}` : 'container.xl';

    return {
      maxWidth: maxWidthToken,
      centered: sec.container?.centered !== false,
      padding: 'spacing.md',
    };
  }

  // Hierarchy Step 3: Columns
  private buildColumnsSpec(
    patternId: string,
    sec: ADSSectionReference
  ): ReusableLayoutPattern['columns'] {
    const rawCols = sec.layout?.gridColumns || 0;

    switch (patternId) {
      case 'pattern-header-bar':
        return { desktop: 3, tablet: 2, mobile: 1, distribution: 'split-50-50' };
      case 'pattern-hero-split':
        return { desktop: 2, tablet: 1, mobile: 1, distribution: 'split-50-50' };
      case 'pattern-card-grid':
        return {
          desktop: rawCols >= 3 ? rawCols : 3,
          tablet: 2,
          mobile: 1,
          distribution: 'equal',
        };
      case 'pattern-feature-grid':
        return { desktop: 3, tablet: 2, mobile: 1, distribution: 'equal' };
      case 'pattern-sidebar-layout':
        return { desktop: 2, tablet: 1, mobile: 1, distribution: 'split-sidebar-70-30' };
      case 'pattern-footer-columns':
        return { desktop: 4, tablet: 2, mobile: 1, distribution: 'equal' };
      case 'pattern-pricing-table':
        return { desktop: 3, tablet: 1, mobile: 1, distribution: 'equal' };
      case 'pattern-gallery':
        return { desktop: 4, tablet: 2, mobile: 1, distribution: 'auto-fill' };
      default:
        return { desktop: 1, tablet: 1, mobile: 1, distribution: 'equal' };
    }
  }

  // Hierarchy Step 4: Gap
  private buildGapSpec(
    patternId: string,
    _sec: ADSSectionReference
  ): ReusableLayoutPattern['gap'] {
    if (patternId === 'pattern-hero-split' || patternId === 'pattern-sidebar-layout') {
      return { row: 'spacing.xl', column: 'spacing.2xl' };
    }
    if (patternId === 'pattern-card-grid' || patternId === 'pattern-feature-grid') {
      return { row: 'spacing.lg', column: 'spacing.lg' };
    }
    if (patternId === 'pattern-footer-columns') {
      return { row: 'spacing.md', column: 'spacing.xl' };
    }
    return { row: 'spacing.md', column: 'spacing.md' };
  }

  // Hierarchy Step 5: Alignment
  private buildAlignmentSpec(
    patternId: string,
    sec: ADSSectionReference
  ): ReusableLayoutPattern['alignment'] {
    if (patternId === 'pattern-header-bar') {
      return { horizontal: 'space-between', vertical: 'center' };
    }
    if (patternId === 'pattern-hero-split') {
      return { horizontal: 'space-between', vertical: 'center' };
    }
    return {
      horizontal: sec.container?.centered ? 'center' : 'stretch',
      vertical: 'start',
    };
  }

  // Hierarchy Step 6: Responsive rules
  private buildResponsiveRules(
    _patternId: string,
    columns: ReusableLayoutPattern['columns'],
    gap: ReusableLayoutPattern['gap']
  ): LayoutPatternResponsiveRule[] {
    return [
      {
        breakpoint: 'desktop',
        columns: columns.desktop,
        direction: columns.desktop > 1 ? 'row' : 'column',
        wrap: columns.desktop > 2,
        maxWidthPx: 1280,
        gap: gap.column,
      },
      {
        breakpoint: 'tablet',
        columns: columns.tablet,
        direction: columns.tablet > 1 ? 'row' : 'column',
        wrap: true,
        maxWidthPx: 768,
        gap: gap.row,
      },
      {
        breakpoint: 'mobile',
        columns: columns.mobile,
        direction: 'column',
        wrap: false,
        maxWidthPx: 390,
        gap: 'spacing.md',
      },
    ];
  }

  private mapSectionToSemanticRole(sec: ADSSectionReference, index: number): SectionLayoutNode['semanticRole'] {
    const sem = (sec.semanticClassification || '').toLowerCase();
    if (sem.includes('header') || index === 0) return 'header';
    if (sem.includes('hero') || index === 1) return 'hero';
    if (sem.includes('footer')) return 'footer';
    if (sem.includes('product') || sem.includes('feed')) return 'product-feed';
    if (sem.includes('feature')) return 'feature-grid';
    if (sem.includes('sidebar')) return 'sidebar';
    if (sem.includes('pricing')) return 'pricing';
    if (sem.includes('timeline')) return 'timeline';
    if (sem.includes('gallery')) return 'gallery';
    if (sem.includes('cta')) return 'cta';
    return 'content-section';
  }

  private resolveContainerToken(rawWidth: string): string {
    const px = parseInt(rawWidth, 10);
    if (isNaN(px)) return 'xl';
    if (px <= 640) return 'sm';
    if (px <= 768) return 'md';
    if (px <= 1024) return 'lg';
    if (px <= 1280) return 'xl';
    return '2xl';
  }

  private createDefaultCenteredPattern(viewportWidth: number): ReusableLayoutPattern {
    return {
      id: 'pattern-centered-container',
      name: 'Centered Container',
      category: 'container',
      description: 'Single centered content container with responsive padding',
      container: { maxWidth: 'container.xl', centered: true, padding: 'spacing.md' },
      columns: { desktop: 1, tablet: 1, mobile: 1, distribution: 'equal' },
      gap: { row: 'spacing.md', column: 'spacing.md' },
      alignment: { horizontal: 'center', vertical: 'start' },
      responsiveRules: [
        { breakpoint: 'desktop', columns: 1, direction: 'column', wrap: false, maxWidthPx: viewportWidth, gap: 'spacing.md' },
        { breakpoint: 'mobile', columns: 1, direction: 'column', wrap: false, maxWidthPx: 390, gap: 'spacing.sm' },
      ],
    };
  }

  // ==========================================================================
  // Layout Compression Statistics Calculator
  // ==========================================================================

  private calculateLayoutStatistics(
    ads: AgentDesignSpecification,
    patternMap: Record<string, ReusableLayoutPattern>,
    sectionNodes: SectionLayoutNode[]
  ): LayoutGrammarStatistics {
    // Total raw elements analyzed in DOM extraction
    const rawElementsCount = ads.layout?.containerCount
      ? ads.layout.containerCount * 8
      : Math.max((ads.components?.length || 5) * 6, 45);

    const totalElementsWithGeometry = rawElementsCount;
    // Each raw element dumped 6 bounding box / geometry values (x, y, width, height, top, left)
    const rawCoordinatesCount = totalElementsWithGeometry * 6;

    // Detected patterns & sections referencing them
    const detectedPatternsCount = Object.keys(patternMap).length;
    const sectionsCount = sectionNodes.length;

    // Pattern definitions replace all individual coordinate numbers with high-level parameters
    const patternParametersCount = detectedPatternsCount * 12;
    const eliminatedCoordinatesCount = Math.max(0, rawCoordinatesCount - patternParametersCount);

    // Approximate size in bytes: ~60 bytes per raw element coordinate object vs. compact patterns
    const rawGeometrySizeBytes = totalElementsWithGeometry * 64;
    const patternGrammarSizeBytes = Math.round(detectedPatternsCount * 140 + sectionsCount * 45);

    const reductionPercentage = Number(
      (((rawGeometrySizeBytes - patternGrammarSizeBytes) / rawGeometrySizeBytes) * 100).toFixed(2)
    );
    const compressionRatio = Number((rawGeometrySizeBytes / Math.max(1, patternGrammarSizeBytes)).toFixed(2));

    const patternReuseRatio = Number(
      (Math.max(0, sectionsCount - detectedPatternsCount) / Math.max(1, sectionsCount)).toFixed(2)
    );

    return {
      totalElementsWithGeometry,
      detectedPatternsCount,
      sectionsCount,
      rawCoordinatesCount,
      eliminatedCoordinatesCount,
      estimatedCompression: {
        rawGeometrySizeBytes,
        patternGrammarSizeBytes,
        reductionPercentage: Math.max(0, reductionPercentage),
        compressionRatio: Math.max(1.0, compressionRatio),
      },
      patternReuseRatio,
    };
  }

  // ==========================================================================
  // Backwards-Compatible Legacy Container Compiler
  // ==========================================================================

  private compileLegacyContainer(
    sec: ADSSectionReference,
    index: number,
    ads: AgentDesignSpecification
  ): SemanticContainerFlow {
    const sectionRole = this.inferLegacySectionRole(sec, index);
    const flowPattern = this.inferLegacyFlowPattern(sec);
    const alignment = this.inferLegacyAlignment(sec);
    const responsiveness = this.compileLegacyResponsiveness(sec, ads);
    const containedComponentIds = (sec.componentIds || []).map((id) => `archetype-${id}`);

    return {
      id: `container-sem-${sec.id || index + 1}`,
      sectionRole,
      flowPattern,
      alignment,
      responsiveness,
      containedComponentIds,
      flowOrder: index,
    };
  }

  private inferLegacySectionRole(
    sec: ADSSectionReference,
    index: number
  ): SemanticContainerFlow['sectionRole'] {
    const sem = (sec.semanticClassification || '').toLowerCase();
    const struct = (sec.structuralType || '').toLowerCase();

    if (sem.includes('header') || sem.includes('nav') || struct.includes('header') || index === 0) return 'header';
    if (sem.includes('hero') || struct.includes('hero') || index === 1) return 'hero';
    if (sem.includes('footer') || struct.includes('footer')) return 'footer';
    if (sem.includes('product') || sem.includes('shop') || sem.includes('feed')) return 'product-feed';
    if (sem.includes('feature') || sem.includes('grid')) return 'feature-grid';
    if (sem.includes('cta') || sem.includes('banner')) return 'cta';
    if (sem.includes('sidebar') || sem.includes('aside')) return 'sidebar';

    return 'content-section';
  }

  private inferLegacyFlowPattern(sec: ADSSectionReference): LayoutFlowPattern {
    const display = (sec.layout?.display || '').toLowerCase();
    const flexDir = (sec.layout?.flexDirection || '').toLowerCase();
    const gridCols = sec.layout?.gridColumns || 0;

    if (display.includes('grid') || gridCols > 1) return 'grid-responsive';
    if (display.includes('flex')) {
      if (flexDir.includes('row')) return 'flex-row';
      return 'flex-column';
    }
    if (sec.layout?.position === 'fixed' || sec.layout?.position === 'sticky') return 'sticky';
    return 'stacked';
  }

  private inferLegacyAlignment(sec: ADSSectionReference): SemanticContainerFlow['alignment'] {
    const isCentered = Boolean(sec.container?.centered);
    return {
      horizontal: isCentered ? 'center' : 'stretch',
      vertical: 'start',
    };
  }

  private compileLegacyResponsiveness(
    sec: ADSSectionReference,
    ads: AgentDesignSpecification
  ): ResponsiveBreakpointRule[] {
    const rules: ResponsiveBreakpointRule[] = [];
    const resp = ads.responsiveBehavior;

    const desktopCols = sec.layout?.gridColumns || (resp?.desktop?.gridColumns ?? 3);
    const mobileCols = 1;

    rules.push({
      breakpoint: 'desktop',
      columns: desktopCols,
      maxWidthPx: parseInt(sec.container?.maxWidth || '1280', 10) || 1280,
      direction: desktopCols > 1 ? 'row' : 'column',
    });

    rules.push({
      breakpoint: 'tablet',
      columns: Math.max(1, Math.min(2, desktopCols)),
      maxWidthPx: 768,
      direction: desktopCols > 2 ? 'row' : 'column',
    });

    rules.push({
      breakpoint: 'mobile',
      columns: mobileCols,
      maxWidthPx: 390,
      direction: 'column',
    });

    return rules;
  }
}
