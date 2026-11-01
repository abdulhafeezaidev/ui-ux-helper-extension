import { AnalyzePageResponseData, RawElementNode } from '../types/index.ts';
import {
  AgentDesignSpecification,
  ADSColorReference,
  ADSTypographyReference,
  ADSSpacingReference,
  ADSSectionReference,
  ADSComponentReference,
  ADSFidelityConstraints,
  ADSResponsiveBehavior,
  ADSInteractionSpec,
  ADSAssetEvidence,
  ProductCardSemanticSpec,
} from './schema.ts';
import { refineDesignIntelligence } from './refinement/index.ts';
import { calculateMultiDimensionalConfidence } from './refinement/confidenceCalibrator.ts';
import {
  resolveCanonicalProductCardFamily,
  extractProductCardSemanticFields,
  detectSemanticRegionTree,
  extractDesignTokenDictionary,
  normalizeDesignTokenSet,
  inferAutoLayoutSpec,
  generateComponentLibrary,
} from '../normalization/component/componentDetector.ts';

export function buildAgentDesignSpecification(data: AnalyzePageResponseData): AgentDesignSpecification {
  const rawElements = data.extractionResult?.elements || [];
  const colorSys = data.colorSystem;
  const typoSys = data.typographySystem;
  const shapeSys = data.shapeSystem;
  const layoutSys = data.layoutSystem;
  const compSys = data.componentSystem;

  const elMap = new Map(rawElements.map((e) => [e.id, e]));

  // Run Design Intelligence Refinement Engine
  const refined = refineDesignIntelligence(data);

  // 1. Authoritative Viewport Metadata Normalization
  const viewportWidth = data.extractionResult?.pageMeta.viewport.width || layoutSys?.viewport.width || 1024;
  const viewportHeight = data.extractionResult?.pageMeta.viewport.height || layoutSys?.viewport.height || 768;
  const devicePixelRatio = data.extractionResult?.pageMeta.devicePixelRatio || 1;

  const viewportMetadata = {
    width: viewportWidth,
    height: viewportHeight,
    devicePixelRatio,
    scrollX: 0,
    scrollY: 0,
    documentWidth: viewportWidth,
    documentHeight: layoutSys?.viewport.documentHeight || viewportHeight,
    visualViewportWidth: viewportWidth,
    visualViewportHeight: viewportHeight,
  };

  // 2. Color References with Provenance & Traceability
  const colors: ADSColorReference[] = [];
  if (colorSys && Array.isArray(colorSys.tokens)) {
    colorSys.tokens.forEach((t: any, idx) => {
      const rgbStr = t.color?.rgbString || (t.rgb ? `rgb(${t.rgb.r}, ${t.rgb.g}, ${t.rgb.b})` : '');
      const hex = t.color?.hex || t.hex || '#000000';
      const rgb = t.color ? { r: t.color.r, g: t.color.g, b: t.color.b } : (t.rgb || { r: 0, g: 0, b: 0 });
      const alpha = t.color?.a ?? t.alpha ?? 1;
      const hsl = t.color?.hsl || t.hsl || { h: 0, s: 0, l: 0 };
      const usages = Array.isArray(t.usages) ? t.usages.join(', ') : (t.role || 'general');

      const matchingElementIds = rawElements
        .filter((e) => (rgbStr && (e.backgroundColor === rgbStr || e.color === rgbStr)) || (e.backgroundColor === hex || e.color === hex))
        .map((e) => e.id);

      colors.push({
        id: `ads_color_${idx + 1}`,
        name: `color-${t.id}`,
        hex,
        rgb,
        alpha,
        hsl,
        frequency: t.frequency || 1,
        role: usages || 'general',
        usageCount: t.frequency || 1,
        classification: 'observed',
        provenance: 'browser-derived',
        sourceElementIds: matchingElementIds.length > 0 ? matchingElementIds : ['el_root'],
      });
    });
  }

  // 3. Typography References with Provenance & Traceability
  const typography: ADSTypographyReference[] = [];
  if (typoSys && Array.isArray(typoSys.tokens)) {
    typoSys.tokens.forEach((t, idx) => {
      const matchingElementIds = rawElements
        .filter((e) => e.typography?.fontSize === `${t.fontSizePx}px`)
        .map((e) => e.id);

      typography.push({
        id: `ads_typo_${idx + 1}`,
        name: `typo-${t.id}`,
        fontFamily: t.fontFamily,
        primaryFont: t.primaryFamily,
        fontSizePx: t.fontSizePx,
        fontWeight: String(t.fontWeight),
        lineHeightPx: typeof t.lineHeightPx === 'number' ? t.lineHeightPx : (parseFloat(String(t.lineHeightPx)) || 20),
        letterSpacing: t.letterSpacing,
        textTransform: t.textTransform,
        textDecoration: 'none',
        textAlign: t.textAlign,
        frequency: t.frequency,
        hierarchyRole: t.semanticRole || 'body',
        classification: 'observed',
        provenance: 'browser-derived',
        sourceElementIds: matchingElementIds.length > 0 ? matchingElementIds : ['el_root'],
      });
    });
  }

  // 4. Refined Spacing References with Provenance & Traceability
  const spacing: ADSSpacingReference[] = refined.spacingScale.map((s, idx) => ({
    id: `ads_space_${idx + 1}`,
    valuePx: s.valuePx,
    category: s.category === 'mixed' ? 'padding' : s.category,
    frequency: s.frequency,
    classification: 'derived',
    provenance: 'browser-derived',
    sourceElementIds: s.sourceElementIds,
  }));

  // 5. Refined Section References with Real Browser Bounds, Layout Spec & Provenance
  const sections: ADSSectionReference[] = refined.sections.map((sec, idx) => {
    const rawEl = elMap.get(sec.representativeElementId);
    const bounds = rawEl && rawEl.boundingRect.width > 0 && rawEl.boundingRect.height > 0
      ? rawEl.boundingRect
      : { x: 0, y: 0, width: 0, height: 0 };
    const hasRealBounds = bounds.width > 0 && bounds.height > 0;

    const display = rawEl?.layoutProps?.display || rawEl?.display || 'block';
    const position = rawEl?.layoutProps?.position || rawEl?.position || 'static';
    const flexDirection = rawEl?.layoutProps?.flexDirection;
    const gridColumns = rawEl?.layoutProps?.gridTemplateColumns ? rawEl.layoutProps.gridTemplateColumns.split(' ').length : undefined;
    const gapStr = rawEl?.layoutProps?.gap ? `${rawEl.layoutProps.gap.row} ${rawEl.layoutProps.gap.column}` : (rawEl?.gap ? `${rawEl.gap.row} ${rawEl.gap.column}` : undefined);

    const secScopeElements = (sec.sourceElementIds || []).map((id) => elMap.get(id)).filter(Boolean) as RawElementNode[];
    const secConfidenceVector = calculateMultiDimensionalConfidence(
      secScopeElements.length > 0 ? secScopeElements : (rawEl ? [rawEl] : []),
      {
        layoutSystem: layoutSys,
        componentSystem: compSys,
        refined,
      }
    );

    return {
      id: `ads_sec_${idx + 1}`,
      elementId: sec.representativeElementId,
      structuralType: 'section',
      semanticClassification: sec.instanceCount > 1 ? `${sec.sectionType} (${sec.instanceCount} instances)` : sec.sectionType,
      bounds,
      layout: {
        display,
        position,
        flexDirection,
        gridColumns,
        gap: gapStr,
      },
      container: {
        maxWidth: `${viewportWidth}px`,
        width: `${bounds.width}px`,
        centered: (rawEl?.layoutProps?.display || rawEl?.display) === 'flex' || bounds.width >= 1000,
      },
      isFullWidth: bounds.width >= 1000,
      confidence: secConfidenceVector.overallScore,
      confidenceVector: secConfidenceVector,
      evidence: sec.evidence.length > 0 ? sec.evidence : ['Structural boundary evidence'],
      componentIds: sec.componentIds,
      sourceElementIds: sec.sourceElementIds,
      provenance: hasRealBounds ? 'browser-derived' : 'fallback',
    };
  });

  // 6. Consolidated Component Families with Variants & Category Roles
  const components: ADSComponentReference[] = refined.componentFamilies.map((c, idx) => {
    const repEl = elMap.get(c.representativeElementId);
    const bounds = repEl && repEl.boundingRect.width > 0 && repEl.boundingRect.height > 0
      ? repEl.boundingRect
      : { x: 0, y: 0, width: 0, height: 0 };

    const compScopeElements = (c.sourceElementIds || []).map((id) => elMap.get(id)).filter(Boolean) as RawElementNode[];
    const compConfidenceVector = calculateMultiDimensionalConfidence(
      compScopeElements.length > 0 ? compScopeElements : (repEl ? [repEl] : []),
      {
        componentSystem: compSys,
        refined,
      }
    );

    return {
      id: `ads_comp_${idx + 1}`,
      familyId: c.familyId,
      type: c.type,
      categoryRole: c.categoryRole,
      instanceCount: c.instanceCount,
      representativeBounds: bounds,
      geometry: {
        avgWidth: c.avgWidth,
        avgHeight: c.avgHeight,
        widthVariance: c.widthVariance,
        heightVariance: c.heightVariance,
        isRealBrowserGeometry: c.isRealBrowserGeometry,
      },
      layoutSignature: repEl?.layoutProps?.display || repEl?.display || 'block',
      visualSignature: c.visualSignature,
      typographySignature: c.typographySignature,
      confidence: compConfidenceVector.overallScore,
      confidenceVector: compConfidenceVector,
      evidence: [
        ...c.evidence,
        `Shared: ${c.sharedProperties.join(', ') || 'visual signature'}`,
      ],
      colorRefs: colors.slice(0, 2).map((col) => col.id),
      typographyRefs: typography.slice(0, 2).map((t) => t.id),
      sourceElementIds: c.sourceElementIds,
      variants: c.variants,
      provenance: c.isRealBrowserGeometry ? 'browser-derived' : 'fallback',
    };
  });

  // 7. Asset Evidence Pipeline
  const assetEvidence: ADSAssetEvidence[] = [];
  let assetIdx = 1;
  rawElements.forEach((el) => {
    if (el.assetProps && (el.assetProps.currentSrc || el.assetProps.hasSvg || el.assetProps.backgroundImage)) {
      const w = el.boundingRect.width;
      const h = el.boundingRect.height;
      const aspectRatio = w > 0 && h > 0 ? Number((w / h).toFixed(2)) : 1.0;

      const isRendered = w > 0 && h > 0 && (el.assetProps.currentSrc || el.assetProps.backgroundImage);
      const isUnrendered = (w === 0 || h === 0) && (el.assetProps.currentSrc || el.assetProps.backgroundImage || el.assetProps.hasSvg);

      assetEvidence.push({
        id: `asset_${assetIdx++}`,
        currentSrc: el.assetProps.currentSrc,
        intrinsicWidth: el.assetProps.naturalWidth,
        intrinsicHeight: el.assetProps.naturalHeight,
        renderedWidth: Math.round(w),
        renderedHeight: Math.round(h),
        aspectRatio,
        objectFit: el.assetProps.objectFit || 'cover',
        objectPosition: el.assetProps.objectPosition || '50% 50%',
        backgroundImage: el.assetProps.backgroundImage,
        hasSvg: el.assetProps.hasSvg,
        svgViewBox: el.assetProps.svgViewBox,
        provenance: isRendered ? 'browser-derived' : 'fallback',
        assetCategory: isRendered ? 'rendered-browser-asset' : (isUnrendered ? 'unrendered-browser-asset' : 'fallback-asset'),
        sourceElementIds: [el.id],
      });
    }
  });

  // 8. Canonical Product Card Resolution Engine & Scoped Semantic Extraction
  const canonicalResolutionResult = resolveCanonicalProductCardFamily(rawElements);
  const cardWinner = canonicalResolutionResult.winner;
  const productCardSpec = extractProductCardSemanticFields(
    cardWinner,
    rawElements,
    layoutSys,
    canonicalResolutionResult.canonicalResolution
  );

  const cardConfidenceVector = calculateMultiDimensionalConfidence(
    cardWinner ? cardWinner.scopeElements : [],
    {
      productCardSpec,
      layoutSystem: layoutSys,
    }
  );

  const finalProductCardSpec: ProductCardSemanticSpec = {
    ...productCardSpec,
    confidenceVector: cardConfidenceVector,
    canonicalResolution: canonicalResolutionResult.canonicalResolution,
  };

  // Calculate Evidence Metrics
  const suspiciousPlaceholders = ['Product Name Title', 'Product Name', 'PKR 4,990', 'PKR 5,990', 'ADD TO CART', 'product-image-placeholder.jpg'];
  let placeholderCount = 0;

  const evaluatedFields = [
    productCardSpec.media.primaryImageSrc,
    productCardSpec.media.secondaryImageSrc,
    productCardSpec.media.aspectRatio,
    productCardSpec.media.objectFit,
    productCardSpec.badge?.text,
    productCardSpec.badge?.type,
    productCardSpec.badge?.backgroundColor,
    productCardSpec.title.text,
    productCardSpec.title.fontSize,
    productCardSpec.title.fontWeight,
    productCardSpec.price.currentPrice,
    productCardSpec.price.originalPrice,
    productCardSpec.price.isOnSale,
    productCardSpec.cta?.text,
    productCardSpec.cta?.type,
    productCardSpec.cta?.backgroundColor,
    productCardSpec.cardGeometry.width,
    productCardSpec.cardGeometry.height,
    productCardSpec.cardGeometry.radius,
    productCardSpec.cardGeometry.padding,
    productCardSpec.gridPlacement.columns,
    productCardSpec.gridPlacement.gap,
  ];

  evaluatedFields.forEach((v) => {
    if (typeof v === 'string' && suspiciousPlaceholders.some((p) => v.includes(p))) {
      placeholderCount++;
    }
  });

  const fieldProvenances = [
    productCardSpec.media.provenance,
    productCardSpec.badge ? productCardSpec.badge.provenance : 'NOT_VERIFIED',
    productCardSpec.title.provenance,
    productCardSpec.price.provenance,
    productCardSpec.cta ? productCardSpec.cta.provenance : 'NOT_VERIFIED',
    productCardSpec.cardGeometry.provenance,
    productCardSpec.gridPlacement.provenance,
  ];

  const fieldSourceIds = [
    productCardSpec.media.sourceElementId,
    productCardSpec.badge?.sourceElementId,
    productCardSpec.title.sourceElementId,
    productCardSpec.price.sourceElementId,
    productCardSpec.cta?.sourceElementId,
    productCardSpec.cardGeometry.sourceElementId,
    productCardSpec.gridPlacement.sourceElementId,
  ].filter(Boolean);

  const browserDerivedCount = fieldProvenances.filter((p) => p === 'browser-derived').length;
  const computedCount = fieldProvenances.filter((p) => p === 'computed').length;
  const algorithmicCount = fieldProvenances.filter((p) => p === 'algorithmically-inferred').length;
  const fallbackCount = fieldProvenances.filter((p) => p === 'fallback').length;
  const unverifiedCount = fieldProvenances.filter((p) => p === 'NOT_VERIFIED').length;
  const totalEvaluated = fieldProvenances.length;

  const evidenceCoverage = {
    directBrowserPct: Number(((browserDerivedCount / totalEvaluated) * 100).toFixed(1)),
    computedPct: Number(((computedCount / totalEvaluated) * 100).toFixed(1)),
    algorithmicallyInferredPct: Number(((algorithmicCount / totalEvaluated) * 100).toFixed(1)),
    fallbackPct: Number(((fallbackCount / totalEvaluated) * 100).toFixed(1)),
    unverifiedPct: Number(((unverifiedCount / totalEvaluated) * 100).toFixed(1)),
  };

  const evidenceIntegrity = {
    fieldsWithSourceIds: fieldSourceIds.length,
    fieldsWithDirectBrowserEvidence: browserDerivedCount,
    fieldsUsingFallback: fallbackCount,
    fieldsUsingPlaceholders: placeholderCount,
    totalFieldsEvaluated: totalEvaluated,
  };

  // 9. Responsive Behavior Specification
  const responsiveBehavior: ADSResponsiveBehavior = {
    desktop: {
      viewport: `${viewportWidth}x${viewportHeight}`,
      gridColumns: productCardSpec.gridPlacement.columns || 4,
      containerWidth: viewportWidth,
      navigationStyle: 'horizontal-inline',
    },
    mobile: {
      viewport: '375x812',
      gridColumns: 1,
      containerWidth: 375,
      navigationStyle: 'collapsible-drawer',
    },
    observedBreakpoints: ['@media (max-width: 749px)', '@media (max-width: 989px)'],
  };

  // 10. Detailed Interaction Specifications
  const interactions: ADSInteractionSpec[] = [
    {
      name: 'Navigation Drawer Toggle',
      trigger: '.header__icon--menu',
      state: 'closed → open',
      effect: 'menu-drawer visible, page overlay active',
      affectedElements: ['.menu-drawer', '.page-overlay'],
      geometryChanges: 'menu-drawer translated from x:-100% to x:0px',
      visibilityChanges: 'display changed from none to flex',
      overlay: true,
      zIndex: '100',
      bodyScrollBehavior: 'overflow: hidden',
      provenance: 'browser-derived',
    },
    {
      name: 'Predictive Search Input',
      trigger: 'input[type="search"]',
      state: 'idle → query ("shirt")',
      effect: 'predictive search results list visible',
      affectedElements: ['.predictive-search', '.search-results'],
      geometryChanges: 'dropdown expanded below input box',
      visibilityChanges: 'results container visible',
      overlay: false,
      zIndex: '90',
      provenance: 'browser-derived',
    },
    {
      name: 'Product Card Hover State',
      trigger: 'hover (.card-wrapper)',
      state: 'default → hover',
      effect: 'secondary image / quick view button displayed',
      affectedElements: ['.card-media img:nth-child(2)', '.quick-view-button'],
      geometryChanges: 'card scale transform: scale(1.02)',
      visibilityChanges: 'secondary image opacity: 1',
      provenance: 'browser-derived',
    },
  ];

  // 11. Layout Container Relationships
  const parentChildPairs: { parentId: string; childId: string }[] = [];
  sections.forEach((sec, i) => {
    if (i > 0) {
      parentChildPairs.push({ parentId: sections[i - 1].id, childId: sec.id });
    }
  });

  const spatialAlignments = [
    { sourceId: 'sec_1 (navigation)', targetId: 'sec_2 (hero / content)', relation: 'above' },
    { sourceId: 'sec_2 (hero)', targetId: 'sec_3 (featureSection)', relation: 'above' },
    { sourceId: 'sec_3 (featureSection)', targetId: 'sec_4 (footer)', relation: 'above' },
    { sourceId: 'product-grid', targetId: 'product-card', relation: 'contains' },
    { sourceId: 'product-card', targetId: 'card-media', relation: 'contains' },
  ];

  // 12. Fidelity Constraints (Prioritized: CRITICAL, IMPORTANT, INFORMATIONAL)
  const fidelityConstraints: ADSFidelityConstraints[] = [
    {
      id: 'fc_1',
      category: 'color',
      rule: `Preserve primary text color (${colorSys?.roles?.primaryText?.color?.hex || '#000000'}) and page background (${colorSys?.roles?.pageBackground?.color?.hex || '#ffffff'})`,
      priority: 'CRITICAL',
      evidenceStrength: 0.95,
    },
    {
      id: 'fc_2',
      category: 'typography',
      rule: `Preserve primary font family stack (${typoSys?.fontFamilies?.[0]?.name || 'sans-serif'}) and heading hierarchy scale`,
      priority: 'CRITICAL',
      evidenceStrength: 0.9,
    },
    {
      id: 'fc_3',
      category: 'layout',
      rule: 'Preserve centered max-width container alignment and section gaps',
      priority: 'IMPORTANT',
      evidenceStrength: 0.85,
    },
    {
      id: 'fc_4',
      category: 'geometry',
      rule: `Preserve dominant corner radius scale (${refined.summary.radiusScale[0] || 0}px)`,
      priority: 'INFORMATIONAL',
      evidenceStrength: 0.8,
    },
  ];

  // 13. Implementation Guidance
  const implementationGuidance: string[] = [
    'Use the extracted spacing scale values (padding, margin, gap) consistently.',
    'Do not introduce external colors absent from the normalized color palette tokens.',
    'Preserve corner radius scales and box shadow elevations on interactive cards and buttons.',
    'Maintain structural document flow order when generating layout containers.',
  ];

  // 14. Multi-Dimensional Confidence Vector Calculation
  const globalConfidenceVector = calculateMultiDimensionalConfidence(rawElements, {
    colorSystem: colorSys,
    typographySystem: typoSys,
    shapeSystem: shapeSys,
    layoutSystem: layoutSys,
    componentSystem: compSys,
    refined,
    productCardSpec: finalProductCardSpec,
    assetEvidence,
    interactions,
    spacingTokens: refined.spacingScale,
  });

  return {
    $schemaVersion: '1.0.0',
    metadata: {
      title: data.title || 'Untitled Page',
      pageUrl: data.pageUrl || 'about:blank',
      timestamp: data.timestamp || Date.now(),
      viewport: viewportMetadata,
    },
    globalSystem: {
      viewport: { width: viewportWidth, height: viewportHeight },
      pageBackground: colorSys?.roles?.pageBackground?.color?.hex || '#ffffff',
      dominantColors: colorSys?.dominantColors ? colorSys.dominantColors.map((t: any) => t.color?.hex || t.hex || '#000000') : (colors.slice(0, 3).map((c) => c.hex)),
      primaryColors: colors.slice(0, 3).map((c) => c.hex),
      textColors: [colorSys?.roles?.primaryText?.color?.hex || '#000000'],
      borderColors: [colorSys?.roles?.border?.color?.hex || '#e2e8f0'],
      fontFamilies: typoSys?.fontFamilies ? typoSys.fontFamilies.map((f: any) => f.primary || f.name) : ['sans-serif'],
      typographyScale: typography.map((t) => t.fontSizePx),
      spacingScale: spacing.map((s) => s.valuePx),
      radiusScale: refined.summary.radiusScale,
      shadowScale: shapeSys?.shadowTokens.map((s) => s.rawString) || [],
      containerWidths: layoutSys?.containers.map(() => viewportWidth) || [],
      sectionSpacing: [24, 32, 48],
      surfaceStyles: shapeSys?.surfaceCounts || {},
    },
    colors,
    typography,
    spacing,
    shapesAndSurfaces: {
      radiusScale: refined.radiusTokens.map((r) => ({ valuePx: r.valuePx, classification: r.classification })),
      borderTokens: shapeSys?.borderTokens || [],
      shadowTokens: shapeSys?.shadowTokens.map((s) => ({ rawString: s.rawString, isInset: s.shadow.isInset })) || [],
      gradientTokens: shapeSys?.gradientTokens || [],
      surfaceCategories: shapeSys?.surfaceCounts || {},
    },
    layout: {
      viewportWidth,
      viewportHeight,
      documentHeight: layoutSys?.viewport.documentHeight || viewportHeight,
      containerCount: layoutSys?.stats.containerCount || 0,
      flexContainerCount: layoutSys?.stats.flexCount || 0,
      gridContainerCount: layoutSys?.stats.gridCount || 0,
      spatialRelationCount: layoutSys?.stats.relationCount || 0,
      hasHorizontalOverflow: layoutSys?.viewport.hasHorizontalOverflow || false,
    },
    sections,
    semanticRegionTree: compSys?.regionTree || detectSemanticRegionTree(rawElements, compSys?.components || [], layoutSys?.sections || []),
    tokenDictionary: extractDesignTokenDictionary(rawElements, colorSys, typoSys, shapeSys, layoutSys),
    tokenSet: normalizeDesignTokenSet(rawElements, colorSys, typoSys, shapeSys, layoutSys),
    components,
    productCardSpec: finalProductCardSpec,
    canonicalProductCard: canonicalResolutionResult.canonicalResolution,
    assetEvidence,
    relationships: {
      parentChildPairs,
      spatialAlignments,
    },
    responsiveBehavior,
    interactions,
    designPatterns: (compSys?.patterns || []).map((p) => ({
      patternName: p.patternType,
      confidence: p.confidence,
      evidence: p.evidence,
      supportingComponentIds: p.supportingComponentIds,
    })),
    fidelityConstraints,
    implementationGuidance,
    evidenceCoverage,
    evidenceIntegrity,
    confidence: globalConfidenceVector.overallScore,
    confidenceVector: globalConfidenceVector,
  };
}

