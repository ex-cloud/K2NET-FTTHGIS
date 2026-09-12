import { useState, useMemo, useRef, useEffect, useCallback } from "react";

export type TimelineGranularity = "Month" | "Quarter" | "Year";

export interface TimelineMonth {
  year: number;
  monthIndex: number;
  name: string;
  shortName: string;
  weeks: number[];
  startMs: number;
  endMs: number;
}

export function useProjectTimeline() {
  const [granularity, setGranularity] = useState<TimelineGranularity>("Month");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const monthColWidth = granularity === "Month" ? 180 : granularity === "Quarter" ? 120 : 90;

  const { timelineMonths, startTimelineMs, endTimelineMs, totalTimelineMs } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startDate = new Date(currentYear, currentMonth - 6, 1);
    const endDate = new Date(currentYear, currentMonth + 18, 0, 23, 59, 59);

    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const totalMs = endMs - startMs;

    const months: TimelineMonth[] = [];
    let cur = new Date(startDate);

    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const MONTH_SHORTS = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    while (cur <= endDate) {
      const year = cur.getFullYear();
      const monthIndex = cur.getMonth();
      const mStart = new Date(year, monthIndex, 1).getTime();
      const mEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59).getTime();

      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const weeks: number[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dObj = new Date(year, monthIndex, day);
        if (dObj.getDay() === 1 || day === 1 || day === 15) {
          if (!weeks.includes(day)) weeks.push(day);
        }
      }
      weeks.sort((a, b) => a - b);

      months.push({
        year,
        monthIndex,
        name: MONTH_NAMES[monthIndex],
        shortName: MONTH_SHORTS[monthIndex],
        weeks: weeks.slice(0, 4),
        startMs: mStart,
        endMs: mEnd,
      });

      cur = new Date(year, monthIndex + 1, 1);
    }

    return { timelineMonths: months, startTimelineMs: startMs, endTimelineMs: endMs, totalTimelineMs: totalMs };
  }, []);

  const totalGridWidth = timelineMonths.length * monthColWidth;

  const [nowMs] = useState(() => Date.now());
  const todayLeftPx = useMemo(() => {
    if (nowMs < startTimelineMs || nowMs > endTimelineMs) return -1;
    const progress = (nowMs - startTimelineMs) / totalTimelineMs;
    return progress * totalGridWidth;
  }, [nowMs, startTimelineMs, endTimelineMs, totalTimelineMs, totalGridWidth]);

  const scrollToToday = useCallback((smooth = true) => {
    if (!scrollContainerRef.current || todayLeftPx < 0) return;
    const containerWidth = scrollContainerRef.current.clientWidth;
    const targetScrollLeft = todayLeftPx - containerWidth / 2 + 150;
    scrollContainerRef.current.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: smooth ? "smooth" : "auto",
    });
  }, [todayLeftPx]);

  useEffect(() => {
    const timer = setTimeout(() => scrollToToday(false), 80);
    return () => clearTimeout(timer);
  }, [scrollToToday, granularity]);

  const computeBarGeometry = useCallback((createdAt?: string, dueDate?: string) => {
    const defaultStart = createdAt ? new Date(createdAt).getTime() : nowMs - 14 * 86400000;
    const defaultEnd = dueDate ? new Date(dueDate).getTime() : defaultStart + 30 * 86400000;

    const clampedStart = Math.max(startTimelineMs, defaultStart);
    const clampedEnd = Math.min(endTimelineMs, Math.max(defaultEnd, clampedStart + 86400000));

    const leftFrac = (clampedStart - startTimelineMs) / totalTimelineMs;
    const widthFrac = (clampedEnd - clampedStart) / totalTimelineMs;

    const leftPx = Math.max(0, leftFrac * totalGridWidth);
    const widthPx = Math.max(48, widthFrac * totalGridWidth);

    return { leftPx, widthPx };
  }, [nowMs, startTimelineMs, endTimelineMs, totalTimelineMs, totalGridWidth]);

  return {
    granularity,
    setGranularity,
    scrollContainerRef,
    monthColWidth,
    timelineMonths,
    totalGridWidth,
    todayLeftPx,
    scrollToToday,
    computeBarGeometry,
  };
}
