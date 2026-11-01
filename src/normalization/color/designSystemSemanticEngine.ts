import {
  AnalyzePageResponseData,
} from '../../types/index.ts';

export interface SemanticColorToken {
  name: string;
  role: string;
  value: string; // Hex or rgba
  rgb?: string;
  description: string;
  contrastOnWhite?: number;
  contrastOnBlack?: number;
}

export interface SemanticTypographyToken {
  role: 'Display' | 'H1' | 'H2' | 'H3' | 'Body' | 'Caption' | 'Button' | 'Label' | 'Small';
  fontSize: {
    px: number;
    rem: string;
    clamp?: string;
  };
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
  fontFamily: string;
  textTransform: string;
  textDecoration: string;
  usage: string;
}

export interface SemanticSpacingScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  containerPadding: string;
  sectionGap: string;
}

export interface SemanticRadiusScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  full: string;
}

export interface SemanticShadowScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface SemanticZIndexScale {
  base: number;
  dropdown: number;
  sticky: number;
  fixed: number;
  modalBackdrop: number;
  modal: number;
  popover: number;
  tooltip: number;
}

export interface DesignSystemSpecification {
  $schema: string;
  version: string;
  systemName: string;
  colorTokens: {
    primary: SemanticColorToken;
    secondary: SemanticColorToken;
    accent: SemanticColorToken;
    danger: SemanticColorToken;
    warning: SemanticColorToken;
    success: SemanticColorToken;
    muted: SemanticColorToken;
    border: SemanticColorToken;
    surface: SemanticColorToken;
    container: SemanticColorToken;
    interactive: SemanticColorToken;
    focus: SemanticColorToken;
    disabled: SemanticColorToken;
    text: {
      primary: SemanticColorToken;
      secondary: SemanticColorToken;
      muted: SemanticColorToken;
      inverse: SemanticColorToken;
    };
    background: {
      canvas: SemanticColorToken;
      surface: SemanticColorToken;
      elevated: SemanticColorToken;
      container: SemanticColorToken;
    };
    borderPalette: {
      default: SemanticColorToken;
      subtle: SemanticColorToken;
      strong: SemanticColorToken;
      focus: SemanticColorToken;
    };
  };
  typographyTokens: Record<SemanticTypographyToken['role'], SemanticTypographyToken>;
  spacingTokens: SemanticSpacingScale;
  radiusTokens: SemanticRadiusScale;
  shadowTokens: SemanticShadowScale;
  zIndexTokens: SemanticZIndexScale;
  metadata: {
    generatedAt: string;
    pageTitle?: string;
    pageUrl?: string;
    totalColorTokens: number;
    totalTypographyTokens: number;
  };
}

/**
 * Builds the complete Semantic Design System token catalog for Prompt 24.
 */
