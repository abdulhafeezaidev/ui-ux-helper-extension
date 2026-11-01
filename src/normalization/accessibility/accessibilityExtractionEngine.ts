import {
  AnalyzePageResponseData,
  RawElementNode,
} from '../../types/index.ts';

export interface LandmarkItem {
  id: string;
  role: string; // 'banner' | 'navigation' | 'main' | 'complementary' | 'contentinfo' | 'search' | 'region'
  tagName: string;
  accessibleName: string;
  elementId: string;
  selector: string;
}

export interface HeadingItem {
  elementId: string;
  level: number; // 1 to 6
  text: string;
  isValidOrder: boolean;
  skippedLevel?: number;
}

export interface TabOrderItem {
  orderIndex: number;
  elementId: string;
  tagName: string;
  role: string;
  tabIndex: number;
  accessibleName: string;
  selector: string;
}

export interface FocusTrapSpec {
  containerId: string;
  role: string; // 'dialog' | 'drawer' | 'menu'
  triggerElementId?: string;
  initialFocusElementId?: string;
  escapeKeyCloses: boolean;
  returnFocusElementId?: string;
  isTrapped: boolean;
}

export interface KeyboardInteractionPattern {
  patternName: string;
  targetRoleOrComponent: string;
  keyBindings: {
    keys: string[];
    action: string;
    description: string;
  }[];
}

export interface SemanticHtmlAudit {
  totalElementsAnalyzed: number;
  semanticElementsCount: number;
  semanticRatio: number; // 0 to 1
  divButtonAntiPatterns: { elementId: string; selector: string; suggestion: string }[];
  missingAltImages: { elementId: string; selector: string }[];
  unlabeledFormControls: { elementId: string; selector: string }[];
}

export interface AccessibilityExtractionSystem {
  $schema: string;
  version: string;
  wcagConformance: {
    targetLevel: 'AA' | 'AAA';
    score: number; // 0 to 100
    status: 'pass' | 'needs-review' | 'fail';
  };
  summary: {
    totalLandmarks: number;
    totalHeadings: number;
    totalTabbableElements: number;
    totalFocusTraps: number;
    headingHierarchyValid: boolean;
  };
  landmarks: LandmarkItem[];
  headingHierarchy: {
    hasH1: boolean;
    totalHeadings: number;
    isSequential: boolean;
    outline: HeadingItem[];
  };
  tabOrder: {
    totalTabbable: number;
    hasPositiveTabIndexWarning: boolean;
    sequence: TabOrderItem[];
    chain?: TabOrderItem[];
  };
  focusTraps: FocusTrapSpec[];
  keyboardInteractions: KeyboardInteractionPattern[];
  semanticHtmlAudit: SemanticHtmlAudit;
  metadata: {
    generatedAt: string;
    pageTitle?: string;
    pageUrl?: string;
  };
}

/**
 * Builds the comprehensive Accessibility Semantics Extraction System for Prompt 25.
 */
