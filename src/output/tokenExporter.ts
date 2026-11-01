import { AnalyzePageResponseData } from '../types/index.ts';

export function exportDesignTokens(data: AnalyzePageResponseData): string {
  const colorSys = data.colorSystem;
  const typoSys = data.typographySystem;
  const shapeSys = data.shapeSystem;
  const layoutSys = data.layoutSystem;

  const colorTokens: Record<string, { value: string; role?: string; frequency: number }> = {};
  if (colorSys) {
    if (colorSys.roles?.pageBackground) colorTokens['color-bg-page'] = { value: (colorSys.roles.pageBackground as any).color?.hex || (colorSys.roles.pageBackground as any).hex || '#ffffff', role: 'pageBackground', frequency: colorSys.roles.pageBackground.frequency || 1 };
    if (colorSys.roles?.surfaceBackground) colorTokens['color-bg-surface'] = { value: (colorSys.roles.surfaceBackground as any).color?.hex || (colorSys.roles.surfaceBackground as any).hex || '#ffffff', role: 'surfaceBackground', frequency: colorSys.roles.surfaceBackground.frequency || 1 };
    if (colorSys.roles?.primaryText) colorTokens['color-text-primary'] = { value: (colorSys.roles.primaryText as any).color?.hex || (colorSys.roles.primaryText as any).hex || '#000000', role: 'primaryText', frequency: colorSys.roles.primaryText.frequency || 1 };
    if (colorSys.roles?.secondaryText) colorTokens['color-text-secondary'] = { value: (colorSys.roles.secondaryText as any).color?.hex || (colorSys.roles.secondaryText as any).hex || '#666666', role: 'secondaryText', frequency: colorSys.roles.secondaryText.frequency || 1 };
    if (colorSys.roles?.border) colorTokens['color-border'] = { value: (colorSys.roles.border as any).color?.hex || (colorSys.roles.border as any).hex || '#e2e8f0', role: 'border', frequency: colorSys.roles.border.frequency || 1 };
    if (colorSys.roles?.primaryAccent) colorTokens['color-primary-accent'] = { value: (colorSys.roles.primaryAccent as any).color?.hex || (colorSys.roles.primaryAccent as any).hex || '#3b82f6', role: 'primaryAccent', frequency: colorSys.roles.primaryAccent.frequency || 1 };
    if (colorSys.roles?.interactiveCTA) colorTokens['color-interactive-cta'] = { value: (colorSys.roles.interactiveCTA as any).color?.hex || (colorSys.roles.interactiveCTA as any).hex || '#3b82f6', role: 'interactiveCTA', frequency: colorSys.roles.interactiveCTA.frequency || 1 };

    if (Array.isArray(colorSys.tokens)) {
      colorSys.tokens.forEach((t: any, idx) => {
        const key = `color-palette-${idx + 1}`;
        if (!colorTokens[key]) {
          colorTokens[key] = { value: t.color?.hex || t.hex || '#000000', frequency: t.frequency || 1 };
        }
      });
    }
  }

  const typographyTokens: Record<string, { fontFamily?: string; fontSize?: string; fontWeight?: number }> = {};
  if (typoSys) {
    if (Array.isArray(typoSys.fontFamilies)) {
      typoSys.fontFamilies.forEach((f: any, idx) => {
        typographyTokens[`font-family-${idx + 1}`] = { fontFamily: f.name || f.primary };
      });
    }
    if (typoSys.hierarchy?.h1) typographyTokens['font-size-h1'] = { fontSize: `${typoSys.hierarchy.h1.fontSizePx}px`, fontWeight: typoSys.hierarchy.h1.fontWeight };
    if (typoSys.hierarchy?.h2) typographyTokens['font-size-h2'] = { fontSize: `${typoSys.hierarchy.h2.fontSizePx}px`, fontWeight: typoSys.hierarchy.h2.fontWeight };
    if (typoSys.hierarchy?.body) typographyTokens['font-size-body'] = { fontSize: `${typoSys.hierarchy.body.fontSizePx}px`, fontWeight: typoSys.hierarchy.body.fontWeight };
  }

  const spacingTokens: Record<string, string> = {};
  if (layoutSys && Array.isArray(layoutSys.spacingScale)) {
    layoutSys.spacingScale.forEach((s) => {
      spacingTokens[`spacing-${s.valuePx}`] = `${s.valuePx}px`;
    });
  }

  const radiusTokens: Record<string, string> = {};
  const shadowTokens: Record<string, string> = {};
  if (shapeSys) {
    if (Array.isArray(shapeSys.radiusScale)) {
      shapeSys.radiusScale.forEach((r) => {
        radiusTokens[`radius-${r.valuePx}`] = `${r.valuePx}px`;
      });
    } else if (Array.isArray((shapeSys as any).radiusTokens)) {
      (shapeSys as any).radiusTokens.forEach((r: any) => {
        radiusTokens[`radius-${r.valuePx}`] = `${r.valuePx}px`;
      });
    }
    if (Array.isArray(shapeSys.shadowTokens)) {
      shapeSys.shadowTokens.forEach((s, idx) => {
        shadowTokens[`shadow-${idx + 1}`] = s.rawString;
      });
    }
  }

  const tokens = {
    $schema: 'https://design-tokens.github.io/community-group/format/',
    color: colorTokens,
    typography: typographyTokens,
    spacing: spacingTokens,
    borderRadius: radiusTokens,
    boxShadow: shadowTokens,
  };

  return JSON.stringify(tokens, null, 2);
}
