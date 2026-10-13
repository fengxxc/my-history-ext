/**
 * i18n entry point
 *
 * Usage – wrap your React root with <I18nProvider>:
 *
 *   import { I18nProvider } from '@/src/i18n';
 *   ReactDOM.createRoot(...).render(
 *     <I18nProvider><App /></I18nProvider>
 *   );
 *
 * Then inside any component:
 *
 *   import { FormattedMessage, useIntl } from '@/src/i18n';
 *
 *   // JSX:
 *   <FormattedMessage id="app.title" />
 *
 *   // Imperative:
 *   const intl = useIntl();
 *   intl.formatMessage({ id: 'search.placeholder' });
 */

import React, { useState, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import en from './locales/en';
import zh from './locales/zh';
import zhTW from './locales/zh-TW';
import ja from './locales/ja';
import ko from './locales/ko';
import de from './locales/de';
import fr from './locales/fr';
import es from './locales/es';
import type { MessageKey } from './locales/en';

// ─── Supported locales ────────────────────────────────────────────────────────

export type SupportedLocale = 'en' | 'zh' | 'zh-TW' | 'ja' | 'ko' | 'de' | 'fr' | 'es';

/** Special sentinel: follow the browser UI language automatically. */
export type LocaleSetting = SupportedLocale | 'auto';

export interface LocaleMeta {
  /** BCP-47 locale code used by react-intl */
  locale: SupportedLocale;
  /** Display name in the language itself */
  nativeName: string;
  /** Display name in English */
  englishName: string;
  /** Country/region flag emoji */
  flag: string;
}

/** Ordered list used for rendering the language picker. */
export const SUPPORTED_LOCALES: LocaleMeta[] = [
  { locale: 'en',    nativeName: 'English',    englishName: 'English',             flag: '🇬🇧' },
  { locale: 'zh',    nativeName: '简体中文',    englishName: 'Chinese (Simplified)', flag: '🇨🇳' },
  { locale: 'zh-TW', nativeName: '繁體中文',    englishName: 'Chinese (Traditional)',flag: '🇹🇼' },
  { locale: 'ja',    nativeName: '日本語',      englishName: 'Japanese',             flag: '🇯🇵' },
  { locale: 'ko',    nativeName: '한국어',      englishName: 'Korean',               flag: '🇰🇷' },
  { locale: 'de',    nativeName: 'Deutsch',     englishName: 'German',               flag: '🇩🇪' },
  { locale: 'fr',    nativeName: 'Français',    englishName: 'French',               flag: '🇫🇷' },
  { locale: 'es',    nativeName: 'Español',     englishName: 'Spanish',              flag: '🇪🇸' },
];

const messages: Record<SupportedLocale, Record<string, string>> = {
  en,
  zh,
  'zh-TW': zhTW,
  ja,
  ko,
  de,
  fr,
  es,
};

// ─── Storage key ──────────────────────────────────────────────────────────────

/** Key used in browser.storage.sync to persist the user's language choice. */
export const LOCALE_STORAGE_KEY = 'userLocale';

// ─── Locale detection ─────────────────────────────────────────────────────────

/**
 * Resolve the best supported locale from the browser UI language.
 * Falls back to 'en' when the language is not supported.
 */
export function detectLocale(): SupportedLocale {
  const raw: string =
    (typeof browser !== 'undefined' && browser.i18n?.getUILanguage?.()) ||
    navigator.language ||
    'en';

  // Normalise: "zh_TW" → "zh-TW", "ZH-tw" → "zh-TW"
  const normalised = raw.replace('_', '-');
  const [lang = 'en', region = ''] = normalised.toLowerCase().split('-');

  // Chinese needs region discrimination: zh-TW / zh-HK / zh-MO → Traditional
  if (lang === 'zh') {
    return ['tw', 'hk', 'mo'].includes(region) ? 'zh-TW' : 'zh';
  }

  if (lang in messages) return lang as SupportedLocale;
  return 'en';
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

/** Read the persisted locale setting from storage. Returns null when not set. */
export async function getStoredLocaleSetting(): Promise<LocaleSetting | null> {
  try {
    const result = await browser.storage.sync.get(LOCALE_STORAGE_KEY);
    const value = result[LOCALE_STORAGE_KEY] as string | undefined;
    if (!value) return null;
    if (value === 'auto') return 'auto';
    if (value in messages) return value as SupportedLocale;
  } catch {
    // storage unavailable (e.g. unit-test environment)
  }
  return null;
}

/** Persist the locale setting to storage. Pass 'auto' to follow the browser. */
export async function setStoredLocaleSetting(setting: LocaleSetting): Promise<void> {
  try {
    await browser.storage.sync.set({ [LOCALE_STORAGE_KEY]: setting });
  } catch {
    // storage unavailable
  }
}

/** Derive the active SupportedLocale from a LocaleSetting. */
function resolveLocale(setting: LocaleSetting | null): SupportedLocale {
  if (!setting || setting === 'auto') return detectLocale();
  return setting;
}

// ─── Provider component ───────────────────────────────────────────────────────

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  // Start with auto-detected locale for instant first render (no flash).
  const [locale, setLocale] = useState<SupportedLocale>(detectLocale);

  useEffect(() => {
    // 1. Read stored preference and apply it.
    getStoredLocaleSetting().then((setting) => {
      setLocale(resolveLocale(setting));
    });

    // 2. Listen for changes made in the Options page so all open extension
    //    pages (popup, calendar…) update without a reload.
    const handler = (
      changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
      areaName: string,
    ) => {
      if (areaName !== 'sync' || !(LOCALE_STORAGE_KEY in changes)) return;
      const next = changes[LOCALE_STORAGE_KEY]?.newValue as LocaleSetting | undefined;
      setLocale(resolveLocale(next ?? null));
    };

    browser.storage.onChanged.addListener(handler);
    return () => browser.storage.onChanged.removeListener(handler);
  }, []);

  return (
    <IntlProvider
      locale={locale}
      messages={messages[locale]}
      defaultLocale="en"
      onError={
        import.meta.env.MODE === 'production' ? () => {} : undefined
      }
    >
      {children}
    </IntlProvider>
  );
}

// ─── Re-export react-intl helpers for convenience ────────────────────────────

export { useIntl, FormattedMessage, FormattedDate, FormattedNumber } from 'react-intl';
export type { MessageKey };
