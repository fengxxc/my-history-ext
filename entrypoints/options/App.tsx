import React, { useEffect, useState } from 'react';
import {
  FormattedMessage,
  useIntl,
  SUPPORTED_LOCALES,
  getStoredLocaleSetting,
  setStoredLocaleSetting,
  detectLocale,
} from '@/src/i18n';
import type { LocaleSetting, SupportedLocale } from '@/src/i18n';
import { THEME_OPTIONS, useTheme } from '@/src/theme';
import type { ThemeSetting } from '@/src/theme';
import { useViewRows, VIEW_ROWS_MIN, VIEW_ROWS_MAX } from '@/src/calendar-settings';

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

// ─── Generic picker card ──────────────────────────────────────────────────────
// Used for both language and theme pickers.

interface PickerCardProps {
  name: string;
  value: string;
  icon: string;
  label: string;
  subLabel: string;
  selected: boolean;
  onSelect: (v: string) => void;
}

function PickerCard({ name, value, icon, label, subLabel, selected, onSelect }: PickerCardProps) {
  return (
    <label className={`picker-card${selected ? ' picker-card--selected' : ''}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="picker-card__radio"
      />
      <span className="picker-card__icon">{icon}</span>
      <span className="picker-card__text">
        <span className="picker-card__label">{label}</span>
        <span className="picker-card__sub">{subLabel}</span>
      </span>
      {selected && <span className="picker-card__check">✓</span>}
    </label>
  );
}

// ─── Theme section ────────────────────────────────────────────────────────────

function ThemeSection() {
  const intl = useIntl();
  const [themeSetting, setTheme] = useTheme();

  return (
    <section className="options-section">
      <h2 className="options-section__heading">
        🎨 <FormattedMessage id="options.theme.heading" />
      </h2>
      <div className="picker-grid picker-grid--3">
        {THEME_OPTIONS.map(({ value, icon, labelKey }) => (
          <PickerCard
            key={value}
            name="theme"
            value={value}
            icon={icon}
            label={intl.formatMessage({ id: labelKey as string })}
            subLabel={intl.formatMessage({ id: `${labelKey}.sub` as string })}
            selected={themeSetting === value}
            onSelect={(v) => setTheme(v as ThemeSetting)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Language section ─────────────────────────────────────────────────────────

function LanguageSection() {
  const intl = useIntl();

  const [setting, setSetting] = useState<LocaleSetting>('auto');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

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

  const browserLocale: SupportedLocale = detectLocale();
  const browserMeta = SUPPORTED_LOCALES.find((m) => m.locale === browserLocale);
  const autoSubLabel = browserMeta
    ? `${browserMeta.flag} ${browserMeta.nativeName}`
    : browserLocale;

  return (
    <section className="options-section">
      <h2 className="options-section__heading">
        🌐 <FormattedMessage id="options.language.heading" />
      </h2>
      <div className="picker-grid">
        <PickerCard
          name="locale"
          value="auto"
          icon="🌐"
          label={intl.formatMessage({ id: 'options.language.auto' })}
          subLabel={autoSubLabel}
          selected={setting === 'auto'}
          onSelect={(v) => handleSelect(v as LocaleSetting)}
        />
        {SUPPORTED_LOCALES.map((meta) => (
          <PickerCard
            key={meta.locale}
            name="locale"
            value={meta.locale}
            icon={meta.flag}
            label={meta.nativeName}
            subLabel={meta.englishName}
            selected={setting === meta.locale}
            onSelect={(v) => handleSelect(v as LocaleSetting)}
          />
        ))}
      </div>
      <SavedToast visible={toastVisible} />
    </section>
  );
}

// ─── View rows section ───────────────────────────────────────────────────────

function ViewRowsSection() {
  const intl = useIntl();
  const [viewRows, setViewRows] = useViewRows();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const showToast = () => {
    setToastVisible(true);
    if (toastTimer) clearTimeout(toastTimer);
    const t = setTimeout(() => setToastVisible(false), 2000);
    setToastTimer(t);
  };

  const handleChange = async (next: number) => {
    await setViewRows(next);
    showToast();
  };

  return (
    <section className="options-section">
      <h2 className="options-section__heading">
        📅 <FormattedMessage id="options.viewRows.heading" />
      </h2>
      <p className="options-section__desc">
        <FormattedMessage id="options.viewRows.sub" />
      </p>
      <div className="view-rows-stepper">
        <button
          className="btn btn--default view-rows-stepper__btn"
          aria-label="decrease"
          disabled={viewRows <= VIEW_ROWS_MIN}
          onClick={() => handleChange(viewRows - 1)}
        >
          −
        </button>
        <span className="view-rows-stepper__value" aria-label={intl.formatMessage({ id: 'options.viewRows.label' })}>
          {viewRows}
        </span>
        <button
          className="btn btn--default view-rows-stepper__btn"
          aria-label="increase"
          disabled={viewRows >= VIEW_ROWS_MAX}
          onClick={() => handleChange(viewRows + 1)}
        >
          +
        </button>
      </div>
      <SavedToast visible={toastVisible} />
    </section>
  );
}

// ─── Main options page ────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="options-page">
      <header className="page-header options-header">
        <span className="page-header__icon">📜</span>
        <h1 className="page-header__title">My History</h1>
        <span className="page-header__subtitle">
          <FormattedMessage id="options.title" />
        </span>
      </header>

      <main className="options-main">
        <ThemeSection />
        <ViewRowsSection />
        <LanguageSection />
      </main>
    </div>
  );
}
