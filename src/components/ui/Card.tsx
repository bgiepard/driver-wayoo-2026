import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

/** Kafelek/karta - ciemne tlo */
export function Card({ children, className = "", noPadding = false }: CardProps) {
  return (
    <div
      className={`
        overflow-hidden rounded-2xl border border-gray-800 bg-white/[0.03]
        ${noPadding ? "" : "px-4 pb-3 pt-4 sm:px-6"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/** Naglowek karty z tytulem i opcjonalna prawa strona */
export function CardHeader({
  title,
  right,
  className = "",
}: {
  title: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white/90">
        {title}
      </h3>
      {right && <div>{right}</div>}
    </div>
  );
}
