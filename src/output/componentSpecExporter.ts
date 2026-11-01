import { AnalyzePageResponseData } from '../types/index.ts';

export function exportComponentSpec(data: AnalyzePageResponseData): string {
  const compSys = data.componentSystem;
  const rawElements = data.extractionResult?.elements || [];

  const lines: string[] = [];
  lines.push('# UI Component Family Specifications');
  lines.push(`- Source Page: ${data.title || 'Untitled'} (${data.pageUrl})`);
  lines.push(`- Total Component Candidates: ${compSys?.stats.totalComponents ?? 0}`);
  lines.push(`- Component Families: ${compSys?.stats.familyCount ?? 0}`);
  lines.push('');

  if (!compSys || compSys.families.length === 0) {
    lines.push('No repeated component families detected with sufficient confidence.');
    return lines.join('\n');
  }

  for (const family of compSys.families) {
    lines.push(`## Component Family: \`${family.type}\``);
    lines.push(`- Family ID: \`${family.familyId}\``);
    lines.push(`- Instance Count: ${family.instanceCount}`);
    lines.push(`- Instance Element IDs: ${family.instanceElementIds.map((id) => `\`${id}\``).join(', ')}`);
    lines.push(`- Evidence: ${family.evidence.join('; ')}`);
    lines.push('');

    // Details from representative first instance element
    const representativeId = family.instanceElementIds[0];
    const repEl = rawElements.find((e) => e.id === representativeId);

    if (repEl) {
      lines.push('### Representative Instance Style Specs');
      lines.push(`- Tag Name: \`<${repEl.tagName.toLowerCase()}>\``);
      lines.push(`- Bounding Box: ${repEl.boundingRect.width}px x ${repEl.boundingRect.height}px`);
      lines.push(`- Display & Layout: \`${repEl.display}\` (position: \`${repEl.position}\`)`);
      lines.push(`- Background Color: \`${repEl.backgroundColor}\``);
      lines.push(`- Text Color: \`${repEl.color}\``);
      lines.push(`- Font Family: \`${repEl.typography.fontFamily}\``);
      lines.push(`- Font Size / Weight: \`${repEl.typography.fontSize}\` / \`${repEl.typography.fontWeight}\``);
      lines.push(`- Border Radius: \`${repEl.borderRadius.topLeft}\``);
      lines.push(`- Box Shadow: \`${repEl.boxShadow}\``);
      lines.push(`- Padding: \`top: ${repEl.padding.top}, right: ${repEl.padding.right}, bottom: ${repEl.padding.bottom}, left: ${repEl.padding.left}\``);
      lines.push(`- Margin: \`top: ${repEl.margin.top}, right: ${repEl.margin.right}, bottom: ${repEl.margin.bottom}, left: ${repEl.margin.left}\``);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}
