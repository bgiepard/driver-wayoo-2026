/**
 * Oblicza koszt złożenia oferty w punktach.
 * Wzór: 1 pkt × liczba osób × każde 100 km trasy (min. 1 pkt)
 */
export function calculateOfferCost(totalPassengers: number, distanceKm: number | null | undefined): number {
  if (!distanceKm || distanceKm <= 0) return 1;
  return Math.max(1, Math.ceil(totalPassengers * distanceKm / 100));
}
