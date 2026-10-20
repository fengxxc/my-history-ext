/**
 * English messages
 */
const en = {
  // Popup – header
  'app.title': 'My History',
  'app.openCalendar': 'Calendar',

  // Popup – search
  'search.placeholder': 'Search history...',
  'search.button': 'Search',

  // Popup – status
  'status.loading': 'Loading...',
  'status.empty': 'No history found.',
  'history.unknownTime': 'Unknown',

  // Calendar
  'calendar.title': 'Calendar',
  'calendar.year.label': 'Year',
  'calendar.today.button': 'Today',

  // Options
  'app.openOptions': 'Settings',
  'options.title': 'Settings',
  'options.language.heading': 'Display Language',
  'options.language.auto': 'Auto (follow browser)',
  'options.language.saved': 'Saved!',

  // Options – calendar
  'options.viewRows.heading': 'Calendar Rows',
  'options.viewRows.label': 'Rows visible at once',
  'options.viewRows.sub': 'Week rows shown in the calendar viewport',

  // Options – theme
  'options.theme.heading': 'Appearance',
  'options.theme.auto':  'Auto',
  'options.theme.light': 'Light',
  'options.theme.dark':  'Dark',
  'options.theme.auto.sub':  'Follow system',
  'options.theme.light.sub': 'Always light',
  'options.theme.dark.sub':  'Always dark',
} as const;

export type MessageKey = keyof typeof en;
export default en;
