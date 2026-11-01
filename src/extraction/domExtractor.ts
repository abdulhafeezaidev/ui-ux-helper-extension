import {
  RawElementNode,
  RawExtractionResult,
  PageMetadata,
} from '../types/schema.ts';
import { ExtractionOptions, Extractor } from './index.ts';

const NON_VISUAL_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'HEAD',
  'META',
  'LINK',
  'TITLE',
  'NOSCRIPT',
  'TEMPLATE',
  'BASE',
  'HTML',
]);

export class DomExtractor implements Extractor<Element | Document, RawExtractionResult> {
  public readonly name = 'DomExtractor';

  /**
   * Main extraction entry point.
   */
  public extract(
    target: Element | Document = document.body,
    options: ExtractionOptions = {}
  ): RawExtractionResult {
    const rootElement =
      target.nodeType === Node.DOCUMENT_NODE
        ? (target as Document).body || (target as Document).documentElement
        : (target as Element);

    if (!rootElement) {
      throw new Error('Target element or document.body is not available for extraction');
    }

    const includeHidden = options.includeHidden ?? true;
    const elementMap = new Map<Element, string>();
    const extractedNodes: RawElementNode[] = [];
    const parentChildMap = new Map<string, string[]>();

    let idCounter = 1;

    // First Pass: Collect candidate visual elements and assign deterministic IDs
    const candidateElements: Element[] = [];
    const traverse = (node: Element) => {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return;

      const tagName = node.tagName.toUpperCase();
      if (NON_VISUAL_TAGS.has(tagName)) return;

      // Collapse internal SVG elements under SVG root
      const isInsideSvg = node.closest('svg') !== null && tagName !== 'SVG';
      if (isInsideSvg) return;

      const id = `el_${idCounter++}`;
      elementMap.set(node, id);
      candidateElements.push(node);
      parentChildMap.set(id, []);

      for (let i = 0; i < node.children.length; i++) {
        traverse(node.children[i]);
      }
    };

    traverse(rootElement);

    // Second Pass: Extract computed styles, bounding geometry, and tree relationships
    for (const el of candidateElements) {
      const id = elementMap.get(el)!;

      // Determine parent ID among extracted nodes
      let parentId: string | null = null;
      let parentIter = el.parentElement;
      while (parentIter) {
        if (elementMap.has(parentIter)) {
          parentId = elementMap.get(parentIter)!;
          parentChildMap.get(parentId)?.push(id);
          break;
        }
        parentIter = parentIter.parentElement;
      }

      const rawNode = this.inspectElement(el, id, parentId, options);

      if (includeHidden || rawNode.isVisible) {
        extractedNodes.push(rawNode);
      }
    }

    // Assign final childIds for extracted nodes
    for (const node of extractedNodes) {
      node.childIds = parentChildMap.get(node.id) || [];
    }

    const win = rootElement.ownerDocument.defaultView || window;
    const pageMeta: PageMetadata = {
      url: win.location?.href || '',
      title: rootElement.ownerDocument.title || '',
      viewport: {
        width: win.innerWidth || 0,
        height: win.innerHeight || 0,
      },
      devicePixelRatio: win.devicePixelRatio || 1,
    };

    const visibleCount = extractedNodes.filter((n) => n.isVisible).length;

    return {
      pageMeta,
      elements: extractedNodes,
      totalExtracted: extractedNodes.length,
      visibleCount,
      timestamp: Date.now(),
    };
  }

  /**
   * Inspect computed styles and metrics for a single DOM element.
   */
  public inspectElement(
    el: Element,
    id: string,
    parentId: string | null = null,
    _options: ExtractionOptions = {}
  ): RawElementNode {
    const win = el.ownerDocument.defaultView || window;
    const computed = win.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    const display = computed.display || 'block';
    const visibility = computed.visibility || 'visible';
    const opacityVal = parseFloat(computed.opacity || '1');
    const opacity = isNaN(opacityVal) ? 1 : opacityVal;

    const width = Math.round(rect.width * 100) / 100;
    const height = Math.round(rect.height * 100) / 100;
    const x = Math.round(rect.left * 100) / 100;
    const y = Math.round(rect.top * 100) / 100;

    const overflowX = computed.overflowX || computed.overflow || 'visible';
    const overflowY = computed.overflowY || computed.overflow || 'visible';

    const isVisible =
      display !== 'none' &&
      visibility !== 'hidden' &&
      opacity > 0 &&
      (width > 0 || height > 0 || overflowX === 'visible' || overflowY === 'visible');

    // Text Content Metadata (Privacy-safe: sanitize input form values & passwords)
    let directTextContent = '';
    let totalTextContent = '';
    let hasDirectText = false;

    const tagName = el.tagName.toLowerCase();
    const inputType = el.getAttribute('type')?.toLowerCase();

    if (tagName === 'input' && (inputType === 'password' || inputType === 'hidden')) {
      totalTextContent = ''; // Never capture sensitive passwords or hidden form tokens
    } else if (tagName === 'input' || tagName === 'textarea') {
      totalTextContent = el.getAttribute('placeholder') || el.getAttribute('aria-label') || '';
    } else {
      totalTextContent = el.textContent?.trim() || '';
      for (let i = 0; i < el.childNodes.length; i++) {
        const child = el.childNodes[i];
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent?.trim() || '';
          if (text.length > 0) {
            hasDirectText = true;
            directTextContent += (directTextContent ? ' ' : '') + text;
          }
        }
      }
    }
    const trimmedText = hasDirectText ? directTextContent : totalTextContent;

