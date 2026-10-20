/**
 * Calendar settings module
 *
 * Persists user-configurable calendar preferences to `browser.storage.sync`
 * so they survive browser restarts and sync across devices.
 *
 * Currently managed setting:
 *   viewRows – number of week-rows shown in the calendar viewport (default 5)
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
