"use client";

export function MapBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 bg-background/50 radial-gradient"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, var(--background) 100%)",
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full opacity-60 dark:opacity-40"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1000 1000"
      >
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary/5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <circle
          cx="500"
          cy="500"
          fill="none"
          r="80"
          stroke="#10b981"
          strokeDasharray="4 4"
          strokeWidth="0.5"
          className="opacity-50"
        />
        <circle
          cx="500"
          cy="500"
          fill="none"
          r="180"
          stroke="#10b981"
          strokeDasharray="8 8"
          strokeWidth="0.5"
          className="opacity-30"
        />
        <circle
          cx="500"
          cy="500"
          fill="none"
          r="320"
          stroke="#10b981"
          strokeDasharray="12 12"
          strokeWidth="0.5"
          className="opacity-20"
        />

        <g className="text-primary">
          <line
            className="drop-shadow-[0_0_4px_currentColor]"
            stroke="currentColor"
            strokeWidth="1.5"
            x1="500"
            x2="800"
            y1="500"
            y2="200"
          />
          <line
            className="drop-shadow-[0_0_4px_currentColor]"
            stroke="currentColor"
            strokeWidth="1.5"
            x1="500"
            x2="200"
            y1="500"
            y2="300"
          />
          <line
            className="drop-shadow-[0_0_4px_currentColor]"
            stroke="currentColor"
            strokeWidth="1.5"
            x1="500"
            x2="600"
            y1="500"
            y2="850"
          />
          <line
            className="drop-shadow-[0_0_4px_currentColor]"
            stroke="currentColor"
            strokeWidth="1.5"
            x1="500"
            x2="250"
            y1="500"
            y2="750"
          />
        </g>

        <g className="text-sky-500">
          <line
            className="drop-shadow-[0_0_4px_currentColor]"
            stroke="currentColor"
            strokeWidth="1.5"
            x1="500"
            x2="900"
            y1="500"
            y2="550"
          />
          <line
            className="drop-shadow-[0_0_4px_currentColor]"
            stroke="currentColor"
            strokeWidth="1.5"
            x1="500"
            x2="150"
            y1="500"
            y2="520"
          />
          <line
            className="drop-shadow-[0_0_4px_currentColor]"
            stroke="currentColor"
            strokeWidth="1.5"
            x1="500"
            x2="450"
            y1="500"
            y2="100"
          />
        </g>

        <circle
          className="text-primary animate-pulse"
          cx="800"
          cy="200"
          fill="currentColor"
          r="6"
        />
        <circle
          className="text-sky-500 animate-pulse"
          cx="200"
          cy="300"
          fill="currentColor"
          r="6"
        />
        <circle
          className="text-primary animate-pulse"
          cx="600"
          cy="850"
          fill="currentColor"
          r="6"
        />
        <circle
          className="text-amber-500 animate-pulse"
          cx="250"
          cy="750"
          fill="currentColor"
          r="6"
        />
        <circle
          className="text-primary"
          cx="500"
          cy="500"
          fill="currentColor"
          r="8"
        />
      </svg>
    </div>
  );
}
