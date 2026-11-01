import { describe, it, expect } from 'vitest';
import { DomExtractor } from '../src/extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../src/normalization/index.ts';

describe('Real Webpage DOM Extraction, Color, Typography, Shape, Layout & Component System Verification', () => {
  it('extracts structured element inventory and normalizes color, typography, shape, layout, and component systems from webpage DOM', () => {
    document.body.innerHTML = `
      <div id="wrapper" style="font-family: 'Inter', sans-serif; background-color: rgb(245, 247, 250); color: rgb(30, 41, 59); padding: 24px;">
        <nav id="nav" style="margin-bottom: 24px;">
          <a href="#" style="font-size: 14px; color: rgb(59, 130, 246); margin-right: 12px;">Home</a>
          <a href="#" style="font-size: 14px; color: rgb(59, 130, 246);">Docs</a>
        </nav>
        <h1 style="font-size: 32px; font-weight: 700; color: rgb(30, 41, 59);">Example Domain</h1>
        <p style="font-size: 16px; font-weight: 400; color: rgb(100, 116, 139); line-height: 24px;">
          This domain is for use in illustrative examples in documents.
        </p>
        <div style="background: white; border: 1px solid rgb(226, 232, 240); border-radius: 8px; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.05); padding: 16px;">
          <button role="button" style="background-color: rgb(99, 102, 241); color: white; padding: 8px 16px; border-radius: 6px;">More Information</button>
        </div>
        <footer style="margin-top: 32px; font-size: 12px; color: gray;">© Example Domain Footer</footer>
      </div>
    `;
    document.title = 'Example Domain';

    const extractor = new DomExtractor();
    const rawResult = extractor.extract(document.body);

    const colorNormalizer = new ColorNormalizer();
    const colorSystem = colorNormalizer.normalize(rawResult);

    const typographyNormalizer = new TypographyNormalizer();
    const typographySystem = typographyNormalizer.normalize(rawResult);

    const shapeNormalizer = new ShapeNormalizer();
    const shapeSystem = shapeNormalizer.normalize(rawResult);

    const layoutNormalizer = new LayoutNormalizer();
    const layoutSystem = layoutNormalizer.normalize(rawResult);

    const componentNormalizer = new ComponentNormalizer();
    const componentSystem = componentNormalizer.normalize(
      rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem
    );

    expect(rawResult).toBeDefined();
    expect(rawResult.pageMeta.title).toBe('Example Domain');

    expect(colorSystem.tokens.length).toBeGreaterThan(0);
    expect(typographySystem.fontFamilies.length).toBeGreaterThan(0);
    expect(shapeSystem.stats.totalSurfacesAnalyzed).toBeGreaterThan(0);
    expect(layoutSystem.stats.containerCount).toBeGreaterThan(0);

    expect(componentSystem).toBeDefined();
    expect(componentSystem.components.length).toBeGreaterThan(0);
    expect(componentSystem.components.some((c) => c.type === 'navigation')).toBe(true);
    expect(componentSystem.components.some((c) => c.type === 'button')).toBe(true);
    expect(componentSystem.components.some((c) => c.type === 'footer')).toBe(true);
  });
});
