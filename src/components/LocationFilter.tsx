import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "driver-location-filter";
const RADIUS_OPTIONS = [25, 50, 100, 150, 200, 300];

// Jasny styl mapy
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#f8f9fa" }] },
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#6c757d" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#6c757d" }, { weight: 2 }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#adb5bd" }, { weight: 1.5 }] },
  { featureType: "administrative.locality", elementType: "geometry.stroke", stylers: [{ color: "#dee2e6" }] },
  { featureType: "administrative.land_parcel", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e9ecef" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e9ecef" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#dee2e6" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe2f3" }] },
  { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#f1f3f4" }] },
];

interface LocationFilterProps {
  onFilterChange: (filter: { lat: number; lng: number; radius: number } | null) => void;
}

interface SavedFilter {
  lat: number;
  lng: number;
  radius: number;
  address?: string;
}

export default function LocationFilter({ onFilterChange }: LocationFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [savedFilter, setSavedFilter] = useState<SavedFilter | null>(null); // Zapisany filtr
  const [tempFilter, setTempFilter] = useState<SavedFilter | null>(null); // Tymczasowy filtr (edycja)
  const [radius, setRadius] = useState(100);
  const [address, setAddress] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  // Load saved filter on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as SavedFilter;
      setSavedFilter(parsed);
      setRadius(parsed.radius);
      setAddress(parsed.address || "");
      onFilterChange({ lat: parsed.lat, lng: parsed.lng, radius: parsed.radius });
    }
  }, []);

  // When opening modal, copy saved filter to temp
  useEffect(() => {
    if (isOpen) {
      setTempFilter(savedFilter);
      if (savedFilter) {
        setRadius(savedFilter.radius);
        setAddress(savedFilter.address || "");
      }
    }
  }, [isOpen]);

  // Initialize map when opened
  useEffect(() => {
    if (!isOpen) return;

    setMapReady(false);

    const initMap = () => {
      if (!window.google?.maps || !mapRef.current) {
        return false;
      }

      const defaultCenter = savedFilter
        ? { lat: savedFilter.lat, lng: savedFilter.lng }
        : { lat: 52.0, lng: 19.0 };

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: savedFilter ? 8 : 6,
        disableDefaultUI: true,
        zoomControl: true,
        styles: MAP_STYLES,
      });

      mapInstanceRef.current = map;

      // If saved filter exists, show marker and circle
      if (savedFilter) {
        addMarkerAndCircle(savedFilter.lat, savedFilter.lng, savedFilter.radius);
      }

      // Click on map
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          handleMapClick(lat, lng);
        }
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
  }, [isOpen]);

  const addMarkerAndCircle = (lat: number, lng: number, rad: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove previous
    markerRef.current?.setMap(null);
    circleRef.current?.setMap(null);

    // Marker
    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map,
      draggable: true,
    });

    markerRef.current.addListener("dragend", () => {
      const pos = markerRef.current?.getPosition();
      if (pos) {
        handleMapClick(pos.lat(), pos.lng());
      }
    });

    // Circle
    circleRef.current = new window.google.maps.Circle({
      map,
      center: { lat, lng },
      radius: rad * 1000,
      fillColor: "#22c55e",
      fillOpacity: 0.15,
      strokeColor: "#22c55e",
      strokeWeight: 2,
    });
  };

  const handleMapClick = (lat: number, lng: number) => {
    const newFilter = { lat, lng, radius, address: "" };
    setTempFilter(newFilter);

    // Update circle
    if (circleRef.current && markerRef.current) {
      circleRef.current.setCenter({ lat, lng });
      circleRef.current.setRadius(radius * 1000);
      markerRef.current.setPosition({ lat, lng });
    } else {
      addMarkerAndCircle(lat, lng, radius);
    }

    // Reverse geocode
    reverseGeocode(lat, lng);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!window.google?.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    try {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const addr = results[0].formatted_address;
          setAddress(addr);
          setTempFilter(prev => prev ? { ...prev, address: addr } : null);
        }
      });
    } catch {
      // Ignore geocoding errors
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (tempFilter) {
      setTempFilter({ ...tempFilter, radius: newRadius });

      if (circleRef.current) {
        circleRef.current.setRadius(newRadius * 1000);
      }
    }
  };

  const handleSave = () => {
    if (tempFilter) {
      setSavedFilter(tempFilter);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tempFilter));
      onFilterChange({ lat: tempFilter.lat, lng: tempFilter.lng, radius: tempFilter.radius });
    }
    setIsOpen(false);
  };

  const clearFilter = () => {
    setTempFilter(null);
    setSavedFilter(null);
    setAddress("");
    localStorage.removeItem(STORAGE_KEY);
    onFilterChange(null);
    markerRef.current?.setMap(null);
    circleRef.current?.setMap(null);
    markerRef.current = null;
    circleRef.current = null;
  };

  const handleCancel = () => {
    setTempFilter(savedFilter);
    setRadius(savedFilter?.radius || 100);
    setAddress(savedFilter?.address || "");
    setIsOpen(false);
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Filtruj wedlug lokalizacji</span>
        {savedFilter && (
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
            {savedFilter.radius} km
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Filtruj wedlug lokalizacji</h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Kliknij na mape aby wybrac punkt, nastepnie wybierz promien.
            </p>

            {/* Map */}
            <div className="relative">
              {!mapReady && (
                <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
                  <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div
                ref={mapRef}
                className="w-full h-72 rounded-lg border border-gray-200"
              />
            </div>

            {/* Radius buttons */}
            <div className="flex items-center gap-3 mt-4">
              <span className="text-sm text-gray-600">Promien:</span>
              <div className="flex gap-1 flex-wrap">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRadiusChange(r)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      radius === r
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            {/* Selected address */}
            {tempFilter && address && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-medium">Punkt:</span> {address}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Pokaze zlecenia w promieniu {tempFilter.radius} km
                </p>
              </div>
            )}

            {!tempFilter && (
              <p className="mt-4 text-xs text-gray-500">
                Brak filtra - wyswietlane sa wszystkie zlecenia
              </p>
            )}

            {/* Action buttons */}
            <div className="flex justify-between mt-5">
              {tempFilter ? (
                <button
                  onClick={clearFilter}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Wyczysc filtr
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Haversine distance calculation
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
