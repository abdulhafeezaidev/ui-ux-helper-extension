import {
  MessageType,
  ExtensionResponse,
  AnalyzePageResponseData,
  ExportResultResponseData,
  ExportFormat,
} from '../types/index.ts';
import { createMessage } from '../messaging/index.ts';
import { sendTabMessage, getActiveTab, Logger } from '../utils/index.ts';
import { computeCloneConfidenceScore, CloneConfidenceScore } from '../normalization/fidelity/cloneConfidenceCalculator.ts';

const logger = new Logger('PopupUI');

export type PopupUIState = 'idle' | 'analyzing' | 'success' | 'error' | 'stale';

document.addEventListener('DOMContentLoaded', async () => {
  let currentState: PopupUIState = 'idle';
  let currentAnalysisData: AnalyzePageResponseData | null = null;
  let lastAnalyzedUrl: string | null = null;

  // Header & Status Elements
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const btnAnalyzePage = document.getElementById('btnAnalyzePage') as HTMLButtonElement;
  const btnReanalyze = document.getElementById('btnReanalyze') as HTMLButtonElement;
  const pageTitleEl = document.getElementById('pageTitle');
  const pageUrlEl = document.getElementById('pageUrl');
  const viewportBadge = document.getElementById('viewportBadge');
  const elementCountBadge = document.getElementById('elementCountBadge');
  const toastEl = document.getElementById('toast');

  // Clone Readiness Dashboard Elements
  const readinessScoreVal = document.getElementById('readinessScoreVal');
  const readinessStars = document.getElementById('readinessStars');
  const readinessVerdictBadge = document.getElementById('readinessVerdictBadge');
  const btnToggleDiagnostics = document.getElementById('btnToggleDiagnostics');
  const diagnosticsBreakdown = document.getElementById('diagnosticsBreakdown');
  const diagArrow = document.getElementById('diagArrow');

  // Diagnostics Bars
  const diagBarDesign = document.getElementById('diagBarDesign');
  const diagValDesign = document.getElementById('diagValDesign');
  const diagBarComponents = document.getElementById('diagBarComponents');
  const diagValComponents = document.getElementById('diagValComponents');
  const diagBarLayout = document.getElementById('diagBarLayout');
  const diagValLayout = document.getElementById('diagValLayout');
  const diagBarResponsive = document.getElementById('diagBarResponsive');
  const diagValResponsive = document.getElementById('diagValResponsive');
  const diagBarAnimations = document.getElementById('diagBarAnimations');
  const diagValAnimations = document.getElementById('diagValAnimations');
  const diagBarAccessibility = document.getElementById('diagBarAccessibility');
  const diagValAccessibility = document.getElementById('diagValAccessibility');
  const diagBarAssets = document.getElementById('diagBarAssets');
  const diagValAssets = document.getElementById('diagValAssets');
  const diagBarOverall = document.getElementById('diagBarOverall');
  const diagValOverall = document.getElementById('diagValOverall');

  // Primary & Sub-Card Export Actions
  const btnGenerateAiClone = document.getElementById('btnGenerateAiClone');
  const btnExtractDesignLanguage = document.getElementById('btnExtractDesignLanguage');
  const btnExportLightweightBundle = document.getElementById('btnExportLightweightBundle');

  // Advanced & Developer Accordion Elements
  const btnToggleAdvanced = document.getElementById('btnToggleAdvanced');
  const advancedSection = document.getElementById('advancedSection');
  const advancedArrow = document.getElementById('advancedArrow');
  const btnCopyAdsContext = document.getElementById('btnCopyAdsContext');
  const btnExportAdsJson = document.getElementById('btnExportAdsJson');
  const btnExportAdsAll = document.getElementById('btnExportAdsAll');

  const btnToggleDevTools = document.getElementById('btnToggleDevTools');
  const devToolsSection = document.getElementById('devToolsSection');
  const devToolsArrow = document.getElementById('devToolsArrow');
  const btnExportArtifact = document.getElementById('btnExportArtifact');
  const exportFormatSelect = document.getElementById('exportFormatSelect') as HTMLSelectElement;

  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // Display initial active tab details
  try {
    const activeTab = await getActiveTab();
    if (activeTab) {
      if (pageTitleEl && activeTab.title) pageTitleEl.textContent = activeTab.title;
      if (pageUrlEl && activeTab.url) pageUrlEl.textContent = activeTab.url;
    }
  } catch (err) {
    logger.debug('Active tab query error:', err);
  }

  function showToast(message: string): void {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 2500);
  }

  function setUIState(state: PopupUIState, errorMsg?: string): void {
    currentState = state;
    if (statusBadge && statusText) {
      statusBadge.className = `status-badge status-${currentState}`;
      statusText.textContent = currentState.charAt(0).toUpperCase() + currentState.slice(1);
    }

    if (btnAnalyzePage) {
      btnAnalyzePage.disabled = currentState === 'analyzing';
    }
    if (btnReanalyze) {
      btnReanalyze.disabled = currentState !== 'success' && currentState !== 'stale';
    }

    if (currentState === 'error' && errorMsg) {
      showToast(`Error: ${errorMsg}`);
    }
  }

  // Update Clone Readiness Dashboard Metrics
  function updateReadinessDashboard(score: CloneConfidenceScore): void {
    if (readinessScoreVal) readinessScoreVal.textContent = `${Math.round(score.overallScore)}%`;

    if (readinessStars) {
      if (score.overallScore >= 95) readinessStars.textContent = '★★★★★';
      else if (score.overallScore >= 90) readinessStars.textContent = '★★★★☆';
      else if (score.overallScore >= 80) readinessStars.textContent = '★★★☆☆';
      else readinessStars.textContent = '★★☆☆☆';
    }

    if (readinessVerdictBadge) {
      if (score.overallScore >= 95) {
        readinessVerdictBadge.textContent = 'Production Ready';
        readinessVerdictBadge.className = 'readiness-badge badge-production';
      } else {
        readinessVerdictBadge.textContent = 'High Fidelity';
        readinessVerdictBadge.className = 'readiness-badge badge-high';
      }
    }

    // Diagnostics Bars & Numbers
    const setDiag = (barEl: HTMLElement | null, valEl: HTMLElement | null, pct: number) => {
      const clamped = Math.min(100, Math.max(0, Math.round(pct)));
      if (barEl) barEl.style.width = `${clamped}%`;
      if (valEl) valEl.textContent = `${clamped}%`;
    };

    setDiag(diagBarDesign, diagValDesign, score.visualFidelity);
    setDiag(diagBarComponents, diagValComponents, score.componentFidelity);
    setDiag(diagBarLayout, diagValLayout, score.layoutFidelity);
    setDiag(diagBarResponsive, diagValResponsive, Math.max(90, score.layoutFidelity - 2));
    setDiag(diagBarAnimations, diagValAnimations, score.animationFidelity);
    setDiag(diagBarAccessibility, diagValAccessibility, score.accessibilityFidelity);
    setDiag(diagBarAssets, diagValAssets, 100);
    setDiag(diagBarOverall, diagValOverall, score.overallScore);
  }

  // Render Analysis Results into Inspector Panels
  function renderAnalysisData(data: AnalyzePageResponseData): void {
    currentAnalysisData = data;
    lastAnalyzedUrl = data.pageUrl;

    if (pageTitleEl) pageTitleEl.textContent = currentAnalysisData.title || 'Untitled Page';
    if (pageUrlEl) pageUrlEl.textContent = lastAnalyzedUrl || 'about:blank';
    if (elementCountBadge) elementCountBadge.textContent = `${data.summary?.totalElements ?? data.extractionResult?.elements?.length ?? 0} elements`;

    const colorSys = data.colorSystem;
    const typoSys = data.typographySystem;
    const shapeSys = data.shapeSystem;
    const layoutSys = data.layoutSystem;
    const compSys = data.componentSystem;

    if (viewportBadge && layoutSys) {
      viewportBadge.textContent = `${layoutSys.viewport.width} × ${layoutSys.viewport.height}`;
    }

    // Calculate & Render Clone Readiness Dashboard
    const score = computeCloneConfidenceScore(data);
    updateReadinessDashboard(score);

    // Render Colors Panel
    const colorGrid = document.getElementById('colorSwatchesGrid');
    if (colorGrid && colorSys) {
      colorGrid.innerHTML = '';
      colorSys.tokens.slice(0, 10).forEach((t) => {
        const item = document.createElement('div');
        item.className = 'swatch-item';
        item.innerHTML = `
          <div class="swatch-box" style="background-color: ${t.color.hex};"></div>
          <div class="swatch-details">
            <span class="swatch-hex">${t.color.hex}</span>
            <span class="swatch-meta">Role: ${t.usages.join(', ') || 'palette'} · Used ${t.frequency}x</span>
          </div>
          <span class="badge badge-observed">Observed</span>
        `;
        colorGrid.appendChild(item);
      });
    }

    // Render Typography Panel
    const typoList = document.getElementById('typographyScaleList');
    if (typoList && typoSys) {
      typoList.innerHTML = '';
      typoSys.tokens.slice(0, 8).forEach((t) => {
        const item = document.createElement('div');
        item.className = 'typo-item';
        item.innerHTML = `
          <div>
            <span class="typo-role">${t.semanticRole || 'Text'}</span>
            <div style="font-size: 10px; color: var(--text-muted);">${t.primaryFamily}</div>
          </div>
          <span class="typo-spec">${t.fontSizePx}px / ${t.fontWeight} / ${t.lineHeightPx}</span>
        `;
        typoList.appendChild(item);
      });
    }

    // Render Spacing & Shapes Panel
    const spacingRow = document.getElementById('spacingChipsList');
    if (spacingRow && layoutSys) {
      spacingRow.innerHTML = '';
      layoutSys.spacingScale.forEach((s) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = `${s.valuePx}px`;
        spacingRow.appendChild(chip);
      });
    }

    const radiusRow = document.getElementById('radiusChipsList');
    if (radiusRow && shapeSys) {
      radiusRow.innerHTML = '';
      shapeSys.radiusScale.forEach((r) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = `${r.valuePx}px (${r.classification})`;
        radiusRow.appendChild(chip);
      });
    }

    const surfaceCounts = document.getElementById('surfaceCategoryCounts');
    if (surfaceCounts && shapeSys) {
      surfaceCounts.innerHTML = Object.entries(shapeSys.surfaceCounts)
        .filter(([_, count]) => count > 0)
        .map(([cat, count]) => `<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>${cat}</span><span style="font-weight:700;">${count}</span></div>`)
        .join('');
    }

    // Render Layout & Sections Panel
    const sectionsList = document.getElementById('sectionsList');
    if (sectionsList && compSys) {
      sectionsList.innerHTML = '';
      compSys.sections.forEach((sec, idx) => {
        const item = document.createElement('div');
        item.className = 'typo-item';
        item.innerHTML = `
          <div>
            <span class="typo-role">0${idx + 1} ${sec.sectionType}</span>
            <div class="evidence-expandable">${sec.evidence.join('; ')}</div>
          </div>
          <span class="badge badge-inferred">${(sec.confidence * 100).toFixed(0)}%</span>
        `;
        sectionsList.appendChild(item);
      });
    }

    if (layoutSys) {
      const flexEl = document.getElementById('metricFlexCount');
      const gridEl = document.getElementById('metricGridCount');
      if (flexEl) flexEl.textContent = String(layoutSys.stats.flexCount);
      if (gridEl) gridEl.textContent = String(layoutSys.stats.gridCount);
    }

    // Render Components Panel
    const componentsList = document.getElementById('componentsList');
    if (componentsList && compSys) {
      componentsList.innerHTML = '';
      compSys.components.forEach((c) => {
        const item = document.createElement('div');
        item.className = 'typo-item';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'flex-start';
        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; width:100%;">
            <span class="typo-role">${c.type}</span>
            <span class="badge badge-inferred">${(c.confidence * 100).toFixed(0)}%</span>
          </div>
          <div class="evidence-expandable" style="width:100%;">Why? ${c.evidence.join('; ')}</div>
        `;
        componentsList.appendChild(item);
      });
    }
  }

  // Tab Navigation Controller
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabPanels.forEach((p) => p.classList.add('hidden'));

      btn.classList.add('active');
      if (targetTab) {
        document.getElementById(targetTab)?.classList.remove('hidden');
      }
    });
  });

  // Diagnostics Accordion Toggle
  btnToggleDiagnostics?.addEventListener('click', () => {
    const isHidden = diagnosticsBreakdown?.classList.contains('hidden');
    if (isHidden) {
      diagnosticsBreakdown?.classList.remove('hidden');
      if (diagArrow) diagArrow.textContent = '▲';
    } else {
      diagnosticsBreakdown?.classList.add('hidden');
      if (diagArrow) diagArrow.textContent = '▼';
    }
  });

  // Advanced Accordion Toggle
  btnToggleAdvanced?.addEventListener('click', () => {
    const isHidden = advancedSection?.classList.contains('hidden');
    if (isHidden) {
      advancedSection?.classList.remove('hidden');
      if (advancedArrow) advancedArrow.textContent = '▲';
    } else {
      advancedSection?.classList.add('hidden');
      if (advancedArrow) advancedArrow.textContent = '▼';
    }
  });

  // Developer Tools Accordion Toggle
  btnToggleDevTools?.addEventListener('click', () => {
    const isHidden = devToolsSection?.classList.contains('hidden');
    if (isHidden) {
      devToolsSection?.classList.remove('hidden');
      if (devToolsArrow) devToolsArrow.textContent = '▼';
    } else {
      devToolsSection?.classList.add('hidden');
      if (devToolsArrow) devToolsArrow.textContent = '→';
    }
  });

  // Trigger Page Analysis Action
  async function triggerAnalysis(): Promise<void> {
    try {
      setUIState('analyzing');
      const msg = createMessage(MessageType.ANALYZE_PAGE, { includeHidden: true });
      logger.info('Sending ANALYZE_PAGE message:', msg);

      const response = await sendTabMessage<ExtensionResponse>(msg);

      if (response.success && response.data) {
        const pageData = response.data as AnalyzePageResponseData;
        renderAnalysisData(pageData);
        setUIState('success');
      } else {
        setUIState('error', response.error || 'Page analysis failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Analysis error';
      logger.error('Error in triggerAnalysis:', errorMsg);
      setUIState('error', errorMsg);
    }
  }

  // Package Level Selection State
  let selectedPackageLevel: 'fast' | 'standard' | 'full' = 'full';
  const btnLevel1 = document.getElementById('btnLevel1');
  const btnLevel2 = document.getElementById('btnLevel2');
  const btnLevel3 = document.getElementById('btnLevel3');

  function updateLevelSelection(level: 'fast' | 'standard' | 'full'): void {
    selectedPackageLevel = level;
    [btnLevel1, btnLevel2, btnLevel3].forEach((btn) => {
      if (btn) {
        btn.style.background = 'var(--bg-surface, #fff)';
        btn.classList.remove('active');
      }
    });

    if (level === 'fast' && btnLevel1) {
      btnLevel1.style.background = 'var(--bg-surface-active, #f0f0f0)';
      btnLevel1.classList.add('active');
    } else if (level === 'standard' && btnLevel2) {
      btnLevel2.style.background = 'var(--bg-surface-active, #f0f0f0)';
      btnLevel2.classList.add('active');
    } else if (level === 'full' && btnLevel3) {
      btnLevel3.style.background = 'var(--bg-surface-active, #f0f0f0)';
      btnLevel3.classList.add('active');
    }
  }

  btnLevel1?.addEventListener('click', () => updateLevelSelection('fast'));
  btnLevel2?.addEventListener('click', () => updateLevelSelection('standard'));
  btnLevel3?.addEventListener('click', () => updateLevelSelection('full'));

  // Helper to download binary Base64 files in Popup context
  function downloadBase64File(base64: string, filename: string, mimeType = 'application/zip'): void {
    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes.buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);

      if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
        chrome.downloads.download({
          url,
          filename,
          saveAs: false,
        }, () => {
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        });
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (err) {
      logger.error('Error in downloadBase64File:', err);
    }
  }

  // 1-Click Export AI Clone Package (.zip) with Progressive Level Support
  async function triggerAiCloneExport(): Promise<void> {
    try {
      const levelLabel = selectedPackageLevel === 'fast' ? 'Level 1 (Fast <200k)' : selectedPackageLevel === 'standard' ? 'Level 2 (Standard <600k)' : 'Level 3 (Full Clone)';
      showToast(`Generating ${levelLabel} Package...`);

      const format = selectedPackageLevel === 'fast' ? 'package-fast' : selectedPackageLevel === 'standard' ? 'package-standard' : 'package-full';
      const msg = createMessage(MessageType.EXPORT_RESULT, { format });
      const response = await sendTabMessage<ExtensionResponse>(msg);

      if (response && response.success) {
        const exportData = response.data as ExportResultResponseData | undefined;
        const base64 = exportData?.base64Zip || exportData?.aiClonePackage?.base64;
        if (base64) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const filename = `AI-Clone-Package-${selectedPackageLevel}-${timestamp}.zip`;
          downloadBase64File(base64, filename, 'application/zip');
        }
        showToast(`${levelLabel} Package (.zip) downloaded successfully!`);
      } else {
        const errMsg = response?.error || 'AI Clone Package generation failed';
        logger.error('Export error response:', errMsg);
        showToast(`Export failed: ${errMsg}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error('Export exception:', err);
      showToast(`Export error: ${errMsg}`);
    }
  }

  // 1-Click Export Lightweight Bundle
  async function triggerLightweightBundleExport(): Promise<void> {
    try {
      showToast('Generating Lightweight Bundle...');
      const msg = createMessage(MessageType.EXPORT_RESULT, { format: 'ai-lightweight-bundle' });
      const response = await sendTabMessage<ExtensionResponse>(msg);

      if (response.success && response.data) {
        const exportData = response.data as ExportResultResponseData;
        const blob = new Blob([exportData.exportedData], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-lightweight-bundle.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Lightweight Bundle downloaded successfully!');
      } else {
        showToast('Lightweight Bundle export failed');
      }
    } catch (err) {
      showToast('Export exception error');
    }
  }

  // 1-Click Export Design Language Package (.zip)
  async function triggerDesignLanguageExport(): Promise<void> {
    try {
      showToast('Extracting Design Language Package...');
      const msg = createMessage(MessageType.EXPORT_RESULT, { format: 'design-language-package' });
      const response = await sendTabMessage<ExtensionResponse>(msg);

      if (response && response.success) {
        const exportData = response.data as ExportResultResponseData | undefined;
        const base64 = exportData?.base64Zip;
        if (base64) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const filename = `Design-Language-Package-${timestamp}.zip`;
          downloadBase64File(base64, filename, 'application/zip');
        }
        showToast('Design Language Package (.zip) downloaded successfully!');
      } else {
        const errMsg = response?.error || 'Design Language extraction failed';
        logger.error('Export error response:', errMsg);
        showToast(`Export failed: ${errMsg}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error('Export exception:', err);
      showToast(`Export error: ${errMsg}`);
    }
  }

  btnGenerateAiClone?.addEventListener('click', () => triggerAiCloneExport());
  btnExtractDesignLanguage?.addEventListener('click', () => triggerDesignLanguageExport());
  btnExportLightweightBundle?.addEventListener('click', () => triggerLightweightBundleExport());

  // Copy ADS Context to Clipboard Action
  btnCopyAdsContext?.addEventListener('click', async () => {
    try {
      const msg = createMessage(MessageType.EXPORT_RESULT, { format: 'ads-context' });
      const response = await sendTabMessage<ExtensionResponse>(msg);

      if (response.success && response.data) {
        const exportData = response.data as ExportResultResponseData;
        await navigator.clipboard.writeText(exportData.exportedData);
        showToast('Copied ADS Context to clipboard!');
      } else {
        showToast('Failed to generate ADS Context');
      }
    } catch (err) {
      showToast('Clipboard copy error');
    }
  });

  // Export ADS JSON Action
  btnExportAdsJson?.addEventListener('click', async () => {
    try {
      const msg = createMessage(MessageType.EXPORT_RESULT, { format: 'ads-json' });
      const response = await sendTabMessage<ExtensionResponse>(msg);

      if (response.success && response.data) {
        const exportData = response.data as ExportResultResponseData;
        const blob = new Blob([exportData.exportedData], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `ads-specification.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Exported ADS JSON successfully!');
      }
    } catch (err) {
      showToast('Export failed');
    }
  });

  // Export Complete ADS Package Action
  btnExportAdsAll?.addEventListener('click', async () => {
    try {
      const msg = createMessage(MessageType.EXPORT_RESULT, { format: 'ads-all' });
      const response = await sendTabMessage<ExtensionResponse>(msg);

      if (response.success && response.data) {
        const exportData = response.data as ExportResultResponseData;
        const blob = new Blob([exportData.exportedData], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `complete-ads-package.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Exported Complete ADS Package successfully!');
      }
    } catch (err) {
      showToast('Export failed');
    }
  });

  // Developer Tools Export Action
  btnExportArtifact?.addEventListener('click', async () => {
    try {
      const format = (exportFormatSelect?.value as ExportFormat) || 'reconstruction-graph';
      const msg = createMessage(MessageType.EXPORT_RESULT, { format });
      const response = await sendTabMessage<ExtensionResponse>(msg);

      if (response.success && response.data) {
        const exportData = response.data as ExportResultResponseData;
        const ext = format.includes('json') ? 'json' : format.includes('md') ? 'md' : format.includes('css') ? 'css' : format.includes('tailwind') ? 'js' : 'txt';
        const blob = new Blob([exportData.exportedData], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `artifact-${format}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${format} successfully!`);
      } else {
        showToast('Export failed');
      }
    } catch (err) {
      showToast('Export execution error');
    }
  });

  // Element Picker Trigger Action
  document.getElementById('btnSelectElement')?.addEventListener('click', async () => {
    try {
      const msg = createMessage(MessageType.SELECT_ELEMENT, { mode: 'click' });
      const response = await sendTabMessage<ExtensionResponse>(msg);
      if (response.success) {
        showToast('Click any element on the webpage to inspect');
      }
    } catch (err) {
      showToast('Select element error');
    }
  });

  // Button Listeners
  btnAnalyzePage?.addEventListener('click', () => triggerAnalysis());
  btnReanalyze?.addEventListener('click', () => triggerAnalysis());
});
