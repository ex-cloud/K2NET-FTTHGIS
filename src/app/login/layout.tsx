import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | FTTH GIS",
  description: "Sign in to your FTTH GIS account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
