import { ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

/** Glowny tytul strony - np. "Dashboard", "Zlecenia" */
export function PageTitle({ children, className = "" }: TypographyProps) {
  return (
    <h1 className={`text-title-2xl font-bold text-white/90 ${className}`}>
      {children}
    </h1>
  );
}

/** Podtytul strony - opis pod tytlem */
export function PageSubtitle({ children, className = "" }: TypographyProps) {
  return (
    <p className={`mt-1 text-theme-sm text-gray-400 ${className}`}>
      {children}
    </p>
  );
}

/** Tytul sekcji/karty - np. "Oczekujace", "Kalendarz zlecen" */
export function SectionTitle({ children, className = "" }: TypographyProps) {
  return (
    <h2 className={`text-lg font-semibold text-white/90 ${className}`}>
      {children}
    </h2>
  );
}

/** Tytul wewnatrz karty - mniejszy niz SectionTitle */
export function CardTitle({ children, className = "" }: TypographyProps) {
  return (
    <h3 className={`text-theme-sm font-semibold text-white/90 ${className}`}>
      {children}
    </h3>
  );
}

/** Naglowek tabeli / etykieta */
export function Label({ children, className = "" }: TypographyProps) {
  return (
    <span className={`text-theme-xs font-medium text-gray-400 ${className}`}>
      {children}
    </span>
  );
}

/** Tekst body - domyslny */
export function BodyText({ children, className = "" }: TypographyProps) {
  return (
    <p className={`text-theme-sm text-gray-300 ${className}`}>
      {children}
    </p>
  );
}

/** Przytlumiony tekst - daty, meta info */
export function MutedText({ children, className = "" }: TypographyProps) {
  return (
    <span className={`text-theme-xs text-gray-400 ${className}`}>
      {children}
    </span>
  );
}
