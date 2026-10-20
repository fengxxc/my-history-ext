import React from 'react';
import FreeCalendar, {
  SimpleOneDayContent,
  CalendarUtil,
  type WheelTypeType,
  type DateContentProps,
} from 'react-free-calendar';
import { FormattedDate, FormattedMessage, useIntl } from '@/src/i18n';
import { useCSSVariable } from '@/src/theme';
import { joinUrl, listHistories, type HistoryRecord } from '@/src/db';
import { useViewRows, VIEW_ROWS_MIN, VIEW_ROWS_MAX } from '@/src/calendar-settings';

/** 从 IndexedDB 读取指定时间区间的访问记录 */
const fetchHistory = async (startTime: number, endTime: number): Promise<HistoryItem[]> => {
  return listHistories({ start: startTime, end: endTime, limit: Infinity });
};

export default function App() {
  const intl = useIntl();
  const colorPrimary = useCSSVariable('--color-primary');
  const colorOnPrimary = useCSSVariable('--color-on-primary');

  const [fixedDate, setFixedDate] = useState(() => new Date());
  const fixedProp = useMemo(() => ({ date: fixedDate, smooth: true }), [fixedDate]);
  const [viewRows, setViewRows] = useViewRows();

  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());

  const [viewMonth, setViewMonth] = useState(1);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ignore = false;
    // 计算当前视图的时间范围（上个月的第一天到下个月的最后一天）
    const startTime = new Date(viewYear, viewMonth - 1 - 1, 1).getTime();
    const endTime = new Date(viewYear, viewMonth + 1, 1).getTime() - 1;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);
        const history = await fetchHistory(startTime, endTime);
        if (!ignore) setHistoryItems(history);
      } catch (err: unknown) {
        console.error('Failed to fetch history:', err);
        if (!ignore) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadHistory();
    return () => { ignore = true; };
  }, [viewMonth]);

  return (
    <div className="calendar-container">
      <div className="calendar-toolbar">
        <div className="calendar-toolbar-part" >
          <h1 className="calendar-toolbar__title">
            <FormattedMessage id="calendar.title" />
          </h1>
          <div className="calendar-toolbar__control">
            <label htmlFor="year-input">
              <FormattedMessage id="calendar.year.label" />
              {': '}
            </label>
            <input
              id="year-input"
              type="number"
              min={1970}
              max={new Date().getFullYear()}
              step={1}
              value={viewYear}
              onChange={(e) => {
                const y = parseInt(e.target.value);
                if (!isNaN(y)) setViewYear(y);
              }}
              className="calendar-toolbar__year-input"
            />
          </div>
          <div className="calendar-toolbar__control">
            <button className="btn btn--default" onClick={() => {
              const today = new Date();
              setViewYear(today.getFullYear());
              setFixedDate(today);
            }}>
              <FormattedMessage id="calendar.today.button" />
            </button>
          </div>
        </div>
        <div className="calendar-toolbar-part">
          <CalendarSettingsButton viewRows={viewRows} setViewRows={setViewRows} />
        </div>
      </div>

      <div className="calendar-body">
        <FreeCalendar
          wheelType={'native' as WheelTypeType}
          id={'my-history-calendar'}
          start={new Date(viewYear, 0, 1)}
          end={CalendarUtil.getMonthLastDay(new Date(viewYear, 11, 1))}
          mondayIsFirstAtWeek={true}
          DateContent={({ date, active }) => (
            <MyDateContent
              date={date}
              color={active || CalendarUtil.isToday(date) ? colorOnPrimary : 'inherit'}
              backgroundColor={
                active ? colorPrimary : CalendarUtil.isToday(date) ? colorPrimary : 'inherit'
              }
              showMonthAtFirstOfMonth={true}
              onClick={() => { }}
              datas={historyItems.filter((item) => {
                if (item.visitTime == null) return false;
                const itemDate = new Date(item.visitTime);
                return (
                  itemDate.getFullYear() === date.getFullYear() &&
                  itemDate.getMonth() === date.getMonth() &&
                  itemDate.getDate() === date.getDate()
                );
              })}
            />
          )}
          fixed={fixedProp}
          viewRows={viewRows}
          datesWrapper={(children, ref) => (
            <div ref={ref} className="scrollbar">
              {children}
            </div>
          )}
          weekNameFormat={(d: Date) => <FormattedDate value={d} weekday="short" />}
          monthTagNameFormat={(d: Date) => <FormattedDate value={d} month="short" />}
          monthTagsWrapper={(children) => <nav className="calendar-month-tags">{children}</nav>}
          monthTagActiveColor={colorPrimary}
          onMonthChange={(_, month) => {
            setViewMonth(month);
          }}
        />
      </div>
    </div>
  );
}

