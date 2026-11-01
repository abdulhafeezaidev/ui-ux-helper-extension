import {
  AnalyzePageResponseData,
  BuildDependencyGraphSpecification,
  BuildPhaseId,
  BuildPhaseNode,
} from '../../types/index.ts';

export class BuildDependencyGraphEngine {
  public normalize(data: AnalyzePageResponseData): BuildDependencyGraphSpecification {
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';

    const phases: Record<BuildPhaseId, BuildPhaseNode> = {
      tokens: {
        phaseId: 'tokens',
        stepNumber: 1,
        name: 'Create Design Tokens',
        description: 'Extract and standardize atomic color palettes, spatial scales, border radii, shadows, and surface elevations into CSS custom properties and Tailwind configuration.',
        prerequisites: [],
        outputs: ['css-variables.css', 'tailwind.config.js', '03_design-system.json', 'TokenRegistry.json'],
        validationChecklist: [
          'All primary, surface, and semantic colors mapped to CSS variables',
          'Spacing scale matches 4px/8px rhythm tokens',
          'Border radius and elevation shadow tokens defined',
        ],
        estimatedComplexity: 'low',
      },
      typography: {
        phaseId: 'typography',
        stepNumber: 2,
        name: 'Create Typography',
        description: 'Define web font families, font size scale, line height hierarchy, font weights, and typographic vertical rhythm rules.',
        prerequisites: ['tokens'],
        outputs: ['14_typography.json', 'typography-rhythm.json'],
        validationChecklist: [
          'Display, H1-H6, Body, Caption, and Badge font styles defined',
          'Line height ratio maintains comfortable reading rhythm',
          'Font fallbacks configured correctly',
        ],
        estimatedComplexity: 'low',
      },
      containers: {
        phaseId: 'containers',
        stepNumber: 3,
        name: 'Create Layout Containers',
        description: 'Establish layout primitive wrappers (FlexRow, FlexColumn, GridContainer, SectionContainer, and ModalDialog) with responsive padding and alignment defaults.',
        prerequisites: ['tokens'],
        outputs: ['04_layout.json', 'ContainerHierarchy.json', '12_constraints.json'],
        validationChecklist: [
          'Root and section containers enforce max-width boundaries',
          'Flexbox auto-alignment and spacing gap tokens bound to container slots',
          'CSS Grid column templates support dynamic track repetition',
        ],
        estimatedComplexity: 'medium',
      },
      components: {
        phaseId: 'components',
        stepNumber: 4,
        name: 'Create Shared Components',
        description: 'Scaffold atomic reusable primitives (Button, Input, Badge, Avatar, Card, MediaFrame) using registered design tokens and typography styles.',
        prerequisites: ['tokens', 'typography', 'containers'],
        outputs: ['02_components.json', 'ComponentRegistry.json', 'IntentMap.json'],
        validationChecklist: [
          'Base components declare zero absolute coordinates',
          'Components consume design tokens rather than hardcoded hex codes',
          'Every component is assigned a canonical semantic intent',
        ],
        estimatedComplexity: 'high',
      },
      variants: {
        phaseId: 'variants',
        stepNumber: 5,
        name: 'Create Variants',
        description: 'Implement explicit component variants across sizing (sm, md, lg), visual weight (primary, secondary, outline, ghost), and contextual states.',
        prerequisites: ['components'],
        outputs: ['15_variants.json', 'VariantGraph.json'],
        validationChecklist: [
          'Variant axes cleanly mutate styling without breaking base contract',
          'Variant fingerprints link directly to canonical component IDs',
          'Active and hover variations documented deterministically',
        ],
        estimatedComplexity: 'medium',
      },
      sections: {
        phaseId: 'sections',
        stepNumber: 6,
        name: 'Assemble Sections',
        description: 'Compose higher-level page sections (Header, Hero, Feature Grid, Product Grid, Testimonials, Footer) from shared components and layout containers.',
        prerequisites: ['containers', 'components', 'variants'],
        outputs: ['SectionFlow.json', 'LayoutRelationshipGraph.json', '17_content.json'],
        validationChecklist: [
          'Section ordering conforms to natural document reading flow',
          'Inter-section vertical rhythm tokens enforce consistent spacing',
          'Header and footer sticky/persistent anchoring verified',
        ],
        estimatedComplexity: 'high',
      },
      pages: {
        phaseId: 'pages',
        stepNumber: 7,
        name: 'Build Pages',
        description: 'Assemble complete page views by composing assembled sections inside the root container hierarchy with slot assignments.',
        prerequisites: ['sections'],
        outputs: ['01_reconstruction.json', '18_reconstruction_graph.json', '11_render_tree.json'],
        validationChecklist: [
          'Full render tree matches visual hierarchy of reference DOM',
          'Page title, meta tags, and root container setup correctly',
          'Component and section slot bindings verified',
        ],
        estimatedComplexity: 'medium',
      },
      interactions: {
        phaseId: 'interactions',
        stepNumber: 8,
        name: 'Connect Interactions',
        description: 'Implement interactive event triggers, hover/active micro-interactions, modal dialog toggles, dropdowns, and timeline motions.',
        prerequisites: ['components', 'sections', 'pages'],
        outputs: ['05_behavior.json', '16_motion.json'],
        validationChecklist: [
          'Click, hover, focus, and drawer transitions operate smoothly',
          'Motion easing curves and transition durations match specs',
          'No broken action listeners or unhandled state transitions',
        ],
        estimatedComplexity: 'medium',
      },
      responsive: {
        phaseId: 'responsive',
        stepNumber: 9,
        name: 'Optimize Responsive Layout',
        description: 'Apply fluid responsive rules, mobile navigation drawers, multi-column grid collapses, and media query scale adaptations.',
        prerequisites: ['pages', 'interactions'],
        outputs: ['13_responsive.json'],
        validationChecklist: [
          'Zero horizontal overflow across all mobile, tablet, and desktop breakpoints',
          'Multi-column grids gracefully collapse to 1 or 2 columns on mobile',
          'Touch targets remain >= 44px on touch viewports',
        ],
        estimatedComplexity: 'medium',
      },
      accessibility: {
        phaseId: 'accessibility',
        stepNumber: 10,
        name: 'Accessibility Pass',
        description: 'Verify WCAG AA compliance, ARIA role mappings, color contrast ratios, screen reader labels, and keyboard navigation focus rings.',
        prerequisites: ['pages', 'interactions', 'responsive'],
        outputs: ['07_accessibility.json'],
        validationChecklist: [
          'All text meets WCAG AA contrast ratio (>= 4.5:1 for normal text, >= 3:1 for large)',
          'All interactive buttons, links, and inputs have accessible names or aria-labels',
          'Keyboard tab navigation operates in logical order with visible focus indicators',
        ],
        estimatedComplexity: 'low',
      },
    };

    const executionPipeline = [
      '1. Create Design Tokens',
      '2. Create Typography',
      '3. Create Layout Containers',
      '4. Create Shared Components',
      '5. Create Variants',
      '6. Assemble Sections',
      '7. Build Pages',
      '8. Connect Interactions',
      '9. Optimize Responsive Layout',
      '10. Accessibility Pass',
    ];

    let totalDependencies = 0;
    for (const phase of Object.values(phases)) {
      totalDependencies += phase.prerequisites.length;
    }

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/build-dependency-graph-v2.json',
      version: '2.0.0',
      target: { title, url },
      summary: {
        totalPhases: 10,
        totalDependencies,
        executionPipeline,
        criticalPathLength: 8,
      },
      phases,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
