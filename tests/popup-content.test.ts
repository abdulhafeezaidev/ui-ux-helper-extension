import { describe, it, expect, beforeEach } from 'vitest';
import { registry } from '../src/content/index.ts';
import { MessageType, createMessage } from '../src/index.ts';

describe('Popup -> Content Script Simulated Communication', () => {
  beforeEach(() => {
    // Setup jsdom window state
    document.title = 'Test Target Page';
  });

  it('handles ANALYZE_PAGE message from popup and returns page metadata with raw extraction results', async () => {
    const msg = createMessage(MessageType.ANALYZE_PAGE, { includeHidden: false });
    const response = await registry.handleMessage(msg);

    expect(response.success).toBe(true);
    expect(response.type).toBe(MessageType.ANALYZE_PAGE);
    expect(response.data).toHaveProperty('status', 'completed');
    expect(response.data).toHaveProperty('title', 'Test Target Page');
    expect(response.data).toHaveProperty('extractionResult');
    expect((response.data as any).extractionResult).toHaveProperty('elements');
  });

  it('handles SELECT_ELEMENT message from popup and returns element selection response', async () => {
    const msg = createMessage(MessageType.SELECT_ELEMENT, { selector: '#header', mode: 'click' });
    const response = await registry.handleMessage(msg);

    expect(response.success).toBe(true);
    expect(response.type).toBe(MessageType.SELECT_ELEMENT);
    expect(response.data).toEqual({
      selected: true,
      selector: '#header',
      tagName: 'BODY',
    });
  });

  it('handles ANALYZE_ELEMENT message from popup', async () => {
    const msg = createMessage(MessageType.ANALYZE_ELEMENT, { elementId: 'el_42' });
    const response = await registry.handleMessage(msg);

    expect(response.success).toBe(true);
    expect(response.type).toBe(MessageType.ANALYZE_ELEMENT);
    expect(response.data).toHaveProperty('analyzed', true);
    expect(response.data).toHaveProperty('elementNode');
  });

  it('handles GET_RESULT message from popup', async () => {
    const msg = createMessage(MessageType.GET_RESULT, { resultId: 'session_100' });
    const response = await registry.handleMessage(msg);

    expect(response.success).toBe(true);
    expect(response.type).toBe(MessageType.GET_RESULT);
    expect(response.data).toHaveProperty('resultId', 'session_100');
    expect(response.data).toHaveProperty('status', 'available');
  });

  it('handles EXPORT_RESULT message from popup and formats json output', async () => {
    const msg = createMessage(MessageType.EXPORT_RESULT, { format: 'json' });
    const response = await registry.handleMessage(msg);

    expect(response.success).toBe(true);
    expect(response.type).toBe(MessageType.EXPORT_RESULT);
    expect(response.data).toHaveProperty('format', 'json');
    expect(typeof (response.data as any).exportedData).toBe('string');
  });
});
