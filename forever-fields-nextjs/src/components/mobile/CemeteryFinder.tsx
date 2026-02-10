"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";

interface Cemetery {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  lat: number;
  lng: number;
  distance?: number; // km
  source: "osm" | "google" | "billiongraves";
}

interface CemeteryFinderProps {
  /** Callback when a cemetery is selected */
  onSelect?: (cemetery: Cemetery) => void;
  /** Whether to show as modal or inline */
  variant?: "modal" | "inline" | "sheet";
  /** Initial search query */
  initialQuery?: string;
  /** Whether the finder is open (for modal/sheet variants) */
  isOpen?: boolean;
  /** Callback to close (for modal/sheet variants) */
  onClose?: () => void;
}

type LocationState = "idle" | "requesting" | "granted" | "denied" | "error";

export function CemeteryFinder({
  onSelect,
  variant = "inline",
  initialQuery = "",
  isOpen = true,
  onClose,
}: CemeteryFinderProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Cemetery[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(50); // km

  // Get user's location
  const requestLocation = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setLocationState("error");
      setError("Location services not available");
      return;
    }

    setLocationState("requesting");
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        });
      });

      setUserLocation({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
      setLocationState("granted");
    } catch (err) {
      const geoError = err as GeolocationPositionError;
      if (geoError.code === geoError.PERMISSION_DENIED) {
        setLocationState("denied");
        setError("Location permission denied");
      } else {
        setLocationState("error");
        setError("Could not get your location");
      }
    }
  }, []);

  // Search for cemeteries
  const searchCemeteries = useCallback(
    async (searchQuery?: string) => {
      const q = searchQuery ?? query;
      if (!q && !userLocation) {
        setError("Please enter a search term or enable location");
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch("/api/cemetery/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q || undefined,
            lat: userLocation?.lat,
            lon: userLocation?.lon,
            radius: searchRadius,
          }),
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();

        // Transform and sort results
        const cemeteries: Cemetery[] = (data.results || []).map(
          (r: {
            id: string;
            cemeteryName: string;
            cemeteryCity?: string;
            cemeteryState?: string;
            cemeteryCountry?: string;
            gpsLat: number;
            gpsLng: number;
            source: string;
          }) => ({
            id: r.id,
            name: r.cemeteryName,
            city: r.cemeteryCity,
            state: r.cemeteryState,
            country: r.cemeteryCountry,
            lat: r.gpsLat,
            lng: r.gpsLng,
            source: r.source,
            distance: userLocation
              ? calculateDistance(userLocation.lat, userLocation.lon, r.gpsLat, r.gpsLng)
              : undefined,
          })
        );

        // Sort by distance if we have location
        if (userLocation) {
          cemeteries.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        }

        setResults(cemeteries);

        if (cemeteries.length === 0) {
          setError("No cemeteries found. Try a different search.");
        }
      } catch (err) {
        console.error("Cemetery search error:", err);
        setError("Search failed. Please try again.");
      } finally {
        setIsSearching(false);
      }
    },
    [query, userLocation, searchRadius]
  );

  // Auto-search when location is obtained
  useEffect(() => {
    if (userLocation && !query) {
      searchCemeteries();
    }
  }, [userLocation, query, searchCemeteries]);

  const handleSelect = useCallback(
    (cemetery: Cemetery) => {
      onSelect?.(cemetery);
      onClose?.();
    },
    [onSelect, onClose]
  );

  const openInMaps = useCallback((cemetery: Cemetery) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${cemetery.lat},${cemetery.lng}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  }, []);

  const content = (
    <div className="flex flex-col h-full">
      {/* Search header */}
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchCemeteries()}
              placeholder="Search by name or city..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => searchCemeteries()}
            disabled={isSearching}
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {/* Location button */}
        <div className="flex items-center gap-2">
          <Button
            variant={locationState === "granted" ? "outline" : "secondary"}
            size="sm"
            onClick={requestLocation}
            disabled={locationState === "requesting"}
            className="flex-1"
          >
            {locationState === "requesting" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : locationState === "granted" ? (
              <MapPin className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Navigation className="w-4 h-4 mr-2" />
            )}
            {locationState === "granted"
              ? "Location enabled"
              : locationState === "requesting"
              ? "Getting location..."
              : "Use my location"}
          </Button>

          {userLocation && (
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
            </select>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-sage animate-spin mb-3" />
            <p className="text-gray-500">Searching cemeteries...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="divide-y">
            {results.map((cemetery) => (
              <CemeteryResultItem
                key={cemetery.id}
                cemetery={cemetery}
                onSelect={() => handleSelect(cemetery)}
                onOpenMaps={() => openInMaps(cemetery)}
              />
            ))}
          </div>
        ) : !error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">Find a cemetery</p>
            <p className="text-sm text-gray-400">
              Search by name or enable location to find nearby cemeteries
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );

  // Inline variant
  if (variant === "inline") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {content}
      </div>
    );
  }

  // Sheet variant (bottom sheet)
  if (variant === "sheet") {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              {content}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Modal variant
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-2xl overflow-hidden max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-dark">Find Cemetery</h2>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CemeteryResultItem({
  cemetery,
  onSelect,
  onOpenMaps,
}: {
  cemetery: Cemetery;
  onSelect: () => void;
  onOpenMaps: () => void;
}) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <button
        onClick={onSelect}
        className="w-full text-left flex items-start gap-3"
      >
        <div className="w-10 h-10 bg-sage-pale rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <MapPin className="w-5 h-5 text-sage-dark" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-dark">{cemetery.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {[cemetery.city, cemetery.state, cemetery.country]
              .filter(Boolean)
              .join(", ")}
          </p>
          {cemetery.distance !== undefined && (
            <p className="text-xs text-sage mt-1">
              {cemetery.distance < 1
                ? `${Math.round(cemetery.distance * 1000)}m away`
                : `${cemetery.distance.toFixed(1)} km away`}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 mt-2" />
      </button>

      {/* Quick action to open in maps */}
      <div className="mt-2 ml-13 pl-13">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenMaps();
          }}
          className="text-xs text-sage hover:text-sage-dark flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          Open in Maps
        </button>
      </div>
    </div>
  );
}

// Haversine formula for distance calculation
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Compact cemetery finder button that opens the sheet
 */
export function CemeteryFinderButton({
  onSelect,
}: {
  onSelect?: (cemetery: Cemetery) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <MapPin className="w-4 h-4 mr-2" />
        Find Cemetery
      </Button>

      <CemeteryFinder
        variant="sheet"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={(cemetery) => {
          onSelect?.(cemetery);
          setIsOpen(false);
        }}
      />
    </>
  );
}

/**
 * Hook for using cemetery finder programmatically
 */
export function useCemeteryFinder() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const getLocation = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      throw new Error("Location not supported");
    }

    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const loc = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
      setLocation(loc);
      return loc;
    } finally {
      setIsLocating(false);
    }
  }, []);

  const searchNearby = useCallback(
    async (radius: number = 50) => {
      const loc = location || (await getLocation());
      const response = await fetch("/api/cemetery/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: loc.lat,
          lon: loc.lon,
          radius,
        }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      return response.json();
    },
    [location, getLocation]
  );

  return { location, isLocating, getLocation, searchNearby };
}
