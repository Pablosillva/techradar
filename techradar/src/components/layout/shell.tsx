"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Footer } from "./footer";
import { cn } from "@/lib/utils";

interface AppShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
  };
  counts: { applications: number; tasks: number; reviews: number };
  weekPercent: number;
  notifications: Array<{ label: string; href: string }>;
  children: React.ReactNode;
}

/**
 * Shell responsivo do app: sidebar fixa (colapsável) + topbar sticky.
 * O estado de colapso é persistido em localStorage.
 */
export function AppShell({
  user,
  counts,
  weekPercent,
  notifications,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("devpath:sidebar-collapsed") === "1") {
      setCollapsed(true);
    }
  }, []);

  // Fecha o drawer ao navegar.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Fecha o drawer com Escape.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function toggleCollapsed() {
    setCollapsed((previous) => {
      const next = !previous;
      window.localStorage.setItem("devpath:sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        counts={counts}
        weekPercent={weekPercent}
        onToggleCollapse={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding-left] duration-300 ease-out",
          collapsed ? "lg:pl-[78px]" : "lg:pl-[260px]"
        )}
      >
        <Topbar
          user={user}
          notifications={notifications}
          onOpenMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 pb-10 pt-5 sm:px-6 lg:px-8">{children}</main>
        <Footer />
      </div>
    </>
  );
}
