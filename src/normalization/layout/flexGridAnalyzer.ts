import {
  RawElementNode,
  FlexLayoutDetail,
  GridLayoutDetail,
  FlexGroupType,
} from '../../types/schema.ts';

export function analyzeFlexLayout(el: RawElementNode): FlexLayoutDetail | null {
  const display = el.display || el.layoutProps.display || '';
  if (display !== 'flex' && display !== 'inline-flex') {
    return null;
  }

  const direction = el.layoutProps.flexDirection || 'row';
  const wrap = el.layoutProps.flexWrap || 'nowrap';
  const justifyContent = el.layoutProps.justifyContent || 'flex-start';
  const alignItems = el.layoutProps.alignItems || 'stretch';
  const rowGap = el.gap?.row || '0px';

  let groupType: FlexGroupType = 'horizontalGroup';

  if (
    justifyContent.includes('center') ||
    alignItems.includes('center')
  ) {
    groupType = 'centeredGroup';
  } else if (
    justifyContent.includes('space-between') ||
    justifyContent.includes('space-around') ||
    justifyContent.includes('space-evenly')
  ) {
    groupType = 'distributedGroup';
  } else if (direction.includes('column')) {
    groupType = 'verticalGroup';
  }

  return {
    elementId: el.id,
    direction,
    wrap,
    justifyContent,
    alignItems,
    gap: rowGap,
    groupType,
    childCount: el.childIds.length,
  };
}

export function analyzeGridLayout(el: RawElementNode): GridLayoutDetail | null {
  const display = el.display || el.layoutProps.display || '';
  if (display !== 'grid' && display !== 'inline-grid') {
    return null;
  }

  const columns = el.layoutProps.gridTemplateColumns || 'none';
  const rows = el.layoutProps.gridTemplateRows || 'none';
  const gap = el.gap?.column || el.gap?.row || '0px';

  // Count columns from template space-separated track values
  let columnCount = 1;
  if (columns !== 'none' && columns.length > 0) {
    columnCount = columns.split(/\s+/).filter((c) => c.length > 0).length;
  }

  let rowCount = 1;
  if (rows !== 'none' && rows.length > 0) {
    rowCount = rows.split(/\s+/).filter((r) => r.length > 0).length;
  }

  return {
    elementId: el.id,
    columns,
    rows,
    columnCount,
    rowCount,
    gap,
    childCount: el.childIds.length,
  };
}
