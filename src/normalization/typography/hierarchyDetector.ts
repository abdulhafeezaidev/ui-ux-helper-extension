import { RawElementNode, TypographyToken, TypographyHierarchy } from '../../types/schema.ts';

export function detectTypographyHierarchy(
  rawElements: RawElementNode[],
  tokens: TypographyToken[]
): TypographyHierarchy {
  const hierarchy: TypographyHierarchy = {};

  if (tokens.length === 0) return hierarchy;

  const findTokenForElement = (el: RawElementNode): TypographyToken | undefined => {
    if (!el.typography) return undefined;
    const sizePx = parseFloat(el.typography.fontSize);
    return tokens.find(
      (t) => Math.abs(t.fontSizePx - sizePx) <= 1.0 && (t.semanticRole || t.frequency > 0)
    );
  };

  // 1. Explicit Heading Tag Hierarchy (h1 - h6)
  const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
  for (const tag of headingTags) {
    const headingEl = rawElements.find((e) => e.tagName === tag && e.isVisible);
    if (headingEl) {
      const token = findTokenForElement(headingEl);
      if (token) {
        hierarchy[tag] = { ...token, semanticRole: tag };
      }
    }
  }

  // 2. Hero Display Detection (fontSizePx >= 32 or largest h1)
  if (hierarchy.h1 && hierarchy.h1.fontSizePx >= 32) {
    hierarchy.heroDisplay = { ...hierarchy.h1, semanticRole: 'heroDisplay' };
  } else {
    const largeDisplayToken = [...tokens]
      .filter((t) => t.fontSizePx >= 32)
      .sort((a, b) => b.fontSizePx - a.fontSizePx)[0];
    if (largeDisplayToken) {
      hierarchy.heroDisplay = { ...largeDisplayToken, semanticRole: 'heroDisplay' };
    }
  }

  // 3. Button / Interactive Text Detection
  const buttonEl = rawElements.find(
    (e) => (e.tagName === 'button' || e.role === 'button' || e.tagName === 'a') && e.textMeta.hasText && e.isVisible
  );
  if (buttonEl) {
    const btnToken = findTokenForElement(buttonEl);
    if (btnToken) {
      hierarchy.buttonText = { ...btnToken, semanticRole: 'buttonText' };
    }
  }

  // 4. Body Text Detection (dominant non-heading text size 14px-18px)
  const nonHeadingTextTokens = [...tokens]
    .filter((t) => t.fontSizePx >= 13 && t.fontSizePx <= 18)
    .sort((a, b) => b.frequency - a.frequency);

  if (nonHeadingTextTokens.length > 0) {
    hierarchy.body = { ...nonHeadingTextTokens[0], semanticRole: 'body' };
  }

  if (nonHeadingTextTokens.length > 1) {
    hierarchy.secondaryBody = { ...nonHeadingTextTokens[1], semanticRole: 'secondaryBody' };
  }

  // 5. Caption / Small Supporting Text Detection (fontSizePx <= 12px)
  const captionToken = [...tokens]
    .filter((t) => t.fontSizePx <= 12)
    .sort((a, b) => b.frequency - a.frequency)[0];

  if (captionToken) {
    hierarchy.caption = { ...captionToken, semanticRole: 'caption' };
  }

  return hierarchy;
}
