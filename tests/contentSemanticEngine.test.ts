import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/domExtractor.ts';
import {
  ContentSemanticEngine,
  buildContentSemanticSpecification,
} from '../src/normalization/content/contentSemanticEngine.ts';
import { exportContentJson } from '../src/output/clonePackage/contentJsonExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
import { exportReconstructionJson } from '../src/output/clonePackage/reconstructionJsonExporter.ts';
import { exportReadmeForAi } from '../src/output/clonePackage/readmeForAiExporter.ts';
import { ArtifactExporter } from '../src/output/artifactExporter.ts';
import { AnalyzePageResponseData } from '../src/types/index.ts';

function createMockSemanticContentPage(): AnalyzePageResponseData {
  document.body.innerHTML = `
    <div id="app" style="width: 1440px; font-family: 'Inter', sans-serif;">
      <!-- Navigation -->
      <nav id="main-nav" class="navbar" role="navigation">
        <a href="/features" class="nav-link">Features</a>
        <a href="/pricing" class="nav-link">Pricing</a>
      </nav>

      <!-- Breadcrumb -->
      <ol class="breadcrumb" aria-label="breadcrumb">
        <li><a href="/">Home</a></li>
        <li><span>Store</span></li>
      </ol>

      <!-- Promotional Banner -->
      <div id="promo-banner" class="promo-banner" style="background: #fbbf24;">
        <span>Special Offer: Save 20% Today with code SUMMER2026</span>
      </div>

      <!-- Hero Section -->
      <header id="hero" style="padding: 64px 32px;">
        <span class="category-kicker">Autonomous Intelligence</span>
        <h1 class="hero-title" style="font-size: 48px; font-weight: 800;">
          Next-Generation Autonomous Systems
        </h1>
        <h3 class="hero-subtitle" style="font-size: 20px; font-weight: 600;">
          Accelerate your agentic development workflows with automated reconstruction.
        </h3>
        <p class="hero-body" style="font-size: 16px;">
          Our platform analyzes deep visual layouts, constraint graphs, and responsive transitions.
        </p>
        <button id="hero-cta" class="btn btn-primary">
          Get Started
        </button>
        <span class="badge badge-new" style="display: inline-block;">New Release v2.0</span>
      </header>

      <!-- Product & Specification Card -->
      <div id="product-card" class="product-card" style="padding: 24px;">
        <span class="topic-tag">Hardware</span>
        <h2 class="product-title">Quantum Core Pro</h2>
        <div class="price-tag">$499.00</div>
        <div class="rating-score">4.9 / 5 (350 reviews)</div>
        <ul class="feature-list">
          <li class="feature-item">✓ 128 Teraflops Neural Engine</li>
          <li class="feature-item">✓ Zero-latency bus interconnect</li>
        </ul>
        <dl class="specs-grid">
          <dt class="spec-label">Architecture:</dt>
          <dd class="spec-value">3nm Silicon</dd>
        </dl>
      </div>

      <!-- Testimonial Section -->
      <section id="reviews" class="testimonials">
        <blockquote class="testimonial-quote">
          "This engine completely transformed our web reconstruction speed."
        </blockquote>
        <time class="meta-date" datetime="2026-08-25">Published on August 25, 2026</time>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-container">
        <details class="faq-item">
          <summary class="faq-question">What is timeline reconstruction?</summary>
          <p class="faq-answer">It captures chronological animation sequences rather than isolated CSS declarations.</p>
        </details>
      </section>

      <!-- Legal & Footer -->
      <footer id="footer" role="contentinfo">
        <div class="footer-links">
          <a href="/sitemap" class="footer-link">Site Directory</a>
          <a href="/privacy" class="footer-link">Privacy Policy</a>
          <a href="/terms" class="footer-link">Terms of Service</a>
        </div>
        <small class="legal-text">© 2026 Autonomous Technologies Inc. All rights reserved.</small>
        <figcaption class="photo-caption">Figure 1.1: System Architecture Diagram</figcaption>
      </footer>
    </div>
  `;

  const extractor = new DomExtractor();
  const rawResult = extractor.extract(document.body, { includeHidden: true });

  return {
    status: 'completed',
    timestamp: Date.now(),
    title: 'Autonomous Systems & Content Semantics',
    pageUrl: 'https://example.com/content-semantics-test',
    extractionResult: rawResult,
  };
}

