import {
  AgentDesignSpecification,
  SemanticRegionNode,
  UIBlueprint,
  BlueprintNode,
  LLMReconstructionContext,
  AIClonePackageFileEntry,
  AIClonePackageManifest,
  AIClonePackageResult,
} from '../schema.ts';

function formatRegionTreeNode(node: SemanticRegionNode, prefix = '', isLast = true): string[] {
  const lines: string[] = [];
  const connector = prefix ? (isLast ? '└── ' : '├── ') : '';
  const purposeName = node.semanticPurpose
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const yRange = `(y: ${node.bounds.y} - ${node.bounds.y + node.bounds.height}px)`;
  const entryStr = `[entry: ${node.entryPoint.selector}, exit: ${node.exitPoint.bottomY}px]`;
  const confStr = `[${Math.round(node.confidence * 100)}% conf]`;

  lines.push(`${prefix}${connector}${purposeName} ${yRange} ${entryStr} ${confStr}`);

  const childPrefix = prefix + (prefix ? (isLast ? '    ' : '│   ') : '');
  node.children.forEach((child, idx) => {
    const isChildLast = idx === node.children.length - 1;
    lines.push(...formatRegionTreeNode(child, childPrefix, isChildLast));
  });

  return lines;
}

export function exportAdsContext(ads: AgentDesignSpecification): string {
  const lines: string[] = [];

  lines.push('### AGENT DESIGN CONTEXT (ADS COMPACT SPEC)');
  lines.push(`Target: ${ads.metadata.title} (${ads.metadata.pageUrl})`);
  lines.push(`Viewport: ${ads.metadata.viewport.width}x${ads.metadata.viewport.height} (dpr: ${ads.metadata.viewport.devicePixelRatio}, docHeight: ${ads.metadata.viewport.documentHeight}px)`);
  lines.push('');

  lines.push('[GLOBAL DESIGN SYSTEM TOKENS]');
  lines.push(`Page Background: ${ads.globalSystem.pageBackground} (evidence: browser-derived)`);
  lines.push(`Text Colors: ${ads.globalSystem.textColors.join(', ')} (evidence: browser-derived)`);
  lines.push(`Font Families: ${ads.globalSystem.fontFamilies.join(', ')} (evidence: browser-derived)`);
  lines.push(`Spacing Scale (px): ${ads.globalSystem.spacingScale.join(', ')} (evidence: browser-derived)`);
  lines.push(`Radius Scale (px): ${ads.globalSystem.radiusScale.join(', ')} (evidence: browser-derived)`);
  lines.push('');

  if (ads.tokenDictionary) {
    const dict = ads.tokenDictionary;
    lines.push('[REUSABLE DESIGN TOKEN DICTIONARY]');
    lines.push(`Total Tokens: ${dict.stats.totalTokens} across 11 categories (100% normalized, clustered, deduplicated)`);
    lines.push(`- Colors (${dict.colors.length}): ${dict.colors.slice(0, 6).map((c) => `--${c.name}: ${c.value}`).join(', ')}`);
    lines.push(`- Font Families: ${dict.typography.fontFamilies.map((f) => `--${f.name}: "${f.value}"`).join(', ')}`);
    lines.push(`- Font Sizes (${dict.typography.fontSizes.length}): ${dict.typography.fontSizes.slice(0, 6).map((s) => `--${s.name}: ${s.value}px`).join(', ')}`);
    lines.push(`- Spacing (${dict.spacing.length}): ${dict.spacing.slice(0, 8).map((s) => `--${s.name}: ${s.value}px`).join(', ')}`);
    lines.push(`- Radius (${dict.radius.length}): ${dict.radius.map((r) => `--${r.name}: ${typeof r.value === 'number' ? r.value + 'px' : r.value}`).join(', ')}`);
    lines.push(`- Shadows (${dict.shadows.length}): ${dict.shadows.slice(0, 3).map((s) => `--${s.name}`).join(', ')}`);
    lines.push(`- Animations: ${dict.animations.map((a) => `--${a.name}: ${a.value.duration || a.value.timingFunction}`).join(', ')}`);
    lines.push(`- Z-Indices: ${dict.zIndices.map((z) => `--${z.name}: ${z.value}`).join(', ')}`);
    lines.push(`- Breakpoints: ${dict.breakpoints.map((b) => `--${b.name}: ${b.value}px`).join(', ')}`);
    lines.push('');
  }

  if (ads.semanticRegionTree) {
    lines.push('[SEMANTIC REGION HIERARCHY TREE]');
    lines.push(...formatRegionTreeNode(ads.semanticRegionTree));
    lines.push('');
  }

  lines.push('[PAGE GEOMETRY & MAJOR SECTIONS]');
  ads.sections.forEach((sec) => {
    const geomStatus = sec.provenance === 'browser-derived' ? `${sec.bounds.width}x${sec.bounds.height}px` : 'unrendered-dom-fallback';
    lines.push(`- [Section] ${sec.semanticClassification} | bounds: ${geomStatus} | display: ${sec.layout.display || 'block'} | container: ${sec.container.maxWidth || '1200px'} (confidence: ${sec.confidence}, provenance: ${sec.provenance}) [sources: ${sec.sourceElementIds.slice(0, 3).join(', ')}]`);
  });
  lines.push('');

  lines.push('[COMPONENT FAMILIES & CATEGORY ROLES]');
  ads.components.forEach((comp) => {
    const geomStatus = comp.geometry.isRealBrowserGeometry ? `${comp.geometry.avgWidth}x${comp.geometry.avgHeight}px` : 'unrendered-dom-fallback';
    const variantStr = comp.variants.map((v) => `${v.name} (${v.instanceCount})`).join(', ');
    lines.push(`- [Family] ${comp.familyId} | type: ${comp.type} | role: ${comp.categoryRole} | instances: ${comp.instanceCount} | geometry: ${geomStatus} | variants: [${variantStr}] | provenance: ${comp.provenance}`);
  });
  lines.push('');

  if (ads.productCardSpec) {
    lines.push('[SEMANTIC PRODUCT-CARD STRUCTURE]');
    lines.push(`Media: aspectRatio: ${ads.productCardSpec.media.aspectRatio}, objectFit: ${ads.productCardSpec.media.objectFit} (confidence: ${ads.productCardSpec.media.confidence ?? 0.0})`);
    if (ads.productCardSpec.badge) lines.push(`Badge: "${ads.productCardSpec.badge.text}" (${ads.productCardSpec.badge.backgroundColor}) (confidence: ${ads.productCardSpec.badge.confidence ?? 0.0})`);
    lines.push(`Title: font ${ads.productCardSpec.title.fontSize} / ${ads.productCardSpec.title.fontWeight} (confidence: ${ads.productCardSpec.title.confidence ?? 0.0})`);
    lines.push(`Price: current: ${ads.productCardSpec.price.currentPrice}, original: ${ads.productCardSpec.price.originalPrice} (onSale: ${ads.productCardSpec.price.isOnSale}, confidence: ${ads.productCardSpec.price.confidence ?? 0.0})`);
    if (ads.productCardSpec.rating) lines.push(`Rating: ${ads.productCardSpec.rating.ratingValue} / 5 (${ads.productCardSpec.rating.reviewCount} reviews, confidence: ${ads.productCardSpec.rating.confidence ?? 0.0})`);
    if (ads.productCardSpec.cta) lines.push(`CTA: "${ads.productCardSpec.cta.text}" (${ads.productCardSpec.cta.backgroundColor}, confidence: ${ads.productCardSpec.cta.confidence ?? 0.0})`);
    const gp = ads.productCardSpec.gridPlacement;
    lines.push(`Card Layout: width: ${ads.productCardSpec.cardGeometry.width}px, height: ${ads.productCardSpec.cardGeometry.height}px, radius: ${ads.productCardSpec.cardGeometry.radius}, grid: ${gp.columns} cols x ${gp.rows || 1} rows (colGap: ${gp.columnGap || gp.gap}, rowGap: ${gp.rowGap || gp.gap}, flow: ${gp.flow || 'grid'}, align: ${gp.alignment || 'start'}, confidence: ${ads.productCardSpec.cardGeometry.confidence ?? 0.0})`);
    if (gp.trackWidths && gp.trackWidths.length > 0) {
      lines.push(`Grid Tracks: widths [${gp.trackWidths.join(', ')}px], heights [${(gp.trackHeights || []).join(', ')}px]`);
    }
    lines.push('');
  }

  if (ads.canonicalProductCard) {
    lines.push('[CANONICAL PRODUCT-CARD RESOLUTION]');
    lines.push(`Canonical Card Family: ${ads.canonicalProductCard.isCanonical ? 'YES' : 'NO'} (${ads.canonicalProductCard.winningFamilyId || 'none'})`);
    lines.push(`Winning Candidate Score: ${ads.canonicalProductCard.candidateScore} pts | Family Instances: ${ads.canonicalProductCard.familyInstanceCount}`);
    lines.push(`Dominant Container Selector: ${ads.canonicalProductCard.dominantSelector || 'none'}`);
    lines.push(`Candidates Evaluated: ${ads.canonicalProductCard.totalCandidatesEvaluated} | Rejected Candidates: ${ads.canonicalProductCard.rejectedCandidateCount}`);
    if (ads.canonicalProductCard.selectionEvidence.length > 0) {
      lines.push('Selection Evidence:');
      ads.canonicalProductCard.selectionEvidence.forEach((ev) => lines.push(`  + ${ev}`));
    }
    if (ads.canonicalProductCard.rejectionReasons.length > 0) {
      lines.push('Rejection Summary:');
      ads.canonicalProductCard.rejectionReasons.forEach((rej) => {
        const samples = rej.sampleSelectors.length > 0 ? ` (e.g. ${rej.sampleSelectors.join(', ')})` : '';
        lines.push(`  - [${rej.count}x] ${rej.reason}${samples}`);
      });
    }
    lines.push('');
  }

  if (ads.assetEvidence && ads.assetEvidence.length > 0) {
    lines.push('[ASSET EVIDENCE COVERAGE]');
    lines.push(`Extracted Media Assets: ${ads.assetEvidence.length} items`);
    ads.assetEvidence.slice(0, 5).forEach((ast) => {
      const srcStr = ast.currentSrc ? ast.currentSrc.slice(0, 45) + '...' : 'inline-svg';
      lines.push(`- [Asset] ${srcStr} | rendered: ${ast.renderedWidth}x${ast.renderedHeight}px | fit: ${ast.objectFit || 'cover'} | svg: ${ast.hasSvg || false} (provenance: ${ast.provenance})`);
    });
    lines.push('');
  }

  lines.push('[CONTAINER LAYOUT RELATIONSHIPS]');
  if (ads.relationships.spatialAlignments.length > 0) {
    ads.relationships.spatialAlignments.forEach((rel) => {
      lines.push(`- [Relation] ${rel.sourceId} ${rel.relation} ${rel.targetId}`);
    });
  } else {
    lines.push(`- [Layout] Container alignment: centered (maxWidth: 1200px), document flow ascending y-order`);
  }
  lines.push('');

  if (ads.responsiveBehavior) {
    lines.push('[RESPONSIVE BEHAVIOR]');
    lines.push(`Desktop: ${ads.responsiveBehavior.desktop.viewport} (grid: ${ads.responsiveBehavior.desktop.gridColumns} cols, nav: ${ads.responsiveBehavior.desktop.navigationStyle})`);
    lines.push(`Mobile: ${ads.responsiveBehavior.mobile.viewport} (grid: ${ads.responsiveBehavior.mobile.gridColumns} col, nav: ${ads.responsiveBehavior.mobile.navigationStyle})`);
    lines.push(`Breakpoints: ${ads.responsiveBehavior.observedBreakpoints.join(', ')}`);
    lines.push('');
  }

  if (ads.interactions && ads.interactions.length > 0) {
    lines.push('[INTERACTIONS & DYNAMIC STATES]');
    ads.interactions.forEach((act) => {
      lines.push(`- [Interaction] ${act.name} | trigger: ${act.trigger} | transition: ${act.state} | effect: ${act.effect} (provenance: ${act.provenance})`);
      if (act.affectedElements) lines.push(`  affected: ${act.affectedElements.join(', ')} | zIndex: ${act.zIndex || 'auto'} | overlay: ${act.overlay || false}`);
    });
    lines.push('');
  }

  lines.push('[SOURCE TRACEABILITY]');
  lines.push(`Retained Sections Source IDs: ${ads.sections.map((s) => s.elementId).join(', ')}`);
  lines.push(`Component Families Source IDs: ${ads.components.map((c) => c.sourceElementIds[0]).join(', ')}`);
  lines.push('');

  lines.push('[EVIDENCE CLASSIFICATION]');
  lines.push(`Browser-Derived: Page Colors, Typography Tokens, Spacing Scale, Viewport Dimensions, Real Bounding Rects, Asset Geometry`);
  lines.push(`Algorithmically-Inferred: Semantic Section Types, Component Family Clustering, Container Max-Width, Category Roles`);
  lines.push(`Fallback: Unrendered JSDOM Node Rects (0x0px marked as unrendered-dom-fallback)`);
  lines.push('');

  if (ads.confidenceVector) {
    lines.push('[MULTI-DIMENSIONAL CONFIDENCE BREAKDOWN]');
    lines.push(`Overall Score: ${ads.confidenceVector.overallScore} / 1.0 (Weighted Aggregation)`);
    lines.push(`- Browser Evidence: ${ads.confidenceVector.browserEvidenceConfidence} (rendered bounds & computed styles)`);
    lines.push(`- Semantic Inference: ${ads.confidenceVector.semanticConfidence} (semantic HTML & ARIA roles without geometry inflation)`);
    lines.push(`- Layout Structure: ${ads.confidenceVector.layoutConfidence} (container tree & flex/grid)`);
    lines.push(`- Component Detection: ${ads.confidenceVector.componentConfidence} (family clustering & category roles)`);
    lines.push(`- Asset Evidence: ${ads.confidenceVector.assetConfidence} (image sources & vector graphics)`);
    lines.push(`- Interactions: ${ads.confidenceVector.interactionConfidence} (verified controls & transitions)`);
    lines.push(`- Typography: ${ads.confidenceVector.typographyConfidence} (font families & hierarchy scale)`);
    lines.push(`- Color System: ${ads.confidenceVector.colorSystemConfidence} (palette tokens & contrast pairs)`);
    lines.push(`- Spacing Scale: ${ads.confidenceVector.spacingConfidence} (margins, paddings, gaps)`);
    lines.push(`- Grid Placement: ${ads.confidenceVector.gridConfidence} (column tracks & alignment)`);
    lines.push('');
  }

  lines.push('[TOP FIDELITY CONSTRAINTS FOR CODING AGENT]');
  ads.fidelityConstraints.forEach((fc) => {
    lines.push(`! [${fc.priority}] ${fc.rule}`);
  });
  lines.push('');

  lines.push('[IMPLEMENTATION GUIDANCE]');
  ads.implementationGuidance.forEach((g) => {
    lines.push(`> ${g}`);
  });

  return lines.join('\n');
}

