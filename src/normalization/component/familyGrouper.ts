import { UIComponentCandidate, ComponentFamily, ComponentType } from '../../types/schema.ts';

export function detectComponentFamilies(components: UIComponentCandidate[]): ComponentFamily[] {
  const familyMap = new Map<ComponentType, UIComponentCandidate[]>();

  for (const comp of components) {
    if (comp.type === 'generic') continue;
    if (!familyMap.has(comp.type)) {
      familyMap.set(comp.type, []);
    }
    familyMap.get(comp.type)!.push(comp);
  }

  const families: ComponentFamily[] = [];
  let fId = 1;

  for (const [type, instances] of familyMap.entries()) {
    if (instances.length >= 2) {
      families.push({
        familyId: `family_${fId++}`,
        type,
        instanceCount: instances.length,
        instanceElementIds: instances.map((i) => i.rootElementId),
        sharedColorTokens: [],
        sharedTypoTokens: [],
        evidence: [`Detected ${instances.length} repeated instances of ${type} component`],
      });
    }
  }

  return families;
}
