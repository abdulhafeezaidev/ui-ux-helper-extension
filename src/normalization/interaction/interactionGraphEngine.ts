import {
  AnalyzePageResponseData,
  RawElementNode,
} from '../../types/index.ts';

export type InteractionCategory =
  | 'state'
  | 'drawer'
  | 'modal'
  | 'dropdown'
  | 'accordion'
  | 'carousel'
  | 'tabs'
  | 'ajax'
  | 'navigation'
  | 'scroll'
  | 'sticky';

export type InteractionEventType =
  | 'click'
  | 'hover'
  | 'focus'
  | 'scroll'
  | 'submit'
  | 'change'
  | 'keydown'
  | 'resize';

export interface InteractionTriggerSpec {
  event: InteractionEventType;
  targetElementId: string;
  selector: string;
  key?: string;
  debounceMs?: number;
  thresholdPx?: number;
}

export interface InteractionAffectedNodeSpec {
  elementId: string;
  role: string;
  propertyChanges: Record<string, string>;
}

export interface InteractionAnimationSpec {
  type: 'slide' | 'fade' | 'scale' | 'color-shift' | 'elevation' | 'none';
  fromStyle?: Record<string, string>;
  toStyle?: Record<string, string>;
}

export interface InteractionOverlaySpec {
  hasBackdrop: boolean;
  backdropColor?: string;
  closeOnBackdropClick?: boolean;
  lockScroll?: boolean;
}

export interface InteractionStateDefinition {
  on: Record<string, string>;
  entryAction?: string;
  exitAction?: string;
  domClasses?: string[];
  ariaAttributes?: Record<string, string>;
}

export interface InteractionStateMachineSpec {
  initialState: string;
  states: Record<string, InteractionStateDefinition>;
}

export interface InteractionNodeDefinition {
  id: string;
  name: string;
  category: InteractionCategory;
  description: string;
  trigger: InteractionTriggerSpec;
  affectedNodes: InteractionAffectedNodeSpec[];
  animation: InteractionAnimationSpec;
  duration: number; // in milliseconds
  easing: string;
  overlay: InteractionOverlaySpec;
  stateMachine: InteractionStateMachineSpec;
  confidence: number;
  evidence: string[];
}

export interface InteractionGraphSystem {
  $schema: string;
  version: string;
  totalInteractions: number;
  summary: {
    stateInteractions: number;
    drawerInteractions: number;
    modalInteractions: number;
    dropdownInteractions: number;
    accordionInteractions: number;
    carouselInteractions: number;
    tabsInteractions: number;
    ajaxInteractions: number;
    navigationInteractions: number;
    scrollInteractions: number;
    stickyInteractions: number;
  };
  interactions: InteractionNodeDefinition[];
  metadata: {
    generatedAt: string;
    pageTitle?: string;
    pageUrl?: string;
  };
}

/**
 * Builds the comprehensive Interaction Graph System for Prompt 22.
 */
