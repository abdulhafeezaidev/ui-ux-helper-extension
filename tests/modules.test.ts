import { describe, it, expect } from 'vitest';
import {
  BaseExtractor,
  BaseNormalizer,
  JsonOutputGenerator,
  Logger,
  LogLevel,
} from '../src/index.ts';

describe('Module Contract & Isolation Integrity', () => {
  it('instantiates and runs BaseExtractor correctly', () => {
    const extractor = new BaseExtractor();
    expect(extractor.name).toBe('BaseExtractor');

    const div = document.createElement('div');
    div.id = 'test-id';
    const result = extractor.extract(div);

    expect(result).toEqual({ tagName: 'div', id: 'test-id' });
  });

  it('instantiates and runs BaseNormalizer correctly', () => {
    const normalizer = new BaseNormalizer();
    expect(normalizer.name).toBe('BaseNormalizer');

    const inputObj = { rawValue: 100, unit: 'px' };
    const normalized = normalizer.normalize(inputObj);

    expect(normalized).toEqual(inputObj);
    expect(normalizer.normalize(42)).toEqual({ value: 42 });
  });

  it('instantiates and runs JsonOutputGenerator correctly', () => {
    const generator = new JsonOutputGenerator();
    expect(generator.format).toBe('json');

    const testData = { status: 'success', items: [1, 2, 3] };
    const jsonString = generator.generate(testData);

    expect(JSON.parse(jsonString)).toEqual(testData);
  });

  it('instantiates Logger without error', () => {
    const logger = new Logger('TestScope', LogLevel.DEBUG);
    expect(logger).toBeDefined();
    expect(() => logger.info('Test log message')).not.toThrow();
  });
});