export function buildDesignSystemSpecification(data: AnalyzePageResponseData): DesignSystemSpecification {
  const colorSys = data.colorSystem;
  const typoSys = data.typographySystem;
  const shapeSys = data.shapeSystem;

  // -------------------------------------------------------------
  // 1. SEMANTIC COLOR TOKEN RESOLUTION
  // -------------------------------------------------------------
  const primaryHex = (colorSys?.roles?.primaryAccent as any)?.color?.hex || (colorSys?.roles?.primaryAccent as any)?.hex || '#3b82f6';
  const secondaryHex = (colorSys?.roles?.interactiveCTA as any)?.color?.hex || (colorSys?.roles?.interactiveCTA as any)?.hex || '#1d4ed8';
  const accentHex = (colorSys?.roles?.primaryAccent as any)?.color?.hex || (colorSys?.roles?.primaryAccent as any)?.hex || '#f59e0b';
  const surfaceHex = (colorSys?.roles?.surfaceBackground as any)?.color?.hex || (colorSys?.roles?.surfaceBackground as any)?.hex || '#ffffff';
  const containerHex = (colorSys?.roles?.pageBackground as any)?.color?.hex || (colorSys?.roles?.pageBackground as any)?.hex || '#f8fafc';
  const textPrimaryHex = (colorSys?.roles?.primaryText as any)?.color?.hex || (colorSys?.roles?.primaryText as any)?.hex || '#0f172a';
  const textSecondaryHex = (colorSys?.roles?.secondaryText as any)?.color?.hex || (colorSys?.roles?.secondaryText as any)?.hex || '#475569';
  const borderHex = (colorSys?.roles?.border as any)?.color?.hex || (colorSys?.roles?.border as any)?.hex || '#e2e8f0';

  const colorTokens = {
    primary: {
      name: 'Primary',
      role: 'color.primary',
      value: primaryHex,
      description: 'Primary brand identity and prominent call-to-action triggers',
    },
    secondary: {
      name: 'Secondary',
      role: 'color.secondary',
      value: secondaryHex,
      description: 'Secondary interactive elements, auxiliary buttons, and active states',
    },
    accent: {
      name: 'Accent',
      role: 'color.accent',
      value: accentHex,
      description: 'Promotional tags, sale highlights, and emphasis badges',
    },
    danger: {
      name: 'Danger',
      role: 'color.danger',
      value: '#ef4444',
      description: 'Destructive actions, error feedback states, and validation warnings',
    },
    warning: {
      name: 'Warning',
      role: 'color.warning',
      value: '#f59e0b',
      description: 'Caution alerts, stock urgency tags, and pending states',
    },
    success: {
      name: 'Success',
      role: 'color.success',
      value: '#10b981',
      description: 'Positive confirmation feedback, in-stock chips, and completion toasts',
    },
    muted: {
      name: 'Muted',
      role: 'color.muted',
      value: '#94a3b8',
      description: 'De-emphasized placeholders, disabled borders, and subtle captions',
    },
    border: {
      name: 'Border',
      role: 'color.border',
      value: borderHex,
      description: 'Structural card outlines, table dividers, and input borders',
    },
    surface: {
      name: 'Surface Background',
      role: 'color.surface',
      value: surfaceHex,
      description: 'Modal sheets, elevated cards, dropdown flyouts, and drawer backgrounds',
    },
    container: {
      name: 'Container Background',
      role: 'color.container',
      value: containerHex,
      description: 'Page foundation canvas, section containers, and outer viewport shell',
    },
    interactive: {
      name: 'Interactive',
      role: 'color.interactive',
      value: primaryHex,
      description: 'Hyperlinks, clickable icons, and selectable items',
    },
    focus: {
      name: 'Focus',
      role: 'color.focus',
      value: '#60a5fa',
      description: 'Accessibility focus outline ring and active keyboard navigation states',
    },
    disabled: {
      name: 'Disabled',
      role: 'color.disabled',
      value: '#cbd5e1',
      description: 'Inactive button fills, disabled controls, and non-interactive states',
    },
    text: {
      primary: {
        name: 'Primary Text',
        role: 'text.primary',
        value: textPrimaryHex,
        description: 'High-contrast headline and body reading text',
      },
      secondary: {
        name: 'Secondary Text',
        role: 'text.secondary',
        value: textSecondaryHex,
        description: 'Subheadings, meta labels, timestamps, and supporting text',
      },
      muted: {
        name: 'Muted Text',
        role: 'text.muted',
        value: '#64748b',
        description: 'Placeholder labels, disclaimers, and auxiliary footnotes',
      },
      inverse: {
        name: 'Inverse Text',
        role: 'text.inverse',
        value: '#ffffff',
        description: 'High-contrast light text on dark or primary backgrounds',
      },
    },
    background: {
      canvas: {
        name: 'Canvas Background',
        role: 'bg.canvas',
        value: containerHex,
        description: 'Root page background canvas',
      },
      surface: {
        name: 'Surface Background',
        role: 'bg.surface',
        value: surfaceHex,
        description: 'Standard card and container surface',
      },
      elevated: {
        name: 'Elevated Surface Background',
        role: 'bg.elevated',
        value: surfaceHex,
        description: 'Floating popovers, tooltips, and modal surfaces',
      },
      container: {
        name: 'Container Surface Background',
        role: 'bg.container',
        value: '#f1f5f9',
        description: 'Nested sub-containers and code block containers',
      },
    },
    borderPalette: {
      default: {
        name: 'Default Border',
        role: 'border.default',
        value: borderHex,
        description: 'Default 1px container and card boundaries',
      },
      subtle: {
        name: 'Subtle Border',
        role: 'border.subtle',
        value: '#f1f5f9',
        description: 'Subtle divider lines between list rows',
      },
      strong: {
        name: 'Strong Border',
        role: 'border.strong',
        value: '#94a3b8',
        description: 'High-contrast focus boundaries and active tab underlines',
      },
      focus: {
        name: 'Focus Ring Border',
        role: 'border.focus',
        value: '#3b82f6',
        description: 'Active 2px focus ring highlight for accessibility',
      },
    },
  };

  // -------------------------------------------------------------
  // 2. SEMANTIC TYPOGRAPHY ROLES
  // -------------------------------------------------------------
  const primaryFont = typoSys?.fontFamilies?.[0]?.name || typoSys?.hierarchy?.h1?.fontFamily || 'Inter, -apple-system, sans-serif';
  const baseH1 = typoSys?.hierarchy?.h1?.fontSizePx || 40;
  const baseH2 = typoSys?.hierarchy?.h2?.fontSizePx || 32;
  const baseBody = typoSys?.hierarchy?.body?.fontSizePx || 16;

  const typographyTokens: Record<SemanticTypographyToken['role'], SemanticTypographyToken> = {
    Display: {
      role: 'Display',
      fontSize: {
        px: Math.max(56, baseH1 + 16),
        rem: `${(Math.max(56, baseH1 + 16) / 16).toFixed(2)}rem`,
        clamp: `clamp(36px, 6vw, ${Math.max(56, baseH1 + 16)}px)`,
      },
      fontWeight: 800,
      lineHeight: '1.1',
      letterSpacing: '-0.025em',
      fontFamily: primaryFont,
      textTransform: 'none',
      textDecoration: 'none',
      usage: 'Large hero promotional headlines and billboard display text',
    },
    H1: {
      role: 'H1',
      fontSize: {
        px: baseH1,
        rem: `${(baseH1 / 16).toFixed(2)}rem`,
        clamp: `clamp(28px, 4vw, ${baseH1}px)`,
      },
      fontWeight: typoSys?.hierarchy?.h1?.fontWeight || 700,
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
      fontFamily: primaryFont,
      textTransform: 'none',
      textDecoration: 'none',
      usage: 'Primary page titles and main section titles',
    },
    H2: {
      role: 'H2',
      fontSize: {
        px: baseH2,
        rem: `${(baseH2 / 16).toFixed(2)}rem`,
        clamp: `clamp(22px, 3vw, ${baseH2}px)`,
      },
      fontWeight: typoSys?.hierarchy?.h2?.fontWeight || 600,
      lineHeight: '1.25',
      letterSpacing: '-0.015em',
      fontFamily: primaryFont,
      textTransform: 'none',
      textDecoration: 'none',
      usage: 'Secondary section headings and category headlines',
    },
    H3: {
      role: 'H3',
      fontSize: {
        px: 22,
        rem: '1.375rem',
        clamp: 'clamp(18px, 2.5vw, 22px)',
      },
      fontWeight: 600,
      lineHeight: '1.3',
      letterSpacing: '-0.01em',
      fontFamily: primaryFont,
      textTransform: 'none',
      textDecoration: 'none',
      usage: 'Card titles, feature item headings, and modal titles',
    },
    Body: {
      role: 'Body',
      fontSize: {
        px: baseBody,
        rem: `${(baseBody / 16).toFixed(2)}rem`,
        clamp: `clamp(14px, 1.2vw, ${baseBody}px)`,
      },
      fontWeight: typoSys?.hierarchy?.body?.fontWeight || 400,
      lineHeight: '1.5',
      letterSpacing: '0em',
      fontFamily: primaryFont,
      textTransform: 'none',
      textDecoration: 'none',
      usage: 'Standard paragraph body text and general description content',
    },
    Caption: {
      role: 'Caption',
      fontSize: {
        px: 13,
        rem: '0.8125rem',
      },
      fontWeight: 400,
      lineHeight: '1.4',
      letterSpacing: '0.01em',
      fontFamily: primaryFont,
      textTransform: 'none',
      textDecoration: 'none',
      usage: 'Image captions, secondary metadata, timestamps, and breadcrumbs',
    },
    Button: {
      role: 'Button',
      fontSize: {
        px: 15,
        rem: '0.9375rem',
      },
      fontWeight: 600,
      lineHeight: '1',
      letterSpacing: '0.01em',
      fontFamily: primaryFont,
      textTransform: 'none',
      textDecoration: 'none',
      usage: 'Interactive buttons, pill links, and action triggers',
    },
    Label: {
      role: 'Label',
      fontSize: {
        px: 14,
        rem: '0.875rem',
      },
      fontWeight: 500,
      lineHeight: '1.2',
      letterSpacing: '0.02em',
      fontFamily: primaryFont,
      textTransform: 'none',
      textDecoration: 'none',
      usage: 'Form field labels, badge chips, and navigation item labels',
    },
    Small: {
      role: 'Small',
      fontSize: {
        px: 12,
        rem: '0.75rem',
      },
      fontWeight: 400,
      lineHeight: '1.3',
      letterSpacing: '0.02em',
      fontFamily: primaryFont,
      textTransform: 'none',
      textDecoration: 'none',
      usage: 'Legal disclaimers, copyright notices, and badge chips',
    },
  };

  // -------------------------------------------------------------
  // 3. SEMANTIC SPACING, RADII, SHADOWS, Z-INDEX
  // -------------------------------------------------------------
  const spacingTokens: SemanticSpacingScale = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    containerPadding: '32px',
    sectionGap: '64px',
  };

  const radiusTokens: SemanticRadiusScale = {
    none: '0px',
    sm: '4px',
    md: shapeSys?.radiusScale?.[0] ? `${shapeSys.radiusScale[0].valuePx}px` : '8px',
    lg: '16px',
    full: '9999px',
  };

  const shadowTokens: SemanticShadowScale = {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: shapeSys?.shadowTokens?.[0]?.rawString || '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  };

  const zIndexTokens: SemanticZIndexScale = {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  };

  return {
    $schema: 'https://ui-ux-helper.internal/schemas/design-system-v1.json',
    version: '1.0.0',
    systemName: `${data.title || 'Target Application'} Design System`,
    colorTokens,
    typographyTokens,
    spacingTokens,
    radiusTokens,
    shadowTokens,
    zIndexTokens,
    metadata: {
      generatedAt: new Date().toISOString(),
      pageTitle: data.title,
      pageUrl: data.pageUrl,
      totalColorTokens: Object.keys(colorTokens).length + Object.keys(colorTokens.text).length + Object.keys(colorTokens.background).length + Object.keys(colorTokens.borderPalette).length,
      totalTypographyTokens: Object.keys(typographyTokens).length,
    },
  };
}
