import { AnalyzePageResponseData } from '../../types/index.ts';
import { computeCloneConfidenceScore } from '../../normalization/fidelity/cloneConfidenceCalculator.ts';

export function exportPromptMarkdown(data: AnalyzePageResponseData): string {
  const scores = computeCloneConfidenceScore(data);
  const title = data.title || 'Target Application';
  const url = data.pageUrl || 'https://example.com';

  return `# 🚀 Complete AI Website Reconstruction Prompt

> **Task**: Reconstruct the **${title}** (${url}) with **100% pixel-perfect fidelity** using the attached **AI Clone Package V2** artifacts.

---

## 📊 Reconstruction Fidelity & Confidence Scores

| Metric | Score | Target Status |
|--------|-------|---------------|
| 🎨 **Visual Fidelity** | **${scores.visualFidelity}%** | Strict Token Matching |
| 📐 **Layout Fidelity** | **${scores.layoutFidelity}%** | Container & Grid Track Alignment |
| 🔤 **Typography Fidelity** | **${scores.typographyFidelity}%** | Clamp Formulas & Weights |
| 🧩 **Component Fidelity** | **${scores.componentFidelity}%** | Reusable Props, Slots & Variants |
| ⚡ **Interaction Fidelity** | **${scores.interactionFidelity}%** | Micro-interactions & State Machines |
| 🎬 **Animation Fidelity** | **${scores.animationFidelity}%** | Keyframes & Transition Curves |
| ♿ **Accessibility Fidelity** | **${scores.accessibilityFidelity}%** | Landmarks, Focus Traps & ARIA |
| 🏆 **Overall AI Reconstruction Score** | **${scores.overallScore}% (${scores.grade})** | **${scores.verdict}** |

---

## 📦 Package File Artifacts & Ground Truth

You have access to 16 canonical JSON, CSS, JS, and Markdown artifacts in this package:

1. \`reconstruction.json\`: Master DOM structure, depth, and spatial tree.
2. \`component-tree.json\`: Hierarchical parent-child component tree (zero orphan nodes).
3. \`components.json\`: Canonical reusable component definitions with props, slots, and variants.
4. \`layout.json\`: Responsive grid columns, flexbox containers, gaps, and max-width constraints.
5. \`responsive.json\`: 8 standard viewport breakpoints (1920px down to 375px) with layout collapse rules.
6. \`interactions.json\`: Complete interaction graph with triggers, affected nodes, overlays, and state machines.
7. \`animations.json\`: Animation easings (\`cubic-bezier\`), durations, and keyframe catalogs.
8. \`design-system.json\`: Semantic design tokens (Primary Text, Surface Background, Heading roles).
9. \`accessibility.json\`: ARIA landmarks, heading hierarchy, sequential tab order, and modal focus traps.
10. \`assets.json\`: Extracted SVG icons, image aspect ratios, and media definitions.
11. \`design-tokens.json\`: DTCG standard design token dictionary.
12. \`css-variables.css\`: Drop-in native CSS custom properties stylesheet.
13. \`tailwind.config.js\`: Drop-in Tailwind CSS configuration with theme extensions.
14. \`evidence.json\`: Direct DOM selector traceability and audit confidence scores.
15. \`prompt.md\`: This AI coding prompt.
16. \`README_FOR_AI.md\`: Step-by-step developer and AI agent implementation guide.

---

## 🛠️ Step-by-Step Reconstruction Instructions

### Step 1: Initialize Styling & Theme Foundation
- Configure your project with the provided \`tailwind.config.js\` and import \`css-variables.css\` into your root stylesheet.
- Use semantic color tokens from \`design-system.json\` (\`bg.surface\`, \`text.primary\`, \`color.primary\`) rather than raw hex codes.

### Step 2: Build Component Architecture
- Construct reusable components matching \`components.json\` (e.g. \`ProductCard\`, \`Header\`, \`Hero\`, \`FooterColumn\`, \`Badge\`).
- Ensure all components match the parent-child hierarchy defined in \`component-tree.json\`.

### Step 3: Implement Layouts & Responsive Behavior
- Build container layouts strictly matching the CSS grid tracks and flexbox alignments in \`layout.json\`.
- Apply responsive breakpoint shifts from \`responsive.json\` (e.g. 4-column grid on desktop collapsing to 1-column on mobile, mobile drawer navigation).

### Step 4: Add Micro-Interactions & State Machines
- Wire interactive state transitions from \`interactions.json\` (hover lifts, dropdown toggles, modal lightbox open/close).
- Apply overlay constraints: backdrop darken, scroll lock, and escape key dismissal.

### Step 5: Configure Animations & Motion Curves
- Apply keyframes and transition timing functions defined in \`animations.json\` using exact \`cubic-bezier\` curves.

### Step 6: Verify Accessibility & Keyboard Navigation
- Add semantic HTML landmarks, sequential heading tags (H1 -> H2 -> H3), and focus-trap behavior as specified in \`accessibility.json\`.

---

## ⚠️ Zero-Guesswork Guardrail
- **DO NOT** guess arbitrary values for colors, font sizes, margins, padding, or breakpoints.
- **DO NOT** invent missing components.
- **ALWAYS** reference the attached JSON artifacts as the single source of truth.
`;
}
