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
    <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden flex-1">
      <div className="flex gap-4 items-center p-6 border-b border-[#eef2ff]">
        {icon && (
          <div className="bg-[#e0e7ff] p-2 rounded-lg shrink-0 flex items-center justify-center">
            <div className="w-5 h-5 flex items-center justify-center text-[#0b298f]">
              {icon}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <p className="text-[#475569] text-[14px] font-medium leading-snug">{label}</p>
          <p className="text-[#0f172a] text-[18px] font-medium leading-snug">{value}</p>
        </div>
      </div>
    </div>
  );
}
