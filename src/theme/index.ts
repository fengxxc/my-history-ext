/**
 * Theme module
 *
 * Mirrors the i18n module pattern.  The three settings map directly to the
 * `data-theme` attribute on `<html>`, which CSS uses to switch palettes:
 *
 *   auto  → respects `@media (prefers-color-scheme: dark)` — default
 *   light → always light
 *   dark  → always dark
 *
 * ## Anti-FOUC strategy
 * `browser.storage.sync` is async, so we use `localStorage` as a zero-latency
 * cache.  Call `initTheme()` synchronously in `main.tsx` *before* the first
 * React render; the correct `data-theme` attribute is set in microseconds,
 * before any paint occurs.  The ThemeProvider later reconciles with
 * `storage.sync` and keeps both stores in sync.
 */

import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemeSetting = 'auto' | 'light' | 'dark';

export interface ThemeMeta {
  value: ThemeSetting;
  /** Emoji icon shown in the picker card */
  icon: string;
  /** i18n message key for the card label */
  labelKey: string;
}

export const THEME_OPTIONS: ThemeMeta[] = [
  { value: 'auto',  icon: '🌓', labelKey: 'options.theme.auto'  },
  { value: 'light', icon: '☀️', labelKey: 'options.theme.light' },
  { value: 'dark',  icon: '🌙', labelKey: 'options.theme.dark'  },
];

// ─── Storage keys ─────────────────────────────────────────────────────────────

/** Key used in `browser.storage.sync` for cross-device persistence. */
export const THEME_STORAGE_KEY = 'userTheme';

/**
 * Key used in `localStorage` for synchronous, zero-latency reads on startup.
 * Must stay in sync with `THEME_STORAGE_KEY` value via the ThemeProvider.
 */
const THEME_LS_KEY = 'ext-theme';

// ─── DOM application ──────────────────────────────────────────────────────────

/**
 * Write `setting` to `document.documentElement.dataset.theme`.
 * Also keeps `color-scheme` in sync so native browser UI (inputs, scrollbars)
 * renders correctly without extra CSS.
 *
 * This is a pure DOM operation — no React, no async.
 */
export function applyTheme(setting: ThemeSetting): void {
  const root = document.documentElement;
  root.dataset.theme = setting;
}

// ─── Synchronous init (call before ReactDOM.render) ───────────────────────────

/**
 * Read the cached theme from `localStorage` and apply it immediately.
 * Falls back to `'auto'` when no cache exists (first launch).
 *
 * Call this once at the top of every `main.tsx`, before `createRoot().render()`.
 */
export function initTheme(): void {
  const cached = localStorage.getItem(THEME_LS_KEY) as ThemeSetting | null;
  applyTheme(cached ?? 'auto');
}

// ─── Async storage helpers ────────────────────────────────────────────────────

/** Read the persisted theme setting from `storage.sync`. */
export async function getStoredThemeSetting(): Promise<ThemeSetting | null> {
  try {
    const result = await browser.storage.sync.get(THEME_STORAGE_KEY);
    const value = result[THEME_STORAGE_KEY] as string | undefined;
    if (value === 'auto' || value === 'light' || value === 'dark') return value;
  } catch {
    // storage unavailable (unit-test / dev environment)
  }
  return null;
}

/** Persist the theme setting to both `storage.sync` and `localStorage`. */
export async function setStoredThemeSetting(setting: ThemeSetting): Promise<void> {
  // localStorage first — instant, synchronous
  localStorage.setItem(THEME_LS_KEY, setting);
  try {
    await browser.storage.sync.set({ [THEME_STORAGE_KEY]: setting });
  } catch {
    // storage unavailable
  }
}

// ─── React hook ───────────────────────────────────────────────────────────────

/**
 * Returns the current theme setting and a setter that persists the choice.
 * Automatically reacts to changes made by other extension pages.
 */
export function useTheme(): [ThemeSetting, (s: ThemeSetting) => Promise<void>] {
  const [setting, setSetting] = useState<ThemeSetting>(
    // Initialise from localStorage for a synchronous starting value.
    () => (localStorage.getItem(THEME_LS_KEY) as ThemeSetting | null) ?? 'auto',
  );

  useEffect(() => {
    // Reconcile with storage.sync on mount.
    getStoredThemeSetting().then((stored) => {
      if (stored) setSetting(stored);
    });

    // React to changes from other extension pages (options → popup, etc.).
    const handler = (
      changes: Record<string, { newValue?: unknown }>,
      area: string,
    ) => {
      if (area !== 'sync' || !(THEME_STORAGE_KEY in changes)) return;
      const next = changes[THEME_STORAGE_KEY]?.newValue as ThemeSetting | undefined;
      if (next) {
        setSetting(next);
        applyTheme(next);
        localStorage.setItem(THEME_LS_KEY, next);
      }
    };

    browser.storage.onChanged.addListener(handler);
    return () => browser.storage.onChanged.removeListener(handler);
  }, []);

  const set = async (next: ThemeSetting) => {
    setSetting(next);
    applyTheme(next);
    await setStoredThemeSetting(next);
  };

  return [setting, set];
}

// ─── CSS Variable hook ───────────────────────────────────────────────────────

/**
 * Reactively reads a CSS custom property from `:root`.
 * Automatically re-renders when `data-theme` changes or the system
 * switches between light / dark mode.
 *
 * @example
 * const primary = useCSSVariable('--color-primary'); // e.g. "#1a73e8"
 */
export function useCSSVariable(variable: string): string {
  const get = () =>
    getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

  const [value, setValue] = useState(get);

  useEffect(() => {
    const update = () => setValue(get());

    // Re-read when data-theme attribute changes (manual theme switch)
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Re-read when the OS switches between light / dark mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', update);

    return () => {
      observer.disconnect();
      mq.removeEventListener('change', update);
    };
  }, [variable]);

  return value;
}

// ─── ThemeProvider ──────────────────────────────────────────────────────────────────────────────

/**
 * Invisible provider that reconciles `data-theme` with `storage.sync` and
 * keeps all open extension pages in sync via the storage change listener.
 *
 * Renders no DOM of its own — purely a side-effect host.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Reconcile with storage.sync on mount.
    getStoredThemeSetting().then((stored) => {
      const setting = stored ?? 'auto';
      localStorage.setItem(THEME_LS_KEY, setting);
      applyTheme(setting);
    });

    // Propagate changes from other extension pages in real time.
    const handler = (
      changes: Record<string, { newValue?: unknown }>,
      area: string,
    ) => {
      if (area !== 'sync' || !(THEME_STORAGE_KEY in changes)) return;
      const next = changes[THEME_STORAGE_KEY]?.newValue as ThemeSetting | undefined;
      if (next) {
        localStorage.setItem(THEME_LS_KEY, next);
        applyTheme(next);
      }
    };

    browser.storage.onChanged.addListener(handler);
    return () => browser.storage.onChanged.removeListener(handler);
  }, []);

  return React.createElement(React.Fragment, null, children);
}
