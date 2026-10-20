/**
 * 한국어 메시지
 */
const ko = {
  // Popup – 헤더
  'app.title': '내 방문 기록',
  'app.openCalendar': '달력',

  // Popup – 검색
  'search.placeholder': '방문 기록 검색...',
  'search.button': '검색',

  // Popup – 상태
  'status.loading': '불러오는 중...',
  'status.empty': '방문 기록이 없습니다.',
  'history.unknownTime': '알 수 없음',

  // 달력
  'calendar.title': '달력',
  'calendar.year.label': '연도',
  'calendar.today.button': '오늘',

  // 설정
  'app.openOptions': '설정',
  'options.title': '설정',
  'options.language.heading': '표시 언어',
  'options.language.auto': '자동 (브라우저 언어 사용)',
  'options.language.saved': '저장되었습니다!',

  // 설정 – 달력
  'options.calendar.heading': '달력',
  'options.calendar.label': '한 번에 표시할 행 수',
  'options.calendar.sub': '달력 화면에 표시할 주 행 수',
  'options.calendar.weekNumber.label': '주 번호 표시',
  'options.calendar.weekNumber.sub': '달력에 ISO 주 번호를 표시합니다',

  // 설정 – 외관
  'options.theme.heading': '외관',
  'options.theme.auto':  '자동',
  'options.theme.light': '라이트',
  'options.theme.dark':  '다크',
  'options.theme.auto.sub':  '시스템 설정 사용',
  'options.theme.light.sub': '항상 라이트',
  'options.theme.dark.sub':  '항상 다크',
} as const;

export default ko;
