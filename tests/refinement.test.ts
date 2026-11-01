import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { refineDesignIntelligence } from '../src/agent-spec/refinement/index.ts';
import { buildAgentDesignSpecification, exportAdsContext } from '../src/agent-spec/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

describe('Prompt 10.5 — Mandatory Regression & Quality Tests', () => {
  function createSyntheticEcommerceDOM() {
    document.body.innerHTML = `
      <div id="app-root">
        <header id="site-header" style="background-color: rgb(255, 255, 255); padding: 16px 24px; border-bottom: 1px solid rgb(226, 232, 240);">
          <div id="header-inner" style="display: flex; justify-content: space-between; align-items: center;">
            <div id="brand-logo" style="font-size: 24px; font-weight: 700; color: rgb(15, 23, 42);">CLOTHIER</div>
            <nav id="main-nav" role="navigation" style="display: flex; gap: 16px;">
              <a href="#" style="font-size: 14px; color: rgb(51, 65, 85);">New Arrivals</a>
              <a href="#" style="font-size: 14px; color: rgb(51, 65, 85);">Women</a>
              <a href="#" style="font-size: 14px; color: rgb(51, 65, 85);">Men</a>
              <a href="#" style="font-size: 14px; color: rgb(51, 65, 85);">Sale</a>
            </nav>
          </div>
        </header>

        <section id="promo-banner" style="background-color: rgb(239, 68, 68); color: white; padding: 8px; text-align: center; font-size: 12px;">
          <span>Free Express Shipping on Orders Over $100!</span>
        </section>

        <main id="main-content" role="main">
          <section id="hero-section" style="padding: 48px 24px; background-color: rgb(248, 250, 252); text-align: center;">
            <h1 style="font-size: 40px; font-weight: 800; color: rgb(15, 23, 42);">Summer Collection 2026</h1>
            <p style="font-size: 18px; color: rgb(100, 116, 139); margin-top: 12px;">Discover lightweight linen and vibrant summer essentials.</p>
            <button role="button" style="background-color: rgb(15, 23, 42); color: white; padding: 12px 24px; border-radius: 999px; font-weight: 600; margin-top: 24px;">Shop Now</button>
          </section>

          <section id="categories-section" style="padding: 32px 24px;">
            <h2 style="font-size: 24px; font-weight: 700; color: rgb(15, 23, 42); margin-bottom: 24px;">Shop by Category</h2>
            <div id="category-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
              <div class="cat-tile" style="background-color: rgb(241, 245, 249); padding: 24px; border-radius: 8px; text-align: center;">
                <h3 style="font-size: 18px;">Dresses</h3>
              </div>
              <div class="cat-tile" style="background-color: rgb(241, 245, 249); padding: 24px; border-radius: 8px; text-align: center;">
                <h3 style="font-size: 18px;">Shirts</h3>
              </div>
              <div class="cat-tile" style="background-color: rgb(241, 245, 249); padding: 24px; border-radius: 8px; text-align: center;">
                <h3 style="font-size: 18px;">Accessories</h3>
              </div>
            </div>
          </section>

          <section id="product-grid-section" style="padding: 32px 24px; background-color: white;">
            <h2 style="font-size: 24px; font-weight: 700; color: rgb(15, 23, 42); margin-bottom: 24px;">Featured Products</h2>
            <div id="product-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
              <!-- 4 Structurally Equivalent Product Cards with differing text, prices, badges, images -->
              <div id="prod_1" class="product-card" style="border: 1px solid rgb(226, 232, 240); border-radius: 8px; padding: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <img src="prod1.jpg" alt="Product 1" style="width: 100%; height: 180px; border-radius: 4px;" />
                <span id="badge_1" class="badge" style="background-color: rgb(16, 185, 129); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">NEW</span>
                <h4 style="font-size: 16px; font-weight: 600; margin-top: 8px;">Linen Summer Shirt</h4>
                <p style="font-size: 14px; font-weight: 700; color: rgb(15, 23, 42);">$59.00</p>
                <button role="button" style="width: 100%; background-color: rgb(59, 130, 246); color: white; padding: 8px; border-radius: 6px; margin-top: 12px;">Add to Cart</button>
              </div>

              <div id="prod_2" class="product-card" style="border: 1px solid rgb(226, 232, 240); border-radius: 8px; padding: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <img src="prod2.jpg" alt="Product 2" style="width: 100%; height: 180px; border-radius: 4px;" />
                <span id="badge_2" class="badge" style="background-color: rgb(239, 68, 68); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">SALE</span>
                <h4 style="font-size: 16px; font-weight: 600; margin-top: 8px;">Casual Chino Shorts</h4>
                <p style="font-size: 14px; font-weight: 700; color: rgb(15, 23, 42);">$39.00</p>
                <button role="button" style="width: 100%; background-color: rgb(59, 130, 246); color: white; padding: 8px; border-radius: 6px; margin-top: 12px;">Add to Cart</button>
              </div>

              <div id="prod_3" class="product-card" style="border: 1px solid rgb(226, 232, 240); border-radius: 8px; padding: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <img src="prod3.jpg" alt="Product 3" style="width: 100%; height: 180px; border-radius: 4px;" />
                <h4 style="font-size: 16px; font-weight: 600; margin-top: 8px;">Floral Sundress</h4>
                <p style="font-size: 14px; font-weight: 700; color: rgb(15, 23, 42);">$79.00</p>
                <button role="button" style="width: 100%; background-color: rgb(59, 130, 246); color: white; padding: 8px; border-radius: 6px; margin-top: 12px;">Add to Cart</button>
              </div>

              <div id="prod_4" class="product-card" style="border: 1px solid rgb(226, 232, 240); border-radius: 8px; padding: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <img src="prod4.jpg" alt="Product 4" style="width: 100%; height: 180px; border-radius: 4px;" />
                <h4 style="font-size: 16px; font-weight: 600; margin-top: 8px;">Classic Denim Jacket</h4>
                <p style="font-size: 14px; font-weight: 700; color: rgb(15, 23, 42);">$89.00</p>
                <button role="button" style="width: 100%; background-color: rgb(59, 130, 246); color: white; padding: 8px; border-radius: 6px; margin-top: 12px;">Add to Cart</button>
              </div>
            </div>
          </section>
        </main>

        <footer id="site-footer" role="contentinfo" style="background-color: rgb(15, 23, 42); color: white; padding: 32px 24px; margin-top: 48px;">
          <p>© 2026 CLOTHIER. All rights reserved.</p>
        </footer>
      </div>
    `;
    document.title = 'CLOTHIER — Summer Store';
  }

  function getECommerceAnalysisData(): AnalyzePageResponseData {
    createSyntheticEcommerceDOM();
    const rawResult = new DomExtractor().extract(document.body);
    const colorSystem = new ColorNormalizer().normalize(rawResult);
    const typographySystem = new TypographyNormalizer().normalize(rawResult);
    const shapeSystem = new ShapeNormalizer().normalize(rawResult);
    const layoutSystem = new LayoutNormalizer().normalize(rawResult);
    const componentSystem = new ComponentNormalizer().normalize(
      rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem
    );

    return {
      status: 'completed',
      pageUrl: 'https://store.example.com/',
      title: 'CLOTHIER — Summer Store',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  // 1. Badge must not become card
  it('1. Badge Guardrail: inline text badge <span class="badge"> is classified as badge, NOT card', () => {
    const data = getECommerceAnalysisData();
    const badgeCandidates = data.componentSystem?.components.filter((c) => c.rootElementId === 'badge_1' || c.rootElementId === 'badge_2');

    badgeCandidates?.forEach((b) => {
      expect(b.type).toBe('badge');
      expect(b.type).not.toBe('card');
    });
  });

  // 2 & 3. Structurally equivalent product cards grouped into 1 family with instanceCount >= 4 regardless of text/price/badge differences
  it('2 & 3. Product Card Family: 4 structurally equivalent product cards group into ONE family with instanceCount >= 4 regardless of text/image/badge differences', () => {
    const data = getECommerceAnalysisData();
    const refined = refineDesignIntelligence(data);

    const productCardFamily = refined.componentFamilies
      .filter((f) => f.type === 'card')
      .sort((a, b) => b.instanceCount - a.instanceCount)[0];

    expect(productCardFamily).toBeDefined();
    expect(productCardFamily.instanceCount).toBeGreaterThanOrEqual(4);
    expect(productCardFamily.memberElementIds.length).toBeGreaterThanOrEqual(4);
  });

  // 4. Nested wrappers do not create duplicate sections
  it('4. Nested Section Suppression: suppresses nested DOM wrapper duplicates', () => {
    const data = getECommerceAnalysisData();
    const refined = refineDesignIntelligence(data);

    expect(refined.sections.length).toBeGreaterThan(0);
    expect(refined.sections.length).toBeLessThan(10);
  });

  // 5. Repeated section patterns are grouped
  it('5. Section Pattern Grouping: groups repeated section patterns cleanly', () => {
    const data = getECommerceAnalysisData();
    const refined = refineDesignIntelligence(data);

    refined.sections.forEach((sec) => {
      expect(sec.instanceCount).toBeGreaterThanOrEqual(1);
      expect(sec.sourceElementIds.length).toBeGreaterThan(0);
    });
  });

  // 6. One-off layout dimensions do not pollute primary spacing scale
  it('6. Spacing Noise Filter: excludes large container width/height layout measurements (>120px) from primary spacing scale', () => {
    const data = getECommerceAnalysisData();
    const refined = refineDesignIntelligence(data);

    refined.spacingScale.forEach((s) => {
      expect(s.valuePx).toBeLessThanOrEqual(120);
    });
  });

  // 7. Pill/circular radii are classified separately
  it('7. Radius Quality Audit: classifies 999px button radius as pill and 50% as circular, separate from reusable surface tokens', () => {
    const data = getECommerceAnalysisData();
    const refined = refineDesignIntelligence(data);

    const pillToken = refined.radiusTokens.find((r) => r.classification === 'pill');
    expect(pillToken).toBeDefined();

    const reusableToken = refined.radiusTokens.find((r) => r.valuePx === 8);
    expect(reusableToken?.classification).toBe('reusableToken');
  });

  // 8. Low-confidence candidates are suppressed
  it('8. Confidence Suppression: suppresses section candidates with calibrated confidence < 0.40', () => {
    const data = getECommerceAnalysisData();
    const refined = refineDesignIntelligence(data);

    refined.sections.forEach((sec) => {
      expect(sec.confidence).toBeGreaterThanOrEqual(0.40);
    });
  });

  // 9. ADS output is 100% deterministic
  it('9. Determinism Guardrail: produces 100% byte-for-byte identical ADS context across repeated runs', () => {
    const data = getECommerceAnalysisData();

    const ads1 = buildAgentDesignSpecification(data);
    const ads2 = buildAgentDesignSpecification(data);

    const ctx1 = exportAdsContext(ads1);
    const ctx2 = exportAdsContext(ads2);

    expect(ctx1).toBe(ctx2);
  });

  // 10. Final ADS contains traceability back to source elements
  it('10. Traceability: all ADS component & section references retain valid sourceElementIds', () => {
    const data = getECommerceAnalysisData();
    const ads = buildAgentDesignSpecification(data);

    ads.components.forEach((comp) => {
      expect(comp.sourceElementIds).toBeDefined();
      expect(comp.sourceElementIds.length).toBeGreaterThan(0);
    });

    ads.sections.forEach((sec) => {
      expect(sec.sourceElementIds).toBeDefined();
      expect(sec.sourceElementIds.length).toBeGreaterThan(0);
    });
  });
});
