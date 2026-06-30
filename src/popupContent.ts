import { SUPPORTED_LANGUAGES } from './translationService';

export function getPopupContent(
  originalText: string,
  translatedText: string,
  detectedLang: string | undefined,
  sourceLang: string,
  targetLang: string,
  loading: boolean = false
): string {
  const srcName =
    SUPPORTED_LANGUAGES.find((l) => l.code === (detectedLang ?? sourceLang))?.name ??
    sourceLang.toUpperCase();
  const detectedLabel = detectedLang ? `Detetado: ${srcName}` : srcName;

  const tgtOptions = SUPPORTED_LANGUAGES.filter((l) => l.code !== 'auto')
    .map(
      (l) =>
        `<option value="${l.code}" ${l.code === targetLang ? 'selected' : ''}>${l.name}</option>`
    )
    .join('');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>LanguageAI</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--vscode-font-family);
    font-size: 13px;
    background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
    color: var(--vscode-editor-foreground);
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--vscode-sideBar-background);
    border-bottom: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
    gap: 8px;
    flex-wrap: wrap;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }
  .globe { font-size: 15px; }

  .lang-flow {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
  }
  .lang-tag {
    padding: 2px 8px;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    border-radius: 10px;
    font-weight: 600;
    font-size: 10px;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }
  .arrow { color: var(--vscode-descriptionForeground); font-size: 12px; }

  select.tgt-select {
    padding: 2px 6px;
    background: var(--vscode-dropdown-background);
    color: var(--vscode-dropdown-foreground);
    border: 1px solid var(--vscode-dropdown-border, var(--vscode-panel-border));
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    outline: none;
    max-width: 140px;
  }
  select.tgt-select:focus { border-color: var(--vscode-focusBorder); }

  /* ── Side-by-side panels ── */
  .panels {
    display: flex;
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }

  .panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }
  .panel + .panel {
    border-left: 2px solid var(--vscode-panel-border);
  }

  .panel-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--vscode-descriptionForeground);
    padding: 5px 10px 4px;
    flex-shrink: 0;
    background: var(--vscode-sideBar-background);
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .panel-text {
    flex: 1;
    overflow-y: auto;
    padding: 10px 12px;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    user-select: text;
  }
  .panel-text.source-text {
    color: var(--vscode-descriptionForeground);
  }
  .panel-text.translated {
    color: var(--vscode-editor-foreground);
  }

  /* ── Loading ── */
  .loading-wrap {
    display: ${loading ? 'flex' : 'none'};
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    font-style: italic;
  }
  .spinner {
    width: 14px; height: 14px;
    border: 2px solid var(--vscode-panel-border);
    border-top-color: var(--vscode-focusBorder);
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Error ── */
  .error-bar {
    display: none;
    padding: 6px 12px;
    font-size: 11px;
    background: var(--vscode-inputValidation-errorBackground);
    color: var(--vscode-inputValidation-errorForeground);
    border-top: 1px solid var(--vscode-inputValidation-errorBorder);
    flex-shrink: 0;
  }
  .error-bar.on { display: block; }

  /* ── Footer ── */
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 10px;
    background: var(--vscode-sideBar-background);
    border-top: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
    gap: 6px;
  }
  .footer-left { display: flex; gap: 4px; }
  .footer-right { display: flex; gap: 6px; }

  .btn {
    padding: 4px 14px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.12s;
    white-space: nowrap;
  }
  .btn-primary {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }
  .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-secondary {
    background: transparent;
    color: var(--vscode-editor-foreground);
    border-color: var(--vscode-panel-border);
  }
  .btn-secondary:hover {
    background: var(--vscode-input-background);
    border-color: var(--vscode-focusBorder);
  }

  .icon-btn {
    background: none;
    border: 1px solid transparent;
    color: var(--vscode-descriptionForeground);
    border-radius: 4px;
    width: 26px; height: 26px;
    cursor: pointer;
    font-size: 13px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.12s;
  }
  .icon-btn:hover {
    background: var(--vscode-input-background);
    border-color: var(--vscode-panel-border);
    color: var(--vscode-editor-foreground);
  }
  .icon-btn:active { transform: scale(0.9); }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <span class="globe">🌐</span> LanguageAI
  </div>
  <div class="lang-flow">
    <span class="lang-tag" id="srcTag">${detectedLabel}</span>
    <span class="arrow">→</span>
    <select class="tgt-select" id="tgtSelect">${tgtOptions}</select>
  </div>
</div>

<div class="panels">
  <!-- Source -->
  <div class="panel">
    <div class="panel-label">Original</div>
    <div class="panel-text source-text">${escapeHtml(originalText)}</div>
  </div>

  <!-- Translation -->
  <div class="panel">
    <div class="panel-label">Tradução</div>
    <div class="loading-wrap" id="loadingWrap">
      <div class="spinner"></div>A traduzir…
    </div>
    <div class="panel-text translated" id="outputText" style="${loading ? 'display:none' : ''}">${escapeHtml(translatedText)}</div>
    <div class="error-bar" id="errorBar"></div>
  </div>
</div>

<div class="footer">
  <div class="footer-left">
    <button class="icon-btn" id="copyBtn" title="Copiar tradução">⎘</button>
  </div>
  <div class="footer-right">
    <button class="btn btn-secondary" id="openPanelBtn">Abrir Painel</button>
    <button class="btn btn-primary" id="replaceBtn" ${loading ? 'disabled' : ''}>Substituir</button>
  </div>
</div>

<script>
  const vscode = acquireVsCodeApi();

  const tgtSelect    = document.getElementById('tgtSelect');
  const outputText   = document.getElementById('outputText');
  const loadingWrap  = document.getElementById('loadingWrap');
  const errorBar     = document.getElementById('errorBar');
  const copyBtn      = document.getElementById('copyBtn');
  const replaceBtn   = document.getElementById('replaceBtn');
  const openPanelBtn = document.getElementById('openPanelBtn');

  let currentTranslation = ${JSON.stringify(translatedText)};
  let isLoading = ${loading};

  tgtSelect.addEventListener('change', () => {
    setLoading(true);
    vscode.postMessage({ command: 'retranslate', targetLang: tgtSelect.value });
  });

  function setLoading(on) {
    isLoading = on;
    loadingWrap.style.display = on ? 'flex' : 'none';
    outputText.style.display  = on ? 'none' : '';
    replaceBtn.disabled = on;
    errorBar.classList.remove('on');
  }

  copyBtn.addEventListener('click', () => {
    if (!currentTranslation) return;
    navigator.clipboard.writeText(currentTranslation).catch(() =>
      vscode.postMessage({ command: 'copy', text: currentTranslation })
    );
    copyBtn.textContent = '✓';
    setTimeout(() => copyBtn.textContent = '⎘', 1500);
  });

  replaceBtn.addEventListener('click', () => {
    if (!currentTranslation || isLoading) return;
    vscode.postMessage({ command: 'replace', text: currentTranslation });
  });

  openPanelBtn.addEventListener('click', () => {
    vscode.postMessage({ command: 'openPanel' });
  });

  window.addEventListener('message', ({ data: msg }) => {
    switch (msg.command) {
      case 'translationResult':
        currentTranslation = msg.text;
        outputText.textContent = msg.text;
        setLoading(false);
        break;
      case 'translationError':
        setLoading(false);
        errorBar.textContent = '⚠ ' + msg.error;
        errorBar.classList.add('on');
        break;
    }
  });
</script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
