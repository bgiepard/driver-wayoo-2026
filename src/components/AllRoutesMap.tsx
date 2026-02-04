import { useEffect, useRef, useState } from "react";
import type { Route } from "@/models";

interface RouteWithId {
  id: string;
  route: Route;
}

interface AllRoutesMapProps {
  routes: RouteWithId[];
  height?: string;
  onRouteClick?: (id: string) => void;
}

const ROUTE_COLORS = [
  "#16a34a", // green
  "#2563eb", // blue
  "#dc2626", // red
  "#ca8a04", // yellow
  "#9333ea", // purple
  "#0891b2", // cyan
  "#ea580c", // orange
  "#db2777", // pink
];

export default function AllRoutesMap({ routes, height = "400px", onRouteClick }: AllRoutesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const routeElementsRef = useRef<Map<string, { renderer: google.maps.DirectionsRenderer; markers: google.maps.Marker[] }>>(new Map());
  const onRouteClickRef = useRef(onRouteClick);

  // Keep the ref updated
  useEffect(() => {
    onRouteClickRef.current = onRouteClick;
  }, [onRouteClick]);

  useEffect(() => {
    if (routes.length === 0) {
      setIsLoading(false);
      return;
    }

    const initMap = () => {
      if (!window.google?.maps || !mapRef.current) {
        return false;
      }

      // Clear previous renderers and markers
      routeElementsRef.current.forEach((elements) => {
        elements.renderer.setMap(null);
        elements.markers.forEach((marker) => marker.setMap(null));
      });
      routeElementsRef.current.clear();

      // Always create a new map instance
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 6,
        center: { lat: 52.0, lng: 19.0 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      return true;
    };

    const calculateRoutes = async () => {
      if (!mapInstanceRef.current) return;

      const directionsService = new window.google.maps.DirectionsService();
      const bounds = new window.google.maps.LatLngBounds();
      let loadedCount = 0;

      for (let i = 0; i < routes.length; i++) {
        const { id, route } = routes[i];
        const color = ROUTE_COLORS[i % ROUTE_COLORS.length];

        if (!route.origin.lat || !route.destination.lat) continue;

        // Create direction renderer for this route
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: color,
            strokeWeight: 4,
            strokeOpacity: 0.8,
          },
          preserveViewport: true,
        });

        directionsRenderer.setMap(mapInstanceRef.current);
        const routeMarkers: google.maps.Marker[] = [];

        // Build waypoints
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

        try {
          const result = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
            directionsService.route(request, (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                resolve(result);
              } else {
                resolve(null);
              }
            });
          });

          if (result) {
            directionsRenderer.setDirections(result);

            // Extend bounds
            const legs = result.routes[0]?.legs || [];
            legs.forEach((leg) => {
              if (leg.start_location) bounds.extend(leg.start_location);
              if (leg.end_location) bounds.extend(leg.end_location);
            });

            // Add origin marker
            const originMarker = new window.google.maps.Marker({
              position: { lat: route.origin.lat, lng: route.origin.lng },
              map: mapInstanceRef.current,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
              title: route.origin.address,
            });

            originMarker.addListener("click", () => onRouteClickRef.current?.(id));
            routeMarkers.push(originMarker);

            // Add destination marker
            const destMarker = new window.google.maps.Marker({
              position: { lat: route.destination.lat, lng: route.destination.lng },
              map: mapInstanceRef.current,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
              title: route.destination.address,
            });

            destMarker.addListener("click", () => onRouteClickRef.current?.(id));
            routeMarkers.push(destMarker);

            // Store route elements for visibility control
            routeElementsRef.current.set(id, { renderer: directionsRenderer, markers: routeMarkers });
          }

          loadedCount++;
          if (loadedCount === routes.length) {
            // Fit map to show all routes
            if (!bounds.isEmpty()) {
              mapInstanceRef.current?.fitBounds(bounds, 50);
            }
            setIsLoading(false);
          }
        } catch {
          loadedCount++;
          if (loadedCount === routes.length) {
            setIsLoading(false);
          }
        }
      }

      if (routes.length === 0) {
        setIsLoading(false);
      }
    };

    setIsLoading(true);

    const checkAndInit = () => {
      if (initMap()) {
        calculateRoutes();
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
  }, [routes]);

  if (routes.length === 0) {
    return (
      <div
        className="w-full rounded-lg bg-gray-100 flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-gray-500 text-sm">Brak tras do wyswietlenia</span>
      </div>
    );
  }

  return (
    <div className="relative">
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

      <div
        ref={mapRef}
        className="w-full rounded-lg"
        style={{ height, opacity: isLoading ? 0 : 1 }}
      />

      {/* Legend */}
      {!isLoading && routes.length > 1 && (
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-sm max-h-32 overflow-y-auto">
          <p className="text-xs font-medium text-gray-700 mb-1">{routes.length} tras</p>
        </div>
      )}
    </div>
  );
}
