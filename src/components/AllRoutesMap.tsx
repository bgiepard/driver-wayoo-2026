import { useEffect, useRef, useState, useCallback } from "react";
import type { Route } from "@/models";
import { DARK_MAP_STYLES } from "@/lib/mapStyles";

interface RouteWithId {
  id: string;
  route: Route;
}

interface AllRoutesMapProps {
  routes: RouteWithId[];
  height?: string;
  selectedRouteId?: string | null;
  onRouteClick?: (id: string) => void;
}

export default function AllRoutesMap({ routes, height = "400px", selectedRouteId, onRouteClick }: AllRoutesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const onRouteClickRef = useRef(onRouteClick);
  const prevRoutesRef = useRef<string>("");

  useEffect(() => {
    onRouteClickRef.current = onRouteClick;
  }, [onRouteClick]);

  // Initialize map only once
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const initMap = () => {
      if (!window.google?.maps || !mapRef.current) {
        return false;
      }

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 6,
        center: { lat: 52.0, lng: 19.0 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: DARK_MAP_STYLES,
      });

      setMapReady(true);
      return true;
    };

    if (!initMap()) {
      const interval = setInterval(() => {
        if (initMap()) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
  }, []);

  // Clear directions
  const clearDirections = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
  }, []);

  // Update markers when routes change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const routeIds = routes.map(r => r.id).sort().join(',');
    if (routeIds === prevRoutesRef.current) return;
    prevRoutesRef.current = routeIds;

    clearMarkers();
    clearDirections();

    if (routes.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();

    routes.forEach((item) => {
      const { id, route } = item;
      if (!route.origin.lat || !route.origin.lng) return;

      const isSelected = id === selectedRouteId;

      const marker = new window.google.maps.Marker({
        position: { lat: route.origin.lat, lng: route.origin.lng },
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 12 : 8,
          fillColor: isSelected ? "#16a34a" : "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: route.origin.address,
      });

      marker.addListener("click", () => {
        onRouteClickRef.current?.(id);
      });

      markersRef.current.set(id, marker);
      bounds.extend({ lat: route.origin.lat, lng: route.origin.lng });
    });

    if (!bounds.isEmpty() && routes.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, 50);
    } else if (routes.length === 1) {
      const route = routes[0].route;
      mapInstanceRef.current.setCenter({ lat: route.origin.lat, lng: route.origin.lng });
      mapInstanceRef.current.setZoom(10);
    }
  }, [routes, mapReady, clearMarkers, clearDirections, selectedRouteId]);

  // Update marker styles when selection changes
  useEffect(() => {
    if (!mapReady) return;

    markersRef.current.forEach((marker, id) => {
      // Skip route markers (origin, dest, waypoints)
      if (id.includes('-origin') || id.includes('-dest') || id.includes('-wp-')) return;

      const isSelected = id === selectedRouteId;
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 10 : 8,
        fillColor: "#2563eb",
        fillOpacity: isSelected ? 1 : 0.7,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      });
    });
  }, [selectedRouteId, mapReady]);

  // Create labeled marker icon (S, K, or number)
  const createLabeledIcon = (label: string, isEndpoint: boolean) => {
    const size = isEndpoint ? 28 : 22;
    const fontSize = isEndpoint ? 12 : 10;
    const fillColor = isEndpoint ? "#2563eb" : "white";
    const textColor = isEndpoint ? "white" : "#2563eb";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${fillColor}" stroke="#2563eb" stroke-width="2"/>
        <text x="${size/2}" y="${size/2 + fontSize/3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${textColor}">${label}</text>
      </svg>
    `;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size/2, size/2),
    };
  };

  // Show route when selected
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    clearDirections();

    // Clean up route markers
    ['origin', 'dest'].forEach(suffix => {
      const key = `${selectedRouteId}-${suffix}`;
      const marker = markersRef.current.get(key);
      if (marker) {
        marker.setMap(null);
        markersRef.current.delete(key);
      }
    });
    // Clean up waypoint markers
    markersRef.current.forEach((marker, key) => {
      if (key.includes('-wp-')) {
        marker.setMap(null);
        markersRef.current.delete(key);
      }
    });

    if (!selectedRouteId) return;

    const selectedRoute = routes.find(r => r.id === selectedRouteId);
    if (!selectedRoute) return;

    const { route } = selectedRoute;
    if (!route.origin.lat || !route.destination.lat) return;

    setLoadingRoute(true);

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: "#2563eb",
        strokeWeight: 5,
        strokeOpacity: 0.9,
      },
    });

    directionsRenderer.setMap(mapInstanceRef.current);
    directionsRendererRef.current = directionsRenderer;

    const waypoints: google.maps.DirectionsWaypoint[] = route.waypoints
      .filter((wp) => wp.lat && wp.lng)
      .map((wp) => ({
        location: new google.maps.LatLng(wp.lat, wp.lng),
        stopover: true,
      }));

    const request: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(route.origin.lat, route.origin.lng),
      destination: new google.maps.LatLng(route.destination.lat, route.destination.lng),
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      region: "pl",
    };

    directionsService.route(request, (result, status) => {
      setLoadingRoute(false);
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);

        // Add start marker (S)
        const startMarker = new window.google.maps.Marker({
          position: { lat: route.origin.lat, lng: route.origin.lng },
          map: mapInstanceRef.current,
          icon: createLabeledIcon("S", true),
          title: route.origin.address,
          zIndex: 100,
        });
        markersRef.current.set(`${selectedRouteId}-origin`, startMarker);

        // Add destination marker (K)
        const destMarker = new window.google.maps.Marker({
          position: { lat: route.destination.lat, lng: route.destination.lng },
          map: mapInstanceRef.current,
          icon: createLabeledIcon("K", true),
          title: route.destination.address,
          zIndex: 100,
        });
        markersRef.current.set(`${selectedRouteId}-dest`, destMarker);

        // Add waypoint markers (numbered, empty background)
        route.waypoints.forEach((wp, index) => {
          if (!wp.lat || !wp.lng) return;
          const wpMarker = new window.google.maps.Marker({
            position: { lat: wp.lat, lng: wp.lng },
            map: mapInstanceRef.current,
            icon: createLabeledIcon(String(index + 1), false),
            title: wp.address,
            zIndex: 99,
          });
          markersRef.current.set(`${selectedRouteId}-wp-${index}`, wpMarker);
        });
      }
    });

  }, [selectedRouteId, routes, mapReady, clearDirections]);

  if (routes.length === 0) {
    return (
      <div
        className="w-full rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-gray-600 text-sm">Brak tras do wyswietlenia</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {loadingRoute && (
        <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/[0.08] z-10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">Ladowanie trasy...</span>
          </div>
        </div>
      )}

      <div
        ref={mapRef}
        className="w-full rounded-xl"
        style={{ height }}
      />

      {routes.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-gray-900/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/[0.08]">
          <p className="text-xs text-gray-400">
            {routes.length} {routes.length === 1 ? "zlecenie" : routes.length < 5 ? "zlecenia" : "zlecen"}
            {selectedRouteId && " · kliknij gdzie indziej aby schowac trase"}
          </p>
        </div>
      )}
    </div>
  );
}
