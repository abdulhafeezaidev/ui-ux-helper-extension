import {
  RawElementNode,
  LayoutContainerToken,
  LayoutSectionNode,
} from '../../types/schema.ts';

export function detectContainersAndSections(
  elements: RawElementNode[],
  viewportWidth: number = 1024
): { containers: LayoutContainerToken[]; sections: LayoutSectionNode[] } {
  const containers: LayoutContainerToken[] = [];
  const sections: LayoutSectionNode[] = [];

  const visibleElements = elements.filter((e) => e.isVisible);

  let cId = 1;
  let sId = 1;

  for (const el of visibleElements) {
    const tag = el.tagName.toLowerCase();
    // Exclude global document root wrappers (body, html) from section candidates
    if (tag === 'body' || tag === 'html') continue;

    const rect = el.boundingRect;
    const isSectionTag = ['section', 'header', 'main', 'footer', 'article', 'nav'].includes(tag);
    const isFullWidth = (rect.width > 0 && rect.width >= viewportWidth * 0.8) || isSectionTag;
    const isCenteredContainer =
      rect.width > 0 &&
      rect.width < viewportWidth &&
      Math.abs(rect.x - (viewportWidth - rect.width) / 2) <= 15;

    const className = (el.className || '').toLowerCase();
    const hasSectionClass =
      className.includes('shopify-section') ||
      className.includes('site-section') ||
      className.includes('section') ||
      className.includes('header') ||
      className.includes('footer') ||
      className.includes('hero') ||
      className.includes('banner');

    const isContainerTag = ['div', 'main', 'section', 'article', 'header', 'footer', 'nav', 'form'].includes(tag);
    const hasChildren = el.childIds.length > 0;

    if (isContainerTag && (hasChildren || isCenteredContainer || isFullWidth)) {
      containers.push({
        id: `container_${cId++}`,
        elementId: el.id,
        display: el.display,
        isFullWidth,
        isCenteredContainer,
        maxWidth: el.layoutProps.overflow ? `${rect.width}px` : 'none',
        childCount: el.childIds.length,
      });
    }

    // PUSH to sections if explicit semantic tag OR semantic section class OR large container with children
    if (isSectionTag || hasSectionClass || (isFullWidth && rect.height >= 100 && hasChildren)) {
      sections.push({
        id: `section_${sId++}`,
        elementId: el.id,
        bounds: { ...rect },
        isFullWidth,
        childCount: el.childIds.length,
      });
    }
  }

  return { containers, sections };
}
