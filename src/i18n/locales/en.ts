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

  // Options
  'app.openOptions': 'Settings',
  'options.title': 'Settings',
  'options.language.heading': 'Display Language',
  'options.language.auto': 'Auto (follow browser)',
  'options.language.saved': 'Saved!',
} as const;

export type MessageKey = keyof typeof en;
export default en;
