import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-[#0a0a0f] text-gray-200 antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Topbar />
            <div className="flex-1 flex">
              <Sidebar />
              <main className="flex-1 overflow-x-hidden">
                <div className="px-6 pt-6 pb-12 lg:pl-[calc(64px+1rem)]">{children}</div>
              </main>
            </div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
