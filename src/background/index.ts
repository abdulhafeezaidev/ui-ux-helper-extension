import { Logger } from '../utils/index.ts';

const logger = new Logger('ServiceWorker');

if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener((details) => {
    logger.info(`Extension installed / updated. Reason: ${details.reason}`);
  });
}

logger.info('Background Service Worker initialized.');
