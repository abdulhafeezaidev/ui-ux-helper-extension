/**
 * Multi-Site Fixture Generators for Generalization & Quality Audit
 * Provides deterministic HTML DOM representations for 6 representative web application categories.
 */

export function getEcommerceFixtureHTML(): string {
  return `
    <div id="app">
      <header id="header" style="background: white; padding: 16px;">
        <nav role="navigation" style="display: flex; gap: 16px;">
          <a href="#">Shop</a><a href="#">Deals</a><a href="#">Contact</a>
        </nav>
      </header>
      <section id="promo" style="background: red; color: white; padding: 8px; text-align: center;">
        <span>Big Sale! 50% Off</span>
      </section>
      <main id="main" role="main">
        <section id="hero" style="padding: 40px; background: #f8fafc; text-align: center;">
          <h1 style="font-size: 36px;">New Summer Collection</h1>
          <button role="button" style="background: black; color: white; padding: 12px 24px; border-radius: 999px;">Shop Collection</button>
        </section>
        <section id="products" style="padding: 32px; background: white;">
          <h2>Featured Products</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
            <div id="p1" class="product-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <img src="p1.jpg" style="width: 100%; height: 150px;" />
              <span class="badge" style="background: green; color: white; padding: 2px 6px; border-radius: 4px;">NEW</span>
              <h4>Linen Shirt</h4><p>$49.00</p>
              <button role="button" style="width: 100%; background: blue; color: white; padding: 8px; border-radius: 4px;">Add to Cart</button>
            </div>
            <div id="p2" class="product-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <img src="p2.jpg" style="width: 100%; height: 150px;" />
              <span class="badge" style="background: red; color: white; padding: 2px 6px; border-radius: 4px;">SALE</span>
              <h4>Chino Shorts</h4><p>$35.00</p>
              <button role="button" style="width: 100%; background: blue; color: white; padding: 8px; border-radius: 4px;">Add to Cart</button>
            </div>
            <div id="p3" class="product-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <img src="p3.jpg" style="width: 100%; height: 150px;" />
              <h4>Summer Dress</h4><p>$69.00</p>
              <button role="button" style="width: 100%; background: blue; color: white; padding: 8px; border-radius: 4px;">Add to Cart</button>
            </div>
            <div id="p4" class="product-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <img src="p4.jpg" style="width: 100%; height: 150px;" />
              <h4>Denim Jacket</h4><p>$79.00</p>
              <button role="button" style="width: 100%; background: blue; color: white; padding: 8px; border-radius: 4px;">Add to Cart</button>
            </div>
          </div>
        </section>
      </main>
      <footer id="footer" role="contentinfo" style="background: #0f172a; color: white; padding: 32px;"><p>© 2026 Store</p></footer>
    </div>
  `;
}

export function getSaasLandingFixtureHTML(): string {
  return `
    <div id="saas-app">
      <header id="saas-header" style="background: white; padding: 20px;">
        <nav role="navigation" style="display: flex; justify-content: space-between;">
          <div style="font-weight: bold; font-size: 20px;">SaaSify</div>
          <div style="display: flex; gap: 12px;">
            <a href="#">Features</a><a href="#">Pricing</a>
            <button role="button" style="background: #3b82f6; color: white; padding: 8px 16px; border-radius: 6px;">Start Free Trial</button>
          </div>
        </nav>
      </header>
      <main role="main">
        <section id="saas-hero" style="padding: 60px; background: #eff6ff; text-align: center;">
          <h1 style="font-size: 48px; color: #1e3a8a;">Build AI Interfaces Faster</h1>
          <p style="font-size: 20px; color: #475569;">Automate design system reverse engineering with precision.</p>
          <button role="button" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; margin-top: 20px;">Get Started Now</button>
        </section>
        <section id="saas-features" style="padding: 48px; background: white;">
          <h2 style="text-align: center;">Powerful Features</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 32px;">
            <div class="feat-card" style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <h3>DOM Extraction</h3><p>Extract visible geometry and computed styles.</p>
            </div>
            <div class="feat-card" style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <h3>Token Normalization</h3><p>Cluster colors, typography, and spacing scales.</p>
            </div>
            <div class="feat-card" style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <h3>ADS Specification</h3><p>Produce high-signal design context for coding agents.</p>
            </div>
          </div>
        </section>
      </main>
      <footer role="contentinfo" style="background: #1e293b; color: white; padding: 40px;"><p>© 2026 SaaSify Inc.</p></footer>
    </div>
  `;
}

export function getNewsEditorialFixtureHTML(): string {
  return `
    <div id="news-app">
      <header style="background: #1e293b; color: white; padding: 16px;">
        <h1 style="font-size: 28px;">The Daily Intelligence</h1>
        <nav role="navigation" style="display: flex; gap: 12px; margin-top: 8px;">
          <a href="#" style="color: white;">World</a><a href="#" style="color: white;">Tech</a><a href="#" style="color: white;">Design</a>
        </nav>
      </header>
      <main role="main" style="padding: 24px; display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
        <section id="lead-story">
          <article style="border-bottom: 1px solid #cbd5e1; padding-bottom: 24px;">
            <img src="news.jpg" style="width: 100%; height: 300px;" />
            <h2 style="font-size: 32px; margin-top: 16px;">Major Breakthrough in AI Agent Architecture</h2>
            <p style="font-size: 16px; color: #334155;">Researchers unveil deterministic reference engines for web engineering.</p>
          </article>
        </section>

        <aside id="sidebar-news" style="background: #f8fafc; padding: 16px; border-radius: 8px;">
          <h3>Trending Stories</h3>
          <ul role="list" style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><a href="#">1. Web Extraction Standard 2026</a></li>
            <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><a href="#">2. Browser Extension V3 Guidance</a></li>
            <li style="padding: 8px 0;"><a href="#">3. Color System Science</a></li>
          </ul>
        </aside>
      </main>
      <footer role="contentinfo" style="background: #0f172a; color: white; padding: 24px;"><p>© 2026 The Daily Intelligence</p></footer>
    </div>
  `;
}

