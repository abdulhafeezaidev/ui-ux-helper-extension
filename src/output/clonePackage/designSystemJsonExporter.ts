import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildDesignSystemSpecification } from '../../normalization/color/designSystemSemanticEngine.ts';
import { exportDesignTokens } from '../tokenExporter.ts';

export function exportDesignSystemJson(data: AnalyzePageResponseData): string {
  const dsSpec = buildDesignSystemSpecification(data);
  let dtcgTokensRaw: any = {};
  try {
    dtcgTokensRaw = JSON.parse(exportDesignTokens(data));
  } catch {
    dtcgTokensRaw = {};
  }

  const cssVariableMapping: Record<string, string> = {
    '--color-primary': dsSpec.colorTokens.primary.value,
    '--color-secondary': dsSpec.colorTokens.secondary.value,
    '--color-accent': dsSpec.colorTokens.accent.value,
    '--color-danger': dsSpec.colorTokens.danger.value,
    '--color-warning': dsSpec.colorTokens.warning.value,
    '--color-success': dsSpec.colorTokens.success.value,
    '--color-muted': dsSpec.colorTokens.muted.value,
    '--color-border': dsSpec.colorTokens.border.value,
    '--color-surface': dsSpec.colorTokens.surface.value,
    '--color-container': dsSpec.colorTokens.container.value,
    '--color-interactive': dsSpec.colorTokens.interactive.value,
    '--color-focus': dsSpec.colorTokens.focus.value,
    '--color-disabled': dsSpec.colorTokens.disabled.value,
    '--color-text-primary': dsSpec.colorTokens.text.primary.value,
    '--color-text-secondary': dsSpec.colorTokens.text.secondary.value,
    '--color-text-muted': dsSpec.colorTokens.text.muted.value,
    '--color-text-inverse': dsSpec.colorTokens.text.inverse.value,
    '--font-sans': dsSpec.typographyTokens.Body.fontFamily,
    '--font-heading': dsSpec.typographyTokens.H1.fontFamily,
    '--radius-sm': dsSpec.radiusTokens.sm,
    '--radius-md': dsSpec.radiusTokens.md,
    '--radius-lg': dsSpec.radiusTokens.lg,
    '--radius-full': dsSpec.radiusTokens.full,
    '--spacing-xs': dsSpec.spacingTokens.xs,
    '--spacing-sm': dsSpec.spacingTokens.sm,
    '--spacing-md': dsSpec.spacingTokens.md,
    '--spacing-lg': dsSpec.spacingTokens.lg,
    '--spacing-xl': dsSpec.spacingTokens.xl,
    '--spacing-2xl': dsSpec.spacingTokens['2xl'],
    '--spacing-3xl': dsSpec.spacingTokens['3xl'],
  };

  const tailwindTokenMapping = {
    colors: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
      accent: 'var(--color-accent)',
      danger: 'var(--color-danger)',
      warning: 'var(--color-warning)',
      success: 'var(--color-success)',
      muted: 'var(--color-muted)',
      border: 'var(--color-border)',
      surface: 'var(--color-surface)',
      container: 'var(--color-container)',
      text: {
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        muted: 'var(--color-text-muted)',
        inverse: 'var(--color-text-inverse)',
      },
    },
    borderRadius: {
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      full: 'var(--radius-full)',
    },
    spacing: {
      xs: 'var(--spacing-xs)',
      sm: 'var(--spacing-sm)',
      md: 'var(--spacing-md)',
      lg: 'var(--spacing-lg)',
      xl: 'var(--spacing-xl)',
      '2xl': 'var(--spacing-2xl)',
      '3xl': 'var(--spacing-3xl)',
    },
  };

  const payload = {
    $schema: 'https://ui-ux-helper.internal/schemas/design-system-v1.json',
    version: '2.0.0',
    systemName: dsSpec.systemName,
    colorTokens: dsSpec.colorTokens,
    typographyTokens: dsSpec.typographyTokens,
    spacingTokens: dsSpec.spacingTokens,
    radiusTokens: dsSpec.radiusTokens,
    shadowTokens: dsSpec.shadowTokens,
    zIndexTokens: dsSpec.zIndexTokens,
    cssVariableMapping,
    tailwindTokenMapping,
    dtcgDesignTokens: dtcgTokensRaw,
    metadata: {
      ...dsSpec.metadata,
      version: '2.0.0',
    },
  };

  return JSON.stringify(payload, null, 2);
}
