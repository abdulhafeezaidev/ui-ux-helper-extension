import { AnalyzePageResponseData } from '../types/index.ts';

export class JsonOutputGenerator {
  public readonly format = 'json';

  public generate(data: unknown): string {
    return JSON.stringify(data, null, 2);
  }
}

export function exportJson(data: AnalyzePageResponseData): string {
  if (!data) return JSON.stringify({}, null, 2);

  // Deterministically sort top-level keys
  const sorted: Record<string, unknown> = {
    status: data.status,
    title: data.title,
    pageUrl: data.pageUrl,
    timestamp: data.timestamp,
    summary: data.summary,
    extractionResult: data.extractionResult,
    colorSystem: data.colorSystem,
    typographySystem: data.typographySystem,
    shapeSystem: data.shapeSystem,
    layoutSystem: data.layoutSystem,
    componentSystem: data.componentSystem,
  };

  return JSON.stringify(sorted, null, 2);
}
