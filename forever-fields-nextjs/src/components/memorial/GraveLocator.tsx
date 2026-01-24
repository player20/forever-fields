"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

interface GraveLocation {
  deceasedName: string;
  cemeteryName: string;
  cemeteryAddress?: string;
  cemeteryCity?: string;
  cemeteryState?: string;
  cemeteryCountry?: string;
  section?: string;
  lot?: string;
  plot?: string;
  gpsLat: number;
  gpsLng: number;
  headstonePhotoUrl?: string;
  epitaph?: string;
  notes?: string;
}

interface GraveLocatorProps {
  location: GraveLocation;
  showDirections?: boolean;
  onVisitLogged?: (visit: { date: Date; note?: string }) => void;
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

export function GraveLocator({
  location,
  showDirections = true,
  onVisitLogged,
}: GraveLocatorProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [bearing, setBearing] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [visitNote, setVisitNote] = useState("");
  const [showVisitForm, setShowVisitForm] = useState(false);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Calculate bearing (direction) to the grave
  const calculateBearing = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const λ1 = (lng1 * Math.PI) / 180;
    const λ2 = (lng2 * Math.PI) / 180;

    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    const θ = Math.atan2(y, x);

    return ((θ * 180) / Math.PI + 360) % 360; // Bearing in degrees
  }, []);

  // Get bearing direction as text
  const getBearingDirection = (degrees: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // Format distance for display
  const formatDistance = (meters: number): string => {
    if (meters < 10) return "You're here!";
    if (meters < 100) return `${Math.round(meters)} meters`;
    if (meters < 1000) return `${Math.round(meters)} m`;
    if (meters < 10000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters / 1000)} km`;
  };

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(userLoc);

        // Calculate distance and bearing
        const dist = calculateDistance(
          userLoc.lat,
          userLoc.lng,
          location.gpsLat,
          location.gpsLng
        );
        setDistance(dist);

        const bear = calculateBearing(
          userLoc.lat,
          userLoc.lng,
          location.gpsLat,
          location.gpsLng
        );
        setBearing(bear);

        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable location access.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [location.gpsLat, location.gpsLng, calculateDistance, calculateBearing]);

  // Watch position for continuous updates
  const [watchId, setWatchId] = useState<number | null>(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(userLoc);

        const dist = calculateDistance(
          userLoc.lat,
          userLoc.lng,
          location.gpsLat,
          location.gpsLng
        );
        setDistance(dist);

        const bear = calculateBearing(
          userLoc.lat,
          userLoc.lng,
          location.gpsLat,
          location.gpsLng
        );
        setBearing(bear);
      },
      (error) => {
        console.error("Watch position error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );

    setWatchId(id);
  }, [location.gpsLat, location.gpsLng, calculateDistance, calculateBearing]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Log a visit
  const handleLogVisit = useCallback(() => {
    onVisitLogged?.({
      date: new Date(),
      note: visitNote || undefined,
    });
    setVisitNote("");
    setShowVisitForm(false);
  }, [visitNote, onVisitLogged]);

  // Open in external maps app
  const openInMaps = useCallback((app: "google" | "apple" | "waze") => {
    const { gpsLat, gpsLng, cemeteryName } = location;
    let url = "";

    switch (app) {
      case "google":
        url = `https://www.google.com/maps/dir/?api=1&destination=${gpsLat},${gpsLng}&destination_place_id=${encodeURIComponent(cemeteryName)}`;
        break;
      case "apple":
        url = `https://maps.apple.com/?daddr=${gpsLat},${gpsLng}&dirflg=d`;
        break;
      case "waze":
        url = `https://waze.com/ul?ll=${gpsLat},${gpsLng}&navigate=yes`;
        break;
    }

    window.open(url, "_blank");
  }, [location]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📍</span> Grave Locator
        </CardTitle>
        <CardDescription>
          Find the resting place of {location.deceasedName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Cemetery Info */}
          <div className="bg-sage-pale/30 rounded-lg p-4">
            <div className="flex items-start gap-4">
              {location.headstonePhotoUrl ? (
                <Image
                  src={location.headstonePhotoUrl}
                  alt="Headstone"
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover rounded-lg"
                  unoptimized={location.headstonePhotoUrl.startsWith("blob:") || location.headstonePhotoUrl.startsWith("data:")}
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-3xl">
                  🪦
                </div>
              )}
              <div>
                <h3 className="font-display text-lg text-sage-dark">
                  {location.cemeteryName}
                </h3>
                <p className="text-sm text-gray-600">
                  {[location.cemeteryCity, location.cemeteryState, location.cemeteryCountry]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {(location.section || location.lot || location.plot) && (
                  <p className="text-sm text-sage mt-1">
                    {[
                      location.section && `Section ${location.section}`,
                      location.lot && `Lot ${location.lot}`,
                      location.plot && `Plot ${location.plot}`,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}
                {location.epitaph && (
                  <p className="text-sm italic text-gray-500 mt-2">
                    "{location.epitaph}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Location & Distance */}
          <div className="text-center py-6">
            {!userLocation ? (
              <div>
                <Button
                  onClick={getUserLocation}
                  disabled={isLocating}
                  className="px-6"
                >
                  {isLocating ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>
                      Locating...
                    </>
                  ) : (
                    <>📍 Find My Location</>
                  )}
                </Button>
                {locationError && (
                  <p className="text-sm text-red-500 mt-2">{locationError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Distance Display */}
                <div className="bg-white border-2 border-sage rounded-2xl p-6 inline-block">
                  <div className="text-4xl font-display text-sage-dark">
                    {distance !== null ? formatDistance(distance) : "---"}
                  </div>
                  {bearing !== null && distance !== null && distance > 10 && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-gray-600">
                      <span
                        className="text-2xl transition-transform"
                        style={{ transform: `rotate(${bearing}deg)` }}
                      >
                        ↑
                      </span>
                      <span>{getBearingDirection(bearing)}</span>
                    </div>
                  )}
                </div>

                {/* Accuracy */}
                <p className="text-xs text-gray-400">
                  GPS accuracy: ±{Math.round(userLocation.accuracy)} meters
                </p>

                {/* Live tracking toggle */}
                <div className="flex justify-center gap-3">
                  {watchId === null ? (
                    <Button variant="outline" onClick={startWatching} size="sm">
                      🔄 Enable Live Tracking
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={stopWatching} size="sm">
                      ⏸️ Stop Tracking
                    </Button>
                  )}
                  <Button variant="outline" onClick={getUserLocation} size="sm">
                    🔃 Refresh
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Options */}
          {showDirections && (
            <div>
              <h4 className="font-medium text-sage-dark mb-3">Get Directions</h4>
              <div className="grid grid-cols-3 sm:gap-3 gap-2">
                <button
                  onClick={() => openInMaps("google")}
                  className="p-3 bg-white border rounded-lg hover:border-sage hover:shadow-sm transition-all text-center"
                >
                  <div className="text-2xl mb-1">🗺️</div>
                  <div className="text-xs text-gray-600">Google Maps</div>
                </button>
                <button
                  onClick={() => openInMaps("apple")}
                  className="p-3 bg-white border rounded-lg hover:border-sage hover:shadow-sm transition-all text-center"
                >
                  <div className="text-2xl mb-1">🍎</div>
                  <div className="text-xs text-gray-600">Apple Maps</div>
                </button>
                <button
                  onClick={() => openInMaps("waze")}
                  className="p-3 bg-white border rounded-lg hover:border-sage hover:shadow-sm transition-all text-center"
                >
                  <div className="text-2xl mb-1">🚗</div>
                  <div className="text-xs text-gray-600">Waze</div>
                </button>
              </div>
            </div>
          )}

          {/* GPS Coordinates */}
          <div className="text-center text-sm">
            <p className="text-gray-400">GPS Coordinates</p>
            <p className="font-mono text-gray-600">
              {location.gpsLat.toFixed(6)}, {location.gpsLng.toFixed(6)}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${location.gpsLat}, ${location.gpsLng}`);
              }}
              className="text-sage hover:underline text-xs mt-1"
            >
              Copy coordinates
            </button>
          </div>

          {/* Log Visit */}
          {onVisitLogged && (
            <div className="border-t pt-4">
              {!showVisitForm ? (
                <button
                  onClick={() => setShowVisitForm(true)}
                  className="w-full p-3 bg-sage-pale/50 rounded-lg text-sage-dark hover:bg-sage-pale transition-colors flex items-center justify-center gap-2"
                >
                  <span>🌸</span> Log Your Visit
                </button>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={visitNote}
                    onChange={(e) => setVisitNote(e.target.value)}
                    placeholder="Add a note about your visit (optional)..."
                    className="w-full p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-sage focus:border-sage"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVisitForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleLogVisit}>
                      🌸 Log Visit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {location.notes && (
            <div className="bg-gold/10 rounded-lg p-3 text-sm">
              <span className="font-medium text-sage-dark">Notes:</span>{" "}
              <span className="text-gray-600">{location.notes}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
