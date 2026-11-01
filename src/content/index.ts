import { MessageType, ExportFormat } from '../types/index.ts';
import { MessageHandlerRegistry } from '../messaging/index.ts';
import { DomExtractor } from '../extraction/index.ts';
import {
  ColorNormalizer,
  TypographyNormalizer,
  ShapeNormalizer,
  LayoutNormalizer,
  ComponentNormalizer,
} from '../normalization/index.ts';
import { ArtifactExporter } from '../output/index.ts';
import { Logger } from '../utils/index.ts';

const logger = new Logger('ContentScript');
const registry = new MessageHandlerRegistry();
const domExtractor = new DomExtractor();
const colorNormalizer = new ColorNormalizer();
const typographyNormalizer = new TypographyNormalizer();
const shapeNormalizer = new ShapeNormalizer();
const layoutNormalizer = new LayoutNormalizer();
const componentNormalizer = new ComponentNormalizer();
const artifactExporter = new ArtifactExporter();

// Register message handlers for prepared IPC protocol
registry.register(MessageType.ANALYZE_PAGE, (payload = {}) => {
  logger.info('Received ANALYZE_PAGE message:', payload);
  try {
    const rootEl = document.body || document.documentElement;
    if (!rootEl) {
      return {
        status: 'completed',
        pageUrl: window.location.href || '',
        title: document.title || '',
        timestamp: Date.now(),
        summary: {
          totalElements: 0,
          visibleElements: 0,
          normalizedColorsCount: 0,
          normalizedTypographyTokensCount: 0,
          radiusTokensCount: 0,
          shadowTokensCount: 0,
          containerCount: 0,
          sectionCount: 0,
          componentCount: 0,
          familyCount: 0,
        },
      };
    }

    const rawResult = domExtractor.extract(rootEl, {
      includeHidden: payload?.includeHidden ?? true,
    });

    const colorSystem = colorNormalizer.normalize(rawResult);
    const typographySystem = typographyNormalizer.normalize(rawResult);
    const shapeSystem = shapeNormalizer.normalize(rawResult);
    const layoutSystem = layoutNormalizer.normalize(rawResult);
    const componentSystem = componentNormalizer.normalize(
      rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem
    );

    return {
      status: 'completed',
      pageUrl: window.location.href || '',
      title: document.title || '',
      timestamp: Date.now(),
      extractionResult: rawResult,
      colorSystem,
      typographySystem,
      shapeSystem,
      layoutSystem,
      componentSystem,
      summary: {
        totalElements: rawResult.totalExtracted,
        visibleElements: rawResult.visibleCount,
        normalizedColorsCount: colorSystem.stats.normalizedColorCount,
        normalizedTypographyTokensCount: typographySystem.stats.uniqueTokenCount,
        radiusTokensCount: shapeSystem.stats.uniqueRadiusCount,
        shadowTokensCount: shapeSystem.stats.uniqueShadowCount,
        containerCount: layoutSystem.stats.containerCount,
        sectionCount: layoutSystem.stats.sectionCount,
        componentCount: componentSystem.stats.totalComponents,
        familyCount: componentSystem.stats.familyCount,
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Extraction failure';
    logger.error('Error executing ANALYZE_PAGE extraction:', errorMsg);
    return {
      status: 'initialized',
      pageUrl: window.location.href || '',
      title: document.title || '',
      timestamp: Date.now(),
      error: errorMsg,
    } as any;
  }
});

registry.register(MessageType.SELECT_ELEMENT, (payload = {}) => {
  logger.info('Received SELECT_ELEMENT message:', payload);
  return {
    selected: true,
    selector: payload?.selector || 'body',
    tagName: 'BODY',
  };
});

registry.register(MessageType.ANALYZE_ELEMENT, (payload = {}) => {
  logger.info('Received ANALYZE_ELEMENT message:', payload);
  let targetEl: Element | null = null;
  if (payload?.selector) {
    targetEl = document.querySelector(payload.selector);
  }
  if (!targetEl) {
    targetEl = document.body || document.documentElement;
  }

  const inspectedNode = domExtractor.inspectElement(targetEl, payload?.elementId || 'el_target');

  return {
    elementId: inspectedNode.id,
    analyzed: true,
    elementNode: inspectedNode,
  };
});

registry.register(MessageType.GET_RESULT, (payload = {}) => {
  logger.info('Received GET_RESULT message:', payload);
  return {
    resultId: payload?.resultId || 'default_res',
    status: 'available',
    data: {
      url: window.location.href || '',
      elementsCount: document.querySelectorAll('*').length,
    },
  };
});

registry.register(MessageType.EXPORT_RESULT, (payload = {}) => {
  logger.info('Received EXPORT_RESULT message:', payload);
  const format: ExportFormat = (payload?.format as ExportFormat) || 'json';

  const rootEl = document.body || document.documentElement;
  const rawResult = domExtractor.extract(rootEl);
  const colorSystem = colorNormalizer.normalize(rawResult);
  const typographySystem = typographyNormalizer.normalize(rawResult);
  const shapeSystem = shapeNormalizer.normalize(rawResult);
  const layoutSystem = layoutNormalizer.normalize(rawResult);
  const componentSystem = componentNormalizer.normalize(
    rawResult,
    colorSystem,
    typographySystem,
    shapeSystem,
    layoutSystem
  );

  const fullAnalysisData = {
    status: 'completed' as const,
    pageUrl: window.location.href || '',
    title: document.title || '',
    timestamp: Date.now(),
    extractionResult: rawResult,
    colorSystem,
    typographySystem,
    shapeSystem,
    layoutSystem,
    componentSystem,
  };

  const exportResult = artifactExporter.export(fullAnalysisData, format);

  const base64Zip = exportResult.base64Zip || exportResult.aiClonePackage?.base64;

  // Try direct in-page download if running in standard web context
  if (base64Zip && (format === 'ai-clone-package' || format.startsWith('package-') || format.includes('design-language') || format === 'all')) {
    try {
      const binaryString = atob(base64Zip);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes.buffer], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      let host = 'website';
      try {
        host = window.location.hostname ? window.location.hostname.replace(/[^a-zA-Z0-9.-]/g, '_') : 'website';
      } catch {
        host = 'website';
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const prefix = format.includes('design-language') ? 'Design-Language-Package' : 'AI-Clone-Package';
      const filename = `${prefix}-${host}-${timestamp}.zip`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (downloadErr) {
      logger.warn('Direct in-page download encountered error (popup fallback will handle):', downloadErr);
    }
  }

  return {
    exportedData: exportResult.exportedData,
    format: exportResult.format,
    base64Zip,
    aiClonePackage: exportResult.aiClonePackage,
    artifacts: exportResult.artifacts,
  };
});

// Attach Chrome runtime listener if chrome.runtime API is available
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logger.debug('Chrome runtime message received:', message);
    registry
      .handleMessage(message, sender)
      .then((response) => {
        sendResponse(response);
      })
      .catch((err) => {
        sendResponse({
          success: false,
          type: message?.type || 'UNKNOWN',
          error: err instanceof Error ? err.message : 'Internal IPC processing error',
          timestamp: Date.now(),
        });
      });
    return true; // Keep response channel open for async handler
  });
  logger.info('Content script IPC handlers successfully initialized.');
}

export {
  registry,
  domExtractor,
  colorNormalizer,
  typographyNormalizer,
  shapeNormalizer,
  layoutNormalizer,
  componentNormalizer,
  artifactExporter,
};
