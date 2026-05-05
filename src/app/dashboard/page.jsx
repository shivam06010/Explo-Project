"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/utils/auth";
import StatCard from "@/components/StatCard";
import InventoryChart from "@/components/charts/InventoryChart";
import { hydrateSensorsFromInventory, initializeInventoryFromDataset } from "@/utils/datasetClient";
import { getInventoryAlerts } from "@/utils/supplyLogic";
import {
  Package,
  AlertTriangle,
  Clock,
  Bell,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [chartData, setChartData] = useState({ inventory: [] });
  const [alerts, setAlerts] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  useEffect(() => {
    async function bootDashboard() {
      const inventory = await initializeInventoryFromDataset();
      hydrateSensorsFromInventory(inventory);

      const { lowStockAlerts, expiryAlerts } = getInventoryAlerts(inventory);
      const combinedAlerts = [...lowStockAlerts, ...expiryAlerts];

      setStats({
        totalItems: inventory.length,
        lowStock: lowStockAlerts.length,
        expiringSoon: expiryAlerts.length,
        totalAlerts: combinedAlerts.length,
      });
      setInventoryItems(inventory);
      setAlerts(combinedAlerts.slice(0, 8));
      setUser(getUser());
      setChartData({
        inventory: inventory.slice(0, 10).map((item) => ({ name: item.name, stock: item.stock })),
      });
    }

    bootDashboard();
  }, []);

  const cards = stats
    ? [
        {
          title:       "Total Items",
          value:       stats.totalItems,
          color:       "blue",
          description: "Medicines, equipment & supplies",
          icon:        <Package size={20} />,
        },
        {
          title:       "Low Stock Items",
          value:       stats.lowStock,
          color:       "red",
          description: "quantity <= ROP",
          icon:        <AlertTriangle size={20} />,
        },
        {
          title:       "Expiring Soon",
          value:       stats.expiringSoon,
          color:       "yellow",
          description: "expiry_date < next 7 days (FEFO)",
          icon:        <Clock size={20} />,
        },
        {
          title:       "Active Alerts",
          value:       stats.totalAlerts,
          color:       "purple",
          description: "Low stock + expiry warnings",
          icon:        <Bell size={20} />,
        },
      ]
    : [];

  const highDemandMedicines = [...inventoryItems]
    .sort((a, b) => b.demandPerDay - a.demandPerDay)
    .slice(0, 6);
  const dashboardSuggestions = [
    ...alerts.slice(0, 4).map((alert) => ({
      text: alert.message,
      color: alert.color,
    })),
    ...highDemandMedicines.slice(0, 2).map((item) => ({
      text: `Monitor ${item.name} (${item.batchNumber}) closely. High daily demand (${item.demandPerDay}) may require faster replenishment.`,
      color: "yellow",
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.username ? `, ${user.username}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s your healthcare supply chain overview for today.
        </p>
      </div>

      {/* Stat cards */}
      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      ) : (
        /* Skeleton loader */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm h-28 animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2 mt-1">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-7 bg-gray-100 rounded w-1/2" />
                  <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {stats && (
        <>
          <div className="grid grid-cols-1 gap-4">
            <InventoryChart data={chartData.inventory} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800">Alert Feed</h2>
            <p className="mt-1 text-xs text-gray-500">
              Red = critical (low stock/ROP breach), Yellow = warning (expiring soon)
            </p>
            <div className="mt-4 space-y-2">
              {alerts.length ? (
                alerts.map((alert, index) => (
                  <div
                    key={`${alert.type}-${index}`}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      alert.color === "red"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    }`}
                  >
                    <span
                      className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        alert.color === "red"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {alert.color === "red" ? "Critical" : "Warning"}
                    </span>
                    {alert.message}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No alerts right now.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800">Suggestions</h2>
            <p className="mt-1 text-xs text-gray-500">
              Recommended actions based on current stock, expiry and high-demand patterns.
            </p>
            <div className="mt-4 space-y-2">
              {dashboardSuggestions.length ? (
                dashboardSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.color}-${index}`}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      suggestion.color === "red"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-yellow-200 bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {suggestion.text}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No suggestions right now.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800">High Demand Medicines</h2>
            <p className="mt-1 text-xs text-gray-500">
              Highlighted by highest demand per day from dataset-derived inventory.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {highDemandMedicines.map((item) => (
                <div key={item.id} className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-semibold text-red-800">{item.name}</p>
                  <p className="mt-1 text-xs text-red-700">Batch: {item.batchNumber}</p>
                  <p className="mt-2 text-xs font-medium text-red-700">
                    Demand/day: {item.demandPerDay}
                  </p>
                  <p className="text-xs font-medium text-red-700">ROP: {item.rop}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
