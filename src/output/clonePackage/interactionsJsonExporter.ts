import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildInteractionGraphSystem } from '../../normalization/interaction/interactionGraphEngine.ts';

export function exportInteractionsJson(data: AnalyzePageResponseData): string {
  const interactionGraph = buildInteractionGraphSystem(data);
  const elements = data.extractionResult?.elements || [];

  // Filter elements that have interaction cues
  const interactiveNodes = elements.filter((e) =>
    e.interactive?.isClickable ||
    ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'].includes(e.tagName) ||
    Boolean(e.interactive?.href) ||
    Boolean(e.interactive?.ariaRole) ||
    Boolean(e.transitions)
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

  const interactionBehaviors = [
    {
      registryKey: 'interaction.button.primaryHover',
      trigger: 'hover',
      target: 'Button, a.btn, [role="button"]',
      effect: 'brightness(1.05)',
      description: 'Subtle brightness enhancement on interactive button hover',
    },
    {
      registryKey: 'interaction.card.defaultHover',
      trigger: 'hover',
      target: '.product-card, .card, [data-card]',
      effect: 'translateY(-4px), boxShadow: var(--shadow-lg)',
      description: 'Card lift elevation transition on mouse enter',
    },
    {
      registryKey: 'interaction.focus.visible',
      trigger: 'focus-visible',
      target: ':focus-visible',
      effect: 'outline: 2px solid var(--color-primary), outline-offset: 2px',
      description: 'Accessible focus indicator ring',
    },
    {
      registryKey: 'interaction.menu.toggle',
      trigger: 'click',
      target: 'button[aria-expanded], [data-toggle="menu"]',
      effect: 'toggle(aria-expanded, boolean), toggle(visibility)',
      description: 'Dropdown menu and mobile drawer toggle handler',
    },
  ];

  const payload = {
    $schema: 'https://ui-ux-helper.internal/schemas/interactions-v1.json',
    version: '1.0.0',
    totalInteractions: interactionGraph.totalInteractions,
    totalInteractiveElements: interactiveElements.length,
    summary: interactionGraph.summary,
    interactions: interactionGraph.interactions,
    interactionGraphSystem: interactionGraph,
    interactiveElements,
    interactionBehaviors,
    navigationRoutes: routes,
    metadata: interactionGraph.metadata,
  };

  return JSON.stringify(payload, null, 2);
}
