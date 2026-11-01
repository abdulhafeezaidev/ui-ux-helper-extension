import { RawElementNode, SpatialRelation } from '../../types/schema.ts';

export function detectSpatialRelations(
  elements: RawElementNode[],
  tolerancePx: number = 5.0
): SpatialRelation[] {
  const relations: SpatialRelation[] = [];
  const visibleElements = elements.filter((e) => e.isVisible);

  // Group elements by parentId to limit spatial comparisons to meaningful sibling/container scopes
  const scopeMap = new Map<string, RawElementNode[]>();
  for (const el of visibleElements) {
    const scopeId = el.parentId || 'root';
    if (!scopeMap.has(scopeId)) {
      scopeMap.set(scopeId, []);
    }
    scopeMap.get(scopeId)!.push(el);
  }

  for (const group of scopeMap.values()) {
    if (group.length <= 1) continue;

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const e1 = group[i];
        const e2 = group[j];

        const r1 = e1.boundingRect;
        const r2 = e2.boundingRect;

        if (Math.abs(r1.x - r2.x) <= 3) {
          relations.push({ sourceId: e1.id, targetId: e2.id, relation: 'alignedLeft' });
        }
        if (Math.abs(r1.x + r1.width - (r2.x + r2.width)) <= 3) {
          relations.push({ sourceId: e1.id, targetId: e2.id, relation: 'alignedRight' });
        }
        if (Math.abs(r1.x + r1.width / 2 - (r2.x + r2.width / 2)) <= tolerancePx) {
          relations.push({ sourceId: e1.id, targetId: e2.id, relation: 'centered' });
        }
        if (Math.abs(r1.width - r2.width) <= 3) {
          relations.push({ sourceId: e1.id, targetId: e2.id, relation: 'sameWidth' });
        }
        if (Math.abs(r1.height - r2.height) <= 3) {
          relations.push({ sourceId: e1.id, targetId: e2.id, relation: 'sameHeight' });
        }

        if (r1.y + r1.height <= r2.y + tolerancePx || i < j) {
          relations.push({ sourceId: e1.id, targetId: e2.id, relation: 'above' });
        } else if (r2.y + r2.height <= r1.y + tolerancePx) {
          relations.push({ sourceId: e1.id, targetId: e2.id, relation: 'below' });
        }
      }
    }
  }

  return relations;
}
