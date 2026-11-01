import { describe, it, expect } from 'vitest';
import { registry } from '../src/content/index.ts';
import { MessageType } from '../src/types/index.ts';

describe('IPC Contract & Message Robustness Engine', () => {
  it('handles unknown message types safely and returns structured error', async () => {
    const unknownMessage = {
      id: 'msg_999',
      type: 'UNKNOWN_MESSAGE_TYPE' as MessageType,
      payload: {},
      timestamp: Date.now(),
    };

    const response = await registry.handleMessage(unknownMessage);
    expect(response.success).toBe(false);
    expect(response.error).toContain('Invalid message structure or unknown MessageType');
  });

  it('handles MessageType.ANALYZE_PAGE with empty payload object safely', async () => {
    const msg = {
      id: 'msg_100',
      type: MessageType.ANALYZE_PAGE,
      payload: {},
      timestamp: Date.now(),
    };

    const response = await registry.handleMessage(msg);
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  });

  it('handles MessageType.ANALYZE_PAGE with missing payload safely by returning structured error response', async () => {
    const msg = {
      id: 'msg_101',
      type: MessageType.ANALYZE_PAGE,
      payload: undefined as any,
      timestamp: Date.now(),
    };

    const response = await registry.handleMessage(msg);
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });

  it('handles MessageType.EXPORT_RESULT with invalid format fallback safely', async () => {
    const msg = {
      id: 'msg_102',
      type: MessageType.EXPORT_RESULT,
      payload: { format: 'INVALID_FORMAT' as any },
      timestamp: Date.now(),
    };

    const response = await registry.handleMessage(msg);
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  });
});
