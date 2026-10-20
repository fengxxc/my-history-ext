import React from 'react';
import { FormattedMessage } from '@/src/i18n';
import { Icon } from '@/src/components/Icon';
import {
  ThemePickerContent,
  LanguagePickerContent,
  ViewRowsStepperContent,
  ShowWeekNumberToggleContent,
} from '@/src/settings-ui';

// ─── Section wrappers ─────────────────────────────────────────────────────────
// Each section card is options-page-specific layout only.
// The actual interactive content lives in src/settings-ui.

function ThemeSection() {
  return (
    <section className="options-section">
      <h2 className="options-section__heading">
        <Icon name="palette" size={18} />
        <FormattedMessage id="options.theme.heading" />
      </h2>
      <ThemePickerContent gridClass="picker-grid--3" />
    </section>
  );
}

function ViewRowsSection() {
  return (
    <section className="options-section">
      <h2 className="options-section__heading">
        <Icon name="calendar" size={18} />
        <FormattedMessage id="options.calendar.heading" />
      </h2>
      <p className="options-section__desc">
        <FormattedMessage id="options.calendar.sub" />
      </p>
      <ViewRowsStepperContent />
      <hr className="settings-section-divider" />
      <p className="options-section__desc">
        <FormattedMessage id="options.calendar.weekNumber.sub" />
      </p>
      <ShowWeekNumberToggleContent />
    </section>
  );
}

function LanguageSection() {
  return (
    <section className="options-section">
      <h2 className="options-section__heading">
        <Icon name="globe" size={18} />
        <FormattedMessage id="options.language.heading" />
      </h2>
      <LanguagePickerContent />
    </section>
  );
}

// ─── Main options page ────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="options-page">
      <header className="page-header options-header">
        <Icon name="history" size={22} className="page-header__icon" />
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
