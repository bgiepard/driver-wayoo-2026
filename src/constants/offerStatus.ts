import type { OfferStatus } from "@/models";

export const STATUS_CONFIG: Record<OfferStatus, { label: string; dot: string; badge: string }> = {
  new: {
    label: "Oczekuje",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  paid: {
    label: "Opłacona",
    dot: "bg-brand-500",
    badge: "bg-brand-50 text-brand-700 border-brand-200",
  },
  canceled: {
    label: "Anulowana",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-500 border-gray-200",
  },
  rejected: {
    label: "Odrzucona",
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-600 border-red-200",
  },
};
