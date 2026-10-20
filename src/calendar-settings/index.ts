/**
 * Calendar settings module
 *
 * Persists user-configurable calendar preferences to `browser.storage.sync`
 * so they survive browser restarts and sync across devices.
 *
 * Currently managed settings:
 *   viewRows       – number of week-rows shown in the calendar viewport (default 5)
 *   showWeekNumber – whether to display ISO week numbers (default false)
 *   mondayFirst    – whether the week starts on Monday (default depends on locale)
 */

import { useState, useEffect } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

export const VIEW_ROWS_STORAGE_KEY = 'calendarViewRows';
export const VIEW_ROWS_DEFAULT = 5;
export const VIEW_ROWS_MIN = 1;
export const VIEW_ROWS_MAX = 6;

// ─── Async storage helpers ────────────────────────────────────────────────────

/** Read the persisted viewRows value from `storage.sync`. */
export async function getStoredViewRows(): Promise<number | null> {
  try {
    const result = await browser.storage.sync.get(VIEW_ROWS_STORAGE_KEY);
    const value = result[VIEW_ROWS_STORAGE_KEY];
    if (typeof value === 'number' && value >= VIEW_ROWS_MIN && value <= VIEW_ROWS_MAX) {
      return value;
    }
  } catch {
    // storage unavailable (unit-test / dev environment)
  }
  return null;
}

/** Persist the viewRows value to `storage.sync`. */
export async function setStoredViewRows(rows: number): Promise<void> {
  const clamped = Math.max(VIEW_ROWS_MIN, Math.min(VIEW_ROWS_MAX, Math.round(rows)));
  try {
    await browser.storage.sync.set({ [VIEW_ROWS_STORAGE_KEY]: clamped });
  } catch {
    // storage unavailable
  }
}

// ─── showWeekNumber ──────────────────────────────────────────────────────────

export const SHOW_WEEK_NUMBER_STORAGE_KEY = 'calendarShowWeekNumber';
export const SHOW_WEEK_NUMBER_DEFAULT = false;

/** Read the persisted showWeekNumber value from `storage.sync`. */
export async function getStoredShowWeekNumber(): Promise<boolean | null> {
  try {
    const result = await browser.storage.sync.get(SHOW_WEEK_NUMBER_STORAGE_KEY);
    const value = result[SHOW_WEEK_NUMBER_STORAGE_KEY];
    if (typeof value === 'boolean') return value;
  } catch {
    // storage unavailable (unit-test / dev environment)
  }
  return null;
}

/** Persist the showWeekNumber value to `storage.sync`. */
export async function setStoredShowWeekNumber(show: boolean): Promise<void> {
  try {
    await browser.storage.sync.set({ [SHOW_WEEK_NUMBER_STORAGE_KEY]: show });
  } catch {
    // storage unavailable
  }
}

// ─── mondayFirst ─────────────────────────────────────────────────────────────

export const MONDAY_FIRST_STORAGE_KEY = 'calendarMondayFirst';

/**
 * Returns the raw BCP-47 locale tag from the browser / OS (e.g. "en-US",
 * "en-GB", "zh-TW"). Unlike the app's SupportedLocale, this preserves the
 * region subtag, which is essential for distinguishing en-US from en-GB.
 */
function getRawBrowserLocale(): string {
  return (
    (typeof browser !== 'undefined' && browser.i18n?.getUILanguage?.()) ||
    navigator.language ||
    'en'
  );
}

// Augment Intl.Locale with the weekInfo API (Chrome 92+, Firefox 100+, Safari 15.4+).
// TypeScript's built-in lib does not yet include this property.
interface LocaleWithWeekInfo extends Intl.Locale {
  readonly weekInfo?: { firstDay: 1 | 6 | 7 }; // 1=Mon, 6=Sat, 7=Sun
}

/**
 * Returns true when Monday is the conventional first day of the week for the
 * given raw BCP-47 locale tag (e.g. "en-US", "en-GB", "zh-TW").
 *
 * Primary path — Intl.Locale.weekInfo (available in all modern browsers):
 *   Queries the browser's own CLDR data, so every region variant is handled
 *   correctly without any hardcoded lists.
 *
 * Fallback — hardcoded lists (older engines / invalid locale strings):
 *   Sunday-first: ja, ko, zh-TW, and English without a known Monday-first
 *   region tag (en without region defaults to Sunday-first, as en-US is the
 *   most common reference for bare "en").
 */
export function mondayFirstDefaultForLocale(rawLocale: string): boolean {
  // ── Primary: use Intl.Locale.weekInfo ────────────────────────────────────
  try {
    const loc = new Intl.Locale(rawLocale) as LocaleWithWeekInfo;
    if (loc.weekInfo) return loc.weekInfo.firstDay === 1;
  } catch {
    // invalid locale string — fall through to hardcoded fallback
  }

  // ── Fallback: hardcoded per-language / per-region rules ───────────────────
  const normalized = rawLocale.toLowerCase().replace('_', '-');
  const [lang = '', region = ''] = normalized.split('-');

  if (lang === 'en') {
    // Monday-first English-speaking regions
    const mondayFirstRegions = new Set(['gb', 'au', 'nz', 'ie', 'in', 'za']);
    return mondayFirstRegions.has(region);
    // bare "en" (no region) → false (Sunday, US convention as conservative default)
  }

  const sundayFirstLangs = new Set(['ja', 'ko']);
  if (sundayFirstLangs.has(lang)) return false;

  // Handle zh-TW / zh-HK / zh-MO as Sunday-first
  if (lang === 'zh' && ['tw', 'hk', 'mo'].includes(region)) return false;

  return true; // most other locales follow ISO 8601 (Monday-first)
}

