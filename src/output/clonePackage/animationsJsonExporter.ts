import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildAnimationIntelligenceSystem } from '../../normalization/animation/animationIntelligenceEngine.ts';

export function exportAnimationsJson(data: AnalyzePageResponseData): string {
  const animSystem = buildAnimationIntelligenceSystem(data);
  const elements = data.extractionResult?.elements || [];

  const observedTransitions: {
    elementId: string;
    property: string;
    duration: string;
    timingFunction: string;
    delay: string;
    rawString: string;
  }[] = [];

  const observedAnimations: {
    elementId: string;
    name: string;
    duration: string;
    timingFunction: string;
    delay: string;
    iterationCount: string;
    direction: string;
    rawString: string;
  }[] = [];

  for (const el of elements) {
    if (el.transitions) {
      observedTransitions.push({
        elementId: el.id,
        ...el.transitions,
      });
    }
    if (el.animations) {
      observedAnimations.push({
        elementId: el.id,
        ...el.animations,
      });
    }
  }

  // Standard animation motion presets inferred from UI context
  const motionPresets = [
    {
      registryKey: 'animation.scaleHover',
      name: 'card-hover-lift',
      target: 'card, product-card',
      properties: ['transform', 'box-shadow'],
      duration: '200ms',
      timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'translateY(-4px)',
    },
    {
      registryKey: 'animation.buttonPress',
      name: 'button-press',
      target: 'button, .btn',
      properties: ['transform', 'opacity'],
      duration: '100ms',
      timingFunction: 'ease-in-out',
      transform: 'scale(0.98)',
    },
    {
      registryKey: 'animation.fadeIn',
      name: 'fade-in-dialog',
      target: '[role="dialog"], .modal',
      properties: ['opacity', 'transform'],
      duration: '250ms',
      timingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      transform: 'scale(1)',
    },
    {
      registryKey: 'animation.drawerOpen',
      name: 'drawer-slide-in',
      target: '.mobile-drawer, [data-drawer]',
      properties: ['transform'],
      duration: '300ms',
      timingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
      transform: 'translateX(0)',
    },
  ];

  const payload = {
    $schema: 'https://ui-ux-helper.internal/schemas/animations-v1.json',
    version: '1.0.0',
    totalAnimations: animSystem.totalAnimations,
    summary: animSystem.summary,
    keyframesCatalog: animSystem.keyframesCatalog,
    animations: animSystem.animations,
    domMappingIntegrity: animSystem.domMappingIntegrity,
    animationIntelligenceSystem: animSystem,
    stats: {
      totalTransitionsObserved: observedTransitions.length,
      totalAnimationsObserved: observedAnimations.length,
    },
    observedTransitions,
    observedAnimations,
    motionPresets,
    metadata: animSystem.metadata,
  };

  return JSON.stringify(payload, null, 2);
}
