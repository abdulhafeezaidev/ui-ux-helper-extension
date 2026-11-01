import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildLayoutConstraintSystem } from '../../normalization/layout/layoutConstraintEngine.ts';
import { buildResponsiveIntelligenceSystem, STANDARD_BREAKPOINTS } from '../../normalization/layout/responsiveIntelligenceEngine.ts';

export function exportLayoutJson(data: AnalyzePageResponseData): string {
  const layoutConstraintSys = buildLayoutConstraintSystem(data);
  const responsiveSys = buildResponsiveIntelligenceSystem(data);
  const layoutSys = data.layoutSystem;

  // Grid Layouts
  const grids = (layoutSys?.gridLayouts || []).map((g, idx) => ({
    registryKey: g.columnCount === 4 ? 'layout.grid.products4' : g.columnCount === 3 ? 'layout.grid.features3' : `layout.grid.custom_${idx + 1}`,
    elementId: g.elementId,
    columnCount: g.columnCount,
    rowCount: g.rowCount,
    columnsTemplate: g.columns,
    rowsTemplate: g.rows,
    gap: g.gap,
    columnGap: g.columnGap || g.gap,
    rowGap: g.rowGap || g.gap,
    flow: g.flow || 'grid',
    trackWidths: g.trackWidths || [],
    alignment: g.alignment || 'stretch',
  }));

  // Flex Layouts
  const flexContainers = (layoutSys?.flexLayouts || []).map((f, idx) => ({
    registryKey: f.groupType === 'horizontalGroup' ? 'layout.flex.navbar' : f.groupType === 'centeredGroup' ? 'layout.flex.heroCenter' : `layout.flex.group_${idx + 1}`,
    elementId: f.elementId,
    direction: f.direction,
    wrap: f.wrap,
    justifyContent: f.justifyContent,
    alignItems: f.alignItems,
    gap: f.gap,
    groupType: f.groupType,
    childCount: f.childCount,
  }));

  // Spatial alignment relations
  const spatialRelations = (layoutSys?.spatialRelations || []).slice(0, 50).map((r) => ({
    sourceId: r.sourceId,
    targetId: r.targetId,
    relation: r.relation,
  }));

  const payload = {
    $schema: 'https://ui-ux-helper.internal/schemas/layout-v1.json',
    version: '2.0.0',
    viewport: layoutConstraintSys.viewport,
    totalContainers: layoutConstraintSys.totalContainers,
    summary: layoutConstraintSys.summary,
    responsiveRules: layoutConstraintSys.responsiveBreakpoints,
    responsiveBreakpoints: layoutConstraintSys.responsiveBreakpoints,
    responsiveIntelligence: {
      standardBreakpoints: [...STANDARD_BREAKPOINTS],
      testedBreakpoints: responsiveSys.testedBreakpoints,
      breakpointSnapshots: responsiveSys.breakpointSnapshots,
      transformations: responsiveSys.transformations,
      componentTreeMapping: responsiveSys.componentTreeMapping,
    },
    containers: layoutConstraintSys.containers,
    layoutConstraintSystem: {
      viewport: layoutConstraintSys.viewport,
      totalContainers: layoutConstraintSys.totalContainers,
      summary: layoutConstraintSys.summary,
      responsiveBreakpoints: layoutConstraintSys.responsiveBreakpoints,
      metadata: layoutConstraintSys.metadata,
    },
    gridLayouts: grids,
    flexLayouts: flexContainers,
    spatialRelations,
    stats: {
      totalContainers: layoutConstraintSys.totalContainers,
      gridCount: grids.length,
      flexCount: flexContainers.length,
      relationCount: spatialRelations.length,
    },
    metadata: {
      ...layoutConstraintSys.metadata,
      version: '2.0.0',
    },
  };

  return JSON.stringify(payload, null, 2);
}
