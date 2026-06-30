import * as vscode from 'vscode';
import { SUPPORTED_LANGUAGES } from './translationService';

export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  initialText: string = '',
  sourceLang: string = 'auto',
  targetLang: string = 'pt'
): string {
  const languageOptions = SUPPORTED_LANGUAGES.map(
    (lang) =>
      `<option value="${lang.code}" ${lang.code === sourceLang ? 'selected' : ''}>${lang.name}</option>`
  ).join('\n');

  const targetLanguageOptions = SUPPORTED_LANGUAGES.filter((l) => l.code !== 'auto')
    .map(
      (lang) =>
        `<option value="${lang.code}" ${lang.code === targetLang ? 'selected' : ''}>${lang.name}</option>`
    )
    .join('\n');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LanguageAI</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --border: var(--vscode-panel-border);
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground);
      --input-border: var(--vscode-input-border);
      --btn-bg: var(--vscode-button-background);
      --btn-fg: var(--vscode-button-foreground);
      --btn-hover: var(--vscode-button-hoverBackground);
      --secondary-bg: var(--vscode-sideBar-background);
      --accent: var(--vscode-focusBorder);
      --select-bg: var(--vscode-dropdown-background);
      --select-fg: var(--vscode-dropdown-foreground);
      --select-border: var(--vscode-dropdown-border);
      --badge-bg: var(--vscode-badge-background);
      --badge-fg: var(--vscode-badge-foreground);
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      background: var(--bg);
      color: var(--fg);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--secondary-bg);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .header-icon { font-size: 18px; }
    .header h1 {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .header-badge {
      margin-left: auto;
      font-size: 10px;
      padding: 2px 7px;
      background: var(--badge-bg);
      color: var(--badge-fg);
      border-radius: 10px;
      font-weight: 600;
    }

    /* ── Lang bar ── */
    .lang-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: var(--secondary-bg);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    select {
      flex: 1;
      padding: 5px 8px;
      background: var(--select-bg);
      color: var(--select-fg);
      border: 1px solid var(--select-border, var(--border));
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      outline: none;
    }
    select:focus { border-color: var(--accent); }

    .swap-btn {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--fg);
      border-radius: 4px;
      width: 28px;
      height: 28px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .swap-btn:hover { background: var(--btn-bg); color: var(--btn-fg); }

    /* ── Panels ── */
    .panels {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }

    .panel {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      position: relative;
    }
    .panel + .panel { border-top: 1px solid var(--border); }

    .panel-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--vscode-descriptionForeground);
      padding: 6px 16px 4px;
      flex-shrink: 0;
    }

    textarea {
      flex: 1;
      width: 100%;
      padding: 8px 16px;
      background: transparent;
      color: var(--input-fg);
      border: none;
      resize: none;
      font-family: var(--vscode-editor-font-family, 'Consolas', monospace);
      font-size: 13px;
      line-height: 1.6;
      outline: none;
    }
    textarea::placeholder { color: var(--vscode-input-placeholderForeground); }

    .panel-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 16px;
      flex-shrink: 0;
      gap: 8px;
    }

    .char-count {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .panel-actions { display: flex; gap: 6px; }

    .icon-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--vscode-descriptionForeground);
      border-radius: 4px;
      width: 26px;
      height: 26px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      transition: all 0.15s;
    }
    .icon-btn:hover {
      background: var(--input-bg);
      border-color: var(--border);
      color: var(--fg);
    }
    .icon-btn:active { transform: scale(0.92); }

    .translate-btn {
      padding: 5px 16px;
      background: var(--btn-bg);
      color: var(--btn-fg);
      border: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      letter-spacing: 0.2px;
    }
    .translate-btn:hover { background: var(--btn-hover); }
    .translate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Output panel extras ── */
    .output-text {
      flex: 1;
      padding: 8px 16px;
      font-family: var(--vscode-editor-font-family, 'Consolas', monospace);
      font-size: 13px;
      line-height: 1.6;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .output-placeholder {
      color: var(--vscode-input-placeholderForeground);
      font-style: italic;
    }

    /* ── Detected badge ── */
    .detected-badge {
      display: none;
      font-size: 10px;
      padding: 2px 8px;
      background: var(--badge-bg);
      color: var(--badge-fg);
      border-radius: 10px;
      font-weight: 600;
    }
    .detected-badge.visible { display: inline-block; }

    /* ── Loading ── */
    .spinner {
      display: none;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: var(--btn-fg);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin-right: 6px;
    }
    .spinner.visible { display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Error ── */
    .error-bar {
      display: none;
      padding: 8px 16px;
      font-size: 12px;
      background: var(--vscode-inputValidation-errorBackground);
      color: var(--vscode-inputValidation-errorForeground);
      border-top: 1px solid var(--vscode-inputValidation-errorBorder);
      flex-shrink: 0;
    }
    .error-bar.visible { display: block; }

    /* ── Auto-translate indicator ── */
    .auto-indicator {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .auto-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--vscode-descriptionForeground);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
  </style>
</head>
<body>

  <div class="header">
    <span class="header-icon">🌐</span>
    <h1>LanguageAI</h1>
    <span class="header-badge" id="providerBadge">MyMemory</span>
  </div>

  <div class="lang-bar">
    <select id="sourceLang" title="Source language">
      ${languageOptions}
    </select>
    <button class="swap-btn" id="swapBtn" title="Swap languages">⇄</button>
    <select id="targetLang" title="Target language">
      ${targetLanguageOptions}
    </select>
  </div>

  <div class="panels">
    <!-- Input -->
    <div class="panel">
      <div class="panel-label">Source</div>
      <textarea
        id="inputText"
        placeholder="Type or paste text to translate…"
        spellcheck="false"
      >${initialText}</textarea>
      <div class="panel-footer">
        <span class="char-count" id="charCount">0 / 5000</span>
        <div class="panel-actions">
          <button class="icon-btn" id="clearBtn" title="Clear">✕</button>
          <button class="translate-btn" id="translateBtn">
            <span class="spinner" id="spinner"></span>Translate
          </button>
        </div>
      </div>
    </div>

    <!-- Output -->
    <div class="panel">
      <div class="panel-label">
        Translation
        <span class="detected-badge" id="detectedBadge"></span>
      </div>
      <div class="output-text" id="outputText">
        <span class="output-placeholder">Translation will appear here…</span>
      </div>
      <div class="error-bar" id="errorBar"></div>
      <div class="panel-footer">
        <div class="auto-indicator" id="autoIndicator" style="display:none">
          <div class="auto-dot"></div> Auto-translating…
        </div>
        <div style="flex:1"></div>
        <div class="panel-actions">
          <button class="icon-btn" id="copyBtn" title="Copy translation">⎘</button>
          <button class="icon-btn" id="insertBtn" title="Insert into editor">↩</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const inputText   = document.getElementById('inputText');
    const outputText  = document.getElementById('outputText');
    const sourceLang  = document.getElementById('sourceLang');
    const targetLang  = document.getElementById('targetLang');
    const translateBtn= document.getElementById('translateBtn');
    const clearBtn    = document.getElementById('clearBtn');
    const copyBtn     = document.getElementById('copyBtn');
    const insertBtn   = document.getElementById('insertBtn');
    const swapBtn     = document.getElementById('swapBtn');
    const spinner     = document.getElementById('spinner');
    const charCount   = document.getElementById('charCount');
    const detectedBadge = document.getElementById('detectedBadge');
    const errorBar    = document.getElementById('errorBar');
    const autoIndicator = document.getElementById('autoIndicator');
    const providerBadge = document.getElementById('providerBadge');

    let translatedText = '';
    let autoTimer = null;

    // ── Char counter ──
    function updateCharCount() {
      const len = inputText.value.length;
      charCount.textContent = len + ' / 5000';
      if (len > 5000) inputText.value = inputText.value.slice(0, 5000);
    }
    inputText.addEventListener('input', () => {
      updateCharCount();
      scheduleAutoTranslate();
    });
    updateCharCount();

    // ── Auto translate (1s debounce) ──
    function scheduleAutoTranslate() {
      clearTimeout(autoTimer);
      if (inputText.value.trim().length < 3) return;
      autoIndicator.style.display = 'flex';
      autoTimer = setTimeout(() => {
        autoIndicator.style.display = 'none';
        doTranslate();
      }, 1000);
    }

    // ── Translate ──
    function doTranslate() {
      const text = inputText.value.trim();
      if (!text) return;
      setLoading(true);
      clearError();
      vscode.postMessage({
        command: 'translate',
        text,
        sourceLang: sourceLang.value,
        targetLang: targetLang.value,
      });
    }
    translateBtn.addEventListener('click', doTranslate);

    // ── Keyboard shortcut ──
    inputText.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') doTranslate();
    });

    // ── Swap ──
    swapBtn.addEventListener('click', () => {
      const src = sourceLang.value;
      if (src === 'auto') return;
      const tgt = targetLang.value;
      // Try to set source to old target
      const srcOpt = [...sourceLang.options].find(o => o.value === tgt);
      if (srcOpt) sourceLang.value = tgt;
      const tgtOpt = [...targetLang.options].find(o => o.value === src);
      if (tgtOpt) targetLang.value = src;
      // Swap text too
      if (translatedText) {
        inputText.value = translatedText;
        outputText.innerHTML = '<span class="output-placeholder">Translation will appear here…</span>';
        translatedText = '';
        updateCharCount();
        scheduleAutoTranslate();
      }
    });

    // ── Clear ──
    clearBtn.addEventListener('click', () => {
      inputText.value = '';
      outputText.innerHTML = '<span class="output-placeholder">Translation will appear here…</span>';
      translatedText = '';
      detectedBadge.classList.remove('visible');
      clearError();
      updateCharCount();
    });

    // ── Copy ──
    copyBtn.addEventListener('click', () => {
      if (!translatedText) return;
      navigator.clipboard.writeText(translatedText).catch(() => {
        vscode.postMessage({ command: 'copyToClipboard', text: translatedText });
      });
      copyBtn.textContent = '✓';
      setTimeout(() => (copyBtn.textContent = '⎘'), 1500);
    });

    // ── Insert into editor ──
    insertBtn.addEventListener('click', () => {
      if (!translatedText) return;
      vscode.postMessage({ command: 'insertText', text: translatedText });
    });

    // ── Helpers ──
    function setLoading(on) {
      translateBtn.disabled = on;
      spinner.classList.toggle('visible', on);
    }
    function clearError() {
      errorBar.classList.remove('visible');
      errorBar.textContent = '';
    }
    function showError(msg) {
      errorBar.textContent = '⚠ ' + msg;
      errorBar.classList.add('visible');
    }

    // ── Messages from extension ──
    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.command) {
        case 'translationResult':
          setLoading(false);
          translatedText = msg.text;
          outputText.textContent = msg.text;
          if (msg.detectedLanguage) {
            detectedBadge.textContent = 'Detected: ' + msg.detectedLanguage.toUpperCase();
            detectedBadge.classList.add('visible');
          }
          break;
        case 'translationError':
          setLoading(false);
          showError(msg.error);
          break;
        case 'setText':
          inputText.value = msg.text;
          updateCharCount();
          scheduleAutoTranslate();
          break;
        case 'setProvider':
          providerBadge.textContent = msg.provider;
          break;
      }
    });

    // Tell extension we're ready
    vscode.postMessage({ command: 'ready' });

    // If pre-filled, auto-translate
    if (inputText.value.trim().length > 0) scheduleAutoTranslate();
  </script>
</body>
</html>`;
}
