import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { ColorNormalizer, TypographyNormalizer, ShapeNormalizer, LayoutNormalizer, ComponentNormalizer } from '../src/normalization/index.ts';
import { refineDesignIntelligence } from '../src/agent-spec/refinement/index.ts';
import { buildAgentDesignSpecification } from '../src/agent-spec/index.ts';

function findChromeExecutable(): string | undefined {
  const possiblePaths = [
    'C:\\Users\\abdul\\.cache\\puppeteer\\chrome\\win64-151.0.7922.71\\chrome-win64\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return possiblePaths.find((p) => fs.existsSync(p));
}

async function auditGithubLiveADS() {
  console.log('Launching Real Chromium Browser at viewport 1280x800 for GitHub Live Audit...');
  const executablePath = findChromeExecutable();

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const targetUrl = 'https://github.com/';
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));

  console.log('Extracting raw DOM structure from GitHub live rendered page...');
  const rawDomData = await page.evaluate(() => {
    const all = Array.from(document.body.querySelectorAll('*'));
    let idIdx = 1;

    const elements: any[] = [];
    all.forEach((node) => {
      const el = node as HTMLElement;
      if (!el.id) el.id = `gh_el_${idIdx++}`;

      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      const isVisible =
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0';

      const tag = el.tagName.toLowerCase();
      const text = el.textContent?.trim() || '';

      elements.push({
        id: el.id,
        parentId: el.parentElement ? el.parentElement.id || undefined : undefined,
        tagName: el.tagName,
        className: el.className && typeof el.className === 'string' ? el.className : '',
        textMeta: {
          hasText: text.length > 0,
          rawText: text,
          trimmedText: text,
          textLength: text.length,
        },
        typography: {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          textTransform: style.textTransform,
          textDecoration: style.textDecoration,
          textAlign: style.textAlign,
        },
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderRadius: {
          topLeft: style.borderTopLeftRadius,
          topRight: style.borderTopRightRadius,
          bottomRight: style.borderBottomRightRadius,
          bottomLeft: style.borderBottomLeftRadius,
        },
        boxShadow: style.boxShadow,
        layoutProps: {
          display: style.display,
          position: style.position,
          flexDirection: style.flexDirection,
          gridTemplateColumns: style.gridTemplateColumns,
          gap: { row: style.rowGap || style.gap, column: style.columnGap || style.gap },
          zIndex: style.zIndex,
          overflow: style.overflow,
        },
        boundingRect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        isVisible,
        childIds: Array.from(el.children).map((c) => c.id || ''),
        assetProps: tag === 'img' || tag === 'svg' || style.backgroundImage !== 'none' ? {
          currentSrc: tag === 'img' ? (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src : undefined,
          backgroundImage: style.backgroundImage !== 'none' ? style.backgroundImage : undefined,
          naturalWidth: tag === 'img' ? (el as HTMLImageElement).naturalWidth : undefined,
          naturalHeight: tag === 'img' ? (el as HTMLImageElement).naturalHeight : undefined,
          objectFit: style.objectFit,
          objectPosition: style.objectPosition,
          hasSvg: tag === 'svg',
        } : undefined,
      });
    });

    return {
      title: document.title,
      url: window.location.href,
      elements,
    };
  });

  await browser.close();

  const analyzeData: any = {
    status: 'completed',
    pageUrl: rawDomData.url,
    title: rawDomData.title,
    timestamp: Date.now(),
    extractionResult: {
      pageMeta: {
        title: rawDomData.title,
        url: rawDomData.url,
        timestamp: Date.now(),
        viewport: { width: 1280, height: 800 },
        devicePixelRatio: 1,
      },
      totalExtracted: rawDomData.elements.length,
      visibleCount: rawDomData.elements.filter((e: any) => e.isVisible).length,
      elements: rawDomData.elements,
    },
  };

  const colorSystem = new ColorNormalizer().normalize(analyzeData.extractionResult);
  const typographySystem = new TypographyNormalizer().normalize(analyzeData.extractionResult);
  const shapeSystem = new ShapeNormalizer().normalize(analyzeData.extractionResult);
  const layoutSystem = new LayoutNormalizer().normalize(analyzeData.extractionResult);
  const componentSystem = new ComponentNormalizer().normalize(
    analyzeData.extractionResult,
    colorSystem,
    typographySystem,
    shapeSystem,
    layoutSystem
  );

  analyzeData.colorSystem = colorSystem;
  analyzeData.typographySystem = typographySystem;
  analyzeData.shapeSystem = shapeSystem;
  analyzeData.layoutSystem = layoutSystem;
  analyzeData.componentSystem = componentSystem;

  console.log('Running Refinement Engine on GitHub live page...');
  const refined = refineDesignIntelligence(analyzeData);

  console.log('Building Extension ADS Specification for GitHub live page...');
  const ads = buildAgentDesignSpecification(analyzeData);

  const reportPath = path.resolve('C:\\Users\\abdul\\.gemini\\antigravity-ide\\brain\\d3e9f60c-dba7-4260-b165-f1fb2b9eb60b\\scratch\\github_extension_ads_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(ads, null, 2));

  console.log('\n========================================================================================');
  console.log('               GITHUB.COM LIVE WEBPAGE — EXTENSION ADS REPORT');
  console.log('========================================================================================');
  console.log(`Page Title:            ${ads.metadata.title}`);
  console.log(`Source URL:            ${ads.metadata.pageUrl}`);
  console.log(`Viewport:              ${ads.metadata.viewport.width}x${ads.metadata.viewport.height}`);
  console.log(`Total Extracted DOM:   ${rawDomData.elements.length}`);
  console.log(`Color Tokens Count:    ${ads.colors.length}`);
  console.log(`Typography Tokens:     ${ads.typography.length}`);
  console.log(`Spacing Scale Tokens:  ${ads.spacing.map((s) => s.valuePx + 'px').join(', ')}`);
  console.log(`Radius Scale Tokens:   ${ads.shapesAndSurfaces.radiusScale.map((r) => r.valuePx + 'px').join(', ')}`);
  console.log(`Refined Sections:      ${ads.sections.length}`);
  console.log(`Component Families:    ${ads.components.length}`);
  console.log(`Asset Evidence Count:  ${ads.assetEvidence.length}`);
  console.log(`Fidelity Total Score:  ${refined.fidelityScore.totalScore} / 100`);
  console.log('========================================================================================\n');

  console.log('Saved Extension GitHub ADS report JSON to:', reportPath);
}

auditGithubLiveADS().catch(console.error);
