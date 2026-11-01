import { describe, it, expect } from 'vitest';
import {
  parseCornerRadiusPx,
  classifyGeometry,
  parseBoxShadow,
  parseGradients,
  ShapeNormalizer,
} from '../src/normalization/index.ts';
import { DomExtractor } from '../src/extraction/index.ts';

describe('Shape & Surface Normalization Engine', () => {
  describe('Geometry Classification & Radius Parsing', () => {
    it('classifies geometry deterministically based on corner radius and element bounds', () => {
      const rect = { x: 0, y: 0, width: 100, height: 40 };

      const sharp = classifyGeometry(
        { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' },
        rect
      );
      expect(sharp).toBe('sharp');

      const slightlyRounded = classifyGeometry(
        { topLeft: '4px', topRight: '4px', bottomRight: '4px', bottomLeft: '4px' },
        rect
      );
      expect(slightlyRounded).toBe('slightlyRounded');

      const rounded = classifyGeometry(
        { topLeft: '8px', topRight: '8px', bottomRight: '8px', bottomLeft: '8px' },
        rect
      );
      expect(rounded).toBe('rounded');

      const pill = classifyGeometry(
        { topLeft: '20px', topRight: '20px', bottomRight: '20px', bottomLeft: '20px' },
        rect
      );
      expect(pill).toBe('pill');

      const circular = classifyGeometry(
        { topLeft: '20px', topRight: '20px', bottomRight: '20px', bottomLeft: '20px' },
        { x: 0, y: 0, width: 40, height: 40 }
      );
      expect(circular).toBe('circular');

      const asymmetric = classifyGeometry(
        { topLeft: '12px', topRight: '0px', bottomRight: '12px', bottomLeft: '0px' },
        rect
      );
      expect(asymmetric).toBe('asymmetric');
    });

    it('parses numeric radius values correctly', () => {
      expect(parseCornerRadiusPx('8px')).toBe(8);
      expect(parseCornerRadiusPx('0px')).toBe(0);
      expect(parseCornerRadiusPx('50%')).toBe(50);
    });
  });

  describe('Box Shadow Parsing', () => {
    it('parses outset and inset box shadow strings correctly', () => {
      const shadowOutset = parseBoxShadow('rgba(0, 0, 0, 0.1) 0px 4px 6px 0px');
      expect(shadowOutset.length).toBe(1);
      expect(shadowOutset[0].offsetXPx).toBe(0);
      expect(shadowOutset[0].offsetYPx).toBe(4);
      expect(shadowOutset[0].blurPx).toBe(6);
      expect(shadowOutset[0].spreadPx).toBe(0);
      expect(shadowOutset[0].isInset).toBe(false);

      const shadowInset = parseBoxShadow('inset 0px 2px 4px rgba(0, 0, 0, 0.2)');
      expect(shadowInset.length).toBe(1);
      expect(shadowInset[0].isInset).toBe(true);
      expect(shadowInset[0].blurPx).toBe(4);
    });
  });

  describe('CSS Gradient Parsing', () => {
    it('parses linear and radial gradients with direction and color stops', () => {
      const gradients = parseGradients('linear-gradient(to right, rgb(139, 92, 246), rgb(236, 72, 153))');
      expect(gradients.length).toBe(1);
      expect(gradients[0].type).toBe('linear');
      expect(gradients[0].angleOrDirection).toBe('to right');
      expect(gradients[0].stops.length).toBe(2);
    });
  });

  describe('Surface Category Classification', () => {
    it('classifies flat, bordered, elevated, translucent, glassLike, inset, gradient, and glowing surfaces', () => {
      document.body.innerHTML = `
        <div id="flat-el" style="background-color: rgb(255, 255, 255);">Flat</div>
        <div id="bordered-el" style="border: 2px solid rgb(0, 0, 0);">Bordered</div>
        <div id="elevated-el" style="box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);">Elevated</div>
        <div id="translucent-el" style="background-color: rgba(255, 255, 255, 0.5);">Translucent</div>
        <div id="glass-el" style="background-color: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px);">Glass</div>
        <div id="inset-el" style="box-shadow: inset 0px 2px 4px rgba(0,0,0,0.2);">Inset</div>
        <div id="gradient-el" style="background-image: linear-gradient(to right, red, blue);">Gradient</div>
        <div id="glowing-el" style="box-shadow: 0px 0px 20px rgba(139, 92, 246, 0.8);">Glowing</div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const shapeNormalizer = new ShapeNormalizer();
      const shapeSystem = shapeNormalizer.normalize(rawResult);

      expect(shapeSystem.stats.totalSurfacesAnalyzed).toBeGreaterThan(0);
      expect(shapeSystem.surfaceCounts.flat).toBeGreaterThan(0);
      expect(shapeSystem.surfaceCounts.bordered).toBeGreaterThan(0);
      expect(shapeSystem.surfaceCounts.elevated).toBeGreaterThan(0);
      expect(shapeSystem.surfaceCounts.translucent).toBeGreaterThan(0);
    });
  });

  describe('Full Shape System Normalization & Determinism', () => {
    it('excludes hidden elements when includeHiddenElements is false', () => {
      document.body.innerHTML = `
        <div id="root">
          <div style="border-radius: 8px; border: 1px solid black;">Visible Card</div>
          <div style="display: none; border-radius: 99px; box-shadow: 0px 20px 30px red;">Hidden Pill</div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body, { includeHidden: true });

      const normalizer = new ShapeNormalizer({ includeHiddenElements: false });
      const shapeSystem = normalizer.normalize(rawResult);

      const radii = shapeSystem.radiusScale.map((r) => r.valuePx);
      expect(radii).not.toContain(99);
    });

    it('is strictly deterministic: produces identical tokens and counts across identical DOM state', () => {
      document.body.innerHTML = `
        <div>
          <div style="border-radius: 8px; box-shadow: 0px 4px 6px black;">Card 1</div>
          <div style="border-radius: 8px; box-shadow: 0px 4px 6px black;">Card 2</div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const normalizer = new ShapeNormalizer();
      const system1 = normalizer.normalize(rawResult);
      const system2 = normalizer.normalize(rawResult);

      expect(system1.stats).toEqual(system2.stats);
      expect(system1.radiusScale).toEqual(system2.radiusScale);
      expect(system1.shadowTokens).toEqual(system2.shadowTokens);
    });
  });
});
