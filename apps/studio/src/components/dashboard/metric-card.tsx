import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  progress?: number;
  color?: string;
}

export function MetricCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  progress,
  color = "emerald",
}: MetricCardProps) {
  const colorMap: Record<string, string> = {
    emerald: "text-primary bg-primary/10",
    blue: "text-blue-500 bg-blue-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    rose: "text-rose-500 bg-rose-500/10",
    sky: "text-sky-500 bg-sky-500/10",
  };

  const selectedColor = colorMap[color] || colorMap.emerald;

  return (
    <Card className="bg-white/60 dark:bg-zinc-950/40 border-zinc-200/60 dark:border-zinc-800/50 backdrop-blur-xl overflow-hidden group hover:border-primary/30 transition-all duration-300 shadow-sm dark:shadow-none">
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors">
                {value}
              </h3>
              {trend && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    trend.isUp
                      ? "bg-emerald-500/20 text-primary dark:text-primary"
                      : "bg-rose-500/20 text-rose-600 dark:text-rose-500"
                  }`}
                >
                  {trend.isUp ? "+" : ""}
                  {trend.value}
                </span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-xl ${selectedColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {progress !== undefined ? (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : subValue ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {subValue}
          </p>
        ) : null}

        {/* Subtle grid background for premium feel */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03] pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
      </CardContent>
    </Card>
  );
}
