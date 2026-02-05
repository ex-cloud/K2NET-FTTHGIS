import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CanvasPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-transparent text-white p-12 pt-28">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 text-sky-500">🎨</div>
        </div>
        <h1 className="text-3xl font-black tracking-tight uppercase">
          Visual Builder
        </h1>
        <p className="text-zinc-400 font-medium">
          The interactive network design canvas is initializing. Soon you will
          be able to draw and simulate fiber topologies in real-time.
        </p>
        <div className="pt-8 flex justify-center gap-4">
          <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 animate-[loading_2s_ease-in-out_infinite]"
              style={{ width: "40%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
