import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('Dist Build Artifact Integrity', () => {
  const distPath = path.resolve(__dirname, '../dist');

  beforeAll(() => {
    if (!fs.existsSync(distPath)) {
      execSync('npx vite build', { cwd: path.resolve(__dirname, '..') });
    }
  });

  it('verifies dist directory exists post-build', () => {
    expect(fs.existsSync(distPath)).toBe(true);
  });

  it('verifies manifest.json in dist is valid Manifest V3 JSON', () => {
    const manifestFile = path.join(distPath, 'manifest.json');
    expect(fs.existsSync(manifestFile)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('UI/UX Helper');
    expect(manifest.permissions).toContain('activeTab');
    expect(manifest.permissions).toContain('scripting');
  });

  it('verifies bundled content.js and background.js exist in dist', () => {
    const contentScript = path.join(distPath, 'content.js');
    const backgroundScript = path.join(distPath, 'background.js');

    expect(fs.existsSync(contentScript)).toBe(true);
    expect(fs.existsSync(backgroundScript)).toBe(true);

    const contentCode = fs.readFileSync(contentScript, 'utf-8');
    expect(contentCode.length).toBeGreaterThan(0);
  });

  it('verifies popup.html exists in dist', () => {
    const popupHtmlPath = path.join(distPath, 'src/popup/popup.html');
    expect(fs.existsSync(popupHtmlPath)).toBe(true);
  });
});
