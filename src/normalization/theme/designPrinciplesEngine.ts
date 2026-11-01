import { AnalyzePageResponseData, DesignPrinciplesSpecification, DesignPersonalityTrait } from '../../types/index.ts';

/**
 * Design Principles & Personality Inference Engine.
 * Analyzes visual tokens, geometric shapes, typography rhythm, and contrast
 * to determine high-level visual personality and mood for theme transfer.
 */
export class DesignPrinciplesEngine {
  public inferPrinciples(data: AnalyzePageResponseData): DesignPrinciplesSpecification {
    const colorSys = data.colorSystem;
    const typoSys = data.typographySystem;
    const shapeSys = data.shapeSystem;
    const layoutSys = data.layoutSystem;
    const elements = data.extractionResult?.elements || [];

    const traits: Set<DesignPersonalityTrait> = new Set();

    // 1. Dark vs Light Personality
    const isDark = elements.some((e) => {
      const bg = (e.backgroundColor || '').toLowerCase();
      return bg.includes('rgb(0,') || bg.includes('rgb(15,') || bg.includes('rgb(17,') || bg.includes('#0') || bg.includes('#1');
    });
    if (isDark) {
      traits.add('dark');
    } else {
      traits.add('light');
    }

    // 2. Corner Radii (Sharp vs Soft vs Minimal)
    const avgRadius = shapeSys?.stats.uniqueRadiusCount ? (shapeSys.radiusScale.reduce((acc, r) => acc + r.valuePx, 0) / shapeSys.radiusScale.length) : 6;
    let cornerStyle: 'sharp' | 'subtle-rounded' | 'smooth' | 'pill' = 'subtle-rounded';
    if (avgRadius <= 2) {
      cornerStyle = 'sharp';
      traits.add('sharp');
    } else if (avgRadius >= 16) {
      cornerStyle = 'pill';
      traits.add('playful');
      traits.add('soft');
    } else if (avgRadius >= 8) {
      cornerStyle = 'smooth';
      traits.add('modern');
      traits.add('soft');
    } else {
      cornerStyle = 'subtle-rounded';
      traits.add('modern');
    }

    // 3. Density & Spacing Rhythm
    const spacingValues = layoutSys?.spacingScale.map((s) => s.valuePx) || [4, 8, 16, 24, 32, 48, 64];
    const maxSpacing = Math.max(...spacingValues, 32);
    let visualDensity: 'compact' | 'comfortable' | 'spacious' | 'airy' = 'comfortable';
    if (maxSpacing >= 80) {
      visualDensity = 'airy';
      traits.add('airy');
      traits.add('luxury');
    } else if (maxSpacing >= 56) {
      visualDensity = 'spacious';
      traits.add('modern');
    } else {
      visualDensity = 'compact';
      traits.add('dense');
    }

    // 4. Typography Style & Personality
    const fontFamilies = (typoSys?.fontFamilies || []).join(' ').toLowerCase();
    let typographyStyle: 'clean-sans' | 'geometric-sans' | 'editorial-serif' | 'tech-mono' | 'humanist' = 'clean-sans';
    if (fontFamilies.includes('serif') || fontFamilies.includes('playfair') || fontFamilies.includes('georgia') || fontFamilies.includes('garamond')) {
      typographyStyle = 'editorial-serif';
      traits.add('editorial');
      traits.add('luxury');
      traits.add('fashion');
    } else if (fontFamilies.includes('mono') || fontFamilies.includes('fira') || fontFamilies.includes('jetbrains') || fontFamilies.includes('consolas')) {
      typographyStyle = 'tech-mono';
      traits.add('tech');
      traits.add('minimal');
    } else if (fontFamilies.includes('inter') || fontFamilies.includes('roboto') || fontFamilies.includes('system') || fontFamilies.includes('arial')) {
      typographyStyle = 'clean-sans';
      traits.add('minimal');
      traits.add('corporate');
    } else {
      typographyStyle = 'geometric-sans';
      traits.add('modern');
      traits.add('tech');
    }

    // 5. Surface Elevation & Shadows
    const hasGlass = elements.some((e) => (e.className || '').includes('backdrop') || (e.className || '').includes('glass'));
    const shadowCount = shapeSys?.stats.uniqueShadowCount || 0;
    let surfaceElevation: 'flat' | 'subtle-border' | 'layered-shadow' | 'glassmorphism' | 'floating' = 'subtle-border';
    if (hasGlass) {
      surfaceElevation = 'glassmorphism';
      traits.add('tech');
      traits.add('luxury');
    } else if (shadowCount >= 3) {
      surfaceElevation = 'layered-shadow';
      traits.add('modern');
    } else if (shadowCount === 0) {
      surfaceElevation = 'flat';
      traits.add('minimal');
    }

    // 6. Contrast & Color Harmony
    const tokenCount = colorSys?.stats.normalizedColorCount || 10;
    let contrastStyle: 'high' | 'medium' | 'soft' = 'medium';
    let colorHarmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'neutral-dominant' = 'neutral-dominant';

    if (tokenCount <= 6) {
      colorHarmony = 'monochromatic';
      traits.add('minimal');
      contrastStyle = 'high';
      traits.add('high-contrast');
    } else if (tokenCount >= 20) {
      colorHarmony = 'triadic';
      traits.add('playful');
      contrastStyle = 'medium';
    } else {
      colorHarmony = 'neutral-dominant';
      contrastStyle = 'medium';
      traits.add('modern');
    }

    // Ensure at least 3 distinct traits
    if (traits.size < 3) {
      traits.add('modern');
      traits.add('minimal');
    }

    const traitArray = Array.from(traits).slice(0, 5);

    const moodSummary = `A ${traitArray.join(', ')} design language featuring a ${contrastStyle} contrast profile, ${visualDensity} layout spacing, and ${cornerStyle} border geometry.`;

    const designRules = [
      `Use a ${visualDensity} spacing rhythm (${spacingValues.slice(0, 5).join('px, ')}px) for margins and component padding.`,
      `Apply ${cornerStyle} corner curvature (${Math.round(avgRadius)}px radius) consistently across buttons, inputs, and card containers.`,
      `Structure surfaces with ${surfaceElevation} hierarchy (subtle borders and structured shadows).`,
      `Maintain ${contrastStyle} visual contrast between foreground typography and background surfaces.`,
      `Preserve ${typographyStyle} type hierarchy with distinct headline-to-body scaling ratios.`,
    ];

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/design-principles-v1.json',
      version: '1.0.0',
      referenceMeta: {
        title: data.title || 'Reference Design',
        url: data.pageUrl || '',
      },
      traits: traitArray,
      moodSummary,
      visualDensity,
      contrastStyle,
      cornerStyle,
      surfaceElevation,
      colorHarmony,
      typographyStyle,
      motionPersonality: 'subtle-smooth',
      designRules,
    };
  }

  public generateMarkdown(spec: DesignPrinciplesSpecification): string {
    return `# Design Principles & Visual Language

> **Reference Source**: ${spec.referenceMeta.title} (${spec.referenceMeta.url})
> **Design Philosophy**: ${spec.moodSummary}

---

## 1. Core Visual Personality Traits

${spec.traits.map((t) => `- **${t.toUpperCase()}**: Informs the aesthetic balance, palette temperature, and interactive feedback.`).join('\n')}

---

## 2. Design System Architecture

| Dimension | Trait / Setting | Guidance for Theme Application |
|---|---|---|
| **Visual Density** | \`${spec.visualDensity}\` | Generous whitespace rhythm; avoid crowding content elements. |
| **Contrast Style** | \`${spec.contrastStyle}\` | High clarity between interactive elements, text, and background layers. |
| **Corner Geometry** | \`${spec.cornerStyle}\` | Consistent border-radius applied across buttons, cards, and modal dialogs. |
| **Surface Elevation** | \`${spec.surfaceElevation}\` | Minimal reliance on heavy skeuomorphic shadows; clean border boundaries. |
| **Color Harmony** | \`${spec.colorHarmony}\` | Neutral-dominant canvas elevated by vibrant semantic accent roles. |
| **Typography Personality** | \`${spec.typographyStyle}\` | Modern geometric typographic hierarchy with readable line-heights. |
| **Motion Personality** | \`${spec.motionPersonality}\` | Micro-interactions feel snappy and responsive (150ms-250ms ease-out). |

---

## 3. Mandatory Theme Application Rules

${spec.designRules.map((r, i) => `${i + 1}. **${r.split(' ')[0]}**: ${r}`).join('\n')}

---

## 4. Theme Transfer Guardrail

> [!IMPORTANT]
> When applying this design language to a target codebase:
> 1. **Do NOT clone or copy text, products, branding, or media from the reference website.**
> 2. **Keep 100% of the target website's existing content, copy, products, routing, APIs, and features intact.**
> 3. **Transform ONLY the CSS variables, Tailwind tokens, component styles, and layout spacing rules.**
`;
  }
}
