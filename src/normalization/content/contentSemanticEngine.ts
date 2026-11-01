import {
  AnalyzePageResponseData,
  RawElementNode,
  ContentSemanticSpecification,
  SemanticContentBlockNode,
  ContentSemanticRole,
  ContentImportance,
  SeoRelevance,
  VisualPriority,
} from '../../types/index.ts';

export class ContentSemanticEngine {
  /**
   * Main entry point: classifies every textual element into its semantic role,
   * purpose, importance, SEO relevance, and visual priority (17_content.json).
   */
  public normalize(data: AnalyzePageResponseData): ContentSemanticSpecification {
    const rawElements = data.extractionResult?.elements || [];
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';

    const elementMap = new Map<string, RawElementNode>();
    rawElements.forEach((el) => elementMap.set(el.id, el));

    // Filter elements that have direct or meaningful text content
    const textNodes = rawElements.filter(
      (el) => el.textMeta && el.textMeta.hasText && el.textMeta.trimmedText && el.textMeta.trimmedText.length > 0
    );

    const blocks: SemanticContentBlockNode[] = [];
    const roleDistribution: Record<string, number> = {};

    let criticalBlocksCount = 0;
    let highImportanceCount = 0;
    let primaryHeadline: string | undefined;
    let primaryCtaText: string | undefined;

    for (const el of textNodes) {
      const node = this.classifyTextNode(el, elementMap);
      blocks.push(node);

      roleDistribution[node.semanticRole] = (roleDistribution[node.semanticRole] || 0) + 1;

      if (node.importance === 'critical') criticalBlocksCount++;
      if (node.importance === 'high') highImportanceCount++;

      if (!primaryHeadline && (node.semanticRole === 'Headline' || el.tagName === 'h1')) {
        primaryHeadline = node.trimmedText;
      }
      if (!primaryCtaText && node.semanticRole === 'CTA') {
        primaryCtaText = node.trimmedText;
      }
    }

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/content-semantics-v1.json',
      version: '1.0.0',
      target: {
        title,
        url,
      },
      summary: {
        totalContentBlocks: blocks.length,
        roleDistribution,
        criticalBlocksCount,
        highImportanceCount,
        primaryHeadline: primaryHeadline || title,
        primaryCtaText,
      },
      blocks,
      metadata: {
        generatedAt: new Date().toISOString(),
        extractorVersion: '1.0.0-content-semantic-engine',
        guidanceForAI: [
          'CONTENT SEMANTIC INTENT: Use semanticRole and purpose to understand what text accomplishes rather than copying verbatim text.',
          'SEO & HIERARCHY: Preserve Headings marked h1-primary-keyword and heading-secondary for search engine indexing.',
          'ACTION CTAS: Wire interactive CTA elements to primary conversion events and routing handlers.',
          'DYNAMIC VALUES: Identify Price, Rating, Badge, and Metadata fields as dynamic data bindings rather than hardcoded copy.'
        ],
      },
    };
  }

  /**
   * Deterministically classifies a single text element using DOM evidence.
   */
  private classifyTextNode(
    el: RawElementNode,
    elementMap: Map<string, RawElementNode>
  ): SemanticContentBlockNode {
    const text = el.textMeta?.trimmedText || '';
    const trimmedText = text.trim();
    const tag = (el.tagName || '').toLowerCase();
    const className = (el.className || '').toLowerCase();
    const roleAttr = (el.role || '').toLowerCase();
    const fontSizePx = el.typography?.fontSize ? parseFloat(el.typography.fontSize) : 16;
    const fontWeight = el.typography?.fontWeight ? parseInt(el.typography.fontWeight, 10) : 400;

    const evidence: string[] = [];
    const ancestors = this.getAncestors(el, elementMap);

    let semanticRole: ContentSemanticRole = 'Body';
    let purpose = 'Primary descriptive body paragraph and narrative text';
    let importance: ContentImportance = 'medium';
    let seoRelevance: SeoRelevance = 'body-content';
    let visualPriority: VisualPriority = 'body-p3';

    // 1. Price Classification ($99, €49.99, £20/mo, etc.)
    const priceRegex = /^(\$|€|£|¥|₹|USD|EUR)\s?\d+(\.\d{2})?(\s*(\/|\bper\b)\s*(mo|month|yr|year|user|item))?$/i;
    if (priceRegex.test(trimmedText) || className.includes('price') || (el.id && el.id.includes('price'))) {
      semanticRole = 'Price';
      purpose = 'Product or subscription pricing and currency information';
      importance = 'critical';
      seoRelevance = 'body-content';
      visualPriority = 'headline-p2';
      evidence.push(`Matched currency price regex or price class: "${trimmedText}"`);
    }
    // 2. Rating Classification (4.8 / 5, ★★★★★, (128 reviews))
    else if (
      /^(\d(\.\d)?\s*(\/\s*5|\bstar(s)?\b)|[★☆]{1,5}|\(\d+\s*reviews?\))$/i.test(trimmedText) ||
      className.includes('rating') ||
      className.includes('review-score')
    ) {
      semanticRole = 'Rating';
      purpose = 'Social proof, customer review score, and star rating';
      importance = 'high';
      seoRelevance = 'supplementary';
      visualPriority = 'caption-p4';
      evidence.push(`Matched rating pattern or rating class: "${trimmedText}"`);
    }
    // 3. CTA Classification (Button, primary link, action verbs)
    else if (
      tag === 'button' ||
      roleAttr === 'button' ||
      className.includes('btn') ||
      className.includes('cta') ||
      /^(sign up|get started|buy now|subscribe|learn more|contact us|try for free|download now|join now|book now|schedule demo|submit|add to cart|checkout|deploy now)$/i.test(trimmedText)
    ) {
      semanticRole = 'CTA';
      purpose = 'Primary user conversion trigger and interactive call to action';
      importance = 'critical';
      seoRelevance = 'metadata-nav';
      visualPriority = 'interactive-cta';
      evidence.push(`Action trigger tag <${tag}>, role="${roleAttr}", or action verb phrase`);
    }
    // 4. Badge Classification (Status chips, tags, pills)
    else if (
      (className.includes('badge') || className.includes('pill') || className.includes('chip') || className.includes('tag')) &&
      trimmedText.length <= 25
    ) {
      semanticRole = 'Badge';
      purpose = 'Status, highlight, tier, or product label indicator';
      importance = 'medium';
      seoRelevance = 'supplementary';
      visualPriority = 'caption-p4';
      evidence.push(`Badge/chip element class "${className}" with compact label length`);
    }
    // 5. Explicit Caption / Figcaption
    else if (tag === 'figcaption' || className.includes('caption') || className.includes('photo-caption')) {
      semanticRole = 'Caption';
      purpose = 'Secondary caption, photo credit, or clarifying footnote';
      importance = 'low';
      seoRelevance = 'supplementary';
      visualPriority = 'caption-p4';
      evidence.push(`Explicit <figcaption> tag or caption class "${className}"`);
    }
    // 6. Metadata Classification (Time, Author, Date, Reading Time)
    else if (
      tag === 'time' ||
      tag === 'address' ||
      className.includes('meta') ||
      className.includes('author') ||
      /\b(\d+\s*min read|published on|author:)\b/i.test(trimmedText)
    ) {
      semanticRole = 'Metadata';
      purpose = 'Publication metadata, article author, date timestamp, or reading time';
      importance = 'low';
      seoRelevance = 'supplementary';
      visualPriority = 'caption-p4';
      evidence.push('Semantic <time>/<address> tag or publication metadata class');
    }
    // 7. Breadcrumb Classification
    else if (
      ancestors.some((a) => (a.className || '').includes('breadcrumb') || a.role === 'breadcrumb' || (a.id && a.id.includes('breadcrumb'))) ||
      className.includes('breadcrumb')
    ) {
      semanticRole = 'Breadcrumb';
      purpose = 'Hierarchical page location and trail navigation link';
      importance = 'medium';
      seoRelevance = 'metadata-nav';
      visualPriority = 'caption-p4';
      evidence.push('Element located within breadcrumb navigation ancestor');
    }
    // 8. Legal & Copyright Classification
    else if (
      /^(©|copyright|all rights reserved|privacy policy|terms of (service|use)|disclaimer|cookie policy)/i.test(trimmedText) ||
      className.includes('legal') ||
      className.includes('copyright')
    ) {
      semanticRole = 'Legal';
      purpose = 'Legal disclaimer, copyright notice, terms of use, and compliance information';
      importance = 'low';
      seoRelevance = 'none';
      visualPriority = 'caption-p4';
      evidence.push(`Matched legal terms, copyright symbol, or legal container class`);
    }
    // 9. Footer Classification
    else if (ancestors.some((a) => a.tagName === 'footer' || a.role === 'contentinfo' || (a.id && a.id.includes('footer')))) {
      semanticRole = 'Footer';
      purpose = 'Footer navigation link, directory entry, or bottom-of-page information';
      importance = 'low';
      seoRelevance = 'metadata-nav';
      visualPriority = 'caption-p4';
      evidence.push('Element contained within <footer> or role="contentinfo"');
    }
    // 10. Navigation Classification
    else if (
      ancestors.some((a) => a.tagName === 'nav' || a.role === 'navigation' || (a.className || '').includes('navbar') || (a.id && a.id.includes('nav'))) ||
      roleAttr === 'menuitem'
    ) {
      semanticRole = 'Navigation';
      purpose = 'Global site navigation, header routing, or menu item link';
      importance = 'high';
      seoRelevance = 'metadata-nav';
      visualPriority = 'body-p3';
      evidence.push('Element inside <nav> landmark or role="navigation"');
    }
    // 11. Promotion Classification
    else if (
      /\b(save \d+%|\d+% off|limited time offer|special offer|promo code|discount|exclusive deal)\b/i.test(trimmedText) ||
      className.includes('promo') ||
      className.includes('discount') ||
      className.includes('banner')
    ) {
      semanticRole = 'Promotion';
      purpose = 'Marketing promotion, discount incentive, or seasonal announcement';
      importance = 'high';
      seoRelevance = 'supplementary';
      visualPriority = 'headline-p2';
      evidence.push('Matched promotional discount terms or promo banner styling');
    }
    // 12. Testimonial Classification
    else if (
      tag === 'blockquote' ||
      tag === 'q' ||
      className.includes('testimonial') ||
      className.includes('quote') ||
      ancestors.some((a) => (a.className || '').includes('testimonial') || (a.className || '').includes('review-card'))
    ) {
      semanticRole = 'Testimonial';
      purpose = 'Customer testimonial quote, user endorsement, and authentic feedback';
      importance = 'medium';
      seoRelevance = 'body-content';
      visualPriority = 'body-p3';
      evidence.push('Semantic <blockquote> tag or testimonial container class');
    }
    // 13. FAQ Classification
    else if (
      ancestors.some((a) => a.tagName === 'details' || (a.className || '').includes('faq') || (a.className || '').includes('accordion')) ||
      /\b(what is|how do|how does|can i|why should|where can|is there)\b.*\?/i.test(trimmedText)
    ) {
      semanticRole = 'FAQ';
      purpose = 'Frequently asked question or collapsible help topic';
      importance = 'medium';
      seoRelevance = 'body-content';
      visualPriority = 'body-p3';
      evidence.push('Question pattern or FAQ/accordion container context');
    }
    // 14. Specification Classification
    else if (
      ancestors.some((a) => a.tagName === 'dl' || a.tagName === 'table' || (a.className || '').includes('spec')) ||
      /^[A-Za-z\s]+:\s*[\w\d\s\.\,\/]+$/.test(trimmedText)
    ) {
      semanticRole = 'Specification';
      purpose = 'Technical specification, attribute metric, or product dimension key-value pair';
      importance = 'medium';
      seoRelevance = 'body-content';
      visualPriority = 'caption-p4';
      evidence.push('Key-value spec syntax or <dl>/<table> container structure');
    }
    // 15. Feature Classification
    else if (
      (ancestors.some((a) => (a.className || '').includes('feature') || (a.className || '').includes('benefit')) && tag === 'li') ||
      /^([✓✔•]\s+|[0-9]+\.\s+)/.test(trimmedText)
    ) {
      semanticRole = 'Feature';
      purpose = 'Key product feature bullet, capability highlight, or benefit item';
      importance = 'high';
      seoRelevance = 'body-content';
      visualPriority = 'body-p3';
      evidence.push('Feature list item or checkmark bullet structure');
    }
    // 16. Metadata Classification
    else if (
      tag === 'time' ||
      tag === 'address' ||
      className.includes('meta') ||
      className.includes('author') ||
      /\b(\d+\s*min read|published on|author:)\b/i.test(trimmedText)
    ) {
      semanticRole = 'Metadata';
      purpose = 'Publication metadata, article author, date timestamp, or reading time';
      importance = 'low';
      seoRelevance = 'supplementary';
      visualPriority = 'caption-p4';
      evidence.push('Semantic <time>/<address> tag or publication metadata class');
    }
    // 17. Category Classification
    else if (className.includes('category') || className.includes('topic') || className.includes('kicker')) {
      semanticRole = 'Category';
      purpose = 'Content taxonomy, category header, or topic classification';
      importance = 'medium';
      seoRelevance = 'metadata-nav';
      visualPriority = 'caption-p4';
      evidence.push('Category/topic descriptor class');
    }
    // 18. Product Name Classification
    else if (
      ancestors.some((a) => (a.className || '').includes('product') || (a.className || '').includes('item-card')) &&
      (tag === 'h2' || tag === 'h3' || className.includes('title') || className.includes('name'))
    ) {
      semanticRole = 'Product Name';
      purpose = 'Product catalog name, model title, or item identifier';
      importance = 'high';
      seoRelevance = 'heading-secondary';
      visualPriority = 'headline-p2';
      evidence.push('Heading/title node contained within product catalog card');
    }
    // 17. Headline Classification (H1, H2, Hero Title)
    else if (tag === 'h1' || tag === 'h2' || fontSizePx >= 28 || (fontSizePx >= 24 && fontWeight >= 700)) {
      semanticRole = 'Headline';
      purpose = 'Primary page title or major section headline';
      importance = 'critical';
      seoRelevance = tag === 'h1' ? 'h1-primary-keyword' : 'heading-secondary';
      visualPriority = 'display-p1';
      evidence.push(`Semantic heading <${tag}> with prominent computed font-size ${fontSizePx}px / weight ${fontWeight}`);
    }
    // 18. Subheadline Classification (H3, H4, Subtitles)
    else if (tag === 'h3' || tag === 'h4' || className.includes('subtitle') || (fontSizePx >= 18 && fontSizePx < 28 && fontWeight >= 600)) {
      semanticRole = 'Subheadline';
      purpose = 'Supporting section subheadline, subsection header, or card title';
      importance = 'high';
      seoRelevance = 'heading-secondary';
      visualPriority = 'headline-p2';
      evidence.push(`Semantic heading <${tag}> or subtitle typography styling`);
    }
    // 19. Caption Classification (<small>, <figcaption>, sub-text)
    else if (tag === 'small' || tag === 'figcaption' || className.includes('caption') || fontSizePx < 13) {
      semanticRole = 'Caption';
      purpose = 'Secondary caption, footnote, or clarifying annotation';
      importance = 'low';
      seoRelevance = 'supplementary';
      visualPriority = 'caption-p4';
      evidence.push(`Semantic <${tag}> tag or fine-print typography size (${fontSizePx}px)`);
    }
    // 20. Body Paragraph (Default)
    else {
      semanticRole = 'Body';
      purpose = 'Primary descriptive body paragraph and narrative text';
      importance = 'medium';
      seoRelevance = 'body-content';
      visualPriority = 'body-p3';
      evidence.push(`Standard descriptive paragraph text node <${tag}>`);
    }

    const selector = el.className ? `.${el.className.split(' ')[0]}` : tag;

    return {
      elementId: el.id,
      selector,
      text,
      trimmedText,
      semanticRole,
      purpose,
      importance,
      seoRelevance,
      visualPriority,
      typographyRef: el.typography ? {
        fontSize: el.typography.fontSize,
        fontWeight: el.typography.fontWeight,
        lineHeight: el.typography.lineHeight,
      } : undefined,
      browserEvidence: evidence,
    };
  }

  private getAncestors(el: RawElementNode, elementMap: Map<string, RawElementNode>): RawElementNode[] {
    const ancestors: RawElementNode[] = [];
    let current = el.parentId ? elementMap.get(el.parentId) : undefined;
    let depth = 0;
    while (current && depth < 10) {
      ancestors.push(current);
      current = current.parentId ? elementMap.get(current.parentId) : undefined;
      depth++;
    }
    return ancestors;
  }
}

/**
 * Functional helper for quick execution.
 */
export function buildContentSemanticSpecification(data: AnalyzePageResponseData): ContentSemanticSpecification {
  return new ContentSemanticEngine().normalize(data);
}
