"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { getUser, logout } from "@/utils/auth";

export default function Navbar({ onMenuClick }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const displayName = user?.username ?? "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      {/* Left: hamburger + search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-gray-600" />
        </button>

        {/* <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
          placeholder="Search medicines, equipment..."
            className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
          />
        </div> */}
      </div>

      {/* Right: notifications + avatar */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            {initial}
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-800 leading-none">{displayName}</p>
            <p className="text-xs text-gray-400 mt-0.5">Admin</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <LogOut size={14} className="text-gray-500" />
          Log out
        </button>
      </div>
    </header>
  );
}
