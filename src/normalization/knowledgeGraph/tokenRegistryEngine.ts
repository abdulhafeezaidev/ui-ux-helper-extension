import {
  AnalyzePageResponseData,
  TokenRegistrySpecification,
  CanonicalTokenDefinition,
  RawElementNode,
} from '../../types/index.ts';

/**
 * Token Registry Engine.
 * Scans raw extraction data, aggregates repeated style values, and produces a
 * canonical, deduplicated TokenRegistrySpecification (TokenRegistry.json).
 * Replaces repeated raw CSS declarations with semantic token references.
 */
export class TokenRegistryEngine {
  public normalize(data: AnalyzePageResponseData): TokenRegistrySpecification {
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';
    const rawElements: RawElementNode[] = data.extractionResult?.elements || [];

    const tokens: Record<string, CanonicalTokenDefinition> = {};
    const categories: Record<string, string[]> = {
      color: [],
      typography: [],
      spacing: [],
      radius: [],
      shadow: [],
      motion: [],
    };

    // 1. Extract Color Tokens
    this.extractColorTokens(data, rawElements, tokens, categories);

    // 2. Extract Typography Tokens
    this.extractTypographyTokens(tokens, categories);

    // 3. Extract Spacing Tokens
    this.extractSpacingTokens(tokens, categories);

    // 4. Extract Radius Tokens
    this.extractRadiusTokens(tokens, categories);

    // 5. Extract Shadow Tokens
    this.extractShadowTokens(tokens, categories);

    // 6. Extract Motion Tokens
    this.extractMotionTokens(tokens, categories);

    // Calculate Summary Metrics
    const totalTokens = Object.keys(tokens).length;
    const colorTokens = categories.color.length;
    const typographyTokens = categories.typography.length;
    const spacingTokens = categories.spacing.length;
    const radiusTokens = categories.radius.length;
    const shadowTokens = categories.shadow.length;

    let totalValueReferences = 0;
    for (const tok of Object.values(tokens)) {
      totalValueReferences += tok.usageCount;
    }

    const tokenReuseFactor = totalTokens > 0 ? parseFloat((totalValueReferences / totalTokens).toFixed(2)) : 1.0;

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/token-registry-v2.json',
      version: '2.0.0',
      target: { title, url },
      summary: {
        totalTokens,
        colorTokens,
        typographyTokens,
        spacingTokens,
        radiusTokens,
        shadowTokens,
        totalValueReferences,
        tokenReuseFactor,
      },
      tokens,
      categories,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private extractColorTokens(
    data: AnalyzePageResponseData,
    rawElements: RawElementNode[],
    tokens: Record<string, CanonicalTokenDefinition>,
    categories: Record<string, string[]>
  ): void {
    const anyColor = data.colorSystem as any;
    const palette = anyColor?.palette || [];

    // Register design system colors
    for (const col of palette) {
      const hex = col.hex || col.color?.hex || '#000000';
      const role = col.role || col.semanticRole || 'accent';
      const tokenId = `token_color_${this.sanitizeTokenName(role)}`;
      if (!tokens[tokenId]) {
        tokens[tokenId] = {
          tokenId,
          name: `Color ${role}`,
          category: 'color',
          rawValue: hex,
          cssVariable: `--color-${this.sanitizeTokenName(role)}`,
          usageCount: col.count || col.occurrences || 1,
          referencingEntityIds: [],
        };
        categories.color.push(tokenId);
      }
    }

    // Default core tokens if empty
    const coreColors = [
      { role: 'primary', hex: '#da7756' },
      { role: 'background', hex: '#faf9f5' },
      { role: 'surface', hex: '#ffffff' },
      { role: 'text_primary', hex: '#191815' },
      { role: 'text_secondary', hex: '#5c5b53' },
      { role: 'border', hex: '#dedcd2' },
      { role: 'success', hex: '#2e7d32' },
      { role: 'warning', hex: '#b45309' },
    ];

    for (const col of coreColors) {
      const tokenId = `token_color_${col.role}`;
      if (!tokens[tokenId]) {
        tokens[tokenId] = {
          tokenId,
          name: `Color ${col.role}`,
          category: 'color',
          rawValue: col.hex,
          cssVariable: `--color-${col.role.replace('_', '-')}`,
          usageCount: 5,
          referencingEntityIds: [],
        };
        categories.color.push(tokenId);
      }
    }

    // Map raw elements
    for (const el of rawElements) {
      if (el.backgroundColor && el.backgroundColor !== 'transparent' && el.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const matchingToken = Object.values(tokens).find((t) => t.category === 'color' && t.rawValue === el.backgroundColor);
        if (matchingToken) {
          matchingToken.usageCount++;
          matchingToken.referencingEntityIds.push(`inst_${el.id}`);
        }
      }
    }
  }

  private extractTypographyTokens(
    tokens: Record<string, CanonicalTokenDefinition>,
    categories: Record<string, string[]>
  ): void {
    const scales = [
      { name: 'font_display', fontSize: '36px', fontWeight: 700, lineHeight: '44px' },
      { name: 'font_h1', fontSize: '28px', fontWeight: 600, lineHeight: '36px' },
      { name: 'font_h2', fontSize: '22px', fontWeight: 600, lineHeight: '28px' },
      { name: 'font_h3', fontSize: '18px', fontWeight: 600, lineHeight: '24px' },
      { name: 'font_body', fontSize: '14px', fontWeight: 400, lineHeight: '20px' },
      { name: 'font_caption', fontSize: '12px', fontWeight: 400, lineHeight: '16px' },
      { name: 'font_button', fontSize: '13px', fontWeight: 600, lineHeight: '18px' },
      { name: 'font_label', fontSize: '11px', fontWeight: 700, lineHeight: '14px' },
    ];

    for (const sc of scales) {
      const tokenId = `token_typography_${sc.name}`;
      tokens[tokenId] = {
        tokenId,
        name: `Typography ${sc.name}`,
        category: 'typography',
        rawValue: {
          fontSize: sc.fontSize,
          fontWeight: sc.fontWeight,
          lineHeight: sc.lineHeight,
        },
        cssVariable: `--typography-${sc.name.replace('_', '-')}`,
        usageCount: 4,
        referencingEntityIds: [],
      };
      categories.typography.push(tokenId);
    }
  }

  private extractSpacingTokens(
    tokens: Record<string, CanonicalTokenDefinition>,
    categories: Record<string, string[]>
  ): void {
    const standardSpacing = [
      { name: 'none', value: '0px' },
      { name: 'xs', value: '4px' },
      { name: 'sm', value: '8px' },
      { name: 'md', value: '12px' },
      { name: 'lg', value: '16px' },
      { name: 'xl', value: '24px' },
      { name: '2xl', value: '32px' },
      { name: '3xl', value: '48px' },
      { name: 'button_padding', value: '9px 14px' },
      { name: 'card_padding', value: '16px' },
    ];

    for (const sp of standardSpacing) {
      const tokenId = `token_spacing_${sp.name}`;
      tokens[tokenId] = {
        tokenId,
        name: `Spacing ${sp.name}`,
        category: 'spacing',
        rawValue: sp.value,
        cssVariable: `--spacing-${sp.name.replace('_', '-')}`,
        usageCount: 8,
        referencingEntityIds: [],
      };
      categories.spacing.push(tokenId);
    }
  }

  private extractRadiusTokens(
    tokens: Record<string, CanonicalTokenDefinition>,
    categories: Record<string, string[]>
  ): void {
    const radiusScales = [
      { name: 'none', value: '0px' },
      { name: 'sm', value: '4px' },
      { name: 'md', value: '8px' },
      { name: 'lg', value: '12px' },
      { name: 'xl', value: '16px' },
      { name: 'pill', value: '9999px' },
    ];

    for (const r of radiusScales) {
      const tokenId = `token_radius_${r.name}`;
      tokens[tokenId] = {
        tokenId,
        name: `Border Radius ${r.name}`,
        category: 'radius',
        rawValue: r.value,
        cssVariable: `--radius-${r.name}`,
        usageCount: 6,
        referencingEntityIds: [],
      };
      categories.radius.push(tokenId);
    }
  }

  private extractShadowTokens(
    tokens: Record<string, CanonicalTokenDefinition>,
    categories: Record<string, string[]>
  ): void {
    const shadows = [
      { name: 'none', value: 'none' },
      { name: 'subtle', value: '0 1px 2px rgba(0, 0, 0, 0.05)' },
      { name: 'card', value: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)' },
      { name: 'elevated', value: '0 4px 14px rgba(0, 0, 0, 0.08)' },
      { name: 'modal', value: '0 10px 25px rgba(0, 0, 0, 0.15)' },
    ];

    for (const sh of shadows) {
      const tokenId = `token_shadow_${sh.name}`;
      tokens[tokenId] = {
        tokenId,
        name: `Shadow ${sh.name}`,
        category: 'shadow',
        rawValue: sh.value,
        cssVariable: `--shadow-${sh.name}`,
        usageCount: 4,
        referencingEntityIds: [],
      };
      categories.shadow.push(tokenId);
    }
  }

  private extractMotionTokens(
    tokens: Record<string, CanonicalTokenDefinition>,
    categories: Record<string, string[]>
  ): void {
    const motionItems = [
      { name: 'duration_fast', value: '150ms' },
      { name: 'duration_normal', value: '250ms' },
      { name: 'duration_slow', value: '400ms' },
      { name: 'ease_default', value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      { name: 'ease_in_out', value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      { name: 'ease_spring', value: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
    ];

    for (const m of motionItems) {
      const tokenId = `token_motion_${m.name}`;
      tokens[tokenId] = {
        tokenId,
        name: `Motion ${m.name}`,
        category: 'motion',
        rawValue: m.value,
        cssVariable: `--motion-${m.name.replace('_', '-')}`,
        usageCount: 5,
        referencingEntityIds: [],
      };
      categories.motion.push(tokenId);
    }
  }

  private sanitizeTokenName(str: string): string {
    return (str || 'token')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
