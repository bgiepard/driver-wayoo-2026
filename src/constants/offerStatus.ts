import type { OfferStatus } from "@/models";

export const STATUS_CONFIG: Record<OfferStatus, { label: string; dot: string; badge: string }> = {
  new: {
    label: "Oczekuje na akceptacje",
    dot: "bg-warning-400",
    badge: "bg-warning-500/10 text-warning-400 border-warning-500/20",
  },
  paid: {
    label: "Oplacona",
    dot: "bg-info-400",
    badge: "bg-info-500/10 text-info-400 border-info-500/20",
  },
  canceled: {
    label: "Anulowana",
    dot: "bg-gray-400",
    badge: "bg-white/5 text-gray-400 border-white/10",
  },
  rejected: {
    label: "Odrzucona",
    dot: "bg-error-400",
    badge: "bg-error-500/10 text-error-400 border-error-500/20",
  },
};
