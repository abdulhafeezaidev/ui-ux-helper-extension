import {
  RawElementNode,
  AppliedIntent,
  CanonicalComponentDefinition,
} from '../../types/index.ts';
import { INTENT_RULE_CATALOG, IntentRule } from './intentRuleCatalog.ts';

export class IntentInferenceEngine {
  private rules: IntentRule[] = INTENT_RULE_CATALOG;

  /**
   * Infers all matching intents for a raw element node.
   */
  public inferElementIntents(el: RawElementNode): AppliedIntent[] {
    const applied: AppliedIntent[] = [];

    for (const rule of this.rules) {
      const match = rule.matchElement(el);
      if (match.matches && match.confidence >= 0.75) {
        applied.push({
          intentId: rule.intentId,
          name: rule.name,
          domain: rule.domain,
          confidence: match.confidence,
          matchedProperties: match.matchedProps,
          inferredPurpose: rule.rationale,
        });
      }
    }

    return applied;
  }

  /**
   * Infers all matching intents for a canonical component definition.
   */
  public inferComponentIntents(comp: CanonicalComponentDefinition, rawElements: RawElementNode[]): AppliedIntent[] {
    const appliedMap = new Map<string, AppliedIntent>();

    // 1. Check representative elements for this component
    const instances = rawElements.filter((el) => comp.instanceElementIds.includes(el.id));
    const targetElements = instances.length > 0 ? instances.slice(0, 3) : [];

    for (const el of targetElements) {
      const elementIntents = this.inferElementIntents(el);
      for (const intent of elementIntents) {
        if (!appliedMap.has(intent.intentId) || appliedMap.get(intent.intentId)!.confidence < intent.confidence) {
          appliedMap.set(intent.intentId, intent);
        }
      }
    }

    // 2. Category-level baseline intent mapping
    if (comp.category === 'button') {
      if (!appliedMap.has('intent_spacing_touch_target_action')) {
        const rule = this.rules.find((r) => r.intentId === 'intent_spacing_touch_target_action');
        if (rule) {
          appliedMap.set(rule.intentId, {
            intentId: rule.intentId,
            name: rule.name,
            domain: rule.domain,
            confidence: 0.9,
            matchedProperties: { category: 'button' },
            inferredPurpose: rule.rationale,
          });
        }
      }
    } else if (comp.category === 'card') {
      if (!appliedMap.has('intent_shape_rounded_card')) {
        const rule = this.rules.find((r) => r.intentId === 'intent_shape_rounded_card');
        if (rule) {
          appliedMap.set(rule.intentId, {
            intentId: rule.intentId,
            name: rule.name,
            domain: rule.domain,
            confidence: 0.9,
            matchedProperties: { category: 'card' },
            inferredPurpose: rule.rationale,
          });
        }
      }
    }

    return Array.from(appliedMap.values());
  }

  /**
   * Extracts clean raw CSS block for an element.
   */
  public extractRawCssBlock(el: RawElementNode): Record<string, any> {
    const block: Record<string, any> = {};

    if (el.display) block['display'] = el.display;
    if (el.backgroundColor && el.backgroundColor !== 'transparent') block['background-color'] = el.backgroundColor;
    if (el.color) block['color'] = el.color;
    if (el.borderRadius?.topLeft) block['border-radius'] = el.borderRadius.topLeft;
    if (el.padding?.top) {
      block['padding'] = `${el.padding.top} ${el.padding.right} ${el.padding.bottom} ${el.padding.left}`;
    }
    if (el.typography?.fontSize) block['font-size'] = el.typography.fontSize;
    if (el.typography?.fontWeight) block['font-weight'] = el.typography.fontWeight;
    if (el.typography?.fontFamily) block['font-family'] = el.typography.fontFamily;
    if (el.typography?.lineHeight) block['line-height'] = el.typography.lineHeight;
    if (el.boxShadow && el.boxShadow !== 'none') block['box-shadow'] = el.boxShadow;

    return block;
  }
}
