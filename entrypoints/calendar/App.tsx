import React from 'react';
import FreeCalendar, {
  SimpleOneDayContent,
  CalendarUtil,
  type WheelTypeType,
} from 'react-free-calendar';
import { FormattedDate, FormattedMessage, useIntl } from '@/src/i18n';
import { useCSSVariable } from '@/src/theme';

export default function App() {
  const intl = useIntl();
  const colorPrimary = useCSSVariable('--color-primary');
  const colorOnPrimary = useCSSVariable('--color-on-primary');

  const [year, setYear] = React.useState(new Date().getFullYear());
  const [toDate, setToDate] = React.useState(new Date());

  return (
    <div className="calendar-container">
      <div className="calendar-toolbar">
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
            value={year}
            onChange={(e) => {
              const y = parseInt(e.target.value);
              if (!isNaN(y)) setYear(y);
            }}
            className="calendar-toolbar__year-input"
          />
        </div>
        <div className="calendar-toolbar__control">
          <button className= "btn btn--default" onClick={() => {
            const today = new Date();
            setYear(today.getFullYear());
            setToDate(today);
          }}>
            <FormattedMessage id="calendar.today.button" />
          </button>
        </div>
      </div>

      <div className="calendar-body">
        <FreeCalendar
          wheelType={'native' as WheelTypeType}
          id={'test-free-calendar'}
          start={new Date(year, 0, 1)}
          end={CalendarUtil.getMonthLastDay(new Date(year, 11, 1))}
          mondayIsFirstAtWeek={true}
          DateContent={({ date, active }) => (
            <SimpleOneDayContent
              date={date}
              color={active || CalendarUtil.isToday(date) ? colorOnPrimary : 'inherit'}
              backgroundColor={
                active ? colorPrimary : CalendarUtil.isToday(date) ? colorPrimary : 'inherit'
              }
              showMonthAtFirstOfMonth={true}
              onClick={() => {}}
            />
          )}
          fixed={{ date: toDate, smooth: false }}
          datesWrapper={(children, ref) => (
            <div ref={ref} className="scrollbar">
              {children}
            </div>
          )}
          weekNameFormat={(d: Date) => <FormattedDate value={d} weekday="short" />}
          monthTagNameFormat={(d: Date) => <FormattedDate value={d} month="short" />}
          monthTagsWrapper={(children) => <nav className="calendar-month-tags">{children}</nav>}
          monthTagActiveColor={colorPrimary}
        />
      </div>
    </div>
  );
}
