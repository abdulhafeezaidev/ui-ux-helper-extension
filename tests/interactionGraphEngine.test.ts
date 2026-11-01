import { describe, it, expect } from 'vitest';
import {
  buildInteractionGraphSystem,
} from '../src/normalization/interaction/interactionGraphEngine.ts';
import { exportInteractionsJson } from '../src/output/clonePackage/interactionsJsonExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

describe('Prompt 22 — Interaction Graph Engine', () => {
  function buildRichInteractionMockData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="app" style="width: 1440px;">
        <header id="sticky-header" style="position: sticky; top: 0px; display: flex; justify-content: space-between; padding: 16px 32px;">
          <div class="logo">BrandLogo</div>
          <nav id="main-navigation" style="display: flex; gap: 24px;">
            <a id="nav-link-shop" href="/shop">Shop</a>
            <div class="dropdown-trigger" id="category-dropdown" aria-expanded="false">
              Categories
              <div class="dropdown-menu" id="dropdown-panel" style="opacity: 0;">Dropdown Content</div>
            </div>
          </nav>
          <button id="mobile-menu-btn" class="drawer-toggle hamburger-btn">Menu</button>
        </header>

        <div id="mobile-drawer" class="drawer-panel" style="transform: translateX(-100%);">
          <button id="drawer-close-btn">Close</button>
        </div>

        <main id="main">
          <section id="hero-slider" class="carousel-container" style="position: relative;">
            <div class="carousel-track" id="slider-track">
              <div class="slide">Slide 1</div>
              <div class="slide">Slide 2</div>
            </div>
            <button id="carousel-next-btn" class="carousel-next">Next</button>
          </section>

          <section id="product-section">
            <div class="product-card" id="card-1" style="display: flex; flex-direction: column;">
              <h3>Premium Headphones</h3>
              <button id="quick-view-btn" class="btn btn-primary quick-view">Quick View</button>
            </div>
          </section>

          <section id="faq-section" class="accordion-group">
            <div class="accordion-item" id="faq-1">
              <h4 class="accordion-header" id="faq-header-1">What is the return policy?</h4>
              <div class="accordion-content" id="faq-content-1" style="max-height: 0px;">Returns accepted within 30 days.</div>
            </div>
          </section>

          <section id="tabs-section">
            <div class="tab-list" id="spec-tabs" role="tablist">
              <button class="tab-btn" id="tab-specs" role="tab" aria-selected="true">Specifications</button>
              <button class="tab-btn" id="tab-reviews" role="tab" aria-selected="false">Reviews</button>
            </div>
            <div class="tab-panel" id="panel-specs">Specifications details</div>
          </section>

          <section id="newsletter-section">
            <form id="ajax-newsletter-form" action="/api/newsletter" method="POST">
              <input type="email" id="newsletter-email" placeholder="Enter your email" required />
              <button type="submit" id="newsletter-submit-btn" class="btn btn-submit">Subscribe</button>
            </form>
          </section>
        </main>

        <div id="quickview-modal" class="modal-dialog" role="dialog" aria-hidden="true" style="opacity: 0; transform: scale(0.95);">
          <button id="modal-close-btn">Close Modal</button>
        </div>

        <button id="scroll-top-btn" class="back-to-top" style="opacity: 0;">Top</button>
      </div>
    `;

    const rawResult = new DomExtractor().extract(document.body);
    const colorSystem = new ColorNormalizer().normalize(rawResult);
    const typographySystem = new TypographyNormalizer().normalize(rawResult);
    const shapeSystem = new ShapeNormalizer().normalize(rawResult);
    const layoutSystem = new LayoutNormalizer().normalize(rawResult);
    const componentSystem = new ComponentNormalizer().normalize(
      rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem
    );

    return {
      status: 'completed',
      pageUrl: 'https://example.com/interactive-store',
      title: 'Interactive Storefront',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Comprehensive Interaction Category Detection', () => {
    it('detects all major interaction categories and patterns', () => {
      const data = buildRichInteractionMockData();
      const system = buildInteractionGraphSystem(data);

      expect(system.totalInteractions).toBeGreaterThanOrEqual(10);
      expect(system.summary.stateInteractions).toBeGreaterThan(0);
      expect(system.summary.drawerInteractions).toBeGreaterThanOrEqual(1);
      expect(system.summary.modalInteractions).toBeGreaterThanOrEqual(1);
      expect(system.summary.dropdownInteractions).toBeGreaterThanOrEqual(1);
      expect(system.summary.accordionInteractions).toBeGreaterThanOrEqual(1);
      expect(system.summary.carouselInteractions).toBeGreaterThanOrEqual(1);
      expect(system.summary.tabsInteractions).toBeGreaterThanOrEqual(1);
      expect(system.summary.ajaxInteractions).toBeGreaterThanOrEqual(1);
      expect(system.summary.navigationInteractions).toBeGreaterThanOrEqual(1);
      expect(system.summary.scrollInteractions).toBeGreaterThanOrEqual(1);
      expect(system.summary.stickyInteractions).toBeGreaterThanOrEqual(1);
    });

    it('detects micro-interaction state lifecycles for buttons (hover, focus, active, disabled, loading)', () => {
      const data = buildRichInteractionMockData();
      const system = buildInteractionGraphSystem(data);

      const btnInteraction = system.interactions.find((i) => i.category === 'state' && i.trigger.selector.includes('button'));
      expect(btnInteraction).toBeDefined();
      expect(btnInteraction?.stateMachine.states['idle']).toBeDefined();
      expect(btnInteraction?.stateMachine.states['hovered']).toBeDefined();
      expect(btnInteraction?.stateMachine.states['active']).toBeDefined();
      expect(btnInteraction?.stateMachine.states['focused']).toBeDefined();
      expect(btnInteraction?.stateMachine.states['loading']).toBeDefined();
      expect(btnInteraction?.stateMachine.states['disabled']).toBeDefined();
    });
  });

  describe('2. Interaction Field & Contract Completeness', () => {
    it('guarantees trigger, affectedNodes, animation, duration, easing, overlay, and stateMachine on all nodes', () => {
      const data = buildRichInteractionMockData();
      const system = buildInteractionGraphSystem(data);

      system.interactions.forEach((ix) => {
        expect(ix.id).toMatch(/^ix_/);
        expect(ix.name).toBeDefined();
        expect(ix.category).toBeDefined();
        expect(ix.description).toBeDefined();

        // Trigger
        expect(ix.trigger).toBeDefined();
        expect(ix.trigger.event).toBeDefined();
        expect(ix.trigger.targetElementId).toBeDefined();
        expect(ix.trigger.selector).toBeDefined();

        // Affected Nodes
        expect(ix.affectedNodes).toBeDefined();
        expect(Array.isArray(ix.affectedNodes)).toBe(true);
        expect(ix.affectedNodes.length).toBeGreaterThan(0);
        ix.affectedNodes.forEach((node) => {
          expect(node.elementId).toBeDefined();
          expect(node.role).toBeDefined();
          expect(node.propertyChanges).toBeDefined();
        });

        // Animation
        expect(ix.animation).toBeDefined();
        expect(ix.animation.type).toBeDefined();

        // Timing
        expect(typeof ix.duration).toBe('number');
        expect(ix.easing).toBeDefined();

        // Overlay
        expect(ix.overlay).toBeDefined();
        expect(typeof ix.overlay.hasBackdrop).toBe('boolean');

        // State Machine
        expect(ix.stateMachine).toBeDefined();
        expect(ix.stateMachine.initialState).toBeDefined();
        expect(ix.stateMachine.states).toBeDefined();
        expect(Object.keys(ix.stateMachine.states).length).toBeGreaterThanOrEqual(2);

        // Confidence
        expect(ix.confidence).toBeGreaterThanOrEqual(0.85);
        expect(ix.evidence.length).toBeGreaterThan(0);
      });
    });

    it('correctly configures modal and drawer overlays with backdrop and scroll locking', () => {
      const data = buildRichInteractionMockData();
      const system = buildInteractionGraphSystem(data);

      const drawer = system.interactions.find((i) => i.category === 'drawer');
      expect(drawer).toBeDefined();
      expect(drawer?.overlay.hasBackdrop).toBe(true);
      expect(drawer?.overlay.lockScroll).toBe(true);
      expect(drawer?.overlay.closeOnBackdropClick).toBe(true);

      const modal = system.interactions.find((i) => i.category === 'modal');
      expect(modal).toBeDefined();
      expect(modal?.overlay.hasBackdrop).toBe(true);
      expect(modal?.overlay.lockScroll).toBe(true);
    });

    it('correctly configures AJAX async form state transitions', () => {
      const data = buildRichInteractionMockData();
      const system = buildInteractionGraphSystem(data);

      const ajax = system.interactions.find((i) => i.category === 'ajax');
      expect(ajax).toBeDefined();
      expect(ajax?.trigger.event).toBe('submit');
      expect(ajax?.stateMachine.states['pending']).toBeDefined();
      expect(ajax?.stateMachine.states['success']).toBeDefined();
      expect(ajax?.stateMachine.states['error']).toBeDefined();
    });
  });

  describe('3. Export Pipeline Integration', () => {
    it('exports a valid interactions.json artifact matching schema', () => {
      const data = buildRichInteractionMockData();
      const jsonStr = exportInteractionsJson(data);

      expect(typeof jsonStr).toBe('string');
      const parsed = JSON.parse(jsonStr);

      expect(parsed.$schema).toContain('interactions-v1.json');
      expect(parsed.totalInteractions).toBeGreaterThan(0);
      expect(parsed.interactions).toBeDefined();
      expect(Array.isArray(parsed.interactions)).toBe(true);
      expect(parsed.summary).toBeDefined();
      expect(parsed.interactiveElements).toBeDefined();
    });

    it('supports standalone interactions format in ArtifactExporter', () => {
      const data = buildRichInteractionMockData();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'interactions');
      expect(result.format).toBe('interactions');
      expect(result.exportedData).toBeDefined();

      const parsed = JSON.parse(result.exportedData);
      expect(parsed.interactions).toBeDefined();
      expect(parsed.summary).toBeDefined();
    });
  });
});