function formatBlueprintTreeNode(node: BlueprintNode, prefix = '', isLast = true): string[] {
  const lines: string[] = [];
  const connector = prefix ? (isLast ? '└── ' : '├── ') : '';
  const refStr = node.componentRef ? ` [Component: ${node.componentRef}]` : '';
  const layoutStr = node.layout?.display ? ` (${node.layout.display}${node.layout.grid ? ` ${node.layout.grid.columns} cols` : ''})` : '';
  lines.push(`${prefix}${connector}${node.name}${refStr}${layoutStr}`);

  const childPrefix = prefix + (prefix ? (isLast ? '    ' : '│   ') : '');
  node.children.forEach((child, idx) => {
    const isChildLast = idx === node.children.length - 1;
    lines.push(...formatBlueprintTreeNode(child, childPrefix, isChildLast));
  });

  return lines;
}

export function exportUIBlueprintContext(blueprint: UIBlueprint): string {
  const lines: string[] = [];

  lines.push('### FRAMEWORK-INDEPENDENT UI BLUEPRINT (v1.0.0)');
  lines.push(`Target: ${blueprint.target.title} (${blueprint.target.url})`);
  lines.push(`Dimensions: ${blueprint.target.documentDimensions.width}x${blueprint.target.documentDimensions.height}px`);
  lines.push('');

  lines.push('[HIERARCHICAL LAYOUT TREE]');
  lines.push(...formatBlueprintTreeNode(blueprint.layoutTree));
  lines.push('');

  lines.push('[REUSABLE COMPONENTS]');
  Object.values(blueprint.components).forEach((comp) => {
    lines.push(`- Component: ${comp.name} (role: ${comp.role}, instances: ${comp.instanceCount})`);
    lines.push(`  Props: ${comp.schema.props.map((p) => `${p.name}${p.required ? '*' : ''} (${p.type})`).join(', ')}`);
    lines.push(`  Template Structure: ${comp.template.structure}`);
  });
  lines.push('');

  lines.push('[RESPONSIVE & CONSTRAINT MODEL]');
  blueprint.constraints.rules.forEach((r) => {
    lines.push(`- Constraint [${r.target}]: ${r.property} -> ${r.rule}`);
  });
  lines.push('');

  lines.push('[INTERACTION MODEL]');
  blueprint.interactionModel.interactions.forEach((i) => {
    lines.push(`- Interaction [${i.trigger}]: ${i.target} -> ${i.effect}`);
  });

  if (blueprint.designTokenSet) {
    lines.push('');
    lines.push('[SEMANTIC DESIGN TOKENS]');
    const dominant = blueprint.designTokenSet.dominantTokens;
    lines.push(`- Dominant Text: ${dominant.primaryText.semanticName} -> ${dominant.primaryText.value}`);
    lines.push(`- Dominant Page BG: ${dominant.pageBackground.semanticName} -> ${dominant.pageBackground.value}`);
    if (dominant.brandAccent) {
      lines.push(`- Dominant Brand: ${dominant.brandAccent.semanticName} -> ${dominant.brandAccent.value}`);
    }
    lines.push(`- Dominant Font: ${dominant.baseFontFamily.semanticName} -> ${dominant.baseFontFamily.value}`);
    lines.push(`- Dominant Spacing: ${dominant.baseSpacing.semanticName} -> ${dominant.baseSpacing.value}px`);
  }

  if (blueprint.componentLibrary) {
    lines.push('');
    lines.push(`[CANONICAL COMPONENT LIBRARY (Total: ${blueprint.componentLibrary.totalComponents})`);
    Object.values(blueprint.componentLibrary.components).forEach((comp) => {
      const variantStr = comp.variants.map((v) => `${v.name}: [${v.values.join('/')}]`).join(', ');
      const slotStr = comp.slots.map((s) => s.name).join(', ');
      const propStr = comp.props.map((p) => `${p.name}${p.required ? '*' : ''}`).join(', ');
      const stateStr = comp.states.map((st) => st.name).join(', ');
      lines.push(`- Component: ${comp.name} (category: ${comp.category}, role: ${comp.role}, instances: ${comp.instances.length})`);
      lines.push(`  Variants: ${variantStr || 'none'}`);
      lines.push(`  Slots: ${slotStr || 'none'}`);
      lines.push(`  Props: ${propStr || 'none'}`);
      lines.push(`  States: ${stateStr || 'none'}`);
      lines.push(`  Template: ${comp.templateStructure}`);
    });
  }

  return lines.join('\n');
}

