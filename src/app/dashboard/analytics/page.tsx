import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-transparent text-white p-12 pt-28">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 text-emerald-500">📈</div>
        </div>
        <h1 className="text-3xl font-black tracking-tight uppercase">
          Analytics Engine
        </h1>
        <p className="text-zinc-400 font-medium">
          Detailed network performance metrics, user growth patterns, and
          predictive latency modeling are currently being processed.
        </p>
        <div className="pt-8 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="text-2xl font-black text-emerald-400">94.2%</div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase">
              Confidence
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="text-2xl font-black text-sky-400">12ms</div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase">
              Avg Latency
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
