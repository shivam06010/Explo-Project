"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Clock } from "lucide-react";
import { getInventoryAlerts, INVENTORY_STORAGE_KEY } from "@/utils/supplyLogic";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    function refresh() {
      const items = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY) ?? "[]");
      const { lowStockAlerts, expiryAlerts } = getInventoryAlerts(items);
      setAlerts([...lowStockAlerts, ...expiryAlerts].slice(0, 10));
    }

    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("site-alert-level-change", refresh);
    const interval = setInterval(refresh, 6000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("site-alert-level-change", refresh);
    };
  }, []);

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-lg hover:bg-gray-100 transition"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell size={20} className="text-gray-600" />
        {!!alerts.length && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-red-500 px-1 text-[10px] leading-4 text-white text-center font-semibold">
            {alerts.length > 9 ? "9+" : alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[340px] rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Inventory Alerts</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {alerts.length ? (
              alerts.map((alert, index) => (
                <div key={`${alert.type}-${index}`} className="border-b border-gray-50 px-4 py-3 last:border-b-0">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                        alert.color === "red"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {alert.color === "red" ? <AlertTriangle size={12} /> : <Clock size={12} />}
                    </span>
                    <p className="text-xs text-gray-700">{alert.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-gray-500">No alerts right now.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