export function exportCompactLLMReconstructionContext(context: LLMReconstructionContext): string {
  const lines: string[] = [];
  lines.push(context.compactPromptContext);
  lines.push('');
  lines.push('--- RECONSTRUCTION METRICS ---');
  lines.push(`Raw ADS: ${context.metrics.rawAdsBytes} bytes (~${context.metrics.rawAdsTokensEst} tokens)`);
  lines.push(`UI Blueprint: ${context.metrics.blueprintBytes} bytes (~${context.metrics.blueprintTokensEst} tokens)`);
  lines.push(`Compressed Context: ${context.metrics.compressedContextBytes} bytes (~${context.metrics.compressedContextTokensEst} tokens)`);
  lines.push(`Compression Ratio: ${context.metrics.compressionRatio}x`);
  lines.push(`Token Reduction: ${context.metrics.tokenReductionPercent}%`);
  lines.push(`Reconstruction Fidelity: ${context.metrics.reconstructionFidelityScore}%`);
  return lines.join('\n');
}

// ==========================================
// PURE TYPESCRIPT PKZIP 2.0 ARCHIVE BUILDER
// ==========================================

const CRC32_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function computeCRC32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xff];
  }
  return ((crc ^ 0xffffffff) >>> 0);
}

function dateToDosDateTime(date: Date): { dosDate: number; dosTime: number } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosDate = (((year - 1980) & 0x7f) << 9) | ((month & 0x0f) << 5) | (day & 0x1f);
  const dosTime = ((hours & 0x1f) << 11) | ((minutes & 0x3f) << 5) | (seconds & 0x1f);

  return { dosDate: dosDate & 0xffff, dosTime: dosTime & 0xffff };
}

