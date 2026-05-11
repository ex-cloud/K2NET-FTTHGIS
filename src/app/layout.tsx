import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "FTTH GIS",
  description: "Fiber To The Home - Geographic Information System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  
  if (process.env.NODE_ENV === "development") {
    console.log("SERVER LAYOUT SESSION:", JSON.stringify(session?.user?.roles));
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
