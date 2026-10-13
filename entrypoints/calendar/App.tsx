import React from 'react';
import FreeCalendar, {
  SimpleOneDayContent,
  CalendarUtil,
  type WheelTypeType,
} from "react-free-calendar";

export default function App() {
  const [year, setYear] = React.useState(new Date().getFullYear());
  return (
    <div className="container">
      <div style={{ flexShrink: 0  }}>
        <h1>Calendar</h1>
        <input
          type="number"
          value={year}
          onChange={(e) => {
            const year = parseInt(e.target.value);
            if (!isNaN(year)) {
              setYear(year);
            }
          }}
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, textAlign: "left" }}>
        <FreeCalendar
          wheelType={"native" as WheelTypeType}
          id={"test-free-calendar"}
          start={new Date(year, 0, 1)}
          end={CalendarUtil.getMonthLastDay(
            new Date(year, 11, 1),
          )}
          mondayIsFirstAtWeek={true}
          DateContent={({ date, active }) => (
            <SimpleOneDayContent
              date={date}
              color={
                active || CalendarUtil.isToday(date)
                  ? "white"
                  : "inherit"
              }
              backgroundColor={
                active
                  ? "blue"
                  : CalendarUtil.isToday(date)
                    ? "lightblue"
                    : "inhert"
              }
              showMonthAtFirstOfMonth={true}
              onClick={
                (/* date: Date */) => {
                  // onClick(date)
                  // setFixedDate(date)
                }
              }
            />
          )}
          //   headerStyle={{marginRight: "0.4rem"}}
          datesWrapper={(children, ref) => (
            <div ref={ref} className="scrollbar">
              {children}
            </div>
          )}
          weekNameFormat={(d: Date) =>
            ["日", "一", "二", "三", "四", "五", "六"][d.getDay()] as string
          }
        />
      </div>
    </div>
  );
}
