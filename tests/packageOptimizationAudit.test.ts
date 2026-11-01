import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/domExtractor.ts';
import { ColorNormalizer } from '../src/normalization/color/colorNormalizer.ts';
import { TypographyNormalizer } from '../src/normalization/typography/typographyNormalizer.ts';
import { ShapeNormalizer } from '../src/normalization/shape/shapeNormalizer.ts';
import { LayoutNormalizer } from '../src/normalization/layout/layoutNormalizer.ts';
import { ComponentNormalizer } from '../src/normalization/component/componentNormalizer.ts';
import { buildComponentHierarchy } from '../src/normalization/component/componentHierarchyEngine.ts';
import { coalesceSemanticSections } from '../src/normalization/component/sectionClassifier.ts';
import { exportReconstructionJson } from '../src/output/clonePackage/reconstructionJsonExporter.ts';
import { exportComponentsJson } from '../src/output/clonePackage/componentsJsonExporter.ts';
import { exportLayoutJson } from '../src/output/clonePackage/layoutJsonExporter.ts';
import { exportCssVariables } from '../src/output/cssExporter.ts';
import { exportTailwindConfig } from '../src/output/tailwindExporter.ts';
import { exportAccessibilityJson } from '../src/output/clonePackage/accessibilityJsonExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

function buildMockStoreData(): AnalyzePageResponseData {
  document.body.innerHTML = `
    <div id="root" style="width: 1440px; background-color: #0a0a0a; font-family: 'Inter', sans-serif;">
      <!-- Header -->
      <header id="header" class="site-header sticky-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background-color: #0f0f0f; border-bottom: 1px solid #1e1e1e; position: sticky; top: 0; z-index: 50;">
        <a href="/" id="logo" style="font-size: 24px; font-weight: 700; color: #ffd700;">ZeroStore</a>
        <nav id="nav" style="display: flex; gap: 24px;">
          <a href="/shop" class="nav-item" style="color: #ffffff; text-decoration: none;">Shop</a>
          <a href="/deals" class="nav-item" style="color: #ffffff; text-decoration: none;">Deals</a>
        </nav>
        <button id="cart-btn" aria-label="Shopping Cart" style="padding: 8px 16px; background-color: #ffd700; color: #000000; border-radius: 8px;">Cart (2)</button>
      </header>

      <!-- Hero Section -->
      <section id="hero" style="display: flex; flex-direction: column; align-items: center; padding: 80px 24px; text-align: center; background-color: #0a0a0a;">
        <span id="hero-badge" class="badge" style="padding: 4px 12px; background-color: #ffd700; color: #000000; border-radius: 9999px; font-size: 14px; margin-bottom: 16px;">NEW ARRIVALS 2026</span>
        <h1 id="hero-title" style="font-size: 48px; font-weight: 800; color: #ffffff; margin-bottom: 16px;">Next Gen Smart Wearables</h1>
        <p id="hero-desc" style="font-size: 18px; color: #888888; max-width: 640px; margin-bottom: 32px;">Discover precision-engineered tech accessories with advanced biometric tracking.</p>
        <a href="/explore" id="hero-cta" style="padding: 14px 28px; background-color: #ffd700; color: #000000; border-radius: 8px; font-weight: 600; text-decoration: none;">Explore Collection</a>
      </section>

      <!-- Featured Products Grid -->
      <section id="featured-products" style="padding: 64px 32px; max-width: 1280px; margin: 0 auto;">
        <h2 style="font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 32px;">Featured Products</h2>
        <div id="product-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
          ${[1, 2, 3, 4]
            .map(
              (i) => `
            <article class="product-card" id="card-${i}" style="background-color: #141414; border: 1px solid #282828; border-radius: 12px; overflow: hidden; padding: 16px; display: flex; flex-direction: column;">
              <img src="https://example.com/images/watch-${i}.webp" alt="Watch ${i}" class="product-img" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; margin-bottom: 12px;" />
              <span class="product-badge" style="padding: 2px 8px; background-color: #ffd700; color: #000000; border-radius: 4px; font-size: 12px; align-self: flex-start; margin-bottom: 8px;">SALE</span>
              <h3 class="product-title" style="font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 6px;">SmartWatch Apex ${i}</h3>
              <span class="product-price" style="font-size: 20px; font-weight: 700; color: #ffd700; margin-bottom: 12px;">Rs 7,999</span>
              <button class="add-to-cart-btn" style="padding: 10px; background-color: #ffd700; color: #000000; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: auto;">Buy Now</button>
            </article>
          `
            )
            .join('')}
        </div>
      </section>

      <!-- Footer -->
      <footer id="footer" style="padding: 48px 32px; background-color: #080808; border-top: 1px solid #1e1e1e;">
        <p style="color: #666666; font-size: 14px;">© 2026 ZeroStore. All rights reserved.</p>
      </footer>
    </div>
  `;

  const extractor = new DomExtractor();
  const rawResult = extractor.extract(document.body, { includeHidden: true });

  const colors = new ColorNormalizer().normalize(rawResult);
  const typography = new TypographyNormalizer().normalize(rawResult);
  const shapes = new ShapeNormalizer().normalize(rawResult);
  const layout = new LayoutNormalizer().normalize(rawResult);
  const components = new ComponentNormalizer().normalize(rawResult, colors, typography, shapes, layout);

  return {
    status: 'completed',
    timestamp: Date.now(),
    title: 'ZeroStore - Smart Wearables',
    pageUrl: 'https://store.example.com',
    extractionResult: rawResult,
    colorSystem: colors,
    typographySystem: typography,
    shapeSystem: shapes,
    layoutSystem: layout,
    componentSystem: components,
  };
}

