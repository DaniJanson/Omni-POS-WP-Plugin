/**
 * Internationalization helper for Omni POS
 * Pulls translations from reactive store (with in-app custom overrides & dynamic language switching),
 * falling back to WordPress i18n / Loco Translate.
 */

import { usePosStore } from '../store/usePosStore';

export function t(key: string, defaultText?: string): string {
  try {
    const store = usePosStore.getState?.();
    const currentLang = store?.currentLanguage;
    const storeTranslations = store?.translations;
    const customOverrides = store?.customTranslations;

    // 1. If English (US) is explicitly selected
    if (currentLang === 'en_US') {
      if (customOverrides && customOverrides[key]) {
        return customOverrides[key];
      }
      return defaultText !== undefined ? defaultText : key;
    }

    // 2. Active translation from store dictionary
    if (storeTranslations && storeTranslations[key]) {
      return storeTranslations[key];
    }
  } catch (e) {
    // store not ready yet
  }

  // 3. Fallback to initial config if language is not English
  const currentLangConfig = (typeof window !== 'undefined' && window.omniPosConfig?.locale) || 'auto';
  if (currentLangConfig !== 'en_US') {
    const dictionary = window.omniPosConfig?.i18n;
    if (dictionary && dictionary[key]) {
      return dictionary[key];
    }
  }

  return defaultText !== undefined ? defaultText : key;
}

export function __(text: string, _domain: string = 'omni-pos'): string {
  return t(text, text);
}

