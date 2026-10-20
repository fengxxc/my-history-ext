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
  'options.calendar.heading': 'Calendar',
  'options.calendar.label': 'Rows visible at once',
  'options.calendar.sub': 'Week rows shown in the calendar viewport',
  'options.calendar.weekNumber.label': 'Show week numbers',
  'options.calendar.weekNumber.sub': 'Display ISO week number in the calendar',
  'options.calendar.mondayFirst.label': 'Week starts on Monday',
  'options.calendar.mondayFirst.sub': 'Set Monday as the first day of the week',

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