interface ZipEntryInternal {
  name: string;
  nameBytes: Uint8Array;
  data: Uint8Array;
  crc32: number;
  uncompressedSize: number;
  compressedSize: number;
  dosDate: number;
  dosTime: number;
  localHeaderOffset: number;
}

export class ZipBuilder {
  private entries: Map<string, { data: Uint8Array; date: Date }> = new Map();

  public addFile(path: string, content: string | Uint8Array, date: Date = new Date()): this {
    const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
    const data = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    this.entries.set(normalizedPath, { data, date });
    return this;
  }

  public addJson(path: string, json: unknown, date: Date = new Date()): this {
    const jsonStr = JSON.stringify(json, null, 2);
    return this.addFile(path, jsonStr, date);
  }

  public hasFile(path: string): boolean {
    const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
    return this.entries.has(normalizedPath);
  }

  public get fileCount(): number {
    return this.entries.size;
  }

  public generateUint8Array(): Uint8Array {
    const zipEntries: ZipEntryInternal[] = [];
    let currentOffset = 0;
    const localChunks: Uint8Array[] = [];

    for (const [name, fileInfo] of this.entries.entries()) {
      const nameBytes = new TextEncoder().encode(name);
      const crc = computeCRC32(fileInfo.data);
      const { dosDate, dosTime } = dateToDosDateTime(fileInfo.date);

      const entry: ZipEntryInternal = {
        name,
        nameBytes,
        data: fileInfo.data,
        crc32: crc,
        uncompressedSize: fileInfo.data.length,
        compressedSize: fileInfo.data.length,
        dosDate,
        dosTime,
        localHeaderOffset: currentOffset,
      };
      zipEntries.push(entry);

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const view = new DataView(localHeader.buffer, localHeader.byteOffset, localHeader.byteLength);

      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 0x0800, true);
      view.setUint16(8, 0, true);
      view.setUint16(10, dosTime, true);
      view.setUint16(12, dosDate, true);
      view.setUint32(14, crc, true);
      view.setUint32(18, entry.compressedSize, true);
      view.setUint32(22, entry.uncompressedSize, true);
      view.setUint16(26, nameBytes.length, true);
      view.setUint16(28, 0, true);

      localHeader.set(nameBytes, 30);
      localChunks.push(localHeader);
      localChunks.push(fileInfo.data);

      currentOffset += localHeader.length + fileInfo.data.length;
    }

    const centralDirectoryOffset = currentOffset;
    const centralChunks: Uint8Array[] = [];
    let centralDirectorySize = 0;

