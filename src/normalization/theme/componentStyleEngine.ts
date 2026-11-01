import {
  AnalyzePageResponseData,
  ComponentStyleLanguageSpecification,
  ButtonSystemSpecification,
  FormSystemSpecification,
  CardSystemSpecification,
  NavigationSystemSpecification,
  IconStyleSpecification,
} from '../../types/index.ts';

/**
 * Component Style Language Engine.
 * Extracts purely reusable, content-stripped component design systems:
 * Buttons, Forms, Inputs, Cards, Navigation, Tabs, Badges, Modals, Breadcrumbs, and Icons.
 */
export class ComponentStyleEngine {
  public extractComponentStyles(data: AnalyzePageResponseData): ComponentStyleLanguageSpecification {
    const colorSys = data.colorSystem;
    const shapeSys = data.shapeSystem;
    const elements = data.extractionResult?.elements || [];

    // 1. Color Palette Inference for Component Tokens
    const primaryToken = colorSys?.tokens.find((t) => t.usages.some((u) => u === 'accent' || u === 'cta')) || colorSys?.tokens[0];
    const primaryHex = primaryToken?.color.hex || '#3b82f6';
    const bgHex = colorSys?.tokens.find((t) => t.usages.some((u) => u === 'background'))?.color.hex || '#0f172a';
    const surfaceHex = colorSys?.tokens.find((t) => t.usages.some((u) => u === 'background' || u === 'accent'))?.color.hex || '#1e293b';
    const borderHex = colorSys?.tokens.find((t) => t.usages.some((u) => u === 'border'))?.color.hex || '#334155';
    const textHex = colorSys?.tokens.find((t) => t.usages.some((u) => u === 'text'))?.color.hex || '#f8fafc';
    const textMutedHex = '#94a3b8';

    // 2. Shape Radius Scales
    const baseRadius = shapeSys?.radiusScale[0]?.valuePx ? `${shapeSys.radiusScale[0].valuePx}px` : '6px';
    const cardRadius = shapeSys?.radiusScale.length ? `${Math.max(8, shapeSys.radiusScale[shapeSys.radiusScale.length - 1].valuePx)}px` : '12px';
    const pillRadius = '9999px';

    // 3. Spacing Scales
    const smPad = '8px 16px';
    const mdPad = '12px 24px';

    // 4. Button System Specification
    const buttons: ButtonSystemSpecification = {
      variants: {
        primary: {
          bg: primaryHex,
          text: '#ffffff',
          border: '1px solid transparent',
          hoverBg: primaryHex,
          hoverText: '#ffffff',
          activeScale: 'scale(0.98)',
          shadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          radius: baseRadius,
          padding: mdPad,
          fontWeight: '700',
        },
        secondary: {
          bg: surfaceHex,
          text: textHex,
          border: `1px solid ${borderHex}`,
          hoverBg: borderHex,
          hoverText: textHex,
          activeScale: 'scale(0.98)',
          radius: baseRadius,
          padding: mdPad,
          fontWeight: '600',
        },
        outline: {
          bg: 'transparent',
          text: primaryHex,
          border: `1px solid ${primaryHex}`,
          hoverBg: primaryHex,
          hoverText: '#ffffff',
          activeScale: 'scale(0.98)',
          radius: baseRadius,
          padding: mdPad,
          fontWeight: '600',
        },
        ghost: {
          bg: 'transparent',
          text: textHex,
          border: '1px solid transparent',
          hoverBg: 'rgba(255, 255, 255, 0.05)',
          hoverText: primaryHex,
          activeScale: 'scale(0.98)',
          radius: baseRadius,
          padding: smPad,
          fontWeight: '600',
        },
        destructive: {
          bg: '#ef4444',
          text: '#ffffff',
          border: '1px solid transparent',
          hoverBg: '#dc2626',
          hoverText: '#ffffff',
          activeScale: 'scale(0.98)',
          radius: baseRadius,
          padding: mdPad,
          fontWeight: '700',
        },
      },
      sizes: {
        sm: { height: '32px', padding: '6px 12px', fontSize: '12px', iconSize: '14px' },
        md: { height: '40px', padding: '10px 18px', fontSize: '14px', iconSize: '16px' },
        lg: { height: '48px', padding: '14px 26px', fontSize: '16px', iconSize: '20px' },
      },
      focusRing: {
        ringColor: primaryHex,
        ringOffset: '2px',
        ringWidth: '2px',
      },
    };

    // 5. Form & Input System Specification
    const forms: FormSystemSpecification = {
      input: {
        bg: surfaceHex,
        border: `1px solid ${borderHex}`,
        focusBorder: primaryHex,
        focusRing: `0 0 0 2px ${primaryHex}33`,
        radius: baseRadius,
        padding: '10px 14px',
        fontSize: '14px',
        placeholderColor: textMutedHex,
      },
      label: {
        fontSize: '13px',
        fontWeight: '600',
        color: textHex,
        marginBottom: '6px',
      },
      select: {
        bg: surfaceHex,
        border: `1px solid ${borderHex}`,
        radius: baseRadius,
        padding: '10px 14px',
      },
      checkbox: {
        size: '18px',
        radius: '4px',
        checkedBg: primaryHex,
        border: `1px solid ${borderHex}`,
      },
      validation: {
        errorBorder: '#ef4444',
        errorText: '#f87171',
        successBorder: '#10b981',
        successText: '#34d399',
      },
    };

    // 6. Card System Specification
    const cards: CardSystemSpecification = {
      variants: {
        elevated: {
          bg: surfaceHex,
          border: `1px solid ${borderHex}44`,
          shadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
          radius: cardRadius,
          padding: '24px',
        },
        outlined: {
          bg: bgHex,
          border: `1px solid ${borderHex}`,
          shadow: 'none',
          radius: cardRadius,
          padding: '24px',
        },
        flat: {
          bg: surfaceHex,
          border: 'none',
          shadow: 'none',
          radius: cardRadius,
          padding: '20px',
        },
        interactive: {
          bg: surfaceHex,
          border: `1px solid ${borderHex}`,
          shadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          hoverTransform: 'translateY(-4px)',
          hoverShadow: '0 12px 24px rgba(0, 0, 0, 0.3)',
          radius: cardRadius,
          padding: '24px',
        },
      },
      paddingScale: {
        sm: '16px',
        md: '24px',
        lg: '32px',
      },
    };

    // 7. Navigation System Specification
    const isStickyNav = elements.some(
      (e) => (e.tagName === 'NAV' || (e.className || '').includes('nav') || e.role === 'navigation') &&
      (e.position === 'sticky' || e.position === 'fixed' || (e.className || '').includes('sticky') || (e.className || '').includes('fixed'))
    );
    const navigation: NavigationSystemSpecification = {
      navbar: {
        bg: `${bgHex}ee`,
        backdropBlur: '12px',
        borderBottom: `1px solid ${borderHex}`,
        height: '64px',
        padding: '0 24px',
        isSticky: isStickyNav,
      },
      navLink: {
        color: textMutedHex,
        hoverColor: textHex,
        activeColor: primaryHex,
        activeIndicator: `2px solid ${primaryHex}`,
        fontSize: '14px',
        fontWeight: '600',
      },
      mobileMenu: {
        bg: bgHex,
        animation: 'slide-down 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        overlay: 'rgba(0, 0, 0, 0.6)',
      },
      dropdown: {
        bg: surfaceHex,
        border: `1px solid ${borderHex}`,
        shadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        radius: baseRadius,
        itemHoverBg: `${primaryHex}15`,
      },
    };

    // 8. Icon System Specification
    const icons: IconStyleSpecification = {
      strokeWidth: '1.75px',
      defaultSize: '20px',
      sizingScale: {
        sm: '16px',
        md: '20px',
        lg: '24px',
        xl: '32px',
      },
      primaryTint: textHex,
      secondaryTint: textMutedHex,
    };

    // 9. Badges, Modals, Tabs
    const badges = {
      primary: { bg: `${primaryHex}20`, text: primaryHex, border: `1px solid ${primaryHex}40`, radius: pillRadius, padding: '4px 10px', fontSize: '11px' },
      secondary: { bg: `${surfaceHex}`, text: textMutedHex, border: `1px solid ${borderHex}`, radius: pillRadius, padding: '4px 10px', fontSize: '11px' },
      success: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', radius: pillRadius, padding: '4px 10px', fontSize: '11px' },
      warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', radius: pillRadius, padding: '4px 10px', fontSize: '11px' },
      error: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', radius: pillRadius, padding: '4px 10px', fontSize: '11px' },
    };

    const modals = {
      overlayBg: 'rgba(0, 0, 0, 0.75)',
      contentBg: surfaceHex,
      radius: cardRadius,
      shadow: '0 20px 48px rgba(0, 0, 0, 0.5)',
      maxWidth: '560px',
      padding: '32px',
    };

    const tabs = {
      listBg: 'rgba(0, 0, 0, 0.2)',
      tabColor: textMutedHex,
      activeBg: surfaceHex,
      activeColor: textHex,
      indicatorStyle: `2px solid ${primaryHex}`,
      radius: baseRadius,
    };

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/component-styles-v1.json',
      version: '1.0.0',
      buttons,
      forms,
      cards,
      navigation,
      icons,
      badges,
      modals,
      tabs,
    };
  }
}
