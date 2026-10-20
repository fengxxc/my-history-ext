/**
 * 日本語メッセージ
 */
const ja = {
  // Popup – ヘッダー
  'app.title': '閲覧履歴',
  'app.openCalendar': 'カレンダー',

  // Popup – 検索
  'search.placeholder': '履歴を検索...',
  'search.button': '検索',

  // Popup – ステータス
  'status.loading': '読み込み中...',
  'status.empty': '履歴が見つかりませんでした。',
  'history.unknownTime': '不明',

  // カレンダー
  'calendar.title': 'カレンダー',
  'calendar.year.label': '年',
  'calendar.today.button': '今日',

  // 設定
  'app.openOptions': '設定',
  'options.title': '設定',
  'options.language.heading': '表示言語',
  'options.language.auto': '自動（ブラウザに従う）',
  'options.language.saved': '保存しました！',

  // 設定 – カレンダー
  'options.calendar.heading': 'カレンダー',
  'options.calendar.label': '同時に表示する行数',
  'options.calendar.sub': 'カレンダーに表示する週行数',
  'options.calendar.weekNumber.label': '週番号を表示',
  'options.calendar.weekNumber.sub': 'カレンダーに ISO 週番号を表示する',
  'options.calendar.mondayFirst.label': '週の始まりを月曜日にする',
  'options.calendar.mondayFirst.sub': '月曜日を週の最初の日として設定します',

  // 設定 – 外観
  'options.theme.heading': '外観',
  'options.theme.auto':  '自動',
  'options.theme.light': 'ライト',
  'options.theme.dark':  'ダーク',
  'options.theme.auto.sub':  'システムに従う',
  'options.theme.light.sub': '常にライト',
  'options.theme.dark.sub':  '常にダーク',
} as const;

export default ja;
