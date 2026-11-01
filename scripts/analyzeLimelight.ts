import { JSDOM } from 'jsdom';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { buildAgentDesignSpecification, exportAdsContext } from '../src/agent-spec/index.ts';
import { refineDesignIntelligence } from '../src/agent-spec/refinement/index.ts';

async function analyzeLimelight() {
  console.log('Fetching https://www.limelight.pk/...');
  const res = await fetch('https://www.limelight.pk/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  console.log('HTML fetched successfully. Length:', html.length);

  const dom = new JSDOM(html, { url: 'https://www.limelight.pk/' });

  (global as any).document = dom.window.document;
  (global as any).window = dom.window as any;
  (global as any).Node = dom.window.Node as any;
  (global as any).Element = dom.window.Element as any;

  console.log('Extracting DOM...');
  const raw = new DomExtractor().extract(dom.window.document.body);
  console.log('Normalizing Color system...');
  const colors = new ColorNormalizer().normalize(raw);
  console.log('Normalizing Typography system...');
  const typo = new TypographyNormalizer().normalize(raw);
  console.log('Normalizing Shape system...');
  const shapes = new ShapeNormalizer().normalize(raw);
  console.log('Normalizing Layout system...');
  const layout = new LayoutNormalizer().normalize(raw);
  console.log('Normalizing Component system...');
  const comps = new ComponentNormalizer().normalize(raw, colors, typo, shapes, layout);

  const data = {
    status: 'completed' as const,
    pageUrl: 'https://www.limelight.pk/',
    title: dom.window.document.title,
    timestamp: Date.now(),
    extractionResult: raw,
    colorSystem: colors,
    typographySystem: typo,
    shapeSystem: shapes,
    layoutSystem: layout,
    componentSystem: comps,
  };

  console.log('Running Refinement Engine...');
  const refined = refineDesignIntelligence(data as any);
  console.log('Building ADS...');
  const ads = buildAgentDesignSpecification(data as any);
  const adsCtx = exportAdsContext(ads);

  console.log('\n==================================================');
  console.log('   REAL-WORLD ACCEPTANCE METRICS FOR LIMELIGHT.PK');
  console.log('==================================================');
  console.log('Raw DOM elements:', raw.elements.length);
  console.log('Raw component candidates:', comps.components.length);
  console.log('Refined component families:', refined.componentFamilies.length);
  const largestFam = Math.max(...refined.componentFamilies.map((f) => f.instanceCount), 0);
  console.log('Largest family instance count:', largestFam);
  console.log('');
  console.log('Raw section candidates:', comps.sections.length);
  console.log('Refined sections:', refined.sections.length);
  console.log('Sections suppressed:', comps.sections.length - refined.sections.length);
  console.log('');
  console.log('Refined spacing tokens:', refined.spacingScale.map((s) => s.valuePx));
  console.log('Refined radius tokens:', refined.radiusTokens.map((r) => `${r.valuePx}px (${r.classification})`));
  console.log('');
  console.log('Color tokens:', colors.tokens.length);
  console.log('Typography tokens:', typo.tokens.length);
  console.log('Design patterns:', comps.patterns.length);

  console.log('\n--- REFINED SECTIONS DETAILS ---');
  refined.sections.forEach((s) => {
    console.log(`- Section [${s.sectionType}]: instances=${s.instanceCount}, confidence=${s.confidence}, elementId=${s.representativeElementId}`);
  });

  console.log('\n--- REFINED COMPONENT FAMILIES DETAILS ---');
  refined.componentFamilies.forEach((f) => {
    console.log(`- Family [${f.type}]: familyId=${f.familyId}, instances=${f.instanceCount}, shared=[${f.sharedProperties.join(', ')}]`);
  });

  console.log('\n--- FINAL ADS CONTEXT PREVIEW ---');
  console.log(adsCtx);
}

analyzeLimelight().catch((err) => console.error(err));
