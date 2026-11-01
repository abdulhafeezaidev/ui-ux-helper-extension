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

async function traceRegression() {
  const executablePath = findChromeExecutable();

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 632 });

  await page.goto('https://www.limelight.pk/collections/co-ords-main', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));

  const traces = await page.evaluate(() => {
    const all = Array.from(document.body.querySelectorAll('*'));
    const applyElements: any[] = [];
    const price4999Elements: any[] = [];
    const geom20x63Elements: any[] = [];

    all.forEach((el, idx) => {
      const text = el.textContent?.trim() || '';
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      if (text === 'Apply' || text.includes('Apply')) {
        applyElements.push({
          idx,
          id: el.id || `el_${idx}`,
          tag: el.tagName,
          className: el.className,
          text,
          rect: { width: w, height: h, top: Math.round(rect.top), left: Math.round(rect.left) },
        });
      }

      if (text.includes('4999') || text.includes('4,999')) {
        price4999Elements.push({
          idx,
          id: el.id || `el_${idx}`,
          tag: el.tagName,
          className: el.className,
          text: text.slice(0, 80),
          rect: { width: w, height: h },
        });
      }

      if ((w === 20 && h === 63) || (w === 63 && h === 20) || (w >= 15 && w <= 25 && h >= 50 && h <= 70) || (w >= 50 && w <= 70 && h >= 15 && h <= 25)) {
        geom20x63Elements.push({
          idx,
          id: el.id || `el_${idx}`,
          tag: el.tagName,
          className: el.className,
          text: text.slice(0, 40),
          rect: { width: w, height: h },
        });
      }
    });

    return { applyElements, price4999Elements, geom20x63Elements };
  });

  console.log('=== APPLY BUTTON ELEMENTS ===');
  console.log(JSON.stringify(traces.applyElements, null, 2));

  console.log('=== PRICE 4999 ELEMENTS ===');
  console.log(JSON.stringify(traces.price4999Elements.slice(0, 5), null, 2));

  console.log('=== 20x63 / 63x20 GEOMETRY ELEMENTS ===');
  console.log(JSON.stringify(traces.geom20x63Elements.slice(0, 5), null, 2));

  await browser.close();
}

traceRegression().catch(console.error);
