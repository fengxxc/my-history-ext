import React from 'react';
import FreeCalendar, {
  CalendarUtil,
  type WheelTypeType,
} from 'react-free-calendar';
import { FormattedDate, FormattedMessage, useIntl } from '@/src/i18n';
import { useCSSVariable } from '@/src/theme';
import { joinUrl, listHistories, type HistoryRecord } from '@/src/db';
import { useViewRows, useShowWeekNumber } from '@/src/calendar-settings';
import {
  ThemePickerContent,
  LanguagePickerContent,
  ViewRowsStepperContent,
  ShowWeekNumberToggleContent,
} from '@/src/settings-ui';
import { Icon } from '@/src/components/Icon';

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
  const [viewRows] = useViewRows();
  const [showWeekNumber] = useShowWeekNumber();

  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(1);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ignore = false;
    const startTime = new Date(viewYear, viewMonth - 2, 1).getTime();
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
        <div className="calendar-toolbar-part">
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
            <button
              className="btn btn--default"
              onClick={() => {
                const today = new Date();
                setViewYear(today.getFullYear());
                setFixedDate(today);
              }}
            >
              <FormattedMessage id="calendar.today.button" />
            </button>
          </div>
        </div>
        <div className="calendar-toolbar-part">
          <div className="calendar-toolbar__control">
            <CalendarSettingsButton />
          </div>
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
          showWeekNumber={showWeekNumber}
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

// ─── Calendar settings popup ──────────────────────────────────────────────────
// Three sections mirroring the options page, sharing the same content components.

const CalendarSettingsPopup: React.FC = () => {
  const intl = useIntl();
  return (
    <div className="cal-settings-popup scrollbar">

      <div className="cal-settings-section">
        <h3 className="cal-settings-popup__heading">
          <Icon name="palette" size={18} /> <FormattedMessage id="options.theme.heading" />
        </h3>
        <ThemePickerContent gridClass="picker-grid--3" />
      </div>

      <div className="cal-settings-divider" />

      <div className="cal-settings-section">
        <h3 className="cal-settings-popup__heading">
          <Icon name="calendar" size={18} /> <FormattedMessage id="options.calendar.heading" />
        </h3>
        <p className="cal-settings-popup__desc">
          <FormattedMessage id="options.calendar.sub" />
        </p>
        <ViewRowsStepperContent />
        <hr className="settings-section-divider" />
        <p className="cal-settings-popup__desc">
          <FormattedMessage id="options.calendar.weekNumber.sub" />
        </p>
        <ShowWeekNumberToggleContent />
      </div>

      <div className="cal-settings-divider" />

      <div className="cal-settings-section">
        <h3 className="cal-settings-popup__heading">
          <Icon name="globe" size={18} /> <FormattedMessage id="options.language.heading" />
        </h3>
        <LanguagePickerContent />
      </div>

    </div>
  );
};

// ─── Settings button ──────────────────────────────────────────────────────────

const CalendarSettingsButton: React.FC = () => {
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
        <Icon name="settings" size={20} className={"settings-btn" + (open ? " settings-btn--active" : "")} />
      </button>
      {open && <CalendarSettingsPopup />}
    </div>
  );
};

// ─── History items ────────────────────────────────────────────────────────────

interface HistoryItem extends HistoryRecord { }

interface MyDateContentProps {
  date: Date;
  color: string;
  backgroundColor: string;
  showMonthAtFirstOfMonth?: boolean;
  onClick?: (date: Date) => void;
  datas: HistoryItem[];
}

const MyDateContent: React.FC<MyDateContentProps> = ({
  date,
  color,
  backgroundColor,
  showMonthAtFirstOfMonth,
  onClick,
  datas,
}) => {
  return (
    <div className="calendar-date-wrapper">
      <div
        className="calendar-date"
        style={{ backgroundColor, color }}
        onClick={() => onClick && onClick(date)}
      >
        {date.getDate() === 1 && showMonthAtFirstOfMonth && (
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
            <span className="url-item__time">
              {new Date(item.visitTime).toLocaleTimeString()}
            </span>
            <a
              href={joinUrl(item)}
              target="_blank"
              rel="noopener noreferrer"
              className="url-item__url"
              title={item.title}
            >
              {item.title || joinUrl(item)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
