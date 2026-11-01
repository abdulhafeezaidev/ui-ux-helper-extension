import { JSDOM } from 'jsdom';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';
import { refineSections } from '../src/agent-spec/refinement/sectionRefiner.ts';

async function debugSections() {
  console.log('Fetching live HTML from https://www.limelight.pk/...');
  const res = await fetch('https://www.limelight.pk/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  const dom = new JSDOM(html, { url: 'https://www.limelight.pk/' });

  (global as any).document = dom.window.document;
  (global as any).window = dom.window as any;
  (global as any).Node = dom.window.Node as any;
  (global as any).Element = dom.window.Element as any;

  const raw = new DomExtractor().extract(dom.window.document.body);
  const colors = new ColorNormalizer().normalize(raw);
  const typo = new TypographyNormalizer().normalize(raw);
  const shapes = new ShapeNormalizer().normalize(raw);
  const layout = new LayoutNormalizer().normalize(raw);
  const comps = new ComponentNormalizer().normalize(raw, colors, typo, shapes, layout);

  console.log(`\n=== RAW LAYOUT SECTIONS DETECTED (${layout.sections.length}) ===`);
  layout.sections.forEach((sec, idx) => {
    const el = raw.elements.find((e) => e.id === sec.elementId);
    console.log(`[Raw Section ${idx + 1}] ID: ${sec.elementId} | Tag: <${el?.tagName}> | Class: "${el?.className || ''}" | Bounds: y=${sec.bounds.y}, h=${sec.bounds.height}, w=${sec.bounds.width}`);
  });

  console.log(`\n=== CLASSIFIED SEMANTIC SECTIONS (${comps.sections.length}) ===`);
  const elementMap = new Map(raw.elements.map((e) => [e.id, e]));

  comps.sections.forEach((sec, idx) => {
    const el = elementMap.get(sec.elementId);
    const parentEl = el?.parentId ? elementMap.get(el.parentId) : null;
    const secComponents = comps.components.filter((c) => sec.componentIds.includes(c.id));
    const compTypes = Array.from(new Set(secComponents.map((c) => c.type)));

    console.log(`\n--------------------------------------------------`);
    console.log(`Candidate ${idx + 1}: ${sec.id}`);
    console.log(`  Source Element ID : ${sec.elementId}`);
    console.log(`  DOM Tag & Class   : <${el?.tagName}> class="${el?.className || ''}"`);
    console.log(`  Parent Element ID : ${el?.parentId || 'None'} (<${parentEl?.tagName}>)`);
    console.log(`  Section Type      : ${sec.sectionType}`);
    console.log(`  Confidence        : ${sec.confidence}`);
    console.log(`  Bounding Box      : y=${el?.boundingRect.y}, h=${el?.boundingRect.height}, w=${el?.boundingRect.width}`);
    console.log(`  Child Count       : ${el?.childIds.length || 0}`);
    console.log(`  Contained Comps   : ${secComponents.length} components (${compTypes.join(', ') || 'none'})`);
    console.log(`  Evidence          : ${sec.evidence.join(' | ')}`);
  });

  const refined = refineSections(comps.sections, raw.elements);

  console.log(`\n==================================================`);
  console.log(`=== REFINED SECTIONS AFTER REFINEMENT (${refined.length}) ===`);
  console.log(`==================================================`);
  refined.forEach((sec, idx) => {
    console.log(`[Refined ${idx + 1}] ID: ${sec.id} | Type: ${sec.sectionType} | Source ID: ${sec.representativeElementId} | Evidence: ${sec.evidence.join(' | ')}`);
  });
}

debugSections().catch((err) => console.error(err));
