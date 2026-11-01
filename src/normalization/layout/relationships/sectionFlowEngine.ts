import {
  AnalyzePageResponseData,
  SectionFlowSpecification,
  SectionFlowNode,
  SectionFlowSemanticType,
  RawElementNode,
} from '../../../types/index.ts';
import { SpatialRelationshipAnalyzer } from './spatialRelationshipAnalyzer.ts';

export class SectionFlowEngine {
  private spatialAnalyzer = new SpatialRelationshipAnalyzer();

  public normalize(data: AnalyzePageResponseData): SectionFlowSpecification {
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';
    const rawElements: RawElementNode[] = data.extractionResult?.elements || [];

    // 1. Identify primary section elements
    const rawCandidates = rawElements.filter(
      (el) =>
        el.tagName === 'SECTION' ||
        el.tagName === 'HEADER' ||
        el.tagName === 'FOOTER' ||
        el.tagName === 'MAIN' ||
        (el.className || '').toLowerCase().includes('section') ||
        (el.className || '').toLowerCase().includes('hero') ||
        el.role === 'region' ||
        el.role === 'banner' ||
        el.role === 'contentinfo'
    );

    // Keep only top-level sections (exclude nodes that are child of another section candidate)
    const candidateIds = new Set(rawCandidates.map((c) => c.id));
    const sectionElements = rawCandidates.filter((el) => {
      let curr = el;
      while (curr.parentId) {
        if (candidateIds.has(curr.parentId)) {
          return false;
        }
        const parent = rawElements.find((e) => e.id === curr.parentId);
        if (!parent) break;
        curr = parent;
      }
      return true;
    });

    // Fallback to top-level containers if no explicit sections found
    const targetSections = sectionElements.length > 0
      ? sectionElements
      : rawElements.filter((el) => !el.parentId || el.parentId === 'root');

    // Sort by vertical Y position to establish natural reading flow
    targetSections.sort((a, b) => (a.boundingRect?.y || 0) - (b.boundingRect?.y || 0));

    let hasStickyHeader = false;
    let hasPersistentFooter = false;
    const rhythmTokensSet = new Set<string>();

    const flow: SectionFlowNode[] = targetSections.map((sec, idx) => {
      const semanticType = this.inferSectionSemanticType(sec);
      const isSticky = sec.position === 'sticky' || (sec.position === 'fixed' && (sec.boundingRect?.y || 0) <= 20);
      const isFooter = semanticType === 'footer' || sec.tagName === 'FOOTER';

      if (isSticky && idx === 0) hasStickyHeader = true;
      if (isFooter) hasPersistentFooter = true;

      // Calculate vertical gap to next section
      let gapPx = 0;
      if (idx < targetSections.length - 1) {
        const nextSec = targetSections[idx + 1];
        gapPx = this.spatialAnalyzer.computeGapBetween(sec, nextSec, false);
      }
      const gapToken = this.spatialAnalyzer.mapGapToToken(gapPx) || 'token_spacing_none';
      if (gapToken) rhythmTokensSet.add(gapToken);

      const isCentered = this.isSectionCentered(sec);
      const isSplit = (sec.display || '').includes('flex') && ((sec as any).justifyContent || '').includes('space-between');

      const widthModel: SectionFlowNode['containerWidthModel'] =
        (sec.boundingRect?.width || 0) >= 1280
          ? 'full-viewport'
          : (sec.className || '').toLowerCase().includes('card')
          ? 'inset-card'
          : 'contained-max-width';

      const positioning: SectionFlowNode['positioning'] = isSticky
        ? 'sticky-top'
        : isFooter
        ? 'persistent-bottom'
        : 'in-flow';

      const relationshipToPrevious: SectionFlowNode['relationshipToPrevious'] =
        idx === 0 ? 'None (First)' : 'Below';

      const relationshipToNext: SectionFlowNode['relationshipToNext'] =
        idx === targetSections.length - 1 ? 'None (Last)' : 'Above';

      const primaryComponentIds = (sec.childIds || []).slice(0, 5);

      return {
        sectionId: `sec_${sec.id}`,
        name: this.spatialAnalyzer.formatNodeName(sec),
        semanticType,
        orderIndex: idx,
        positioning,
        relationshipToPrevious,
        relationshipToNext,
        verticalGapToNext: {
          token: gapToken,
          px: gapPx,
        },
        internalAlignment: isSplit ? 'split' : isCentered ? 'centered' : 'stretch',
        primaryComponentIds,
        dominantIntent: this.inferDominantIntent(sec, semanticType),
        containerWidthModel: widthModel,
      };
    });

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/section-flow-v2.json',
      version: '2.0.0',
      target: { title, url },
      summary: {
        totalSections: flow.length,
        flowDirection: 'vertical',
        hasStickyHeader,
        hasPersistentFooter,
        averageSectionHeightRatio: 0.85,
        sectionRhythmTokens: Array.from(rhythmTokensSet),
      },
      flow,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private inferSectionSemanticType(el: RawElementNode): SectionFlowSemanticType {
    const tag = (el.tagName || '').toUpperCase();
    const cls = (el.className || '').toLowerCase();
    const role = (el.role || '').toLowerCase();

    if (tag === 'HEADER' || role === 'banner' || cls.includes('header') || cls.includes('navbar')) return 'header';
    if (cls.includes('hero')) return 'hero';
    if (cls.includes('feature') || cls.includes('benefits')) return 'features';
    if (cls.includes('grid') || cls.includes('catalog') || cls.includes('product')) return 'catalog-grid';
    if (cls.includes('cta') || cls.includes('action')) return 'cta';
    if (cls.includes('testimonial') || cls.includes('review')) return 'testimonials';
    if (cls.includes('pricing') || cls.includes('plan')) return 'pricing';
    if (tag === 'FOOTER' || role === 'contentinfo' || cls.includes('footer')) return 'footer';
    return 'content';
  }

  private isSectionCentered(el: RawElementNode): boolean {
    const display = (el.display || '').toLowerCase();
    const justify = ((el as any).justifyContent || '').toLowerCase();
    const align = ((el as any).alignItems || '').toLowerCase();

    if (display.includes('flex') && (justify.includes('center') || align.includes('center'))) {
      return true;
    }
    return false;
  }

  private inferDominantIntent(el: RawElementNode, type: SectionFlowSemanticType): string {
    const paddingTop = parseFloat(el.padding?.top || '0') || 0;
    const isLargePadding = paddingTop >= 64;

    if (type === 'hero') {
      return isLargePadding
        ? 'Section Vertical Rhythm + Primary Hero Heading + Center Content'
        : 'Primary Hero Heading + Center Content';
    }
    if (type === 'catalog-grid') {
      return '4-column Product Grid + Grid Gutter Rhythm';
    }
    if (type === 'header') {
      return 'Split Navigation Bar + Sticky Persistent Header';
    }
    return isLargePadding ? 'Section Vertical Rhythm + Container Inset' : 'Standard Content Flow';
  }
}
