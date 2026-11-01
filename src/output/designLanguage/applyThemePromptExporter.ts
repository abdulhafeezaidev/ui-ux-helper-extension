import { AnalyzePageResponseData, DesignPrinciplesSpecification } from '../../types/index.ts';

/**
 * Generates the master AI_Apply_Theme.md prompt for autonomous coding agents.
 * Guides AI agents to restyle an existing application with the extracted design language
 * while strictly preserving the target codebase's content, logic, products, and routes.
 */
export function exportApplyThemePrompt(
  data: AnalyzePageResponseData,
  principles: DesignPrinciplesSpecification
): string {
  const referenceTitle = data.title || 'Reference Design';
  const referenceUrl = data.pageUrl || '';

  return `# AI Theme Transfer Guide — Apply Design Language

> **Reference Source**: ${referenceTitle} (${referenceUrl})
> **Target Audience**: AI Coding Agents (ChatGPT, Claude, Cursor, Copilot, Gemini)
> **Goal**: Restyle an existing target web application to adopt the visual identity of this reference design system.

---

## 🛑 Critical Guardrails & Rules (MUST READ)

> [!CAUTION]
> **DO NOT CLONE OR RECREATE THE REFERENCE WEBSITE.**
> This package is a **pure visual theme kit**, NOT a website clone.
>
> 1. **Keep ALL Existing Content**: Do not change the target application's text, headlines, product names, prices, descriptions, copy, blog posts, or marketing messaging.
> 2. **Keep ALL Existing Functionality**: Preserve all state management, React hooks, backend API integrations, routing, forms logic, database calls, and business rules.
> 3. **Keep ALL Existing Assets**: Keep the target website's product images, user avatars, and media unless explicitly asked by the user to replace placeholders.
> 4. **Transform ONLY Visual Styling**: Replace color tokens, typography scales, spacing variables, component classes (buttons, cards, forms, navbar), border radii, shadows, and motion easing.

---

## 📋 Recommended Theme Application Workflow

### Step 1: Install Stylesheets & Tokens
1. Inspect \`styles/css-variables.css\` and copy root variables into your global stylesheet (e.g. \`globals.css\` or \`index.css\`).
2. Merge \`styles/tailwind.config.js\` into your project's Tailwind or CSS-in-JS configuration to adopt the color palette, font families, and spacing scales.

### Step 2: Update Typography Scale
1. Check \`typography.json\` for the primary font family and type scale.
2. Update headings (H1-H6) and body text styles to match the line-heights, letter-spacing, and font weights.

### Step 3: Refactor Core UI Components
1. **Buttons**: Update your primary/secondary/ghost button components using \`button-system.json\`.
2. **Cards & Containers**: Apply surface backgrounds, border radius, and hover elevations from \`card-system.json\`.
3. **Forms & Inputs**: Update text inputs, selects, labels, and focus rings using \`form-system.json\`.
4. **Navigation**: Adjust navbar backdrop blur, active tab indicators, and mobile drawer transitions from \`navigation-system.json\`.

### Step 4: Apply Motion & Responsive Rules
1. Apply transition curves and hover durations from \`motion-system.json\`.
2. Ensure layout grids and container widths match \`responsive-rules.json\` across mobile (375px), tablet (768px), and desktop (1440px).

---

## 🎨 Design Personality Summary

- **Traits**: ${principles.traits.map((t) => '`' + t + '`').join(', ')}
- **Visual Density**: \`${principles.visualDensity}\`
- **Contrast**: \`${principles.contrastStyle}\`
- **Corner Curvature**: \`${principles.cornerStyle}\`
- **Elevation**: \`${principles.surfaceElevation}\`

---

## 📦 Reference Package Files

| File | Purpose |
|---|---|
| \`design-system.json\` | Master design tokens for colors, typography, spacing, radius, and shadows |
| \`color-palette.json\` | Semantic color roles (primary, secondary, surface, hover, focus) |
| \`typography.json\` | Type scale and font hierarchy definitions |
| \`spacing.json\` | Spacing rhythm, container widths, and section padding |
| \`component-styles.json\` | Unified component styling specifications |
| \`button-system.json\` | Button variants, sizes, and interactive states |
| \`card-system.json\` | Card surfaces, borders, and hover elevations |
| \`form-system.json\` | Inputs, selects, checkboxes, and validation rings |
| \`navigation-system.json\` | Navbar layout, blur, and active navigation indicators |
| \`icon-style.json\` | Icon stroke thickness and sizing standards |
| \`motion-system.json\` | Animation durations, easing curves, and micro-interactions |
| \`responsive-rules.json\` | Breakpoint transitions for mobile, tablet, and desktop |
| \`design-principles.md\` | Narrative design philosophy and visual guidelines |
| \`styles/css-variables.css\` | Drop-in CSS custom properties |
| \`styles/tailwind.config.js\` | Drop-in Tailwind theme configuration |
`;
}
