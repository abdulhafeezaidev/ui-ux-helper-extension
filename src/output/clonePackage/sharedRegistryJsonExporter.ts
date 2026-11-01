import { AnalyzePageResponseData } from '../../types/index.ts';
import { buildSharedObjectRegistry } from '../../normalization/compression/sharedRegistryEngine.ts';

export function exportSharedRegistryJson(data: AnalyzePageResponseData): string {
  const registry = buildSharedObjectRegistry(data);
  const payload = {
    $schema: 'https://ui-ux-helper.internal/schemas/shared-registry-v1.json',
    ...registry,
  };
  return JSON.stringify(payload, null, 2);
}
