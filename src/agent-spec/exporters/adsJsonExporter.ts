import { AgentDesignSpecification } from '../schema.ts';

export function exportAdsJson(ads: AgentDesignSpecification): string {
  if (!ads) return JSON.stringify({}, null, 2);

  // Deterministically order top-level keys
  const sorted = {
    $schemaVersion: ads.$schemaVersion,
    metadata: ads.metadata,
    globalSystem: ads.globalSystem,
    colors: ads.colors,
    typography: ads.typography,
    spacing: ads.spacing,
    shapesAndSurfaces: ads.shapesAndSurfaces,
    layout: ads.layout,
    sections: ads.sections,
    components: ads.components,
    relationships: ads.relationships,
    designPatterns: ads.designPatterns,
    fidelityConstraints: ads.fidelityConstraints,
    implementationGuidance: ads.implementationGuidance,
  };

  return JSON.stringify(sorted, null, 2);
}
