import { describe, it, expect } from 'vitest';
import {
  buildAccessibilityExtractionSystem,
} from '../src/normalization/accessibility/accessibilityExtractionEngine.ts';
import { exportAccessibilityJson } from '../src/output/clonePackage/accessibilityJsonExporter.ts';
import { buildAIClonePackage } from '../src/output/clonePackage/clonePackageBuilder.ts';
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

describe('Prompt 25 — Accessibility Extraction Engine', () => {
  function buildA11yMockData(): AnalyzePageResponseData {
    document.body.innerHTML = `
      <div id="app" style="width: 1440px;">
        <header id="site-header" role="banner">
          <a href="/" id="logo-link" aria-label="Brand Home">Logo</a>
          <nav id="site-nav" role="navigation" aria-label="Primary Navigation">
            <a href="/products" id="nav-products">Products</a>
            <a href="/about" id="nav-about">About</a>
          </nav>
          <form id="search-form" role="search">
            <input type="search" id="search-input" aria-label="Search Catalog" placeholder="Search..." />
            <button type="submit" id="search-btn">Search</button>
          </form>
        </header>

        <main id="main-content" role="main">
          <h1 id="page-h1">Accessible Web Systems</h1>
          <section id="section-intro" aria-label="Introduction">
            <h2 id="section-h2">WCAG Conformance & Semantics</h2>
            <p>Evaluating heading sequence and accessible landmarks.</p>
            <h3 id="card-h3">Component Landmark Verification</h3>
            <img id="diagram-img" src="/diagram.png" alt="Architecture Diagram" />
          </section>

          <section id="anti-pattern-section">
            <div id="clickable-fake-button" onclick="void(0)" class="fake-btn">Fake Button</div>
            <img id="bad-img" src="/banner.jpg" />
            <input type="text" id="unlabeled-input" placeholder="No label" />
          </section>

          <aside id="sidebar" role="complementary" aria-label="Related Topics">
            <h4>Quick Links</h4>
          </aside>
        </main>

        <div id="dialog-modal" class="modal-dialog" role="dialog" aria-modal="true" aria-label="Confirm Action">
          <button id="modal-close" class="btn-close">Close</button>
          <button id="modal-confirm" class="btn-confirm">Confirm</button>
        </div>

        <footer id="site-footer" role="contentinfo">
          <p>&copy; 2026 Semantic Systems</p>
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
      pageUrl: 'https://example.com/a11y',
      title: 'Accessibility Test Suite',
      timestamp: 1700000000000,
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
    };
  }

  describe('1. Landmark & Heading Hierarchy Extraction', () => {
    it('detects all standard HTML5 and ARIA landmarks', () => {
      const data = buildA11yMockData();
      const a11y = buildAccessibilityExtractionSystem(data);

      expect(a11y.landmarks.length).toBeGreaterThanOrEqual(4);
      const roles = a11y.landmarks.map((l) => l.role);

      expect(roles).toContain('banner');
      expect(roles).toContain('navigation');
      expect(roles).toContain('main');
      expect(roles).toContain('contentinfo');
    });

    it('extracts heading outline and validates hierarchy', () => {
      const data = buildA11yMockData();
      const a11y = buildAccessibilityExtractionSystem(data);

      expect(a11y.headingHierarchy.hasH1).toBe(true);
      expect(a11y.headingHierarchy.totalHeadings).toBeGreaterThanOrEqual(3);
      expect(a11y.headingHierarchy.outline.some((h) => h.level === 1)).toBe(true);
      expect(a11y.headingHierarchy.outline.some((h) => h.level === 2)).toBe(true);
      expect(a11y.headingHierarchy.outline.some((h) => h.level === 3)).toBe(true);
    });
  });

  describe('2. Tab Order, Focus Traps & Keyboard Navigation', () => {
    it('constructs sequential tabbable chain and checks for positive tabindex warnings', () => {
      const data = buildA11yMockData();
      const a11y = buildAccessibilityExtractionSystem(data);

      expect(a11y.tabOrder.totalTabbable).toBeGreaterThan(0);
      expect(Array.isArray(a11y.tabOrder.sequence)).toBe(true);
      expect(typeof a11y.tabOrder.hasPositiveTabIndexWarning).toBe('boolean');

      a11y.tabOrder.sequence.forEach((item, idx) => {
        expect(item.orderIndex).toBe(idx + 1);
        expect(item.elementId).toBeDefined();
        expect(item.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });

    it('detects focus trap requirements on modal and drawer dialogs', () => {
      const data = buildA11yMockData();
      const a11y = buildAccessibilityExtractionSystem(data);

      expect(a11y.focusTraps.length).toBeGreaterThanOrEqual(1);
      const modalTrap = a11y.focusTraps.find((t) => t.role === 'dialog');
      expect(modalTrap).toBeDefined();
      expect(modalTrap?.escapeKeyCloses).toBe(true);
      expect(modalTrap?.isTrapped).toBe(true);
    });

    it('provides standard WAI-ARIA keyboard interaction patterns', () => {
      const data = buildA11yMockData();
      const a11y = buildAccessibilityExtractionSystem(data);

      expect(a11y.keyboardInteractions.length).toBeGreaterThanOrEqual(4);
      expect(a11y.keyboardInteractions.some((k) => k.patternName.includes('Button'))).toBe(true);
      expect(a11y.keyboardInteractions.some((k) => k.patternName.includes('Modal'))).toBe(true);
    });
  });

  describe('3. Semantic HTML Audit & WCAG Conformance', () => {
    it('audits non-semantic div buttons, missing alt tags, and unlabeled controls', () => {
      const data = buildA11yMockData();
      const a11y = buildAccessibilityExtractionSystem(data);

      expect(a11y.semanticHtmlAudit.semanticRatio).toBeGreaterThan(0);
      expect(a11y.semanticHtmlAudit.divButtonAntiPatterns.length).toBeGreaterThanOrEqual(1);
      expect(a11y.semanticHtmlAudit.missingAltImages.length).toBeGreaterThanOrEqual(1);
      expect(a11y.semanticHtmlAudit.unlabeledFormControls.length).toBeGreaterThanOrEqual(1);
      expect(a11y.wcagConformance.targetLevel).toBe('AA');
      expect(typeof a11y.wcagConformance.score).toBe('number');
    });
  });

  describe('4. Export Pipeline & AI Clone Package Integration', () => {
    it('exports a valid accessibility.json artifact matching schema', () => {
      const data = buildA11yMockData();
      const jsonStr = exportAccessibilityJson(data);

      expect(typeof jsonStr).toBe('string');
      const parsed = JSON.parse(jsonStr);

      expect(parsed.$schema).toContain('accessibility-v1.json');
      expect(parsed.landmarks).toBeDefined();
      expect(parsed.headingHierarchy).toBeDefined();
      expect(parsed.tabOrder).toBeDefined();
      expect(parsed.focusTraps).toBeDefined();
      expect(parsed.keyboardInteractions).toBeDefined();
    });

    it('bundles accessibility.json inside the AI Clone Package (.zip)', () => {
      const data = buildA11yMockData();
      const pkg = buildAIClonePackage(data);

      expect(pkg.files['accessibility.json']).toBeDefined();
      expect(pkg.manifest.files.some((f) => f.path === 'accessibility.json')).toBe(true);
    });

    it('supports standalone accessibility format in ArtifactExporter', () => {
      const data = buildA11yMockData();
      const exporter = new ArtifactExporter();

      const result = exporter.export(data, 'accessibility');
      expect(result.format).toBe('accessibility');
      expect(result.exportedData).toBeDefined();

      const parsed = JSON.parse(result.exportedData);
      expect(parsed.landmarks).toBeDefined();
      expect(parsed.headingHierarchy).toBeDefined();
    });
  });
});