export function buildAccessibilityExtractionSystem(data: AnalyzePageResponseData): AccessibilityExtractionSystem {
  const elements = data.extractionResult?.elements || [];

  const getSelector = (el: RawElementNode) => {
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.split(' ').filter(Boolean).slice(0, 2).join('.');
      return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
    }
    return el.tagName.toLowerCase();
  };

  const getAccessibleName = (el: RawElementNode): string => {
    if (el.interactive?.ariaLabel) return el.interactive.ariaLabel;
    if (el.textMeta?.trimmedText) return el.textMeta.trimmedText.substring(0, 60);
    if (el.assetProps?.alt) return el.assetProps.alt;
    return el.tagName.toLowerCase();
  };

  // -------------------------------------------------------------
  // 1. LANDMARK EXTRACTION
  // -------------------------------------------------------------
  const landmarks: LandmarkItem[] = [];
  elements.forEach((el, idx) => {
    const tag = el.tagName.toLowerCase();
    const role = el.interactive?.ariaRole || el.role;

    let landmarkRole: string | null = null;
    if (tag === 'header' || role === 'banner') landmarkRole = 'banner';
    else if (tag === 'nav' || role === 'navigation') landmarkRole = 'navigation';
    else if (tag === 'main' || role === 'main') landmarkRole = 'main';
    else if (tag === 'aside' || role === 'complementary') landmarkRole = 'complementary';
    else if (tag === 'footer' || role === 'contentinfo') landmarkRole = 'contentinfo';
    else if (role === 'search' || (tag === 'form' && el.className?.includes('search'))) landmarkRole = 'search';
    else if (tag === 'section' && (el.interactive?.ariaLabel || el.className?.includes('section'))) landmarkRole = 'region';

    if (landmarkRole) {
      landmarks.push({
        id: `landmark_${idx + 1}`,
        role: landmarkRole,
        tagName: tag,
        accessibleName: getAccessibleName(el) || `${landmarkRole} region`,
        elementId: el.id,
        selector: getSelector(el),
      });
    }
  });

  // Default synthetic landmarks if none explicitly matched
  if (landmarks.length === 0 && elements.length > 0) {
    landmarks.push({
      id: 'landmark_default_main',
      role: 'main',
      tagName: 'main',
      accessibleName: 'Main Content',
      elementId: elements[0].id,
      selector: getSelector(elements[0]),
    });
  }

  // -------------------------------------------------------------
  // 2. HEADING HIERARCHY EXTRACTION
  // -------------------------------------------------------------
  const headingElements = elements.filter((e) =>
    /^h[1-6]$/i.test(e.tagName) || e.interactive?.ariaRole === 'heading'
  );

  let prevLevel = 0;
  let isSequential = true;
  const outline: HeadingItem[] = headingElements.map((h) => {
    let level = 2;
    const match = h.tagName.toLowerCase().match(/^h([1-6])$/);
    if (match) {
      level = parseInt(match[1], 10);
    }

    let isValidOrder = true;
    let skippedLevel: number | undefined;

    if (prevLevel > 0 && level > prevLevel + 1) {
      isValidOrder = false;
      skippedLevel = prevLevel + 1;
      isSequential = false;
    }

    prevLevel = level;

    return {
      elementId: h.id,
      level,
      text: h.textMeta?.trimmedText || `Heading Level ${level}`,
      isValidOrder,
      skippedLevel,
    };
  });

  const hasH1 = outline.some((h) => h.level === 1);

  // -------------------------------------------------------------
  // 3. TAB ORDER & FOCUSABLE CHAIN
  // -------------------------------------------------------------
  const focusableTags = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary', 'details']);
  const tabbableNodes = elements.filter((e) => {
    const tag = e.tagName.toLowerCase();
    const tabIdx = e.interactive?.tabIndex;

    if (tabIdx !== undefined && tabIdx !== null) {
      return tabIdx >= 0;
    }
    if (focusableTags.has(tag)) {
      return true;
    }
    if (e.interactive?.isClickable) {
      return true;
    }
    return false;
  });

  let hasPositiveTabIndexWarning = false;
  const tabSequence: TabOrderItem[] = tabbableNodes.map((el, idx) => {
    const tabIdx = el.interactive?.tabIndex ?? 0;
    if (tabIdx > 0) hasPositiveTabIndexWarning = true;

    return {
      orderIndex: idx + 1,
      elementId: el.id,
      tagName: el.tagName.toLowerCase(),
      role: el.interactive?.ariaRole || el.tagName.toLowerCase(),
      tabIndex: tabIdx,
      accessibleName: getAccessibleName(el),
      selector: getSelector(el),
    };
  });

  // -------------------------------------------------------------
  // 4. FOCUS TRAPS (Modals & Drawers)
  // -------------------------------------------------------------
  const focusTraps: FocusTrapSpec[] = [];
  const modalOrDrawerElements = elements.filter((e) =>
    typeof e.className === 'string' &&
    (e.className.includes('modal') || e.className.includes('dialog') || e.className.includes('drawer'))
  );

  modalOrDrawerElements.forEach((container) => {
    const role = container.className?.includes('drawer') ? 'drawer' : 'dialog';
    const closeBtn = elements.find((e) =>
      e.parentId === container.id &&
      (e.tagName.toLowerCase() === 'button' || (typeof e.className === 'string' && e.className.includes('close')))
    );

    focusTraps.push({
      containerId: container.id,
      role,
      triggerElementId: elements.find((e) => e.tagName.toLowerCase() === 'button')?.id,
      initialFocusElementId: closeBtn ? closeBtn.id : container.id,
      escapeKeyCloses: true,
      returnFocusElementId: elements[0]?.id,
      isTrapped: true,
    });
  });

  // -------------------------------------------------------------
  // 5. KEYBOARD INTERACTIONS SPECIFICATION
  // -------------------------------------------------------------
  const keyboardInteractions: KeyboardInteractionPattern[] = [
    {
      patternName: 'Button & CTA Trigger',
      targetRoleOrComponent: 'button, [role="button"], a.btn',
      keyBindings: [
        { keys: ['Enter', 'Space'], action: 'triggerClick', description: 'Executes the primary button action' },
      ],
    },
    {
      patternName: 'Tab Navigation Switcher',
      targetRoleOrComponent: '[role="tablist"] > [role="tab"]',
      keyBindings: [
        { keys: ['ArrowRight', 'ArrowLeft'], action: 'switchActiveTab', description: 'Moves focus and activates next/previous tab' },
        { keys: ['Home', 'End'], action: 'jumpToFirstOrLastTab', description: 'Jumps directly to the first or last tab' },
      ],
    },
    {
      patternName: 'Modal & Flyout Dismissal',
      targetRoleOrComponent: '[role="dialog"], .modal, .drawer-panel',
      keyBindings: [
        { keys: ['Escape'], action: 'closeAndReturnFocus', description: 'Closes dialog and restores focus to trigger element' },
        { keys: ['Tab', 'Shift+Tab'], action: 'trapFocusWithinModal', description: 'Cycles keyboard focus strictly inside container' },
      ],
    },
    {
      patternName: 'Collapsible Accordion Item',
      targetRoleOrComponent: '.accordion-header, [aria-expanded]',
      keyBindings: [
        { keys: ['Enter', 'Space'], action: 'toggleExpandCollapse', description: 'Expands or collapses accordion section' },
        { keys: ['ArrowDown', 'ArrowUp'], action: 'focusNextAccordionHeader', description: 'Moves focus between accordion item headers' },
      ],
    },
  ];

  // -------------------------------------------------------------
  // 6. SEMANTIC HTML & ACCESSIBILITY AUDIT
  // -------------------------------------------------------------
  const semanticTags = new Set([
    'header', 'nav', 'main', 'article', 'section', 'aside', 'footer',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'button', 'a', 'form',
    'input', 'select', 'textarea', 'label', 'figure', 'figcaption', 'ul', 'ol', 'li',
  ]);

  let semanticCount = 0;
  const divButtonAntiPatterns: { elementId: string; selector: string; suggestion: string }[] = [];
  const missingAltImages: { elementId: string; selector: string }[] = [];
  const unlabeledFormControls: { elementId: string; selector: string }[] = [];

  elements.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (semanticTags.has(tag)) {
      semanticCount++;
    }

    // Div/Span with click handler anti-pattern
    if ((tag === 'div' || tag === 'span') && el.interactive?.isClickable && !el.interactive?.ariaRole) {
      divButtonAntiPatterns.push({
        elementId: el.id,
        selector: getSelector(el),
        suggestion: 'Replace non-semantic <div>/<span> clickable container with native <button> or add role="button" and tabindex="0".',
      });
    }

    // Image without alt attribute
    if (tag === 'img' && (!el.assetProps?.alt || el.assetProps.alt.trim() === '')) {
      missingAltImages.push({
        elementId: el.id,
        selector: getSelector(el),
      });
    }

    // Form inputs without label
    if ((tag === 'input' || tag === 'select' || tag === 'textarea') && !el.interactive?.ariaLabel) {
      unlabeledFormControls.push({
        elementId: el.id,
        selector: getSelector(el),
      });
    }
  });

  const totalElements = elements.length || 1;
  const semanticRatio = parseFloat((semanticCount / totalElements).toFixed(3));

  let wcagScore = 95;
  if (!hasH1) wcagScore -= 10;
  if (!isSequential) wcagScore -= 5;
  if (divButtonAntiPatterns.length > 0) wcagScore -= Math.min(15, divButtonAntiPatterns.length * 3);
  if (missingAltImages.length > 0) wcagScore -= Math.min(10, missingAltImages.length * 2);
  wcagScore = Math.max(50, wcagScore);

  return {
    $schema: 'https://ui-ux-helper.internal/schemas/accessibility-v1.json',
    version: '1.0.0',
    wcagConformance: {
      targetLevel: 'AA',
      score: wcagScore,
      status: wcagScore >= 80 ? 'pass' : 'needs-review',
    },
    summary: {
      totalLandmarks: landmarks.length,
      totalHeadings: outline.length,
      totalTabbableElements: tabSequence.length,
      totalFocusTraps: focusTraps.length,
      headingHierarchyValid: hasH1 && isSequential,
    },
    landmarks,
    headingHierarchy: {
      hasH1,
      totalHeadings: outline.length,
      isSequential,
      outline,
    },
    tabOrder: {
      totalTabbable: tabSequence.length,
      hasPositiveTabIndexWarning,
      sequence: tabSequence,
      chain: tabSequence,
    },
    focusTraps,
    keyboardInteractions,
    semanticHtmlAudit: {
      totalElementsAnalyzed: totalElements,
      semanticElementsCount: semanticCount,
      semanticRatio,
      divButtonAntiPatterns,
      missingAltImages,
      unlabeledFormControls,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      pageTitle: data.title,
      pageUrl: data.pageUrl,
    },
  };
}
