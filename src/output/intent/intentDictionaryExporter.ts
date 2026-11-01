import { AnalyzePageResponseData, IntentDictionarySpecification } from '../../types/index.ts';
import { IntentDictionaryEngine } from '../../normalization/intent/intentDictionaryEngine.ts';

/**
 * Exporter for IntentDictionary.json
 * Canonical catalog of deduplicated design intents across layout, typography, shape, spacing, motion, etc.
 */
export function exportIntentDictionaryJson(data: AnalyzePageResponseData): string {
  const engine = new IntentDictionaryEngine();
  const spec: IntentDictionarySpecification = engine.normalize(data);
  return JSON.stringify(spec, null, 2);
}

export function exportIntentDictionaryObject(data: AnalyzePageResponseData): IntentDictionarySpecification {
  const engine = new IntentDictionaryEngine();
  return engine.normalize(data);
}
