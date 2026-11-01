import { AnalyzePageResponseData, RawElementNode } from '../../types/index.ts';
import { buildAgentDesignSpecification } from '../../agent-spec/index.ts';
import { computeCloneConfidenceScore } from '../../normalization/fidelity/cloneConfidenceCalculator.ts';

export interface ReconstructionTreeNode {
  id: string;
  name: string;
  type: string;
  tagName: string;
  role: string | null;
  depth: number;
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  layout: {
    display: string;
    position: string;
    zIndex: string;
    flexDirection?: string;
    justifyContent?: string;
    alignItems?: string;
    gap?: { row: string; column: string };
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
  };
  textSnippet?: string;
  componentRef?: string;
  children: ReconstructionTreeNode[];
}

export function exportReconstructionJson(data: AnalyzePageResponseData): string {
  const ads = buildAgentDesignSpecification(data);
  const cloneScores = computeCloneConfidenceScore(data);
  const elements = data.extractionResult?.elements || [];
  const elMap = new Map<string, RawElementNode>(elements.map((e) => [e.id, e]));

  const viewportWidth = data.extractionResult?.pageMeta.viewport.width || data.layoutSystem?.viewport.width || 1440;
  const viewportHeight = data.extractionResult?.pageMeta.viewport.height || data.layoutSystem?.viewport.height || 900;
  const dpr = data.extractionResult?.pageMeta.devicePixelRatio || 1;

  // Build recursive element tree from root
  const rootElements = elements.filter((e) => !e.parentId || !elMap.has(e.parentId));

  function buildSubtree(el: RawElementNode, depth = 0): ReconstructionTreeNode {
    const children: ReconstructionTreeNode[] = [];
    if (Array.isArray(el.childIds)) {
      for (const cId of el.childIds) {
        const childNode = elMap.get(cId);
        if (childNode) {
          children.push(buildSubtree(childNode, depth + 1));
        }
      }
    }

    let detectedType = 'atomic';
    if (depth === 0) detectedType = 'page_root';
    else if (['header', 'nav', 'main', 'section', 'footer', 'aside'].includes(el.tagName)) detectedType = 'region';
    else if (el.display === 'flex' || el.display === 'grid') detectedType = 'container';

    // Check if component candidate attached
    let compRef: string | undefined;
    if (data.componentSystem?.components) {
      const match = data.componentSystem.components.find((c) => c.rootElementId === el.id);
      if (match) {
        compRef = match.type;
        detectedType = 'component_instance';
      }
    }

    return {
      id: el.id,
      name: `${el.tagName.toLowerCase()}${el.className ? `.${el.className.split(' ')[0]}` : ''}`,
      type: detectedType,
      tagName: el.tagName,
      role: el.role || null,
      depth,
      boundingRect: el.boundingRect,
      layout: {
        display: el.display,
        position: el.position,
        zIndex: el.zIndex,
        flexDirection: el.layoutProps?.flexDirection,
        justifyContent: el.layoutProps?.justifyContent,
        alignItems: el.layoutProps?.alignItems,
        gap: el.gap,
        gridTemplateColumns: el.layoutProps?.gridTemplateColumns,
        gridTemplateRows: el.layoutProps?.gridTemplateRows,
      },
      textSnippet: el.textMeta?.hasText ? el.textMeta.trimmedText.substring(0, 80) : undefined,
      componentRef: compRef,
      children,
    };
  }

  const pageTree: ReconstructionTreeNode[] = rootElements.map((r) => buildSubtree(r, 0));

  const packageArtifacts = [
    { file: '01_reconstruction.json', role: 'Canonical Master Reconstruction Model & Single Source of Truth' },
    { file: '02_components.json', role: 'Merged Component Hierarchy, Reusable Definitions, Props & Variants' },
    { file: '03_design-system.json', role: 'Merged Design Tokens, Semantic Color Palettes, Typography Scale & Token Mappings' },
    { file: '04_layout.json', role: 'Containers, CSS Grid Tracks, Flexbox Alignments & Multi-Breakpoint Rules' },
    { file: '05_behavior.json', role: 'Interactions, State Machines, Overlay Constraints, Animations & Keyframes' },
    { file: '06_assets.json', role: 'SVG Vectors, Image Aspect Ratios, Logos & Font Definitions' },
    { file: '07_accessibility.json', role: 'ARIA Semantics, Landmarks, Heading Outline, Tab Order & Focus Traps' },
    { file: '08_evidence.json', role: 'DOM Selectors, Provenance Traceability & Audit Verification Scores' },
    { file: '09_styles/css-variables.css', role: 'Native CSS Custom Properties Stylesheet' },
    { file: '09_styles/tailwind.config.js', role: 'Tailwind CSS Theme Configuration Extension' },
    { file: '10_README_FOR_AI.md', role: 'Comprehensive AI Reconstruction Guide & Master Coding Prompt' },
    { file: '11_render_tree.json', role: 'Browser Visual Paint Order, Stacking Context Hierarchy, z-Index & Layer Compositing' },
    { file: '12_constraints.json', role: 'Relational Browser Layout Constraints (Flex, Grid, Box Model, Insets & Sizing Rules)' },
    { file: '13_responsive.json', role: 'Responsive Transition Engine (7 Viewport Snapshots, Step-by-Step Transition Graph & Tailwind Breakpoints)' },
    { file: '14_typography.json', role: 'Typography Rhythm Engine (Display, H1-H4, Body, Baseline 4px/8px Grid, Vertical Margins & Reading Widths)' },
    { file: '15_variants.json', role: 'Component Variant Engine (Primary, Secondary, Outlined, Ghost, Filled, Elevated, Sizes, States & CVA)' },
    { file: '16_motion.json', role: 'Motion Timeline Engine (Hover, Stagger, Scroll, Modal & Drawer Timelines + Framer Motion Code)' },
    { file: '17_content.json', role: 'Content Semantic Engine (20 Semantic Roles, Purpose, Importance, SEO Relevance & Evidence)' },
    { file: '18_reconstruction_graph.json', role: 'Master AI Reconstruction Dependency Graph (Single Source of Truth, Topological Build Order & References)' },
  ];

  // Map reusable component instances to element IDs
  const rawSections = data.componentSystem?.sections || [];
  const reusableDefMap = new Map<string, { name: string; instanceId: string }>();

  // Detect reusable components for accurate instance IDs
  const candidateComponents = data.componentSystem?.components || [];
  candidateComponents.forEach((c) => {
    const category = c.type.toLowerCase();
    const instId = `comp_${category}_inst_${c.id.replace(/\D/g, '') || '1'}`;
    reusableDefMap.set(c.id, { name: c.type, instanceId: instId });
    if (c.rootElementId) {
      reusableDefMap.set(c.rootElementId, { name: c.type, instanceId: instId });
    }
  });

  const reconstructionPayload = {
    $schema: 'https://ui-ux-helper.internal/schemas/reconstruction-v2.json',
    version: '2.0.0',
    project: {
      title: data.title || ads.metadata?.title || 'Web Application',
      url: data.pageUrl || ads.metadata?.pageUrl || '',
      generatedAt: new Date().toISOString(),
      extractor: 'UI/UX Helper AI Website Reverse Engineering Engine',
    },
    cloneConfidence: cloneScores,
    packageManifest: {
      totalArtifacts: packageArtifacts.length,
      artifacts: packageArtifacts,
    },
    target: {
      title: data.title || ads.metadata?.title || 'Web Application',
      url: data.pageUrl || ads.metadata?.pageUrl || '',
      viewport: {
        width: viewportWidth,
        height: viewportHeight,
        devicePixelRatio: dpr,
        documentHeight: data.layoutSystem?.viewport.documentHeight || viewportHeight,
      },
      responsiveBreakpoints: [1920, 1600, 1440, 1280, 1024, 768, 480, 375],
    },
    regions: rawSections.map((s, idx) => ({
      index: idx + 1,
      id: s.id,
      elementId: s.elementId,
      purpose: s.sectionType,
      confidence: s.confidence,
      evidence: s.evidence,
      componentIds: s.componentIds.map((cid) => reusableDefMap.get(cid)?.instanceId || cid),
    })),
    sections: rawSections.map((s, idx) => {
      const resolvedInstanceIds = s.componentIds.map((cid) => reusableDefMap.get(cid)?.instanceId || cid);
      const componentRefs = Array.from(
        new Set(
          s.componentIds
            .map((cid) => reusableDefMap.get(cid)?.name)
            .filter(Boolean) as string[]
        )
      );

      return {
        orderIndex: idx + 1,
        id: s.id,
        semanticId: `sec_${s.sectionType.toLowerCase()}_${idx + 1}`,
        elementId: s.elementId,
        purpose: s.sectionType,
        confidence: s.confidence,
        evidence: s.evidence,
        componentIds: resolvedInstanceIds,
        componentRefs: componentRefs.length > 0 ? componentRefs : [s.sectionType],
        layoutRef: s.sectionType.toLowerCase().includes('hero') ? 'layout.flex.heroCenter' : 'layout.container.default',
        styleRef: s.sectionType.toLowerCase().includes('footer') ? 'style.footer.standard' : undefined,
      };
    }),
    semanticRegionTree: ads.semanticRegionTree || null,
    reconstructionDependencyGraph: [
      { step: 1, stage: 'tokens', description: 'Initialize tokens and theme variables' },
      { step: 2, stage: 'styles', description: 'Register typography and surface styles' },
      { step: 3, stage: 'layouts', description: 'Construct container and grid layouts' },
      { step: 4, stage: 'components', description: 'Build reusable component library' },
      { step: 5, stage: 'sections', description: 'Assemble sections into semantic regions' },
      { step: 6, stage: 'page', description: 'Compose master page tree' },
      { step: 7, stage: 'interactions', description: 'Wire state machines and micro-interactions' },
      { step: 8, stage: 'animations', description: 'Attach motion keyframes and transition curves' },
    ],
    pageTree: pageTree.length === 1 ? pageTree[0] : { id: 'root_container', name: 'body', type: 'page_root', depth: 0, children: pageTree },
    metadata: {
      totalElementsExtracted: elements.length,
      visibleElementsCount: elements.filter((e) => e.isVisible).length,
      generatedAt: new Date().toISOString(),
      version: '2.0.0',
    },
  };

  return JSON.stringify(reconstructionPayload, null, 2);
}
