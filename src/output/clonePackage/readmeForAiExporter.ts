import { AnalyzePageResponseData } from '../../types/index.ts';
import { computeCloneConfidenceScore } from '../../normalization/fidelity/cloneConfidenceCalculator.ts';

export function exportReadmeForAi(data: AnalyzePageResponseData): string {
  const scores = computeCloneConfidenceScore(data);
  const title = data.title || 'Target Website';
  const url = data.pageUrl || 'https://example.com';
  const dateStr = new Date().toISOString().split('T')[0];

  return `# AI RECONSTRUCTION INSTRUCTIONS & RECONSTRUCTION GUIDE (CONSOLIDATED V2)

> **Target Application**: ${title}  
> **Source URL**: \`${url}\`  
> **Extraction Package Generated**: \`${dateStr}\`  
> **Target Framework**: Next.js (App Router) + React + Tailwind CSS + TypeScript + Lucide/SVG Icons

---

## 📊 Clone Confidence Scores & Fidelity Breakdown

| Dimension | Fidelity Score | Verification Status |
|-----------|----------------|---------------------|
| 🎨 **Visual Fidelity** | **${scores.visualFidelity}%** | Semantic Colors, Surfaces, Shadows, Gradients |
| 📐 **Layout Fidelity** | **${scores.layoutFidelity}%** | CSS Grid Tracks, Flex Alignments, Container Widths |
| 🔤 **Typography Fidelity** | **${scores.typographyFidelity}%** | Font Stacks, Weights, Line Heights, Fluid Clamps |
| 🧩 **Component Fidelity** | **${scores.componentFidelity}%** | Reusable Components, Props, Slots, Variants, Tree Integrity |
| ⚡ **Interaction Fidelity** | **${scores.interactionFidelity}%** | Hover, Focus, Active, Drawers, Modals, State Machines |
| 🎬 **Animation Fidelity** | **${scores.animationFidelity}%** | Keyframes, Transition Timings, Easings (\`cubic-bezier\`) |
| ♿ **Accessibility Fidelity** | **${scores.accessibilityFidelity}%** | Landmarks, Heading Hierarchy, Tab Order, Focus Traps |
| 🏆 **Overall AI Reconstruction Score** | **${scores.overallScore}% (${scores.grade})** | **${scores.verdict}** |

---

## 🎯 Master Objective & AI Prompt

You are an expert Frontend Architect tasked with reverse-engineering and cloning the source website with **100% pixel-perfect visual, structural, and behavioral fidelity**.

This package contains complete extracted **implementation intelligence**—no guesswork or hallucinations required.

### ⚠️ Zero-Guesswork Guardrail Rules:
1. **Zero Hallucination Policy**: Use **only** the design tokens, semantic colors, dimensions, spacing scales, and layout rules provided in this package.
2. **Deterministic Component Tree**: Construct components matching the exact boundaries and props in \`02_components.json\` and assemble them according to the tree in \`01_reconstruction.json\`.
3. **Exact Layout Constraints**: Adhere to the CSS Grid tracks, Flexbox directions, and responsive breakpoint rules specified in \`04_layout.json\`.
4. **Authentic Assets & Icons**: Embed the inline SVG vector paths and image specifications from \`06_assets.json\`.
5. **Interactive & Motion Fidelity**: Wire up the state machines from \`05_behavior.json\` with exact transition durations and \`cubic-bezier\` easings.
6. **Accessibility Compliance**: Structure semantic HTML landmarks, heading outlines, and focus traps according to \`07_accessibility.json\`.
7. **Rendering Layering & Z-Index**: Apply stacking context and paint order rules from \`11_render_tree.json\` to prevent layering defects.
8. **Constraint-Based Layout Reconstruction**: Use relational Flexbox, CSS Grid, Box Model, and Inset constraints from \`12_constraints.json\` instead of hardcoded absolute coordinates.
9. **Responsive Transition Graph**: Follow the step-by-step viewport deltas in \`13_responsive.json\` across 7 standard viewports (1440, 1280, 1024, 768, 640, 480, 375).
10. **Typography Rhythm & Scale**: Replicate exact vertical typography rhythm (baseline rhythm, modular scale ratio, paragraph and heading spacing margins, and reading widths) from \`14_typography.json\`.
11. **Component Variants & CVA**: Build scalable design system components using the CVA snippets and delta-only overridden properties in \`15_variants.json\` (Primary, Secondary, Outlined, Ghost, Filled, Elevated, Sizes & States).
12. **Motion Timeline Choreography**: Wire up multi-actor animation sequences, stagger intervals, and Framer Motion code from \`16_motion.json\` (Hover, Stagger, Scroll, Modal & Drawer timelines).
13. **Content Semantic Understanding**: Wire up functional text purposes, SEO keyword relevance, and dynamic data bindings from \`17_content.json\` (Headline, Subheadline, CTA, Body, Caption, Price, Rating, Badge, Breadcrumb, Navigation, FAQ, Legal, Metadata, Feature, Testimonial, Specification, Product Name, Category, Promotion, Footer).
14. **Master Reconstruction Graph**: Use \`18_reconstruction_graph.json\` as your single entry point and follow the topological \`reconstructionOrder\` to build the entire UI bottom-up without hunting across files.

---

## 📦 Package File Manifest (18 Consolidated Artifacts)

| File | Purpose | Key Usage |
|------|---------|-----------|
| \`01_reconstruction.json\` | Single canonical master reconstruction model | Single source of truth: page structure, DOM depth, section hierarchy, z-indexes, confidence |
| \`02_components.json\` | Merged component library & hierarchy | Component tree, reusable definitions, props, slots, variants, geometry, parent-child links |
| \`03_design-system.json\` | Merged design system & tokens | Semantic colors (Primary Text, Surface), typography scale, spacing, radii, shadows, CSS/Tailwind mappings |
| \`04_layout.json\` | Layout constraints & responsive intelligence | Grid tracks, flex alignments, max-width containers, 8 viewport breakpoints (1920 to 375px) |
| \`05_behavior.json\` | Merged interactions & animation engine | Hover/focus/active states, drawers, modals, tabs, accordions, state machines, keyframes, scroll reveal |
| \`06_assets.json\` | SVG vectors, images & gradients | Inline SVG icons, image aspect ratios, object-fit settings, font stacks |
| \`07_accessibility.json\` | Accessibility semantics & WCAG audit | ARIA roles, landmarks, heading hierarchy, sequential tab order, dialog focus traps, keyboard shortcuts |
| \`08_evidence.json\` | Source verification & provenance | DOM element selectors, traceability mapping, and audit verification scores |
| \`09_styles/css-variables.css\` | Native CSS custom properties | Ready-to-import \`:root\` stylesheet |
| \`09_styles/tailwind.config.js\` | Tailwind configuration | Drop-in Tailwind theme extension |
| \`10_README_FOR_AI.md\` | Consolidated implementation guide | Master architecture, prompt, and step-by-step developer instructions |
| \`11_render_tree.json\` | Visual paint order & stacking context engine | Stacking contexts, z-index hierarchy, positioned ancestors, overflow clipping, floating layer elevations |
| \`12_constraints.json\` | Relational browser layout constraint dictionary | Deduplicated Flexbox, CSS Grid, Box Model, Inset rules & Tailwind utility equivalents |
| \`13_responsive.json\` | Responsive transition graph across 7 viewports | Step-by-step grid column collapses (4→2→1), font scaling clamp(), menu drawer transitions & Tailwind breakpoints |
| \`14_typography.json\` | Vertical typography rhythm & modular scale | Display, H1-H4, Body, Caption, Button, Label definitions, baseline grid, margins & reading widths |
| \`15_variants.json\` | Component variant engine & CVA definitions | Primary, Secondary, Outlined, Ghost, Filled, Elevated, Sizes, States & CVA code blocks |
| \`16_motion.json\` | Orchestrated animation timelines & Framer Motion | Multi-actor timeline tracks, stagger offsets, modal/drawer synchronization & Framer Motion variants |
| \`17_content.json\` | Semantic understanding for all textual elements | 20 semantic roles (Headline, CTA, Price, Rating, Badge, Feature, FAQ, etc.), purpose & SEO relevance |
| \`18_reconstruction_graph.json\` | Single source of truth & dependency graph | Deterministic topological \`reconstructionOrder\`, semantic UI hierarchy, and cross-file references |

---

## 🛠️ Step-by-Step Implementation Workflow

### Step 0: Inspect Master Reconstruction Graph (\`18_reconstruction_graph.json\`)
1. Open \`18_reconstruction_graph.json\` as your master entry point.
2. Follow the topological build sequence in \`reconstructionOrder\` (build leaves & UI primitives -> compound cards -> sections -> root page).
3. Use \`suggestedFilePath\` for each component in your modern React / Next.js / Vite architecture.

### Step 1: Initialize Theme, Typography & Styles (\`09_styles/\`, \`03_design-system.json\` & \`14_typography.json\`)
1. Copy \`09_styles/tailwind.config.js\` into your project root.
2. Import \`09_styles/css-variables.css\` into your \`globals.css\` file.
3. Configure typography font stacks and vertical baseline rhythm matching \`14_typography.json\`.

### Step 2: Build Component Library, Variants & Content Model (\`02_components.json\`, \`15_variants.json\`, \`17_content.json\` & \`06_assets.json\`)
1. Review reusable component definitions in \`02_components.json\` and variant definitions in \`15_variants.json\`.
2. Implement each component using the provided \`cvaCode\` from \`15_variants.json\` (e.g. \`Button.tsx\`, \`Card.tsx\`, \`Badge.tsx\`, \`Header.tsx\`).
3. Bind semantic content blocks from \`17_content.json\` based on \`semanticRole\` (e.g. Price, Rating, Badge, FAQ, Testimonial, Feature) into component props.
4. Support intent variants (\`primary\`, \`secondary\`, \`outlined\`, \`ghost\`, \`filled\`, \`elevated\`), sizes (\`small\`, \`medium\`, \`large\`), and interactive states (\`disabled\`, \`loading\`, \`hover\`, \`focus\`).
5. Use SVG vector assets from \`06_assets.json\` for exact icon fidelity.

### Step 3: Implement Page Layout & Responsive Transitions (\`12_constraints.json\` & \`13_responsive.json\`)
1. Open \`12_constraints.json\` and \`13_responsive.json\`.
2. Apply the pre-calculated \`recommendedTailwindClasses\` from the transition graph to support Desktop (1440/1280px), Tablet (1024/768px), and Mobile (640/480/375px).
3. Wire grid step-downs (\`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4\`) and fluid font scaling formulas (\`clamp()\`).
4. Wire navigation drawer collapse at \`<= 768px\` breakpoint.

### Step 4: Apply Visual Stacking & Layer Elevations (\`11_render_tree.json\`)
1. Inspect \`11_render_tree.json\` to verify paint order and stacking context hierarchy.
2. **Sticky Navigation & Header**: Ensure headers with \`paintLayer: "fixed-sticky"\` receive \`sticky top-0 z-50\` (or computed zIndex) so they float above body content on scroll.
3. **Hero Badges & Card Overlays**: Position badges (\`absolute top-3 left-3 z-10\`) relative to their \`positionedAncestor\` (\`relative overflow-hidden\`).
4. **Dropdowns & Action Menus**: Assign explicit z-indexes so dropdown menus render chronologically on top of adjacent sibling grid items.
5. **Modal Backdrops & Drawers**: Ensure overlay layers have \`fixed inset-0 z-[100]\` with isolation to cover background content.

### Step 5: Wire Runtime Behavior, Interactions & Motion (\`05_behavior.json\` & \`16_motion.json\`)
1. Check \`05_behavior.json\` and \`16_motion.json\` for interactive state triggers and orchestrated timelines.
2. **Framer Motion Variants**: Copy and import \`framerMotionCode\` blocks from \`16_motion.json\` into your components.
3. **Stagger Cascades**: Apply \`staggerChildren\` on grid parent containers (e.g. \`staggerIntervalMs: 75\`).
4. **Modal & Drawer Synchronization**: Coordinate backdrop opacity fade with dialog scale-in or drawer slide-in simultaneously.
5. Apply transition durations and easings from \`05_behavior.json\` using Tailwind transition classes (e.g. \`transition-all duration-200 ease-out\`).

### Step 6: Verify Accessibility & Compliance (\`07_accessibility.json\` & \`08_evidence.json\`)
1. Add accessible ARIA attributes (\`aria-expanded\`, \`aria-label\`, \`role\`), landmarks, and heading hierarchies (H1 -> H2 -> H3) as documented in \`07_accessibility.json\`.
2. Cross-reference DOM layout against \`08_evidence.json\`.
3. Ensure all margins, paddings, and colors map directly back to \`03_design-system.json\`.
`;
}
