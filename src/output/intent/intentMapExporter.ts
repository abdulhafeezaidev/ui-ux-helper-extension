import { AnalyzePageResponseData, IntentMapSpecification } from '../../types/index.ts';
import { IntentMapEngine } from '../../normalization/intent/intentMapEngine.ts';

/**
 * Exporter for IntentMap.json
 * Maps components, variants, and elements to their semantic UX/UI intents,
 * containing both raw CSS blocks and high-level intent explanations.
 */
export function exportIntentMapJson(data: AnalyzePageResponseData): string {
  const engine = new IntentMapEngine();
  const spec: IntentMapSpecification = engine.normalize(data);
  return JSON.stringify(spec, null, 2);
}

export function exportIntentMapObject(data: AnalyzePageResponseData): IntentMapSpecification {
  const engine = new IntentMapEngine();
  return engine.normalize(data);
}
