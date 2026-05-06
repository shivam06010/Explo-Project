function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}

const CATEGORY_COLORS = {
  Medicine:    "bg-blue-50 text-blue-700",
  "IV Fluid":  "bg-cyan-50 text-cyan-700",
  PPE:         "bg-green-50 text-green-700",
  Equipment:   "bg-purple-50 text-purple-700",
  Diagnostics: "bg-orange-50 text-orange-700",
};

export default function InventoryTable({ items }) {
  if (!items.length) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        No inventory items found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="px-5 py-3.5">Item Name</th>
            <th className="px-5 py-3.5">Category</th>
            <th className="px-5 py-3.5">Batch No.</th>
            <th className="px-5 py-3.5">Quantity</th>
            <th className="px-5 py-3.5">ROP</th>
            <th className="px-5 py-3.5">Expiry Date</th>
            <th className="px-5 py-3.5">FEFO Priority</th>
            <th className="px-5 py-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {items.map((item) => {
            const rowClass =
              item.alertColor === "red"
                ? "bg-red-50/30"
                : item.alertColor === "yellow"
                  ? "bg-amber-50/30"
                  : item.alertColor === "blue"
                    ? "bg-blue-50/30"
                    : "";

            return (
              <tr key={item.id} className={`hover:bg-gray-50/60 transition ${rowClass}`}>
                {/* Name */}
                <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {item.name}
                </td>

                {/* Category */}
                <td className="px-5 py-4">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[item.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {item.category ?? "—"}
                  </span>
                </td>

                {/* Batch */}
                <td className="px-5 py-4 font-mono text-gray-500 text-xs">
                  {item.batchNumber ?? "—"}
                </td>

                {/* Quantity */}
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 font-semibold ${item.lowStock ? "text-red-600" : "text-gray-800"}`}>
                    {item.stock}
                  </span>
                </td>

                <td className="px-5 py-4 text-gray-700 font-medium">{item.rop}</td>

                {/* Expiry Date */}
                <td className="px-5 py-4">
                  <span
                    className={`font-medium ${
                      item.expiryAlertLevel === "critical"
                        ? "text-red-700"
                        : item.expiryAlertLevel === "warning"
                          ? "text-amber-700"
                          : item.expiryAlertLevel === "advisory"
                            ? "text-blue-700"
                            : "text-gray-600"
                    }`}
                  >
                    {formatDate(item.expiryDate)}
                  </span>
                </td>

                <td className="px-5 py-4 text-xs">
                  {item.expiryAlertLevel === "critical" ? (
                    <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">
                      Urgent FEFO dispatch
                    </span>
                  ) : item.expiryAlertLevel === "warning" ? (
                    <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">
                      Reorder recommendation active
                    </span>
                  ) : item.expiryAlertLevel === "advisory" ? (
                    <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">
                      Logged for monthly review
                    </span>
                  ) : (
                    <span className="text-gray-500">Normal queue</span>
                  )}
                </td>

                {/* Status badge */}
                <td className="px-5 py-4">
                  {item.lowStock ? (
                    <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      Critical: Low Stock (ROP Alert)
                    </span>
                  ) : item.expiryAlertLevel === "critical" ? (
                    <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      High Risk: Expiring in 30 days
                    </span>
                  ) : item.expiryAlertLevel === "warning" ? (
                    <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      Warning: Expiring in 90 days
                    </span>
                  ) : item.expiryAlertLevel === "advisory" ? (
                    <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      Advisory: Expiring in 180 days
                    </span>
                  ) : (
                    <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
