const ICON_COLORS: Record<string, string> = {
  warning: "bg-warning-500/10 text-warning-400",
  success: "bg-success-500/10 text-success-400",
  brand: "bg-brand-500/10 text-brand-400",
  info: "bg-info-500/10 text-info-400",
};

const VALUE_COLORS: Record<string, string> = {
  warning: "text-warning-400",
  success: "text-success-400",
  brand: "text-brand-400",
  info: "text-info-400",
};

export function MetricCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color?: "warning" | "success" | "brand" | "info";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        {icon && (
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${color ? ICON_COLORS[color] : "bg-gray-100 text-gray-400"}`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold tracking-tight ${color ? VALUE_COLORS[color] : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
