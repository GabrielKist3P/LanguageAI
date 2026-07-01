import * as vscode from 'vscode';
import { translateText } from './translationService';
import { getWebviewContent } from './webviewContent';
import { getPopupContent } from './popupContent';

let translatorPanel: vscode.WebviewPanel | undefined;
let popupPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('LanguageAI is now active!');

  // ── Command: Open full panel ──────────────────────────────────────
  const openPanelCmd = vscode.commands.registerCommand(
    'language-ai.openPanel',
    () => openTranslatorPanel(context)
  );

  // ── Command: Translate selection → inline WebView popup ───────────
  const translateSelectionCmd = vscode.commands.registerCommand(
    'language-ai.translateSelection',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);
      if (!selectedText.trim()) {
        vscode.window.showWarningMessage('Selecione algum texto primeiro.');
        return;
      }

      const config = vscode.workspace.getConfiguration('languageAI');
      const targetLang = config.get<string>('defaultTargetLanguage', 'pt');
      const sourceLang = config.get<string>('defaultSourceLanguage', 'auto');

      // Open popup immediately with loading state, translate in background
      openPopupPanel(context, editor, selection, selectedText, '', undefined, sourceLang, targetLang, true);

      try {
        const result = await translateText(selectedText, targetLang, sourceLang);
        // Send result to the already-open popup
        if (popupPanel) {
          popupPanel.webview.postMessage({
            command: 'translationResult',
            text: result.translatedText,
            detectedLanguage: result.detectedLanguage,
          });
        }
      } catch (err: any) {
        if (popupPanel) {
          popupPanel.webview.postMessage({ command: 'translationError', error: err.message });
        }
      }
    }
  );

  context.subscriptions.push(openPanelCmd, translateSelectionCmd);
}

// ── Popup WebView panel (mini translator) ─────────────────────────────
function openPopupPanel(
  context: vscode.ExtensionContext,
  editor: vscode.TextEditor,
  selection: vscode.Selection,
  originalText: string,
  translatedText: string,
  detectedLang: string | undefined,
  sourceLang: string,
  targetLang: string,
  loading: boolean
) {
  // Close existing popup if open
  if (popupPanel) {
    popupPanel.dispose();
    popupPanel = undefined;
  }

  popupPanel = vscode.window.createWebviewPanel(
    'languageAIPopup',
    'LanguageAI',
    {
      viewColumn: vscode.ViewColumn.Beside,
      preserveFocus: true, // keep cursor in editor
    },
    {
      enableScripts: true,
      retainContextWhenHidden: false,
    }
  );

  popupPanel.webview.html = getPopupContent(
    originalText,
    translatedText,
    detectedLang,
    sourceLang,
    targetLang,
    loading
  );

  popupPanel.webview.onDidReceiveMessage(
    async (msg) => {
      switch (msg.command) {
        case 'replace':
          await editor.edit((eb) => eb.replace(selection, msg.text));
          popupPanel?.dispose();
          break;

        case 'copy':
          await vscode.env.clipboard.writeText(msg.text);
          break;

        case 'openPanel':
          popupPanel?.dispose();
          openTranslatorPanel(context, originalText);
          break;

        case 'retranslate': {
          const config = vscode.workspace.getConfiguration('languageAI');
          const srcLang = config.get<string>('defaultSourceLanguage', 'auto');
          try {
            const result = await translateText(originalText, msg.targetLang, srcLang);
            popupPanel?.webview.postMessage({
              command: 'translationResult',
              text: result.translatedText,
              detectedLanguage: result.detectedLanguage,
            });
          } catch (err: any) {
            popupPanel?.webview.postMessage({ command: 'translationError', error: err.message });
          }
          break;
        }
      }
    },
    undefined,
    context.subscriptions
  );

  popupPanel.onDidDispose(() => { popupPanel = undefined; }, null, context.subscriptions);
}

// ── Full panel ────────────────────────────────────────────────────────
function openTranslatorPanel(context: vscode.ExtensionContext, initialText = '') {
  const config = vscode.workspace.getConfiguration('languageAI');
  const targetLang = config.get<string>('defaultTargetLanguage', 'pt');
  const sourceLang = config.get<string>('defaultSourceLanguage', 'auto');
  const provider = config.get<string>('apiProvider', 'libre');
  const providerLabel: Record<string, string> = {
    libre: 'MyMemory', deepl: 'DeepL', google: 'Google Translate',
  };

  if (translatorPanel) {
    translatorPanel.reveal(vscode.ViewColumn.Beside);
    if (initialText) {
      translatorPanel.webview.postMessage({ command: 'setText', text: initialText });
    }
    return;
  }

  translatorPanel = vscode.window.createWebviewPanel(
    'languageAI',
    'LanguageAI',
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  translatorPanel.webview.html = getWebviewContent(
    translatorPanel.webview,
    context.extensionUri,
    initialText,
    sourceLang,
    targetLang
  );

  translatorPanel.webview.onDidReceiveMessage(async (message) => {
    switch (message.command) {
      case 'ready':
        translatorPanel?.webview.postMessage({
          command: 'setProvider',
          provider: providerLabel[provider] ?? provider,
        });
        break;
      case 'translate':
        try {
          const result = await translateText(message.text, message.targetLang, message.sourceLang);
          translatorPanel?.webview.postMessage({
            command: 'translationResult',
            text: result.translatedText,
            detectedLanguage: result.detectedLanguage,
          });
        } catch (err: any) {
          translatorPanel?.webview.postMessage({ command: 'translationError', error: err.message });
        }
        break;
      case 'copyToClipboard':
        await vscode.env.clipboard.writeText(message.text);
        vscode.window.showInformationMessage('Tradução copiada!');
        break;
      case 'insertText': {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          await editor.edit((eb) => {
            editor.selection.isEmpty
              ? eb.insert(editor.selection.active, message.text)
              : eb.replace(editor.selection, message.text);
          });
          vscode.window.showInformationMessage('Tradução inserida!');
        }
        break;
      }
    }
  }, undefined, context.subscriptions);

  translatorPanel.onDidDispose(() => { translatorPanel = undefined; }, null, context.subscriptions);
}

export function deactivate() {}
