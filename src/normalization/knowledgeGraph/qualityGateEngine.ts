import {
  KnowledgeGraphQualityGateReport,
  QualityGateRuleResult,
  DesignKnowledgeGraphSpecification,
  ComponentRegistrySpecification,
  VariantGraphSpecification,
  TokenRegistrySpecification,
} from '../../types/index.ts';

/**
 * Knowledge Graph Quality Gate Engine.
 * Enforces 4 strict quality gates across the Design Knowledge Graph:
 * 1. Reject duplicate component definitions (NO_DUPLICATE_COMPONENTS)
 * 2. Reject duplicate token declarations (NO_DUPLICATE_TOKENS)
 * 3. Reject cyclic inheritance in variant DAGs (NO_CYCLIC_INHERITANCE)
 * 4. Reject orphan variants without parents (NO_ORPHAN_VARIANTS)
 */
export class QualityGateEngine {
  public validate(
    _dkg: DesignKnowledgeGraphSpecification,
    components: ComponentRegistrySpecification,
    variants: VariantGraphSpecification,
    tokens: TokenRegistrySpecification
  ): KnowledgeGraphQualityGateReport {
    const noDuplicateComponents = this.checkNoDuplicateComponents(components);
    const noDuplicateTokens = this.checkNoDuplicateTokens(tokens);
    const noCyclicInheritance = this.checkNoCyclicInheritance(variants);
    const noOrphanVariants = this.checkNoOrphanVariants(variants);

    const allPassed =
      noDuplicateComponents.passed &&
      noDuplicateTokens.passed &&
      noCyclicInheritance.passed &&
      noOrphanVariants.passed;

    return {
      status: allPassed ? 'PASSED' : 'FAILED',
      timestamp: new Date().toISOString(),
      rules: {
        noDuplicateComponents,
        noDuplicateTokens,
        noCyclicInheritance,
        noOrphanVariants,
      },
      allPassed,
    };
  }

  private checkNoDuplicateComponents(components: ComponentRegistrySpecification): QualityGateRuleResult {
    const seenCompIds = new Set<string>();
    const seenNames = new Set<string>();
    const violations: string[] = [];

    for (const comp of Object.values(components.components)) {
      if (seenCompIds.has(comp.componentId)) {
        violations.push(`Duplicate component ID detected: "${comp.componentId}"`);
      }
      seenCompIds.add(comp.componentId);

      if (seenNames.has(comp.name)) {
        violations.push(`Duplicate component definition detected for name: "${comp.name}" (ID: ${comp.componentId})`);
      }
      seenNames.add(comp.name);
    }

    const passed = violations.length === 0;
    return {
      rule: 'NO_DUPLICATE_COMPONENTS',
      passed,
      details: passed
        ? `100% unique component registry: all ${Object.keys(components.components).length} components have unique definitions.`
        : `Found ${violations.length} duplicate component violations.`,
      violations,
    };
  }

  private checkNoDuplicateTokens(tokens: TokenRegistrySpecification): QualityGateRuleResult {
    const seenTokenIds = new Set<string>();
    const seenCssVars = new Set<string>();
    const violations: string[] = [];

    for (const tok of Object.values(tokens.tokens)) {
      if (seenTokenIds.has(tok.tokenId)) {
        violations.push(`Duplicate token ID detected: "${tok.tokenId}"`);
      }
      seenTokenIds.add(tok.tokenId);

      if (seenCssVars.has(tok.cssVariable)) {
        violations.push(`Duplicate CSS variable mapping detected: "${tok.cssVariable}" in token "${tok.tokenId}"`);
      }
      seenCssVars.add(tok.cssVariable);
    }

    const passed = violations.length === 0;
    return {
      rule: 'NO_DUPLICATE_TOKENS',
      passed,
      details: passed
        ? `100% token deduplication: all ${Object.keys(tokens.tokens).length} tokens have unique canonical IDs and CSS variables.`
        : `Found ${violations.length} duplicate token declarations.`,
      violations,
    };
  }

  private checkNoCyclicInheritance(variants: VariantGraphSpecification): QualityGateRuleResult {
    const violations: string[] = [];

    for (const [treeName, tree] of Object.entries(variants.trees)) {
      for (const node of Object.values(tree.nodes)) {
        const visited = new Set<string>();
        let current: any = node;

        while (current) {
          if (visited.has(current.variantId)) {
            violations.push(`Cyclic inheritance cycle detected in tree "${treeName}" at variant "${current.variantId}"`);
            break;
          }
          visited.add(current.variantId);
          if (!current.parentVariantId) break;
          current = tree.nodes[current.parentVariantId];
        }
      }
    }

    const passed = violations.length === 0 && variants.metadata.isAcyclic;
    return {
      rule: 'NO_CYCLIC_INHERITANCE',
      passed,
      details: passed
        ? `100% acyclic DAG topology: validated ${variants.summary.totalVariants} variants across ${variants.summary.totalVariantTrees} inheritance trees.`
        : `Found cyclic inheritance in ${violations.length} variant chains.`,
      violations,
    };
  }

  private checkNoOrphanVariants(
    variants: VariantGraphSpecification
  ): QualityGateRuleResult {
    const violations: string[] = [];

    for (const tree of Object.values(variants.trees)) {
      for (const node of Object.values(tree.nodes)) {
        // Root node has null parent, which is valid.
        if (node.parentVariantId === null) {
          continue;
        }

        // Child node must point to existing variant in tree
        if (!tree.nodes[node.parentVariantId]) {
          violations.push(
            `Orphan variant detected: Variant "${node.variantId}" points to non-existent parent "${node.parentVariantId}".`
          );
        }
      }
    }

    const passed = violations.length === 0;
    return {
      rule: 'NO_ORPHAN_VARIANTS',
      passed,
      details: passed
        ? `100% connected variant hierarchy: all ${variants.summary.childVariantsCount} child variants resolve to verified parents.`
        : `Found ${violations.length} orphan variant references.`,
      violations,
    };
  }
}
