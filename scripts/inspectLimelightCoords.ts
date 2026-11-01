import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

function findChromeExecutable(): string | undefined {
  const possiblePaths = [
    'C:\\Users\\abdul\\.cache\\puppeteer\\chrome\\win64-151.0.7922.71\\chrome-win64\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return possiblePaths.find((p) => fs.existsSync(p));
}

async function inspectLimelightCoords() {
  console.log('Launching Real Chromium at 1280x632 viewport...');
  const executablePath = findChromeExecutable();

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 632 });

  const url = 'https://www.limelight.pk/collections/co-ords-main';
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((err) => {
    console.log('Navigation timeout/error, continuing with loaded state:', err.message);
  });

  // Wait extra 2 seconds for images/styles to settle
  await new Promise((r) => setTimeout(r, 2500));

  const domInspection = await page.evaluate(() => {
    const suspiciousTexts = ['Product Name Title', 'PKR 4,990', 'PKR 5,990', 'ADD TO CART', 'SALE'];
    const textOccurrences: Record<string, number> = {};

    suspiciousTexts.forEach((st) => {
      const regex = new RegExp(st, 'gi');
      const bodyText = document.body.innerText || '';
      const matches = bodyText.match(regex);
      textOccurrences[st] = matches ? matches.length : 0;
    });

    // Find all candidate product card containers in Limelight DOM
    const cardSelectors = [
      '.card',
      '.product-card',
      '.grid__item',
      '.card-wrapper',
      '.product-grid .grid__item',
      'ul#product-grid > li',
      '.collection .grid__item',
    ];

    const selectorResults: Record<string, { count: number; visibleCount: number; rects: any[] }> = {};

    cardSelectors.forEach((sel) => {
      const els = Array.from(document.querySelectorAll(sel));
      const rects: any[] = [];
      let vis = 0;
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const isVis = r.width > 0 && r.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        if (isVis) vis++;
        rects.push({
          width: Math.round(r.width),
          height: Math.round(r.height),
          top: Math.round(r.top),
          left: Math.round(r.left),
          isVis,
          tag: el.tagName,
          className: el.className,
        });
      });
      selectorResults[sel] = { count: els.length, visibleCount: vis, rects: rects.slice(0, 5) };
    });

    // Deep inspection of candidate product card elements
    const cardContainers = Array.from(document.querySelectorAll('ul#product-grid > li, .grid__item, .card-wrapper'));
    const cardsDetailed: any[] = [];

    // Filter to product card items
    const uniqueCards = cardContainers.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 150 && r.height > 200;
    });

    uniqueCards.forEach((card, idx) => {
      if (idx >= 6) return;
      const rect = card.getBoundingClientRect();
      const style = window.getComputedStyle(card);

      // Find children: image, title, price, badge, button/cta
      const img = card.querySelector('img');
      const secondImg = card.querySelectorAll('img')[1];
      const titleEl = card.querySelector('.card__heading, .card-information__text, h3, h2, a.full-unstyled-link, .card__title, .product-card__title');
      const priceEl = card.querySelector('.price, .price-item, .card-information .price');
      const currentPriceEl = card.querySelector('.price-item--sale, .price-item--regular, .price .price-item');
      const originalPriceEl = card.querySelector('.price__sale s, s.price-item--regular, .price s');
      const badgeEl = card.querySelector('.badge, .card__badge, span.badge');
      const ctaEl = card.querySelector('button, .button, a.button, [role="button"]');

      // Inner card element vs outer li container geometry comparison!
      const innerCardEl = card.querySelector('.card, .card-wrapper, .card--standard');
      const innerRect = innerCardEl ? innerCardEl.getBoundingClientRect() : null;

      const imgStyle = img ? window.getComputedStyle(img) : null;
      const titleStyle = titleEl ? window.getComputedStyle(titleEl) : null;
      const badgeStyle = badgeEl ? window.getComputedStyle(badgeEl) : null;
      const ctaStyle = ctaEl ? window.getComputedStyle(ctaEl) : null;

      cardsDetailed.push({
        cardIndex: idx,
        cardTag: card.tagName,
        cardClass: card.className,
        cardId: card.id || `card_el_${idx}`,
        cardRect: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        innerCardRect: innerRect ? {
          tag: innerCardEl?.tagName,
          className: innerCardEl?.className,
          width: Math.round(innerRect.width),
          height: Math.round(innerRect.height),
        } : null,
        media: img ? {
          sourceId: img.id || `img_${idx}`,
          tag: img.tagName,
          className: img.className,
          src: img.src || img.getAttribute('src') || img.getAttribute('data-src'),
          currentSrc: img.currentSrc,
          secondSrc: secondImg ? (secondImg.currentSrc || secondImg.src) : null,
          rect: { width: Math.round(img.getBoundingClientRect().width), height: Math.round(img.getBoundingClientRect().height) },
          aspectRatio: img.getBoundingClientRect().height > 0 ? Number((img.getBoundingClientRect().width / img.getBoundingClientRect().height).toFixed(2)) : null,
          objectFit: imgStyle?.objectFit,
        } : null,
        badge: badgeEl ? {
          sourceId: badgeEl.id || `badge_${idx}`,
          tag: badgeEl.tagName,
          className: badgeEl.className,
          rawText: badgeEl.textContent?.trim(),
          backgroundColor: badgeStyle?.backgroundColor,
        } : null,
        title: titleEl ? {
          sourceId: titleEl.id || `title_${idx}`,
          tag: titleEl.tagName,
          className: titleEl.className,
          rawText: titleEl.textContent?.trim(),
          fontSize: titleStyle?.fontSize,
          fontWeight: titleStyle?.fontWeight,
        } : null,
        price: {
          fullText: priceEl ? priceEl.textContent?.trim().replace(/\s+/g, ' ') : null,
          currentPriceText: currentPriceEl ? currentPriceEl.textContent?.trim().replace(/\s+/g, ' ') : null,
          originalPriceText: originalPriceEl ? originalPriceEl.textContent?.trim().replace(/\s+/g, ' ') : null,
          isOnSale: !!originalPriceEl || (priceEl ? priceEl.textContent?.includes('Sale') || false : false),
          priceSourceId: priceEl ? priceEl.id || `price_${idx}` : null,
        },
        cta: ctaEl ? {
          sourceId: ctaEl.id || `cta_${idx}`,
          tag: ctaEl.tagName,
          className: ctaEl.className,
          rawText: ctaEl.textContent?.trim(),
          backgroundColor: ctaStyle?.backgroundColor,
        } : null,
        cardGeometry: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          radius: style.borderRadius,
          padding: style.padding,
        },
      });
    });

    // Count product cards grid container placement
    const gridContainer = document.querySelector('ul#product-grid, .product-grid, .grid--4-col-desktop, #product-grid');
    const gridStyle = gridContainer ? window.getComputedStyle(gridContainer) : null;

    return {
      suspiciousTexts: textOccurrences,
      selectorResults,
      cardsDetailed,
      gridInfo: gridContainer ? {
        tag: gridContainer.tagName,
        className: gridContainer.className,
        display: gridStyle?.display,
        gridTemplateColumns: gridStyle?.gridTemplateColumns,
        gap: gridStyle?.gap,
        padding: gridStyle?.padding,
      } : null,
      totalDomElements: document.querySelectorAll('*').length,
    };
  });

  await browser.close();

  const outputPath = path.resolve('C:\\Users\\abdul\\.gemini\\antigravity-ide\\brain\\d3e9f60c-dba7-4260-b165-f1fb2b9eb60b\\scratch\\limelight_coords_inspection.json');
  fs.writeFileSync(outputPath, JSON.stringify(domInspection, null, 2));
  console.log(`Saved inspection report to ${outputPath}`);
}

inspectLimelightCoords().catch(console.error);
