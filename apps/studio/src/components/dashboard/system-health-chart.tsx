import React from "react";
import { Loader2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface HealthChartEntry {
  name: string;
  value: number;
  color: string;
}

interface SystemHealthChartProps {
  loading: boolean;
  healthPercentage: number;
  healthChartData: HealthChartEntry[];
}

export function SystemHealthChart({
  loading,
  healthPercentage,
  healthChartData,
}: SystemHealthChartProps) {
  return (
    <div className="bg-white/60 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/50 rounded-xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-white">
          SYSTEM HEALTH
        </h3>
        {loading && (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        )}
      </div>

      {healthChartData.length > 0 ? (
        <>
          <div className="h-[180px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthChartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={225}
                  endAngle={-45}
                  isAnimationActive={true}
                  animationDuration={1000}
                >
                  {healthChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="none"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-white leading-none">
                {healthPercentage}%
              </span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                OVERALL
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {healthChartData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    {item.name}
                  </span>
                </div>
                <span className="text-[11px] font-black text-zinc-900 dark:text-white">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-[260px] flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Loading health data...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
