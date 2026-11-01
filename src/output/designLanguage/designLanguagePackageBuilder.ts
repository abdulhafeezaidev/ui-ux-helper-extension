import {
  AnalyzePageResponseData,
  DesignLanguagePackageResult,
  DesignLanguagePackageManifest,
} from '../../types/index.ts';
import { DesignPrinciplesEngine } from '../../normalization/theme/designPrinciplesEngine.ts';
import { ComponentStyleEngine } from '../../normalization/theme/componentStyleEngine.ts';
import { exportApplyThemePrompt } from './applyThemePromptExporter.ts';
import { exportCssVariables } from '../cssExporter.ts';
import { exportTailwindConfig } from '../tailwindExporter.ts';
import { exportDesignSystemJson } from '../clonePackage/designSystemJsonExporter.ts';
import { exportTypographyJson } from '../clonePackage/typographyJsonExporter.ts';
import { exportMotionJson } from '../clonePackage/motionJsonExporter.ts';
import { exportResponsiveTransitionsJson } from '../clonePackage/responsiveTransitionJsonExporter.ts';
import { ZipPackager } from '../clonePackage/zipPackager.ts';

export const designLanguageCollectors = {
  collectPrinciples: (data: AnalyzePageResponseData) => {
    const engine = new DesignPrinciplesEngine();
    const spec = engine.inferPrinciples(data);
    const md = engine.generateMarkdown(spec);
    return { spec, md };
  },
  collectComponentStyles: (data: AnalyzePageResponseData) => {
    const engine = new ComponentStyleEngine();
    const spec = engine.extractComponentStyles(data);
    return spec;
  },
  collectColorPalette: (data: AnalyzePageResponseData) => {
    const colorSys = data.colorSystem;
    return {
      $schema: 'https://ui-ux-helper.internal/schemas/color-palette-v1.json',
      version: '1.0.0',
      colorSpace: 'sRGB',
      tokens: (colorSys?.tokens || []).map((t) => ({
        id: t.id,
        hex: t.color.hex,
        rgbString: t.color.rgbString,
        hsl: t.color.hsl,
        usages: t.usages,
        semanticRole: t.usages[0] || 'neutral',
        luminance: t.luminance,
      })),
      paletteRoles: {
        primary: colorSys?.tokens.find((t) => t.usages.some((u) => u === 'accent' || u === 'cta'))?.color.hex || '#3b82f6',
        secondary: colorSys?.tokens.find((t) => t.usages.some((u) => u === 'text'))?.color.hex || '#64748b',
        accent: colorSys?.tokens.find((t) => t.usages.some((u) => u === 'accent' || u === 'cta'))?.color.hex || '#8b5cf6',
        background: colorSys?.tokens.find((t) => t.usages.some((u) => u === 'background'))?.color.hex || '#0f172a',
        surface: colorSys?.tokens.find((t) => t.usages.some((u) => u === 'background'))?.color.hex || '#1e293b',
        border: colorSys?.tokens.find((t) => t.usages.some((u) => u === 'border'))?.color.hex || '#334155',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
    };
  },
  collectSpacing: (data: AnalyzePageResponseData) => {
    const layoutSys = data.layoutSystem;
    return {
      $schema: 'https://ui-ux-helper.internal/schemas/spacing-v1.json',
      version: '1.0.0',
      spacingScale: layoutSys?.spacingScale || [
        { name: 'xs', valuePx: 4 },
        { name: 'sm', valuePx: 8 },
        { name: 'md', valuePx: 16 },
        { name: 'lg', valuePx: 24 },
        { name: 'xl', valuePx: 32 },
        { name: '2xl', valuePx: 48 },
        { name: '3xl', valuePx: 64 },
      ],
      containerWidths: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
      sectionPadding: {
        mobile: '32px 16px',
        tablet: '48px 24px',
        desktop: '80px 32px',
      },
    };
  },
  collectLayoutRules: (data: AnalyzePageResponseData) => {
    const layoutSys = data.layoutSystem;
    return {
      $schema: 'https://ui-ux-helper.internal/schemas/layout-rules-v1.json',
      version: '1.0.0',
      gridSystem: {
        columns: { mobile: 1, tablet: 2, desktop: 4 },
        gutter: '24px',
        margin: '32px',
      },
      contentDensity: layoutSys?.stats.flexCount ? 'comfortable' : 'spacious',
      whitespaceRhythm: 'balanced',
      alignmentRules: ['align-items: center', 'justify-content: space-between', 'gap: 16px'],
    };
  },
};

/**
 * Builds the canonical DesignLanguagePackage.zip containing content-stripped visual styles,
 * component systems, design principles, and AI theme transfer prompt.
 */
export function buildDesignLanguagePackage(data: AnalyzePageResponseData): DesignLanguagePackageResult {
  const { spec: principlesSpec, md: principlesMd } = designLanguageCollectors.collectPrinciples(data);
  const componentStyles = designLanguageCollectors.collectComponentStyles(data);
  const colorPalette = designLanguageCollectors.collectColorPalette(data);
  const spacing = designLanguageCollectors.collectSpacing(data);
  const layoutRules = designLanguageCollectors.collectLayoutRules(data);

  const designSystemJson = exportDesignSystemJson(data);
  const typographyJson = exportTypographyJson(data);
  const motionJson = exportMotionJson(data);
  const responsiveJson = exportResponsiveTransitionsJson(data);
  const cssVariables = exportCssVariables(data);
  const tailwindConfig = exportTailwindConfig(data);
  const themePrompt = exportApplyThemePrompt(data, principlesSpec);

  // Canonical Content-Stripped Package Files
  const canonicalFiles: Record<string, string> = {
    'design-system.json': designSystemJson,
    'color-palette.json': JSON.stringify(colorPalette, null, 2),
    'typography.json': typographyJson,
    'spacing.json': JSON.stringify(spacing, null, 2),
    'layout-rules.json': JSON.stringify(layoutRules, null, 2),
    'component-styles.json': JSON.stringify(componentStyles, null, 2),
    'button-system.json': JSON.stringify(componentStyles.buttons, null, 2),
    'form-system.json': JSON.stringify(componentStyles.forms, null, 2),
    'navigation-system.json': JSON.stringify(componentStyles.navigation, null, 2),
    'card-system.json': JSON.stringify(componentStyles.cards, null, 2),
    'icon-style.json': JSON.stringify(componentStyles.icons, null, 2),
    'motion-system.json': motionJson,
    'responsive-rules.json': responsiveJson,
    'design-principles.md': principlesMd,
    'AI_Apply_Theme.md': themePrompt,
    'styles/css-variables.css': cssVariables,
    'styles/tailwind.config.js': tailwindConfig,
  };

  const packager = new ZipPackager();
  packager.addFiles(canonicalFiles);
  const zipBuffer = packager.generateZip();
  const base64 = packager.toBase64();

  const fileEntries = Object.entries(canonicalFiles).map(([path, content]) => ({
    path,
    bytes: new TextEncoder().encode(content).length,
    mimeType: path.endsWith('.json') ? 'application/json' : path.endsWith('.css') ? 'text/css' : path.endsWith('.js') ? 'text/javascript' : 'text/markdown',
    role: path.replace(/\.[^.]+$/, ''),
    description: `Design language theme artifact ${path}`,
  }));

  const manifest: DesignLanguagePackageManifest = {
    generator: 'UI/UX Helper Design Language Extraction Engine',
    version: '1.0.0',
    mode: 'design-language-theme-transfer',
    generatedAt: new Date().toISOString(),
    referenceUrl: data.pageUrl,
    referenceTitle: data.title,
    designPersonality: principlesSpec.traits,
    totalFiles: Object.keys(canonicalFiles).length,
    totalBytes: zipBuffer.length,
    files: fileEntries,
  };

  return {
    manifest,
    themePrompt,
    designPrinciples: principlesMd,
    files: canonicalFiles,
    zipBuffer,
    base64,
  };
}
