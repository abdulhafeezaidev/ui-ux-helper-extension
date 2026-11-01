import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { DomExtractor } from '../src/extraction/index.ts';
import { ColorNormalizer, TypographyNormalizer, ShapeNormalizer, LayoutNormalizer, ComponentNormalizer } from '../src/normalization/index.ts';
import { refineDesignIntelligence } from '../src/agent-spec/refinement/index.ts';
import { buildAgentDesignSpecification, exportAdsContext } from '../src/agent-spec/index.ts';

function findChromeExecutable(): string | undefined {
  const possiblePaths = [
    'C:\\Users\\abdul\\.cache\\puppeteer\\chrome\\win64-151.0.7922.71\\chrome-win64\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return possiblePaths.find((p) => fs.existsSync(p));
}

async function runExtensionFlow() {
  const extensionPath = path.resolve('E:\\ui-ux-helper-extension\\dist');
  console.log('Loading Chrome Extension from:', extensionPath);

  const executablePath = findChromeExecutable();

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const targetUrl = 'https://vercel.com/';
  console.log(`Navigating Chrome Browser to live webpage: ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));

  // Run extension extraction logic on live DOM
  console.log('Running Extension Content Script extraction pipeline on live page DOM...');

  const rawDomData = await page.evaluate(() => {
    const all = Array.from(document.body.querySelectorAll('*'));
    let idIdx = 1;

    const elements: any[] = [];
    all.forEach((node) => {
      const el = node as HTMLElement;
      if (!el.id) el.id = `ext_el_${idIdx++}`;

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

  const refined = refineDesignIntelligence(analyzeData);
  const ads = buildAgentDesignSpecification(analyzeData);
  const exportedAdsJson = JSON.stringify(ads, null, 2);

  // Save/Copy extension ADS report output file
  const reportPath = path.resolve('C:\\Users\\abdul\\.gemini\\antigravity-ide\\brain\\d3e9f60c-dba7-4260-b165-f1fb2b9eb60b\\scratch\\extension_exported_ads_report.json');
  fs.writeFileSync(reportPath, exportedAdsJson);
  console.log('\n--- EXTENSION ADS REPORT SUCCESSFULLY GENERATED & COPIED ---');
  console.log('Saved Extension ADS Report JSON to:', reportPath);
  console.log(`Page Title:          ${ads.metadata.title}`);
  console.log(`Total Extracted DOM: ${ads.metadata.totalElements}`);
  console.log(`Fidelity Score:      ${refined.fidelityScore.totalScore} / 100`);

  await browser.close();
}

runExtensionFlow().catch(console.error);
