import {
  AnalyzePageResponseData,
  IntentMapSpecification,
  IntentMappingEntry,
  RawElementNode,
  ComponentRegistrySpecification,
  VariantGraphSpecification,
  IntentTokenReductionReport,
} from '../../types/index.ts';
import { IntentInferenceEngine } from './intentInferenceEngine.ts';
import { CanonicalComponentRegistryEngine } from '../knowledgeGraph/canonicalComponentRegistryEngine.ts';

export class IntentMapEngine {
  private inferenceEngine = new IntentInferenceEngine();
  private componentRegistryEngine = new CanonicalComponentRegistryEngine();

  public normalize(
    data: AnalyzePageResponseData,
    componentRegistry?: ComponentRegistrySpecification,
    _variantGraph?: VariantGraphSpecification
  ): IntentMapSpecification {
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';
    const rawElements: RawElementNode[] = data.extractionResult?.elements || [];

    const compReg = componentRegistry || this.componentRegistryEngine.normalize(data);
    const mappings: Record<string, IntentMappingEntry> = {};

    let totalIntentLinks = 0;
    let rawCssTotalTokens = 0;
    let intentTotalTokens = 0;

    // 1. Map Canonical Components
    for (const [compId, comp] of Object.entries(compReg.components)) {
      const appliedIntents = this.inferenceEngine.inferComponentIntents(comp, rawElements);
      const repEl = rawElements.find((e) => comp.instanceElementIds.includes(e.id)) || ({} as RawElementNode);
      const rawCssBlock = this.inferenceEngine.extractRawCssBlock(repEl);

      const intentSummary =
        appliedIntents.length > 0
          ? appliedIntents.map((i) => i.name).join(' + ')
          : 'Generic Primitive Container';

      // Estimate LLM tokens: ~4 chars per token
      const rawJsonStr = JSON.stringify(rawCssBlock, null, 2);
      const intentJsonStr = JSON.stringify(appliedIntents.map((i) => i.intentId));
      const rawTokens = Math.max(12, Math.ceil(rawJsonStr.length / 4));
      const intentTokens = Math.max(4, Math.ceil(intentJsonStr.length / 4));
      const reductionPercent = parseFloat((((rawTokens - intentTokens) / rawTokens) * 100).toFixed(1));

      mappings[compId] = {
        entityId: compId,
        entityType: 'component',
        entityName: comp.name,
        appliedIntents,
        rawCssBlock,
        semanticIntentSummary: intentSummary,
        tokenSavings: {
          rawCssEstimatedTokens: rawTokens,
          intentEstimatedTokens: intentTokens,
          reductionPercent: Math.max(0, reductionPercent),
        },
      };

      totalIntentLinks += appliedIntents.length;
      rawCssTotalTokens += rawTokens;
      intentTotalTokens += intentTokens;
    }

    // 2. Map Key Elements (Headings, Grids, Sections, Hero)
    const significantElements = rawElements.filter(
      (el) =>
        el.tagName === 'H1' ||
        el.tagName === 'H2' ||
        el.tagName === 'SECTION' ||
        (el.display || '').includes('grid') ||
        (el.className || '').toLowerCase().includes('hero') ||
        (el.className || '').toLowerCase().includes('grid')
    );

    for (const el of significantElements) {
      const entityId = `el_${el.id}`;
      const appliedIntents = this.inferenceEngine.inferElementIntents(el);
      if (appliedIntents.length === 0) continue;

      const rawCssBlock = this.inferenceEngine.extractRawCssBlock(el);
      const intentSummary = appliedIntents.map((i) => i.name).join(' + ');

      const rawJsonStr = JSON.stringify(rawCssBlock, null, 2);
      const intentJsonStr = JSON.stringify(appliedIntents.map((i) => i.intentId));
      const rawTokens = Math.max(12, Math.ceil(rawJsonStr.length / 4));
      const intentTokens = Math.max(4, Math.ceil(intentJsonStr.length / 4));
      const reductionPercent = parseFloat((((rawTokens - intentTokens) / rawTokens) * 100).toFixed(1));

      mappings[entityId] = {
        entityId,
        entityType: 'element',
        entityName: el.tagName || 'DIV',
        appliedIntents,
        rawCssBlock,
        semanticIntentSummary: intentSummary,
        tokenSavings: {
          rawCssEstimatedTokens: rawTokens,
          intentEstimatedTokens: intentTokens,
          reductionPercent: Math.max(0, reductionPercent),
        },
      };

      totalIntentLinks += appliedIntents.length;
      rawCssTotalTokens += rawTokens;
      intentTotalTokens += intentTokens;
    }

    const totalEntitiesMapped = Object.keys(mappings).length;
    const componentsMapped = Object.values(mappings).filter((m) => m.entityType === 'component').length;
    const variantsMapped = Object.values(mappings).filter((m) => m.entityType === 'variant').length;
    const elementsMapped = Object.values(mappings).filter((m) => m.entityType === 'element').length;

    const overallTokenReductionPercent =
      rawCssTotalTokens > 0
        ? parseFloat((((rawCssTotalTokens - intentTotalTokens) / rawCssTotalTokens) * 100).toFixed(1))
        : 0;

    return {
      $schema: 'https://ui-ux-helper.internal/schemas/intent-map-v2.json',
      version: '2.0.0',
      target: { title, url },
      summary: {
        totalEntitiesMapped,
        componentsMapped,
        variantsMapped,
        elementsMapped,
        totalIntentLinks,
        rawCssTotalTokens,
        intentTotalTokens,
        overallTokenReductionPercent,
      },
      mappings,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Generates a detailed token reduction metric report.
   */
  public generateTokenReductionReport(intentMap: IntentMapSpecification): IntentTokenReductionReport {
    const rawTokens = intentMap.summary.rawCssTotalTokens;
    const intentTokens = intentMap.summary.intentTotalTokens;
    const count = intentMap.summary.totalEntitiesMapped || 1;

    return {
      rawCssTotalEstimatedTokens: rawTokens,
      intentTotalEstimatedTokens: intentTokens,
      tokenReductionPercent: intentMap.summary.overallTokenReductionPercent,
      savedTokens: Math.max(0, rawTokens - intentTokens),
      averageTokensPerEntityRaw: parseFloat((rawTokens / count).toFixed(1)),
      averageTokensPerEntityIntent: parseFloat((intentTokens / count).toFixed(1)),
    };
  }
}