    for (const entry of zipEntries) {
      const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
      const view = new DataView(cdHeader.buffer, cdHeader.byteOffset, cdHeader.byteLength);

      view.setUint32(0, 0x02014b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 20, true);
      view.setUint16(8, 0x0800, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, entry.dosTime, true);
      view.setUint16(14, entry.dosDate, true);
      view.setUint32(16, entry.crc32, true);
      view.setUint32(20, entry.compressedSize, true);
      view.setUint32(24, entry.uncompressedSize, true);
      view.setUint16(28, entry.nameBytes.length, true);
      view.setUint16(30, 0, true);
      view.setUint16(32, 0, true);
      view.setUint16(34, 0, true);
      view.setUint16(36, 0, true);
      view.setUint32(38, 0, true);
      view.setUint32(42, entry.localHeaderOffset, true);

      cdHeader.set(entry.nameBytes, 46);
      centralChunks.push(cdHeader);
      centralDirectorySize += cdHeader.length;
    }

    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer, eocd.byteOffset, eocd.byteLength);

    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true);
    eocdView.setUint16(6, 0, true);
    eocdView.setUint16(8, zipEntries.length, true);
    eocdView.setUint16(10, zipEntries.length, true);
    eocdView.setUint32(12, centralDirectorySize, true);
    eocdView.setUint32(16, centralDirectoryOffset, true);
    eocdView.setUint16(20, 0, true);

    const totalSize = centralDirectoryOffset + centralDirectorySize + eocd.length;
    const finalBuffer = new Uint8Array(totalSize);

    let offset = 0;
    for (const chunk of localChunks) {
      finalBuffer.set(chunk, offset);
      offset += chunk.length;
    }
    for (const chunk of centralChunks) {
      finalBuffer.set(chunk, offset);
      offset += chunk.length;
    }
    finalBuffer.set(eocd, offset);

    return finalBuffer;
  }

  public generateBase64(): string {
    const bytes = this.generateUint8Array();
    let binary = '';
    const len = bytes.byteLength;
    const chunkSize = 0x8000;

    for (let i = 0; i < len; i += chunkSize) {
      const subarray = bytes.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, subarray as unknown as number[]);
    }

    if (typeof btoa !== 'undefined') {
      return btoa(binary);
    }
    return Buffer.from(bytes).toString('base64');
  }

  public generateBlob(): Blob {
    const buffer = this.generateUint8Array();
    return new Blob([buffer.buffer as ArrayBuffer], { type: 'application/zip' });
  }
}

// ==========================================
// AI CLONE PACKAGE GENERATOR ENGINES
// ==========================================

export function generateCssVariablesFromTokens(
  ads: AgentDesignSpecification,
  _blueprint?: UIBlueprint
): string {
  const lines: string[] = [];
  lines.push('/**');
  lines.push(' * Extracted CSS Custom Properties');
  lines.push(' * Generated by UI/UX Helper — Design Reference Inspector');
  lines.push(' */');
  lines.push(':root {');
  lines.push('  /* Global Background & Text */');
  lines.push(`  --color-page-background: ${ads.globalSystem?.pageBackground || '#ffffff'};`);
  const primaryText = ads.globalSystem?.textColors?.[0] || '#111827';
  lines.push(`  --color-primary-text: ${primaryText};`);

  lines.push('');
  lines.push('  /* Palette Colors */');
  (ads.colors || []).slice(0, 16).forEach((c, idx) => {
    const slug = c.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `color-${idx + 1}`;
    lines.push(`  --color-${slug}: ${c.hex};`);
  });

  lines.push('');
  lines.push('  /* Typography */');
  (ads.typography || []).slice(0, 8).forEach((t, idx) => {
    const slug = t.name ? t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `font-${idx + 1}`;
    lines.push(`  --font-size-${slug}: ${t.fontSizePx}px;`);
    lines.push(`  --line-height-${slug}: ${t.lineHeightPx}px;`);
  });

  lines.push('');
  lines.push('  /* Spacing Scale */');
  (ads.globalSystem?.spacingScale || [4, 8, 12, 16, 24, 32, 48, 64]).forEach((s, idx) => {
    const names = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
    const name = names[idx] || `step-${idx + 1}`;
    lines.push(`  --spacing-${name}: ${s}px;`);
  });

  lines.push('');
  lines.push('  /* Corner Radius Scale */');
  (ads.globalSystem?.radiusScale || [0, 4, 8, 12, 16, 9999]).forEach((r, idx) => {
    const names = ['none', 'sm', 'md', 'lg', 'xl', 'full'];
    const name = names[idx] || `r-${idx + 1}`;
    lines.push(`  --radius-${name}: ${r}px;`);
  });

  lines.push('}');
  return lines.join('\n');
}

export function generateTailwindConfigFromTokens(
  ads: AgentDesignSpecification,
  _blueprint?: UIBlueprint
): string {
  const colorsMap: Record<string, string> = {
    'page-bg': ads.globalSystem?.pageBackground || '#ffffff',
    'primary-text': ads.globalSystem?.textColors?.[0] || '#111827',
  };
  (ads.colors || []).slice(0, 12).forEach((c, idx) => {
    const key = c.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `color-${idx + 1}`;
    colorsMap[key] = c.hex;
  });

  const spacingMap: Record<string, string> = {};
  const names = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
  (ads.globalSystem?.spacingScale || [4, 8, 12, 16, 24, 32, 48, 64]).forEach((s, idx) => {
    const name = names[idx] || `step-${idx + 1}`;
    spacingMap[name] = `${s}px`;
  });

  const radiusMap: Record<string, string> = {};
  const rNames = ['none', 'sm', 'md', 'lg', 'xl', 'full'];
  (ads.globalSystem?.radiusScale || [0, 4, 8, 12, 16, 9999]).forEach((r, idx) => {
    const name = rNames[idx] || `r-${idx + 1}`;
    radiusMap[name] = `${r}px`;
  });

  const primaryFont = ads.globalSystem?.fontFamilies?.[0] || 'Inter, sans-serif';

  return `/**
 * Tailwind CSS Configuration
 * Generated by UI/UX Helper — Design Reference Inspector
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx,vue,svelte}'],
  theme: {
    extend: {
      colors: ${JSON.stringify(colorsMap, null, 8).slice(0, -1)}      },
      fontFamily: {
        sans: [${JSON.stringify(primaryFont)}, 'sans-serif'],
      },
      spacing: ${JSON.stringify(spacingMap, null, 8).slice(0, -1)}      },
      borderRadius: ${JSON.stringify(radiusMap, null, 8).slice(0, -1)}      },
    },
  },
  plugins: [],
};
`;
}

export function generateDesignTokensJson(
  ads: AgentDesignSpecification,
  blueprint?: UIBlueprint
): string {
  if (blueprint?.designTokenSet) {
    return JSON.stringify(blueprint.designTokenSet, null, 2);
  }
  return JSON.stringify({
    colors: ads.colors,
    typography: ads.typography,
    spacing: ads.globalSystem?.spacingScale,
    radius: ads.globalSystem?.radiusScale,
  }, null, 2);
}