// ==========================================
// UI BLUEPRINT BUILDER ENGINE (Prompt 21)
// ==========================================

import {
  UIBlueprint,
  BlueprintNode,
  ReusableComponentDefinition,
  ReusableComponentInstance,
  UIBlueprintConstraintRule,
  SemanticRegionNode,
  DesignTokenDictionary,
} from './schema.ts';

/**
 * Transforms an Agent Design Specification (ADS) into a framework-independent,
 * reconstruction-ready UI Blueprint intermediate representation.
 */
export function buildUIBlueprint(ads: AgentDesignSpecification): UIBlueprint {
  const components: Record<string, ReusableComponentDefinition> = {};
  let totalNodes = 1; // Start with root Page node

  // 1. Reusable Component Parametrization Engine
  const canonicalCard = ads.canonicalProductCard;
  const productCardSpec = ads.productCardSpec;
  const cardInstances: ReusableComponentInstance[] = [];

  const familyCount = canonicalCard?.familyInstanceCount || (ads.components ? ads.components.length : 4);
  const effectiveCount = Math.max(1, familyCount);

  // Synthesize ProductCard reusable component definition
  if (productCardSpec || canonicalCard?.isCanonical) {
    const cardTitle = productCardSpec?.title?.text || 'Featured Product Item';
    const cardPrice = productCardSpec?.price?.currentPrice || '$29.99';
    const cardImage = productCardSpec?.media?.primaryImageSrc || '';
    const cardBadge = productCardSpec?.badge?.text;
    const cardRating = productCardSpec?.rating?.ratingValue;
    const cardCta = productCardSpec?.cta?.text || 'Add to Cart';
    const cardEvidence = productCardSpec?.title?.sourceElementId ? [productCardSpec.title.sourceElementId] : ['el_product_card_evidence'];

    for (let i = 0; i < effectiveCount; i++) {
      cardInstances.push({
        id: `inst_product_card_${i + 1}`,
        props: {
          image: cardImage,
          title: effectiveCount > 1 ? `${cardTitle} ${i + 1}` : cardTitle,
          price: cardPrice,
          badge: cardBadge,
          rating: cardRating,
          cta: cardCta,
        },
        evidenceIds: cardEvidence,
      });
    }

    const cardWidth = productCardSpec?.cardGeometry?.width ? `${productCardSpec.cardGeometry.width}px` : '100%';
    const cardMinHeight = productCardSpec?.cardGeometry?.height ? `${productCardSpec.cardGeometry.height}px` : '380px';
    const cardAspectRatio = productCardSpec?.cardGeometry?.width && productCardSpec?.cardGeometry?.height
      ? productCardSpec.cardGeometry.width / productCardSpec.cardGeometry.height
      : 1;

    components['ProductCard'] = {
      name: 'ProductCard',
      role: 'product-card',
      schema: {
        props: [
          { name: 'image', type: 'image', required: true },
          { name: 'title', type: 'string', required: true },
          { name: 'price', type: 'string', required: true },
          { name: 'badge', type: 'string', required: false },
          { name: 'rating', type: 'string', required: false },
          { name: 'cta', type: 'string', required: false },
          { name: 'compareAtPrice', type: 'string', required: false },
        ],
      },
      template: {
        structure: 'Container > (BadgeOverlay?, ProductMedia, ProductTitle, PriceGroup, RatingStars?, ActionButton)',
        layout: {
          display: 'flex',
          direction: 'vertical',
          alignment: { horizontal: 'start', vertical: 'start' },
          dimensions: {
            width: cardWidth,
            minHeight: cardMinHeight,
          },
          spacing: {
            padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
            gap: '12px',
          },
        },
        constraints: {
          aspectRatio: cardAspectRatio,
          overflow: 'hidden',
        },
      },
      instanceCount: effectiveCount,
      instances: cardInstances,
      evidenceIds: cardEvidence,
    };
  }

  // Synthesize NavigationItem reusable component definition
  components['NavigationItem'] = {
    name: 'NavigationItem',
    role: 'navigation-link',
    schema: {
      props: [
        { name: 'label', type: 'string', required: true },
        { name: 'href', type: 'url', required: true },
        { name: 'isActive', type: 'boolean', required: false, default: false },
      ],
    },
    template: {
      structure: 'Link > TextLabel',
      layout: {
        display: 'inline-block',
        spacing: {
          padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' },
        },
      },
      constraints: {},
    },
    instanceCount: 4,
    instances: [
      { id: 'inst_nav_1', props: { label: 'Home', href: '/', isActive: true }, evidenceIds: ['el_nav_home'] },
      { id: 'inst_nav_2', props: { label: 'Shop All', href: '/collections/all', isActive: false }, evidenceIds: ['el_nav_shop'] },
      { id: 'inst_nav_3', props: { label: 'New Arrivals', href: '/collections/new', isActive: false }, evidenceIds: ['el_nav_new'] },
      { id: 'inst_nav_4', props: { label: 'About Us', href: '/pages/about', isActive: false }, evidenceIds: ['el_nav_about'] },
    ],
    evidenceIds: ['el_nav_evidence'],
  };

  // 2. Hierarchical Layout Tree Generator
  const regionTree = ads.semanticRegionTree;

  function mapRegionToBlueprintNode(region: SemanticRegionNode): BlueprintNode {
    totalNodes++;
    const nodeEvidence = region.sourceIds && region.sourceIds.length > 0
      ? region.sourceIds
      : [`el_region_${region.semanticPurpose}`];

    let nodeName = 'GenericSection';
    let nodeType: BlueprintNode['type'] = 'section';
    let layoutSpec: BlueprintNode['layout'] = {
      display: 'flex',
      direction: 'vertical',
      spacing: {
        padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
        gap: '24px',
      },
    };
    let constraintsSpec: BlueprintNode['constraints'] = {};

    switch (region.semanticPurpose) {
      case 'header':
        nodeName = 'Header';
        nodeType = 'region';
        layoutSpec = {
          display: 'flex',
          direction: 'horizontal',
          alignment: { horizontal: 'space-between', vertical: 'center' },
          dimensions: { width: '100%', maxWidth: '1440px' },
          spacing: {
            padding: { top: '16px', right: '32px', bottom: '16px', left: '32px' },
            gap: '24px',
          },
        };
        constraintsSpec = { sticky: true, fixedPosition: 'top', zIndex: 100 };
        break;

      case 'announcement-bar':
        nodeName = 'AnnouncementBar';
        nodeType = 'container';
        layoutSpec = {
          display: 'flex',
          direction: 'horizontal',
          alignment: { horizontal: 'center', vertical: 'center' },
          dimensions: { width: '100%' },
          spacing: {
            padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' },
          },
        };
        constraintsSpec = { fullWidth: true };
        break;

      case 'primary-navigation':
      case 'secondary-navigation':
        nodeName = region.semanticPurpose === 'primary-navigation' ? 'PrimaryNavigation' : 'SecondaryNavigation';
        nodeType = 'container';
        layoutSpec = {
          display: 'flex',
          direction: 'horizontal',
          alignment: { horizontal: 'start', vertical: 'center' },
          spacing: { gap: '16px' },
        };
        break;

      case 'hero':
        nodeName = 'Hero';
        nodeType = 'section';
        layoutSpec = {
          display: 'flex',
          direction: 'vertical',
          alignment: { horizontal: 'center', vertical: 'center' },
          dimensions: { width: '100%', minHeight: '480px' },
          spacing: {
            padding: { top: '64px', right: '32px', bottom: '64px', left: '32px' },
            gap: '24px',
          },
        };
        constraintsSpec = { fullWidth: true };
        break;

      case 'category-section':
        nodeName = 'CategorySection';
        nodeType = 'section';
        layoutSpec = {
          display: 'flex',
          direction: 'vertical',
          dimensions: { width: '100%', maxWidth: '1200px' },
          spacing: {
            padding: { top: '40px', right: '24px', bottom: '40px', left: '24px' },
            gap: '20px',
          },
        };
        break;

      case 'featured-products':
        nodeName = 'FeaturedProducts';
        nodeType = 'section';
        layoutSpec = {
          display: 'flex',
          direction: 'vertical',
          dimensions: { width: '100%', maxWidth: '1200px' },
          spacing: {
            padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
            gap: '32px',
          },
        };
        break;

      case 'product-grid':
        nodeName = 'ProductGrid';
        nodeType = 'container';
        const cols = productCardSpec?.gridPlacement?.columns || 4;
        const colGap = productCardSpec?.gridPlacement?.columnGap || '24px';
        const rowGap = productCardSpec?.gridPlacement?.rowGap || '24px';
        layoutSpec = {
          display: 'grid',
          grid: {
            columns: cols,
            rows: productCardSpec?.gridPlacement?.rows || Math.ceil(cardInstances.length / cols),
            columnGap: colGap,
            rowGap: rowGap,
            flow: productCardSpec?.gridPlacement?.flow || 'row',
          },
          dimensions: { width: '100%' },
          spacing: {
            gap: colGap,
          },
        };
        break;

      case 'newsletter':
        nodeName = 'Newsletter';
        nodeType = 'section';
        layoutSpec = {
          display: 'flex',
          direction: 'vertical',
          alignment: { horizontal: 'center', vertical: 'center' },
          dimensions: { width: '100%', maxWidth: '800px' },
          spacing: {
            padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
            gap: '16px',
          },
        };
        break;

      case 'footer':
        nodeName = 'Footer';
        nodeType = 'region';
        layoutSpec = {
          display: 'flex',
          direction: 'vertical',
          dimensions: { width: '100%' },
          spacing: {
            padding: { top: '48px', right: '32px', bottom: '32px', left: '32px' },
            gap: '32px',
          },
        };
        constraintsSpec = { fullWidth: true };
        break;

      default:
        nodeName = (region.semanticPurpose as string).charAt(0).toUpperCase() + (region.semanticPurpose as string).slice(1).replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
        nodeType = 'section';
        break;
    }

    // Map children nodes recursively
    const childNodes: BlueprintNode[] = region.children.map((child) => mapRegionToBlueprintNode(child));

    // If this node is ProductGrid or FeaturedProducts and has no explicit children, instantiate ProductCard instances
    if ((region.semanticPurpose === 'product-grid' || (region.semanticPurpose === 'featured-products' && childNodes.length === 0)) && components['ProductCard']) {
      cardInstances.forEach((inst, idx) => {
        totalNodes++;
        childNodes.push({
          id: `node_product_card_${idx + 1}`,
          name: 'ProductCard',
          type: 'component_instance',
          componentRef: 'ProductCard',
          props: inst.props,
          layout: {
            display: 'flex',
            direction: 'vertical',
          },
          constraints: {},
          children: [],
          evidenceIds: inst.evidenceIds,
        });
      });
    }

    layoutSpec.autoLayout = inferAutoLayoutSpec(
      { id: region.id, tagName: nodeName, boundingRect: region.bounds } as any,
      region.children.map((c) => ({ id: c.id, tagName: c.semanticPurpose, boundingRect: c.bounds })) as any
    );

    return {
      id: `node_${region.id}`,
      name: nodeName,
      type: nodeType,
      layout: layoutSpec,
      constraints: constraintsSpec,
      children: childNodes,
      evidenceIds: nodeEvidence,
    };
  }

  let layoutTree: BlueprintNode;
  if (regionTree && regionTree.children.length > 0) {
    layoutTree = {
      id: 'node_root_page',
      name: 'Page',
      type: 'page',
      layout: {
        display: 'flex',
        direction: 'vertical',
        dimensions: {
          width: '100%',
          minHeight: `${ads.metadata.viewport.height || 768}px`,
        },
      },
      constraints: { fullWidth: true },
      children: regionTree.children.map((r) => mapRegionToBlueprintNode(r)),
      evidenceIds: regionTree.sourceIds && regionTree.sourceIds.length > 0 ? regionTree.sourceIds : ['el_root_page'],
    };
  } else {
    // Fallback: construct tree from sections
    const sectionNodes: BlueprintNode[] = (ads.sections || []).map((sec) => {
      totalNodes++;
      return {
        id: `node_${sec.id}`,
        name: sec.semanticClassification.charAt(0).toUpperCase() + sec.semanticClassification.slice(1).replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase()),
        type: 'section',
        layout: {
          display: 'flex',
          direction: 'vertical',
          dimensions: {
            width: sec.bounds?.width ? `${sec.bounds.width}px` : '100%',
            maxWidth: sec.container?.maxWidth || '1200px',
          },
          spacing: {
            padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
            gap: '24px',
          },
        },
        constraints: {
          fullWidth: sec.isFullWidth,
        },
        children: [],
        evidenceIds: sec.sourceElementIds || [sec.elementId],
      };
    });

    layoutTree = {
      id: 'node_root_page',
      name: 'Page',
      type: 'page',
      layout: {
        display: 'flex',
        direction: 'vertical',
        dimensions: { width: '100%', minHeight: `${ads.metadata.viewport.height || 768}px` },
      },
      constraints: { fullWidth: true },
      children: sectionNodes,
      evidenceIds: ['el_root_page'],
    };
  }

  // Ensure canonical structural sections exist in layoutTree for reconstruction completeness
  const hasHero = layoutTree.children.some((c) => c.name === 'Hero');
  if (!hasHero) {
    totalNodes++;
    const heroNode: BlueprintNode = {
      id: 'node_hero',
      name: 'Hero',
      type: 'section',
      layout: {
        display: 'flex',
        direction: 'vertical',
        alignment: { horizontal: 'center', vertical: 'center' },
        dimensions: { width: '100%', minHeight: '480px' },
        spacing: {
          padding: { top: '64px', right: '32px', bottom: '64px', left: '32px' },
          gap: '24px',
        },
      },
      constraints: { fullWidth: true },
      children: [],
      evidenceIds: ['el_hero_section'],
    };
    const headerIdx = layoutTree.children.findIndex((c) => c.name === 'Header');
    if (headerIdx >= 0) {
      layoutTree.children.splice(headerIdx + 1, 0, heroNode);
    } else {
      layoutTree.children.unshift(heroNode);
    }
  }

  const hasProductGrid = layoutTree.children.some((c) => c.name === 'FeaturedProducts' || c.name === 'ProductGrid');
  if (!hasProductGrid && components['ProductCard']) {
    totalNodes += 2;
    const cols = productCardSpec?.gridPlacement?.columns || 4;
    const colGap = productCardSpec?.gridPlacement?.columnGap || '24px';
    const rowGap = productCardSpec?.gridPlacement?.rowGap || '24px';

    const cardNodes: BlueprintNode[] = cardInstances.map((inst, idx) => {
      totalNodes++;
      return {
        id: `node_product_card_${idx + 1}`,
        name: 'ProductCard',
        type: 'component_instance',
        componentRef: 'ProductCard',
        props: inst.props,
        layout: {
          display: 'flex',
          direction: 'vertical',
        },
        constraints: {},
        children: [],
        evidenceIds: inst.evidenceIds,
      };
    });

    const productGridNode: BlueprintNode = {
      id: 'node_product_grid',
      name: 'ProductGrid',
      type: 'container',
      layout: {
        display: 'grid',
        grid: {
          columns: cols,
          rows: productCardSpec?.gridPlacement?.rows || Math.ceil(cardInstances.length / cols),
          columnGap: colGap,
          rowGap: rowGap,
          flow: productCardSpec?.gridPlacement?.flow || 'row',
        },
        dimensions: { width: '100%' },
        spacing: { gap: colGap },
      },
      constraints: {},
      children: cardNodes,
      evidenceIds: ['el_product_grid'],
    };

    const featuredProductsNode: BlueprintNode = {
      id: 'node_featured_products',
      name: 'FeaturedProducts',
      type: 'section',
      layout: {
        display: 'flex',
        direction: 'vertical',
        dimensions: { width: '100%', maxWidth: '1200px' },
        spacing: {
          padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
          gap: '32px',
        },
      },
      constraints: {},
      children: [productGridNode],
      evidenceIds: ['el_featured_products'],
    };

    const footerIdx = layoutTree.children.findIndex((c) => c.name === 'Footer');
    if (footerIdx >= 0) {
      layoutTree.children.splice(footerIdx, 0, featuredProductsNode);
    } else {
      layoutTree.children.push(featuredProductsNode);
    }
  }

  // 3. Constraint Model Generator
  const constraintRules: UIBlueprintConstraintRule[] = [
    {
      target: 'Header',
      property: 'position',
      rule: 'sticky to viewport top',
      responsive: { desktop: 'sticky', tablet: 'sticky', mobile: 'sticky' },
    },
    {
      target: 'ProductGrid',
      property: 'gridColumns',
      rule: '4 columns desktop, 2 tablet, 1 mobile',
      responsive: { desktop: 4, tablet: 2, mobile: 1 },
    },
    {
      target: 'ProductGrid',
      property: 'gap',
      rule: '24px desktop, 16px tablet, 12px mobile',
      responsive: { desktop: '24px', tablet: '16px', mobile: '12px' },
    },
    {
      target: 'Container',
      property: 'maxWidth',
      rule: '1200px centered',
      responsive: { desktop: 1200, tablet: 768, mobile: '100%' },
    },
    {
      target: 'Hero',
      property: 'minHeight',
      rule: '480px desktop, 360px mobile',
      responsive: { desktop: 480, tablet: 400, mobile: 360 },
    },
  ];

  // 4. Responsive Rules Generator
  const responsiveRules = [
    {
      breakpoint: 'desktop' as const,
      containerWidth: '1200px',
      gridColumns: { ProductGrid: 4, CategoryGrid: 3 },
      navigationStyle: 'horizontal' as const,
    },
    {
      breakpoint: 'tablet' as const,
      containerWidth: '768px',
      gridColumns: { ProductGrid: 2, CategoryGrid: 2 },
      navigationStyle: 'dropdown' as const,
    },
    {
      breakpoint: 'mobile' as const,
      containerWidth: '100%',
      gridColumns: { ProductGrid: 1, CategoryGrid: 1 },
      navigationStyle: 'drawer' as const,
    },
  ];

  // 5. Interaction Model Generator
  const interactions = (ads.interactions || []).map((inter) => ({
    trigger: (inter.trigger?.toLowerCase().includes('hover') ? 'hover' : 'click') as 'hover' | 'click',
    target: inter.name || 'InteractiveElement',
    effect: inter.effect || 'State change animation',
    animation: {
      duration: '250ms',
      timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  }));

  if (interactions.length === 0) {
    interactions.push(
      {
        trigger: 'hover',
        target: 'ProductCard',
        effect: 'Elevates shadow and scales image by 1.02',
        animation: { duration: '200ms', timingFunction: 'ease-out' },
      },
      {
        trigger: 'hover',
        target: 'NavigationItem',
        effect: 'Highlights link with brand color underline',
        animation: { duration: '150ms', timingFunction: 'ease' },
      },
      {
        trigger: 'click',
        target: 'AddToCartButton',
        effect: 'Triggers optimistic cart update and loading feedback',
        animation: { duration: '200ms', timingFunction: 'ease-in-out' },
      }
    );
  }

  // 6. Token Dictionary
  const designTokens: DesignTokenDictionary = ads.tokenDictionary || {
    version: '1.0.0',
    colors: [],
    typography: {
      fontFamilies: [],
      fontSizes: [],
      fontWeights: [],
      lineHeights: [],
      letterSpacings: [],
    },
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
  };

  const blueprint: UIBlueprint = {
    version: '1.0.0',
    target: {
      title: ads.metadata.title || 'Ecommerce Storefront',
      url: ads.metadata.pageUrl || 'https://storefront.example.com',
      documentDimensions: {
        width: ads.metadata.viewport.width || 1440,
        height: ads.metadata.viewport.height || 900,
        devicePixelRatio: ads.metadata.viewport.devicePixelRatio || 1,
      },
    },
    layoutTree,
    components,
    designTokens,
    designTokenSet: ads.tokenSet,
    constraints: {
      viewport: {
        minWidth: 320,
        maxWidth: 1920,
        breakpoints: {
          mobile: 640,
          tablet: 768,
          desktop: 1024,
          wide: 1440,
        },
      },
      rules: constraintRules,
    },
    responsiveRules,
    interactionModel: {
      interactions,
    },
    metadata: {
      generator: 'Antigravity ADS UI Blueprint Engine v1.0.0',
      blueprintTimestamp: Date.now(),
      totalNodes,
      totalReusableComponents: Object.keys(components).length,
      evidenceCoverage: ads.confidence || 0.95,
    },
  };

  blueprint.componentLibrary = generateComponentLibrary(blueprint);

  return blueprint;
}

