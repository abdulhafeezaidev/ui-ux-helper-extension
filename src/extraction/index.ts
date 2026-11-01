/**
 * Extraction Module Contract Definitions and Extractor Engine.
 */

export interface ExtractionOptions {
  includeHidden?: boolean;
}

export interface Extractor<TInput = Element, TOutput = unknown> {
  name: string;
  extract(target: TInput, options?: ExtractionOptions): Promise<TOutput> | TOutput;
}

export class BaseExtractor implements Extractor<Element, { tagName: string; id: string }> {
  public readonly name = 'BaseExtractor';

  public extract(target: Element): { tagName: string; id: string } {
    return {
      tagName: target.tagName.toLowerCase(),
      id: target.id || '',
    };
  }
}

export * from './domExtractor.ts';
