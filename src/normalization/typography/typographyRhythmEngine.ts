import {
  AnalyzePageResponseData,
  RawElementNode,
  TypographyRhythmSpecification,
  SemanticTypographyRole,
  SemanticRoleName,
  ModularHeadingScale,
  BaselineRhythmMetrics,
  SpacingMetrics,
  ReadingWidthMetrics,
} from '../../types/index.ts';

export const MODULAR_SCALE_RATIOS: { name: string; ratio: number }[] = [
  { name: 'Minor Second (1.067)', ratio: 1.067 },
  { name: 'Major Second (1.125)', ratio: 1.125 },
  { name: 'Minor Third (1.200)', ratio: 1.200 },
  { name: 'Major Third (1.250)', ratio: 1.250 },
  { name: 'Perfect Fourth (1.333)', ratio: 1.333 },
  { name: 'Augmented Fourth (1.414)', ratio: 1.414 },
  { name: 'Perfect Fifth (1.500)', ratio: 1.500 },
  { name: 'Golden Ratio (1.618)', ratio: 1.618 },
];

export class TypographyRhythmEngine {
  /**
   * Main entry point: normalizes page typography into a complete rhythm specification (14_typography.json).
   */
  public normalize(data: AnalyzePageResponseData): TypographyRhythmSpecification {
    const rawElements = data.extractionResult?.elements || [];
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';

    // Filter text elements
    const textElements = rawElements.filter(
      (el) => el.isVisible && (el.textMeta?.hasText || el.tagName?.toLowerCase() === 'input' || el.tagName?.toLowerCase() === 'textarea')
    );

    // 1. Group and Identify Semantic Roles
    const roleDefinitions = this.detectSemanticRoles(textElements, data);

    // 2. Build Role Registry & Normalized Roles Array
    const roleRegistry: Record<string, SemanticTypographyRole> = {};
    for (const roleDef of roleDefinitions) {
      roleRegistry[roleDef.role] = roleDef;
    }

    // 3. Detect Automatic Modular Heading Scale
    const modularScale = this.detectModularHeadingScale(roleDefinitions);

    // 4. Primary and Secondary Font Families
    const primaryFamily = roleDefinitions[0]?.fontFamily || 'Inter, sans-serif';
    const secondaryFamily = roleDefinitions.find((r) => r.fontFamily !== primaryFamily)?.fontFamily;

    const hasBalancedHeadings = roleDefinitions.some(
      (r) => ['display', 'h1', 'h2'].includes(r.role) && (r.textWrap === 'balance' || r.textWrap === 'pretty')
    );

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/typography-rhythm-v1.json',
      version: '1.0.0',
      target: {
        title,
        url,
      },
      summary: {
        totalRolesIdentified: roleDefinitions.length,
        totalTextElementsScanned: textElements.length,
        primaryFontFamily: primaryFamily,
        secondaryFontFamily: secondaryFamily,
        headingScaleRatio: modularScale.ratioName,
        verticalBaselineGrid: '4px / 8px modular baseline grid',
        hasBalancedHeadings,
      },
      modularScale,
      roleRegistry,
      roles: roleDefinitions,
      metadata: {
        generatedAt: new Date().toISOString(),
        extractorVersion: '1.0.0-typography-rhythm-engine',
        guidanceForAI: [
          'TYPOGRAPHY RHYTHM DIRECTIVE: Recreate authentic vertical typography rhythm using baselineRhythm, paragraphSpacing, and headingSpacing from 14_typography.json.',
          'LINE-HEIGHT RATIOS: Maintain proportional line-heights (lineHeightRatio) rather than fixed font sizes to prevent text collisions across responsive views.',
          'READING WIDTH CONSTRAINTS: Constrain long-form body copy to readingWidth.optimalChWidth (max-w-prose / 65ch) for optimal editorial UX.',
          'HEADINGS BALANCE: Apply text-balance / text-wrap: balance on Display, H1, and H2 headings to prevent typographic runts and awkward line wraps.',
          'VERTICAL BASELINE: Align all line-heights and inter-paragraph margins to a 4px/8px modular vertical rhythm grid.'
        ],
      },
    };
  }

  /**
   * Discovers and normalizes the 9 primary semantic roles (Display, H1-H4, Body, Caption, Button, Label).
   */
  private detectSemanticRoles(elements: RawElementNode[], data: AnalyzePageResponseData): SemanticTypographyRole[] {
    const roles: SemanticTypographyRole[] = [];
    const elementGroups = new Map<SemanticRoleName, RawElementNode[]>();

    // Initialize standard buckets
    const standardRoles: SemanticRoleName[] = ['display', 'h1', 'h2', 'h3', 'h4', 'body', 'caption', 'button', 'label'];
    standardRoles.forEach((r) => elementGroups.set(r, []));

    // Baseline from typographySystem if available
    const typoSys = data.typographySystem;
    const baseBodyPx = typoSys?.hierarchy?.body?.fontSizePx || 16;

    for (const el of elements) {
      const tag = el.tagName?.toLowerCase() || 'div';
      const role = el.role?.toLowerCase() || '';
      const cls = (typeof el.className === 'string' ? el.className : '').toLowerCase();
      const fontSizePx = parseFloat(el.typography?.fontSize || '16');

      if (cls.includes('display') || cls.includes('hero-title') || fontSizePx >= 44) {
        elementGroups.get('display')!.push(el);
      } else if (tag === 'h1' || (cls.includes('title') && fontSizePx >= 36)) {
        elementGroups.get('h1')!.push(el);
      } else if (tag === 'h2' || fontSizePx >= 28) {
        elementGroups.get('h2')!.push(el);
      } else if (tag === 'h3' || fontSizePx >= 22) {
        elementGroups.get('h3')!.push(el);
      } else if (tag === 'h4' || fontSizePx >= 18) {
        elementGroups.get('h4')!.push(el);
      } else if (tag === 'button' || role === 'button' || cls.includes('btn') || cls.includes('button')) {
        elementGroups.get('button')!.push(el);
      } else if (tag === 'label' || cls.includes('label') || cls.includes('caption-label')) {
        elementGroups.get('label')!.push(el);
      } else if (tag === 'small' || cls.includes('caption') || cls.includes('footnote') || fontSizePx <= 13) {
        elementGroups.get('caption')!.push(el);
      } else {
        elementGroups.get('body')!.push(el);
      }
    }

    // Build role specification for each semantic group
    for (const roleName of standardRoles) {
      const groupEls = elementGroups.get(roleName) || [];
      const spec = this.synthesizeRoleSpecification(roleName, groupEls, baseBodyPx);
      roles.push(spec);
    }

    return roles;
  }

  /**
   * Synthesizes the complete 15-property typography specification for a given semantic role.
   */
  private synthesizeRoleSpecification(
    role: SemanticRoleName,
    elements: RawElementNode[],
    baseBodyPx: number
  ): SemanticTypographyRole {
    const representative = elements[0];
    const typo = representative?.typography || ({} as any);

    // 1. Font properties
    const fontFamily = typo.fontFamily || 'Inter, sans-serif';
    const rawFontSize = typo.fontSize || this.getDefaultFontSize(role);
    const fontSizePx = parseFloat(rawFontSize) || parseFloat(this.getDefaultFontSize(role));
    const fontSizeRem = `${parseFloat((fontSizePx / 16).toFixed(3))}rem`;
    const fontWeight = parseInt(typo.fontWeight, 10) || this.getDefaultFontWeight(role);

    // 2. Line height
    const rawLineHeight = typo.lineHeight || this.getDefaultLineHeight(role, fontSizePx);
    let lineHeightPx = parseFloat(rawLineHeight);
    if (isNaN(lineHeightPx) || rawLineHeight === 'normal') {
      lineHeightPx = Math.round(fontSizePx * (role.startsWith('h') || role === 'display' ? 1.2 : 1.5));
    }
    const lineHeightRatio = parseFloat((lineHeightPx / fontSizePx).toFixed(2));
    const lineHeight = `${lineHeightPx}px`;

    // 3. Letter spacing & Word spacing
    const rawLetterSpacing = typo.letterSpacing || this.getDefaultLetterSpacing(role);
    const letterSpacingPx = this.parseSpacingPx(rawLetterSpacing, fontSizePx);
    const letterSpacing = rawLetterSpacing;

    const rawWordSpacing = typo.wordSpacing || 'normal';
    const wordSpacingPx = this.parseSpacingPx(rawWordSpacing, fontSizePx);
    const wordSpacing = rawWordSpacing;

    // 4. Text transforms, alignments, wraps
    const textTransform = (typo.textTransform || 'none') as SemanticTypographyRole['textTransform'];
    const textAlign = (typo.textAlign || 'left') as SemanticTypographyRole['textAlign'];
    const textWrap = (typo.textWrap || (['display', 'h1', 'h2'].includes(role) ? 'balance' : 'auto')) as SemanticTypographyRole['textWrap'];
    const textOverflow = (typo.textOverflow || 'clip') as SemanticTypographyRole['textOverflow'];
    const whiteSpace = (typo.whiteSpace || 'normal') as SemanticTypographyRole['whiteSpace'];

    // 5. Baseline Rhythm
    const baselineRhythm: BaselineRhythmMetrics = {
      gridBasePx: 4,
      lineHeightToFontSizeRatio: lineHeightRatio,
      modularStep: Math.round(lineHeightPx / 4),
      verticalGridAlignment: lineHeightPx % 8 === 0 ? 'aligned-to-8px-grid' : lineHeightPx % 4 === 0 ? 'aligned-to-4px-grid' : 'custom',
      relativeUnit: 'rem',
    };

    // 6. Paragraph Spacing & Heading Spacing
    const rawMargin = representative?.margin
      ? `${representative.margin.top} ${representative.margin.right} ${representative.margin.bottom} ${representative.margin.left}`
      : '0px';
    const marginTopPx = representative?.margin?.top ? parseFloat(representative.margin.top) : this.getDefaultMarginTop(role, fontSizePx);
    const marginBottomPx = representative?.margin?.bottom ? parseFloat(representative.margin.bottom) : this.getDefaultMarginBottom(role, fontSizePx);

    const paragraphSpacing: SpacingMetrics = {
      marginTopPx: 0,
      marginBottomPx: role === 'body' ? 16 : marginBottomPx,
      rawMargin: role === 'body' ? '0px 0px 16px 0px' : rawMargin,
      ratioToBody: parseFloat(((role === 'body' ? 16 : marginBottomPx) / baseBodyPx).toFixed(2)),
    };

    const headingSpacing: SpacingMetrics = {
      marginTopPx,
      marginBottomPx,
      rawMargin: `${marginTopPx}px 0px ${marginBottomPx}px 0px`,
      ratioToBody: parseFloat((marginBottomPx / baseBodyPx).toFixed(2)),
    };

    // 7. Reading Width Metrics
    const widthPx = representative?.boundingRect?.width || (role === 'body' ? 680 : 800);
    const avgCharWidthPx = fontSizePx * 0.52;
    const maxCharactersPerLine = Math.round(widthPx / avgCharWidthPx);
    const readingWidth: ReadingWidthMetrics = {
      maxCharactersPerLine,
      optimalChWidth: role === 'body' ? '65ch' : 'none',
      computedWidthPx: widthPx,
      isOptimalReadingWidth: maxCharactersPerLine >= 45 && maxCharactersPerLine <= 75,
    };

    // 8. Tailwind Classes & CSS Snippet
    const tailwindClasses = this.generateTailwindClasses({
      role,
      fontSizePx,
      fontWeight,
      lineHeightPx,
      letterSpacing,
      textTransform,
      textAlign,
      textWrap,
      marginBottomPx,
    });

    const cssSnippet = this.generateCssSnippet(role, {
      fontFamily,
      fontSizePx,
      fontSizeRem,
      fontWeight,
      lineHeight,
      letterSpacing,
      textTransform,
      textAlign,
      textWrap,
      marginBottomPx,
      marginTopPx,
    });

    const exampleSelectors = elements.slice(0, 3).map((el) => this.buildSelector(el));
    if (exampleSelectors.length === 0) {
      exampleSelectors.push(this.getDefaultSelector(role));
    }

    return {
      role,
      displayName: this.formatRoleDisplayName(role),
      fontFamily,
      fontSize: `${fontSizePx}px`,
      fontSizePx,
      fontSizeRem,
      fontWeight,
      lineHeight,
      lineHeightPx,
      lineHeightRatio,
      letterSpacing,
      letterSpacingPx,
      wordSpacing,
      wordSpacingPx,
      textTransform,
      textAlign,
      textWrap,
      textOverflow,
      whiteSpace,
      baselineRhythm,
      paragraphSpacing,
      headingSpacing,
      readingWidth,
      tailwindClasses,
      cssSnippet,
      exampleSelectors,
      observedCount: elements.length,
    };
  }

  /**
   * Detects the mathematical modular scale ratio used across the headings.
   */
  private detectModularHeadingScale(roles: SemanticTypographyRole[]): ModularHeadingScale {
    const headingRoles = roles.filter((r) => ['display', 'h1', 'h2', 'h3', 'h4', 'body'].includes(r.role));
    const sizes = headingRoles.map((r) => r.fontSizePx).sort((a, b) => b - a);

    const baseFontSizePx = roles.find((r) => r.role === 'body')?.fontSizePx || 16;
    let detectedRatio = 1.25; // Default Major Third
    let ratioName = 'Major Third (1.250)';

    if (sizes.length >= 2) {
      const stepRatios: number[] = [];
      for (let i = 0; i < sizes.length - 1; i++) {
        if (sizes[i + 1] > 0) {
          stepRatios.push(sizes[i] / sizes[i + 1]);
        }
      }

      if (stepRatios.length > 0) {
        const avgRatio = stepRatios.reduce((sum, r) => sum + r, 0) / stepRatios.length;

        // Find closest standard modular scale ratio
        let minDiff = Infinity;
        for (const candidate of MODULAR_SCALE_RATIOS) {
          const diff = Math.abs(candidate.ratio - avgRatio);
          if (diff < minDiff) {
            minDiff = diff;
            detectedRatio = candidate.ratio;
            ratioName = candidate.name;
          }
        }
      }
    }

    const scaleSteps: Record<string, number> = {};
    roles.forEach((r) => {
      scaleSteps[r.role] = r.fontSizePx;
    });

    return {
      detectedRatio,
      ratioName,
      baseFontSizePx,
      scaleSteps,
    };
  }

  /**
   * Generates idiomatic Tailwind CSS classes for the typographic role.
   */
  private generateTailwindClasses(spec: {
    role: SemanticRoleName;
    fontSizePx: number;
    fontWeight: number;
    lineHeightPx: number;
    letterSpacing: string;
    textTransform: string;
    textAlign: string;
    textWrap: string;
    marginBottomPx: number;
  }): string[] {
    const tw: string[] = [];

    // Font size
    if (spec.fontSizePx >= 48) tw.push('text-5xl');
    else if (spec.fontSizePx >= 36) tw.push('text-4xl');
    else if (spec.fontSizePx >= 30) tw.push('text-3xl');
    else if (spec.fontSizePx >= 24) tw.push('text-2xl');
    else if (spec.fontSizePx >= 20) tw.push('text-xl');
    else if (spec.fontSizePx >= 18) tw.push('text-lg');
    else if (spec.fontSizePx <= 12) tw.push('text-xs');
    else if (spec.fontSizePx <= 14) tw.push('text-sm');
    else tw.push('text-base');

    // Font weight
    if (spec.fontWeight >= 800) tw.push('font-extrabold');
    else if (spec.fontWeight >= 700) tw.push('font-bold');
    else if (spec.fontWeight >= 600) tw.push('font-semibold');
    else if (spec.fontWeight >= 500) tw.push('font-medium');
    else tw.push('font-normal');

    // Tracking / Letter Spacing
    if (spec.letterSpacing.includes('-')) tw.push('tracking-tight');
    else if (spec.letterSpacing.includes('0.05') || spec.letterSpacing.includes('0.1')) tw.push('tracking-wide');

    // Leading / Line Height
    if (spec.lineHeightPx <= spec.fontSizePx * 1.25) tw.push('leading-tight');
    else if (spec.lineHeightPx <= spec.fontSizePx * 1.4) tw.push('leading-snug');
    else if (spec.lineHeightPx >= spec.fontSizePx * 1.6) tw.push('leading-relaxed');

    // Text wrap
    if (spec.textWrap === 'balance') tw.push('text-balance');
    else if (spec.textWrap === 'pretty') tw.push('text-pretty');

    // Margin bottom
    if (spec.marginBottomPx > 0) {
      const mbStep = Math.round(spec.marginBottomPx / 4);
      if (mbStep > 0 && mbStep <= 16) tw.push(`mb-${mbStep}`);
    }

    if (spec.role === 'body') {
      tw.push('max-w-prose');
    }

    return tw;
  }

  /**
   * Generates a clean CSS block for the role.
   */
  private generateCssSnippet(role: string, spec: any): string {
    const selector = this.getDefaultSelector(role);
    return [
      `${selector} {`,
      `  font-family: ${spec.fontFamily};`,
      `  font-size: ${spec.fontSizeRem}; /* ${spec.fontSizePx}px */`,
      `  font-weight: ${spec.fontWeight};`,
      `  line-height: ${spec.lineHeight};`,
      `  letter-spacing: ${spec.letterSpacing};`,
      spec.textTransform !== 'none' ? `  text-transform: ${spec.textTransform};` : null,
      spec.textWrap !== 'auto' ? `  text-wrap: ${spec.textWrap};` : null,
      spec.marginBottomPx > 0 ? `  margin-bottom: ${spec.marginBottomPx}px;` : null,
      `}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  // --- Helper methods for default fallback values ---

  private getDefaultFontSize(role: SemanticRoleName): string {
    switch (role) {
      case 'display': return '48px';
      case 'h1': return '36px';
      case 'h2': return '30px';
      case 'h3': return '24px';
      case 'h4': return '20px';
      case 'body': return '16px';
      case 'caption': return '12px';
      case 'button': return '14px';
      case 'label': return '14px';
      default: return '16px';
    }
  }

  private getDefaultFontWeight(role: SemanticRoleName): number {
    switch (role) {
      case 'display': return 800;
      case 'h1': return 700;
      case 'h2': return 700;
      case 'h3': return 600;
      case 'h4': return 600;
      case 'body': return 400;
      case 'caption': return 400;
      case 'button': return 600;
      case 'label': return 500;
      default: return 400;
    }
  }

  private getDefaultLineHeight(role: SemanticRoleName, sizePx: number): string {
    if (['display', 'h1', 'h2'].includes(role)) return `${Math.round(sizePx * 1.15)}px`;
    if (['h3', 'h4'].includes(role)) return `${Math.round(sizePx * 1.25)}px`;
    return `${Math.round(sizePx * 1.5)}px`;
  }

  private getDefaultLetterSpacing(role: SemanticRoleName): string {
    if (['display', 'h1'].includes(role)) return '-0.02em';
    if (role === 'h2') return '-0.01em';
    if (role === 'label' || role === 'button') return '0.01em';
    return 'normal';
  }

  private getDefaultMarginTop(role: SemanticRoleName, _sizePx: number): number {
    if (['display', 'h1'].includes(role)) return 0;
    if (role === 'h2') return 32;
    if (role === 'h3') return 24;
    if (role === 'h4') return 16;
    return 0;
  }

  private getDefaultMarginBottom(role: SemanticRoleName, _sizePx: number): number {
    if (role === 'display') return 16;
    if (role === 'h1') return 16;
    if (role === 'h2') return 12;
    if (role === 'h3') return 8;
    if (role === 'h4') return 8;
    if (role === 'body') return 16;
    return 0;
  }

  private formatRoleDisplayName(role: SemanticRoleName): string {
    switch (role) {
      case 'display': return 'Hero Display Headline';
      case 'h1': return 'Heading 1 (Page Title)';
      case 'h2': return 'Heading 2 (Section)';
      case 'h3': return 'Heading 3 (Subsection / Card)';
      case 'h4': return 'Heading 4 (Group Header)';
      case 'body': return 'Body Paragraph';
      case 'caption': return 'Caption & Footnote';
      case 'button': return 'Interactive Button Text';
      case 'label': return 'Form Field & UI Label';
      default: return String(role);
    }
  }

  private getDefaultSelector(role: SemanticRoleName): string {
    switch (role) {
      case 'display': return '.display-hero, .hero-title';
      case 'h1': return 'h1, .page-title';
      case 'h2': return 'h2, .section-heading';
      case 'h3': return 'h3, .card-title';
      case 'h4': return 'h4, .group-header';
      case 'body': return 'p, .body-text';
      case 'caption': return 'small, .caption-text';
      case 'button': return 'button, .btn, .button-primary';
      case 'label': return 'label, .input-label';
      default: return `.${role}`;
    }
  }

  private parseSpacingPx(spacingStr: string, fontSizePx: number): number {
    if (!spacingStr || spacingStr === 'normal') return 0;
    if (spacingStr.endsWith('em')) return parseFloat(spacingStr) * fontSizePx;
    if (spacingStr.endsWith('px')) return parseFloat(spacingStr);
    return parseFloat(spacingStr) || 0;
  }

  private buildSelector(el: RawElementNode): string {
    const tag = el.tagName?.toLowerCase() || 'div';
    if (el.id && !el.id.startsWith('el_')) return `${tag}#${el.id}`;
    if (el.className) {
      const firstClass = String(el.className).trim().split(/\s+/)[0];
      if (firstClass) return `${tag}.${firstClass}`;
    }
    return tag;
  }
}

/**
 * Helper to build specification directly.
 */
export function buildTypographyRhythmSpecification(data: AnalyzePageResponseData): TypographyRhythmSpecification {
  return new TypographyRhythmEngine().normalize(data);
}
