/**
 * i18n entry point
 *
 * Usage – wrap your React root with <I18nProvider>:
 *
 *   import { I18nProvider } from '@/i18n';
 *   ReactDOM.createRoot(...).render(
 *     <I18nProvider><App /></I18nProvider>
 *   );
 *
 * Then inside any component:
 *
 *   import { FormattedMessage, useIntl } from 'react-intl';
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

// ─── Locale detection ─────────────────────────────────────────────────────────

/**
 * Resolve the best supported locale from the browser UI language.
 * Falls back to 'en' when the language is not supported.
 */
function detectLocale(): SupportedLocale {
  // browser.i18n is available in extension contexts; navigator.language is the
  // fallback for any web-page context (e.g. Storybook, tests).
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

// ─── Provider component ───────────────────────────────────────────────────────

interface I18nProviderProps {
  /** Override locale instead of auto-detecting (useful for testing / settings page) */
  locale?: SupportedLocale;
  children: React.ReactNode;
}

export function I18nProvider({ locale: localeProp, children }: I18nProviderProps) {
  const [locale, setLocale] = useState<SupportedLocale>(localeProp ?? detectLocale());

  // Re-detect when the prop changes (e.g. user toggles language in settings)
  useEffect(() => {
    if (localeProp) setLocale(localeProp);
  }, [localeProp]);

  return (
    <IntlProvider
      locale={locale}
      messages={messages[locale]}
      defaultLocale="en"
      onError={
        // Suppress "missing message" warnings in production builds
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
