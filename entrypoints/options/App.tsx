import React, { useEffect, useState } from 'react';
import {
  FormattedMessage,
  useIntl,
  SUPPORTED_LOCALES,
  LOCALE_STORAGE_KEY,
  getStoredLocaleSetting,
  setStoredLocaleSetting,
  detectLocale,
} from '@/src/i18n';
import type { LocaleSetting, SupportedLocale } from '@/src/i18n';

// ─── Saved toast ──────────────────────────────────────────────────────────────

function SavedToast({ visible }: { visible: boolean }) {
  const intl = useIntl();
  return (
    <span
      className="saved-toast"
      role="status"
      aria-live="polite"
      style={{ opacity: visible ? 1 : 0 }}
    >
      ✓ {intl.formatMessage({ id: 'options.language.saved' })}
    </span>
  );
}

// ─── Language card ────────────────────────────────────────────────────────────

interface LangCardProps {
  value: LocaleSetting;
  flag: string;
  nativeName: string;
  subLabel: string;
  selected: boolean;
  onSelect: (v: LocaleSetting) => void;
}

function LangCard({ value, flag, nativeName, subLabel, selected, onSelect }: LangCardProps) {
  return (
    <label className={`lang-card${selected ? ' lang-card--selected' : ''}`}>
      <input
        type="radio"
        name="locale"
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="lang-card__radio"
      />
      <span className="lang-card__flag">{flag}</span>
      <span className="lang-card__text">
        <span className="lang-card__native">{nativeName}</span>
        <span className="lang-card__sub">{subLabel}</span>
      </span>
      {selected && <span className="lang-card__check">✓</span>}
    </label>
  );
}

// ─── Main options page ────────────────────────────────────────────────────────

export default function App() {
  const intl = useIntl();

  const [setting, setSetting] = useState<LocaleSetting>('auto');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted setting on mount.
  useEffect(() => {
    getStoredLocaleSetting().then((stored) => {
      setSetting(stored ?? 'auto');
    });
  }, []);

  const handleSelect = async (next: LocaleSetting) => {
    setSetting(next);
    await setStoredLocaleSetting(next);
    showToast();
  };

  const showToast = () => {
    setToastVisible(true);
    if (toastTimer) clearTimeout(toastTimer);
    const t = setTimeout(() => setToastVisible(false), 2000);
    setToastTimer(t);
  };

  // Detected browser locale label, e.g. "日本語" for ja browser.
  const browserLocale: SupportedLocale = detectLocale();
  const browserMeta = SUPPORTED_LOCALES.find((m) => m.locale === browserLocale);
  const autoSubLabel = browserMeta
    ? `${browserMeta.flag} ${browserMeta.nativeName}`
    : browserLocale;

  return (
    <div className="options-page">
      <header className="options-header">
        <span className="options-header__icon">📜</span>
        <h1 className="options-header__title">My History</h1>
        <span className="options-header__subtitle">
          <FormattedMessage id="options.title" />
        </span>
      </header>

      <main className="options-main">
        <section className="options-section">
          <h2 className="options-section__heading">
            🌐 <FormattedMessage id="options.language.heading" />
          </h2>

          <div className="lang-grid">
            {/* Auto option */}
            <LangCard
              value="auto"
              flag="🌐"
              nativeName={intl.formatMessage({ id: 'options.language.auto' })}
              subLabel={autoSubLabel}
              selected={setting === 'auto'}
              onSelect={handleSelect}
            />

            {/* Explicit locale options */}
            {SUPPORTED_LOCALES.map((meta) => (
              <LangCard
                key={meta.locale}
                value={meta.locale}
                flag={meta.flag}
                nativeName={meta.nativeName}
                subLabel={meta.englishName}
                selected={setting === meta.locale}
                onSelect={handleSelect}
              />
            ))}
          </div>

          <SavedToast visible={toastVisible} />
        </section>
      </main>
    </div>
  );
}
