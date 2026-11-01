import fs from 'fs';
import path from 'path';
import { exportAdsContext } from '../src/agent-spec/index.ts';

const reportPath = path.resolve('C:\\Users\\abdul\\.gemini\\antigravity-ide\\brain\\d3e9f60c-dba7-4260-b165-f1fb2b9eb60b\\scratch\\github_extension_ads_report.json');
const rawAds = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const compactSpecStr = exportAdsContext(rawAds);

console.log('=== FINAL EXTENSION ADS COMPACT SPEC FOR GITHUB ===\n');
console.log(compactSpecStr);
