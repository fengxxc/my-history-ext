import React from 'react';
import FreeCalendar, {
  SimpleOneDayContent,
  CalendarUtil,
  type WheelTypeType,
} from 'react-free-calendar';
import { FormattedMessage, useIntl } from '@/src/i18n';

export default function App() {
  const intl = useIntl();

  const [year, setYear] = React.useState(new Date().getFullYear());

  // "日,一,二,三,四,五,六"  or  "Sun,Mon,Tue,Wed,Thu,Fri,Sat"
  const weekdays = intl.formatMessage({ id: 'calendar.weekdays' }).split(',');

  return (
    <div className="container">
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: 6, margin: "0 45px 10px 45px" }}>
        <h1 style={{ display: 'inline-block', marginRight: 12 }}>
          <FormattedMessage id="calendar.title" />
        </h1>
        <div>
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
          />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, textAlign: 'left' }}>
        <FreeCalendar
          wheelType={'native' as WheelTypeType}
          id={'test-free-calendar'}
          start={new Date(year, 0, 1)}
          end={CalendarUtil.getMonthLastDay(new Date(year, 11, 1))}
          mondayIsFirstAtWeek={true}
          DateContent={({ date, active }) => (
            <SimpleOneDayContent
              date={date}
              color={active || CalendarUtil.isToday(date) ? 'white' : 'inherit'}
              backgroundColor={
                active ? 'blue' : CalendarUtil.isToday(date) ? 'lightblue' : 'inhert'
              }
              showMonthAtFirstOfMonth={true}
              onClick={() => { }}
            />
          )}
          datesWrapper={(children, ref) => (
            <div ref={ref} className="scrollbar">
              {children}
            </div>
          )}
          weekNameFormat={(d: Date) => weekdays[d.getDay()] ?? ''}
        />
      </div>
    </div>
  );
}
