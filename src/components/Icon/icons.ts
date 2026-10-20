/**
 * SVG icon registry.
 *
 * Each entry is a tuple:
 *   [viewBox, pathsOrContent]
 *
 * Rules:
 *  - viewBox is always "0 0 24 24"
 *  - Use `fill="currentColor"` or `stroke="currentColor"` – never hard-coded colours.
 *  - Paths are raw SVG inner HTML strings (everything that goes inside <svg>…</svg>).
 */

export type IconName =
  | 'history'
  | 'calendar'
  | 'settings'
  | 'palette'
  | 'sunMoon'
  | 'sun'
  | 'moon'
  | 'globe'
  | 'search'
  | 'check'
  | 'chevronUp'
  | 'chevronDown'
  | 'chevronLeft'
  | 'chevronRight'
  | 'close'
  | 'external';

/** Map of icon name → inner SVG markup (viewBox is always "0 0 24 24"). */
export const icons: Record<IconName, string> = {

  // ── History (clock with counter-clockwise arrow) ─────────────────────────
  history: `
    <path fill="currentColor" d="M13 3a9 9 0 1 0 5.657 2.343l-1.414 1.414A7 7 0 1 1 13 5V3Z"/>
    <path fill="currentColor" d="M12 8a1 1 0 0 1 1 1v3.586l2.207 2.207a1 1 0 0 1-1.414 1.414l-2.5-2.5A1 1 0 0 1 11 13V9a1 1 0 0 1 1-1Z"/>
    <path fill="currentColor" d="M8.293 2.293a1 1 0 0 1 1.414 0L12 4.586l2.293-2.293a1 1 0 1 1 1.414 1.414L13 7.414a1 1 0 0 1-1.414 0L8.293 3.707a1 1 0 0 1 0-1.414Z"/>
  `,

  // ── Calendar ─────────────────────────────────────────────────────────────
  calendar: `
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"
          fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="16" y1="2" x2="16" y2="6"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="8" y1="2" x2="8" y2="6"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="3" y1="10" x2="21" y2="10"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  `,

  // ── Settings / gear ───────────────────────────────────────────────────────
  settings: `
    <path fill="none" stroke="currentColor" stroke-width="2" d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/>
    <circle fill="none" stroke="currentColor" stroke-width="2" cx="12" cy="12" r="3"/>
  `,

  // ── Palette / theme ───────────────────────────────────────────────────────
  palette: `
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/>
    <circle stroke="currentColor" stroke-width="2" cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
    <circle stroke="currentColor" stroke-width="2" cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
    <circle stroke="currentColor" stroke-width="2" cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
    <circle stroke="currentColor" stroke-width="2" cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
  `,
  // ── Sun / light mode ─────────────────────────────────────────────────────
  sunMoon: `
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 2v2"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 0 0-4-4"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m19 5-1.256 1.256"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M20 12h2"/>
  `,
  sun: `
    <circle fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" cx="12" cy="12" r="4"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 2v2"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 20v2"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m4.93 4.93 1.41 1.41"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m17.66 17.66 1.41 1.41"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M2 12h2"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M20 12h2"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m6.34 17.66-1.41 1.41"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m19.07 4.93-1.41 1.41"/>
  `,
  moon: `
  <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>
  `,

  // ── Globe / language ──────────────────────────────────────────────────────
  globe: `
    <circle cx="12" cy="12" r="9"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"/>
    <path fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"
          d="M3.6 9h16.8M3.6 15h16.8"/>
    <path fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"
          d="M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18"/>
  `,

  // ── Search / magnifying glass ─────────────────────────────────────────────
  search: `
    <circle cx="11" cy="11" r="7"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  `,

  // ── Check mark ───────────────────────────────────────────────────────────
  check: `
    <polyline points="20 6 9 17 4 12"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
  `,

  // ── Chevrons ─────────────────────────────────────────────────────────────
  chevronUp: `
    <polyline points="18 15 12 9 6 15"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
  `,

  chevronDown: `
    <polyline points="6 9 12 15 18 9"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
  `,

  chevronLeft: `
    <polyline points="15 18 9 12 15 6"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
  `,

  chevronRight: `
    <polyline points="9 18 15 12 9 6"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
  `,

  // ── Close / X ────────────────────────────────────────────────────────────
  close: `
    <line x1="18" y1="6" x2="6" y2="18"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="6" y1="6" x2="18" y2="18"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  `,

  // ── External link ─────────────────────────────────────────────────────────
  external: `
    <path fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"
          d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="10" y1="14" x2="21" y2="3"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  `,
};
