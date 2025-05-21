import React, { useMemo } from 'react';
import { format, parseISO, isSameDay, differenceInCalendarDays, startOfWeek, endOfWeek, max, min } from 'date-fns';

const ExperienceCalendar = ({ experiences }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const colorPalette = ['#F49D85', '#AEDFB4', '#F5D194', '#A3C3F6', '#D7BCE8', '#FFCBCB', '#F7F7A1'];

  const allDates = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const arr = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month, daysInMonth]);

  const weeks = useMemo(() => {
    const res = [];
    for (let i = 0; i < allDates.length; i += 7) {
      res.push(allDates.slice(i, i + 7));
    }
    return res;
  }, [allDates]);

  const announces = useMemo(() => {
    const map = {};
    experiences.forEach(exp => {
      if (!exp.announcementDate || exp.selected === true) return;
      const key = format(parseISO(exp.announcementDate), 'yyyy-MM-dd');
      map[key] = map[key] || [];
      map[key].push(exp.company);
    });
    return map;
  }, [experiences]);

  const events = useMemo(() => {
    const evs = [];
    experiences.forEach(exp => {
      if (!exp.selected || !exp.experienceStart || !exp.experienceEnd) return;
      const start = parseISO(exp.experienceStart);
      const end = parseISO(exp.experienceEnd);
      let hash = 0;
      for (let c of exp.company) hash = c.charCodeAt(0) + ((hash << 5) - hash);
      const index = Math.abs(hash) % colorPalette.length;
      const color = colorPalette[index];
      evs.push({ name: exp.company, start, end, color });
    });
    return evs;
  }, [experiences]);

  return (
    <div className="p-6 w-full max-w-[1100px] mx-auto bg-white rounded-2xl shadow-md border border-gray-200 font-[GmarketSansMedium]">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">📅 체험단 일정 캘린더</h2>

      <div className="grid grid-cols-7 border-t border-l">
        {weekDays.map((d, i) => (
          <div key={i} className="border-r border-b text-center font-semibold text-sm py-1.5 bg-gray-100 text-gray-700">
            {d}
          </div>
        ))}
      </div>

      {weeks.map((week, weekIdx) => {
        const weekStart = startOfWeek(week[0]);
        const weekEnd = endOfWeek(week[0]);

        const weekEvents = events
          .filter(ev => ev.end >= weekStart && ev.start <= weekEnd)
          .map(ev => {
            const barStart = max([ev.start, weekStart]);
            const barEnd = min([ev.end, weekEnd]);
            const offset = differenceInCalendarDays(barStart, weekStart);
            const span = differenceInCalendarDays(barEnd, barStart) + 1;
            return { ...ev, offset, span };
          });

        return (
          <React.Fragment key={weekIdx}>
            <div className="grid grid-cols-7 relative">
              {weekEvents.map((ev, i) => (
                <div
                  key={i}
                  className="absolute top-1 h-[1.2rem] rounded-full text-white text-[12px] font-medium px-2 shadow"
                  style={{
                    left: `${ev.offset * 14.2857}%`,
                    width: `${ev.span * 14.2857}%`,
                    backgroundColor: ev.color,
                    zIndex: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  🎉 {ev.name}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {week.map((date, colIdx) => {
                const dateStr = date ? format(date, 'yyyy-MM-dd') : null;
                const isToday = date && isSameDay(date, today);
                return (
                  <div
                    key={colIdx}
                    className={`relative border-r border-b p-1 text-[12px] font-medium bg-white flex flex-col gap-[2px] min-h-[80px] ${
                      isToday ? 'bg-[#f8f8f8]' : ''
                    }`}
                  >
                    {date && (
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-800">{date.getDate()}</span>
                        {isToday && <span className="text-[11px] text-gray-400 font-medium">오늘</span>}
                      </div>
                    )}
                    {dateStr && announces[dateStr]?.map((c, j) => (
                      <div
                        key={j}
                        style={{
                          backgroundColor: '#F0F0F0',
                          height: '1rem',
                          lineHeight: '1rem',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#333',
                          borderRadius: '9999px',
                          padding: '0 6px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          zIndex: 1
                        }}
                      >
                        📢 {c}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ExperienceCalendar;
