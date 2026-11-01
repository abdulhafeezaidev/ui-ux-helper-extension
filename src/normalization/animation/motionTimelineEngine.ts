import {
  AnalyzePageResponseData,
  RawElementNode,
  MotionTimelineSpecification,
  ChoreographedTimeline,
  TimelineActorTrack,
  TimelineStaggerSpec,
} from '../../types/index.ts';

export class MotionTimelineEngine {
  /**
   * Main entry point: transforms discrete animations, transitions, and runtime states
   * into chronological, multi-actor animation timelines (16_motion.json).
   */
  public normalize(data: AnalyzePageResponseData): MotionTimelineSpecification {
    const rawElements = data.extractionResult?.elements || [];
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';

    const timelines: ChoreographedTimeline[] = [];

    // 1. Build Stagger Timelines (Card grids, navigation lists, features)
    const staggerTimelines = this.detectStaggerTimelines(rawElements);
    timelines.push(...staggerTimelines);

    // 2. Build Hover Micro-Interaction Timelines (Buttons, cards, interactive CTAs)
    const hoverTimelines = this.detectHoverTimelines(rawElements);
    timelines.push(...hoverTimelines);

    // 3. Build Scroll-Driven Reveal Timelines (Sections, hero elements)
    const scrollTimelines = this.detectScrollTimelines(rawElements);
    timelines.push(...scrollTimelines);

    // 4. Build Modal Dialog Timelines
    const modalTimelines = this.detectModalTimelines(rawElements);
    timelines.push(...modalTimelines);

    // 5. Build Drawer Sheet Timelines
    const drawerTimelines = this.detectDrawerTimelines(rawElements);
    timelines.push(...drawerTimelines);

    // Fallback if no specific timelines were detected
    if (timelines.length === 0) {
      timelines.push(this.createDefaultPageMountTimeline());
      timelines.push(this.createDefaultHoverTimeline());
    }

    // Compute summary metrics
    const totalActorTracks = timelines.reduce((acc, t) => acc + t.tracks.length, 0);
    const hoverCount = timelines.filter((t) => t.category === 'hover').length;
    const staggerCount = timelines.filter((t) => t.category === 'stagger').length;
    const scrollCount = timelines.filter((t) => t.category === 'scroll').length;
    const modalCount = timelines.filter((t) => t.category === 'modal').length;
    const drawerCount = timelines.filter((t) => t.category === 'drawer').length;

    const totalDurations = timelines.reduce((acc, t) => acc + t.totalDurationMs, 0);
    const avgDuration = timelines.length > 0 ? Math.round(totalDurations / timelines.length) : 300;

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/motion-timeline-v1.json',
      version: '1.0.0',
      target: {
        title,
        url,
      },
      summary: {
        totalTimelines: timelines.length,
        totalActorTracks,
        hoverTimelinesCount: hoverCount,
        staggerTimelinesCount: staggerCount,
        scrollTimelinesCount: scrollCount,
        modalTimelinesCount: modalCount,
        drawerTimelinesCount: drawerCount,
        framerMotionReady: true,
        averageAnimationDurationMs: avgDuration,
      },
      timelines,
      metadata: {
        generatedAt: new Date().toISOString(),
        extractorVersion: '1.0.0-motion-timeline-engine',
        guidanceForAI: [
          'TIMELINE RECONSTRUCTION DIRECTIVE: Build animations as orchestrated timelines with millisecond offsets rather than isolated CSS declarations.',
          'FRAMER MOTION INTEGRATION: Use the provided framerMotionCode directly with motion components (motion.div, AnimatePresence).',
          'STAGGER SEQUENCING: For card grids and navigation items, apply staggerChildren intervals from stagger.staggerIntervalMs.',
          'MODAL & DRAWER SYNCHRONIZATION: Coordinate backdrop opacity fade with dialog scale-in or drawer slide-in tracks simultaneously.'
        ],
      },
    };
  }

  /**
   * 1. Detects Staggered Container Timelines (e.g. Card Grids, Feature Lists).
   */
  private detectStaggerTimelines(elements: RawElementNode[]): ChoreographedTimeline[] {
    const timelines: ChoreographedTimeline[] = [];
    const cardElements = elements.filter((e) =>
      e.className?.includes('card') ||
      e.className?.includes('item') ||
      e.role === 'article' ||
      e.role === 'listitem'
    );

    if (cardElements.length >= 2) {
      const staggerInterval = 75; // 75ms stagger between cards
      const durationPerCard = 350; // 350ms per card reveal
      const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';

      const tracks: TimelineActorTrack[] = cardElements.slice(0, 6).map((el, index) => {
        const startTime = index * staggerInterval;
        const endTime = startTime + durationPerCard;

        return {
          actorId: el.id,
          actorSelector: `.${el.className?.split(' ')[0] || 'card'}:nth-child(${index + 1})`,
          role: 'grid-item-card',
          startTimeMs: startTime,
          durationMs: durationPerCard,
          endTimeMs: endTime,
          easing,
          properties: ['opacity', 'transform'],
          keyframes: [
            { offset: 0, styles: { opacity: 0, transform: 'translateY(24px) scale(0.96)' } },
            { offset: 1, styles: { opacity: 1, transform: 'translateY(0px) scale(1.0)' } },
          ],
          cssTransitionSnippet: `transition: opacity ${durationPerCard}ms ${easing} ${startTime}ms, transform ${durationPerCard}ms ${easing} ${startTime}ms;`,
          tailwindClasses: ['transition-all', 'duration-350', 'ease-out'],
        };
      });

      const totalDuration = tracks.length > 0 ? tracks[tracks.length - 1].endTimeMs : durationPerCard;

      const staggerSpec: TimelineStaggerSpec = {
        isStaggered: true,
        staggerIntervalMs: staggerInterval,
        staggerDirection: 'start-to-end',
        totalActors: tracks.length,
        cumulativeDurationMs: totalDuration,
      };

      timelines.push({
        id: 'timeline_cards_stagger_reveal',
        name: 'Card Grid Stagger Reveal Timeline',
        category: 'stagger',
        trigger: 'mount',
        totalDurationMs: totalDuration,
        primaryEasing: easing,
        tracks,
        stagger: staggerSpec,
        framerMotionCode: this.generateFramerMotionStaggerCode('CardGrid', staggerInterval, durationPerCard),
        cssKeyframesCode: this.generateCssKeyframesCode('fadeSlideUpStagger', 24),
      });
    }

    return timelines;
  }

  /**
   * 2. Detects Hover Micro-Interaction Timelines (Buttons, Interactive Cards).
   */
  private detectHoverTimelines(elements: RawElementNode[]): ChoreographedTimeline[] {
    const timelines: ChoreographedTimeline[] = [];
    const buttons = elements.filter((e) => e.tagName === 'button' || e.role === 'button');

    const duration = 200;
    const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';

    const tracks: TimelineActorTrack[] = (buttons.length > 0 ? buttons.slice(0, 3) : [{ id: 'el_btn_1', className: 'btn-primary' } as any]).map((el) => ({
      actorId: el.id,
      actorSelector: `.${el.className?.split(' ')[0] || 'btn'}`,
      role: 'interactive-cta',
      startTimeMs: 0,
      durationMs: duration,
      endTimeMs: duration,
      easing,
      properties: ['transform', 'box-shadow', 'background-color'],
      keyframes: [
        { offset: 0, styles: { transform: 'translateY(0px)', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' } },
        { offset: 1, styles: { transform: 'translateY(-2px)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' } },
      ],
      cssTransitionSnippet: `transition: all ${duration}ms ${easing};`,
      tailwindClasses: ['transition-all', 'duration-200', 'hover:-translate-y-0.5', 'hover:shadow-md'],
    }));

    timelines.push({
      id: 'timeline_button_hover_elevation',
      name: 'Button Hover Elevation Timeline',
      category: 'hover',
      trigger: 'hover',
      totalDurationMs: duration,
      primaryEasing: easing,
      tracks,
      framerMotionCode: `export const buttonHoverVariants = {\n  initial: { scale: 1, y: 0 },\n  hover: { scale: 1.02, y: -2, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },\n  tap: { scale: 0.98, y: 0 }\n};`,
      cssKeyframesCode: `.btn:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\n}`,
    });

    return timelines;
  }

  /**
   * 3. Detects Scroll-Driven Reveal Timelines.
   */
  private detectScrollTimelines(elements: RawElementNode[]): ChoreographedTimeline[] {
    const timelines: ChoreographedTimeline[] = [];
    const sections = elements.filter((e) => e.tagName === 'section' || e.role === 'region' || e.className?.includes('section'));

    const duration = 500;
    const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';

    const tracks: TimelineActorTrack[] = (sections.length > 0 ? sections.slice(0, 2) : [{ id: 'el_section_1', className: 'content-section' } as any]).map((el) => ({
      actorId: el.id,
      actorSelector: `section#${el.id || 'content'}`,
      role: 'scroll-section-reveal',
      startTimeMs: 0,
      durationMs: duration,
      endTimeMs: duration,
      easing,
      properties: ['opacity', 'transform'],
      keyframes: [
        { offset: 0, styles: { opacity: 0, transform: 'translateY(32px)' } },
        { offset: 1, styles: { opacity: 1, transform: 'translateY(0px)' } },
      ],
      cssTransitionSnippet: `transition: opacity ${duration}ms ${easing}, transform ${duration}ms ${easing};`,
      tailwindClasses: ['transition-all', 'duration-500', 'ease-out'],
    }));

    timelines.push({
      id: 'timeline_scroll_section_reveal',
      name: 'Scroll Section Reveal Timeline',
      category: 'scroll',
      trigger: 'scroll',
      totalDurationMs: duration,
      primaryEasing: easing,
      tracks,
      framerMotionCode: `export const scrollSectionVariants = {\n  hidden: { opacity: 0, y: 32 },\n  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }\n};`,
      cssKeyframesCode: `@keyframes sectionReveal {\n  from { opacity: 0; transform: translateY(32px); }\n  to { opacity: 1; transform: translateY(0); }\n}`,
    });

    return timelines;
  }

  /**
   * 4. Detects Modal Dialog Timelines (Backdrop + Content).
   */
  private detectModalTimelines(elements: RawElementNode[]): ChoreographedTimeline[] {
    const modalEl = elements.find((e) => e.role === 'dialog' || e.className?.includes('modal'));
    const duration = 250;
    const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';

    const tracks: TimelineActorTrack[] = [
      {
        actorId: 'modal_backdrop',
        actorSelector: '.modal-backdrop',
        role: 'overlay-backdrop',
        startTimeMs: 0,
        durationMs: 200,
        endTimeMs: 200,
        easing: 'ease-out',
        properties: ['opacity'],
        keyframes: [
          { offset: 0, styles: { opacity: 0 } },
          { offset: 1, styles: { opacity: 0.6 } },
        ],
        cssTransitionSnippet: `transition: opacity 200ms ease-out;`,
        tailwindClasses: ['transition-opacity', 'duration-200'],
      },
      {
        actorId: modalEl?.id || 'modal_dialog_content',
        actorSelector: '.modal-dialog',
        role: 'dialog-panel',
        startTimeMs: 50,
        durationMs: duration,
        endTimeMs: 50 + duration,
        easing,
        properties: ['opacity', 'transform'],
        keyframes: [
          { offset: 0, styles: { opacity: 0, transform: 'scale(0.95) translateY(10px)' } },
          { offset: 1, styles: { opacity: 1, transform: 'scale(1.0) translateY(0px)' } },
        ],
        cssTransitionSnippet: `transition: opacity ${duration}ms ${easing}, transform ${duration}ms ${easing};`,
        tailwindClasses: ['transition-all', 'duration-250', 'ease-out'],
      },
    ];

    return [
      {
        id: 'timeline_modal_dialog_entry',
        name: 'Modal Dialog Entry Timeline',
        category: 'modal',
        trigger: 'modal-open',
        totalDurationMs: 300,
        primaryEasing: easing,
        tracks,
        framerMotionCode: `export const modalBackdropVariants = {\n  hidden: { opacity: 0 },\n  visible: { opacity: 0.6, transition: { duration: 0.2 } }\n};\n\nexport const modalDialogVariants = {\n  hidden: { opacity: 0, scale: 0.95, y: 10 },\n  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: 0.05 } },\n  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } }\n};`,
        cssKeyframesCode: `@keyframes modalEntry {\n  from { opacity: 0; transform: scale(0.95) translateY(10px); }\n  to { opacity: 1; transform: scale(1.0) translateY(0); }\n}`,
      },
    ];
  }

  /**
   * 5. Detects Drawer Sheet Timelines (Backdrop + Slide Panel).
   */
  private detectDrawerTimelines(elements: RawElementNode[]): ChoreographedTimeline[] {
    const drawerEl = elements.find((e) => e.className?.includes('drawer') || e.className?.includes('sheet'));
    const duration = 300;
    const easing = 'cubic-bezier(0.32, 0.72, 0, 1)';

    const tracks: TimelineActorTrack[] = [
      {
        actorId: 'drawer_backdrop',
        actorSelector: '.drawer-backdrop',
        role: 'overlay-backdrop',
        startTimeMs: 0,
        durationMs: 250,
        endTimeMs: 250,
        easing: 'ease-out',
        properties: ['opacity'],
        keyframes: [
          { offset: 0, styles: { opacity: 0 } },
          { offset: 1, styles: { opacity: 0.5 } },
        ],
        cssTransitionSnippet: `transition: opacity 250ms ease-out;`,
        tailwindClasses: ['transition-opacity', 'duration-250'],
      },
      {
        actorId: drawerEl?.id || 'drawer_panel',
        actorSelector: '.drawer-panel',
        role: 'slide-over-panel',
        startTimeMs: 0,
        durationMs: duration,
        endTimeMs: duration,
        easing,
        properties: ['transform'],
        keyframes: [
          { offset: 0, styles: { transform: 'translateX(100%)' } },
          { offset: 1, styles: { transform: 'translateX(0%)' } },
        ],
        cssTransitionSnippet: `transition: transform ${duration}ms ${easing};`,
        tailwindClasses: ['transition-transform', 'duration-300', 'ease-in-out'],
      },
    ];

    return [
      {
        id: 'timeline_drawer_slide_entry',
        name: 'Drawer Slide-Over Entry Timeline',
        category: 'drawer',
        trigger: 'drawer-open',
        totalDurationMs: duration,
        primaryEasing: easing,
        tracks,
        framerMotionCode: `export const drawerBackdropVariants = {\n  hidden: { opacity: 0 },\n  visible: { opacity: 0.5, transition: { duration: 0.25 } }\n};\n\nexport const drawerPanelVariants = {\n  hidden: { x: "100%" },\n  visible: { x: "0%", transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } },\n  exit: { x: "100%", transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }\n};`,
        cssKeyframesCode: `@keyframes drawerSlideIn {\n  from { transform: translateX(100%); }\n  to { transform: translateX(0); }\n}`,
      },
    ];
  }

  private createDefaultPageMountTimeline(): ChoreographedTimeline {
    return {
      id: 'timeline_hero_mount_reveal',
      name: 'Hero Page Mount Reveal Timeline',
      category: 'mount',
      trigger: 'mount',
      totalDurationMs: 600,
      primaryEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      tracks: [
        {
          actorId: 'hero_title',
          actorSelector: 'h1.hero-title',
          role: 'headline-text',
          startTimeMs: 0,
          durationMs: 400,
          endTimeMs: 400,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          properties: ['opacity', 'transform'],
          keyframes: [
            { offset: 0, styles: { opacity: 0, transform: 'translateY(16px)' } },
            { offset: 1, styles: { opacity: 1, transform: 'translateY(0px)' } },
          ],
          cssTransitionSnippet: 'transition: opacity 400ms ease-out, transform 400ms ease-out;',
          tailwindClasses: ['transition-all', 'duration-400', 'ease-out'],
        },
        {
          actorId: 'hero_subtitle',
          actorSelector: 'p.hero-subtitle',
          role: 'lead-text',
          startTimeMs: 150,
          durationMs: 400,
          endTimeMs: 550,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          properties: ['opacity', 'transform'],
          keyframes: [
            { offset: 0, styles: { opacity: 0, transform: 'translateY(16px)' } },
            { offset: 1, styles: { opacity: 1, transform: 'translateY(0px)' } },
          ],
          cssTransitionSnippet: 'transition: opacity 400ms ease-out 150ms, transform 400ms ease-out 150ms;',
          tailwindClasses: ['transition-all', 'duration-400', 'ease-out', 'delay-150'],
        },
      ],
      framerMotionCode: `export const heroContainerVariants = {\n  hidden: { opacity: 0 },\n  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }\n};\nexport const heroItemVariants = {\n  hidden: { opacity: 0, y: 16 },\n  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }\n};`,
      cssKeyframesCode: `@keyframes heroReveal {\n  from { opacity: 0; transform: translateY(16px); }\n  to { opacity: 1; transform: translateY(0); }\n}`,
    };
  }

  private createDefaultHoverTimeline(): ChoreographedTimeline {
    return {
      id: 'timeline_interactive_hover',
      name: 'Interactive Element Hover Timeline',
      category: 'hover',
      trigger: 'hover',
      totalDurationMs: 150,
      primaryEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      tracks: [
        {
          actorId: 'el_hover_cta',
          actorSelector: '.btn, a.cta',
          role: 'interactive-element',
          startTimeMs: 0,
          durationMs: 150,
          endTimeMs: 150,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          properties: ['transform', 'box-shadow'],
          keyframes: [
            { offset: 0, styles: { transform: 'translateY(0px)' } },
            { offset: 1, styles: { transform: 'translateY(-1px)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' } },
          ],
          cssTransitionSnippet: 'transition: transform 150ms ease-in-out, box-shadow 150ms ease-in-out;',
          tailwindClasses: ['transition-all', 'duration-150', 'hover:-translate-y-0.5', 'hover:shadow-md'],
        },
      ],
      framerMotionCode: `export const hoverVariants = {\n  initial: { y: 0 },\n  hover: { y: -2, transition: { duration: 0.15 } }\n};`,
      cssKeyframesCode: `.interactive:hover {\n  transform: translateY(-2px);\n}`,
    };
  }

  private generateFramerMotionStaggerCode(name: string, intervalMs: number, durationMs: number): string {
    const sec = (intervalMs / 1000).toFixed(3);
    const durSec = (durationMs / 1000).toFixed(2);
    return [
      `export const ${name.toLowerCase()}ContainerVariants = {`,
      `  hidden: { opacity: 0 },`,
      `  visible: {`,
      `    opacity: 1,`,
      `    transition: {`,
      `      staggerChildren: ${sec},`,
      `      delayChildren: 0.1,`,
      `    },`,
      `  },`,
      `};`,
      ``,
      `export const ${name.toLowerCase()}ItemVariants = {`,
      `  hidden: { opacity: 0, y: 24, scale: 0.96 },`,
      `  visible: {`,
      `    opacity: 1,`,
      `    y: 0,`,
      `    scale: 1,`,
      `    transition: { duration: ${durSec}, ease: [0.16, 1, 0.3, 1] },`,
      `  },`,
      `};`,
    ].join('\n');
  }

  private generateCssKeyframesCode(name: string, translateYPx: number): string {
    return [
      `@keyframes ${name} {`,
      `  0% {`,
      `    opacity: 0;`,
      `    transform: translateY(${translateYPx}px) scale(0.96);`,
      `  }`,
      `  100% {`,
      `    opacity: 1;`,
      `    transform: translateY(0px) scale(1);`,
      `  }`,
      `}`,
    ].join('\n');
  }
}

/**
 * Functional helper for quick execution.
 */
export function buildMotionTimelineSpecification(data: AnalyzePageResponseData): MotionTimelineSpecification {
  return new MotionTimelineEngine().normalize(data);
}
