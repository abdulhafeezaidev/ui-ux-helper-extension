import { describe, it, expect } from 'vitest';
import { buildAIClonePackageV3 } from '../src/output/clonePackage/clonePackageV3Builder.ts';
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

describe('AI Clone Package V3 — Semantic Compiler Outputs & Consolidation', () => {
  function buildRichStoreMockData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="root" style="width: 1440px; background-color: #f8fafc; font-family: 'Inter', sans-serif;">
        <header id="header" class="site-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background-color: #ffffff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 50;">
          <div id="logo" style="font-size: 24px; font-weight: 700; color: #0f172a;">STOREFRONT</div>
          <nav id="nav" style="display: flex; gap: 24px;">
            <a href="/shop" class="nav-item" style="color: #334155; text-decoration: none;">Shop</a>
            <a href="/categories" class="nav-item" style="color: #334155; text-decoration: none;">Categories</a>
            <a href="/deals" class="nav-item" style="color: #334155; text-decoration: none;">Deals</a>
          </nav>
          <div id="actions" style="display: flex; gap: 16px;">
            <button id="search-btn" aria-label="Search" style="padding: 8px 16px; background-color: #f1f5f9; border-radius: 6px;">Search</button>
            <button id="cart-btn" aria-label="Shopping Cart" style="padding: 8px 16px; background-color: #2563eb; color: #ffffff; border-radius: 6px;">Cart (2)</button>
          </div>
        </header>

        <section id="hero" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px; text-align: center; background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);">
          <span id="hero-badge" class="badge" style="padding: 4px 12px; background-color: #dbeafe; color: #1e40af; border-radius: 9999px; font-size: 14px; margin-bottom: 16px;">SUMMER COLLECTION 2026</span>
          <h1 id="hero-title" style="font-size: 48px; font-weight: 800; color: #0f172a; line-height: 1.1; margin-bottom: 16px;">Elevate Your Digital Experience</h1>
          <p id="hero-desc" style="font-size: 18px; color: #64748b; max-width: 640px; margin-bottom: 32px;">Discover handcrafted minimalist products engineered for exceptional quality and comfort.</p>
          <div style="display: flex; gap: 16px;">
            <a href="/explore" id="hero-cta" style="padding: 14px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; font-weight: 600; text-decoration: none;">Explore Collection</a>
            <a href="/lookbook" id="hero-secondary" style="padding: 14px 28px; background-color: #ffffff; border: 1px solid #cbd5e1; color: #0f172a; border-radius: 8px; font-weight: 600; text-decoration: none;">View Lookbook</a>
          </div>
        </section>

        <section id="featured-products" style="padding: 64px 32px; max-width: 1280px; margin: 0 auto;">
          <h2 style="font-size: 32px; font-weight: 700; color: #0f172a; margin-bottom: 32px;">Featured Products</h2>
          <div id="product-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
            ${[1, 2, 3, 4]
              .map(
                (i) => `
              <article class="product-card" id="card-${i}" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; padding: 16px; display: flex; flex-direction: column;">
                <img src="/images/product-${i}.jpg" alt="Product ${i}" class="product-img" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; margin-bottom: 12px;" />
                <span class="product-badge" style="padding: 2px 8px; background-color: #fee2e2; color: #991b1b; border-radius: 4px; font-size: 12px; align-self: flex-start; margin-bottom: 8px;">SALE</span>
                <h3 class="product-title" style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">Minimalist Leather Bag ${i}</h3>
                <span class="product-price" style="font-size: 20px; font-weight: 700; color: #2563eb; margin-bottom: 12px;">$129.00</span>
                <button class="add-to-cart-btn" style="padding: 10px; background-color: #0f172a; color: #ffffff; border-radius: 6px; font-weight: 500; cursor: pointer; margin-top: auto;">Add to Cart</button>
              </article>
            `
              )
              .join('')}
          </div>
        </section>

        <footer id="footer" style="background-color: #0f172a; color: #94a3b8; padding: 48px 32px; text-align: center;">
          <p>&copy; 2026 StoreFront. Reconstructable AI design intelligence.</p>
        </footer>
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

    return {
      status: 'completed',
      pageUrl: 'https://store.example.com',
      title: 'StoreFront Minimalist Catalog',
      timestamp: Date.now(),
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  // --------------------------------------------------------------------------
  // 1. Target Structure & File Completeness
  // --------------------------------------------------------------------------
  describe('1. Target Structure: Exactly 10 Consolidated Semantic Files', () => {
    it('bundles all 10 canonical files with exact required filenames in AI_Clone_Package/', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);

      expect(pkg.manifest.totalFiles).toBe(10);
      expect(pkg.manifest.packageArchitecture).toBe('AI_Clone_Package');

      const expectedFiles = [
        '01_designGrammar.json',
        '02_componentGrammar.json',
        '03_layoutGrammar.json',
        '04_interactionGrammar.json',
        '05_accessibility.json',
        '06_assets.json',
        '07_reconstructionPlan.md',
        '08_dependencyGraph.json',
        '09_buildInstructions.md',
        '10_metadata.json',
      ];

      expectedFiles.forEach((file) => {
        expect(pkg.files[file], `Missing canonical file: ${file}`).toBeDefined();
        expect(pkg.files[`AI_Clone_Package/${file}`], `Missing ZIP-prefixed file: AI_Clone_Package/${file}`).toBeDefined();
        expect(pkg.files[file].length).toBeGreaterThan(0);
      });
    });
  });

  // --------------------------------------------------------------------------
  // 2. Semantic Knowledge Content Verification
  // --------------------------------------------------------------------------
  describe('2. Semantic Knowledge Verification (Zero Duplicated Implementation Details)', () => {
    it('verifies 01_designGrammar.json contains semantic tokens rather than raw CSS rules', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);
      const dg = JSON.parse(pkg.files['01_designGrammar.json']);

      expect(dg.colorPalette).toBeDefined();
      expect(dg.spacing).toBeDefined();
      expect(dg.typography).toBeDefined();
      expect(dg.containerWidths).toBeDefined();
      expect(dg.animationTokens).toBeDefined();
    });

    it('verifies 02_componentGrammar.json contains archetypes and slots without duplicated instances', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);
      const cg = JSON.parse(pkg.files['02_componentGrammar.json']);

      expect(cg.archetypes).toBeDefined();
      expect(cg.statistics.reuseRatio).toBeGreaterThan(1);
      expect(cg.statistics.compressionRatio).toBeGreaterThan(1);
    });

    it('verifies 03_layoutGrammar.json contains reusable patterns rather than raw element geometry', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);
      const lg = JSON.parse(pkg.files['03_layoutGrammar.json']);

      expect(lg.patterns).toBeDefined();
      expect(lg.statistics.eliminatedCoordinatesCount).toBeGreaterThan(0);
    });

    it('verifies 04_interactionGrammar.json contains semantic state machines rather than raw event dumps', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);
      const ig = JSON.parse(pkg.files['04_interactionGrammar.json']);

      expect(ig.semanticInteractions).toBeDefined();
      expect(ig.statistics.eliminatedEventListenersCount).toBeGreaterThan(0);
    });

    it('verifies 05_accessibility.json contains landmarks, focus traps, and WCAG compliance level', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);
      const a11y = JSON.parse(pkg.files['05_accessibility.json']);

      expect(a11y.landmarks.length).toBeGreaterThan(0);
      expect(a11y.compliance.wcagLevel).toBe('AA');
    });

    it('verifies 06_assets.json contains fonts and vector icon specs without binary bloat', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);
      const assets = JSON.parse(pkg.files['06_assets.json']);

      expect(assets.fonts.length).toBeGreaterThan(0);
      expect(assets.icons.length).toBeGreaterThan(0);
      expect(assets.binaryBloatEliminated).toBe(true);
    });

    it('verifies 07_reconstructionPlan.md contains Mermaid DAG and 9-phase sequence', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);
      const plan = pkg.files['07_reconstructionPlan.md'];

      expect(plan).toContain('mermaid');
      expect(plan).toContain('Step 1: Create Design Tokens');
      expect(plan).toContain('Step 2: Typography');
      expect(plan).toContain('Step 3: Layout Patterns');
      expect(plan).toContain('Step 4: Shared Components');
      expect(plan).toContain('Step 9: Optimization');
    });

    it('verifies 08_dependencyGraph.json contains DAG topological order and parallel tiers', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);
      const dag = JSON.parse(pkg.files['08_dependencyGraph.json']);

      expect(dag.dag.parallelTiers).toBeDefined();
      expect(dag.dag.topologicalOrder.length).toBeGreaterThanOrEqual(9);
      expect(dag.buildGraph.criticalPath.length).toBeGreaterThan(0);
    });

    it('verifies 09_buildInstructions.md contains AI model directives and anti-hallucination rules', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);
      const instructions = pkg.files['09_buildInstructions.md'];

      expect(instructions).toContain('AI Coding Model Instructions');
      expect(instructions).toContain('Anti-Hallucination Guardrails');
      expect(instructions).toContain('Package File Reference Matrix');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Authoritative Audit Report & Metrics Verification
  // --------------------------------------------------------------------------
  describe('3. Authoritative Audit Report & Compression Metrics', () => {
    it('verifies 10_metadata.json contains complete audit report with all required metrics', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);
      const meta = JSON.parse(pkg.files['10_metadata.json']);
      const audit = meta.auditReport;

      expect(audit).toBeDefined();
      expect(audit.originalLineCount).toBeGreaterThan(15000);
      expect(audit.newLineCount).toBeGreaterThan(0);
      expect(audit.compressionPercentage).toBeGreaterThanOrEqual(75.0);
      expect(audit.estimatedTokenReduction).toBeGreaterThanOrEqual(75.0);
      expect(audit.expectedAIReconstructionFidelity).toBe(100.0);

      // Verify itemized file breakdown exists for all 10 files
      expect(Object.keys(audit.fileBreakdown).length).toBe(10);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Goal: Approximately 5,000 Lines Total
  // --------------------------------------------------------------------------
  describe('4. Line Count Target: Approximately 5,000 Lines Total', () => {
    it('delivers approximately 5,000 lines total across the 10 consolidated semantic files', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);

      const canonicalFiles = [
        '01_designGrammar.json',
        '02_componentGrammar.json',
        '03_layoutGrammar.json',
        '04_interactionGrammar.json',
        '05_accessibility.json',
        '06_assets.json',
        '07_reconstructionPlan.md',
        '08_dependencyGraph.json',
        '09_buildInstructions.md',
        '10_metadata.json',
      ];

      let measuredLines = 0;
      canonicalFiles.forEach((f) => {
        const lines = pkg.files[f].split(/\r?\n/).length;
        measuredLines += lines;
      });

      // Target: Approximately 5,000 lines (bound between 4,000 and 6,000 lines)
      expect(measuredLines).toBeGreaterThanOrEqual(4000);
      expect(measuredLines).toBeLessThanOrEqual(6000);

      // Close to 5,000 lines (+/- 15%)
      expect(Math.abs(measuredLines - 5000)).toBeLessThan(1000);
    });
  });

  // --------------------------------------------------------------------------
  // 5. ZIP Packaging & ArtifactExporter Integration
  // --------------------------------------------------------------------------
  describe('5. ZIP Packaging & ArtifactExporter Integration', () => {
    it('generates a valid ZIP buffer with files prefixed under AI_Clone_Package/', () => {
      const data = buildRichStoreMockData();
      const pkg = buildAIClonePackageV3(data);

      expect(pkg.zipBuffer).toBeDefined();
      expect(pkg.zipBuffer.length).toBeGreaterThan(0);
      expect(pkg.base64).toBeDefined();
      expect(pkg.base64.length).toBeGreaterThan(0);
    });

    it('exports package-v3, clone-v3, and AI_Clone_Package formats in ArtifactExporter', () => {
      const data = buildRichStoreMockData();
      const exporter = new ArtifactExporter();

      const resV3 = exporter.export(data, 'package-v3');
      expect(resV3.format).toBe('package-v3');
      expect(resV3.aiClonePackageV3).toBeDefined();
      expect(resV3.artifacts['01_designGrammar.json']).toBeDefined();
      expect(resV3.artifacts['10_metadata.json']).toBeDefined();

      const resCloneV3 = exporter.export(data, 'clone-v3');
      expect(resCloneV3.format).toBe('clone-v3');
      expect(resCloneV3.aiClonePackageV3).toBeDefined();

      const resName = exporter.export(data, 'AI_Clone_Package');
      expect(resName.format).toBe('AI_Clone_Package');
      expect(resName.aiClonePackageV3).toBeDefined();
    });
  });
});
