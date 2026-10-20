/**
 * Shared settings UI components
 *
 * Exports self-contained "content" components for each setting panel.
 * Each component manages its own state via hooks and can be embedded in
 * any wrapper — options section cards or the calendar toolbar popup.
 *
 * Components exported:
 *   SavedToast            — animated "✓ Saved!" confirmation
 *   PickerCard            — generic radio-style selectable card
 *   ThemePickerContent    — grid of theme cards (auto / light / dark)
 *   LanguagePickerContent — grid of language cards + saved toast
 *   ViewRowsStepperContent — +/- stepper for calendar row count + saved toast
 */

import React, { useState, useEffect } from 'react';
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

export function SavedToast({ visible }: { visible: boolean }) {
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

export interface PickerCardProps {
  name: string;
  value: string;
  icon: string;
  label: string;
  subLabel: string;
  selected: boolean;
  onSelect: (v: string) => void;
}

export function PickerCard({ name, value, icon, label, subLabel, selected, onSelect }: PickerCardProps) {
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

// ─── Theme picker content ─────────────────────────────────────────────────────

interface ThemePickerContentProps {
  /** Extra CSS class(es) added to the picker grid wrapper, e.g. 'picker-grid--3' */
  gridClass?: string;
}

export function ThemePickerContent({ gridClass }: ThemePickerContentProps) {
  const intl = useIntl();
  const [themeSetting, setTheme] = useTheme();

  return (
    <div className={['picker-grid', gridClass].filter(Boolean).join(' ')}>
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
  );
}

// ─── Language picker content ──────────────────────────────────────────────────

export function LanguagePickerContent() {
  const intl = useIntl();
  const [setting, setSetting] = useState<LocaleSetting>('auto');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getStoredLocaleSetting().then((stored) => {
      setSetting(stored ?? 'auto');
    });
  }, []);

  const showToast = () => {
    setToastVisible(true);
    if (toastTimer) clearTimeout(toastTimer);
    const t = setTimeout(() => setToastVisible(false), 2000);
    setToastTimer(t);
  };

  const handleSelect = async (next: LocaleSetting) => {
    setSetting(next);
    await setStoredLocaleSetting(next);
    showToast();
  };

  const browserLocale: SupportedLocale = detectLocale();
  const browserMeta = SUPPORTED_LOCALES.find((m) => m.locale === browserLocale);
  const autoSubLabel = browserMeta
    ? `${browserMeta.flag} ${browserMeta.nativeName}`
    : browserLocale;

  return (
    <>
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
    </>
  );
}

// ─── View-rows stepper content ────────────────────────────────────────────────

export function ViewRowsStepperContent() {
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
    <>
      <div className="view-rows-stepper">
        <button
          className="btn btn--default view-rows-stepper__btn"
          aria-label="decrease"
          disabled={viewRows <= VIEW_ROWS_MIN}
          onClick={() => handleChange(viewRows - 1)}
        >
          −
        </button>
        <span
          className="view-rows-stepper__value"
          aria-label={intl.formatMessage({ id: 'options.viewRows.label' })}
        >
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
    </>
  );
}