    let fontFamily = computed.fontFamily || 'sans-serif';
    // CSS font-family is inherited by default. In JSDOM environments where CSS inheritance is unmodeled, resolve parent font-family.
    if ((fontFamily === 'sans-serif' || fontFamily === 'Times New Roman' || fontFamily === 'serif') && el.parentElement) {
      const parentComputed = win.getComputedStyle(el.parentElement);
      if (parentComputed.fontFamily && parentComputed.fontFamily.length > 0) {
        fontFamily = parentComputed.fontFamily;
      }
    }

    return {
      id,
      tagName: el.tagName.toLowerCase(),
      className: typeof el.className === 'string' ? el.className : '',
      role: el.getAttribute('role') || null,
      boundingRect: { x, y, width, height },
      isVisible,
      display,
      position: computed.position || 'static',
      zIndex: computed.zIndex || 'auto',
      parentId,
      childIds: [],
      textMeta: {
        hasText: totalTextContent.length > 0,
        textLength: totalTextContent.length,
        trimmedText: trimmedText.substring(0, 150),
        isDirectText: hasDirectText,
      },
      typography: {
        fontFamily,
        fontSize: computed.fontSize || '16px',
        fontWeight: computed.fontWeight || '400',
        lineHeight: computed.lineHeight || 'normal',
        letterSpacing: computed.letterSpacing || 'normal',
        wordSpacing: computed.wordSpacing || 'normal',
        textTransform: computed.textTransform || 'none',
        textDecoration: computed.textDecoration || 'none',
        textAlign: computed.textAlign || 'left',
        textWrap: computed.textWrap || (computed as any).webkitTextWrap || 'auto',
        textOverflow: computed.textOverflow || 'clip',
        whiteSpace: computed.whiteSpace || 'normal',
      },
      surface: {
        backgroundImage: computed.backgroundImage || 'none',
        backdropFilter: computed.backdropFilter || (computed as any).webkitBackdropFilter || 'none',
        filter: computed.filter || 'none',
        boxSizing: computed.boxSizing || 'content-box',
      },
      backgroundColor: computed.backgroundColor || 'rgba(0, 0, 0, 0)',
      color: computed.color || 'rgb(0, 0, 0)',
      opacity,
      borderWidths: {
        top: computed.borderTopWidth || '0px',
        right: computed.borderRightWidth || '0px',
        bottom: computed.borderBottomWidth || '0px',
        left: computed.borderLeftWidth || '0px',
      },
      borderStyles: {
        top: computed.borderTopStyle || 'none',
        right: computed.borderRightStyle || 'none',
        bottom: computed.borderBottomStyle || 'none',
        left: computed.borderLeftStyle || 'none',
      },
      borderColors: {
        top: computed.borderTopColor || 'transparent',
        right: computed.borderRightColor || 'transparent',
        bottom: computed.borderBottomColor || 'transparent',
        left: computed.borderLeftColor || 'transparent',
      },
      borderRadius: {
        topLeft: (computed.borderTopLeftRadius && computed.borderTopLeftRadius !== '0px' ? computed.borderTopLeftRadius : computed.borderRadius) || '0px',
        topRight: (computed.borderTopRightRadius && computed.borderTopRightRadius !== '0px' ? computed.borderTopRightRadius : computed.borderRadius) || '0px',
        bottomRight: (computed.borderBottomRightRadius && computed.borderBottomRightRadius !== '0px' ? computed.borderBottomRightRadius : computed.borderRadius) || '0px',
        bottomLeft: (computed.borderBottomLeftRadius && computed.borderBottomLeftRadius !== '0px' ? computed.borderBottomLeftRadius : computed.borderRadius) || '0px',
      },
      boxShadow: computed.boxShadow || 'none',
      transform: computed.transform || 'none',
      overflow: {
        x: overflowX,
        y: overflowY,
      },
      padding: {
        top: computed.paddingTop || '0px',
        right: computed.paddingRight || '0px',
        bottom: computed.paddingBottom || '0px',
        left: computed.paddingLeft || '0px',
      },
      margin: {
        top: computed.marginTop || '0px',
        right: computed.marginRight || '0px',
        bottom: computed.marginBottom || '0px',
        left: computed.marginLeft || '0px',
      },
      gap: {
        row: computed.rowGap || computed.gap || '0px',
        column: computed.columnGap || computed.gap || '0px',
      },
      layoutProps: {
        display,
        position: computed.position || 'static',
        zIndex: computed.zIndex || 'auto',
        overflow: {
          x: overflowX,
          y: overflowY,
        },
        flexDirection: computed.flexDirection,
        flexWrap: computed.flexWrap,
        justifyContent: computed.justifyContent,
        alignItems: computed.alignItems,
        alignContent: computed.alignContent,
        gridTemplateColumns: computed.gridTemplateColumns,
        gridTemplateRows: computed.gridTemplateRows,
        gridAutoFlow: computed.gridAutoFlow,
        gridAutoColumns: computed.gridAutoColumns && computed.gridAutoColumns !== 'auto' ? computed.gridAutoColumns : undefined,
        gridAutoRows: computed.gridAutoRows && computed.gridAutoRows !== 'auto' ? computed.gridAutoRows : undefined,
        placeItems: computed.placeItems && computed.placeItems !== 'normal' && computed.placeItems !== 'normal legacy' ? computed.placeItems : undefined,
        placeContent: computed.placeContent && computed.placeContent !== 'normal' ? computed.placeContent : undefined,
        alignSelf: computed.alignSelf,
        justifySelf: computed.justifySelf,
        inset: (computed.position && computed.position !== 'static') ? {
          top: computed.top || 'auto',
          right: computed.right || 'auto',
          bottom: computed.bottom || 'auto',
          left: computed.left || 'auto',
        } : undefined,
        gap: {
          row: computed.rowGap || computed.gap || '0px',
          column: computed.columnGap || computed.gap || '0px',
        },
      },
      assetProps: (el.tagName.toLowerCase() === 'img' || el.tagName.toLowerCase() === 'svg' || (computed.backgroundImage && computed.backgroundImage !== 'none')) ? {
        currentSrc: el.tagName.toLowerCase() === 'img' ? (() => {
          const s = (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src || '';
          return (s.startsWith('data:image') && s.length > 512) ? s.substring(0, 256) + '...[truncated-data-uri]' : s;
        })() : undefined,
        naturalWidth: el.tagName.toLowerCase() === 'img' ? (el as HTMLImageElement).naturalWidth : undefined,
        naturalHeight: el.tagName.toLowerCase() === 'img' ? (el as HTMLImageElement).naturalHeight : undefined,
        objectFit: computed.objectFit || 'fill',
        objectPosition: computed.objectPosition || '50% 50%',
        backgroundImage: computed.backgroundImage && computed.backgroundImage !== 'none' ? (
          computed.backgroundImage.length > 512 && computed.backgroundImage.startsWith('data:image') ? computed.backgroundImage.substring(0, 256) + '...' : computed.backgroundImage
        ) : undefined,
        hasSvg: el.tagName.toLowerCase() === 'svg' || Boolean(el.querySelector('svg')),
        svgViewBox: el.tagName.toLowerCase() === 'svg' ? el.getAttribute('viewBox') || undefined : undefined,
        svgOuterHtml: el.tagName.toLowerCase() === 'svg' ? (
          el.outerHTML.length > 4096 ? el.outerHTML.substring(0, 4096) + '</svg>' : el.outerHTML
        ) : undefined,
        svgInnerMarkup: el.tagName.toLowerCase() === 'svg' ? (
          el.innerHTML.length > 2048 ? el.innerHTML.substring(0, 2048) : el.innerHTML
        ) : undefined,
        srcset: el.tagName.toLowerCase() === 'img' ? (() => {
          const s = el.getAttribute('srcset') || undefined;
          return (s && s.length > 512) ? s.substring(0, 512) + '...' : s;
        })() : undefined,
        alt: el.tagName.toLowerCase() === 'img' ? (el as HTMLImageElement).alt || undefined : undefined,
      } : undefined,
      transitions: (computed.transitionDuration && computed.transitionDuration !== '0s' && computed.transitionDuration !== '0ms' && computed.transitionProperty !== 'none') ? {
        property: computed.transitionProperty || 'all',
        duration: computed.transitionDuration,
        timingFunction: computed.transitionTimingFunction || 'ease',
        delay: computed.transitionDelay || '0s',
        rawString: `${computed.transitionProperty || 'all'} ${computed.transitionDuration} ${computed.transitionTimingFunction || 'ease'} ${computed.transitionDelay || '0s'}`.trim(),
      } : undefined,
      animations: (computed.animationName && computed.animationName !== 'none' && computed.animationDuration && computed.animationDuration !== '0s') ? {
        name: computed.animationName,
        duration: computed.animationDuration,
        timingFunction: computed.animationTimingFunction || 'ease',
        delay: computed.animationDelay || '0s',
        iterationCount: computed.animationIterationCount || '1',
        direction: computed.animationDirection || 'normal',
        rawString: `${computed.animationName} ${computed.animationDuration} ${computed.animationTimingFunction || 'ease'} ${computed.animationDelay || '0s'}`.trim(),
      } : undefined,
      interactive: {
        isClickable: (computed.cursor === 'pointer' || ['a', 'button', 'input', 'select', 'summary'].includes(el.tagName.toLowerCase()) || el.hasAttribute('onclick') || el.getAttribute('role') === 'button'),
        cursor: computed.cursor || 'auto',
        href: el.getAttribute('href') || undefined,
        tabIndex: el.hasAttribute('tabindex') ? parseInt(el.getAttribute('tabindex') || '0', 10) : undefined,
        ariaRole: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        ariaExpanded: el.hasAttribute('aria-expanded') ? el.getAttribute('aria-expanded') === 'true' : null,
        ariaHidden: el.hasAttribute('aria-hidden') ? el.getAttribute('aria-hidden') === 'true' : null,
        ariaSelected: el.hasAttribute('aria-selected') ? el.getAttribute('aria-selected') === 'true' : null,
        ariaControls: el.getAttribute('aria-controls'),
        hasFormControls: ['input', 'select', 'textarea', 'form'].includes(el.tagName.toLowerCase()),
      },
      constraints: {
        minWidth: computed.minWidth && computed.minWidth !== '0px' && computed.minWidth !== 'auto' ? computed.minWidth : undefined,
        maxWidth: computed.maxWidth && computed.maxWidth !== 'none' ? computed.maxWidth : undefined,
        minHeight: computed.minHeight && computed.minHeight !== '0px' && computed.minHeight !== 'auto' ? computed.minHeight : undefined,
        maxHeight: computed.maxHeight && computed.maxHeight !== 'none' ? computed.maxHeight : undefined,
        aspectRatio: computed.aspectRatio && computed.aspectRatio !== 'auto' ? computed.aspectRatio : undefined,
        flexGrow: computed.flexGrow && computed.flexGrow !== '0' ? computed.flexGrow : undefined,
        flexShrink: computed.flexShrink && computed.flexShrink !== '1' ? computed.flexShrink : undefined,
        flexBasis: computed.flexBasis && computed.flexBasis !== 'auto' ? computed.flexBasis : undefined,
        alignSelf: computed.alignSelf && computed.alignSelf !== 'auto' ? computed.alignSelf : undefined,
        justifySelf: computed.justifySelf && computed.justifySelf !== 'auto' ? computed.justifySelf : undefined,
      },
      pseudoStyles: (() => {
        try {
          if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return undefined;
          if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')) return undefined;
          const before = window.getComputedStyle(el, ':before');
          const after = window.getComputedStyle(el, ':after');
          const res: { before?: Record<string, string>; after?: Record<string, string> } = {};
          if (before && before.content && before.content !== 'none' && before.content !== '""' && before.content !== 'normal') {
            res.before = {
              content: before.content,
              display: before.display,
              position: before.position,
              color: before.color,
              backgroundColor: before.backgroundColor,
            };
          }
          if (after && after.content && after.content !== 'none' && after.content !== '""' && after.content !== 'normal') {
            res.after = {
              content: after.content,
              display: after.display,
              position: after.position,
              color: after.color,
              backgroundColor: after.backgroundColor,
            };
          }
          return Object.keys(res).length > 0 ? res : undefined;
        } catch {
          return undefined;
        }
      })(),
      isolation: computed.isolation && computed.isolation !== 'auto' ? computed.isolation : undefined,
      mixBlendMode: computed.mixBlendMode && computed.mixBlendMode !== 'normal' ? computed.mixBlendMode : undefined,
      filter: computed.filter && computed.filter !== 'none' ? computed.filter : undefined,
      willChange: computed.willChange && computed.willChange !== 'auto' ? computed.willChange : undefined,
      contain: computed.contain && computed.contain !== 'none' ? computed.contain : undefined,
      backdropFilter: computed.backdropFilter && computed.backdropFilter !== 'none' ? computed.backdropFilter : undefined,
      perspective: computed.perspective && computed.perspective !== 'none' ? computed.perspective : undefined,
      clipPath: computed.clipPath && computed.clipPath !== 'none' ? computed.clipPath : undefined,
    };
  }
}
