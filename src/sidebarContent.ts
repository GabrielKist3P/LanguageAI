import { SUPPORTED_LANGUAGES } from './translationService';

export function getSidebarContent(
  sourceLang: string,
  targetLang: string,
  providerName: string
): string {
  const srcOptions = SUPPORTED_LANGUAGES.map(
    (l) => `<option value="${l.code}" ${l.code === sourceLang ? 'selected' : ''}>${l.name}</option>`
  ).join('');

  const tgtOptions = SUPPORTED_LANGUAGES.filter((l) => l.code !== 'auto').map(
    (l) => `<option value="${l.code}" ${l.code === targetLang ? 'selected' : ''}>${l.name}</option>`
  ).join('');

  return /* html */`<!DOCTYPE html>
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
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  /* ── Top language bar ── */
  .lang-bar {
    display: flex;
    align-items: center;
    background: var(--vscode-sideBar-background);
    border-bottom: 1px solid var(--vscode-panel-border);
    padding: 6px 8px;
    gap: 4px;
    flex-shrink: 0;
  }
  select {
    flex: 1;
    min-width: 0;
    padding: 4px 6px;
    background: var(--vscode-dropdown-background);
    color: var(--vscode-dropdown-foreground);
    border: 1px solid var(--vscode-dropdown-border, var(--vscode-panel-border));
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    outline: none;
  }
  select:focus { border-color: var(--vscode-focusBorder); }

  .swap-btn {
    background: none;
    border: 1px solid var(--vscode-panel-border);
    color: var(--vscode-editor-foreground);
    border-radius: 50%;
    width: 24px; height: 24px;
    cursor: pointer;
    font-size: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .swap-btn:hover { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }

  /* ── Source area ── */
  .source-area {
    position: relative;
    flex-shrink: 0;
    background: var(--vscode-input-background);
    border-bottom: 2px solid var(--vscode-focusBorder);
  }
  textarea {
    width: 100%;
    min-height: 130px;
    max-height: 200px;
    padding: 10px 12px 36px;
    background: transparent;
    color: var(--vscode-input-foreground);
    border: none;
    resize: vertical;
    font-family: var(--vscode-font-family);
    font-size: 14px;
    line-height: 1.55;
    outline: none;
  }
  textarea::placeholder { color: var(--vscode-input-placeholderForeground); }

  .source-footer {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    background: var(--vscode-input-background);
  }
  .char-count {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
  }
  .src-actions { display: flex; gap: 4px; }

  /* ── Translate button ── */
  .translate-btn {
    padding: 5px 14px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    transition: background 0.15s;
  }
  .translate-btn:hover { background: var(--vscode-button-hoverBackground); }
  .translate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .spinner {
    display: none;
    width: 12px; height: 12px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  .spinner.on { display: block; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Divider with detected lang ── */
  .divider {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--vscode-sideBar-background);
    border-bottom: 1px solid var(--vscode-panel-border);
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    flex-shrink: 0;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--vscode-panel-border);
  }
  .detected-chip {
    display: none;
    padding: 1px 8px;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
  }
  .detected-chip.on { display: inline-block; }

  /* ── Output area ── */
  .output-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--vscode-editor-background);
  }
  .output-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 10px 12px;
    font-size: 14px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--vscode-editor-foreground);
    min-height: 80px;
  }
  .output-placeholder {
    color: var(--vscode-input-placeholderForeground);
    font-style: italic;
    font-size: 13px;
  }
  .output-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    padding: 4px 8px;
    border-top: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
  }

  /* ── Icon buttons ── */
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
    title: attr(title);
  }
  .icon-btn:hover {
    background: var(--vscode-input-background);
    border-color: var(--vscode-panel-border);
    color: var(--vscode-editor-foreground);
  }
  .icon-btn:active { transform: scale(0.9); }

  /* ── Error ── */
  .error-bar {
    display: none;
    padding: 6px 12px;
    font-size: 11px;
    background: var(--vscode-inputValidation-errorBackground);
    color: var(--vscode-inputValidation-errorForeground);
    border-top: 1px solid var(--vscode-inputValidation-errorBorder);
  }
  .error-bar.on { display: block; }

  /* ── Provider tag ── */
  .provider-bar {
    padding: 4px 12px;
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    background: var(--vscode-sideBar-background);
    border-top: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
    text-align: right;
    letter-spacing: 0.2px;
  }

  /* ── Auto-translate pulse ── */
  .auto-dot {
    display: none;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--vscode-focusBorder);
    animation: pulse 1s ease-in-out infinite;
    margin-right: 4px;
  }
  .auto-dot.on { display: inline-block; }
  @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
</style>
</head>
<body>

<!-- Language selector bar -->
<div class="lang-bar">
  <select id="srcLang">${srcOptions}</select>
  <button class="swap-btn" id="swapBtn" title="Swap languages">⇄</button>
  <select id="tgtLang">${tgtOptions}</select>
</div>

<!-- Source input -->
<div class="source-area">
  <textarea id="inputText" placeholder="Type or paste text…" maxlength="5000"></textarea>
  <div class="source-footer">
    <span class="char-count"><span id="charNum">0</span> / 5000</span>
    <div class="src-actions">
      <span class="auto-dot" id="autoDot"></span>
      <button class="icon-btn" id="clearBtn" title="Clear">✕</button>
      <button class="translate-btn" id="translateBtn">
        <span class="spinner" id="spinner"></span>Translate
      </button>
    </div>
  </div>
</div>

<!-- Middle divider -->
<div class="divider">
  <span class="detected-chip" id="detectedChip"></span>
</div>

<!-- Output -->
<div class="output-area">
  <div class="output-scroll" id="outputText">
    <span class="output-placeholder">Translation appears here…</span>
  </div>
  <div class="error-bar" id="errorBar"></div>
  <div class="output-footer">
    <button class="icon-btn" id="copyBtn" title="Copy">⎘</button>
    <button class="icon-btn" id="insertBtn" title="Insert into editor">↩</button>
  </div>
</div>

<!-- Provider label -->
<div class="provider-bar" id="providerBar">via ${providerName}</div>

<script>
  const vscode = acquireVsCodeApi();

  const inputText   = document.getElementById('inputText');
  const outputText  = document.getElementById('outputText');
  const srcLang     = document.getElementById('srcLang');
  const tgtLang     = document.getElementById('tgtLang');
  const translateBtn= document.getElementById('translateBtn');
  const clearBtn    = document.getElementById('clearBtn');
  const copyBtn     = document.getElementById('copyBtn');
  const insertBtn   = document.getElementById('insertBtn');
  const swapBtn     = document.getElementById('swapBtn');
  const spinner     = document.getElementById('spinner');
  const charNum     = document.getElementById('charNum');
  const detectedChip= document.getElementById('detectedChip');
  const errorBar    = document.getElementById('errorBar');
  const autoDot     = document.getElementById('autoDot');
  const providerBar = document.getElementById('providerBar');

  let translatedText = '';
  let autoTimer = null;

  // Char count
  inputText.addEventListener('input', () => {
    charNum.textContent = inputText.value.length;
    scheduleAuto();
  });

  // Auto-translate debounce
  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (inputText.value.trim().length < 2) return;
    autoDot.classList.add('on');
    autoTimer = setTimeout(() => { autoDot.classList.remove('on'); doTranslate(); }, 900);
  }

  // Translate
  function doTranslate() {
    const text = inputText.value.trim();
    if (!text) return;
    setLoading(true);
    clearError();
    vscode.postMessage({ command: 'translate', text, sourceLang: srcLang.value, targetLang: tgtLang.value });
  }

  translateBtn.addEventListener('click', doTranslate);
  inputText.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { clearTimeout(autoTimer); doTranslate(); }
  });

  // Swap
  swapBtn.addEventListener('click', () => {
    const s = srcLang.value, t = tgtLang.value;
    if (s === 'auto') return;
    const srcOk = [...srcLang.options].some(o => o.value === t);
    const tgtOk = [...tgtLang.options].some(o => o.value === s);
    if (srcOk) srcLang.value = t;
    if (tgtOk) tgtLang.value = s;
    if (translatedText) {
      inputText.value = translatedText;
      charNum.textContent = inputText.value.length;
      outputText.innerHTML = '<span class="output-placeholder">Translation appears here…</span>';
      translatedText = '';
      scheduleAuto();
    }
  });

  // Clear
  clearBtn.addEventListener('click', () => {
    inputText.value = '';
    charNum.textContent = '0';
    outputText.innerHTML = '<span class="output-placeholder">Translation appears here…</span>';
    translatedText = '';
    detectedChip.classList.remove('on');
    clearError();
  });

  // Copy
  copyBtn.addEventListener('click', () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText).catch(() =>
      vscode.postMessage({ command: 'copyToClipboard', text: translatedText })
    );
    copyBtn.textContent = '✓';
    setTimeout(() => copyBtn.textContent = '⎘', 1500);
  });

  // Insert
  insertBtn.addEventListener('click', () => {
    if (translatedText) vscode.postMessage({ command: 'insertText', text: translatedText });
  });

  function setLoading(on) {
    translateBtn.disabled = on;
    spinner.classList.toggle('on', on);
  }
  function clearError() { errorBar.classList.remove('on'); }
  function showError(msg) { errorBar.textContent = '⚠ ' + msg; errorBar.classList.add('on'); }

  window.addEventListener('message', ({ data: msg }) => {
    switch (msg.command) {
      case 'translationResult':
        setLoading(false);
        translatedText = msg.text;
        outputText.textContent = msg.text;
        if (msg.detectedLanguage) {
          detectedChip.textContent = 'Detected: ' + msg.detectedLanguage.toUpperCase();
          detectedChip.classList.add('on');
        }
        break;
      case 'translationError':
        setLoading(false);
        showError(msg.error);
        break;
      case 'setText':
        inputText.value = msg.text;
        charNum.textContent = msg.text.length;
        scheduleAuto();
        break;
      case 'setProvider':
        providerBar.textContent = 'via ' + msg.provider;
        break;
    }
  });

  vscode.postMessage({ command: 'ready' });
</script>
</body>
</html>`;
}
