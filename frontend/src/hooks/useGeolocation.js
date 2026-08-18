import { useEffect, useState } from "react";

// Falls back to a Ghaziabad/Delhi-NCR coordinate if the browser denies/lacks
// geolocation, so the demo still works without a location prompt.
const FALLBACK_LOCATION = { lat: 28.6692, lng: 77.4538 };

export default function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("locating"); // locating | granted | denied | unsupported

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(FALLBACK_LOCATION);
      setStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => {
        setLocation(FALLBACK_LOCATION);
        setStatus("denied");
      },
      { timeout: 6000 }
    );
  }, []);

  return { location, status };
}
