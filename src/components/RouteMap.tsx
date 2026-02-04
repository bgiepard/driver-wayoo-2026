import { useEffect, useRef, useState } from "react";
import type { Route } from "@/models";

interface RouteMapProps {
  route: Route;
  height?: string;
}

export default function RouteMap({ route, height = "200px" }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [distance, setDistance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!route.origin.lat || !route.destination.lat) return;

    const initMap = () => {
      if (!window.google?.maps || !mapRef.current) {
        return false;
      }

      // Initialize map centered on Poland
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          zoom: 7,
          center: { lat: 52.0, lng: 19.0 },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
        });

        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: "#16a34a",
            strokeWeight: 4,
          },
        });

        directionsRendererRef.current.setMap(mapInstanceRef.current);
      }

      return true;
    };

    const calculateRoute = () => {
      if (!mapInstanceRef.current || !directionsRendererRef.current) return;

      const directionsService = new window.google.maps.DirectionsService();

      // Build waypoints from route waypoints using coordinates
      const waypoints: google.maps.DirectionsWaypoint[] = route.waypoints
        .filter((wp) => wp.lat && wp.lng)
        .map((wp) => ({
          location: new google.maps.LatLng(wp.lat, wp.lng),
          stopover: true,
        }));

      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(route.origin.lat, route.origin.lng),
        destination: new google.maps.LatLng(route.destination.lat, route.destination.lng),
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        region: "pl",
      };

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current?.setDirections(result);

          // Calculate total distance
          let totalDistance = 0;
          const legs = result.routes[0]?.legs || [];
          legs.forEach((leg) => {
            totalDistance += leg.distance?.value || 0;
          });

          // Convert to km and format
          const distanceKm = (totalDistance / 1000).toFixed(1);
          setDistance(`${distanceKm} km`);
          setIsLoading(false);
          setError(null);
        } else {
          setError("Nie udalo sie obliczyc trasy");
          setIsLoading(false);
        }
      });
    };

    // Reset state
    setIsLoading(true);
    setError(null);
    setDistance(null);

    // Wait for Google Maps to load
    const checkAndInit = () => {
      if (initMap()) {
        calculateRoute();
        return true;
      }
      return false;
    };

    if (!checkAndInit()) {
      const interval = setInterval(() => {
        if (checkAndInit()) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [route]);

  // Don't render if no valid coordinates
  if (!route.origin.lat || !route.destination.lat) {
    return (
      <div
        className="w-full rounded-lg bg-gray-100 flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-gray-500 text-sm">Brak danych trasy</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loader */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 text-xs">Ladowanie mapy...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div
          className="absolute inset-0 bg-red-50 rounded-lg flex items-center justify-center z-10"
        >
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full rounded-lg"
        style={{ height, opacity: isLoading ? 0 : 1 }}
      />

      {/* Distance badge */}
      {distance && !isLoading && (
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
          <span className="text-xs font-medium text-gray-700">{distance}</span>
        </div>
      )}
    </div>
  );
}
