import { AnalyzePageResponseData } from '../../types/index.ts';
import { packageCollectors } from './clonePackageBuilder.ts';
import { computeCloneConfidenceScore, CloneConfidenceScore } from '../../normalization/fidelity/cloneConfidenceCalculator.ts';

export interface LightweightBundleResult {
  $schema: string;
  bundleVersion: string;
  generatedAt: string;
  title: string;
  url: string;
  instructions: string;
  target: {
    title: string;
    url: string;
    viewport: string;
  };
  cloneReadiness: CloneConfidenceScore;
  reconstructionPrompt: string;
  reconstructionGraph: any;
  designSystem: any;
  componentVariants: any;
  layoutConstraints: any;
  responsiveTransitions: any;
  motionTimelines: any;
  contentSemantics: any;
  assets: any;
  cssVariables: string;
  tailwindConfig: string;
  totalTokensEstimated: number;
  styles: {
    cssVariables: string;
    tailwindConfig: string;
  };
}

/**
 * Builds an optimized, synchronized single lightweight bundle (< 1MB)
 * for token-limited AI coding agents by reusing the central collector pipeline.
 */
export function buildLightweightBundle(data: AnalyzePageResponseData): LightweightBundleResult {
  const readiness = computeCloneConfidenceScore(data);

  const ds = packageCollectors.collectDesignSystem(data);
  const variants = packageCollectors.collectVariants(data);
  const constraints = packageCollectors.collectConstraints(data);
  const resp = packageCollectors.collectResponsive(data);
  const motion = packageCollectors.collectMotion(data);
  const content = packageCollectors.collectContent(data);
  const graph = packageCollectors.collectReconstructionGraph(data);
  const prompt = packageCollectors.collectPrompt(data);
  const assets = packageCollectors.collectAssets(data);

  const totalTokensEstimated = Math.round(
    (ds.json.length + ds.css.length + ds.tailwind.length + graph.length + prompt.readme.length + assets.length) / 4
  );

  return {
    $schema: 'https://ui-ux-helper.internal/schemas/ai-lightweight-bundle-v1.json',
    bundleVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    title: data.title || 'Web Application',
    url: data.pageUrl || '',
    instructions: prompt.readme,
    target: {
      title: data.title || 'Web Application',
      url: data.pageUrl || '',
      viewport: `${data.layoutSystem?.viewport.width || 1440}x${data.layoutSystem?.viewport.height || 900}`,
    },
    cloneReadiness: readiness,
    reconstructionPrompt: prompt.readme,
    reconstructionGraph: JSON.parse(graph),
    designSystem: JSON.parse(ds.json),
    componentVariants: JSON.parse(variants),
    layoutConstraints: JSON.parse(constraints),
    responsiveTransitions: JSON.parse(resp.transitions),
    motionTimelines: JSON.parse(motion),
    contentSemantics: JSON.parse(content),
    assets: JSON.parse(assets),
    cssVariables: ds.css,
    tailwindConfig: ds.tailwind,
    totalTokensEstimated,
    styles: {
      cssVariables: ds.css,
      tailwindConfig: ds.tailwind,
    },
  };
}

/**
 * Serializes the lightweight bundle into a formatted JSON string.
 */
export function exportLightweightBundleJson(data: AnalyzePageResponseData): string {
  const bundle = buildLightweightBundle(data);
  return JSON.stringify(bundle, null, 2);
}
