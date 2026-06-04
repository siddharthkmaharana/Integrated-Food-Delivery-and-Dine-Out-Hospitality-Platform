import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper component to auto-fit bounds
function ChangeView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [bounds, map]);
  return null;
}

// Custom icons using standard Leaflet HTML divIcon
const createCustomIcon = (emoji, bgColor) => {
  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border: 3px solid white;">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const storeIcon = createCustomIcon("🏪", "#f97316"); // orange-500
const customerIcon = createCustomIcon("🏠", "#ef4444"); // red-500
const courierIcon = createCustomIcon("🛵", "#3b82f6"); // blue-500

export default function DeliveryMap({ restaurantLoc, customerLoc, courierLoc, status }) {
  const mapRef = useRef(null);

  // Validate coordinates: [lat, lng]
  const isValidLoc = (loc) => loc && typeof loc.lat === 'number' && typeof loc.lng === 'number';

  const rLoc = isValidLoc(restaurantLoc) ? [restaurantLoc.lat, restaurantLoc.lng] : null;
  const cLoc = isValidLoc(customerLoc) ? [customerLoc.lat, customerLoc.lng] : null;
  const dLoc = isValidLoc(courierLoc) ? [courierLoc.lat, courierLoc.lng] : null;

  // Build bounds based on available markers
  const bounds = [];
  if (rLoc) bounds.push(rLoc);
  if (cLoc) bounds.push(cLoc);
  if (dLoc) bounds.push(dLoc);

  // Fallback center if no coordinates at all (e.g., default map)
  const defaultCenter = [18.5204, 73.8567]; // Pune default

  // Route path
  const routePositions = [];
  
  if (status === "PREPARING" || status === "READY_FOR_PICKUP") {
    // Courier needs to go to restaurant
    if (dLoc) routePositions.push(dLoc);
    if (rLoc) routePositions.push(rLoc);
  } else if (status === "PICKED_UP" || status === "DELIVERING") {
    // Courier needs to go to customer (show path from Store -> Customer for context, but mainly Courier -> Customer)
    // Actually, Courier -> Customer is the active line
    if (dLoc) routePositions.push(dLoc);
    if (cLoc) routePositions.push(cLoc);
  }

  // If no bounds at all, just render an empty map
  if (bounds.length === 0) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center rounded-2xl border border-gray-200">
        <p className="text-gray-400 font-bold text-sm">No Location Data Available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative rounded-2xl overflow-hidden border border-gray-200 z-0">
      <MapContainer
        center={bounds[0] || defaultCenter}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {rLoc && (
          <Marker position={rLoc} icon={storeIcon}>
            <Popup><strong>Restaurant</strong><br/>Pickup Location</Popup>
          </Marker>
        )}

        {cLoc && (
          <Marker position={cLoc} icon={customerIcon}>
            <Popup><strong>Customer</strong><br/>Dropoff Location</Popup>
          </Marker>
        )}

        {dLoc && (
          <Marker position={dLoc} icon={courierIcon}>
            <Popup><strong>Courier</strong><br/>Current Position</Popup>
          </Marker>
        )}

        {routePositions.length > 1 && (
          <Polyline 
            positions={routePositions} 
            color="#3b82f6" 
            weight={4} 
            dashArray="10, 10" 
            opacity={0.7} 
          />
        )}

        <ChangeView bounds={bounds} />
      </MapContainer>
    </div>
  );
}
