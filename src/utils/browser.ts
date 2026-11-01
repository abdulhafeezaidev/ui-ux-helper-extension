import { TypedMessage, ExtensionResponse } from '../types/index.ts';
import { Logger } from './logger.ts';

const logger = new Logger('BrowserUtils');

/**
 * Get active tab in current window.
 */
export async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    logger.warn('chrome.tabs API not available in current context');
    return undefined;
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

/**
 * Send typed message to active tab content script safely.
 * Auto-injects content script if tab was opened before extension installation.
 */
export async function sendTabMessage<T extends ExtensionResponse>(
  message: TypedMessage
): Promise<T> {
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    throw new Error('No active tab found');
  }

  const sendMessagePromise = (tabId: number): Promise<T> => {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response as T);
        }
      });
    });
  };

  try {
    return await sendMessagePromise(tab.id);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('Could not establish connection') || errorMsg.includes('Receiving end does not exist')) {
      logger.info('Content script not detected. Injecting content.js into tab', tab.id);
      if (chrome.scripting) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js'],
        });
        // Small delay for listener registration
        await new Promise((r) => setTimeout(r, 100));
        return await sendMessagePromise(tab.id);
      }
    }
    throw err;
  }
}
