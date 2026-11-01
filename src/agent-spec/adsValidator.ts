import { AgentDesignSpecification } from './schema.ts';

export interface ADSValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateADS(ads: AgentDesignSpecification): ADSValidationResult {
  const errors: string[] = [];

  if (!ads) {
    return { valid: false, errors: ['ADS specification object is null or undefined'] };
  }

  if (!ads.metadata || !ads.metadata.title) {
    errors.push('Missing required metadata.title');
  }

  if (!ads.globalSystem) {
    errors.push('Missing globalSystem reference');
  }

  if (!Array.isArray(ads.colors)) {
    errors.push('Missing colors array');
  } else {
    ads.colors.forEach((c) => {
      if (c.alpha < 0 || c.alpha > 1) {
        errors.push(`Color ${c.id} has invalid alpha: ${c.alpha}`);
      }
      if (!c.sourceElementIds || c.sourceElementIds.length === 0) {
        errors.push(`Color ${c.id} missing traceability sourceElementIds`);
      }
    });
  }

  if (!Array.isArray(ads.components)) {
    errors.push('Missing components array');
  } else {
    ads.components.forEach((comp) => {
      if (typeof comp.confidence !== 'number' || comp.confidence < 0.0 || comp.confidence > 1.0) {
        errors.push(`Component ${comp.id} confidence out of range [0.0, 1.0]: ${comp.confidence}`);
      }
      if (!comp.evidence || comp.evidence.length === 0) {
        errors.push(`Component ${comp.id} missing evidence list`);
      }
      if (!comp.sourceElementIds || comp.sourceElementIds.length === 0) {
        errors.push(`Component ${comp.id} missing traceability sourceElementIds`);
      }
    });
  }

  if (!Array.isArray(ads.sections)) {
    errors.push('Missing sections array');
  } else {
    ads.sections.forEach((sec) => {
      if (typeof sec.confidence !== 'number' || sec.confidence < 0.0 || sec.confidence > 1.0) {
        errors.push(`Section ${sec.id} confidence out of range [0.0, 1.0]: ${sec.confidence}`);
      }
      if (!sec.evidence || sec.evidence.length === 0) {
        errors.push(`Section ${sec.id} missing evidence list`);
      }
    });
  }

  // Check unique IDs
  const idSet = new Set<string>();
  const checkUniqueId = (id: string, scope: string) => {
    if (idSet.has(id)) {
      errors.push(`Duplicate ID detected in ${scope}: ${id}`);
    }
    idSet.add(id);
  };

  ads.colors.forEach((c) => checkUniqueId(c.id, 'colors'));
  ads.typography.forEach((t) => checkUniqueId(t.id, 'typography'));
  ads.spacing.forEach((s) => checkUniqueId(s.id, 'spacing'));
  ads.components.forEach((c) => checkUniqueId(c.id, 'components'));
  ads.sections.forEach((s) => checkUniqueId(s.id, 'sections'));

  return {
    valid: errors.length === 0,
    errors,
  };
}