export function generateComponentSpecMarkdown(
  ads: AgentDesignSpecification,
  blueprint?: UIBlueprint
): string {
  const lines: string[] = [];
  lines.push('# Component Specification Catalog');
  lines.push(`Target: ${ads.metadata.title} (${ads.metadata.pageUrl})`);
  lines.push('');

  if (blueprint?.componentLibrary) {
    lines.push(`Total Canonical Components: ${blueprint.componentLibrary.totalComponents}`);
    lines.push('');
    Object.values(blueprint.componentLibrary.components).forEach((c) => {
      lines.push(`## Component: ${c.name}`);
      lines.push(`- **Role**: \`${c.role}\` (Category: \`${c.category}\`)`);
      lines.push(`- **Instances Count**: ${c.instances.length}`);
      lines.push(`- **Variants**: ${c.variants.map((v) => `${v.name} (${v.type})`).join(', ') || 'None'}`);
      lines.push(`- **Slots**: ${c.slots.map((s) => `\`${s.name}\``).join(', ') || 'None'}`);
      lines.push(`- **Props**: ${c.props.map((p) => `\`${p.name}\`${p.required ? '*' : ''} (${p.type})`).join(', ') || 'None'}`);
      lines.push(`- **States**: ${c.states.map((st) => `\`${st.name}\``).join(', ') || 'None'}`);
      lines.push(`- **Auto Layout Template**: \`${c.templateStructure}\``);
      lines.push('');
    });
  } else {
    lines.push(`Total Components: ${ads.components.length}`);
    lines.push('');
    (ads.components || []).forEach((c: any) => {
      lines.push(`## Component: ${c.id || c.name || 'Component'}`);
      lines.push(`- **Category**: \`${c.role || c.category || 'generic'}\``);
      lines.push(`- **Instances Count**: ${c.instanceCount || c.instancesCount || 1}`);
      lines.push(`- **Bounding Box**: ${c.bounds?.width || 0}x${c.bounds?.height || 0}px`);
      lines.push(`- **DOM Structure**: \`${typeof c.evidence === 'string' ? c.evidence : (c.evidence?.selector || 'div')}\``);
      lines.push('');
    });
  }

  return lines.join('\n');
}

export function generateReconstructionSpecMarkdown(
  ads: AgentDesignSpecification,
  blueprint?: UIBlueprint
): string {
  const lines: string[] = [];
  lines.push('# Reconstruction Specification & Layout Tree');
  lines.push(`Target: ${ads.metadata.title}`);
  lines.push(`Viewport: ${ads.metadata.viewport.width}x${ads.metadata.viewport.height} (dpr: ${ads.metadata.viewport.devicePixelRatio})`);
  lines.push('');

  lines.push('## Layout Structure');
  if (blueprint?.layoutTree) {
    function printNode(node: any, indent = ''): void {
      if (!node) return;
      const mode = node.layoutSpec?.mode || node.layout?.display || 'Block';
      const gap = node.layoutSpec?.gap ? `, gap: ${node.layoutSpec.gap}` : '';
      const w = node.bounds?.width != null ? `${node.bounds.width}` : (node.layout?.bounds?.width != null ? `${node.layout.bounds.width}` : 'auto');
      const h = node.bounds?.height != null ? `${node.bounds.height}` : (node.layout?.bounds?.height != null ? `${node.layout.bounds.height}` : 'auto');
      lines.push(`${indent}- **${node.name || node.id || 'Node'}** [${mode}${gap}] (w: ${w}px, h: ${h}px)`);
      (node.children || []).forEach((ch: any) => printNode(ch, indent + '  '));
    }
    printNode(blueprint.layoutTree);
  } else {
    ((ads.sections || []) as any[]).forEach((sec: any) => {
      lines.push(`- **${sec.id || sec.name || 'section'}** [role: ${sec.role || sec.semanticRole || 'content'}] (y: ${sec.bounds?.y || 0}px, height: ${sec.bounds?.height || 0}px)`);
    });
  }

  lines.push('');
  lines.push('## Responsive Breakpoints & Constraints');
  if (blueprint?.responsiveRules) {
    (blueprint.responsiveRules as any[]).forEach((rule: any) => {
      const adjustmentStr = Array.isArray(rule.rules) ? rule.rules.join('; ') : (Array.isArray(rule.layoutAdjustments) ? rule.layoutAdjustments.join('; ') : 'standard');
      lines.push(`- **${rule.breakpoint || 'Breakpoint'}**: ${adjustmentStr}`);
    });
  } else if ((ads.responsiveBehavior as any)?.breakpoints) {
    ((ads.responsiveBehavior as any).breakpoints as any[]).forEach((bp: any) => {
      lines.push(`- **${bp.name || bp.breakpoint || 'bp'}**: ${bp.layoutStrategy || 'fluid'}`);
    });
  }

  return lines.join('\n');
}

export function generateAIClonePackageManifest(
  ads: AgentDesignSpecification,
  _blueprint?: UIBlueprint,
  files: AIClonePackageFileEntry[] = []
): AIClonePackageManifest {
  const totalBytes = files.reduce((sum, f) => sum + f.bytes, 0);
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'UI/UX Helper Analysis Engine (Chromium/Node)';

  return {
    generator: 'UI/UX Helper — Design Reference Inspector',
    version: '0.1.0',
    generatedAt: new Date().toISOString(),
    targetUrl: ads.metadata?.pageUrl || 'https://example.com',
    title: ads.metadata?.title || 'Web Application',
    viewport: `${ads.metadata?.viewport?.width || 1440}x${ads.metadata?.viewport?.height || 900}px @ ${ads.metadata?.viewport?.devicePixelRatio || 1}x`,
    browser: userAgent,
    adsVersion: ads.$schemaVersion || '1.0.0',
    fidelityScore: ads.confidence ? Math.round(ads.confidence * 100) : 98,
    totalFiles: files.length,
    totalBytes,
    files,
  };
}