export function getPortfolioFixtureHTML(): string {
  return `
    <div id="portfolio-app">
      <header style="padding: 24px; display: flex; justify-content: space-between;">
        <div style="font-weight: bold;">Alex Rivera — Product Designer</div>
        <nav role="navigation" style="display: flex; gap: 16px;">
          <a href="#">Work</a><a href="#">About</a><a href="#">Contact</a>
        </nav>
      </header>
      <main role="main">
        <section id="portfolio-hero" style="padding: 80px 24px; background: #fafafa; text-align: center;">
          <h1 style="font-size: 56px;">Crafting Digital Experiences</h1>
          <p style="font-size: 24px; color: #666;">UI/UX Design & System Architecture</p>
        </section>

        <section id="projects" style="padding: 48px 24px;">
          <h2>Selected Work</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
            <div class="proj-card" style="border-radius: 12px; overflow: hidden; border: 1px solid #eee; padding: 16px;">
              <img src="p1.jpg" style="width: 100%; height: 200px;" />
              <h3>Design System Refiner</h3><p>Case Study — 2026</p>
            </div>
            <div class="proj-card" style="border-radius: 12px; overflow: hidden; border: 1px solid #eee; padding: 16px;">
              <img src="p2.jpg" style="width: 100%; height: 200px;" />
              <h3>Mobile Analytics App</h3><p>Case Study — 2025</p>
            </div>
          </div>
        </section>

        <section id="contact-form-sec" style="padding: 48px 24px; background: #f0fdf4;">
          <h2>Let's Work Together</h2>
          <form role="form" style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
            <input type="text" placeholder="Your Name" style="padding: 10px; border-radius: 6px; border: 1px solid #ccc;" />
            <input type="email" placeholder="Your Email" style="padding: 10px; border-radius: 6px; border: 1px solid #ccc;" />
            <button role="button" style="background: #16a34a; color: white; padding: 12px; border-radius: 6px;">Send Message</button>
          </form>
        </section>
      </main>
      <footer role="contentinfo" style="padding: 24px; text-align: center;"><p>© 2026 Alex Rivera</p></footer>
    </div>
  `;
}

export function getDashboardFixtureHTML(): string {
  return `
    <div id="dashboard-app" style="display: flex; min-height: 600px;">
      <aside id="sidebar-nav" style="width: 240px; background: #1e293b; color: white; padding: 20px;">
        <h2>Admin Console</h2>
        <nav role="navigation" style="display: flex; flex-direction: column; gap: 12px; margin-top: 24px;">
          <a href="#" style="color: white;">Overview</a>
          <a href="#" style="color: white;">Analytics</a>
          <a href="#" style="color: white;">Users</a>
          <a href="#" style="color: white;">Settings</a>
        </nav>
      </aside>

      <main role="main" style="flex: 1; padding: 24px; background: #f1f5f9;">
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2>Dashboard Overview</h2>
          <input type="text" placeholder="Search analytics..." style="padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;" />
        </header>

        <section id="metrics-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
          <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span>Total Revenue</span><h3>$128,450</h3>
          </div>
          <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span>Active Users</span><h3>14,230</h3>
          </div>
          <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span>Conversion Rate</span><h3>3.42%</h3>
          </div>
          <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span>System Health</span><h3>99.98%</h3>
          </div>
        </section>
      </main>
    </div>
  `;
}

export function getInformationalDocsFixtureHTML(): string {
  return `
    <div id="docs-app">
      <header style="background: #0f172a; color: white; padding: 16px 32px;">
        <h1>Agent Specification Docs</h1>
      </header>

      <div style="display: grid; grid-template-columns: 240px 1fr; gap: 32px; padding: 32px;">
        <aside id="toc-nav" style="border-right: 1px solid #e2e8f0; padding-right: 16px;">
          <h3>Table of Contents</h3>
          <ul role="list" style="list-style: none; padding: 0;">
            <li><a href="#intro">1. Introduction</a></li>
            <li><a href="#schema">2. ADS Schema Reference</a></li>
            <li><a href="#faq">3. Frequently Asked Questions</a></li>
          </ul>
        </aside>

        <main role="main">
          <section id="intro-sec">
            <h2>1. Introduction</h2>
            <p>The Agent Design Specification (ADS) bridges visual DOM extractions and AI coding agents.</p>
          </section>

          <section id="faq-sec" style="margin-top: 32px;">
            <h2>3. Frequently Asked Questions</h2>
            <div class="faq-card" style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-top: 12px; border: 1px solid #e2e8f0;">
              <h4>Does ADS generate UI code?</h4>
              <p>No. ADS is a pure reference specification describing design system tokens and component rules.</p>
            </div>
            <div class="faq-card" style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-top: 12px; border: 1px solid #e2e8f0;">
              <h4>Are outputs deterministic?</h4>
              <p>Yes. Identical DOM inputs produce 100% byte-for-byte identical exports.</p>
            </div>
          </section>
        </main>
      </div>

      <footer role="contentinfo" style="background: #0f172a; color: white; padding: 24px; text-align: center;"><p>© 2026 Docs Engine</p></footer>
    </div>
  `;
}

export interface BenchmarkGroundTruth {
  platform: string;
  frameworkName: string;
  expectedSections: string[];
  expectedProductCardCount: number;
  expectedGridColumns: number;
  expectedBrandColor: string;
  expectedFontFamily: string;
  expectedAssetCount: number;
  expectedInteractions: string[];
}

export interface EcommerceBenchmarkCase {
  id: string;
  title: string;
  platform: string;
  frameworkName: string;
  url: string;
  html: string;
  groundTruth: BenchmarkGroundTruth;
}

