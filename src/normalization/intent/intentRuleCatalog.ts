import { IntentDomain, RawElementNode, CanonicalComponentDefinition } from '../../types/index.ts';

export interface IntentRule {
  intentId: string;
  name: string;
  domain: IntentDomain;
  description: string;
  rationale: string;
  defaultCssProperties: Record<string, string | number | boolean>;
  matchElement: (el: RawElementNode) => { matches: boolean; confidence: number; matchedProps: Record<string, any> };
  matchComponent?: (comp: CanonicalComponentDefinition) => { matches: boolean; confidence: number; matchedProps: Record<string, any> };
}

/**
 * Catalog of declarative UX/UI Intent inference rules.
 * Infers the semantic "why" behind CSS declarations.
 */
export const INTENT_RULE_CATALOG: IntentRule[] = [
  // --------------------------------------------------------------------------
  // 1. Shape Intent Rules
  // --------------------------------------------------------------------------
  {
    intentId: 'intent_shape_pill_button',
    name: 'Pill Button',
    domain: 'shape',
    description: 'Ultra-rounded pill boundary with semi-circular caps.',
    rationale: 'Creates an approachable, friendly touch target that maximizes visual affordance and clickability.',
    defaultCssProperties: { 'border-radius': '999px' },
    matchElement: (el: RawElementNode) => {
      const radiusTopLeft = parseFloat(el.borderRadius?.topLeft || '0') || 0;
      const isPillRadius = radiusTopLeft >= 99 || el.borderRadius?.topLeft?.includes('999') || el.borderRadius?.topLeft?.includes('9999');
      const isButtonOrLink = el.tagName === 'BUTTON' || (el.className || '').toLowerCase().includes('btn') || (el.role || '').toLowerCase() === 'button';

      if (isPillRadius && isButtonOrLink) {
        return {
          matches: true,
          confidence: 0.98,
          matchedProps: { 'border-radius': el.borderRadius?.topLeft || '999px', targetType: 'button' },
        };
      }
      if (isPillRadius) {
        return {
          matches: true,
          confidence: 0.88,
          matchedProps: { 'border-radius': el.borderRadius?.topLeft || '999px' },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
  {
    intentId: 'intent_shape_circular_avatar',
    name: 'Circular Avatar',
    domain: 'shape',
    description: 'Perfect 1:1 circular boundary for portrait or profile images.',
    rationale: 'Standardizes user representation and focuses attention on the facial center.',
    defaultCssProperties: { 'border-radius': '50%', 'aspect-ratio': '1 / 1' },
    matchElement: (el: RawElementNode) => {
      const isImg = el.tagName === 'IMG' || el.tagName === 'SVG' || (el.className || '').toLowerCase().includes('avatar');
      const radius = el.borderRadius?.topLeft || '';
      const is50Percent = radius === '50%' || parseFloat(radius) >= 99;
      const isSquare = el.boundingRect && Math.abs(el.boundingRect.width - el.boundingRect.height) <= 4;

      if (isImg && is50Percent) {
        return {
          matches: true,
          confidence: 0.95,
          matchedProps: { 'border-radius': radius, 'aspect-ratio': '1/1' },
        };
      }
      if (is50Percent && isSquare && el.boundingRect.width <= 120) {
        return {
          matches: true,
          confidence: 0.9,
          matchedProps: { 'border-radius': radius, dimensions: `${el.boundingRect.width}x${el.boundingRect.height}` },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
  {
    intentId: 'intent_shape_rounded_card',
    name: 'Rounded Surface Container',
    domain: 'shape',
    description: 'Subtle to medium curved corners (8px-24px) enclosing structured content.',
    rationale: 'Softens viewport geometry and establishes clean containment boundaries.',
    defaultCssProperties: { 'border-radius': '12px' },
    matchElement: (el: RawElementNode) => {
      const radius = parseFloat(el.borderRadius?.topLeft || '0') || 0;
      const isCardClass = (el.className || '').toLowerCase().includes('card') || (el.role || '').toLowerCase() === 'article';
      if (radius >= 8 && radius <= 24 && (isCardClass || (el.boxShadow && el.boxShadow !== 'none'))) {
        return {
          matches: true,
          confidence: 0.92,
          matchedProps: { 'border-radius': `${radius}px`, boxShadow: el.boxShadow || 'none' },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },

  // --------------------------------------------------------------------------
  // 2. Layout Intent Rules
  // --------------------------------------------------------------------------
  {
    intentId: 'intent_layout_center_content',
    name: 'Center Content',
    domain: 'layout',
    description: 'Bi-directional center alignment of inner children.',
    rationale: 'Horizontally and vertically centers content within the bounding container to create balance and symmetry.',
    defaultCssProperties: { display: 'flex', 'justify-content': 'center', 'align-items': 'center' },
    matchElement: (el: RawElementNode) => {
      const display = (el.display || '').toLowerCase();
      const layoutProps = (el as any).layoutProps || {};
      const justify = ((el as any).justifyContent || layoutProps.justifyContent || '').toLowerCase();
      const align = ((el as any).alignItems || layoutProps.alignItems || '').toLowerCase();

      const isFlexOrGrid = display.includes('flex') || display.includes('grid');
      const isCenterJustify = justify === 'center' || justify.includes('center');
      const isCenterAlign = align === 'center' || align.includes('center');

      if (isFlexOrGrid && isCenterJustify && isCenterAlign) {
        return {
          matches: true,
          confidence: 0.98,
          matchedProps: { display, 'justify-content': justify, 'align-items': align },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
  {
    intentId: 'intent_layout_4col_product_grid',
    name: '4-column Product Grid',
    domain: 'layout',
    description: 'Four equal-width track columns for dense item displays.',
    rationale: 'Maximizes browseable item density on desktop viewports while maintaining readable card proportions.',
    defaultCssProperties: { display: 'grid', 'grid-template-columns': 'repeat(4, 1fr)' },
    matchElement: (el: RawElementNode) => {
      const display = (el.display || '').toLowerCase();
      const layoutProps = (el as any).layoutProps || {};
      const gridCols = ((el as any).gridTemplateColumns || layoutProps.gridTemplateColumns || '').toLowerCase();

      const isGrid = display.includes('grid');
      const is4Col =
        gridCols.includes('repeat(4') ||
        gridCols.split(' ').filter(Boolean).length === 4 ||
        gridCols.includes('1fr 1fr 1fr 1fr');

      if (isGrid && is4Col) {
        return {
          matches: true,
          confidence: 0.96,
          matchedProps: { display: 'grid', 'grid-template-columns': gridCols },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
  {
    intentId: 'intent_layout_3col_feature_grid',
    name: '3-column Feature Grid',
    domain: 'layout',
    description: 'Triad column arrangement for core value propositions.',
    rationale: 'Presents three high-priority features or offerings side-by-side with optimal reading width.',
    defaultCssProperties: { display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)' },
    matchElement: (el: RawElementNode) => {
      const display = (el.display || '').toLowerCase();
      const layoutProps = (el as any).layoutProps || {};
      const gridCols = ((el as any).gridTemplateColumns || layoutProps.gridTemplateColumns || '').toLowerCase();

      const isGrid = display.includes('grid');
      const is3Col =
        gridCols.includes('repeat(3') ||
        gridCols.split(' ').filter(Boolean).length === 3 ||
        gridCols.includes('1fr 1fr 1fr');

      if (isGrid && is3Col) {
        return {
          matches: true,
          confidence: 0.95,
          matchedProps: { display: 'grid', 'grid-template-columns': gridCols },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
  {
    intentId: 'intent_layout_split_navigation',
    name: 'Split Navigation Bar',
    domain: 'layout',
    description: 'Edge-to-edge space distribution between brand and action links.',
    rationale: 'Anchors brand logo to the leading edge and utility actions to the trailing edge across the full header width.',
    defaultCssProperties: { display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' },
    matchElement: (el: RawElementNode) => {
      const display = (el.display || '').toLowerCase();
      const layoutProps = (el as any).layoutProps || {};
      const justify = ((el as any).justifyContent || layoutProps.justifyContent || '').toLowerCase();
      const align = ((el as any).alignItems || layoutProps.alignItems || '').toLowerCase();
      const isNav = el.tagName === 'NAV' || el.tagName === 'HEADER' || (el.className || '').toLowerCase().includes('nav');

      if (display.includes('flex') && justify.includes('space-between') && (align.includes('center') || isNav)) {
        return {
          matches: true,
          confidence: 0.94,
          matchedProps: { display: 'flex', 'justify-content': 'space-between', 'align-items': align || 'center' },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
  {
    intentId: 'intent_layout_vertical_stack',
    name: 'Vertical Content Stack',
    domain: 'layout',
    description: 'Columnar flow with uniform gap spacing.',
    rationale: 'Establishes clear downward scanning rhythm for textual and form elements.',
    defaultCssProperties: { display: 'flex', 'flex-direction': 'column' },
    matchElement: (el: RawElementNode) => {
      const display = (el.display || '').toLowerCase();
      const layoutProps = (el as any).layoutProps || {};
      const flexDir = ((el as any).flexDirection || layoutProps.flexDirection || '').toLowerCase();

      if (display.includes('flex') && flexDir.includes('column')) {
        return {
          matches: true,
          confidence: 0.9,
          matchedProps: { display: 'flex', 'flex-direction': 'column' },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },

  // --------------------------------------------------------------------------
  // 3. Spacing Intent Rules
  // --------------------------------------------------------------------------
  {
    intentId: 'intent_spacing_section_vertical_rhythm',
    name: 'Section Vertical Rhythm',
    domain: 'spacing',
    description: 'Generous vertical padding (>= 64px) framing major page sections.',
    rationale: 'Creates prominent thematic breathing room between major narrative sections of the page.',
    defaultCssProperties: { 'padding-top': '80px', 'padding-bottom': '80px' },
    matchElement: (el: RawElementNode) => {
      const paddingTop = parseFloat(el.padding?.top || '0') || 0;
      const paddingBottom = parseFloat(el.padding?.bottom || '0') || 0;
      const isSection =
        el.tagName === 'SECTION' ||
        el.tagName === 'MAIN' ||
        (el.className || '').toLowerCase().includes('section') ||
        (el.className || '').toLowerCase().includes('hero') ||
        (el.role || '').toLowerCase() === 'region';

      if ((paddingTop >= 64 || paddingBottom >= 64) && (isSection || paddingTop >= 80)) {
        return {
          matches: true,
          confidence: 0.95,
          matchedProps: { 'padding-top': `${paddingTop}px`, 'padding-bottom': `${paddingBottom}px`, targetType: 'section' },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
  {
    intentId: 'intent_spacing_touch_target_action',
    name: 'Touch Target Padding',
    domain: 'spacing',
    description: 'Ergonomic padding ensuring comfortable click and tap target.',
    rationale: 'Satisfies WCAG touch target recommendations and gives action buttons visual presence.',
    defaultCssProperties: { padding: '9px 14px' },
    matchElement: (el: RawElementNode) => {
      const isButton = el.tagName === 'BUTTON' || (el.className || '').toLowerCase().includes('btn');
      const paddingTop = parseFloat(el.padding?.top || '0') || 0;
      const paddingRight = parseFloat(el.padding?.right || '0') || 0;

      if (isButton && paddingTop >= 6 && paddingTop <= 20 && paddingRight >= 10 && paddingRight <= 36) {
        return {
          matches: true,
          confidence: 0.92,
          matchedProps: { padding: `${paddingTop}px ${paddingRight}px` },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
  {
    intentId: 'intent_spacing_card_content_inset',
    name: 'Card Content Inset',
    domain: 'spacing',
    description: 'Internal gutter (16px-32px) separating card border from internal text and media.',
    rationale: 'Prevents internal content from colliding with card borders and maintains reading comfort.',
    defaultCssProperties: { padding: '16px' },
    matchElement: (el: RawElementNode) => {
      const isCard = (el.className || '').toLowerCase().includes('card') || (el.role || '').toLowerCase() === 'article';
      const paddingTop = parseFloat(el.padding?.top || '0') || 0;

      if (isCard && paddingTop >= 12 && paddingTop <= 36) {
        return {
          matches: true,
          confidence: 0.9,
          matchedProps: { padding: `${paddingTop}px` },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },

  // --------------------------------------------------------------------------
  // 4. Typography Intent Rules
  // --------------------------------------------------------------------------
  {
    intentId: 'intent_typography_hero_heading',
    name: 'Primary Hero Heading',
    domain: 'typography',
    description: 'Large, prominent display title (>= 40px, bold/heavy weight).',
    rationale: 'Instantly communicates the core value proposition above the fold with authoritative visual weight.',
    defaultCssProperties: { 'font-size': '48px', 'font-weight': '700' },
    matchElement: (el: RawElementNode) => {
      const fontSize = parseFloat(el.typography?.fontSize || '0') || 0;
      const fontWeight = parseInt(`${el.typography?.fontWeight || '400'}`, 10) || 400;
      const isH1 = el.tagName === 'H1' || (el.role || '').toLowerCase() === 'heading';

      if ((fontSize >= 40 && fontWeight >= 600) || (isH1 && (fontSize >= 32 || fontWeight >= 700))) {
        return {
          matches: true,
          confidence: 0.96,
          matchedProps: { 'font-size': `${fontSize}px`, 'font-weight': fontWeight, tagName: el.tagName },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
  {
    intentId: 'intent_typography_section_title',
    name: 'Section Title',
    domain: 'typography',
    description: 'Medium-large section heading (24px-36px, semibold/bold).',
    rationale: 'Establishes clear thematic section dividers for rapid vertical scanning.',
    defaultCssProperties: { 'font-size': '28px', 'font-weight': '600' },
    matchElement: (el: RawElementNode) => {
      const fontSize = parseFloat(el.typography?.fontSize || '0') || 0;
      const fontWeight = parseInt(`${el.typography?.fontWeight || '400'}`, 10) || 400;
      const isH2H3 = el.tagName === 'H2' || el.tagName === 'H3';

      if (fontSize >= 22 && fontSize < 40 && (fontWeight >= 600 || isH2H3)) {
        return {
          matches: true,
          confidence: 0.91,
          matchedProps: { 'font-size': `${fontSize}px`, 'font-weight': fontWeight, tagName: el.tagName },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
  {
    intentId: 'intent_typography_readable_body',
    name: 'Readable Prose Body',
    domain: 'typography',
    description: 'Standard body typography optimized for reading cadence.',
    rationale: 'Ensures legible paragraph text with comfortable font size and line height.',
    defaultCssProperties: { 'font-size': '14px', 'font-weight': '400', 'line-height': '1.5' },
    matchElement: (el: RawElementNode) => {
      const fontSize = parseFloat(el.typography?.fontSize || '0') || 0;
      const fontWeight = parseInt(`${el.typography?.fontWeight || '400'}`, 10) || 400;
      const isP = el.tagName === 'P' || el.tagName === 'SPAN';

      if (fontSize >= 13 && fontSize <= 18 && fontWeight <= 500 && isP) {
        return {
          matches: true,
          confidence: 0.88,
          matchedProps: { 'font-size': `${fontSize}px`, 'font-weight': fontWeight },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
  {
    intentId: 'intent_typography_eyebrow_badge',
    name: 'Eyebrow Category Label',
    domain: 'typography',
    description: 'Uppercase micro-label (11px-13px, bold/semibold) providing category context.',
    rationale: 'Gives instant category taxonomy context above headlines without cluttering main titles.',
    defaultCssProperties: { 'font-size': '12px', 'font-weight': '600', 'text-transform': 'uppercase' },
    matchElement: (el: RawElementNode) => {
      const fontSize = parseFloat(el.typography?.fontSize || '0') || 0;
      const textTransform = (el.typography?.textTransform || '').toLowerCase();
      const fontWeight = parseInt(`${el.typography?.fontWeight || '400'}`, 10) || 400;
      const isBadge = (el.className || '').toLowerCase().includes('badge') || (el.className || '').toLowerCase().includes('tag');

      if ((fontSize <= 13 && (textTransform === 'uppercase' || isBadge)) || (isBadge && fontWeight >= 600)) {
        return {
          matches: true,
          confidence: 0.93,
          matchedProps: { 'font-size': `${fontSize}px`, 'text-transform': textTransform, 'font-weight': fontWeight },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },

  // --------------------------------------------------------------------------
  // 5. Hierarchy & Interaction Intent Rules
  // --------------------------------------------------------------------------
  {
    intentId: 'intent_hierarchy_primary_cta',
    name: 'Primary Call To Action',
    domain: 'hierarchy',
    description: 'High-contrast conversion button driving the primary user goal.',
    rationale: 'Draws immediate focal point to the highest-priority conversion action on the screen.',
    defaultCssProperties: { 'background-color': 'var(--color-primary)', color: '#ffffff', 'font-weight': '600' },
    matchElement: (el: RawElementNode) => {
      const isButton = el.tagName === 'BUTTON' || (el.className || '').toLowerCase().includes('btn');
      const isPrimaryClass = (el.className || '').toLowerCase().includes('primary') || (el.className || '').toLowerCase().includes('cta');
      const bg = el.backgroundColor || '';

      if (isButton && (isPrimaryClass || (bg && bg !== 'transparent' && bg !== '#ffffff' && bg !== 'rgb(255, 255, 255)'))) {
        return {
          matches: true,
          confidence: 0.95,
          matchedProps: { target: 'button', isPrimary: true, backgroundColor: bg },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
  {
    intentId: 'intent_hierarchy_interactive_card_lift',
    name: 'Interactive Card Lift',
    domain: 'interaction',
    description: 'Elevation shadow and interactive feedback affordance on surface card.',
    rationale: 'Provides dynamic tactile response confirming clickable card boundaries.',
    defaultCssProperties: { cursor: 'pointer', 'box-shadow': '0 4px 14px rgba(0,0,0,0.08)' },
    matchElement: (el: RawElementNode) => {
      const isCard = (el.className || '').toLowerCase().includes('card') || (el.role || '').toLowerCase() === 'article';
      const hasShadow = Boolean(el.boxShadow && el.boxShadow !== 'none');
      const isClickable = el.interactive?.isClickable || el.interactive?.cursor === 'pointer';

      if (isCard && (hasShadow || isClickable)) {
        return {
          matches: true,
          confidence: 0.89,
          matchedProps: { hasShadow, isClickable: Boolean(isClickable) },
        };
      }
      return { matches: false, confidence: 0, matchedProps: {} };
    },
  },
];
