"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const LOW_STOCK_THRESHOLD = 5;

function getBarColor(stock) {
  if (stock <= LOW_STOCK_THRESHOLD) return "#ef4444"; // red
  if (stock <= 20)                  return "#f59e0b"; // yellow
  return "#3b82f6";                                   // blue
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-gray-800 mb-0.5">{label}</p>
      <p className="text-gray-500">
        Stock: <span className="font-medium text-gray-900">{payload[0].value}</span>
      </p>
    </div>
  );
};

export default function InventoryChart({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-1">Inventory Distribution</h2>
      <p className="text-xs text-gray-400 mb-5">Stock levels per item</p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            scale="log"
            domain={[1, "auto"]}
            allowDataOverflow
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
          <Bar dataKey="stock" radius={[6, 6, 0, 0]} maxBarSize={48} minPointSize={6}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.stock)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-center text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Low (≤5)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> Medium (≤20)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Healthy
        </span>
      </div>
    </div>
  );
}
