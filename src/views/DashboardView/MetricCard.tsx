export function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
  );
}
