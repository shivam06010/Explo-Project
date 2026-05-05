"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  BarChart2,
  Bot,
  Cpu,
  ChevronLeft,
} from "lucide-react";

const navLinks = [
  { label: "Dashboard",    href: "/dashboard",  icon: LayoutDashboard },
  { label: "Inventory",    href: "/inventory",  icon: Package },
  { label: "Analytics",    href: "/analytics",  icon: BarChart2 },
  { label: "2D Simulation", href: "/2d-simulation", icon: Cpu },
  { label: "AI Assistant", href: "/ai",         icon: Bot },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 bg-gray-900 text-white flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <span className="text-xl font-bold tracking-tight text-white">
            explo<span className="text-blue-400">.</span>
          </span>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-gray-700 transition"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
          {navLinks.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition
                  ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }
                `}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 text-xs text-gray-500">
          © 2026 Explo Inc.
        </div>
      </aside>
    </>
  );
}
