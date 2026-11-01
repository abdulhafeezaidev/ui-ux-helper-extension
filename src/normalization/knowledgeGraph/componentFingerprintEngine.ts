import { RawElementNode } from '../../types/index.ts';

export interface ComponentFingerprint {
  hash: string;
  category: string;
  structureSignature: string;
  semanticRole: string;
  visualSignature: string;
  interactionSignature: string;
}

/**
 * Component Fingerprint Engine.
 * Generates deterministic hashes and structural signatures combining:
 * 1. DOM structure (tag tree, child count, slot structure)
 * 2. Semantic role (button, card, input, heading, nav, badge, modal, etc.)
 * 3. Typography (font-family, size, weight, line-height)
 * 4. Spacing (padding, gap, margin)
 * 5. Border radius (curvature bucket)
 * 6. Shadows (elevation bucket)
 * 7. Interaction pattern (hover, focus, transitions)
 */
export class ComponentFingerprintEngine {
  /**
   * Generates a deterministic fingerprint for an element node.
   */
  public generateFingerprint(el: RawElementNode, allElements: RawElementNode[] = []): ComponentFingerprint {
    const semanticRole = this.inferSemanticRole(el);
    const structureSignature = this.computeStructureSignature(el, allElements);
    const visualSignature = this.computeVisualSignature(el);
    const interactionSignature = this.computeInteractionSignature(el);

    const compositeString = `${semanticRole}::${structureSignature}::${visualSignature}::${interactionSignature}`;
    const hash = this.simpleHash(compositeString);

    return {
      hash,
      category: semanticRole,
      structureSignature,
      semanticRole,
      visualSignature,
      interactionSignature,
    };
  }

  /**
   * Infers the semantic role of the element.
   */
  public inferSemanticRole(el: RawElementNode): string {
    const tag = (el.tagName || '').toUpperCase();
    const role = (el.role || '').toLowerCase();
    const className = (el.className || '').toLowerCase();

    if (role === 'button' || tag === 'BUTTON' || (tag === 'A' && (className.includes('btn') || className.includes('button')))) {
      return 'button';
    }
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || role === 'textbox' || role === 'combobox') {
      return 'form_input';
    }
    if (className.includes('card') || className.includes('product') || className.includes('item') || className.includes('tile')) {
      return 'card';
    }
    if (tag === 'NAV' || role === 'navigation' || className.includes('nav') || className.includes('header') || className.includes('navbar')) {
      return 'navigation';
    }
    if (className.includes('badge') || className.includes('tag') || className.includes('chip') || role === 'status') {
      return 'badge';
    }
    if (role === 'dialog' || className.includes('modal') || className.includes('dialog')) {
      return 'modal';
    }
    if (/^H[1-6]$/.test(tag) || role === 'heading') {
      return `heading_${tag.toLowerCase()}`;
    }
    if (tag === 'IMG' || tag === 'SVG' || tag === 'PICTURE' || role === 'img') {
      return 'media';
    }
    if (tag === 'P' || tag === 'SPAN' || tag === 'LABEL') {
      return 'text_primitive';
    }
    return 'container';
  }

  /**
   * Computes the hierarchical structural signature of the element and its direct children.
   */
  private computeStructureSignature(el: RawElementNode, allElements: RawElementNode[]): string {
    const tag = el.tagName || 'DIV';
    const childIds = el.childIds || [];
    const children = allElements.filter((child) => childIds.includes(child.id));

    if (children.length === 0) {
      return tag;
    }

    const childTags = children.map((c) => c.tagName || 'DIV').join('+');
    return `${tag}>[${childTags}]`;
  }

  /**
   * Computes the visual styling signature (typography, padding, radius, shadows).
   */
  private computeVisualSignature(el: RawElementNode): string {
    const fontSize = el.typography?.fontSize ? `${Math.round(parseFloat(el.typography.fontSize) || 14)}px` : '14px';
    const fontWeight = el.typography?.fontWeight ? `${el.typography.fontWeight}` : '400';
    const radius = el.borderRadius?.topLeft ? `${Math.round(parseFloat(el.borderRadius.topLeft) || 0)}px` : '0px';
    const hasShadow = Boolean(el.boxShadow && el.boxShadow !== 'none');
    const padding = el.padding
      ? `${Math.round(parseFloat(el.padding.top) || 0)}px_${Math.round(parseFloat(el.padding.right) || 0)}px`
      : '0px_0px';

    return `f:${fontSize}_w:${fontWeight}_r:${radius}_s:${hasShadow ? 1 : 0}_p:${padding}`;
  }

  /**
   * Computes the interactive signature (transitions, cursor, positioning).
   */
  private computeInteractionSignature(el: RawElementNode): string {
    const isInteractive = Boolean(
      el.interactive?.isClickable ||
      el.interactive?.cursor === 'pointer' ||
      (el.tagName === 'BUTTON' || el.tagName === 'A')
    );
    const hasTransitions = Boolean(el.transitions && el.transitions.property && el.transitions.property !== 'none');
    const display = el.display || 'block';

    return `i:${isInteractive ? 1 : 0}_t:${hasTransitions ? 1 : 0}_d:${display}`;
  }

  /**
   * Deterministic 8-character hex hash function.
   */
  private simpleHash(str: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }
}
