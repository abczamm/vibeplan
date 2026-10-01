import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "./app-shell";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VibePlan — AI Project Architect",
    template: "%s · VibePlan",
  },
  description:
    "VibePlan by zuroDev. Transform software ideas into structured, validated, implementation-ready project blueprints. From Idea to Implementation.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    userEmail = null;
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <AppShell userEmail={userEmail}>{children}</AppShell>
      </body>
    </html>
  );
}