describe('Content Semantic Engine (17_content.json)', () => {
  it('1. Normalizes text elements into structured content semantic specification', () => {
    const data = createMockSemanticContentPage();
    const engine = new ContentSemanticEngine();
    const spec = engine.normalize(data);

    expect(spec.$schema).toBe('https://ui-ux-helper.internal/schemas/content-semantics-v1.json');
    expect(spec.version).toBe('1.0.0');
    expect(spec.target.title).toBe('Autonomous Systems & Content Semantics');
    expect(spec.summary.totalContentBlocks).toBeGreaterThanOrEqual(15);
    expect(spec.summary.criticalBlocksCount).toBeGreaterThan(0);
    expect(spec.summary.highImportanceCount).toBeGreaterThan(0);
    expect(spec.summary.primaryHeadline).toBeDefined();
    expect(spec.summary.primaryCtaText).toBe('Get Started');
    expect(Array.isArray(spec.metadata.guidanceForAI)).toBe(true);
  });

  it('2. Classifies all 20 semantic roles with DOM evidence', () => {
    const data = createMockSemanticContentPage();
    const spec = buildContentSemanticSpecification(data);

    const roles = new Set(spec.blocks.map((b) => b.semanticRole));

    expect(roles.has('Headline')).toBe(true);
    expect(roles.has('Subheadline')).toBe(true);
    expect(roles.has('CTA')).toBe(true);
    expect(roles.has('Body')).toBe(true);
    expect(roles.has('Caption')).toBe(true);
    expect(roles.has('Price')).toBe(true);
    expect(roles.has('Rating')).toBe(true);
    expect(roles.has('Badge')).toBe(true);
    expect(roles.has('Breadcrumb')).toBe(true);
    expect(roles.has('Navigation')).toBe(true);
    expect(roles.has('FAQ')).toBe(true);
    expect(roles.has('Legal')).toBe(true);
    expect(roles.has('Metadata')).toBe(true);
    expect(roles.has('Feature')).toBe(true);
    expect(roles.has('Testimonial')).toBe(true);
    expect(roles.has('Specification')).toBe(true);
    expect(roles.has('Product Name')).toBe(true);
    expect(roles.has('Category')).toBe(true);
    expect(roles.has('Promotion')).toBe(true);
    expect(roles.has('Footer')).toBe(true);
  });

  it('3. Assigns correct SEO relevance, importance, and visual priorities', () => {
    const data = createMockSemanticContentPage();
    const spec = buildContentSemanticSpecification(data);

    const headline = spec.blocks.find((b) => b.semanticRole === 'Headline');
    expect(headline?.seoRelevance).toBe('h1-primary-keyword');
    expect(headline?.importance).toBe('critical');
    expect(headline?.visualPriority).toBe('display-p1');

    const cta = spec.blocks.find((b) => b.semanticRole === 'CTA');
    expect(cta?.importance).toBe('critical');
    expect(cta?.visualPriority).toBe('interactive-cta');

    const price = spec.blocks.find((b) => b.semanticRole === 'Price');
    expect(price?.importance).toBe('critical');
    expect(price?.visualPriority).toBe('headline-p2');

    const legal = spec.blocks.find((b) => b.semanticRole === 'Legal');
    expect(legal?.importance).toBe('low');
    expect(legal?.seoRelevance).toBe('none');
  });

  it('4. Asserts classifications are justified with browser evidence without hallucinations', () => {
    const data = createMockSemanticContentPage();
    const spec = buildContentSemanticSpecification(data);

    for (const block of spec.blocks) {
      expect(block.purpose.length).toBeGreaterThan(0);
      expect(block.browserEvidence.length).toBeGreaterThan(0);
      expect(typeof block.browserEvidence[0]).toBe('string');
    }
  });

  it('5. exportContentJson produces valid 17_content.json payload', () => {
    const data = createMockSemanticContentPage();
    const jsonStr = exportContentJson(data);

    expect(typeof jsonStr).toBe('string');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.$schema).toBeDefined();
    expect(parsed.summary.totalContentBlocks).toBeGreaterThan(0);
    expect(Array.isArray(parsed.blocks)).toBe(true);
    expect(Array.isArray(parsed.metadata.guidanceForAI)).toBe(true);
  });

  it('6. AI Clone Package (.zip) builder includes 17_content.json in canonical package and manifest', () => {
    const data = createMockSemanticContentPage();
    const pkg = buildAIClonePackage(data);

    expect(pkg.files['17_content.json']).toBeDefined();
    expect(pkg.files['content-semantics.json']).toBeDefined();
    expect(pkg.manifest.totalFiles).toBe(19);

    const reconstructionJson = exportReconstructionJson(data);
    const recParsed = JSON.parse(reconstructionJson);
    expect(recParsed.packageManifest.totalArtifacts).toBe(19);
    const hasContentArtifact = recParsed.packageManifest.artifacts.some((a: any) => a.file === '17_content.json');
    expect(hasContentArtifact).toBe(true);

    const readme = exportReadmeForAi(data);
    expect(readme).toContain('17_content.json');
    expect(readme).toContain('Step 2: Build Component Library, Variants & Content Model');
  });

  it('7. ArtifactExporter handles content-semantics and 17_content export format dispatch', () => {
    const data = createMockSemanticContentPage();
    const exporter = new ArtifactExporter();

    const res1 = exporter.export(data, 'content-semantics');
    expect(res1.format).toBe('content-semantics');
    expect(res1.exportedData).toBeDefined();
    const parsed1 = JSON.parse(res1.exportedData);
    expect(Array.isArray(parsed1.blocks)).toBe(true);

    const res2 = exporter.export(data, '17_content');
    expect(res2.format).toBe('17_content');
    expect(res2.exportedData).toBeDefined();
  });
});