// 1. SHOPIFY FIXTURE (Dawn-style theme architecture)
export const shopifyBenchmarkCase: EcommerceBenchmarkCase = {
  id: 'shopify-dawn',
  title: 'Shopify Dawn Collection Storefront',
  platform: 'Shopify',
  frameworkName: 'Liquid / Web Components',
  url: 'https://store.myshopify.com/collections/apparel',
  groundTruth: {
    platform: 'Shopify',
    frameworkName: 'Liquid / Web Components',
    expectedSections: ['navigation', 'hero', 'featureSection', 'footer'],
    expectedProductCardCount: 4,
    expectedGridColumns: 4,
    expectedBrandColor: '#121212',
    expectedFontFamily: 'Assistant',
    expectedAssetCount: 4,
    expectedInteractions: ['Navigation Drawer Toggle', 'Product Card Hover State'],
  },
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Apparel Collection – Shopify Dawn Store</title>
</head>
<body style="margin: 0; background-color: #ffffff; color: #121212; font-family: Assistant, sans-serif;">
  <header id="shopify-section-header" class="shopify-section section-header" style="position: sticky; top: 0; background-color: #ffffff; border-bottom: 1px solid #e8e8e8; padding: 16px 24px;">
    <nav class="header__inline-menu" role="navigation" style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
      <a href="/" class="header__heading-link" style="font-size: 24px; font-weight: 700; color: #121212; text-decoration: none;">SHOPIFY BRAND</a>
      <ul class="list-menu" style="display: flex; gap: 20px; list-style: none; margin: 0; padding: 0;">
        <li><a href="/collections/all" style="color: #121212; text-decoration: none; font-size: 15px;">Shop All</a></li>
        <li><a href="/collections/men" style="color: #121212; text-decoration: none; font-size: 15px;">Men</a></li>
        <li><a href="/collections/women" style="color: #121212; text-decoration: none; font-size: 15px;">Women</a></li>
      </ul>
      <button class="header__icon--menu" style="background: none; border: 1px solid #121212; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Menu</button>
    </nav>
  </header>
  <main id="MainContent" class="content-for-layout">
    <section id="shopify-section-banner" class="shopify-section collection-hero" style="background-color: #f3f3f3; padding: 48px 24px; text-align: center;">
      <h1 class="collection-hero__title" style="font-size: 36px; font-weight: 700; margin: 0 0 12px 0;">Autumn Collection 2026</h1>
      <p class="collection-hero__description" style="font-size: 16px; color: #555555; max-width: 600px; margin: 0 auto;">Explore the latest premium seasonal styles.</p>
    </section>
    <section id="shopify-section-product-grid" class="shopify-section product-grid-container" style="max-width: 1200px; margin: 40px auto; padding: 0 24px;">
      <div class="collection-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
        <div class="card-wrapper product-card-wrapper" style="border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden; background: #ffffff; padding: 12px;">
          <div class="card__inner" style="position: relative;">
            <img src="https://cdn.shopify.com/s/files/1/prod1.jpg" alt="Wool Overcoat" style="width: 100%; height: 260px; object-fit: cover;" />
            <span class="badge badge--bottom-left" style="position: absolute; top: 10px; left: 10px; background-color: #d30202; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">SALE</span>
          </div>
          <div class="card__content" style="padding: 12px 0;">
            <h3 class="card__heading" style="font-size: 16px; margin: 0 0 6px 0; font-weight: 600;">Wool Tailored Overcoat</h3>
            <div class="price" style="font-size: 15px; font-weight: 700; color: #121212;">$189.00</div>
            <button class="button button--secondary" style="width: 100%; margin-top: 10px; padding: 8px 0; background-color: #121212; color: #ffffff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Add to Cart</button>
          </div>
        </div>
        <div class="card-wrapper product-card-wrapper" style="border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden; background: #ffffff; padding: 12px;">
          <div class="card__inner" style="position: relative;">
            <img src="https://cdn.shopify.com/s/files/1/prod2.jpg" alt="Cashmere Knit" style="width: 100%; height: 260px; object-fit: cover;" />
            <span class="badge badge--bottom-left" style="position: absolute; top: 10px; left: 10px; background-color: #10b981; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">NEW</span>
          </div>
          <div class="card__content" style="padding: 12px 0;">
            <h3 class="card__heading" style="font-size: 16px; margin: 0 0 6px 0; font-weight: 600;">Cashmere Crewneck Knit</h3>
            <div class="price" style="font-size: 15px; font-weight: 700; color: #121212;">$129.00</div>
            <button class="button button--secondary" style="width: 100%; margin-top: 10px; padding: 8px 0; background-color: #121212; color: #ffffff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Add to Cart</button>
          </div>
        </div>
        <div class="card-wrapper product-card-wrapper" style="border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden; background: #ffffff; padding: 12px;">
          <div class="card__inner">
            <img src="https://cdn.shopify.com/s/files/1/prod3.jpg" alt="Cotton Chinos" style="width: 100%; height: 260px; object-fit: cover;" />
          </div>
          <div class="card__content" style="padding: 12px 0;">
            <h3 class="card__heading" style="font-size: 16px; margin: 0 0 6px 0; font-weight: 600;">Pleated Cotton Chinos</h3>
            <div class="price" style="font-size: 15px; font-weight: 700; color: #121212;">$89.00</div>
            <button class="button button--secondary" style="width: 100%; margin-top: 10px; padding: 8px 0; background-color: #121212; color: #ffffff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Add to Cart</button>
          </div>
        </div>
        <div class="card-wrapper product-card-wrapper" style="border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden; background: #ffffff; padding: 12px;">
          <div class="card__inner">
            <img src="https://cdn.shopify.com/s/files/1/prod4.jpg" alt="Leather Boots" style="width: 100%; height: 260px; object-fit: cover;" />
          </div>
          <div class="card__content" style="padding: 12px 0;">
            <h3 class="card__heading" style="font-size: 16px; margin: 0 0 6px 0; font-weight: 600;">Chelsea Leather Boots</h3>
            <div class="price" style="font-size: 15px; font-weight: 700; color: #121212;">$210.00</div>
            <button class="button button--secondary" style="width: 100%; margin-top: 10px; padding: 8px 0; background-color: #121212; color: #ffffff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Add to Cart</button>
          </div>
        </div>
      </div>
    </section>
  </main>
  <footer id="shopify-section-footer" class="shopify-section section-footer" style="background-color: #121212; color: #ffffff; padding: 48px 24px; margin-top: 64px;">
    <div class="footer__content" style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between;">
      <div>
        <h4 style="font-size: 18px; margin: 0 0 12px 0;">About Us</h4>
        <p style="color: #a0a0a0; font-size: 14px; margin: 0;">Sustainable luxury fashion designed in Europe.</p>
      </div>
      <p style="color: #777777; font-size: 13px; margin-top: 24px;">© 2026 Shopify Brand, Inc. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`
};

// 2. WOOCOMMERCE FIXTURE (Standard Storefront theme)
export const wooCommerceBenchmarkCase: EcommerceBenchmarkCase = {
  id: 'woocommerce-storefront',
  title: 'WooCommerce Storefront Catalog',
  platform: 'WooCommerce',
  frameworkName: 'WordPress / PHP / Hooks',
  url: 'https://shop.example-wp.com/shop/',
  groundTruth: {
    platform: 'WooCommerce',
    frameworkName: 'WordPress / PHP / Hooks',
    expectedSections: ['navigation', 'hero', 'featureSection', 'footer'],
    expectedProductCardCount: 4,
    expectedGridColumns: 4,
    expectedBrandColor: '#7f54b3',
    expectedFontFamily: 'Roboto',
    expectedAssetCount: 4,
    expectedInteractions: ['Filter Price Range', 'AJAX Add to Cart'],
  },
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Shop – WooCommerce Storefront</title>
</head>
<body class="woocommerce woocommerce-page archive post-type-archive-product" style="margin: 0; background: #ffffff; color: #333333; font-family: Roboto, sans-serif;">
  <header id="masthead" class="site-header" role="banner" style="background: #ffffff; border-bottom: 2px solid #7f54b3; padding: 16px 20px;">
    <div class="col-full" style="max-width: 1140px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
      <h1 class="site-title" style="margin: 0; font-size: 24px; color: #7f54b3;">WooCommerce Shop</h1>
      <nav id="site-navigation" class="main-navigation" role="navigation">
        <ul class="nav-menu" style="display: flex; gap: 16px; list-style: none; margin: 0; padding: 0;">
          <li><a href="/shop/" style="color: #333333; text-decoration: none; font-weight: 500;">Products</a></li>
          <li><a href="/cart/" style="color: #333333; text-decoration: none; font-weight: 500;">Cart</a></li>
          <li><a href="/checkout/" style="color: #333333; text-decoration: none; font-weight: 500;">Checkout</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <div class="woocommerce-products-header" style="background: #f8f9fa; padding: 32px 20px; text-align: center;">
    <h1 class="woocommerce-products-header__title page-title" style="font-size: 32px; margin: 0;">Featured Store Products</h1>
  </div>
  <div id="content" class="site-content" style="max-width: 1140px; margin: 40px auto; padding: 0 20px;">
    <main id="main" class="site-main" role="main">
      <ul class="products columns-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; list-style: none; margin: 0; padding: 0;">
        <li class="product type-product post-101 status-publish first instock product_cat-clothing has-post-thumbnail shipping-taxable purchasable product-type-simple" style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; background: #ffffff;">
          <a href="/product/hoodie-with-logo/" class="woocommerce-LoopProduct-link" style="text-decoration: none; color: inherit; display: block;">
            <span class="onsale" style="background-color: #7f54b3; color: #ffffff; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold;">Sale!</span>
            <img src="https://shop.example-wp.com/wp-content/uploads/hoodie.jpg" alt="Hoodie with Logo" style="width: 100%; height: 220px; object-fit: contain; margin: 10px 0;" />
            <h2 class="woocommerce-loop-product__title" style="font-size: 16px; margin: 8px 0; font-weight: 600;">Hoodie with Logo</h2>
            <span class="price" style="font-size: 15px; color: #7f54b3; font-weight: 700;">$45.00</span>
          </a>
          <button class="button product_type_simple add_to_cart_button" style="width: 100%; background: #7f54b3; color: #ffffff; border: none; border-radius: 4px; padding: 8px 0; margin-top: 10px; cursor: pointer; font-weight: 600;">Add to cart</button>
        </li>
        <li class="product type-product post-102 status-publish instock product_cat-accessories has-post-thumbnail shipping-taxable purchasable product-type-simple" style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; background: #ffffff;">
          <a href="/product/cap/" class="woocommerce-LoopProduct-link" style="text-decoration: none; color: inherit; display: block;">
            <img src="https://shop.example-wp.com/wp-content/uploads/cap.jpg" alt="Embroidered Cap" style="width: 100%; height: 220px; object-fit: contain; margin: 10px 0;" />
            <h2 class="woocommerce-loop-product__title" style="font-size: 16px; margin: 8px 0; font-weight: 600;">Embroidered Cap</h2>
            <span class="price" style="font-size: 15px; color: #7f54b3; font-weight: 700;">$18.00</span>
          </a>
          <button class="button product_type_simple add_to_cart_button" style="width: 100%; background: #7f54b3; color: #ffffff; border: none; border-radius: 4px; padding: 8px 0; margin-top: 10px; cursor: pointer; font-weight: 600;">Add to cart</button>
        </li>
        <li class="product type-product post-103 status-publish instock product_cat-clothing has-post-thumbnail shipping-taxable purchasable product-type-simple" style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; background: #ffffff;">
          <a href="/product/tshirt/" class="woocommerce-LoopProduct-link" style="text-decoration: none; color: inherit; display: block;">
            <img src="https://shop.example-wp.com/wp-content/uploads/tshirt.jpg" alt="V-Neck T-Shirt" style="width: 100%; height: 220px; object-fit: contain; margin: 10px 0;" />
            <h2 class="woocommerce-loop-product__title" style="font-size: 16px; margin: 8px 0; font-weight: 600;">V-Neck T-Shirt</h2>
            <span class="price" style="font-size: 15px; color: #7f54b3; font-weight: 700;">$22.00</span>
          </a>
          <button class="button product_type_simple add_to_cart_button" style="width: 100%; background: #7f54b3; color: #ffffff; border: none; border-radius: 4px; padding: 8px 0; margin-top: 10px; cursor: pointer; font-weight: 600;">Add to cart</button>
        </li>
        <li class="product type-product post-104 status-publish instock product_cat-accessories has-post-thumbnail shipping-taxable purchasable product-type-simple" style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; background: #ffffff;">
          <a href="/product/sunglasses/" class="woocommerce-LoopProduct-link" style="text-decoration: none; color: inherit; display: block;">
            <img src="https://shop.example-wp.com/wp-content/uploads/glasses.jpg" alt="Aviator Sunglasses" style="width: 100%; height: 220px; object-fit: contain; margin: 10px 0;" />
            <h2 class="woocommerce-loop-product__title" style="font-size: 16px; margin: 8px 0; font-weight: 600;">Aviator Sunglasses</h2>
            <span class="price" style="font-size: 15px; color: #7f54b3; font-weight: 700;">$55.00</span>
          </a>
          <button class="button product_type_simple add_to_cart_button" style="width: 100%; background: #7f54b3; color: #ffffff; border: none; border-radius: 4px; padding: 8px 0; margin-top: 10px; cursor: pointer; font-weight: 600;">Add to cart</button>
        </li>
      </ul>
    </main>
  </div>
  <footer id="colophon" class="site-footer" role="contentinfo" style="background: #2b2d42; color: #edf2f4; padding: 40px 20px; margin-top: 60px;">
    <div class="col-full" style="max-width: 1140px; margin: 0 auto; text-align: center;">
      <p style="margin: 0; font-size: 14px;">Built with WooCommerce & Storefront.</p>
    </div>
  </footer>
</body>
</html>`
};