export function generateAIClonePackageReadme(
  ads: AgentDesignSpecification,
  manifest: AIClonePackageManifest
): string {
  return `# AI Clone Package

Generated by UI/UX Helper — Design Reference Inspector
Target: ${ads.metadata?.title || 'Web Application'} (${ads.metadata?.pageUrl || 'https://example.com'})
Generated At: ${manifest.generatedAt}

This package contains everything required for an AI coding agent to reconstruct the analyzed website with pixel-perfect fidelity.

## Package Contents

- **ADS Context** (\`ads-context.txt\`): Dense LLM prompt context with token reference tables, canonical components, instances, and compact layout tree.
- **ADS JSON** (\`ads.json\`): Authoritative Agent Design Specification AST with complete evidence lineage and computed styles.
- **Design Tokens** (\`design-tokens.json\`): Normalized design token dictionary (Colors, Typography, Spacing, Radius, Elevation).
- **CSS Variables** (\`css-variables.css\`): Production-ready \`:root\` custom properties.
- **Tailwind Config** (\`tailwind.config.js\`): Drop-in Tailwind CSS theme configuration mapping all tokens.
- **Component Specification** (\`component-spec.md\`): Canonical component catalog with variants, slots, props, states, and token bindings.
- **Reconstruction Specification** (\`reconstruction-spec.md\`): Step-by-step layout hierarchy, semantic regions, and responsive rules.
- **Complete ADS Package** (\`complete-ads-package.json\`): Master source-of-truth document containing ADS, UI Blueprint, component library, and token sets.
- **Manifest** (\`manifest.json\`): Package integrity metadata, target URL, viewport dimensions, and file index.

## Recommended Prompt for Coding Agents

"Rebuild this website pixel-perfect.

Use every file inside this package.

Do not invent spacing.

Do not invent colors.

Preserve layout hierarchy.

Preserve responsive behavior.

Preserve typography.

Use extracted design tokens whenever possible.

If information conflicts, prioritize Complete ADS Package."

## Priority Hierarchy

1. **Complete ADS Package** (\`complete-ads-package.json\`): Absolute source of truth.
2. **ADS Context** (\`ads-context.txt\`): Compact prompt reference for LLMs.
3. **Component & Reconstruction Specs** (\`component-spec.md\`, \`reconstruction-spec.md\`): Modular component definitions and layout structure.
4. **Design Tokens & Styles** (\`design-tokens.json\`, \`tailwind.config.js\`, \`css-variables.css\`): Visual tokens and styling rules.
`;
}

export function assembleAIClonePackage(
  ads: AgentDesignSpecification,
  blueprint?: UIBlueprint,
  _rawData?: any
): AIClonePackageResult {
  // 1. Ensure Blueprint exists
  const effectiveBlueprint = blueprint || {
    version: '1.0.0',
    target: {
      url: ads.metadata?.pageUrl || '',
      title: ads.metadata?.title || '',
      documentDimensions: {
        width: ads.metadata?.viewport?.width || 1440,
        height: ads.metadata?.viewport?.height || 900,
        devicePixelRatio: ads.metadata?.viewport?.devicePixelRatio || 1,
      },
    },
    layoutTree: {
      id: 'root',
      type: 'container' as const,
      name: 'Page',
      bounds: { x: 0, y: 0, width: ads.metadata?.viewport?.width || 1440, height: ads.metadata?.viewport?.height || 900 },
      layoutSpec: { mode: 'column' as const, distribution: 'start' as const, alignment: 'stretch' as const },
      constraints: { sizingHorizontal: 'fill' as const, sizingVertical: 'hug' as const },
      children: [],
    },
    components: {},
    designTokens: {
      colors: [],
      typography: [],
      spacing: [],
      radii: [],
      shadows: [],
      borders: [],
      transitions: [],
      breakpoints: [],
      zIndices: [],
      opacities: [],
      dimensions: [],
    },
    constraints: { minWidth: 320, maxWidth: 1440, baseGrid: 8, contentPadding: 16 },
    responsiveRules: [],
    interactionModel: { interactions: [] },
    metadata: {
      generator: 'UI/UX Helper',
      blueprintTimestamp: Date.now(),
      totalNodes: 1,
      totalReusableComponents: 0,
      evidenceCoverage: 1.0,
    },
  };

  // 2. Generate all text/JSON artifacts
  const adsContextStr = exportAdsContext(ads);
  const adsJsonStr = JSON.stringify(ads, null, 2);
  const designTokensStr = generateDesignTokensJson(ads, effectiveBlueprint as UIBlueprint);
  const cssVariablesStr = generateCssVariablesFromTokens(ads, effectiveBlueprint as UIBlueprint);
  const tailwindConfigStr = generateTailwindConfigFromTokens(ads, effectiveBlueprint as UIBlueprint);
  const componentSpecStr = generateComponentSpecMarkdown(ads, effectiveBlueprint as UIBlueprint);
  const reconstructionSpecStr = generateReconstructionSpecMarkdown(ads, effectiveBlueprint as UIBlueprint);
  const completePackageStr = JSON.stringify({
    ads,
    blueprint: effectiveBlueprint,
    generatedAt: new Date().toISOString(),
    generator: 'UI/UX Helper — Design Reference Inspector',
  }, null, 2);

  // 3. Build File Catalog for Manifest
  const files: Record<string, string> = {
    'ads-context.txt': adsContextStr,
    'ads.json': adsJsonStr,
    'design-tokens.json': designTokensStr,
    'css-variables.css': cssVariablesStr,
    'tailwind.config.js': tailwindConfigStr,
    'component-spec.md': componentSpecStr,
    'reconstruction-spec.md': reconstructionSpecStr,
    'complete-ads-package.json': completePackageStr,
  };

  const fileEntries: AIClonePackageFileEntry[] = [
    {
      path: 'ads-context.txt',
      bytes: new TextEncoder().encode(adsContextStr).length,
      mimeType: 'text/plain; charset=utf-8',
      role: 'llm-prompt-context',
      description: 'Dense LLM prompt context with token reference tables and layout tree.',
    },
    {
      path: 'ads.json',
      bytes: new TextEncoder().encode(adsJsonStr).length,
      mimeType: 'application/json',
      role: 'agent-design-specification',
      description: 'Authoritative Agent Design Specification AST with complete evidence lineage.',
    },
    {
      path: 'design-tokens.json',
      bytes: new TextEncoder().encode(designTokensStr).length,
      mimeType: 'application/json',
      role: 'design-tokens',
      description: 'Normalized design token dictionary for colors, typography, and spacing.',
    },
    {
      path: 'css-variables.css',
      bytes: new TextEncoder().encode(cssVariablesStr).length,
      mimeType: 'text/css',
      role: 'stylesheet',
      description: 'Production-ready CSS custom properties for instant styling integration.',
    },
    {
      path: 'tailwind.config.js',
      bytes: new TextEncoder().encode(tailwindConfigStr).length,
      mimeType: 'application/javascript',
      role: 'tailwind-config',
      description: 'Tailwind CSS theme configuration mapping all extracted tokens.',
    },
    {
      path: 'component-spec.md',
      bytes: new TextEncoder().encode(componentSpecStr).length,
      mimeType: 'text/markdown',
      role: 'component-specifications',
      description: 'Canonical component catalog with variants, slots, props, and states.',
    },
    {
      path: 'reconstruction-spec.md',
      bytes: new TextEncoder().encode(reconstructionSpecStr).length,
      mimeType: 'text/markdown',
      role: 'layout-specifications',
      description: 'Layout tree hierarchy, spacing gaps, dimensions, and responsive rules.',
    },
    {
      path: 'complete-ads-package.json',
      bytes: new TextEncoder().encode(completePackageStr).length,
      mimeType: 'application/json',
      role: 'master-package',
      description: 'Master source-of-truth JSON containing full ADS and UI Blueprint.',
    },
  ];

  // 4. Generate Manifest and Readme
  const readmeDraft = generateAIClonePackageReadme(ads, { generatedAt: new Date().toISOString() } as any);
  const readmeBytes = new TextEncoder().encode(readmeDraft).length;

  fileEntries.push({
    path: 'README.md',
    bytes: readmeBytes,
    mimeType: 'text/markdown',
    role: 'documentation',
    description: 'Reconstruction instructions and recommended AI coding agent prompts.',
  });

  const manifest = generateAIClonePackageManifest(ads, effectiveBlueprint as UIBlueprint, fileEntries);
  const manifestDraft = JSON.stringify(manifest, null, 2);
  const manifestBytes = new TextEncoder().encode(manifestDraft).length;

  fileEntries.push({
    path: 'manifest.json',
    bytes: manifestBytes,
    mimeType: 'application/json',
    role: 'manifest',
    description: 'Package integrity metadata, target URL, and file inventory.',
  });

  manifest.totalFiles = fileEntries.length;
  manifest.totalBytes = fileEntries.reduce((sum, f) => sum + f.bytes, 0);
  manifest.files = fileEntries;

  const manifestStr = JSON.stringify(manifest, null, 2);
  const readmeStr = generateAIClonePackageReadme(ads, manifest);

  files['manifest.json'] = manifestStr;
  files['README.md'] = readmeStr;

  // 5. Pack into ZIP archive
  const zip = new ZipBuilder();
  for (const [path, content] of Object.entries(files)) {
    zip.addFile(path, content);
  }

  const zipBuffer = zip.generateUint8Array();
  const base64 = zip.generateBase64();

  return {
    manifest,
    readme: readmeStr,
    files,
    zipBuffer,
    base64,
  };
}

