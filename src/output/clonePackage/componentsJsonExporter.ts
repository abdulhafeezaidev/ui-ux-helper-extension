import { AnalyzePageResponseData } from '../../types/index.ts';
import { generateComponentLibrary } from '../../normalization/component/componentDetector.ts';
import { detectReusableComponents } from '../../normalization/component/reusableComponentDetector.ts';
import { buildComponentHierarchy } from '../../normalization/component/componentHierarchyEngine.ts';

export function exportComponentsJson(data: AnalyzePageResponseData): string {
  const elements = data.extractionResult?.elements || [];
  const reusableSystem = detectReusableComponents(data);
  const hierarchyTree = buildComponentHierarchy(data);

  // Build blueprint layout tree stub if needed
  const blueprintLayoutTree = {
    id: 'root',
    name: 'Page',
    type: 'page' as const,
    layout: { display: 'block' as const },
    constraints: {},
    children: [],
    evidenceIds: [],
  };

  const compLib = generateComponentLibrary({
    version: '1.0.0',
    target: {
      title: data.title || 'Page',
      url: data.pageUrl || '',
      documentDimensions: {
        width: data.layoutSystem?.viewport.width || 1440,
        height: data.layoutSystem?.viewport.height || 900,
        devicePixelRatio: 1,
      },
    },
    layoutTree: blueprintLayoutTree,
    components: {},
    designTokens: {
      version: '1.0.0',
      colors: [],
      typography: { fontFamilies: [], fontSizes: [], fontWeights: [], lineHeights: [], letterSpacings: [] },
      spacing: [],
      radius: [],
      shadows: [],
      borders: [],
      animations: [],
      opacities: [],
      zIndices: [],
      containerWidths: [],
      breakpoints: [],
      stats: { totalTokens: 0, categoryCounts: {} },
    },
    constraints: {
      viewport: { minWidth: 320, maxWidth: 1920, breakpoints: { mobile: 640, tablet: 768, desktop: 1024, wide: 1280 } },
      rules: [],
    },
    responsiveRules: [],
    interactionModel: { interactions: [] },
    metadata: {
      generator: 'UI-UX Helper',
      blueprintTimestamp: Date.now(),
      totalNodes: elements.length,
      totalReusableComponents: data.componentSystem?.stats?.totalComponents || 0,
      evidenceCoverage: 1.0,
    },
  });

  // Merge in reusable component definitions from ReusableComponentDetector
  reusableSystem.definitions.forEach((def) => {
    const isButton = def.componentName.toLowerCase().includes('button');
    const isBadge = def.componentName.toLowerCase().includes('badge');
    const isNav = def.componentName.toLowerCase().includes('nav');

    const styleRef = isButton ? 'style.button.primary' : isBadge ? 'style.badge.default' : isNav ? 'style.header.navbar' : 'style.surface.card';
    const layoutRef = isNav ? 'layout.flex.navbar' : isButton ? 'layout.container.default' : 'layout.flex.heroCenter';
    const geometryRef = isButton ? 'geometry.button.primary' : isBadge ? 'geometry.badge.sm' : isNav ? 'geometry.header.desktop' : 'geometry.card.standard';
    const interactionRef = isButton ? 'interaction.button.primaryHover' : isBadge ? undefined : 'interaction.card.defaultHover';

    (compLib.components as any)[def.componentName] = {
      id: def.id,
      registryKey: `registry.component.${def.componentName.toLowerCase()}`,
      name: def.componentName,
      role: def.category,
      category: def.category,
      confidence: def.confidence,
      instanceCount: def.instanceCount,
      styleRef,
      layoutRef,
      geometryRef,
      interactionRef,
      variants: def.variants,
      slots: def.slots,
      props: def.props,
      children: def.children,
      geometry: def.geometry,
      responsiveBehaviour: def.responsiveBehaviour,
      states: [
        { name: 'default' },
        { name: 'hover', styleOverrides: { transform: 'translateY(-2px)' } },
        { name: 'active' },
        { name: 'focus' },
      ],
      constraints: {
        aspectRatio: def.geometry.aspectRatio,
      },
      tokens: [
        { property: 'backgroundColor', tokenRef: 'Color.SurfaceBackground', fallbackValue: '#ffffff' },
        { property: 'borderRadius', tokenRef: 'Radius.Medium', fallbackValue: '8px' },
        { property: 'borderColor', tokenRef: 'Color.Border', fallbackValue: '#e5e7eb' },
      ],
      instances: def.sourceElementIds.map((id, idx) => ({
        id: `${def.id}_inst_${idx + 1}`,
        props: def.props.reduce((acc, p) => {
          acc[p.name] = p.sampleValues?.[0] || p.defaultValue || '';
          return acc;
        }, {} as Record<string, any>),
        evidenceIds: [id],
      })),
      templateStructure: def.templatePreview || `<div>${def.componentName}</div>`,
      evidenceIds: def.sourceElementIds,
    };
  });

  // Component Families from Component System
  const families = (data.componentSystem?.families || []).map((f) => ({
    familyId: f.familyId,
    type: f.type,
    instanceCount: f.instanceCount,
    instances: f.instanceElementIds,
    sharedColors: f.sharedColorTokens,
    sharedTypography: f.sharedTypoTokens,
    evidence: f.evidence,
  }));

  const payload = {
    $schema: 'https://ui-ux-helper.internal/schemas/reusable-components-v1.json',
    version: '2.0.0',
    totalComponents: Object.keys(compLib.components).length,
    totalInstances: reusableSystem.totalInstances,
    componentTree: {
      rootId: hierarchyTree.root.id,
      totalNodes: hierarchyTree.treeStats.totalNodes,
      integrity: hierarchyTree.treeStats.integrity,
      tree: hierarchyTree.root,
    },
    components: compLib.components,
    definitions: reusableSystem.definitions,
    reusableComponentSystem: reusableSystem,
    families,
    patterns: data.componentSystem?.patterns || [],
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceTitle: data.title,
      sourceUrl: data.pageUrl,
      averageConfidence: reusableSystem.metadata.averageConfidence,
    },
  };

  return JSON.stringify(payload, null, 2);
}
