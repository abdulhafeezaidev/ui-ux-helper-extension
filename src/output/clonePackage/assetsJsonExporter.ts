import { AnalyzePageResponseData } from '../../types/index.ts';

export function exportAssetsJson(data: AnalyzePageResponseData): string {
  const elements = data.extractionResult?.elements || [];

  const svgIcons: {
    id: string;
    registryKey?: string;
    elementId: string;
    viewBox?: string;
    width: number;
    height: number;
    svgOuterHtml?: string;
    svgInnerMarkup?: string;
    inferredName?: string;
  }[] = [];

  const images: {
    id: string;
    registryKey?: string;
    elementId: string;
    src: string;
    alt?: string;
    srcset?: string;
    naturalWidth?: number;
    naturalHeight?: number;
    renderedWidth: number;
    renderedHeight: number;
    aspectRatio: number;
    objectFit: string;
  }[] = [];

  const backgroundGradients: {
    elementId: string;
    backgroundImage: string;
  }[] = [];

  let svgIdx = 1;
  let imgIdx = 1;

  for (const el of elements) {
    if (el.tagName === 'svg' || el.assetProps?.hasSvg) {
      // Guess icon name from aria-label, class, or id
      let inferredName = `icon_${svgIdx}`;
      const nameCandidate = el.interactive?.ariaLabel || el.className || el.id;
      if (nameCandidate) {
        const clean = nameCandidate.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (clean.length > 2) inferredName = clean;
      }

      svgIcons.push({
        id: `svg_${svgIdx++}`,
        registryKey: 'asset.icon.standard',
        elementId: el.id,
        viewBox: el.assetProps?.svgViewBox,
        width: el.boundingRect.width,
        height: el.boundingRect.height,
        svgOuterHtml: el.assetProps?.svgOuterHtml,
        svgInnerMarkup: el.assetProps?.svgInnerMarkup,
        inferredName,
      });
    }

    if (el.tagName === 'img' && el.assetProps?.currentSrc) {
      const w = el.boundingRect.width || el.assetProps.naturalWidth || 100;
      const h = el.boundingRect.height || el.assetProps.naturalHeight || 100;
      images.push({
        id: `img_${imgIdx++}`,
        registryKey: 'asset.productCard.media',
        elementId: el.id,
        src: el.assetProps.currentSrc,
        alt: el.assetProps.alt,
        srcset: el.assetProps.srcset,
        naturalWidth: el.assetProps.naturalWidth,
        naturalHeight: el.assetProps.naturalHeight,
        renderedWidth: el.boundingRect.width,
        renderedHeight: el.boundingRect.height,
        aspectRatio: h > 0 ? Number((w / h).toFixed(2)) : 1,
        objectFit: el.assetProps.objectFit || 'cover',
      });
    }

    if (el.surface?.backgroundImage && el.surface.backgroundImage.includes('gradient')) {
      backgroundGradients.push({
        elementId: el.id,
        backgroundImage: el.surface.backgroundImage,
      });
    }
  }

  const fontFamilies = (data.typographySystem?.fontFamilies || []).map((f) => ({
    name: f.name,
    primary: f.primary,
    fallbacks: f.fallbacks,
    usageCount: f.usageCount,
  }));

  const payload = {
    $schema: 'https://ui-ux-helper.internal/schemas/assets-v1.json',
    version: '1.0.0',
    stats: {
      totalSvgIcons: svgIcons.length,
      totalImages: images.length,
      totalGradients: backgroundGradients.length,
      fontFamilyCount: fontFamilies.length,
    },
    svgIcons,
    images,
    backgroundGradients,
    fontFamilies,
    metadata: {
      generatedAt: new Date().toISOString(),
    },
  };

  return JSON.stringify(payload, null, 2);
}
