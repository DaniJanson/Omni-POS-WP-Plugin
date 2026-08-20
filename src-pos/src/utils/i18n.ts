/**
 * Internationalization helper for Omni POS
 * Pulls translations from WordPress i18n (Loco Translate compatible)
 */

declare global {
  interface Window {
    omniPosConfig?: {
      restUrl: string;
      posApiUrl: string;
      nonce: string;
      adminUrl: string;
      logoutUrl: string;
      locale?: string;
      version: string;
      i18n?: Record<string, string>;
    };
  }
}

export function t(key: string, defaultText: string): string {
  const dictionary = window.omniPosConfig?.i18n;
  if (dictionary && dictionary[key]) {
    return dictionary[key];
  }
  return defaultText;
}

export function __(text: string, _domain: string = 'omni-pos'): string {
  const dictionary = window.omniPosConfig?.i18n;
  if (dictionary && dictionary[text]) {
    return dictionary[text];
  }
  return text;
}
