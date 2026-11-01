import { RawElementNode, ColorToken, SemanticColorRoles } from '../../types/schema.ts';
import { calculateContrastRatio } from './contrast.ts';

export function detectSemanticRoles(
  rawElements: RawElementNode[],
  tokens: ColorToken[]
): SemanticColorRoles {
  const roles: SemanticColorRoles = {};

  if (tokens.length === 0) return roles;

  // Filter out transparent tokens for background/surface/border roles
  const opaqueTokens = tokens.filter((t) => t.color.a > 0.05);

  // 1. Page Background Detection
  // Check background of root body/html or first large container
  const rootElement = rawElements.find(
    (e) => e.tagName === 'body' || e.tagName === 'html' || e.parentId === null
  );

  let pageBgToken: ColorToken | undefined;
  if (rootElement && rootElement.backgroundColor !== 'rgba(0, 0, 0, 0)') {
    pageBgToken = opaqueTokens.find(
      (t) => t.color.rgbString === rootElement.backgroundColor || t.color.hex === rootElement.backgroundColor
    );
  }

  if (!pageBgToken) {
    // Highest background frequency opaque token
    pageBgToken = [...opaqueTokens]
      .filter((t) => t.usageCount.background > 0)
      .sort((a, b) => b.usageCount.background - a.usageCount.background)[0];
  }

  if (pageBgToken) {
    roles.pageBackground = pageBgToken;
  }

  // 2. Surface Background Detection
  // Container background distinct from pageBackground
  if (pageBgToken) {
    const surfaceToken = [...opaqueTokens]
      .filter(
        (t) =>
          t.id !== pageBgToken?.id &&
          t.usageCount.background > 0 &&
          t.color.hex !== pageBgToken?.color.hex
      )
      .sort((a, b) => b.usageCount.background - a.usageCount.background)[0];

    if (surfaceToken) {
      roles.surfaceBackground = surfaceToken;
    }
  }

  // 3. Primary Text Detection
  // Text color with highest frequency across visible text elements
  const textTokens = [...opaqueTokens]
    .filter((t) => t.usageCount.text > 0)
    .sort((a, b) => b.usageCount.text - a.usageCount.text);

  if (textTokens.length > 0) {
    roles.primaryText = textTokens[0];
  }

  // 4. Secondary/Muted Text Detection
  if (textTokens.length > 1 && pageBgToken) {
    const primaryBgLuminance = pageBgToken.luminance;
    // Find text token with lower contrast against page background than primary text, or 2nd highest frequency
    const secondaryCandidate = textTokens.slice(1).find((t) => {
      const contrast = calculateContrastRatio(t.luminance, primaryBgLuminance);
      return contrast >= 3.0 && contrast < 12.0;
    }) || textTokens[1];

    if (secondaryCandidate && secondaryCandidate.id !== roles.primaryText?.id) {
      roles.secondaryText = secondaryCandidate;
    }
  }

  // 5. Border Color Detection
  const borderTokens = [...opaqueTokens]
    .filter((t) => t.usageCount.border > 0)
    .sort((a, b) => b.usageCount.border - a.usageCount.border);

  if (borderTokens.length > 0) {
    roles.border = borderTokens[0];
  }

  // 6. Interactive / CTA Color Detection
  // Background color of button / role="button" elements
  const ctaTokens = [...opaqueTokens]
    .filter((t) => t.usageCount.cta > 0)
    .sort((a, b) => b.usageCount.cta - a.usageCount.cta);

  if (ctaTokens.length > 0) {
    roles.interactiveCTA = ctaTokens[0];
  }

  // 7. Primary & Secondary Accent Detection
  // High saturation non-neutral colors (saturation >= 30%)
  const accentCandidates = [...opaqueTokens]
    .filter(
      (t) =>
        t.color.hsl.s >= 30 &&
        t.color.hex !== pageBgToken?.color.hex &&
        t.color.hex !== roles.primaryText?.color.hex
    )
    .sort((a, b) => b.frequency - a.frequency);

  if (accentCandidates.length > 0) {
    roles.primaryAccent = accentCandidates[0];
  }
  if (accentCandidates.length > 1 && accentCandidates[1].id !== roles.primaryAccent?.id) {
    roles.secondaryAccent = accentCandidates[1];
  }

  return roles;
}