export class ExportService {
  public static export(
    ads: AgentDesignSpecification,
    blueprint?: UIBlueprint,
    format: string = 'ai-clone-package',
    rawData?: any
  ): {
    format: string;
    exportedData: string;
    isBinary?: boolean;
    base64Data?: string;
    mimeType?: string;
    filename?: string;
    artifacts?: Record<string, string>;
  } {
    const pkg = assembleAIClonePackage(ads, blueprint, rawData);
    const domainSlug = (ads.metadata?.title || 'page')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'page';

    if (format === 'ai-clone-package' || format === 'zip') {
      return {
        format: 'ai-clone-package',
        exportedData: pkg.base64,
        isBinary: true,
        base64Data: pkg.base64,
        mimeType: 'application/zip',
        filename: `ai-clone-package-${domainSlug}.zip`,
        artifacts: pkg.files,
      };
    }

    if (format === 'ads-context') {
      return {
        format: 'ads-context',
        exportedData: pkg.files['ads-context.txt'],
        mimeType: 'text/plain',
        filename: `ads-context-${domainSlug}.txt`,
        artifacts: pkg.files,
      };
    }

    if (format === 'ads-json') {
      return {
        format: 'ads-json',
        exportedData: pkg.files['ads.json'],
        mimeType: 'application/json',
        filename: `ads-${domainSlug}.json`,
        artifacts: pkg.files,
      };
    }

    if (format === 'css') {
      return {
        format: 'css',
        exportedData: pkg.files['css-variables.css'],
        mimeType: 'text/css',
        filename: `css-variables-${domainSlug}.css`,
        artifacts: pkg.files,
      };
    }

    if (format === 'tailwind') {
      return {
        format: 'tailwind',
        exportedData: pkg.files['tailwind.config.js'],
        mimeType: 'application/javascript',
        filename: `tailwind.config-${domainSlug}.js`,
        artifacts: pkg.files,
      };
    }

    if (format === 'tokens') {
      return {
        format: 'tokens',
        exportedData: pkg.files['design-tokens.json'],
        mimeType: 'application/json',
        filename: `design-tokens-${domainSlug}.json`,
        artifacts: pkg.files,
      };
    }

    if (format === 'components') {
      return {
        format: 'components',
        exportedData: pkg.files['component-spec.md'],
        mimeType: 'text/markdown',
        filename: `component-spec-${domainSlug}.md`,
        artifacts: pkg.files,
      };
    }

    if (format === 'reconstruction') {
      return {
        format: 'reconstruction',
        exportedData: pkg.files['reconstruction-spec.md'],
        mimeType: 'text/markdown',
        filename: `reconstruction-spec-${domainSlug}.md`,
        artifacts: pkg.files,
      };
    }

    if (format === 'ads-all' || format === 'all') {
      return {
        format: 'ads-all',
        exportedData: pkg.files['complete-ads-package.json'],
        mimeType: 'application/json',
        filename: `complete-ads-package-${domainSlug}.json`,
        artifacts: pkg.files,
      };
    }

    return {
      format,
      exportedData: pkg.files[format] || pkg.files['ads-context.txt'],
      mimeType: 'text/plain',
      filename: `export-${domainSlug}.txt`,
      artifacts: pkg.files,
    };
  }
}


