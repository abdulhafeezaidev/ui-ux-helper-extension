import { AnalyzePageResponseData } from '../../types/index.ts';
import { DesignKnowledgeGraphEngine } from '../../normalization/knowledgeGraph/designKnowledgeGraphEngine.ts';
import { KnowledgeGraphAuditEngine } from '../../normalization/knowledgeGraph/knowledgeGraphAuditEngine.ts';

export function exportKnowledgeGraphAuditReport(data: AnalyzePageResponseData): string {
  const dkgEngine = new DesignKnowledgeGraphEngine();
  const { dkg, components, variants, tokens } = dkgEngine.normalize(data);

  const auditEngine = new KnowledgeGraphAuditEngine();
  const auditReport = auditEngine.generateAuditReport(data, dkg, components, variants, tokens);

  return auditReport.summaryMarkdown;
}

export function exportKnowledgeGraphAuditJson(data: AnalyzePageResponseData): string {
  const dkgEngine = new DesignKnowledgeGraphEngine();
  const { dkg, components, variants, tokens } = dkgEngine.normalize(data);

  const auditEngine = new KnowledgeGraphAuditEngine();
  const auditReport = auditEngine.generateAuditReport(data, dkg, components, variants, tokens);

  return JSON.stringify(auditReport, null, 2);
}
