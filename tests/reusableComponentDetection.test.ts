import { describe, it, expect } from 'vitest';
import {
  detectReusableComponents,
  computeReusableConfidence,
  computeGeometryMetrics,
} from '../src/normalization/component/reusableComponentDetector.ts';
import { exportComponentsJson } from '../src/output/clonePackage/componentsJsonExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

describe('Prompt 19 — Reusable Component Detection Engine', () => {
  function buildRichEcommerceMockData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <header id="site-header" class="site-header">
        <div class="logo">BrandLogo</div>
        <nav class="main-nav">
          <a href="/shop" class="nav-item nav-link">Shop</a>
          <a href="/new" class="nav-item nav-link">New Arrivals</a>
          <a href="/sale" class="nav-item nav-link">Sale</a>
          <a href="/about" class="nav-item nav-link">About</a>
        </nav>
        <button class="btn btn-primary header-cta">Sign In</button>
      </header>

      <section class="hero-section">
        <h1>Summer Collection 2026</h1>
        <p>Discover our newest minimalist essentials designed for modern life.</p>
        <button class="btn btn-primary cta-btn">Explore Collection</button>
      </section>

      <section class="category-section">
        <h2>Shop By Category</h2>
        <div class="categories-grid">
          <a href="/category/audio" class="category-card cat-item">
            <img src="audio.jpg" alt="Audio"/>
            <h3>Wireless Audio</h3>
          </a>
          <a href="/category/wearables" class="category-card cat-item">
            <img src="wear.jpg" alt="Wearables"/>
            <h3>Smart Wearables</h3>
          </a>
          <a href="/category/accessories" class="category-card cat-item">
            <img src="acc.jpg" alt="Accessories"/>
            <h3>Accessories</h3>
          </a>
        </div>
      </section>

      <section class="products-grid-section">
        <h2>Trending Essentials</h2>
        <div class="products-grid">
          <div class="product-card" id="card-1">
            <div class="media-container">
              <img src="prod1.jpg" alt="Noise-Cancelling Headphones"/>
              <span class="badge sale-tag badge-sale">25% OFF</span>
              <button class="wishlist-btn" aria-label="Add to wishlist">♥</button>
            </div>
            <div class="card-info">
              <h3 class="product-title">Noise-Cancelling Headphones</h3>
              <div class="price-container">
                <span class="current-price">$199.00</span>
                <span class="original-price">$249.00</span>
              </div>
              <div class="rating-stars">★★★★★ (128)</div>
              <button class="btn btn-primary add-to-cart-btn">Add to Cart</button>
            </div>
          </div>

          <div class="product-card" id="card-2">
            <div class="media-container">
              <img src="prod2.jpg" alt="Minimalist Chrono Watch"/>
              <span class="badge badge-new">NEW</span>
              <button class="wishlist-btn" aria-label="Add to wishlist">♥</button>
            </div>
            <div class="card-info">
              <h3 class="product-title">Minimalist Chrono Watch</h3>
              <div class="price-container">
                <span class="current-price">$289.00</span>
              </div>
              <div class="rating-stars">★★★★☆ (84)</div>
              <button class="btn btn-primary add-to-cart-btn">Add to Cart</button>
            </div>
          </div>

          <div class="product-card" id="card-3">
            <div class="media-container">
              <img src="prod3.jpg" alt="Wireless Charging Pad"/>
              <button class="wishlist-btn" aria-label="Add to wishlist">♥</button>
            </div>
            <div class="card-info">
              <h3 class="product-title">Wireless Charging Pad</h3>
              <div class="price-container">
                <span class="current-price">$49.00</span>
              </div>
              <div class="rating-stars">★★★★★ (312)</div>
              <button class="btn btn-primary add-to-cart-btn">Add to Cart</button>
            </div>
          </div>

          <div class="product-card" id="card-4">
            <div class="media-container">
              <img src="prod4.jpg" alt="Ergonomic Laptop Stand"/>
              <span class="badge badge-featured">FEATURED</span>
              <button class="wishlist-btn" aria-label="Add to wishlist">♥</button>
            </div>
            <div class="card-info">
              <h3 class="product-title">Ergonomic Laptop Stand</h3>
              <div class="price-container">
                <span class="current-price">$89.00</span>
              </div>
              <div class="rating-stars">★★★★☆ (67)</div>
              <button class="btn btn-primary add-to-cart-btn">Add to Cart</button>
            </div>
          </div>
        </div>
      </section>

      <section class="features-section">
        <div class="features-grid">
          <div class="feature-card feature-item">
            <div class="feature-icon">🚚</div>
            <h3>Free Global Delivery</h3>
            <p>On all orders above $75 with comprehensive parcel tracking.</p>
          </div>
          <div class="feature-card feature-item">
            <div class="feature-icon">🛡️</div>
            <h3>2-Year Warranty</h3>
            <p>Complete coverage against defects with hassle-free replacements.</p>
          </div>
          <div class="feature-card feature-item">
            <div class="feature-icon">🔄</div>
            <h3>30-Day Easy Returns</h3>
            <p>Shop with confidence with our 30-day money-back guarantee.</p>
          </div>
        </div>
      </section>

      <footer class="site-footer">
        <div class="footer-columns">
          <div class="footer-column footer-col">
            <h4>Products</h4>
            <ul>
              <li><a href="#">Headphones</a></li>
              <li><a href="#">Smartwatches</a></li>
              <li><a href="#">Accessories</a></li>
            </ul>
          </div>
          <div class="footer-column footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Sustainability</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>
          <div class="footer-column footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Contact Support</a></li>
              <li><a href="#">Shipping Status</a></li>
            </ul>
          </div>
        </div>
        <p class="copyright">© 2026 Brand Inc. All rights reserved.</p>
      </footer>
    `;

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
      pageUrl: 'https://brand-shop.example.com',
      title: 'Modern Essentials Store',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Detection of Reusable Component Categories', () => {
    it('detects ProductCard with full props, slots, variants, children, and geometry', () => {
      const data = buildRichEcommerceMockData();
      const system = detectReusableComponents(data);

      expect(system.components['ProductCard']).toBeDefined();
      const card = system.components['ProductCard'];

      expect(card.componentName).toBe('ProductCard');
      expect(card.category).toBe('card');
      expect(card.instanceCount).toBeGreaterThanOrEqual(4);
      expect(card.confidence).toBeGreaterThanOrEqual(0.85);

      // Verify Props
      const propNames = card.props.map((p) => p.name);
      expect(propNames).toContain('title');
      expect(propNames).toContain('price');
      expect(propNames).toContain('badge');
      expect(propNames).toContain('image');
      expect(propNames).toContain('rating');
      expect(propNames).toContain('wishlist');

      // Verify Slots
      const slotNames = card.slots.map((s) => s.name);
      expect(slotNames).toContain('media');
      expect(slotNames).toContain('title');
      expect(slotNames).toContain('price');
      expect(slotNames).toContain('badge');
      expect(slotNames).toContain('wishlist');

      // Verify Variants
      const variantNames = card.variants.map((v) => v.name);
      expect(variantNames).toContain('variant');
      const styleVariant = card.variants.find((v) => v.name === 'variant');
      expect(styleVariant?.values).toContain('sale');
      expect(styleVariant?.values).toContain('normal');
      expect(styleVariant?.values).toContain('featured');

      // Verify Children subcomponents
      const childRoles = card.children.map((c) => c.name);
      expect(childRoles).toContain('Media');
      expect(childRoles).toContain('Title');
      expect(childRoles).toContain('Price');
      expect(childRoles).toContain('Badge');
      expect(childRoles).toContain('WishlistButton');

      // Verify Geometry and Responsive Behavior
      expect(card.geometry.aspectRatio).toBeGreaterThan(0);
      expect(card.responsiveBehaviour.layoutMode).toBe('flex');
      expect(card.responsiveBehaviour.stackOnMobile).toBe(true);
      expect(card.responsiveBehaviour.gridColumns).toBeDefined();
    });

    it('detects CategoryCard with expected props, slots, and responsive structure', () => {
      const data = buildRichEcommerceMockData();
      const system = detectReusableComponents(data);

      expect(system.components['CategoryCard']).toBeDefined();
      const catCard = system.components['CategoryCard'];

      expect(catCard.componentName).toBe('CategoryCard');
      expect(catCard.category).toBe('card');
      expect(catCard.instanceCount).toBe(3);

      const propNames = catCard.props.map((p) => p.name);
      expect(propNames).toContain('title');
      expect(propNames).toContain('image');

      expect(catCard.slots.some((s) => s.name === 'media')).toBe(true);
      expect(catCard.slots.some((s) => s.name === 'title')).toBe(true);
      expect(catCard.variants.some((v) => v.values.includes('standard'))).toBe(true);
    });

    it('detects FeatureCard with icon, title, and description props', () => {
      const data = buildRichEcommerceMockData();
      const system = detectReusableComponents(data);

      expect(system.components['FeatureCard']).toBeDefined();
      const featCard = system.components['FeatureCard'];

      expect(featCard.componentName).toBe('FeatureCard');
      expect(featCard.instanceCount).toBe(3);

      const propNames = featCard.props.map((p) => p.name);
      expect(propNames).toContain('title');
      expect(propNames).toContain('description');
      expect(propNames).toContain('icon');

      expect(featCard.children.some((c) => c.name === 'IconMedia')).toBe(true);
      expect(featCard.children.some((c) => c.name === 'Title')).toBe(true);
      expect(featCard.children.some((c) => c.name === 'Description')).toBe(true);
    });

    it('detects NavigationItem with label, href, and navigation variants', () => {
      const data = buildRichEcommerceMockData();
      const system = detectReusableComponents(data);

      expect(system.components['NavigationItem']).toBeDefined();
      const navItem = system.components['NavigationItem'];

      expect(navItem.componentName).toBe('NavigationItem');
      expect(navItem.category).toBe('navigation');
      expect(navItem.instanceCount).toBeGreaterThanOrEqual(4);

      const propNames = navItem.props.map((p) => p.name);
      expect(propNames).toContain('label');
      expect(propNames).toContain('href');
      expect(navItem.responsiveBehaviour.layoutMode).toBe('inline-flex');
    });

    it('detects FooterColumn with heading and link list props', () => {
      const data = buildRichEcommerceMockData();
      const system = detectReusableComponents(data);

      expect(system.components['FooterColumn']).toBeDefined();
      const footerCol = system.components['FooterColumn'];

      expect(footerCol.componentName).toBe('FooterColumn');
      expect(footerCol.category).toBe('layout');
      expect(footerCol.instanceCount).toBe(3);

      const propNames = footerCol.props.map((p) => p.name);
      expect(propNames).toContain('heading');
      expect(propNames).toContain('links');
    });

    it('detects Button with label, variants, sizes, and interactive state models', () => {
      const data = buildRichEcommerceMockData();
      const system = detectReusableComponents(data);

      expect(system.components['Button']).toBeDefined();
      const btn = system.components['Button'];

      expect(btn.componentName).toBe('Button');
      expect(btn.category).toBe('primitive');
      expect(btn.instanceCount).toBeGreaterThanOrEqual(4);

      const propNames = btn.props.map((p) => p.name);
      expect(propNames).toContain('label');
      expect(propNames).toContain('variant');
      expect(propNames).toContain('disabled');

      const variant = btn.variants.find((v) => v.name === 'variant');
      expect(variant?.values).toContain('primary');
      expect(variant?.values).toContain('secondary');
      expect(variant?.values).toContain('outline');
    });

    it('detects Badge with text and semantic status variants', () => {
      const data = buildRichEcommerceMockData();
      const system = detectReusableComponents(data);

      expect(system.components['Badge']).toBeDefined();
      const badge = system.components['Badge'];

      expect(badge.componentName).toBe('Badge');
      expect(badge.category).toBe('feedback');
      expect(badge.instanceCount).toBeGreaterThanOrEqual(3);

      const propNames = badge.props.map((p) => p.name);
      expect(propNames).toContain('text');
      expect(propNames).toContain('variant');

      const variant = badge.variants.find((v) => v.name === 'variant');
      expect(variant?.values).toContain('sale');
      expect(variant?.values).toContain('new');
      expect(variant?.values).toContain('discount');
    });
  });

  describe('2. Multi-Dimensional Confidence Scoring & Field Completeness', () => {
    it('guarantees valid confidence scores (0.70 - 1.00) across all detected reusable components', () => {
      const data = buildRichEcommerceMockData();
      const system = detectReusableComponents(data);

      expect(system.definitions.length).toBeGreaterThanOrEqual(4);
      system.definitions.forEach((def) => {
        expect(def.confidence).toBeGreaterThanOrEqual(0.70);
        expect(def.confidence).toBeLessThanOrEqual(1.00);
        expect(def.id).toMatch(/^comp_/);
        expect(def.componentName).toBeDefined();
        expect(def.category).toBeDefined();
        expect(def.instanceCount).toBeGreaterThanOrEqual(1);
        expect(def.props.length).toBeGreaterThan(0);
        expect(def.slots.length).toBeGreaterThan(0);
        expect(def.variants.length).toBeGreaterThan(0);
        expect(def.children.length).toBeGreaterThan(0);
        expect(def.geometry).toBeDefined();
        expect(def.geometry.aspectRatio).toBeGreaterThan(0);
        expect(def.responsiveBehaviour).toBeDefined();
        expect(def.evidence.length).toBeGreaterThan(0);
      });
    });

    it('correctly calculates computeReusableConfidence and computeGeometryMetrics', () => {
      const confidence = computeReusableConfidence(8, 'card', [], 3);
      expect(confidence).toBeGreaterThanOrEqual(0.85);

      const geom = computeGeometryMetrics([]);
      expect(geom.avgWidth).toBe(280);
      expect(geom.avgHeight).toBe(320);
      expect(geom.aspectRatio).toBe(0.75);
    });
  });

  describe('3. components.json Export and Integration Pipeline', () => {
    it('exports a valid components.json payload containing all detected reusable components', () => {
      const data = buildRichEcommerceMockData();
      const jsonStr = exportComponentsJson(data);

      expect(typeof jsonStr).toBe('string');
      const parsed = JSON.parse(jsonStr);

      expect(parsed.$schema).toContain('reusable-components');
      expect(parsed.totalComponents).toBeGreaterThanOrEqual(4);
      expect(parsed.components).toBeDefined();
      expect(parsed.components['ProductCard']).toBeDefined();
      expect(parsed.components['Button']).toBeDefined();
      expect(parsed.definitions).toBeDefined();
      expect(Array.isArray(parsed.definitions)).toBe(true);

      // Verify ProductCard in exported components.json
      const card = parsed.components['ProductCard'];
      expect(card.name).toBe('ProductCard');
      expect(card.props.some((p: any) => p.name === 'title')).toBe(true);
      expect(card.props.some((p: any) => p.name === 'price')).toBe(true);
      expect(card.props.some((p: any) => p.name === 'badge')).toBe(true);
      expect(card.props.some((p: any) => p.name === 'image')).toBe(true);
      expect(card.props.some((p: any) => p.name === 'rating')).toBe(true);
      expect(card.props.some((p: any) => p.name === 'wishlist')).toBe(true);
      expect(card.variants.some((v: any) => v.name === 'variant')).toBe(true);
    });

    it('supports standalone components-json format in ArtifactExporter', () => {
      const data = buildRichEcommerceMockData();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'components-json');
      expect(result.format).toBe('components-json');
      expect(result.exportedData).toBeDefined();

      const parsed = JSON.parse(result.exportedData);
      expect(parsed.components).toBeDefined();
      expect(parsed.definitions).toBeDefined();
    });
  });

  describe('4. Cross-Site Consistency & Regression Guardrails', () => {
    it('consistently groups repeated structures across diverse layout structures without regressions', () => {
      document.body.innerHTML = `
        <div class="saas-features">
          <div class="feature-item" style="width: 300px; height: 200px;">
            <svg class="icon"><path d="M0 0h24v24H0z"/></svg>
            <h3>Real-time Analytics</h3>
            <p>Track metrics instantly with zero latency.</p>
          </div>
          <div class="feature-item" style="width: 300px; height: 200px;">
            <svg class="icon"><path d="M0 0h24v24H0z"/></svg>
            <h3>Collaborative Workflows</h3>
            <p>Work seamlessly together across departments.</p>
          </div>
          <div class="feature-item" style="width: 300px; height: 200px;">
            <svg class="icon"><path d="M0 0h24v24H0z"/></svg>
            <h3>Automated Compliance</h3>
            <p>Enterprise grade security and audit logs.</p>
          </div>
        </div>
      `;

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

      const saasData: AnalyzePageResponseData = {
        status: 'completed',
        pageUrl: 'https://saas-platform.example.com',
        title: 'SaaS Platform Home',
        timestamp: 1700000000000,
        extractionResult: rawResult,
        colorSystem,
        typographySystem,
        shapeSystem,
        layoutSystem,
        componentSystem,
      };

      const system = detectReusableComponents(saasData);
      expect(system.components['FeatureCard']).toBeDefined();
      expect(system.components['FeatureCard'].instanceCount).toBe(3);
      expect(system.components['FeatureCard'].props.map((p) => p.name)).toContain('title');
      expect(system.components['FeatureCard'].props.map((p) => p.name)).toContain('description');
    });
  });
});
