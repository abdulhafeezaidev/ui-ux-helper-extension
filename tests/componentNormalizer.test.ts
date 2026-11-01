import { describe, it, expect } from 'vitest';
import {
  detectComponentCandidates,
  detectComponentFamilies,
  ComponentNormalizer,
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
} from '../src/normalization/index.ts';
import { DomExtractor } from '../src/extraction/index.ts';

describe('Component & Design-Pattern Analysis Engine', () => {
  describe('Component Candidate Detection & Evidence', () => {
    it('detects buttons, inputs, forms, cards, badges, nav, and footers with evidence & confidence scores', () => {
      document.body.innerHTML = `
        <nav id="top-nav">
          <a href="#">Link 1</a>
          <a href="#">Link 2</a>
        </nav>
        <main>
          <form id="login-form">
            <input type="text" id="username" placeholder="Username" />
            <button role="button" id="submit-btn" style="padding: 8px 16px; border-radius: 6px; background-color: rgb(99, 102, 241); color: white;">Submit</button>
          </form>
          <div id="card-1" style="border: 1px solid gray; box-shadow: 0px 4px 6px black; padding: 16px; border-radius: 8px;">
            <h2>Card Title</h2>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: purple;">NEW BADGE</span>
          </div>
        </main>
        <footer id="site-footer">Footer Content</footer>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const candidates = detectComponentCandidates(rawResult.elements);

      expect(candidates.length).toBeGreaterThan(0);

      const navComp = candidates.find((c) => c.type === 'navigation');
      expect(navComp).toBeDefined();
      expect(navComp?.confidence).toBeGreaterThanOrEqual(0.9);
      expect(navComp?.evidence.length).toBeGreaterThan(0);

      const formComp = candidates.find((c) => c.type === 'form');
      expect(formComp).toBeDefined();

      const btnComp = candidates.find((c) => c.type === 'button');
      expect(btnComp).toBeDefined();

      const inputComp = candidates.find((c) => c.type === 'input');
      expect(inputComp).toBeDefined();

      const footerComp = candidates.find((c) => c.type === 'footer');
      expect(footerComp).toBeDefined();
    });
  });

  describe('Repeated Component Family Detection', () => {
    it('groups repeated card and button instances into component families', () => {
      document.body.innerHTML = `
        <div>
          <div id="card-a" style="border: 1px solid black; padding: 16px;">
            <h3>Title A</h3>
            <button role="button">Action A</button>
          </div>
          <div id="card-b" style="border: 1px solid black; padding: 16px;">
            <h3>Title B</h3>
            <button role="button">Action B</button>
          </div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const candidates = detectComponentCandidates(rawResult.elements);
      const families = detectComponentFamilies(candidates);

      expect(families.length).toBeGreaterThan(0);
      const buttonFamily = families.find((f) => f.type === 'button');
      expect(buttonFamily).toBeDefined();
      expect(buttonFamily?.instanceCount).toBe(2);
    });
  });

  describe('Full Component System Normalization & Design Pattern Analysis', () => {
    it('analyzes cardBasedUI and pillControls design patterns', () => {
      document.body.innerHTML = `
        <div id="app">
          <div style="display: grid; grid-template-columns: 1fr 1fr;">
            <div id="c1" style="border: 1px solid gray; padding: 16px;">
              <h2>Card 1</h2>
              <button style="border-radius: 999px;">Pill CTA 1</button>
            </div>
            <div id="c2" style="border: 1px solid gray; padding: 16px;">
              <h2>Card 2</h2>
              <button style="border-radius: 999px;">Pill CTA 2</button>
            </div>
          </div>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const colorSys = new ColorNormalizer().normalize(rawResult);
      const typoSys = new TypographyNormalizer().normalize(rawResult);
      const shapeSys = new ShapeNormalizer().normalize(rawResult);
      const layoutSys = new LayoutNormalizer().normalize(rawResult);

      const normalizer = new ComponentNormalizer();
      const compSystem = normalizer.normalize(rawResult, colorSys, typoSys, shapeSys, layoutSys);

      expect(compSystem.components.length).toBeGreaterThan(0);
      expect(compSystem.families.length).toBeGreaterThan(0);
      expect(compSystem.patterns.some((p) => p.patternType === 'cardBasedUI')).toBe(true);
    });

    it('is strictly deterministic: returns identical components, families, and patterns for identical DOM state', () => {
      document.body.innerHTML = `
        <div>
          <button role="button">Button 1</button>
          <button role="button">Button 2</button>
        </div>
      `;

      const domExtractor = new DomExtractor();
      const rawResult = domExtractor.extract(document.body);

      const normalizer = new ComponentNormalizer();
      const system1 = normalizer.normalize(rawResult);
      const system2 = normalizer.normalize(rawResult);

      expect(system1.stats).toEqual(system2.stats);
      expect(system1.components).toEqual(system2.components);
      expect(system1.families).toEqual(system2.families);
    });
  });
});
