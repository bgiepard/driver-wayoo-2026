// Jasny styl mapy Google dopasowany do light theme aplikacji
export const LIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
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