// 3. MAGENTO / ADOBE COMMERCE FIXTURE
export const magentoBenchmarkCase: EcommerceBenchmarkCase = {
  id: 'magento-luma',
  title: 'Magento 2 / Adobe Commerce Catalog',
  platform: 'Magento',
  frameworkName: 'PHP / XML / RequireJS / Hyvä',
  url: 'https://magento.example.com/gear/fitness-equipment.html',
  groundTruth: {
    platform: 'Magento',
    frameworkName: 'PHP / XML / RequireJS / Hyvä',
    expectedSections: ['navigation', 'hero', 'featureSection', 'footer'],
    expectedProductCardCount: 3,
    expectedGridColumns: 3,
    expectedBrandColor: '#ff5501',
    expectedFontFamily: 'Open Sans',
    expectedAssetCount: 3,
    expectedInteractions: ['Layered Navigation Filter', 'Add to Wishlist'],
  },
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fitness Equipment - Gear - Magento Store</title>
</head>
<body class="page-products categorypath-gear category-fitness-equipment" style="margin: 0; background: #ffffff; color: #333333; font-family: 'Open Sans', sans-serif;">
  <header class="page-header" style="border-bottom: 1px solid #cccccc; padding: 15px 30px; background: #ffffff;">
    <div class="header content" style="max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
      <a class="logo" href="/" style="font-size: 22px; font-weight: 800; color: #ff5501; text-decoration: none;">MAGENTO COMMERCE</a>
      <nav class="navigation" style="display: flex; gap: 20px;">
        <a href="/whats-new.html" style="color: #333333; text-decoration: none; font-weight: 600;">What's New</a>
        <a href="/women.html" style="color: #333333; text-decoration: none; font-weight: 600;">Women</a>
        <a href="/men.html" style="color: #333333; text-decoration: none; font-weight: 600;">Men</a>
        <a href="/gear.html" style="color: #ff5501; text-decoration: none; font-weight: 600;">Gear</a>
      </nav>
    </div>
  </header>
  <div class="page-title-wrapper" style="background: #f5f5f5; padding: 24px 30px;">
    <div style="max-width: 1280px; margin: 0 auto;">
      <h1 class="page-title" style="margin: 0; font-size: 28px; font-weight: 700;">Fitness Equipment</h1>
    </div>
  </div>
  <main id="maincontent" class="page-main" style="max-width: 1280px; margin: 30px auto; padding: 0 30px;">
    <div class="products wrapper grid products-grid">
      <ol class="products list items product-items" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; list-style: none; margin: 0; padding: 0;">
        <li class="item product product-item" style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; background: #ffffff;">
          <div class="product-item-info">
            <a href="/gear/duffle-bag.html" class="product photo product-item-photo" style="display: block;">
              <img src="https://magento.example.com/media/catalog/bag.jpg" alt="Endeavour Duffle Bag" style="width: 100%; height: 240px; object-fit: cover;" />
            </a>
            <div class="product details product-item-details" style="padding-top: 10px;">
              <strong class="product name product-item-name" style="display: block; font-size: 15px; margin-bottom: 5px;">
                <a href="/gear/duffle-bag.html" style="color: #333333; text-decoration: none;">Endeavour Duffle Bag</a>
              </strong>
              <div class="price-box price-final_price" style="font-size: 18px; font-weight: 700; color: #333333; margin: 8px 0;">$74.00</div>
              <button type="submit" class="action tocart primary" style="width: 100%; background: #ff5501; color: #ffffff; border: none; padding: 10px 0; border-radius: 3px; font-weight: 700; cursor: pointer;">Add to Cart</button>
            </div>
          </div>
        </li>
        <li class="item product product-item" style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; background: #ffffff;">
          <div class="product-item-info">
            <a href="/gear/yoga-mat.html" class="product photo product-item-photo" style="display: block;">
              <img src="https://magento.example.com/media/catalog/mat.jpg" alt="Harmony Yoga Mat" style="width: 100%; height: 240px; object-fit: cover;" />
            </a>
            <div class="product details product-item-details" style="padding-top: 10px;">
              <strong class="product name product-item-name" style="display: block; font-size: 15px; margin-bottom: 5px;">
                <a href="/gear/yoga-mat.html" style="color: #333333; text-decoration: none;">Harmony Yoga Mat</a>
              </strong>
              <div class="price-box price-final_price" style="font-size: 18px; font-weight: 700; color: #333333; margin: 8px 0;">$32.00</div>
              <button type="submit" class="action tocart primary" style="width: 100%; background: #ff5501; color: #ffffff; border: none; padding: 10px 0; border-radius: 3px; font-weight: 700; cursor: pointer;">Add to Cart</button>
            </div>
          </div>
        </li>
        <li class="item product product-item" style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; background: #ffffff;">
          <div class="product-item-info">
            <a href="/gear/foam-roller.html" class="product photo product-item-photo" style="display: block;">
              <img src="https://magento.example.com/media/catalog/roller.jpg" alt="Core Foam Roller" style="width: 100%; height: 240px; object-fit: cover;" />
            </a>
            <div class="product details product-item-details" style="padding-top: 10px;">
              <strong class="product name product-item-name" style="display: block; font-size: 15px; margin-bottom: 5px;">
                <a href="/gear/foam-roller.html" style="color: #333333; text-decoration: none;">Core Foam Roller</a>
              </strong>
              <div class="price-box price-final_price" style="font-size: 18px; font-weight: 700; color: #333333; margin: 8px 0;">$24.00</div>
              <button type="submit" class="action tocart primary" style="width: 100%; background: #ff5501; color: #ffffff; border: none; padding: 10px 0; border-radius: 3px; font-weight: 700; cursor: pointer;">Add to Cart</button>
            </div>
          </div>
        </li>
      </ol>
    </div>
  </main>
  <footer class="page-footer" style="background: #333333; color: #ffffff; padding: 40px 30px; margin-top: 60px;">
    <div class="footer content" style="max-width: 1280px; margin: 0 auto;">
      <p style="margin: 0; font-size: 14px;">Copyright © 2026 Adobe Magento Inc. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`
};

// 4. BIGCOMMERCE FIXTURE
export const bigCommerceBenchmarkCase: EcommerceBenchmarkCase = {
  id: 'bigcommerce-cornerstone',
  title: 'BigCommerce Cornerstone Storefront',
  platform: 'BigCommerce',
  frameworkName: 'Stencil / Handlebars',
  url: 'https://store-xyz.mybigcommerce.com/electronics/',
  groundTruth: {
    platform: 'BigCommerce',
    frameworkName: 'Stencil / Handlebars',
    expectedSections: ['navigation', 'hero', 'featureSection', 'footer'],
    expectedProductCardCount: 3,
    expectedGridColumns: 3,
    expectedBrandColor: '#0052cc',
    expectedFontFamily: 'Inter',
    expectedAssetCount: 3,
    expectedInteractions: ['Quick View Modal', 'Compare Checkbox'],
  },
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Electronics - BigCommerce Store</title>
</head>
<body style="margin: 0; background: #ffffff; color: #222222; font-family: Inter, sans-serif;">
  <header class="header" role="banner" style="border-bottom: 1px solid #e1e4e8; padding: 16px 24px;">
    <div class="container" style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
      <h1 class="header-logo" style="margin: 0; font-size: 22px; color: #0052cc;">BIGCOMMERCE STORE</h1>
      <nav class="navPages">
        <ul class="navPages-list" style="display: flex; gap: 20px; list-style: none; margin: 0; padding: 0;">
          <li><a href="/electronics" style="color: #0052cc; text-decoration: none; font-weight: 600;">Electronics</a></li>
          <li><a href="/audio" style="color: #222222; text-decoration: none;">Audio</a></li>
          <li><a href="/smartphones" style="color: #222222; text-decoration: none;">Smartphones</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <div class="category-header" style="background: #f4f6f8; padding: 36px 24px; text-align: center;">
    <h1 class="page-heading" style="margin: 0; font-size: 32px;">Electronics & Gadgets</h1>
  </div>
  <main class="page-content" style="max-width: 1200px; margin: 40px auto; padding: 0 24px;">
    <ul class="productGrid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; list-style: none; margin: 0; padding: 0;">
      <li class="product" style="border: 1px solid #e1e4e8; border-radius: 8px; padding: 16px; background: #ffffff;">
        <article class="card">
          <figure class="card-figure">
            <img src="https://cdn.bigcommerce.com/p1.jpg" alt="Wireless ANC Headphones" style="width: 100%; height: 220px; object-fit: contain;" />
          </figure>
          <div class="card-body" style="padding-top: 12px;">
            <h4 class="card-title" style="margin: 0 0 8px 0; font-size: 16px;"><a href="/headphones" style="color: #222222; text-decoration: none;">Wireless ANC Headphones</a></h4>
            <div class="card-text price-section" style="font-size: 18px; font-weight: 700; color: #0052cc; margin-bottom: 12px;">$199.99</div>
            <button class="button button--small card-figcaption-button" style="width: 100%; background: #0052cc; color: #ffffff; border: none; border-radius: 4px; padding: 8px 0; cursor: pointer; font-weight: 600;">Choose Options</button>
          </div>
        </article>
      </li>
      <li class="product" style="border: 1px solid #e1e4e8; border-radius: 8px; padding: 16px; background: #ffffff;">
        <article class="card">
          <figure class="card-figure">
            <img src="https://cdn.bigcommerce.com/p2.jpg" alt="Smart Fitness Watch" style="width: 100%; height: 220px; object-fit: contain;" />
          </figure>
          <div class="card-body" style="padding-top: 12px;">
            <h4 class="card-title" style="margin: 0 0 8px 0; font-size: 16px;"><a href="/watch" style="color: #222222; text-decoration: none;">Smart Fitness Watch v2</a></h4>
            <div class="card-text price-section" style="font-size: 18px; font-weight: 700; color: #0052cc; margin-bottom: 12px;">$149.50</div>
            <button class="button button--small card-figcaption-button" style="width: 100%; background: #0052cc; color: #ffffff; border: none; border-radius: 4px; padding: 8px 0; cursor: pointer; font-weight: 600;">Choose Options</button>
          </div>
        </article>
      </li>
      <li class="product" style="border: 1px solid #e1e4e8; border-radius: 8px; padding: 16px; background: #ffffff;">
        <article class="card">
          <figure class="card-figure">
            <img src="https://cdn.bigcommerce.com/p3.jpg" alt="Bluetooth Waterproof Speaker" style="width: 100%; height: 220px; object-fit: contain;" />
          </figure>
          <div class="card-body" style="padding-top: 12px;">
            <h4 class="card-title" style="margin: 0 0 8px 0; font-size: 16px;"><a href="/speaker" style="color: #222222; text-decoration: none;">Bluetooth Waterproof Speaker</a></h4>
            <div class="card-text price-section" style="font-size: 18px; font-weight: 700; color: #0052cc; margin-bottom: 12px;">$79.00</div>
            <button class="button button--small card-figcaption-button" style="width: 100%; background: #0052cc; color: #ffffff; border: none; border-radius: 4px; padding: 8px 0; cursor: pointer; font-weight: 600;">Choose Options</button>
          </div>
        </article>
      </li>
    </ul>
  </main>
  <footer class="footer" role="contentinfo" style="background: #172b4d; color: #ffffff; padding: 36px 24px; margin-top: 60px;">
    <div class="container" style="max-width: 1200px; margin: 0 auto; text-align: center;">
      <p style="margin: 0; font-size: 14px;">Powered by BigCommerce.</p>
    </div>
  </footer>
</body>
</html>`
};

