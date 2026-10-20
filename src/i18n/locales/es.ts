/**
 * Mensajes en español
 */
const es = {
  // Popup – encabezado
  'app.title': 'Mi historial',
  'app.openCalendar': 'Calendario',

  // Popup – búsqueda
  'search.placeholder': 'Buscar en el historial...',
  'search.button': 'Buscar',

  // Popup – estado
  'status.loading': 'Cargando...',
  'status.empty': 'No se encontró historial.',
  'history.unknownTime': 'Desconocido',

  // Calendario
  'calendar.title': 'Calendario',
  'calendar.year.label': 'Año',
  'calendar.today.button': 'Hoy',

  // Configuración
  'app.openOptions': 'Configuración',
  'options.title': 'Configuración',
  'options.language.heading': 'Idioma de visualización',
  'options.language.auto': 'Automático (idioma del navegador)',
  'options.language.saved': '¡Guardado!',

  // Configuración – calendario
  'options.calendar.heading': 'Calendario',
  'options.calendar.label': 'Filas visibles a la vez',
  'options.calendar.sub': 'Filas de semana mostradas en el calendario',
  'options.calendar.weekNumber.label': 'Mostrar números de semana',
  'options.calendar.weekNumber.sub': 'Mostrar el número de semana ISO en el calendario',

  // Configuración – apariencia
  'options.theme.heading': 'Apariencia',
  'options.theme.auto':  'Automático',
  'options.theme.light': 'Claro',
  'options.theme.dark':  'Oscuro',
  'options.theme.auto.sub':  'Seguir el sistema',
  'options.theme.light.sub': 'Siempre claro',
  'options.theme.dark.sub':  'Siempre oscuro',
} as const;

export default es;