/** Read the explicitly stored mondayFirst value from `storage.sync`. Returns null when not set. */
export async function getStoredMondayFirst(): Promise<boolean | null> {
  try {
    const result = await browser.storage.sync.get(MONDAY_FIRST_STORAGE_KEY);
    const value = result[MONDAY_FIRST_STORAGE_KEY];
    if (typeof value === 'boolean') return value;
  } catch {
    // storage unavailable (unit-test / dev environment)
  }
  return null;
}

/** Persist the mondayFirst value to `storage.sync`. */
export async function setStoredMondayFirst(monday: boolean): Promise<void> {
  try {
    await browser.storage.sync.set({ [MONDAY_FIRST_STORAGE_KEY]: monday });
  } catch {
    // storage unavailable
  }
}

// ─── React hook ───────────────────────────────────────────────────────────────

/**
 * Returns the current viewRows setting and a setter that persists the choice.
 * Automatically reacts to changes made by other extension pages (e.g. options → calendar).
 */
export function useViewRows(): [number, (rows: number) => Promise<void>] {
  const [rows, setRows] = useState<number>(VIEW_ROWS_DEFAULT);

  useEffect(() => {
    // Reconcile with storage.sync on mount.
    getStoredViewRows().then((stored) => {
      if (stored !== null) setRows(stored);
    });

    // React to changes from other extension pages.
    const handler = (
      changes: Record<string, { newValue?: unknown }>,
      area: string,
    ) => {
      if (area !== 'sync' || !(VIEW_ROWS_STORAGE_KEY in changes)) return;
      const next = changes[VIEW_ROWS_STORAGE_KEY]?.newValue;
      if (typeof next === 'number' && next >= VIEW_ROWS_MIN && next <= VIEW_ROWS_MAX) {
        setRows(next);
      }
    };

    browser.storage.onChanged.addListener(handler);
    return () => browser.storage.onChanged.removeListener(handler);
  }, []);

  const set = async (next: number) => {
    const clamped = Math.max(VIEW_ROWS_MIN, Math.min(VIEW_ROWS_MAX, Math.round(next)));
    setRows(clamped);
    await setStoredViewRows(clamped);
  };

  return [rows, set];
}

/**
 * Returns the current showWeekNumber setting and a setter that persists the choice.
 * Automatically reacts to changes made by other extension pages (e.g. options → calendar).
 */
export function useShowWeekNumber(): [boolean, (show: boolean) => Promise<void>] {
  const [show, setShow] = useState<boolean>(SHOW_WEEK_NUMBER_DEFAULT);

  useEffect(() => {
    // Reconcile with storage.sync on mount.
    getStoredShowWeekNumber().then((stored) => {
      if (stored !== null) setShow(stored);
    });

    // React to changes from other extension pages.
    const handler = (
      changes: Record<string, { newValue?: unknown }>,
      area: string,
    ) => {
      if (area !== 'sync' || !(SHOW_WEEK_NUMBER_STORAGE_KEY in changes)) return;
      const next = changes[SHOW_WEEK_NUMBER_STORAGE_KEY]?.newValue;
      if (typeof next === 'boolean') setShow(next);
    };

    browser.storage.onChanged.addListener(handler);
    return () => browser.storage.onChanged.removeListener(handler);
  }, []);

  const set = async (next: boolean) => {
    setShow(next);
    await setStoredShowWeekNumber(next);
  };

  return [show, set];
}

/**
 * Returns the current mondayFirst setting and a setter that persists the choice.
 *
 * When no value has been explicitly stored the default is derived from the
 * browser / OS locale (e.g. "en-US" → Sunday-first, "en-GB" → Monday-first).
 * Using the raw browser locale — rather than the app’s display locale —
 * preserves the region subtag that distinguishes regional week conventions.
 *
 * Automatically reacts to changes made by other extension pages.
 */
export function useMondayFirst(): [boolean, (monday: boolean) => Promise<void>] {
  // null = no explicit override stored; fall back to browser-locale default.
  const [storedOverride, setStoredOverride] = useState<boolean | null>(null);

  useEffect(() => {
    // Load explicit override from storage on mount.
    getStoredMondayFirst().then(setStoredOverride);

    // React to changes from other extension pages.
    const handler = (
      changes: Record<string, { newValue?: unknown }>,
      area: string,
    ) => {
      if (area !== 'sync' || !(MONDAY_FIRST_STORAGE_KEY in changes)) return;
      const next = changes[MONDAY_FIRST_STORAGE_KEY]?.newValue;
      // undefined newValue means the key was removed → fall back to locale default.
      setStoredOverride(typeof next === 'boolean' ? next : null);
    };

    browser.storage.onChanged.addListener(handler);
    return () => browser.storage.onChanged.removeListener(handler);
  }, []);

  // Explicit user override takes priority; otherwise derive from the raw browser
  // locale so that en-US and en-GB are distinguished correctly.
  const mondayFirst = storedOverride ?? mondayFirstDefaultForLocale(getRawBrowserLocale());

  const set = async (next: boolean) => {
    setStoredOverride(next);
    await setStoredMondayFirst(next);
  };

  return [mondayFirst, set];
}
