import React, { createContext, useContext, useState, useEffect } from "react";

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [coords, setCoords] = useState(() => {
    const saved = localStorage.getItem("user_coords");
    return saved ? JSON.parse(saved) : { latitude: 12.9716, longitude: 77.5946 }; // Default to Bengaluru
  });
  
  const [address, setAddress] = useState(localStorage.getItem("user_address") || "Bengaluru, Karnataka");
  const [isDetecting, setIsDetecting] = useState(false);

  const updateLocation = (newCoords, newAddress) => {
    setCoords(newCoords);
    setAddress(newAddress);
    localStorage.setItem("user_coords", JSON.stringify(newCoords));
    localStorage.setItem("user_address", newAddress);
    localStorage.setItem("user_latitude", newCoords.latitude);
    localStorage.setItem("user_longitude", newCoords.longitude);
    localStorage.setItem("user_location_name", newAddress);
    
    // Trigger a refresh event for components that might not be using the context
    window.dispatchEvent(new CustomEvent("locationUpdated", { detail: { coords: newCoords, address: newAddress } }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const addr = data.address || {};
          const local = addr.suburb || addr.neighbourhood || addr.road || addr.residential || "";
          const city = addr.city || addr.town || addr.village || addr.county || "";
          
          let displayAddress = "";
          if (local) displayAddress = local;
          if (city) displayAddress = displayAddress ? `${displayAddress}, ${city}` : city;
          if (!displayAddress) displayAddress = addr.state || "Detected Location";
          
          updateLocation({ latitude, longitude }, displayAddress);
        } catch (error) {
          console.error("Reverse geocoding failed", error);
          updateLocation({ latitude, longitude }, "Detected Location");
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error("Geolocation failed", error);
        alert("Failed to get your location. Please check your browser permissions.");
        setIsDetecting(false);
      }
    );
  };

  return (
    <LocationContext.Provider value={{ coords, address, isDetecting, updateLocation, detectLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};
