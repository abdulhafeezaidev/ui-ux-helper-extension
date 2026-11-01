import { describe, it, expect, vi } from 'vitest';
import {
  MessageType,
  isExtensionMessage,
  createMessage,
  createResponse,
  MessageHandlerRegistry,
} from '../src/index.ts';

describe('Messaging Protocol & Router', () => {
  describe('isExtensionMessage Guard', () => {
    it('returns true for valid extension messages', () => {
      const validMsg = createMessage(MessageType.ANALYZE_PAGE, { includeHidden: true });
      expect(isExtensionMessage(validMsg)).toBe(true);
    });

    it('returns false for null, primitive, or invalid object inputs', () => {
      expect(isExtensionMessage(null)).toBe(false);
      expect(isExtensionMessage('string')).toBe(false);
      expect(isExtensionMessage(123)).toBe(false);
      expect(isExtensionMessage({})).toBe(false);
    });

    it('returns false when required message fields are missing or wrong types', () => {
      expect(isExtensionMessage({ type: 'ANALYZE_PAGE' })).toBe(false);
      expect(isExtensionMessage({ type: 'UNKNOWN_TYPE', id: '1', timestamp: 123, payload: {} })).toBe(false);
      expect(isExtensionMessage({ type: 'ANALYZE_PAGE', id: 123, timestamp: 123, payload: {} })).toBe(false);
      expect(isExtensionMessage({ type: 'ANALYZE_PAGE', id: '1', timestamp: 'not-a-number', payload: {} })).toBe(false);
    });
  });

  describe('createMessage & createResponse Factories', () => {
    it('creates properly structured typed messages for all 5 message types', () => {
      const msgTypes: MessageType[] = [
        MessageType.ANALYZE_PAGE,
        MessageType.SELECT_ELEMENT,
        MessageType.ANALYZE_ELEMENT,
        MessageType.GET_RESULT,
        MessageType.EXPORT_RESULT,
      ];

      for (const type of msgTypes) {
        const msg = createMessage(type, {});
        expect(msg.type).toBe(type);
        expect(msg.id).toMatch(/^msg_/);
        expect(typeof msg.timestamp).toBe('number');
        expect(msg.payload).toEqual({});
      }
    });

    it('creates properly structured extension response', () => {
      const resp = createResponse(MessageType.ANALYZE_PAGE, true, {
        status: 'initialized',
        pageUrl: 'https://example.com',
        title: 'Example',
        timestamp: 1000,
      });

      expect(resp.success).toBe(true);
      expect(resp.type).toBe(MessageType.ANALYZE_PAGE);
      expect(resp.data?.pageUrl).toBe('https://example.com');
      expect(resp.error).toBeUndefined();
    });
  });

  describe('MessageHandlerRegistry Router', () => {
    it('executes registered handler and returns success response', async () => {
      const registry = new MessageHandlerRegistry();
      const mockHandler = vi.fn().mockReturnValue({
        selected: true,
        selector: '.test-class',
      });

      registry.register(MessageType.SELECT_ELEMENT, mockHandler);

      const msg = createMessage(MessageType.SELECT_ELEMENT, { selector: '.test-class' });
      const response = await registry.handleMessage(msg);

      expect(mockHandler).toHaveBeenCalledWith({ selector: '.test-class' }, undefined);
      expect(response.success).toBe(true);
      expect(response.type).toBe(MessageType.SELECT_ELEMENT);
      expect(response.data).toEqual({ selected: true, selector: '.test-class' });
    });

    it('returns failure response when message type has no registered handler', async () => {
      const registry = new MessageHandlerRegistry();
      const msg = createMessage(MessageType.GET_RESULT, { resultId: 'res_1' });

      const response = await registry.handleMessage(msg);

      expect(response.success).toBe(false);
      expect(response.error).toContain('No handler registered for message type: GET_RESULT');
    });

    it('returns failure response when handler throws an error', async () => {
      const registry = new MessageHandlerRegistry();
      registry.register(MessageType.ANALYZE_ELEMENT, () => {
        throw new Error('DOM element detached');
      });

      const msg = createMessage(MessageType.ANALYZE_ELEMENT, { elementId: 'el_1' });
      const response = await registry.handleMessage(msg);

      expect(response.success).toBe(false);
      expect(response.error).toBe('DOM element detached');
    });

    it('returns failure response for invalid message input', async () => {
      const registry = new MessageHandlerRegistry();
      const response = await registry.handleMessage({ invalid: true });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid message structure or unknown MessageType');
    });
  });
});
