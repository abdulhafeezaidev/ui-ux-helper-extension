import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildMotionTimelineSpecification } from '../../normalization/animation/motionTimelineEngine.ts';

/**
 * Serializes the complete motion timeline specification
 * into the canonical 16_motion.json format.
 */
export function exportMotionJson(data: AnalyzePageResponseData): string {
  const spec = buildMotionTimelineSpecification(data);
  return JSON.stringify(spec, null, 2);
}
