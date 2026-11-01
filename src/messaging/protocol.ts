import {
  MessageType,
  TypedMessage,
  ExtensionResponse,
  MessagePayloadMap,
  MessageResponseMap,
} from '../types/index.ts';

/**
 * Type guard validating if an arbitrary payload is a valid extension message.
 */
export function isExtensionMessage(msg: unknown): msg is TypedMessage {
  if (typeof msg !== 'object' || msg === null) return false;

  const candidate = msg as Record<string, unknown>;
  const isValidType =
    typeof candidate.type === 'string' &&
    Object.values(MessageType).includes(candidate.type as MessageType);

  const isValidId = typeof candidate.id === 'string' && candidate.id.length > 0;
  const isValidTimestamp = typeof candidate.timestamp === 'number';
  const hasPayload = 'payload' in candidate && candidate.payload !== undefined;

  return isValidType && isValidId && isValidTimestamp && hasPayload;
}

/**
 * Factory helper for creating typed extension messages.
 */
export function createMessage<T extends MessageType>(
  type: T,
  payload: MessagePayloadMap[T]
): TypedMessage<T> {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    payload,
    timestamp: Date.now(),
  };
}

/**
 * Factory helper for creating extension responses.
 */
export function createResponse<T extends MessageType>(
  type: T,
  success: boolean,
  data?: MessageResponseMap[T],
  error?: string
): ExtensionResponse<MessageResponseMap[T]> {
  return {
    success,
    type,
    data,
    error,
    timestamp: Date.now(),
  };
}

/**
 * Strongly-typed handler registry for routing messages.
 */
export type HandlerFunction<T extends MessageType> = (
  payload: MessagePayloadMap[T],
  sender?: chrome.runtime.MessageSender
) => Promise<MessageResponseMap[T]> | MessageResponseMap[T];

export class MessageHandlerRegistry {
  private handlers = new Map<MessageType, HandlerFunction<any>>();

  public register<T extends MessageType>(
    type: T,
    handler: HandlerFunction<T>
  ): void {
    this.handlers.set(type, handler);
  }

  public async handleMessage(
    message: unknown,
    sender?: chrome.runtime.MessageSender
  ): Promise<ExtensionResponse> {
    if (!isExtensionMessage(message)) {
      return {
        success: false,
        type: MessageType.ANALYZE_PAGE,
        error: 'Invalid message structure or unknown MessageType',
        timestamp: Date.now(),
      };
    }

    const handler = this.handlers.get(message.type);
    if (!handler) {
      return createResponse(
        message.type,
        false,
        undefined,
        `No handler registered for message type: ${message.type}`
      );
    }

    try {
      const result = await handler(message.payload, sender);
      return createResponse(message.type, true, result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown execution error';
      return createResponse(message.type, false, undefined, errorMessage);
    }
  }
}
