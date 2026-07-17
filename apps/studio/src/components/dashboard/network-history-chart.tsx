import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Line,
  Scatter,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

// Types
export interface SnapshotPoint {
  time: string;
  activeNodes: number;
  downNodes: number;
  uptime: number;
  rawDate?: Date;
}

export interface NetworkEvent {
  id: number;
  assetCode: string;
  assetType: string;
  oldStatus: string;
  newStatus: string;
  eventType: string;
  timestamp: string;
}

export interface EventPoint {
  time: string;
  yValue: number;
  color: string;
  details: NetworkEvent;
}

export interface TimeRange {
  label: string;
  hours: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<Payload<ValueType, NameType>>;
  label?: string;
}

interface ScatterShapeProps {
  cx?: number;
  cy?: number;
  payload?: EventPoint;
}

// Constants
const TIME_RANGES: TimeRange[] = [
  { label: "Last 1H", hours: 1 },
  { label: "Last 6H", hours: 6 },
  { label: "Last 24H", hours: 24 },
  { label: "Last 7D", hours: 168 },
  { label: "Last 30D", hours: 720 },
];

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-xl min-w-[170px]">
      <p className="text-xs font-bold text-zinc-900 dark:text-white mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
        {label}
      </p>
      {payload
        .filter(
          (entry) => !["time", "yValue"].includes(entry.dataKey as string),
        )
        .map((entry, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 py-0.5"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color ?? "#71717a" }}
              />
              <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                {String(entry.name ?? "")}
              </span>
            </div>
            <span
              className="text-[11px] font-bold"
              style={{ color: entry.color ?? "#71717a" }}
            >
              {String(entry.name ?? "").includes("Uptime")
                ? `${Number(entry.value ?? 0).toFixed(2)}%`
                : Number(entry.value ?? 0).toLocaleString()}
            </span>
          </div>
        ))}

      {/* Event Tooltip Extra Info */}
      {(() => {
        const eventEntry = payload.find(
          (p) => (p.payload as EventPoint)?.details?.assetCode,
        );
        if (!eventEntry) return null;
        const det = (eventEntry.payload as EventPoint).details;
        return (
          <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] font-bold text-zinc-500">
              Event Details:
            </p>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-300">
              <span className="font-bold">{det.assetCode}</span>
              <span className="text-zinc-500 mx-1">({det.assetType})</span>
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] text-zinc-400 capitalize">
                {det.oldStatus}
              </span>
              <span className="text-[9px] text-zinc-400">→</span>
              <span
                className={`text-[10px] font-bold ${
                  ["UP", "ACTIVE", "RECOVERY"].includes(det.newStatus)
                    ? "text-primary"
                    : ["DOWN", "FIBERCUT", "BROKEN"].includes(det.newStatus)
                      ? "text-rose-500"
                      : "text-amber-500"
                }`}
              >
                {det.newStatus}
              </span>
            </div>
            <p className="text-[9px] text-zinc-400 mt-1">
              {new Date(det.timestamp).toLocaleTimeString()}
            </p>
          </div>
        );
      })()}
    </div>
  );
}

interface NetworkHistoryChartProps {
  historyData: SnapshotPoint[];
  eventData: EventPoint[];
  historyLoading: boolean;
  selectedRange: TimeRange;
  setSelectedRange: (range: TimeRange) => void;
  fetchHistory: (hours: number) => void;
  fetchHistoryByDateRange: (from: string, to: string) => void;
  zoomState: { left: number; right: number };
  setZoomState: React.Dispatch<React.SetStateAction<{ left: number; right: number }>>;
}

