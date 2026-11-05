import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/layout/shell";
import { auth } from "@/lib/auth";
import { getShellData } from "@/lib/dashboard";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "DevPath Hub",
    template: "%s | DevPath Hub",
  },
  description:
    "Seu hub de estudos: flashcards, treino de código, mapas mentais, biblioteca e muito mais.",
  icons: [
    { rel: "icon", type: "image/svg+xml", url: "/favicon.svg" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon.svg" },
    { rel: "icon", type: "image/png", sizes: "16x16", url: "/favicon.svg" },
    { rel: "apple-touch-icon", sizes: "180x180", url: "/favicon.svg" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const shell = session?.user?.id ? await getShellData(session.user.id) : null;

  return (
    <html lang="pt-BR" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-slate-200 antialiased`}>
        {shell?.user ? (
          <AppShell
            user={shell.user}
            counts={shell.counts}
            weekPercent={shell.weekPercent}
            notifications={shell.notifications}
          >
            {children}
          </AppShell>
        ) : (
          <div className="min-h-screen">{children}</div>
        )}
      </body>
    </html>
  );
}