// 5. NEXT.JS COMMERCE FIXTURE
export const nextJsCommerceBenchmarkCase: EcommerceBenchmarkCase = {
  id: 'nextjs-commerce',
  title: 'Next.js Commerce / Vercel Storefront',
  platform: 'Next.js Commerce',
  frameworkName: 'Next.js / React / Tailwind CSS / RSC',
  url: 'https://demo.vercel.store/search',
  groundTruth: {
    platform: 'Next.js Commerce',
    frameworkName: 'Next.js / React / Tailwind CSS / RSC',
    expectedSections: ['navigation', 'hero', 'featureSection', 'footer'],
    expectedProductCardCount: 4,
    expectedGridColumns: 4,
    expectedBrandColor: '#000000',
    expectedFontFamily: 'Geist',
    expectedAssetCount: 4,
    expectedInteractions: ['Cart Slideover Sheet', 'Dynamic Sort Selector'],
  },
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Search Products – Next.js Commerce</title>
</head>
<body style="margin: 0; background-color: #000000; color: #ffffff; font-family: Geist, Inter, sans-serif;">
  <nav class="relative flex items-center justify-between p-4 lg:px-6" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #333333; background: #000000;">
    <div style="display: flex; align-items: center; gap: 24px;">
      <a href="/" style="font-weight: 800; font-size: 20px; color: #ffffff; text-decoration: none; display: flex; align-items: center; gap: 8px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 22h20L12 2z"/></svg> ACME STORE
      </a>
      <ul style="display: flex; gap: 16px; list-style: none; margin: 0; padding: 0;">
        <li><a href="/search/all" style="color: #888888; text-decoration: none; font-size: 14px;">All</a></li>
        <li><a href="/search/shirts" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">Shirts</a></li>
        <li><a href="/search/stickers" style="color: #888888; text-decoration: none; font-size: 14px;">Stickers</a></li>
      </ul>
    </div>
    <button aria-label="Open cart" style="background: #111111; color: #ffffff; border: 1px solid #333333; padding: 8px 16px; border-radius: 9999px; cursor: pointer;">Cart (0)</button>
  </nav>
  <header style="background: #111111; padding: 48px 24px; text-align: center; border-bottom: 1px solid #222222;">
    <h1 style="font-size: 36px; font-weight: 800; margin: 0 0 8px 0;">Next-Gen Merch</h1>
    <p style="color: #888888; margin: 0; font-size: 16px;">Fast, seamless headless commerce experience.</p>
  </header>
  <main style="max-width: 1280px; margin: 40px auto; padding: 0 24px;">
    <div class="grid grid-cols-4 gap-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
      <div class="group relative block aspect-square" data-testid="product-card" style="border: 1px solid #222222; border-radius: 12px; overflow: hidden; background: #0a0a0a; padding: 16px;">
        <img src="https://demo.vercel.store/tshirt-1.png" alt="Acme Circles T-Shirt" style="width: 100%; height: 220px; object-fit: cover;" />
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
          <div>
            <h3 style="font-size: 14px; font-weight: 600; margin: 0;">Acme Circles T-Shirt</h3>
            <span style="font-size: 13px; color: #888888;">Black / L</span>
          </div>
          <span style="background: #000000; border: 1px solid #333333; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">$25.00</span>
        </div>
      </div>
      <div class="group relative block aspect-square" data-testid="product-card" style="border: 1px solid #222222; border-radius: 12px; overflow: hidden; background: #0a0a0a; padding: 16px;">
        <img src="https://demo.vercel.store/tshirt-2.png" alt="Acme Prism Hoodie" style="width: 100%; height: 220px; object-fit: cover;" />
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
          <div>
            <h3 style="font-size: 14px; font-weight: 600; margin: 0;">Acme Prism Hoodie</h3>
            <span style="font-size: 13px; color: #888888;">Grey / M</span>
          </div>
          <span style="background: #000000; border: 1px solid #333333; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">$50.00</span>
        </div>
      </div>
      <div class="group relative block aspect-square" data-testid="product-card" style="border: 1px solid #222222; border-radius: 12px; overflow: hidden; background: #0a0a0a; padding: 16px;">
        <img src="https://demo.vercel.store/cup.png" alt="Acme Ceramic Mug" style="width: 100%; height: 220px; object-fit: cover;" />
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
          <div>
            <h3 style="font-size: 14px; font-weight: 600; margin: 0;">Acme Ceramic Mug</h3>
            <span style="font-size: 13px; color: #888888;">Matte White</span>
          </div>
          <span style="background: #000000; border: 1px solid #333333; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">$15.00</span>
        </div>
      </div>
      <div class="group relative block aspect-square" data-testid="product-card" style="border: 1px solid #222222; border-radius: 12px; overflow: hidden; background: #0a0a0a; padding: 16px;">
        <img src="https://demo.vercel.store/cap.png" alt="Acme Minimalist Cap" style="width: 100%; height: 220px; object-fit: cover;" />
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
          <div>
            <h3 style="font-size: 14px; font-weight: 600; margin: 0;">Acme Minimalist Cap</h3>
            <span style="font-size: 13px; color: #888888;">One Size</span>
          </div>
          <span style="background: #000000; border: 1px solid #333333; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">$20.00</span>
        </div>
      </div>
    </div>
  </main>
  <footer style="border-top: 1px solid #222222; padding: 40px 24px; margin-top: 80px; text-align: center; color: #666666;">
    <p style="margin: 0; font-size: 13px;">Deploy your own Next.js Commerce with Vercel.</p>
  </footer>
</body>
</html>`
};

// 6. CUSTOM REACT ECOMMERCE FIXTURE
export const customReactBenchmarkCase: EcommerceBenchmarkCase = {
  id: 'custom-react-spa',
  title: 'Custom React SPA Storefront',
  platform: 'Custom React',
  frameworkName: 'React 19 / Styled Components / Vite',
  url: 'https://app.custom-react-store.io/catalog',
  groundTruth: {
    platform: 'Custom React',
    frameworkName: 'React 19 / Styled Components / Vite',
    expectedSections: ['navigation', 'hero', 'featureSection', 'footer'],
    expectedProductCardCount: 3,
    expectedGridColumns: 3,
    expectedBrandColor: '#6366f1',
    expectedFontFamily: 'Poppins',
    expectedAssetCount: 3,
    expectedInteractions: ['Theme Switcher', 'Cart Badge Counter'],
  },
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Catalog – React Modern Store</title>
</head>
<body style="margin: 0; background: #fafafa; color: #1e293b; font-family: Poppins, sans-serif;">
  <div id="root">
    <header class="sc-header-bXkz" style="background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); padding: 16px 24px;">
      <div style="max-width: 1140px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
        <span class="sc-logo-jdhK" style="font-size: 22px; font-weight: 700; color: #6366f1;">REACT LUXE</span>
        <nav style="display: flex; gap: 20px;">
          <a href="/new" style="color: #1e293b; text-decoration: none; font-size: 14px; font-weight: 500;">New Arrivals</a>
          <a href="/catalog" style="color: #6366f1; text-decoration: none; font-size: 14px; font-weight: 600;">Catalog</a>
        </nav>
        <button style="background: #6366f1; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">Cart (0)</button>
      </div>
    </header>
    <section class="sc-banner-eRyu" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 40px 24px; text-align: center;">
      <h1 style="margin: 0 0 8px 0; font-size: 32px;">Trending Designer Pieces</h1>
      <p style="margin: 0; opacity: 0.9;">Handcrafted with sustainable organic materials.</p>
    </section>
    <main style="max-width: 1140px; margin: 40px auto; padding: 0 24px;">
      <div class="sc-product-grid-kLmQ" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
        <div class="sc-card-hTyu" style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <img src="https://cdn.custom.io/item1.jpg" alt="Minimalist Watch" style="width: 100%; height: 220px; object-fit: cover; border-radius: 8px;" />
          <h3 style="font-size: 16px; margin: 12px 0 6px 0;">Minimalist Chrono Watch</h3>
          <p style="font-size: 18px; font-weight: 700; color: #6366f1; margin: 0 0 12px 0;">$240.00</p>
          <button style="width: 100%; background: #1e293b; color: white; border: none; border-radius: 6px; padding: 10px 0; font-weight: 600; cursor: pointer;">Add to Cart</button>
        </div>
        <div class="sc-card-hTyu" style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <img src="https://cdn.custom.io/item2.jpg" alt="Italian Leather Wallet" style="width: 100%; height: 220px; object-fit: cover; border-radius: 8px;" />
          <h3 style="font-size: 16px; margin: 12px 0 6px 0;">Italian Bifold Wallet</h3>
          <p style="font-size: 18px; font-weight: 700; color: #6366f1; margin: 0 0 12px 0;">$85.00</p>
          <button style="width: 100%; background: #1e293b; color: white; border: none; border-radius: 6px; padding: 10px 0; font-weight: 600; cursor: pointer;">Add to Cart</button>
        </div>
        <div class="sc-card-hTyu" style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <img src="https://cdn.custom.io/item3.jpg" alt="Canvas Backpack" style="width: 100%; height: 220px; object-fit: cover; border-radius: 8px;" />
          <h3 style="font-size: 16px; margin: 12px 0 6px 0;">Canvas Weekender Backpack</h3>
          <p style="font-size: 18px; font-weight: 700; color: #6366f1; margin: 0 0 12px 0;">$145.00</p>
          <button style="width: 100%; background: #1e293b; color: white; border: none; border-radius: 6px; padding: 10px 0; font-weight: 600; cursor: pointer;">Add to Cart</button>
        </div>
      </div>
    </main>
    <footer style="background: #1e293b; color: #94a3b8; padding: 36px 24px; text-align: center; margin-top: 60px;">
      <p style="margin: 0; font-size: 14px;">© 2026 React Luxe Ecommerce SPA.</p>
    </footer>
  </div>
</body>
</html>`
};

