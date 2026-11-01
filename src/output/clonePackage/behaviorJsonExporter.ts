import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildInteractionGraphSystem } from '../../normalization/interaction/interactionGraphEngine.ts';
import { buildAnimationIntelligenceSystem } from '../../normalization/animation/animationIntelligenceEngine.ts';

export function exportBehaviorJson(data: AnalyzePageResponseData): string {
  const interactionGraph = buildInteractionGraphSystem(data);
  const animationSystem = buildAnimationIntelligenceSystem(data);
  const elements = data.extractionResult?.elements || [];

  // Filter elements that have interaction cues
  const interactiveNodes = elements.filter((e) =>
    e.interactive?.isClickable ||
    ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'].includes(e.tagName) ||
    Boolean(e.interactive?.href) ||
    Boolean(e.interactive?.ariaRole) ||
    Boolean(e.transitions) ||
    Boolean(e.animations)
  );

  const routes: { href: string; label: string; elementId: string }[] = [];
  const interactiveElements = interactiveNodes.map((el) => {
    if (el.interactive?.href && el.textMeta?.trimmedText) {
      routes.push({
        href: el.interactive.href,
        label: el.textMeta.trimmedText.substring(0, 50),
        elementId: el.id,
      });
    }

    return {
      elementId: el.id,
      tagName: el.tagName,
      role: el.interactive?.ariaRole || el.role || null,
      ariaLabel: el.interactive?.ariaLabel || null,
      ariaExpanded: el.interactive?.ariaExpanded ?? null,
      ariaControls: el.interactive?.ariaControls || null,
      isClickable: el.interactive?.isClickable ?? false,
      cursor: el.interactive?.cursor || 'auto',
      href: el.interactive?.href || null,
      tabIndex: el.interactive?.tabIndex ?? null,
      transitions: el.transitions ? {
        property: el.transitions.property,
        duration: el.transitions.duration,
        timingFunction: el.transitions.timingFunction,
      } : null,
    };
  });

  const payload = {
    $schema: 'https://ui-ux-helper.internal/schemas/behavior-v1.json',
    version: '2.0.0',
    summary: {
      totalInteractions: interactionGraph.totalInteractions,
      totalAnimations: animationSystem.totalAnimations,
      totalInteractiveElements: interactiveElements.length,
      interactionCategories: interactionGraph.summary,
      animationSummary: animationSystem.summary,
    },
    interactions: interactionGraph.interactions,
    animations: animationSystem.animations,
    keyframesCatalog: animationSystem.keyframesCatalog,
    interactiveElements,
    navigationRoutes: routes,
    scrollInteractions: interactionGraph.interactions.filter((i) => i.category === 'scroll' || i.category === 'sticky'),
    overlayBehaviors: interactionGraph.interactions.filter((i) => i.overlay && i.overlay.hasBackdrop),
    domMappingIntegrity: animationSystem.domMappingIntegrity,
    metadata: {
      generatedAt: new Date().toISOString(),
      pageTitle: data.title,
      pageUrl: data.pageUrl,
    },
  };

  return JSON.stringify(payload, null, 2);
}
