import { AnalyzePageResponseData } from '../types/index.ts';

export function exportPageReconstruction(data: AnalyzePageResponseData): string {
  const colorSys = data.colorSystem;
  const typoSys = data.typographySystem;
  const shapeSys = data.shapeSystem;
  const layoutSys = data.layoutSystem;
  const compSys = data.componentSystem;

  const lines: string[] = [];
  lines.push('# Page Reconstruction Specification');
  lines.push(`- Title: ${data.title || 'Untitled'}`);
  lines.push(`- URL: ${data.pageUrl}`);
  lines.push(`- Viewport Dimensions: ${layoutSys ? `${layoutSys.viewport.width}px x ${layoutSys.viewport.height}px` : 'Unknown'}`);
  lines.push(`- Document Height: ${layoutSys ? `${layoutSys.viewport.documentHeight}px` : 'Unknown'}`);
  lines.push(`- Total Extracted Elements: ${data.summary?.totalElements ?? 0}`);
  lines.push('');

  lines.push('## 1. Global Tokens Summary');
  lines.push(`- Page Background: ${colorSys?.roles.pageBackground?.color.hex || '#ffffff'}`);
  lines.push(`- Primary Text: ${colorSys?.roles.primaryText?.color.hex || '#000000'}`);
  lines.push(`- Primary Font: ${typoSys?.fontFamilies[0]?.name || 'sans-serif'}`);
  lines.push(`- Primary Heading Style: ${typoSys?.hierarchy.h1 ? `${typoSys.hierarchy.h1.fontSizePx}px / ${typoSys.hierarchy.h1.fontWeight}` : 'None'}`);
  lines.push(`- Dominant Radius: ${shapeSys?.radiusScale[0] ? `${shapeSys.radiusScale[0].valuePx}px (${shapeSys.radiusScale[0].classification})` : '0px'}`);
  lines.push('');

  lines.push('## 2. Structural Page Sections (In Document Order)');
  if (compSys && compSys.sections.length > 0) {
    compSys.sections.forEach((sec, idx) => {
      lines.push(`### Section ${idx + 1}: \`${sec.sectionType}\``);
      lines.push(`- Element ID: \`${sec.elementId}\``);
      lines.push(`- Confidence: ${(sec.confidence * 100).toFixed(0)}%`);
      lines.push(`- Evidence: ${sec.evidence.join('; ')}`);
      lines.push(`- Component Candidates Included: ${sec.componentIds.map((id) => `\`${id}\``).join(', ') || 'None'}`);
      lines.push('');
    });
  } else {
    lines.push('No structural sections detected.');
    lines.push('');
  }

  lines.push('## 3. Layout Containers & Flex/Grid Structure');
  lines.push(`- Container Count: ${layoutSys?.stats.containerCount ?? 0}`);
  lines.push(`- Flex Containers: ${layoutSys?.stats.flexCount ?? 0}`);
  lines.push(`- Grid Containers: ${layoutSys?.stats.gridCount ?? 0}`);
  lines.push('');

  lines.push('## 4. Component Families & Patterns');
  lines.push(`- Detected Component Families: ${compSys?.stats.familyCount ?? 0}`);
  if (compSys && compSys.families.length > 0) {
    compSys.families.forEach((f) => {
      lines.push(`  - \`${f.type}\`: ${f.instanceCount} instances`);
    });
  }
  lines.push(`- High-Confidence Design Patterns: ${compSys?.stats.patternCount ?? 0}`);
  if (compSys && compSys.patterns.length > 0) {
    compSys.patterns.forEach((p) => {
      lines.push(`  - \`${p.patternType}\`: ${(p.confidence * 100).toFixed(0)}% confidence`);
    });
  }

  return lines.join('\n');
}
