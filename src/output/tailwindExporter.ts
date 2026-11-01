import { AnalyzePageResponseData } from '../types/index.ts';

export function exportTailwindConfig(data: AnalyzePageResponseData): string {
  const colorSys = data.colorSystem;
  const typoSys = data.typographySystem;
  const shapeSys = data.shapeSystem;
  const layoutSys = data.layoutSystem;

  const colors: Record<string, string> = {};
  if (colorSys) {
    if (colorSys.roles?.pageBackground) colors['bg-page'] = (colorSys.roles.pageBackground as any).color?.hex || (colorSys.roles.pageBackground as any).hex || '#ffffff';
    if (colorSys.roles?.surfaceBackground) colors['bg-surface'] = (colorSys.roles.surfaceBackground as any).color?.hex || (colorSys.roles.surfaceBackground as any).hex || '#ffffff';
    if (colorSys.roles?.primaryText) colors['text-primary'] = (colorSys.roles.primaryText as any).color?.hex || (colorSys.roles.primaryText as any).hex || '#000000';
    if (colorSys.roles?.secondaryText) colors['text-secondary'] = (colorSys.roles.secondaryText as any).color?.hex || (colorSys.roles.secondaryText as any).hex || '#666666';
    if (colorSys.roles?.border) colors['border-main'] = (colorSys.roles.border as any).color?.hex || (colorSys.roles.border as any).hex || '#e2e8f0';
    if (colorSys.roles?.primaryAccent) colors['accent-primary'] = (colorSys.roles.primaryAccent as any).color?.hex || (colorSys.roles.primaryAccent as any).hex || '#3b82f6';
    if (colorSys.roles?.interactiveCTA) colors['cta-primary'] = (colorSys.roles.interactiveCTA as any).color?.hex || (colorSys.roles.interactiveCTA as any).hex || '#3b82f6';

    if (Array.isArray(colorSys.tokens)) {
      const uniqueHexes = new Set<string>();
      let pIdx = 1;
      colorSys.tokens.forEach((t: any) => {
        const hex = t.color?.hex || t.hex || '#000000';
        if (!uniqueHexes.has(hex.toLowerCase())) {
          uniqueHexes.add(hex.toLowerCase());
          colors[`palette-${pIdx++}`] = hex;
        }
      });
    }
  }

  const fontFamily: Record<string, string[]> = {};
  const fontSize: Record<string, string> = {};
  if (typoSys) {
    if (Array.isArray(typoSys.fontFamilies)) {
      typoSys.fontFamilies.forEach((f: any, idx) => {
        fontFamily[`family-${idx + 1}`] = [f.primary, ...(f.fallbacks || [])];
      });
    }
    if (typoSys.hierarchy?.h1) fontSize['h1'] = `${typoSys.hierarchy.h1.fontSizePx}px`;
    if (typoSys.hierarchy?.h2) fontSize['h2'] = `${typoSys.hierarchy.h2.fontSizePx}px`;
    if (typoSys.hierarchy?.body) fontSize['body'] = `${typoSys.hierarchy.body.fontSizePx}px`;
  }

  const spacing: Record<string, string> = {
    'container-padding': '24px',
    'section-gap': '64px',
    'xs': '4px',
    'sm': '8px',
    'md': '16px',
    'lg': '24px',
    'xl': '32px',
    '2xl': '48px',
    '3xl': '64px',
  };

  if (layoutSys && Array.isArray(layoutSys.spacingScale)) {
    const uniqueSp = Array.from(new Set(layoutSys.spacingScale.map((s) => Math.round(s.valuePx)))).sort((a, b) => a - b);
    uniqueSp.forEach((sp) => {
      if (sp > 0) spacing[`sp-${sp}`] = `${sp}px`;
    });
  }

  const borderRadius: Record<string, string> = {};
  const boxShadow: Record<string, string> = {};
  if (shapeSys) {
    if (Array.isArray(shapeSys.radiusScale)) {
      shapeSys.radiusScale.forEach((r) => {
        borderRadius[`rad-${r.valuePx}`] = `${r.valuePx}px`;
      });
    } else if (Array.isArray((shapeSys as any).radiusTokens)) {
      (shapeSys as any).radiusTokens.forEach((r: any) => {
        borderRadius[`rad-${r.valuePx}`] = `${r.valuePx}px`;
      });
    }
    if (Array.isArray(shapeSys.shadowTokens)) {
      shapeSys.shadowTokens.forEach((s, idx) => {
        boxShadow[`shadow-${idx + 1}`] = s.rawString;
      });
    }
  }

  const configObj = {
    theme: {
      extend: {
        colors,
        fontFamily,
        fontSize,
        spacing,
        borderRadius,
        boxShadow,
      },
    },
  };

  return `/** @type {import('tailwindcss').Config} */\nmodule.exports = ${JSON.stringify(configObj, null, 2)};\n`;
}
