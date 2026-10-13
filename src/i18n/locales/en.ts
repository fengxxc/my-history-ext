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
  'calendar.weekdays': 'Sun,Mon,Tue,Wed,Thu,Fri,Sat',
} as const;

export type MessageKey = keyof typeof en;
export default en;
