import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildResponsiveIntelligenceSystem } from '../../normalization/layout/responsiveIntelligenceEngine.ts';

export function exportResponsiveJson(data: AnalyzePageResponseData): string {
  const responsiveSys = buildResponsiveIntelligenceSystem(data);
  return JSON.stringify(responsiveSys, null, 2);
}