describe('Package Optimization Audit Fixes Validation', () => {
  it('1. Component hierarchy tree stays lean and avoids recursive explosion', () => {
    const data = buildMockStoreData();
    const hierarchy = buildComponentHierarchy(data);

    expect(hierarchy.root).toBeDefined();
    expect(hierarchy.treeStats.totalNodes).toBeGreaterThan(0);
    expect(hierarchy.treeStats.totalNodes).toBeLessThan(100);
    expect(hierarchy.treeStats.integrity.zeroOrphans).toBe(true);
    expect(hierarchy.treeStats.integrity.acyclic).toBe(true);
  });

  it('2. 02_components.json serialized size is compact (< 250 KB)', () => {
    const data = buildMockStoreData();
    const jsonStr = exportComponentsJson(data);

    expect(jsonStr.length).toBeLessThan(250 * 1024);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.totalComponents).toBeGreaterThan(0);
    expect(parsed.componentTree.totalNodes).toBeLessThan(100);
  });

  it('3. Section component IDs in 01_reconstruction.json resolve to instance IDs and componentRefs', () => {
    const data = buildMockStoreData();
    const recStr = exportReconstructionJson(data);
    const rec = JSON.parse(recStr);

    expect(rec.sections).toBeDefined();
    expect(rec.sections.length).toBeGreaterThan(0);

    for (const sec of rec.sections) {
      expect(sec.semanticId).toMatch(/^sec_/);
      expect(Array.isArray(sec.componentIds)).toBe(true);
      expect(Array.isArray(sec.componentRefs)).toBe(true);
      expect(sec.componentRefs.length).toBeGreaterThan(0);
    }
  });

  it('4. 04_layout.json eliminates redundant container duplicate array', () => {
    const data = buildMockStoreData();
    const layStr = exportLayoutJson(data);
    const lay = JSON.parse(layStr);

    expect(lay.containers).toBeDefined();
    expect(Array.isArray(lay.containers)).toBe(true);
    expect(lay.layoutConstraintSystem.containers).toBeUndefined();
    expect(lay.layoutConstraintSystem.viewport).toBeDefined();
    expect(lay.layoutConstraintSystem.summary).toBeDefined();
  });

  it('5. coalesceSemanticSections groups micro-sections into cohesive regions', () => {
    const microSections = [
      { id: 'sec_1', elementId: 'el_1', sectionType: 'navigation' as any, confidence: 0.95, evidence: ['nav1'], componentIds: ['c1'] },
      { id: 'sec_2', elementId: 'el_2', sectionType: 'navigation' as any, confidence: 0.95, evidence: ['nav2'], componentIds: ['c2'] },
      { id: 'sec_3', elementId: 'el_3', sectionType: 'navigation' as any, confidence: 0.95, evidence: ['nav3'], componentIds: ['c3'] },
      { id: 'sec_4', elementId: 'el_4', sectionType: 'hero' as any, confidence: 0.90, evidence: ['hero'], componentIds: ['c4'] },
      { id: 'sec_5', elementId: 'el_5', sectionType: 'footer' as any, confidence: 0.95, evidence: ['f1'], componentIds: ['c5'] },
      { id: 'sec_6', elementId: 'el_6', sectionType: 'footer' as any, confidence: 0.95, evidence: ['f2'], componentIds: ['c6'] },
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `sec_${i + 7}`,
        elementId: `el_${i + 7}`,
        sectionType: 'footer' as any,
        confidence: 0.95,
        evidence: [`footer_${i}`],
        componentIds: [`cf_${i}`],
      })),
    ];

    const coalesced = coalesceSemanticSections(microSections);
    expect(coalesced.length).toBeLessThan(microSections.length);
    expect(coalesced[0].sectionType).toBe('navigation');
    expect(coalesced[0].componentIds).toContain('c1');
    expect(coalesced[0].componentIds).toContain('c2');
    expect(coalesced[0].componentIds).toContain('c3');
  });

  it('6. CSS variables in cssExporter are deduplicated with zero duplicate keys', () => {
    const data = buildMockStoreData();
    const css = exportCssVariables(data);

    const lines = css.split('\n').filter((l) => l.trim().startsWith('--'));
    const varNames = lines.map((l) => l.split(':')[0].trim());
    const uniqueVarNames = new Set(varNames);

    expect(varNames.length).toBe(uniqueVarNames.size);
    expect(css).toContain('--spacing-xs: 4px;');
    expect(css).toContain('--spacing-sm: 8px;');
  });

  it('7. Tailwind config exports normalized clean spacing scale', () => {
    const data = buildMockStoreData();
    const tw = exportTailwindConfig(data);

    expect(tw).toContain('"container-padding": "24px"');
    expect(tw).toContain('"section-gap": "64px"');
    expect(tw).toContain('"xs": "4px"');
    expect(tw).toContain('"sm": "8px"');
  });

  it('8. Accessibility JSON contains populated tabOrder sequence and chain', () => {
    const data = buildMockStoreData();
    const a11yStr = exportAccessibilityJson(data);
    const a11y = JSON.parse(a11yStr);

    expect(a11y.tabOrder).toBeDefined();
    expect(a11y.tabOrder.totalTabbable).toBeGreaterThan(0);
    expect(Array.isArray(a11y.tabOrder.sequence)).toBe(true);
    expect(a11y.tabOrder.sequence.length).toBe(a11y.tabOrder.totalTabbable);
    expect(a11y.tabOrder.chain).toBeDefined();
  });

  it('9. ArtifactExporter exports ai-lightweight-bundle (< 500 KB)', () => {
    const data = buildMockStoreData();
    const exporter = new ArtifactExporter();
    const res = exporter.export(data, 'ai-lightweight-bundle');

    expect(res.format).toBe('ai-lightweight-bundle');
    expect(res.exportedData).toBeDefined();
    expect(res.exportedData.length).toBeLessThan(500 * 1024);

    const parsed = JSON.parse(res.exportedData);
    expect(parsed.title).toBe('ZeroStore - Smart Wearables');
    expect(parsed.designSystem).toBeDefined();
    expect(parsed.cssVariables).toBeDefined();
    expect(parsed.tailwindConfig).toBeDefined();
    expect(parsed.assets).toBeDefined();
    expect(parsed.totalTokensEstimated).toBeGreaterThan(0);
    expect(parsed.totalTokensEstimated).toBeLessThan(150000);
  });
});
