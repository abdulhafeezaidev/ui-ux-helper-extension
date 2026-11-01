import {
  AnalyzePageResponseData,
  ComponentRegistrySpecification,
  CanonicalComponentDefinition,
  RawElementNode,
  TokenRegistrySpecification,
  VariantGraphSpecification,
} from '../../types/index.ts';
import { ComponentFingerprintEngine } from './componentFingerprintEngine.ts';

/**
 * Canonical Component Registry Engine.
 * Ensures every component exists exactly once in the registry.
 * All instances on the page reference their canonical parent component.
 * Eliminates duplicate component definitions across the entire dataset.
 */
export class CanonicalComponentRegistryEngine {
  private fingerprintEngine = new ComponentFingerprintEngine();

  public normalize(
    data: AnalyzePageResponseData,
    _tokenRegistry?: TokenRegistrySpecification,
    variantGraph?: VariantGraphSpecification
  ): ComponentRegistrySpecification {
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';
    const rawElements: RawElementNode[] = data.extractionResult?.elements || [];

    const components: Record<string, CanonicalComponentDefinition> = {};
    const seenFingerprints = new Map<string, string>(); // fingerprint -> componentId
    const seenNames = new Set<string>();

    // 1. Group raw elements by category & fingerprint
    const elementsByRole: Record<string, RawElementNode[]> = {};
    for (const el of rawElements) {
      const role = this.fingerprintEngine.inferSemanticRole(el);
      if (!elementsByRole[role]) {
        elementsByRole[role] = [];
      }
      elementsByRole[role].push(el);
    }

    // 2. Register canonical components
    for (const [role, elements] of Object.entries(elementsByRole)) {
      const representative = elements[0];
      const fp = this.fingerprintEngine.generateFingerprint(representative, rawElements);
      const componentId = `comp_${role}_${fp.hash.slice(0, 4)}`;

      // Check for duplicate fingerprint guard
      if (seenFingerprints.has(fp.hash)) {
        const existingCompId = seenFingerprints.get(fp.hash)!;
        components[existingCompId].instanceElementIds.push(...elements.map((e) => e.id));
        continue;
      }
      seenFingerprints.set(fp.hash, componentId);

      let compName = this.formatComponentName(role);
      if (seenNames.has(compName)) {
        compName = `${compName}${fp.hash.slice(0, 4)}`;
      }
      seenNames.add(compName);

      // Build props schema
      const propsSchema = this.inferPropsSchema(role);

      // Default Token References
      const defaultTokens = this.inferDefaultTokens(role);

      // Extract variant mapping from VariantGraph if available
      const variantsMap: Record<
        string,
        {
          variantId: string;
          name: string;
          parentVariantId?: string;
          overriddenTokens: Record<string, string>;
          overriddenProperties: Record<string, any>;
          instanceCount: number;
        }
      > = {};

      if (variantGraph && variantGraph.trees[`comp_${role}`]) {
        const tree = variantGraph.trees[`comp_${role}`];
        for (const [varId, vNode] of Object.entries(tree.nodes)) {
          variantsMap[varId] = {
            variantId: varId,
            name: vNode.name,
            parentVariantId: vNode.parentVariantId || undefined,
            overriddenTokens: vNode.overriddenTokens,
            overriddenProperties: vNode.overriddenProperties,
            instanceCount: vNode.instanceCount,
          };
        }
      } else {
        variantsMap[`var_${role}_default`] = {
          variantId: `var_${role}_default`,
          name: 'Default',
          overriddenTokens: {},
          overriddenProperties: {},
          instanceCount: elements.length,
        };
      }

      components[componentId] = {
        componentId,
        name: compName,
        category: role,
        fingerprint: fp.hash,
        rootTagName: representative.tagName || 'DIV',
        slots: this.inferSlots(role),
        propsSchema,
        defaultTokens,
        variants: variantsMap,
        instanceElementIds: elements.map((e) => e.id),
        layoutContainerRef: `layout_${role}_container`,
      };
    }

    // 3. Guarantee core baseline components (Button, Card, FormInput) if missing
    const requiredBaselines = [
      { role: 'button', name: 'Button' },
      { role: 'card', name: 'Card' },
      { role: 'form_input', name: 'FormInput' },
    ];
    for (const base of requiredBaselines) {
      const existing = Object.values(components).find((c) => c.category === base.role);
      if (!existing && !seenNames.has(base.name)) {
        const componentId = `comp_${base.role}_base`;
        seenNames.add(base.name);
        components[componentId] = {
          componentId,
          name: base.name,
          category: base.role,
          fingerprint: `fp_${base.role}_base`,
          rootTagName: base.role === 'button' ? 'BUTTON' : base.role === 'form_input' ? 'INPUT' : 'DIV',
          slots: ['default', 'icon'],
          propsSchema: this.inferPropsSchema(base.role),
          defaultTokens: this.inferDefaultTokens(base.role),
          variants: {
            [`var_${base.role}_primary`]: {
              variantId: `var_${base.role}_primary`,
              name: 'Primary',
              overriddenTokens: { colorToken: 'token_color_primary' },
              overriddenProperties: { backgroundColor: '#c45536' },
              instanceCount: 1,
            },
          },
          instanceElementIds: [`inst_${base.role}_sample`],
          layoutContainerRef: `layout_${base.role}_container`,
        };
      }
    }

    // Calculate Summary
    const totalComponents = Object.keys(components).length;
    let totalVariants = 0;
    let totalInstances = 0;

    for (const comp of Object.values(components)) {
      totalVariants += Object.keys(comp.variants).length;
      totalInstances += comp.instanceElementIds.length;
    }

    const averageInstancesPerComponent =
      totalComponents > 0 ? parseFloat((totalInstances / totalComponents).toFixed(2)) : 1.0;

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/component-registry-v2.json',
      version: '2.0.0',
      target: { title, url },
      summary: {
        totalComponents,
        totalVariants,
        totalInstances,
        averageInstancesPerComponent,
      },
      components,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private inferPropsSchema(role: string): { name: string; type: string; defaultToken?: string; required?: boolean }[] {
    const props: { name: string; type: string; defaultToken?: string; required?: boolean }[] = [
      { name: 'className', type: 'string', required: false },
      { name: 'children', type: 'ReactNode', required: false },
    ];

    if (role === 'button') {
      props.push(
        { name: 'intent', type: "'primary' | 'secondary' | 'ghost'", defaultToken: 'primary', required: false },
        { name: 'size', type: "'sm' | 'md' | 'lg'", defaultToken: 'md', required: false },
        { name: 'disabled', type: 'boolean', required: false },
        { name: 'onClick', type: '() => void', required: false }
      );
    } else if (role === 'card') {
      props.push(
        { name: 'variant', type: "'elevated' | 'outlined' | 'flat'", defaultToken: 'elevated', required: false },
        { name: 'padding', type: "'sm' | 'md' | 'lg'", defaultToken: 'md', required: false }
      );
    } else if (role === 'form_input') {
      props.push(
        { name: 'value', type: 'string', required: false },
        { name: 'placeholder', type: 'string', required: false },
        { name: 'disabled', type: 'boolean', required: false },
        { name: 'error', type: 'boolean', required: false }
      );
    }
    return props;
  }

  private inferDefaultTokens(role: string): Record<string, string> {
    if (role === 'button') {
      return {
        typographyToken: 'token_typography_font_button',
        spacingToken: 'token_spacing_button_padding',
        radiusToken: 'token_radius_sm',
        colorToken: 'token_color_primary',
      };
    }
    if (role === 'card') {
      return {
        typographyToken: 'token_typography_font_body',
        spacingToken: 'token_spacing_card_padding',
        radiusToken: 'token_radius_lg',
        shadowToken: 'token_shadow_card',
        colorToken: 'token_color_surface',
      };
    }
    return {
      typographyToken: 'token_typography_font_body',
      colorToken: 'token_color_surface',
      borderColorToken: 'token_color_border',
    };
  }

  private inferSlots(role: string): string[] {
    if (role === 'button') return ['leadingIcon', 'default', 'trailingIcon'];
    if (role === 'card') return ['header', 'media', 'body', 'footer', 'actions'];
    if (role === 'navigation') return ['brand', 'links', 'actions', 'mobileDrawer'];
    if (role === 'modal') return ['title', 'body', 'footer', 'closeButton'];
    return ['default'];
  }

  private formatComponentName(role: string): string {
    return role
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
  }
}