// ─── Calendar settings button & popup ───────────────────────────────────────

interface ViewRowsPopupProps {
  viewRows: number;
  setViewRows: (n: number) => Promise<void>;
}

const ViewRowsPopup: React.FC<ViewRowsPopupProps> = ({ viewRows, setViewRows }) => {
  const intl = useIntl();
  return (
    <div className="cal-settings-popup">
      <h3 className="cal-settings-popup__heading">
        📅 <FormattedMessage id="options.viewRows.heading" />
      </h3>
      <p className="cal-settings-popup__desc">
        <FormattedMessage id="options.viewRows.sub" />
      </p>
      <div className="view-rows-stepper">
        <button
          className="btn btn--default view-rows-stepper__btn"
          aria-label={intl.formatMessage({ id: 'calendar.viewRows.decrease' })}
          disabled={viewRows <= VIEW_ROWS_MIN}
          onClick={() => setViewRows(viewRows - 1)}
        >
          −
        </button>
        <span
          className="view-rows-stepper__value"
          aria-label={intl.formatMessage({ id: 'options.viewRows.label' })}
        >
          {viewRows}
        </span>
        <button
          className="btn btn--default view-rows-stepper__btn"
          aria-label={intl.formatMessage({ id: 'calendar.viewRows.increase' })}
          disabled={viewRows >= VIEW_ROWS_MAX}
          onClick={() => setViewRows(viewRows + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
};

interface CalendarSettingsButtonProps {
  viewRows: number;
  setViewRows: (n: number) => Promise<void>;
}

const CalendarSettingsButton: React.FC<CalendarSettingsButtonProps> = ({ viewRows, setViewRows }) => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="cal-settings-anchor" ref={anchorRef}>
      <button
        className="btn btn--icon-ghost"
        aria-label={intl.formatMessage({ id: 'options.title' })}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⚙️
      </button>
      {open && <ViewRowsPopup viewRows={viewRows} setViewRows={setViewRows} />}
    </div>
  );
};

interface HistoryItem extends HistoryRecord {
  // Add any additional properties specific to your application
}

interface MyDateContentProps {
  date: Date;
  color: string;
  backgroundColor: string;
  showMonthAtFirstOfMonth?: boolean;
  onClick?: (date: Date) => void;
  datas: HistoryItem[];
}
const MyDateContent: React.FC<MyDateContentProps> = ({ date, color, backgroundColor, showMonthAtFirstOfMonth, onClick, datas }) => {

  return (
    <div className="calendar-date-wrapper">
      <div
        className="calendar-date"
        style={{ backgroundColor, color }}
        onClick={() => onClick && onClick(date)}
      >
        {date.getDate() == 1 && showMonthAtFirstOfMonth && (
          <>
            <strong>{date.getMonth() + 1}</strong>
            <span>/</span>
          </>
        )}
        {date.getDate()}
      </div>

      <ul className="calendar-date-content scrollbar">
        {datas.map((item) => (
          <li key={item.id} className="url-item">
            <span className="url-item__time">{new Date(item.visitTime).toLocaleTimeString()}</span>
            <a href={joinUrl(item)} target="_blank" rel="noopener noreferrer" className="url-item__url" title={item.title}>
              {item.title || joinUrl(item)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
