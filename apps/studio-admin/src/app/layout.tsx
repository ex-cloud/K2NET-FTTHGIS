import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "K2NET GIS — System Admin",
  description: "K2NET FTTH GIS — System Administration Portal",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[Admin Layout] Session roles:",
      JSON.stringify(session?.user?.roles)
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
                  const originalMeasure = window.performance.measure;
                  window.performance.measure = function(name, startOrMeasureOptions, end) {
                    try {
                      return originalMeasure.apply(this, arguments);
                    } catch (e) {
                      console.warn("[Performance Hotfix] Bypassed performance.measure exception:", e.message);
                    }
                  };
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
