import {
  LayoutSectionNode,
  UIComponentCandidate,
  SemanticSection,
  SemanticSectionType,
  RawElementNode,
} from '../../types/schema.ts';

function collectDescendantIds(elementId: string, elementMap: Map<string, RawElementNode>, set: Set<string>) {
  const el = elementMap.get(elementId);
  if (!el) return;
  for (const childId of el.childIds) {
    if (!set.has(childId)) {
      set.add(childId);
      collectDescendantIds(childId, elementMap, set);
    }
  }
}

export function classifySemanticSections(
  layoutSections: LayoutSectionNode[],
  components: UIComponentCandidate[],
  rawElements: RawElementNode[]
): SemanticSection[] {
  const sections: SemanticSection[] = [];
  let sId = 1;

  const elementMap = new Map<string, RawElementNode>();
  rawElements.forEach((e) => elementMap.set(e.id, e));

  for (const sec of layoutSections) {
    const rawEl = elementMap.get(sec.elementId);
    if (!rawEl) continue;

    // Collect DOM descendants of sec.elementId
    const descendantIds = new Set<string>();
    collectDescendantIds(sec.elementId, elementMap, descendantIds);

    // Bind components by DOM tree hierarchy containment, fallback to spatial if height > 0
    const secComponents = components.filter((c) => {
      const isDOMChild = c.rootElementId === sec.elementId || descendantIds.has(c.rootElementId);
      if (isDOMChild) return true;
      if (sec.bounds.height > 0 && c.bounds.height > 0) {
        return (
          c.bounds.y >= sec.bounds.y &&
          c.bounds.y + c.bounds.height <= sec.bounds.y + sec.bounds.height
        );
      }
      return false;
    });

    let sectionType: SemanticSectionType = 'genericSection';
    let confidence = 0.5;
    const evidence: string[] = [];

    const tag = rawEl.tagName.toLowerCase();
    const className = (rawEl.className || '').toLowerCase();
    const childEls = rawEl.childIds.map((id) => elementMap.get(id)).filter(Boolean) as RawElementNode[];

    const hasHeading = childEls.some((e) => ['h1', 'h2', 'h3'].includes(e.tagName.toLowerCase()));
    const cardCount = secComponents.filter((c) => c.type === 'card').length;

    // Classification Rules based on explicit tags, classes, and component composition
    if (tag === 'nav' || tag === 'header' || className.includes('header') || className.includes('nav')) {
      sectionType = 'navigation';
      confidence = 0.95;
      evidence.push(`Explicit navigation region (<${tag}> class="${rawEl.className}")`);
    } else if (tag === 'footer' || className.includes('footer')) {
      sectionType = 'footer';
      confidence = 0.95;
      evidence.push(`Explicit footer region (<${tag}> class="${rawEl.className}")`);
    } else if (secComponents.some((c) => c.type === 'form') || childEls.some((e) => e.tagName.toLowerCase() === 'input')) {
      sectionType = 'formSection';
      confidence = 0.9;
      evidence.push('Contains form elements or interactive inputs');
    } else if (cardCount >= 2) {
      sectionType = 'featureSection';
      confidence = 0.85;
      evidence.push(`Contains ${cardCount} repeated card components (Product/Feature Grid)`);
    } else if (sec.bounds.y <= 300 && (hasHeading || className.includes('hero') || className.includes('banner')) && secComponents.some((c) => c.type === 'button')) {
      sectionType = 'hero';
      confidence = 0.85;
      evidence.push('Top-level visual hero region with heading and CTA button');
    } else if (hasHeading) {
      sectionType = 'contentSection';
      confidence = 0.70;
      evidence.push('Structured content section with heading element');
    } else if (className.includes('shopify-section') || className.includes('section')) {
      sectionType = 'genericSection';
      confidence = 0.60;
      evidence.push(`Structural page section wrapper class="${rawEl.className}"`);
    }

    sections.push({
      id: `sem_sec_${sId++}`,
      elementId: sec.elementId,
      sectionType,
      confidence,
      evidence,
      componentIds: secComponents.map((c) => c.id),
    });
  }

  return sections;
}

/**
 * Coalesces adjacent or fragmented micro-sections (common in CMS platforms like Shopify, WooCommerce)
 * into high-level macro visual regions.
 */
export function coalesceSemanticSections(sections: SemanticSection[]): SemanticSection[] {
  if (sections.length <= 12) return sections;

  const coalesced: SemanticSection[] = [];
  let sId = 1;

  for (const sec of sections) {
    const last = coalesced[coalesced.length - 1];
    // If adjacent section has identical purpose (e.g. multiple navigation or footer blocks)
    if (last && last.sectionType === sec.sectionType && ['navigation', 'footer', 'hero'].includes(sec.sectionType)) {
      last.componentIds = Array.from(new Set([...last.componentIds, ...sec.componentIds]));
      last.evidence = Array.from(new Set([...last.evidence, ...sec.evidence]));
      last.confidence = Math.max(last.confidence, sec.confidence);
    } else {
      coalesced.push({
        ...sec,
        id: `sem_sec_${sId++}`,
        componentIds: [...sec.componentIds],
        evidence: [...sec.evidence],
      });
    }
  }

  return coalesced;
}
