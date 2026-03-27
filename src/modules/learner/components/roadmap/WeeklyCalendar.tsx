import React, { useMemo } from "react";
import { Sparkles } from "lucide-react";
import type { TimelineItem } from "../../services/timelineService";
import { WEEKDAY_LABELS } from "../../constants/roadmapConstants";
import CalendarCard from "./CalendarCard";

interface WeeklyCalendarProps {
  timelineItems: TimelineItem[];
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "  0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseTimelineItemDateToKey(rawDate: string): string | null {
  if (!rawDate) return null;

  const localDateMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (localDateMatch)
    return `${localDateMatch[1]}-${localDateMatch[2]}-${localDateMatch[3]}`;

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return formatDateKey(parsedDate);
}

function formatWeekdayHeader(date: Date) {
  const dayIndex = date.getDay(); // 0..6 (0 = Sunday)
  const label = WEEKDAY_LABELS[dayIndex] ?? "N/A";
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return { label, dateText: `${day}/${month}` };
}

function getStartOfCurrentWeekMonday(now: Date) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const dayIndex = date.getDay();
  const offsetToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
  date.setDate(date.getDate() + offsetToMonday);
  return date;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ timelineItems }) => {
  const startDate = getStartOfCurrentWeekMonday(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    return day;
  });

  const todayDateKey = formatDateKey(new Date());

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, TimelineItem[]>();
    for (const item of timelineItems ?? []) {
      const dateKey = parseTimelineItemDateToKey(item.date);
      if (!dateKey) continue;
      const currentItems = grouped.get(dateKey) ?? [];
      currentItems.push(item);
      grouped.set(dateKey, currentItems);
    }
    return grouped;
  }, [timelineItems]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 divide-x divide-gray-200">
        {weekDays.map((d) => {
          const { label, dateText } = formatWeekdayHeader(d);
          const dayKey = formatDateKey(d);
          const isToday = dayKey === todayDateKey;
          return (
            <div
              key={dayKey}
              className={`px-3 py-3 text-center ${isToday ? "bg-blue-50" : ""}`}
            >
              <div
                className={`text-xs font-bold ${isToday ? "text-blue-600" : "text-slate-600"}`}
              >
                {label}
              </div>
              <div className="mt-1 flex items-center justify-center">
                <span
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-extrabold ${
                    isToday
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-900"
                  }`}
                >
                  {dateText}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 min-h-[65vh] divide-x divide-gray-200">
        {weekDays.map((d) => {
          const dayKey = formatDateKey(d);
          const items = itemsByDate.get(dayKey) ?? [];
          return (
            <div key={dayKey} className="p-3 bg-white min-h-[550px]">
              <div className="flex flex-col gap-2 h-full">
                {items.length ? (
                  items.map((item, index) => (
                    <CalendarCard
                      key={`${item.date}-${item.title}-${index}`}
                      item={item}
                    />
                  ))
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center text-slate-400 select-none">
                    <Sparkles className="h-5 w-5 opacity-50" />
                    <div className="mt-2 text-xs font-medium opacity-80">
                      Chưa có hoạt động
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyCalendar;