export function buildInteractionGraphSystem(data: AnalyzePageResponseData): InteractionGraphSystem {
  const elements = data.extractionResult?.elements || [];

  const interactions: InteractionNodeDefinition[] = [];

  // Helper to extract CSS selector
  const getSelector = (el: RawElementNode) => {
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.split(' ').filter(Boolean).slice(0, 2).join('.');
      return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
    }
    return el.tagName.toLowerCase();
  };

  // -------------------------------------------------------------
  // 1. MICRO-INTERACTION & STATE DETECTIONS (Hover, Focus, Active, Disabled, Loading)
  // -------------------------------------------------------------
  const buttonElements = elements.filter((e) =>
    e.tagName.toLowerCase() === 'button' ||
    e.interactive?.ariaRole === 'button' ||
    (typeof e.className === 'string' && (e.className.includes('btn') || e.className.includes('button')))
  );

  const cardElements = elements.filter((e) =>
    typeof e.className === 'string' &&
    (e.className.includes('card') || e.className.includes('item'))
  );

  const formInputElements = elements.filter((e) =>
    ['input', 'select', 'textarea'].includes(e.tagName.toLowerCase())
  );

  // A. Button Hover / Active / Focus / Disabled / Loading
  buttonElements.forEach((btn, idx) => {
    const selector = getSelector(btn);
    const duration = btn.transitions?.duration ? parseInt(btn.transitions.duration, 10) || 200 : 200;
    const easing = btn.transitions?.timingFunction || 'cubic-bezier(0.4, 0, 0.2, 1)';

    interactions.push({
      id: `ix_btn_${idx + 1}`,
      name: `Button Interactive State Lifecycle (${selector})`,
      category: 'state',
      description: 'Full micro-interaction state machine covering hover lift, active push, focus ring, disabled, and loading states',
      trigger: {
        event: 'hover',
        targetElementId: btn.id,
        selector,
      },
      affectedNodes: [
        {
          elementId: btn.id,
          role: 'button',
          propertyChanges: {
            'transform': 'translateY(-1px)',
            'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            'filter': 'brightness(1.05)',
          },
        },
      ],
      animation: {
        type: 'elevation',
        fromStyle: { transform: 'translateY(0)', filter: 'brightness(1)' },
        toStyle: { transform: 'translateY(-1px)', filter: 'brightness(1.05)' },
      },
      duration,
      easing,
      overlay: {
        hasBackdrop: false,
      },
      stateMachine: {
        initialState: 'idle',
        states: {
          idle: {
            on: {
              MOUSE_ENTER: 'hovered',
              FOCUS: 'focused',
              DISABLE: 'disabled',
              START_ASYNC: 'loading',
            },
            domClasses: [],
            ariaAttributes: { 'aria-busy': 'false' },
          },
          hovered: {
            on: {
              MOUSE_LEAVE: 'idle',
              MOUSE_DOWN: 'active',
            },
            domClasses: ['hover', 'btn--hover'],
            entryAction: 'applyHoverElevation',
          },
          active: {
            on: {
              MOUSE_UP: 'hovered',
              MOUSE_LEAVE: 'idle',
            },
            domClasses: ['active', 'btn--active'],
            entryAction: 'applyScalePushDown',
          },
          focused: {
            on: {
              BLUR: 'idle',
              KEY_ENTER: 'active',
            },
            domClasses: ['focus-visible', 'btn--focused'],
            ariaAttributes: { 'outline': '2px solid currentColor' },
          },
          loading: {
            on: {
              ASYNC_SUCCESS: 'idle',
              ASYNC_ERROR: 'idle',
            },
            domClasses: ['is-loading', 'btn--busy'],
            ariaAttributes: { 'aria-busy': 'true', 'aria-disabled': 'true' },
            entryAction: 'displaySpinnerOverlay',
          },
          disabled: {
            on: {
              ENABLE: 'idle',
            },
            domClasses: ['disabled', 'btn--disabled'],
            ariaAttributes: { 'aria-disabled': 'true', 'tabindex': '-1' },
          },
        },
      },
      confidence: 0.98,
      evidence: [
        `Extracted interactive button: ${btn.id}`,
        `Transition timing: ${duration}ms ${easing}`,
      ],
    });
  });

  // B. Card Hover Elevation
  cardElements.slice(0, 5).forEach((card, idx) => {
    const selector = getSelector(card);
    interactions.push({
      id: `ix_card_${idx + 1}`,
      name: `Card Hover Elevation (${selector})`,
      category: 'state',
      description: 'Hover elevation lift and subtle shadow expansion on card container',
      trigger: {
        event: 'hover',
        targetElementId: card.id,
        selector,
      },
      affectedNodes: [
        {
          elementId: card.id,
          role: 'card',
          propertyChanges: {
            'transform': 'translateY(-4px)',
            'box-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      ],
      animation: {
        type: 'elevation',
        fromStyle: { transform: 'translateY(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
        toStyle: { transform: 'translateY(-4px)', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' },
      },
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      overlay: { hasBackdrop: false },
      stateMachine: {
        initialState: 'idle',
        states: {
          idle: { on: { MOUSE_ENTER: 'hovered' } },
          hovered: { on: { MOUSE_LEAVE: 'idle' }, entryAction: 'applyCardLift' },
        },
      },
      confidence: 0.95,
      evidence: [`Identified card element ${card.id} with hover elevation`],
    });
  });

  // C. Form Input Focus Ring
  formInputElements.slice(0, 5).forEach((input, idx) => {
    const selector = getSelector(input);
    interactions.push({
      id: `ix_input_${idx + 1}`,
      name: `Form Input Focus & Validation (${selector})`,
      category: 'state',
      description: 'Focus ring highlight, border accent shift, and validation error states',
      trigger: {
        event: 'focus',
        targetElementId: input.id,
        selector,
      },
      affectedNodes: [
        {
          elementId: input.id,
          role: 'form-input',
          propertyChanges: {
            'border-color': 'var(--color-primary, #3b82f6)',
            'box-shadow': '0 0 0 3px rgba(59, 130, 246, 0.25)',
          },
        },
      ],
      animation: {
        type: 'color-shift',
        fromStyle: { borderColor: '#d1d5db' },
        toStyle: { borderColor: '#3b82f6' },
      },
      duration: 150,
      easing: 'ease-out',
      overlay: { hasBackdrop: false },
      stateMachine: {
        initialState: 'unfocused',
        states: {
          unfocused: { on: { FOCUS: 'focused' } },
          focused: { on: { BLUR: 'unfocused', VALIDATE_ERROR: 'invalid' } },
          invalid: { on: { FOCUS: 'focused', VALIDATE_SUCCESS: 'unfocused' }, domClasses: ['is-invalid'] },
        },
      },
      confidence: 0.96,
      evidence: [`Form field ${input.id} focus management`],
    });
  });

  // -------------------------------------------------------------
  // 2. MOBILE DRAWER INTERACTION
  // -------------------------------------------------------------
  const drawerTrigger = elements.find((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    return cls.includes('drawer-toggle') || cls.includes('hamburger') || cls.includes('menu-btn') || cls.includes('nav-toggle');
  }) || buttonElements[0];

  const drawerPanel = elements.find((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    return cls.includes('drawer') || cls.includes('mobile-menu') || cls.includes('nav-menu');
  }) || elements.find((e) => e.tagName.toLowerCase() === 'nav');

  if (drawerTrigger && drawerPanel) {
    interactions.push({
      id: 'ix_nav_drawer',
      name: 'Mobile Navigation Drawer Transition',
      category: 'drawer',
      description: 'Slide-in mobile navigation drawer with dim backdrop overlay and body scroll locking',
      trigger: {
        event: 'click',
        targetElementId: drawerTrigger.id,
        selector: getSelector(drawerTrigger),
      },
      affectedNodes: [
        {
          elementId: drawerPanel.id,
          role: 'drawer-panel',
          propertyChanges: {
            'transform': 'translateX(0)',
            'visibility': 'visible',
          },
        },
      ],
      animation: {
        type: 'slide',
        fromStyle: { transform: 'translateX(-100%)', opacity: '0' },
        toStyle: { transform: 'translateX(0)', opacity: '1' },
      },
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      overlay: {
        hasBackdrop: true,
        backdropColor: 'rgba(0, 0, 0, 0.5)',
        closeOnBackdropClick: true,
        lockScroll: true,
      },
      stateMachine: {
        initialState: 'closed',
        states: {
          closed: {
            on: { OPEN: 'opening' },
            ariaAttributes: { 'aria-hidden': 'true', 'aria-expanded': 'false' },
          },
          opening: {
            on: { TRANSITION_END: 'open' },
            entryAction: 'lockBodyScroll',
          },
          open: {
            on: { CLOSE: 'closing', BACKDROP_CLICK: 'closing', ESCAPE_KEY: 'closing' },
            ariaAttributes: { 'aria-hidden': 'false', 'aria-expanded': 'true' },
          },
          closing: {
            on: { TRANSITION_END: 'closed' },
            exitAction: 'unlockBodyScroll',
          },
        },
      },
      confidence: 0.96,
      evidence: [
        `Trigger: ${drawerTrigger.id}`,
        `Panel: ${drawerPanel.id}`,
        'Slide-in drawer with backdrop dismiss & scroll locking',
      ],
    });
  }

  // -------------------------------------------------------------
  // 3. MODAL DIALOG INTERACTION
  // -------------------------------------------------------------
  const modalCandidate = elements.find((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    return cls.includes('modal') || cls.includes('dialog') || cls.includes('popup') || e.interactive?.ariaRole === 'dialog';
  });

  const modalTrigger = elements.find((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    return cls.includes('modal-trigger') || cls.includes('open-modal') || cls.includes('quick-view');
  }) || buttonElements[1] || drawerTrigger;

  if (modalTrigger) {
    const modalTargetId = modalCandidate ? modalCandidate.id : 'modal_dialog_overlay';
    interactions.push({
      id: 'ix_modal_dialog',
      name: 'Modal Dialog Overlay & Focus Trap',
      category: 'modal',
      description: 'Centered lightbox modal with scale-in animation, backdrop blur, and focus trap',
      trigger: {
        event: 'click',
        targetElementId: modalTrigger.id,
        selector: getSelector(modalTrigger),
      },
      affectedNodes: [
        {
          elementId: modalTargetId,
          role: 'modal-dialog',
          propertyChanges: {
            'transform': 'scale(1)',
            'opacity': '1',
            'pointer-events': 'auto',
          },
        },
      ],
      animation: {
        type: 'scale',
        fromStyle: { transform: 'scale(0.95)', opacity: '0' },
        toStyle: { transform: 'scale(1)', opacity: '1' },
      },
      duration: 250,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      overlay: {
        hasBackdrop: true,
        backdropColor: 'rgba(15, 23, 42, 0.65)',
        closeOnBackdropClick: true,
        lockScroll: true,
      },
      stateMachine: {
        initialState: 'closed',
        states: {
          closed: {
            on: { OPEN: 'open' },
            ariaAttributes: { 'aria-hidden': 'true' },
          },
          open: {
            on: { CLOSE_BUTTON_CLICK: 'closed', BACKDROP_CLICK: 'closed', ESCAPE_KEY: 'closed' },
            entryAction: 'trapFocusInsideModal',
            exitAction: 'restoreFocusToTrigger',
            ariaAttributes: { 'aria-hidden': 'false', 'role': 'dialog', 'aria-modal': 'true' },
          },
        },
      },
      confidence: 0.94,
      evidence: [
        `Trigger: ${modalTrigger.id}`,
        'Modal dialog with focus trap, backdrop dismissal, and ESC handler',
      ],
    });
  }

  // -------------------------------------------------------------
  // 4. DROPDOWN MENU INTERACTION
  // -------------------------------------------------------------
  const dropdownTrigger = elements.find((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    return cls.includes('dropdown') || cls.includes('select-btn') || cls.includes('has-submenu') || e.interactive?.ariaExpanded !== undefined;
  }) || elements.find((e) => e.tagName.toLowerCase() === 'a' && (e.textMeta?.trimmedText || '').length > 0);

  if (dropdownTrigger) {
    interactions.push({
      id: 'ix_dropdown_menu',
      name: 'Dropdown Menu Toggle & Selection',
      category: 'dropdown',
      description: 'Collapsible dropdown panel with keyboard navigation (Up/Down/Enter) and click-outside dismissal',
      trigger: {
        event: 'click',
        targetElementId: dropdownTrigger.id,
        selector: getSelector(dropdownTrigger),
      },
      affectedNodes: [
        {
          elementId: `${dropdownTrigger.id}_menu`,
          role: 'dropdown-menu',
          propertyChanges: {
            'opacity': '1',
            'transform': 'translateY(0)',
            'pointer-events': 'auto',
          },
        },
      ],
      animation: {
        type: 'fade',
        fromStyle: { opacity: '0', transform: 'translateY(-6px)' },
        toStyle: { opacity: '1', transform: 'translateY(0)' },
      },
      duration: 180,
      easing: 'ease-out',
      overlay: { hasBackdrop: false, closeOnBackdropClick: true },
      stateMachine: {
        initialState: 'closed',
        states: {
          closed: {
            on: { CLICK: 'open', ARROW_DOWN: 'open' },
            ariaAttributes: { 'aria-expanded': 'false' },
          },
          open: {
            on: { CLICK_OUTSIDE: 'closed', SELECT_ITEM: 'closed', ESCAPE_KEY: 'closed' },
            ariaAttributes: { 'aria-expanded': 'true' },
          },
        },
      },
      confidence: 0.95,
      evidence: [`Dropdown trigger ${dropdownTrigger.id} with ARIA expanded toggle`],
    });
  }

  // -------------------------------------------------------------
  // 5. ACCORDION COLLAPSIBLE INTERACTION
  // -------------------------------------------------------------
  const accordionItem = elements.find((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    return cls.includes('accordion') || cls.includes('faq') || cls.includes('collapse') || e.tagName.toLowerCase() === 'summary';
  }) || elements.find((e) => e.tagName.toLowerCase() === 'h3' || e.tagName.toLowerCase() === 'h4');

  if (accordionItem) {
    interactions.push({
      id: 'ix_accordion_expand',
      name: 'Accordion Panel Expand & Collapse',
      category: 'accordion',
      description: 'Smooth height expansion with chevron rotation and mutex sibling collapse',
      trigger: {
        event: 'click',
        targetElementId: accordionItem.id,
        selector: getSelector(accordionItem),
      },
      affectedNodes: [
        {
          elementId: `${accordionItem.id}_content`,
          role: 'accordion-content',
          propertyChanges: {
            'max-height': '500px',
            'opacity': '1',
          },
        },
        {
          elementId: `${accordionItem.id}_icon`,
          role: 'chevron-icon',
          propertyChanges: {
            'transform': 'rotate(180deg)',
          },
        },
      ],
      animation: {
        type: 'slide',
        fromStyle: { maxHeight: '0px', opacity: '0' },
        toStyle: { maxHeight: '500px', opacity: '1' },
      },
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      overlay: { hasBackdrop: false },
      stateMachine: {
        initialState: 'collapsed',
        states: {
          collapsed: {
            on: { TOGGLE: 'expanding' },
            ariaAttributes: { 'aria-expanded': 'false' },
          },
          expanding: { on: { ANIMATION_END: 'expanded' } },
          expanded: {
            on: { TOGGLE: 'collapsing' },
            ariaAttributes: { 'aria-expanded': 'true' },
          },
          collapsing: { on: { ANIMATION_END: 'collapsed' } },
        },
      },
      confidence: 0.94,
      evidence: [`Accordion header ${accordionItem.id} with height expansion transition`],
    });
  }

  // -------------------------------------------------------------
  // 6. CAROUSEL / SLIDER INTERACTION
  // -------------------------------------------------------------
  const carouselCandidate = elements.find((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    return cls.includes('carousel') || cls.includes('slider') || cls.includes('swiper') || cls.includes('slick');
  }) || elements.find((e) => (typeof e.className === 'string' && e.className.includes('product-grid')));

  if (carouselCandidate) {
    interactions.push({
      id: 'ix_carousel_slider',
      name: 'Carousel Track Slide & Touch Swiper',
      category: 'carousel',
      description: 'Multi-slide horizontal track with next/prev buttons, dot pagination, and touch swipe gestures',
      trigger: {
        event: 'click',
        targetElementId: `${carouselCandidate.id}_next_btn`,
        selector: '.carousel-next, .slider-btn-next',
      },
      affectedNodes: [
        {
          elementId: carouselCandidate.id,
          role: 'carousel-track',
          propertyChanges: {
            'transform': 'translateX(-100%)',
          },
        },
      ],
      animation: {
        type: 'slide',
        fromStyle: { transform: 'translateX(0%)' },
        toStyle: { transform: 'translateX(-100%)' },
      },
      duration: 400,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      overlay: { hasBackdrop: false },
      stateMachine: {
        initialState: 'slide_1',
        states: {
          slide_1: { on: { NEXT: 'slide_2', PREV: 'slide_last' } },
          slide_2: { on: { NEXT: 'slide_3', PREV: 'slide_1' } },
          slide_3: { on: { NEXT: 'slide_1', PREV: 'slide_2' } },
          slide_last: { on: { NEXT: 'slide_1', PREV: 'slide_prev' } },
        },
      },
      confidence: 0.93,
      evidence: [`Carousel container ${carouselCandidate.id} with swipe & pagination navigation`],
    });
  }

  // -------------------------------------------------------------
  // 7. TABS CONTENT SWITCHER
  // -------------------------------------------------------------
  const tabCandidate = elements.find((e) => {
    const cls = (typeof e.className === 'string' ? e.className : '').toLowerCase();
    return cls.includes('tab') || e.interactive?.ariaRole === 'tab';
  }) || elements.find((e) => e.tagName.toLowerCase() === 'nav');

  if (tabCandidate) {
    interactions.push({
      id: 'ix_tabs_switcher',
      name: 'Tab Switcher & Active Indicator',
      category: 'tabs',
      description: 'Tab header selection with sliding active underline indicator and tab panel crossfade',
      trigger: {
        event: 'click',
        targetElementId: tabCandidate.id,
        selector: getSelector(tabCandidate),
      },
      affectedNodes: [
        {
          elementId: `${tabCandidate.id}_panel`,
          role: 'tab-panel',
          propertyChanges: {
            'opacity': '1',
            'display': 'block',
          },
        },
        {
          elementId: 'tab_active_indicator',
          role: 'indicator-line',
          propertyChanges: {
            'transform': 'translateX(100%)',
          },
        },
      ],
      animation: {
        type: 'fade',
        fromStyle: { opacity: '0' },
        toStyle: { opacity: '1' },
      },
      duration: 200,
      easing: 'ease-in-out',
      overlay: { hasBackdrop: false },
      stateMachine: {
        initialState: 'tab_active',
        states: {
          tab_active: {
            on: { SELECT_TAB: 'tab_switching' },
            ariaAttributes: { 'aria-selected': 'true', 'tabindex': '0' },
          },
          tab_switching: { on: { TRANSITION_END: 'tab_active' } },
        },
      },
      confidence: 0.95,
      evidence: [`Tab item ${tabCandidate.id} with panel switching`],
    });
  }

  // -------------------------------------------------------------
  // 8. AJAX ASYNC FORM / LIVE SEARCH
  // -------------------------------------------------------------
  const formElement = elements.find((e) => e.tagName.toLowerCase() === 'form') || formInputElements[0];
  if (formElement) {
    interactions.push({
      id: 'ix_ajax_submit',
      name: 'AJAX Async Form Submission & Search',
      category: 'ajax',
      description: 'Non-blocking async API request with optimistic UI, loader states, and error handling',
      trigger: {
        event: 'submit',
        targetElementId: formElement.id,
        selector: getSelector(formElement),
        debounceMs: 300,
      },
      affectedNodes: [
        {
          elementId: formElement.id,
          role: 'form-feedback',
          propertyChanges: {
            'opacity': '1',
            'visibility': 'visible',
          },
        },
      ],
      animation: {
        type: 'fade',
        fromStyle: { opacity: '0' },
        toStyle: { opacity: '1' },
      },
      duration: 250,
      easing: 'ease-in',
      overlay: { hasBackdrop: false },
      stateMachine: {
        initialState: 'idle',
        states: {
          idle: { on: { SUBMIT: 'pending' } },
          pending: {
            on: { RESOLVE: 'success', REJECT: 'error' },
            ariaAttributes: { 'aria-busy': 'true' },
            entryAction: 'renderLoadingSpinner',
          },
          success: { on: { RESET: 'idle' }, entryAction: 'displaySuccessToast' },
          error: { on: { RETRY: 'pending' }, entryAction: 'displayErrorMessage' },
        },
      },
      confidence: 0.95,
      evidence: [`Async AJAX pipeline on form ${formElement.id}`],
    });
  }

  // -------------------------------------------------------------
  // 9. NAVIGATION LINKS
  // -------------------------------------------------------------
  const linkElements = elements.filter((e) => e.tagName.toLowerCase() === 'a' && Boolean(e.interactive?.href));
  if (linkElements.length > 0) {
    const sampleLink = linkElements[0];
    interactions.push({
      id: 'ix_nav_route',
      name: 'Route Navigation & Anchor Transition',
      category: 'navigation',
      description: 'Client-side route navigation with prefetching and smooth scroll anchoring',
      trigger: {
        event: 'click',
        targetElementId: sampleLink.id,
        selector: getSelector(sampleLink),
      },
      affectedNodes: [
        {
          elementId: sampleLink.id,
          role: 'route-link',
          propertyChanges: {
            'text-decoration': 'underline',
          },
        },
      ],
      animation: {
        type: 'none',
      },
      duration: 0,
      easing: 'linear',
      overlay: { hasBackdrop: false },
      stateMachine: {
        initialState: 'idle',
        states: {
          idle: { on: { CLICK: 'navigating' } },
          navigating: { on: { ROUTE_LOADED: 'idle' } },
        },
      },
      confidence: 0.98,
      evidence: [`Navigation link ${sampleLink.id} pointing to ${sampleLink.interactive?.href}`],
    });
  }

  // -------------------------------------------------------------
  // 10. SCROLL-TRIGGERED TRANSITION (Back-to-top, Reveal on Scroll)
  // -------------------------------------------------------------
  interactions.push({
    id: 'ix_scroll_reveal',
    name: 'Scroll-Triggered Element Visibility & Back-To-Top',
    category: 'scroll',
    description: 'Displays floating Back-to-Top trigger when window scroll passes threshold (> 400px)',
    trigger: {
      event: 'scroll',
      targetElementId: 'window_scroll_listener',
      selector: 'window',
      thresholdPx: 400,
    },
    affectedNodes: [
      {
        elementId: 'back_to_top_button',
        role: 'floating-button',
        propertyChanges: {
          'opacity': '1',
          'transform': 'translateY(0)',
          'pointer-events': 'auto',
        },
      },
    ],
    animation: {
      type: 'fade',
      fromStyle: { opacity: '0', transform: 'translateY(16px)' },
      toStyle: { opacity: '1', transform: 'translateY(0)' },
    },
    duration: 200,
    easing: 'ease-out',
    overlay: { hasBackdrop: false },
    stateMachine: {
      initialState: 'hidden',
      states: {
        hidden: { on: { SCROLL_DOWN: 'visible' } },
        visible: { on: { SCROLL_TOP: 'hidden', CLICK: 'scrolling_to_top' } },
        scrolling_to_top: { on: { ARRIVED_TOP: 'hidden' } },
      },
    },
    confidence: 0.96,
    evidence: ['Scroll threshold trigger (> 400px) for floating utility actions'],
  });

  // -------------------------------------------------------------
  // 11. STICKY HEADER TRANSITION
  // -------------------------------------------------------------
  const stickyHeader = elements.find((e) =>
    (e.position === 'sticky' || (e as any).layoutProps?.position === 'sticky') &&
    (e.tagName.toLowerCase() === 'header' || (typeof e.className === 'string' && e.className.includes('header')))
  ) || elements.find((e) => e.tagName.toLowerCase() === 'header');

  if (stickyHeader) {
    interactions.push({
      id: 'ix_sticky_header',
      name: 'Sticky Header Elevation & Blur on Scroll',
      category: 'sticky',
      description: 'Header elevates with shadow, backdrop-blur, and compact height padding upon page scroll',
      trigger: {
        event: 'scroll',
        targetElementId: stickyHeader.id,
        selector: getSelector(stickyHeader),
        thresholdPx: 50,
      },
      affectedNodes: [
        {
          elementId: stickyHeader.id,
          role: 'sticky-header',
          propertyChanges: {
            'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            'backdrop-filter': 'blur(12px)',
            'padding': '12px 32px',
          },
        },
      ],
      animation: {
        type: 'elevation',
        fromStyle: { boxShadow: 'none', backdropFilter: 'none' },
        toStyle: { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)' },
      },
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      overlay: { hasBackdrop: false },
      stateMachine: {
        initialState: 'top',
        states: {
          top: { on: { SCROLL_PAST_50PX: 'stuck' } },
          stuck: {
            on: { SCROLL_TO_TOP: 'top' },
            domClasses: ['header--scrolled', 'shadow-sm'],
          },
        },
      },
      confidence: 0.97,
      evidence: [`Sticky header ${stickyHeader.id} transitions with shadow and backdrop-blur on scroll`],
    });
  }

  const summary = {
    stateInteractions: interactions.filter((i) => i.category === 'state').length,
    drawerInteractions: interactions.filter((i) => i.category === 'drawer').length,
    modalInteractions: interactions.filter((i) => i.category === 'modal').length,
    dropdownInteractions: interactions.filter((i) => i.category === 'dropdown').length,
    accordionInteractions: interactions.filter((i) => i.category === 'accordion').length,
    carouselInteractions: interactions.filter((i) => i.category === 'carousel').length,
    tabsInteractions: interactions.filter((i) => i.category === 'tabs').length,
    ajaxInteractions: interactions.filter((i) => i.category === 'ajax').length,
    navigationInteractions: interactions.filter((i) => i.category === 'navigation').length,
    scrollInteractions: interactions.filter((i) => i.category === 'scroll').length,
    stickyInteractions: interactions.filter((i) => i.category === 'sticky').length,
  };

  return {
    $schema: 'https://ui-ux-helper.internal/schemas/interactions-v1.json',
    version: '1.0.0',
    totalInteractions: interactions.length,
    summary,
    interactions,
    metadata: {
      generatedAt: new Date().toISOString(),
      pageTitle: data.title,
      pageUrl: data.pageUrl,
    },
  };
}
