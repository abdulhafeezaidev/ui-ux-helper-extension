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
import { refineSectionsDetailed } from '../src/agent-spec/refinement/sectionRefiner.ts';

export async function validateLimelightBrowserFidelity() {
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

  const detailedRefinement = refineSectionsDetailed(comps.sections, raw.elements);
  const data = {
    status: 'completed' as const,
    pageUrl: 'https://www.limelight.pk/',
    title: dom.window.document.title,
    timestamp: 1700000000000,
    extractionResult: raw,
    colorSystem: colors,
    typographySystem: typo,
    shapeSystem: shapes,
    layoutSystem: layout,
    componentSystem: comps,
  };

  const refined = refineDesignIntelligence(data as any);
  const ads = buildAgentDesignSpecification(data as any);
  const adsContext = exportAdsContext(ads);
  const isDeterministic = exportAdsContext(buildAgentDesignSpecification(data as any)) === adsContext;

  const score = refined.fidelityScore;
  const coverage = refined.coverage;

  console.log('\n========================================================================================');
  console.log('                 PROMPT 13 — UPGRADED COMPACT ADS CONTEXT (LIMELIGHT.PK)');
  console.log('========================================================================================');
  console.log(adsContext);
  console.log('========================================================================================\n');

  console.log('========================================================================================');
  console.log('                 RECALIBRATED ADS FIDELITY SCORE & GATES');
  console.log('========================================================================================');
  console.log(`OVERALL ADS FIDELITY SCORE:   ${score.totalScore} / 100`);
  console.log(`  - Section Fidelity:         ${score.breakdown.sectionFidelity} / 30`);
  console.log(`  - Component Fidelity:       ${score.breakdown.componentFidelity} / 25`);
  console.log(`  - Token Fidelity:           ${score.breakdown.tokenFidelity} / 20`);
  console.log(`  - Hierarchy Fidelity:       ${score.breakdown.hierarchyFidelity} / 15`);
  console.log(`  - Traceability:             ${score.breakdown.traceability} / 5`);
  console.log(`  - Determinism:              ${score.breakdown.determinism} / 5`);
  console.log('========================================================================================\n');

  return {
    score: score.totalScore,
    coverage: coverage.retainedSectionCoveragePct,
    retainedSections: detailedRefinement.retained.length,
    suppressedSections: detailedRefinement.suppressed.length,
    isDeterministic,
  };
}

if (process.argv[1] && process.argv[1].endsWith('validateLimelight.ts')) {
  validateLimelightBrowserFidelity().catch((err) => console.error(err));
}
