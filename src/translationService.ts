import axios from 'axios';
import * as vscode from 'vscode';

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
}

export interface Language {
  code: string;
  name: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'auto', name: '🔍 Detect Language' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'ko', name: 'Korean' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'ms', name: 'Malay' },
  { code: 'mt', name: 'Maltese' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'es', name: 'Spanish' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' },
];

function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let cut = remaining.lastIndexOf(' ', maxLen);
    if (cut <= 0) cut = maxLen;
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<TranslationResult> {
  const config = vscode.workspace.getConfiguration('languageAI');
  const provider = config.get<string>('apiProvider', 'libre');
  const apiKey = config.get<string>('apiKey', '');

  switch (provider) {
    case 'deepl':
      return translateWithDeepL(text, targetLang, sourceLang, apiKey);
    case 'google':
      return translateWithGoogle(text, targetLang, sourceLang, apiKey);
    default:
      return translateWithLibre(text, targetLang, sourceLang);
  }
}

async function translateWithLibre(
  text: string,
  targetLang: string,
  sourceLang: string
): Promise<TranslationResult> {
  // MyMemory Translation API — free, no API key required, no account needed.
  // Splits text into chunks of <=500 chars since the API has a length limit per request.
  try {
    const langPair = `${sourceLang === 'auto' ? 'autodetect' : sourceLang}|${targetLang}`;
    const chunks = splitText(text, 480);
    const translatedChunks: string[] = [];
    let detected: string | undefined;

    for (const chunk of chunks) {
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: { q: chunk, langpair: langPair },
        timeout: 10000,
      });

      const data = response.data;
      if (!data?.responseData) {
        throw new Error('Invalid response from translation service');
      }
      if (data.responseStatus && Number(data.responseStatus) >= 400) {
        throw new Error(data.responseDetails || `Request failed with status ${data.responseStatus}`);
      }

      translatedChunks.push(data.responseData.translatedText);
      if (!detected && data.responseData.detectedLanguage) {
        detected = data.responseData.detectedLanguage;
      }
    }

    return {
      translatedText: translatedChunks.join(' '),
      detectedLanguage: sourceLang === 'auto' ? detected : undefined,
    };
  } catch (error: any) {
    const message = error?.response?.data?.responseDetails || error.message;
    throw new Error(`Translation error: ${message}`);
  }
}

async function translateWithDeepL(
  text: string,
  targetLang: string,
  sourceLang: string,
  apiKey: string
): Promise<TranslationResult> {
  if (!apiKey) {
    throw new Error('DeepL API key is required. Please set it in settings.');
  }
  try {
    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      new URLSearchParams({
        auth_key: apiKey,
        text,
        target_lang: targetLang.toUpperCase(),
        ...(sourceLang !== 'auto' && { source_lang: sourceLang.toUpperCase() }),
      }),
      { timeout: 10000 }
    );

    const translation = response.data.translations[0];
    return {
      translatedText: translation.text,
      detectedLanguage: translation.detected_source_language?.toLowerCase(),
    };
  } catch (error: any) {
    throw new Error(`DeepL error: ${error.message}`);
  }
}

async function translateWithGoogle(
  text: string,
  targetLang: string,
  sourceLang: string,
  apiKey: string
): Promise<TranslationResult> {
  if (!apiKey) {
    throw new Error('Google API key is required. Please set it in settings.');
  }
  try {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        q: text,
        target: targetLang,
        ...(sourceLang !== 'auto' && { source: sourceLang }),
        format: 'text',
      },
      { timeout: 10000 }
    );

    const translation = response.data.data.translations[0];
    return {
      translatedText: translation.translatedText,
      detectedLanguage: translation.detectedSourceLanguage,
    };
  } catch (error: any) {
    throw new Error(`Google Translate error: ${error.message}`);
  }
}
