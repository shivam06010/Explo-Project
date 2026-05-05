"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS = {
  pending:   "#f59e0b",
  shipped:   "#3b82f6",
  delivered: "#22c55e",
};

const STATUS_LABELS = {
  pending:   "Pending",
  shipped:   "Shipped",
  delivered: "Delivered",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-gray-800">{STATUS_LABELS[name] ?? name}</p>
      <p className="text-gray-500">
        Orders: <span className="font-medium text-gray-900">{value}</span>
      </p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function OrderStatusChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-1">Order Status Breakdown</h2>
      <p className="text-xs text-gray-400 mb-5">Distribution across all orders</p>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            dataKey="value"
            nameKey="name"
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend + counts */}
      <div className="flex flex-col gap-2 mt-3">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: STATUS_COLORS[entry.name] ?? "#94a3b8" }}
              />
              <span className="text-gray-600">{STATUS_LABELS[entry.name] ?? entry.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{entry.value}</span>
              <span className="text-gray-400 text-xs">
                ({total ? ((entry.value / total) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
