"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { SITE_ALERT_STORAGE_KEY } from "@/utils/supplyLogic";

// No sidebar/navbar; page handles its own flow (e.g. login or root redirect).
const ROUTES_WITHOUT_APP_SHELL = ["/login", "/"];

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [siteAlertLevel, setSiteAlertLevel] = useState("normal");
  const pathname = usePathname();
  const isPlainRoute = ROUTES_WITHOUT_APP_SHELL.includes(pathname);

  // Skip auth guard on plain routes (login + home redirect).
  const { checking } = useAuthGuard(isPlainRoute);

  useEffect(() => {
    function syncAlertLevel() {
      const level = localStorage.getItem(SITE_ALERT_STORAGE_KEY) ?? "normal";
      setSiteAlertLevel(level);
    }

    syncAlertLevel();
    window.addEventListener("storage", syncAlertLevel);
    window.addEventListener("site-alert-level-change", syncAlertLevel);

    return () => {
      window.removeEventListener("storage", syncAlertLevel);
      window.removeEventListener("site-alert-level-change", syncAlertLevel);
    };
  }, []);

  if (isPlainRoute) {
    return <>{children}</>;
  }

  // Block render until auth check is complete to prevent content flash
  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden ${
        siteAlertLevel === "critical" ? "bg-red-50" : "bg-gray-50"
      }`}
    >
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
