"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import InventoryTable from "@/components/InventoryTable";
import { initializeInventoryFromDataset } from "@/utils/datasetClient";

const CATEGORIES = ["All", "Medicine"];

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [filter, setFilter] = useState("all"); // all | low-stock | expiring
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInventory() {
      setLoading(true);
      const datasetItems = await initializeInventoryFromDataset();
      setItems(datasetItems);
      setLoading(false);
    }
    loadInventory();
  }, []);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const today        = new Date(); today.setHours(0, 0, 0, 0);
  const warnCutoff   = new Date(today); warnCutoff.setDate(today.getDate() + 7);

  const filtered = items.filter((item) => {
    const matchSearch   = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.batchNumber?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || item.category === category;

    let matchFilter = true;
    if (filter === "low-stock") {
      matchFilter = item.lowStock;
    } else if (filter === "expiring") {
      matchFilter = item.expirySoon;
    }

    return matchSearch && matchCategory && matchFilter;
  });

  const fefoSorted = [...filtered].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  // ── Summary counts ─────────────────────────────────────────────────────────
  const lowStockCount = items.filter((i) => i.lowStock).length;
  const expiringCount = items.filter((i) => i.expirySoon).length;

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">
        Loading dataset and calculating ROP/FEFO alerts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            {items.length} items &nbsp;·&nbsp;
            <span className="text-red-500 font-medium">{lowStockCount} low stock</span>
            &nbsp;·&nbsp;
            <span className="text-yellow-500 font-medium">{expiringCount} expiring soon</span>
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or batch no."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm text-gray-700 placeholder-gray-400 outline-none w-full bg-transparent"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <SlidersHorizontal size={15} className="text-gray-400 shrink-0" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm text-gray-700 outline-none bg-transparent cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-2">
          {[
            { key: "all",       label: "All" },
            { key: "low-stock", label: `Low Stock (${lowStockCount})` },
            { key: "expiring",  label: `Expiring (${expiringCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filter === key
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" />
          Low stock / Expired
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200 inline-block" />
          Expiring within 7 days
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" />
          OK
        </span>
      </div>

      {/* Table */}
      <InventoryTable items={fefoSorted} />
    </div>
  );
}
