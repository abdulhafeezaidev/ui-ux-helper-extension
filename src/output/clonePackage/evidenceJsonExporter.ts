import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildAgentDesignSpecification } from '../../agent-spec/index.ts';
import { validateFinalADSReconstruction } from '../../normalization/component/componentDetector.ts';
import { computeCloneConfidenceScore } from '../../normalization/fidelity/cloneConfidenceCalculator.ts';

export function exportEvidenceJson(data: AnalyzePageResponseData): string {
  const ads = buildAgentDesignSpecification(data);
  const validation = validateFinalADSReconstruction(ads);
  const cloneConfidence = computeCloneConfidenceScore(data);
  const elements = data.extractionResult?.elements || [];

  const elementSelectors = elements.slice(0, 100).map((el) => {
    let selector = el.tagName;
    if (el.className) {
      const firstClass = el.className.split(' ').find((c) => c.trim().length > 0);
      if (firstClass) selector += `.${firstClass}`;
    }
    return {
      elementId: el.id,
      selector,
      tagName: el.tagName,
      role: el.role,
      bounds: el.boundingRect,
      hasText: el.textMeta?.hasText ?? false,
      isVisible: el.isVisible,
    };
  });

  const payload = {
    $schema: 'https://ui-ux-helper.internal/schemas/evidence-v1.json',
    version: '1.0.0',
    cloneConfidence,
    reconstructionScore: cloneConfidence.overallScore,
    verdict: cloneConfidence.verdict,
    completenessVector: validation.completenessVector,
    confidenceHeatmap: validation.confidenceHeatmap,
    weakEvidence: validation.weakEvidence,
    unsafeInference: validation.unsafeInference,
    missingFields: validation.missingFields,
    elementSelectorsSample: elementSelectors,
    metadata: {
      generatedAt: new Date().toISOString(),
      targetUrl: data.pageUrl,
      targetTitle: data.title,
    },
  };

  return JSON.stringify(payload, null, 2);
}