// 7. CUSTOM HTML / VANILLA CSS FIXTURE
export const customHtmlBenchmarkCase: EcommerceBenchmarkCase = {
  id: 'custom-html5-standard',
  title: 'Semantic HTML5 Ecommerce Storefront',
  platform: 'Custom HTML',
  frameworkName: 'Semantic HTML5 / Vanilla CSS Grid',
  url: 'https://semantic-store.org/shop',
  groundTruth: {
    platform: 'Custom HTML',
    frameworkName: 'Semantic HTML5 / Vanilla CSS Grid',
    expectedSections: ['navigation', 'hero', 'featureSection', 'footer'],
    expectedProductCardCount: 4,
    expectedGridColumns: 4,
    expectedBrandColor: '#059669',
    expectedFontFamily: 'system-ui',
    expectedAssetCount: 4,
    expectedInteractions: ['Native Form Submission', 'CSS Grid Reflow'],
  },
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Organic Products – Semantic HTML Store</title>
</head>
<body style="margin: 0; background: #ffffff; color: #111827; font-family: system-ui, -apple-system, sans-serif;">
  <header style="border-bottom: 1px solid #e5e7eb; padding: 16px 24px;">
    <nav style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
      <a href="/" style="font-size: 22px; font-weight: bold; color: #059669; text-decoration: none;">PURE ORGANICS</a>
      <ul style="display: flex; gap: 20px; list-style: none; margin: 0; padding: 0;">
        <li><a href="/shop" style="color: #059669; text-decoration: none; font-weight: 600;">Shop</a></li>
        <li><a href="/about" style="color: #4b5563; text-decoration: none;">About</a></li>
        <li><a href="/contact" style="color: #4b5563; text-decoration: none;">Contact</a></li>
      </ul>
      <a href="/cart" style="background: #059669; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500;">Cart</a>
    </nav>
  </header>
  <section style="background: #ecfdf5; padding: 48px 24px; text-align: center;">
    <h1 style="margin: 0 0 8px 0; font-size: 32px; color: #065f46;">100% Certified Organic Pantry</h1>
    <p style="margin: 0; color: #047857; font-size: 16px;">Direct from certified ethical organic farmers.</p>
  </section>
  <main style="max-width: 1200px; margin: 40px auto; padding: 0 24px;">
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
      <article style="border: 1px solid #d1fae5; border-radius: 8px; padding: 16px; background: white;">
        <img src="https://images.semantic.org/honey.jpg" alt="Raw Forest Honey" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px;" />
        <h3 style="font-size: 16px; margin: 12px 0 6px 0;">Wild Forest Honey (500g)</h3>
        <p style="font-size: 18px; font-weight: 700; color: #059669; margin: 0 0 12px 0;">$14.50</p>
        <button style="width: 100%; background: #059669; color: white; border: none; padding: 8px 0; border-radius: 4px; font-weight: 600; cursor: pointer;">Add to Cart</button>
      </article>
      <article style="border: 1px solid #d1fae5; border-radius: 8px; padding: 16px; background: white;">
        <img src="https://images.semantic.org/olive-oil.jpg" alt="Cold Pressed Olive Oil" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px;" />
        <h3 style="font-size: 16px; margin: 12px 0 6px 0;">Extra Virgin Olive Oil (1L)</h3>
        <p style="font-size: 18px; font-weight: 700; color: #059669; margin: 0 0 12px 0;">$22.00</p>
        <button style="width: 100%; background: #059669; color: white; border: none; padding: 8px 0; border-radius: 4px; font-weight: 600; cursor: pointer;">Add to Cart</button>
      </article>
      <article style="border: 1px solid #d1fae5; border-radius: 8px; padding: 16px; background: white;">
        <img src="https://images.semantic.org/matcha.jpg" alt="Ceremonial Grade Matcha" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px;" />
        <h3 style="font-size: 16px; margin: 12px 0 6px 0;">Ceremonial Japanese Matcha (100g)</h3>
        <p style="font-size: 18px; font-weight: 700; color: #059669; margin: 0 0 12px 0;">$29.00</p>
        <button style="width: 100%; background: #059669; color: white; border: none; padding: 8px 0; border-radius: 4px; font-weight: 600; cursor: pointer;">Add to Cart</button>
      </article>
      <article style="border: 1px solid #d1fae5; border-radius: 8px; padding: 16px; background: white;">
        <img src="https://images.semantic.org/coffee.jpg" alt="Ethiopian Single Origin Coffee" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px;" />
        <h3 style="font-size: 16px; margin: 12px 0 6px 0;">Ethiopian Roast Coffee Beans</h3>
        <p style="font-size: 18px; font-weight: 700; color: #059669; margin: 0 0 12px 0;">$18.00</p>
        <button style="width: 100%; background: #059669; color: white; border: none; padding: 8px 0; border-radius: 4px; font-weight: 600; cursor: pointer;">Add to Cart</button>
      </article>
    </div>
  </main>
  <footer style="background: #064e3b; color: #d1fae5; padding: 40px 24px; text-align: center; margin-top: 60px;">
    <p style="margin: 0; font-size: 14px;">© 2026 Pure Organics Coop. Sustainable & Ethical.</p>
  </footer>
</body>
</html>`
};

export const ALL_ECOMMERCE_BENCHMARK_CASES: EcommerceBenchmarkCase[] = [
  shopifyBenchmarkCase,
  wooCommerceBenchmarkCase,
  magentoBenchmarkCase,
  bigCommerceBenchmarkCase,
  nextJsCommerceBenchmarkCase,
  customReactBenchmarkCase,
  customHtmlBenchmarkCase,
];

