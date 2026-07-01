# 🌐 LanguageAI

Extensão para Visual Studio Code que traduz texto diretamente no editor — no estilo do translate.google.com, sem sair do teu fluxo de trabalho.

---

## ✨ Funcionalidades

### 1. Traduzir seleção com o botão direito
Seleciona qualquer texto no editor → clica com o botão direito → **"LanguageAI: Traduzir"**.

- Abre instantaneamente um painel lateral com **Original | Tradução** lado a lado
- Mostra um indicador de carregamento enquanto a tradução é processada
- Permite trocar o idioma de destino diretamente no painel (re-traduz automaticamente)
- Botões rápidos:
  - **Copiar** — copia a tradução para a área de transferência
  - **Substituir** — substitui o texto selecionado pela tradução
  - **Abrir Painel** — abre o painel completo com o texto já carregado

### 2. Painel completo (`Ctrl+Shift+L`)
Abre uma aba de tradução completa ao lado do editor, com:
- Seletores de idioma de origem e destino, com botão de troca
- Área de texto com contador de caracteres e tradução automática (debounce)
- Deteção automática do idioma de origem
- Inserir a tradução diretamente no editor ativo

---

## ⌨️ Atalhos

| Ação | Windows/Linux | Mac |
|---|---|---|
| Traduzir seleção (popup) | `Ctrl+Shift+T` | `Cmd+Shift+T` |
| Abrir painel completo | `Ctrl+Shift+L` | `Cmd+Shift+L` |
| Traduzir dentro do painel | `Ctrl+Enter` | `Cmd+Enter` |

---

## ⚙️ Configurações

Procura por `LanguageAI` nas definições do VSCode:

| Definição | Padrão | Descrição |
|---|---|---|
| `languageAI.defaultTargetLanguage` | `pt` | Idioma de destino padrão |
| `languageAI.defaultSourceLanguage` | `auto` | Idioma de origem (`auto` = deteção automática) |
| `languageAI.apiProvider` | `libre` | Provedor: `libre` (MyMemory), `deepl` ou `google` |
| `languageAI.apiKey` | *(vazio)* | Chave de API para DeepL ou Google (não é necessária para o provedor padrão) |

### Provedores de tradução

**MyMemory (padrão — gratuito, sem chave)**
Funciona imediatamente, sem necessidade de conta. Ideal para uso pessoal e testes.

**DeepL**
1. Cria uma conta gratuita em [deepl.com](https://www.deepl.com/pro-api)
2. Copia a tua chave de API
3. Define `languageAI.apiProvider` como `deepl`
4. Cola a chave em `languageAI.apiKey`

**Google Cloud Translation**
1. Ativa a [Cloud Translation API](https://cloud.google.com/translate)
2. Cria uma chave de API na Google Cloud Console
3. Define `languageAI.apiProvider` como `google`
4. Cola a chave em `languageAI.apiKey`

---

## 🚀 Começar a desenvolver

```bash
npm install
npm run compile   # ou: npm run watch
```

Depois pressiona **F5** no VSCode para abrir uma janela de teste com a extensão carregada.

---

## 📦 Gerar o pacote `.vsix`

```bash
npm install -g @vscode/vsce
vsce package
```

Isto cria um ficheiro `language-ai-X.X.X.vsix`, que podes instalar manualmente em:
`Extensions → ... → Install from VSIX...`

---

## 🗂 Estrutura do projeto

```
LanguageAI/
├── src/
│   ├── extension.ts          # Ponto de entrada, comandos, popup e painel
│   ├── popupContent.ts       # HTML do popup de tradução rápida (clique direito)
│   ├── webviewContent.ts     # HTML do painel completo de tradução
│   └── translationService.ts # Chamadas às APIs (MyMemory / DeepL / Google)
├── media/
│   └── icon.png               # Ícone da extensão
├── .vscode/
│   ├── launch.json
│   └── tasks.json
├── package.json
├── LICENSE.md
└── tsconfig.json
```

---

## 📝 Licença

MIT — consulta o ficheiro [LICENSE.md](./LICENSE.md).
