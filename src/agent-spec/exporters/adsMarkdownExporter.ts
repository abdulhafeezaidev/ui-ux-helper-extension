import { AgentDesignSpecification } from '../schema.ts';

export function exportAdsMarkdown(ads: AgentDesignSpecification): string {
  const lines: string[] = [];

  lines.push('# Agent Design Specification (ADS)');
  lines.push(`- Title: ${ads.metadata.title}`);
  lines.push(`- Source URL: ${ads.metadata.pageUrl}`);
  lines.push(`- Viewport: ${ads.metadata.viewport.width}px x ${ads.metadata.viewport.height}px`);
  lines.push(`- Specification Version: ${ads.$schemaVersion}`);
  lines.push('');

  lines.push('## 1. Overview');
  lines.push('This specification is an authoritative, deterministic design reference extracted directly from rendered DOM geometry and computed browser styles.');
  lines.push('');

  lines.push('## 2. Global Design System');
  lines.push(`- Page Background: \`${ads.globalSystem.pageBackground}\``);
  lines.push(`- Text Colors: ${ads.globalSystem.textColors.map((c) => `\`${c}\``).join(', ')}`);
  lines.push(`- Border Colors: ${ads.globalSystem.borderColors.map((c) => `\`${c}\``).join(', ')}`);
  lines.push(`- Primary Font Families: ${ads.globalSystem.fontFamilies.map((f) => `\`${f}\``).join(', ')}`);
  lines.push(`- Spacing Scale Values: ${ads.globalSystem.spacingScale.map((s) => `${s}px`).join(', ')}`);
  lines.push(`- Radius Scale Values: ${ads.globalSystem.radiusScale.map((r) => `${r}px`).join(', ')}`);
  lines.push('');

  lines.push('## 3. Colors');
  ads.colors.forEach((c) => {
    lines.push(`### Token: \`${c.name}\` (\`${c.hex}\`)`);
    lines.push(`- RGB: \`rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})\`, Alpha: ${c.alpha}`);
    lines.push(`- Semantic Role: \`${c.role}\``);
    lines.push(`- Frequency: ${c.frequency} (Classification: \`${c.classification}\`)`);
    lines.push('');
  });

  lines.push('## 4. Typography');
  ads.typography.forEach((t) => {
    lines.push(`### Style Token: \`${t.name}\` (${t.fontSizePx}px)`);
    lines.push(`- Family: \`${t.fontFamily}\` (Primary: \`${t.primaryFont}\`)`);
    lines.push(`- Font Weight: \`${t.fontWeight}\`, Line Height: \`${t.lineHeightPx}\``);
    lines.push(`- Hierarchy Role: \`${t.hierarchyRole}\``);
    lines.push('');
  });

  lines.push('## 5. Spacing');
  ads.spacing.forEach((s) => {
    lines.push(`- \`${s.id}\`: \`${s.valuePx}px\` (category: \`${s.category}\`, frequency: ${s.frequency})`);
  });
  lines.push('');

  lines.push('## 6. Shapes & Surfaces');
  lines.push(`- Dominant Corner Radius: ${ads.shapesAndSurfaces.radiusScale.map((r) => `${r.valuePx}px (${r.classification})`).join(', ') || '0px'}`);
  lines.push(`- Shadows Detected: ${ads.shapesAndSurfaces.shadowTokens.length}`);
  lines.push(`- Surface Categories: ${Object.entries(ads.shapesAndSurfaces.surfaceCategories).map(([k, v]) => `${k}:${v}`).join(', ')}`);
  lines.push('');

  lines.push('## 7. Layout');
  lines.push(`- Viewport Dimensions: ${ads.layout.viewportWidth}px x ${ads.layout.viewportHeight}px`);
  lines.push(`- Containers: ${ads.layout.containerCount} (Flex: ${ads.layout.flexContainerCount}, Grid: ${ads.layout.gridContainerCount})`);
  lines.push(`- Spatial Relationships Count: ${ads.layout.spatialRelationCount}`);
  lines.push('');

  lines.push('## 8. Sections');
  ads.sections.forEach((sec) => {
    lines.push(`### Section: \`${sec.semanticClassification}\` (ID: \`${sec.id}\`)`);
    lines.push(`- Confidence: ${(sec.confidence * 100).toFixed(0)}%`);
    lines.push(`- Evidence: ${sec.evidence.join('; ')}`);
    lines.push('');
  });

  lines.push('## 9. Components');
  ads.components.forEach((comp) => {
    lines.push(`### Component Family: \`${comp.type}\` (ID: \`${comp.id}\`)`);
    lines.push(`- Confidence: ${(comp.confidence * 100).toFixed(0)}%`);
    lines.push(`- Evidence: ${comp.evidence.join('; ')}`);
    lines.push('');
  });

  lines.push('## 10. Component Relationships');
  lines.push(`- Spatial Alignments Recorded: ${ads.relationships.spatialAlignments.length}`);
  ads.relationships.spatialAlignments.slice(0, 10).forEach((rel) => {
    lines.push(`  - \`${rel.sourceId}\` ${rel.relation} \`${rel.targetId}\``);
  });
  lines.push('');

  lines.push('## 11. Design Patterns');
  ads.designPatterns.forEach((p) => {
    lines.push(`- Pattern: \`${p.patternName}\` (${(p.confidence * 100).toFixed(0)}% confidence)`);
    lines.push(`  - Evidence: ${p.evidence.join('; ')}`);
  });
  lines.push('');

  lines.push('## 12. Fidelity-Critical Constraints');
  ads.fidelityConstraints.forEach((fc) => {
    lines.push(`- [${fc.priority}] ${fc.rule}`);
  });
  lines.push('');

  lines.push('## 13. Implementation Guidance');
  ads.implementationGuidance.forEach((g, idx) => {
    lines.push(`${idx + 1}. ${g}`);
  });
  lines.push('');

  lines.push('## 14. Evidence & Confidence');
  lines.push('- All inferences are derived deterministically with explicit evidence lists and bounded numeric confidence scores.');

  return lines.join('\n');
}