export function NetworkHistoryChart({
  historyData,
  eventData,
  historyLoading,
  selectedRange,
  setSelectedRange,
  fetchHistory,
  fetchHistoryByDateRange,
  zoomState,
  setZoomState,
}: NetworkHistoryChartProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarFrom, setCalendarFrom] = useState("");
  const [calendarTo, setCalendarTo] = useState("");
  const [hoveredAssetCode, setHoveredAssetCode] = useState<string | null>(null);

  const isDraggingRef = useRef(false);
  const lastClientXRef = useRef(0);
  const calendarRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Derived: filter event data to only visible zoom range
  const visibleEventData = (() => {
    const slice = historyData.slice(zoomState.left, zoomState.right + 1);
    const timeSet = new Set(slice.map((p) => p.time));
    return eventData.filter((e) => timeSet.has(e.time));
  })();

  // Click outside calendar to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(e.target as Node)
      ) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Non-passive wheel handler for scroll-to-zoom
  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el || historyData.length === 0) return;

    const len = historyData.length;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const ZOOM_SPEED = 2;
      const delta = Math.sign(e.deltaY) * ZOOM_SPEED;

      setZoomState((prev) => {
        let { left, right } = prev;

        if (delta < 0) {
          // Zoom In
          const range = right - left;
          if (range < 5) return prev;
          left = Math.min(len - 5, Math.max(0, left + 1));
          right = Math.max(left + 5, Math.min(len - 1, right - 1));
        } else {
          // Zoom Out
          left = Math.max(0, left - 1);
          right = Math.min(len - 1, right + 1);
        }
        return { left, right };
      });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [historyData.length, setZoomState]);

  return (
    <div className="lg:col-span-2 bg-white/60 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/50 rounded-xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none relative overflow-hidden">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          NODE STATUS HISTORY
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time range pills */}
          {TIME_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => {
                setSelectedRange(range);
                fetchHistory(range.hours);
              }}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                selectedRange.label === range.label
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {range.label}
            </button>
          ))}

          {/* Calendar button */}
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              title="Pick date range"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>

            {showCalendar && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-2xl min-w-[280px]">
                <p className="text-xs font-bold text-zinc-900 dark:text-white mb-3">
                  Custom Date Range
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={calendarFrom}
                      onChange={(e) => setCalendarFrom(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={calendarTo}
                      onChange={(e) => setCalendarTo(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <button
                    onClick={() => {
                      fetchHistoryByDateRange(calendarFrom, calendarTo);
                      setShowCalendar(false);
                    }}
                    disabled={!calendarFrom || !calendarTo}
                    className="w-full py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-0.5 bg-emerald-500" />
          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
            ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-0.5 bg-rose-500" />
          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
            DOWN
          </span>
        </div>
      </div>

      {/* Chart with Manual Zoom/Pan */}
      <div
        ref={chartContainerRef}
        className="h-[260px] w-full relative select-none cursor-crosshair"
        onMouseDown={(e) => {
          isDraggingRef.current = true;
          lastClientXRef.current = e.clientX;
        }}
        onMouseMove={(e) => {
          if (!isDraggingRef.current) return;
          const deltaX = lastClientXRef.current - e.clientX;
          if (Math.abs(deltaX) > 10) {
            const shift = Math.sign(deltaX);

            setZoomState((prev) => {
              const { left, right } = prev;
              const len = historyData.length;

              let newLeft = left + shift;
              let newRight = right + shift;

              if (newLeft < 0) {
                newLeft = 0;
                newRight = right - left;
              }
              if (newRight >= len) {
                newRight = len - 1;
                newLeft = newRight - (right - left);
              }
              return { left: newLeft, right: newRight };
            });
            lastClientXRef.current = e.clientX;
          }
        }}
        onMouseUp={() => { isDraggingRef.current = false; }}
        onMouseLeave={() => { isDraggingRef.current = false; }}
      >
        {historyLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : historyData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={historyData.slice(zoomState.left, zoomState.right + 1)}
            >
              <defs>
                <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
                className="dark:stroke-zinc-800"
              />
              <XAxis
                dataKey="time"
                stroke="#71717a"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                hide={false}
                domain={[
                  0,
                  (dataMax: number) => {
                    const safeMax = isFinite(dataMax) ? dataMax : 150;
                    return Math.min(Math.max(safeMax + 20, 150), 2000);
                  },
                ]}
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{
                  stroke: "#10b981",
                  strokeWidth: 2,
                  strokeDasharray: "5 5",
                }}
              />
              <Area
                type="monotone"
                dataKey="activeNodes"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradActive)"
                name="Active Nodes"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="downNodes"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3, fill: "#ef4444" }}
                activeDot={{ r: 5, fill: "#ef4444" }}
                name="Down Nodes"
                isAnimationActive={false}
              />

              {/* HAIRLINE */}
              <Line
                type="monotone"
                data={
                  hoveredAssetCode
                    ? visibleEventData.filter(
                        (d) => d.details.assetCode === hoveredAssetCode,
                      )
                    : []
                }
                dataKey="yValue"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#3b82f6" }}
                activeDot={false}
                isAnimationActive={false}
                connectNulls={true}
              />

              <Scatter
                data={visibleEventData}
                dataKey="yValue"
                fill="#8884d8"
                shape={(props: ScatterShapeProps) => {
                  const { cx, cy, payload } = props;
                  if (typeof cx !== "number" || typeof cy !== "number")
                    return <></>;
                  const isHovered =
                    hoveredAssetCode === payload?.details?.assetCode;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 4}
                      fill={payload?.color}
                      stroke={isHovered ? "#3b82f6" : "none"}
                      strokeWidth={isHovered ? 2 : 0}
                      style={{ cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={() => {
                        if (payload?.details?.assetCode) {
                          setHoveredAssetCode(payload.details.assetCode);
                        }
                      }}
                      onMouseLeave={() => setHoveredAssetCode(null)}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-zinc-500">No history data yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
