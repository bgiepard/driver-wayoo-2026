import type { OfferWithRequest } from "@/models";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";

const BRAND = "#0b298f";
const BRAND_LIGHT = "#4d6de6";

/* ─── Przychód miesięczny ─── */

function getRevenueByMonth(offers: OfferWithRequest[]) {
  const map = new Map<string, number>();

  // Ostatnie 6 miesięcy
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, 0);
  }

  for (const offer of offers) {
    if (offer.status !== "paid" || !offer.request?.date) continue;
    const key = offer.request.date.slice(0, 7); // "YYYY-MM"
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + offer.price);
    }
  }

  return Array.from(map.entries()).map(([key, value]) => {
    const [, month] = key.split("-");
    const label = new Date(0, parseInt(month) - 1).toLocaleString("pl-PL", { month: "short" });
    return { label, value };
  });
}

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-xs">
      <p className="text-gray-500 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900">{payload[0].value.toLocaleString("pl-PL")} PLN</p>
    </div>
  );
}

/* ─── Skuteczność ofert ─── */

const STATUS_LABELS: Record<string, string> = {
  new:      "Oczekujące",
  paid:     "Opłacone",
  rejected: "Odrzucone",
  canceled: "Anulowane",
};

const STATUS_COLORS: Record<string, string> = {
  new:      "#93a8e8",
  paid:     BRAND,
  rejected: "#e5e7eb",
  canceled: "#e5e7eb",
};

function getStatusData(offers: OfferWithRequest[]) {
  const map = new Map<string, number>();
  for (const offer of offers) {
    map.set(offer.status, (map.get(offer.status) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([status, count]) => ({ status, label: STATUS_LABELS[status] ?? status, count }))
    .filter((d) => d.count > 0);
}

function StatusTooltip({ active, payload }: { active?: boolean; payload?: { payload: { label: string; count: number } }[] }) {
  if (!active || !payload?.length) return null;
  const { label, count } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-xs">
      <p className="text-gray-500 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900">{count}</p>
    </div>
  );
}

/* ─── Legenda donut ─── */
function DonutLegend({ data, total }: { data: { status: string; label: string; count: number }[]; total: number }) {
  return (
    <div className="flex flex-col gap-2 justify-center">
      {data.map((d) => (
        <div key={d.status} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[d.status] ?? "#e5e7eb" }} />
          <span className="text-xs text-gray-600 flex-1">{d.label}</span>
          <span className="text-xs font-semibold text-gray-900">{d.count}</span>
          <span className="text-xs text-gray-400">({Math.round((d.count / total) * 100)}%)</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Główny komponent ─── */
export function DashboardCharts({ offers }: { offers: OfferWithRequest[] }) {
  const revenueData = getRevenueByMonth(offers);
  const statusData = getStatusData(offers);
  const total = offers.length;
  const maxRevenue = Math.max(...revenueData.map((d) => d.value), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

      {/* Przychód miesięczny */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Wykres</p>
        <p className="text-sm font-semibold text-gray-900 mb-5">Przychód miesięczny</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={revenueData} barSize={28} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: "#f3f4f6" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {revenueData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.value === maxRevenue ? BRAND : "#d9e0fb"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Skuteczność ofert */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Wykres</p>
        <p className="text-sm font-semibold text-gray-900 mb-5">Skuteczność ofert</p>
        {total === 0 ? (
          <div className="flex items-center justify-center h-[180px]">
            <p className="text-sm text-gray-400">Brak danych</p>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={70}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] ?? "#e5e7eb"} />
                  ))}
                </Pie>
                <Tooltip content={<StatusTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 min-w-0">
              <DonutLegend data={statusData} total={total} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
