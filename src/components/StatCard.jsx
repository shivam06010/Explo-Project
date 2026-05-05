export default function StatCard({ title, value, icon, color, description }) {
  const colorMap = {
    blue:   { bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-600",   text: "text-blue-600" },
    yellow: { bg: "bg-yellow-50", icon: "bg-yellow-100 text-yellow-600", text: "text-yellow-600" },
    red:    { bg: "bg-red-50",    icon: "bg-red-100 text-red-600",     text: "text-red-600" },
    purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600", text: "text-purple-600" },
  };

  const scheme = colorMap[color] ?? colorMap.blue;

  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-start gap-4`}>
      {/* Icon bubble */}
      <div className={`p-3 rounded-xl shrink-0 ${scheme.icon}`}>
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-0.5 leading-none">{value}</p>
        {description && (
          <p className={`text-xs mt-1.5 font-medium ${scheme.text}`}>{description}</p>
        )}
      </div>
    </div>
  );
}
