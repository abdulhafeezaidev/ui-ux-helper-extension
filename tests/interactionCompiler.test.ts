import { describe, it, expect } from 'vitest';
import { InteractionCompiler } from '../src/compiler/passes/interactionCompiler.ts';
import { DesignCompiler } from '../src/compiler/DesignCompiler.ts';
import { buildAgentDesignSpecification } from '../src/agent-spec/index.ts';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { ArtifactExporter } from '../src/output/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';
import { AgentDesignSpecification, ADSInteractionSpec } from '../src/agent-spec/schema.ts';

describe('InteractionCompiler Semantic Interactions Engine', () => {
  function createInteractiveTestPage(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="root" style="width: 100%; background: #ffffff;">
        <!-- Sticky Header Navigation -->
        <header id="main-nav" class="navigation" style="position: sticky; top: 0; display: flex; justify-content: space-between; padding: 16px 24px; background: #ffffff;">
          <div class="logo">Brand</div>
          <nav><a href="#">Shop</a><a href="#">About</a></nav>
          <button id="cart-drawer-trigger" style="padding: 8px 16px;">Cart</button>
        </header>

        <!-- Product Grid with Product Cards -->
        <section id="product-section" style="padding: 40px 24px;">
          <div class="product-card" id="card-1" style="border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
            <div class="image-wrapper">
              <img src="primary.jpg" class="primary-img" alt="Item 1" />
              <img src="secondary.jpg" class="secondary-img" alt="Item 1 Alt" style="opacity: 0; display: none;" />
            </div>
            <h3>Premium Leather Bag</h3>
            <span class="price">$199.00</span>
            <button class="quick-view-btn" style="padding: 8px 16px;">Quick View</button>
            <button class="add-to-cart-btn" style="padding: 10px 20px; background: #2563eb; color: #ffffff;">Add to Cart</button>
          </div>
        </section>

        <!-- Carousel Slider -->
        <section id="carousel-section" class="carousel" style="overflow: hidden; padding: 32px 24px;">
          <div class="carousel-track" style="display: flex; gap: 16px; transform: translateX(0px);">
            <div class="slide">Slide 1</div>
            <div class="slide">Slide 2</div>
            <div class="slide">Slide 3</div>
          </div>
          <button id="prev-btn">Prev</button>
          <button id="next-btn">Next</button>
        </section>

        <!-- Accordion FAQ -->
        <section id="faq-section" style="padding: 32px 24px;">
          <div class="accordion-item" id="acc-1">
            <button class="accordion-trigger" style="width: 100%; text-align: left;">What is the warranty?</button>
            <div class="accordion-panel" style="max-height: 0; overflow: hidden;">1 year full warranty.</div>
          </div>
        </section>

        <!-- Modal Dialog -->
        <div id="quick-view-modal" class="modal-dialog" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5);">
          <div class="modal-content" style="background: #ffffff; padding: 32px; border-radius: 12px; margin: auto;">
            <h2>Quick Look</h2>
            <p>Product description and specifications.</p>
            <button id="close-modal">Close</button>
          </div>
        </div>

        <!-- Drawer Sheet -->
        <aside id="side-drawer" class="drawer-sheet" style="position: fixed; right: -400px; width: 400px; height: 100%; background: #ffffff;">
          <h2>Your Cart</h2>
          <button id="close-drawer">Close</button>
        </aside>
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
      pageUrl: 'https://interactions.example.com',
      title: 'Semantic Interaction Demonstration',
      timestamp: Date.now(),
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  it('replaces low-level event storage (mouseenter, mouseleave, opacity, transform) with high-level semantic interactions', () => {
    const rawInteractions: ADSInteractionSpec[] = [
      {
        id: 'ev-1',
        name: 'Product Card Hover',
        trigger: 'mouseenter',
        effect: 'opacity 0.8, transform translateY(-4px)',
        state: 'hovered',
        duration: 150,
        visibilityChanges: true,
        affectedElements: ['card-1', 'btn-add'],
      },
      {
        id: 'ev-2',
        name: 'FAQ Disclosure',
        trigger: 'click',
        effect: 'accordion disclosure height expand',
        state: 'expanded',
        duration: 250,
        affectedElements: ['acc-1'],
      },
      {
        id: 'ev-3',
        name: 'Cart Drawer Slide',
        trigger: 'click',
        effect: 'drawer sheet slide open transform translateX',
        state: 'open',
        duration: 300,
        affectedElements: ['side-drawer'],
      },
      {
        id: 'ev-4',
        name: 'Product Preview Modal',
        trigger: 'click',
        effect: 'modal fade in dialog backdrop barrier',
        state: 'open',
        duration: 300,
        affectedElements: ['quick-view-modal'],
      },
      {
        id: 'ev-5',
        name: 'Header Sticky Nav',
        trigger: 'scroll',
        effect: 'sticky header pinned position fixed',
        state: 'pinned',
        duration: 150,
        affectedElements: ['main-nav'],
      },
      {
        id: 'ev-6',
        name: 'Hero Carousel Next',
        trigger: 'click',
        effect: 'carousel slide track transform translateX',
        state: 'next-slide',
        duration: 350,
        affectedElements: ['carousel-track'],
      },
      {
        id: 'ev-7',
        name: 'Product Card Quick View',
        trigger: 'click',
        effect: 'quick view preview modal trigger',
        state: 'preview-active',
        duration: 250,
        affectedElements: ['card-1'],
      },
      {
        id: 'ev-8',
        name: 'Card Image Hover Swap',
        trigger: 'hover',
        effect: 'image swap secondary gallery preview',
        state: 'image-swapped',
        duration: 200,
        affectedElements: ['card-1'],
      },
    ];

    const baseAds = buildAgentDesignSpecification(createInteractiveTestPage());
    const ads: AgentDesignSpecification = {
      ...baseAds,
      metadata: {
        ...baseAds.metadata,
        title: 'Low Level Event Replacement Test',
        pageUrl: 'https://events.example.com',
      },
      interactions: rawInteractions,
    };

    const compiler = new InteractionCompiler();
    const context = {
      adsVersion: '1.0.0',
      pageUrl: ads.metadata.pageUrl,
      pageTitle: ads.metadata.title,
      passesExecuted: [],
      diagnostics: [],
      metrics: {
        totalTokens: 0,
        totalComponents: 0,
        totalContainers: 0,
        totalInteractions: 0,
        compilationTimeMs: 0,
      },
      addDiagnostic: () => {},
    };

    const grammar = compiler.compile(ads, context);

    // Verify all 8 canonical interactions are compiled
    const semanticNames = Object.values(grammar.semanticInteractions).map((s) => s.name);
    expect(semanticNames).toContain('Hover Reveal');
    expect(semanticNames).toContain('Accordion Expand');
    expect(semanticNames).toContain('Drawer Open');
    expect(semanticNames).toContain('Modal Fade');
    expect(semanticNames).toContain('Sticky Navigation');
    expect(semanticNames).toContain('Carousel Slide');
    expect(semanticNames).toContain('Quick View');
    expect(semanticNames).toContain('Image Swap');

    // Verify NO raw event listener names like 'mouseenter' or 'mouseleave' stored as interaction names
    expect(semanticNames).not.toContain('mouseenter');
    expect(semanticNames).not.toContain('mouseleave');
    expect(semanticNames).not.toContain('opacity');
    expect(semanticNames).not.toContain('transform');
  });

  it('verifies each interaction stores trigger, state, animation token, duration, and affected components', () => {
    const rawInteractions: ADSInteractionSpec[] = [
      {
        id: 'raw-reveal',
        name: 'Hover Reveal',
        trigger: 'hover',
        effect: 'reveal secondary details',
        state: 'revealed',
        duration: 150,
        affectedElements: ['card-item-1', 'btn-action'],
      },
      {
        id: 'raw-accordion',
        name: 'Accordion Expand',
        trigger: 'click',
        effect: 'expand details panel',
        state: 'expanded',
        duration: 250,
        affectedElements: ['faq-accordion'],
      },
      {
        id: 'raw-drawer',
        name: 'Drawer Open',
        trigger: 'click',
        effect: 'slide cart sheet',
        state: 'open',
        duration: 300,
        affectedElements: ['cart-drawer'],
      },
      {
        id: 'raw-modal',
        name: 'Modal Fade',
        trigger: 'click',
        effect: 'fade dialog in',
        state: 'open',
        duration: 300,
        affectedElements: ['item-modal'],
      },
      {
        id: 'raw-sticky',
        name: 'Sticky Navigation',
        trigger: 'scroll',
        effect: 'sticky header pin',
        state: 'pinned',
        duration: 150,
        affectedElements: ['site-nav'],
      },
      {
        id: 'raw-carousel',
        name: 'Carousel Slide',
        trigger: 'click',
        effect: 'carousel slide transition',
        state: 'slide-next',
        duration: 350,
        affectedElements: ['product-slider'],
      },
      {
        id: 'raw-quickview',
        name: 'Quick View',
        trigger: 'click',
        effect: 'open preview',
        state: 'preview-active',
        duration: 250,
        affectedElements: ['product-card', 'quick-modal'],
      },
      {
        id: 'raw-imageswap',
        name: 'Image Swap',
        trigger: 'hover',
        effect: 'swap gallery image',
        state: 'secondary',
        duration: 200,
        affectedElements: ['card-media'],
      },
    ];

    const baseAds2 = buildAgentDesignSpecification(createInteractiveTestPage());
    const ads: AgentDesignSpecification = {
      ...baseAds2,
      metadata: {
        ...baseAds2.metadata,
        title: 'Contract Field Completeness Test',
        pageUrl: 'https://test.example.com',
      },
      interactions: rawInteractions,
    };

    const compiler = new InteractionCompiler();
    const context = {
      adsVersion: '1.0.0',
      pageUrl: ads.metadata.pageUrl,
      pageTitle: ads.metadata.title,
      passesExecuted: [],
      diagnostics: [],
      metrics: {
        totalTokens: 0,
        totalComponents: 0,
        totalContainers: 0,
        totalInteractions: 0,
        compilationTimeMs: 0,
      },
      addDiagnostic: () => {},
    };

    const grammar = compiler.compile(ads, context);

    // Verify all interactions have the 5 mandatory contracts: trigger, state, animation token, duration, affected components
    Object.values(grammar.semanticInteractions).forEach((interaction) => {
      // 1. trigger
      expect(interaction.trigger).toBeDefined();
      expect(['hover', 'click', 'scroll-threshold', 'viewport-entry', 'focus']).toContain(interaction.trigger);

      // 2. state
      expect(interaction.state).toBeDefined();
      expect(interaction.state.from).toBeDefined();
      expect(interaction.state.to).toBeDefined();

      // 3. animation token (canonical reference + space-separated alias)
      expect(interaction.animationToken).toMatch(/^animation\.duration\.(fast|normal|slow)$/);
      expect(interaction['animation token']).toBe(interaction.animationToken);

      // 4. duration
      expect(typeof interaction.duration).toBe('number');
      expect(interaction.duration).toBeGreaterThan(0);

      // 5. affected components (archetype references + space-separated alias)
      expect(Array.isArray(interaction.affectedComponents)).toBe(true);
      expect(interaction.affectedComponents.length).toBeGreaterThan(0);
      interaction.affectedComponents.forEach((comp) => {
        expect(comp.startsWith('archetype-')).toBe(true);
      });
      expect(interaction['affected components']).toEqual(interaction.affectedComponents);
    });
  });

  it('synthesizes canonical semantic interactions from component archetypes even without raw interaction traces', () => {
    const data = createInteractiveTestPage();
    const ads = buildAgentDesignSpecification(data);

    // Simulate ADS with components but empty interactions
    const adsWithComponentsOnly: AgentDesignSpecification = {
      ...ads,
      interactions: [],
    };

    const compiler = new InteractionCompiler();
    const context = {
      adsVersion: '1.0.0',
      pageUrl: ads.metadata.pageUrl,
      pageTitle: ads.metadata.title,
      passesExecuted: [],
      diagnostics: [],
      metrics: {
        totalTokens: 0,
        totalComponents: 0,
        totalContainers: 0,
        totalInteractions: 0,
        compilationTimeMs: 0,
      },
      addDiagnostic: () => {},
    };

    const grammar = compiler.compile(adsWithComponentsOnly, context);

    const names = Object.values(grammar.semanticInteractions).map((s) => s.name);
    // Should synthesize based on detected product cards, buttons, etc.
    expect(names).toContain('Hover Reveal');
    expect(names).toContain('Elevation Shift');
    expect(names).toContain('Image Swap');
    expect(names).toContain('Quick View');
    expect(grammar.totalInteractions).toBeGreaterThan(0);
  });

  it('exports interactionGrammar.json via ArtifactExporter and includes it in compiled-design', () => {
    const data = createInteractiveTestPage();
    const exporter = new ArtifactExporter();

    // 1. Dedicated export format 'interactionGrammar.json'
    const directExport = exporter.export(data, 'interactionGrammar.json');
    expect(directExport.exportedData).toBeDefined();
    const parsedDirect = JSON.parse(directExport.exportedData);
    expect(parsedDirect.semanticInteractions).toBeDefined();
    expect(parsedDirect.statistics).toBeDefined();
    expect(parsedDirect.interactions).toBeDefined();
    expect(directExport.artifacts).toBeDefined();
    expect(directExport.artifacts!['interactionGrammar.json']).toBeDefined();

    // 2. Export format 'interaction-grammar'
    const hyphenExport = exporter.export(data, 'interaction-grammar');
    expect(hyphenExport.exportedData).toBeDefined();
    expect(hyphenExport.artifacts!['interactionGrammar.json']).toBeDefined();

    // 3. Compiled Design package export
    const compiledExport = exporter.export(data, 'compiled-design');
    expect(compiledExport.artifacts!['interactionGrammar.json']).toBeDefined();
    expect(compiledExport.artifacts!['interaction-grammar.json']).toBeDefined();

    const compiledPkg = JSON.parse(compiledExport.exportedData);
    expect(compiledPkg.interactionGrammar).toBeDefined();
    expect(compiledPkg.interactionGrammar.semanticInteractions).toBeDefined();
    expect(compiledPkg.interactionGrammar.statistics).toBeDefined();
    expect(compiledPkg.interactionGrammar.statistics.compressionRatio).toBeGreaterThanOrEqual(1.0);
  });

  it('computes low-level event elimination and compression statistics', () => {
    const data = createInteractiveTestPage();
    const compiler = new DesignCompiler();
    const pkg = compiler.compile(buildAgentDesignSpecification(data));

    const stats = pkg.interactionGrammar.statistics;
    expect(stats.totalLowLevelEvents).toBeGreaterThan(0);
    expect(stats.semanticInteractionsCount).toBeGreaterThan(0);
    expect(stats.compressionRatio).toBeGreaterThan(1.0);
    expect(stats.eliminatedEventListenersCount).toBeGreaterThan(0);
  });

  it('maintains backwards compatibility for legacy interactions consumers', () => {
    const data = createInteractiveTestPage();
    const compiler = new DesignCompiler();
    const pkg = compiler.compile(buildAgentDesignSpecification(data));

    const grammar = pkg.interactionGrammar;
    expect(grammar.interactions).toBeDefined();
    expect(Array.isArray(grammar.interactions)).toBe(true);
    expect(grammar.interactions.length).toBeGreaterThan(0);
    expect(grammar.totalInteractions).toBe(grammar.interactions.length);

    grammar.interactions.forEach((legacy) => {
      expect(legacy.id).toBeDefined();
      expect(legacy.targetComponentId).toBeDefined();
      expect(legacy.trigger).toBeDefined();
      expect(legacy.sourceState).toBeDefined();
      expect(legacy.targetState).toBeDefined();
      expect(legacy.motionIntent).toBeDefined();
      expect(legacy.motionIntent.durationMs).toBeGreaterThan(0);
    });
  });

  it('strictly adheres to non-DOM and non-CSS keyframe dump constraints', () => {
    const data = createInteractiveTestPage();
    const ads = buildAgentDesignSpecification(data);

    const compiler = new InteractionCompiler();
    const context = {
      adsVersion: '1.0.0',
      pageUrl: ads.metadata.pageUrl,
      pageTitle: ads.metadata.title,
      passesExecuted: [],
      diagnostics: [],
      metrics: {
        totalTokens: 0,
        totalComponents: 0,
        totalContainers: 0,
        totalInteractions: 0,
        compilationTimeMs: 0,
      },
      addDiagnostic: () => {},
    };

    const grammar = compiler.compile(ads, context);
    const grammarJson = JSON.stringify(grammar);

    // Invariant: ZERO DOM event listener code strings
    expect(grammarJson).not.toContain('addEventListener');
    expect(grammarJson).not.toContain('removeEventListener');
    expect(grammarJson).not.toContain('@keyframes');
    expect(grammarJson).not.toContain('document.querySelector');
  });
});
