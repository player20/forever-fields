"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button, Badge } from "@/components/ui";
import {
  ZoomIn,
  ZoomOut,
  Locate,
  Flame,
  Users,
  Flower2,
  PawPrint
} from "lucide-react";
import { MapCandleLighting } from "./MapCandleLighting";
import type { CemeteryMapProps, MemorialPlot } from "./types";

// Cemetery-themed map style (muted greens and grays)
const MAP_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster" as const,
      source: "osm",
      paint: {
        "raster-saturation": -0.3,
        "raster-brightness-min": 0.1,
      },
    },
  ],
};

export function CemeteryMap({
  plots,
  selectedPlotId,
  onSelectPlot,
  showUserLocation = true,
  userLocation,
  className = "",
}: CemeteryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(15);
  const [showCandleLighting, setShowCandleLighting] = useState(false);
  const [candlePlot, setCandlePlot] = useState<MemorialPlot | null>(null);
  const [trackingUser, setTrackingUser] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [_currentUserLocation, setCurrentUserLocation] = useState<{lat: number; lng: number} | null>(userLocation || null);

  // Calculate map center from plots
  const mapCenter = plots.length > 0
    ? {
        lng: plots.reduce((sum, p) => sum + p.gpsLng, 0) / plots.length,
        lat: plots.reduce((sum, p) => sum + p.gpsLat, 0) / plots.length,
      }
    : { lng: -74.006, lat: 40.7128 }; // Default to NYC

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [mapCenter.lng, mapCenter.lat],
      zoom: 15,
      pitch: 0,
      bearing: 0,
    });

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    map.current.on("zoom", () => {
      if (map.current) {
        setCurrentZoom(Math.round(map.current.getZoom()));
      }
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }
      map.current?.remove();
      map.current = null;
    };
  }, [mapCenter.lat, mapCenter.lng]);

  // Handle plot markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add markers for each plot
    plots.forEach(plot => {
      const markerEl = document.createElement("div");
      markerEl.className = "cemetery-plot-marker";
      markerEl.style.cssText = `
        width: 50px;
        height: 50px;
        cursor: pointer;
        transition: transform 0.2s ease;
      `;

      // Render the React marker into the DOM element
      const isSelected = selectedPlotId === plot.id;
      const isPet = plot.type === "pet";

      markerEl.innerHTML = `
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <div style="
            width: ${isPet ? '36px' : '44px'};
            height: ${isPet ? '36px' : '44px'};
            border-radius: ${isPet ? '8px' : '50%'};
            background: ${plot.hasMemorial
              ? (isPet ? 'linear-gradient(135deg, #fef3c7, #fbbf24)' : 'linear-gradient(135deg, #d1e7dd, #a7c9a2)')
              : '#f3f4f6'};
            border: 3px solid ${isSelected ? (isPet ? '#d97706' : '#5a7d5a') : 'white'};
            box-shadow: ${isSelected ? '0 0 20px rgba(167, 201, 162, 0.5)' : '0 4px 12px rgba(0,0,0,0.15)'};
            display: flex;
            align-items: center;
            justify-content: center;
            transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
            transition: all 0.3s ease;
          ">
            ${plot.profilePhoto
              ? `<img src="${plot.profilePhoto}" style="width: 100%; height: 100%; object-fit: cover; border-radius: ${isPet ? '6px' : '50%'};" />`
              : `<span style="font-size: 14px; font-weight: bold; color: ${plot.hasMemorial ? (isPet ? '#92400e' : '#4a6741') : '#9ca3af'};">
                  ${plot.name.split(' ').map(n => n[0]).join('')}
                </span>`
            }
          </div>
          ${plot.hasActiveCandle ? `
            <div style="
              position: absolute;
              top: -8px;
              right: -4px;
              width: 20px;
              height: 20px;
              background: radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                <path d="M12 2c.5.5 1 1.5 1 3 0 2-2 3-2 3s-2-1-2-3c0-1.5.5-2.5 1-3 .5.5 1.5 1.5 2 0z"/>
                <path d="M12 8v14"/>
                <path d="M8 22h8"/>
              </svg>
            </div>
          ` : ''}
          ${isPet ? `
            <div style="
              position: absolute;
              bottom: -4px;
              left: -4px;
              width: 16px;
              height: 16px;
              background: #fef3c7;
              border-radius: 50%;
              border: 2px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2.5">
                <ellipse cx="9" cy="10" rx="2" ry="3"/>
                <ellipse cx="15" cy="10" rx="2" ry="3"/>
                <ellipse cx="6" cy="16" rx="2" ry="3"/>
                <ellipse cx="18" cy="16" rx="2" ry="3"/>
                <ellipse cx="12" cy="20" rx="4" ry="3"/>
              </svg>
            </div>
          ` : ''}
          <div style="
            margin-top: 4px;
            padding: 2px 8px;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-size: 11px;
            font-weight: 500;
            color: #374151;
            white-space: nowrap;
            max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
          ">
            ${plot.name.split(' ')[0]}
          </div>
        </div>
      `;

      markerEl.addEventListener("click", () => {
        onSelectPlot?.(plot);
      });

      markerEl.addEventListener("mouseenter", () => {
        markerEl.style.transform = "scale(1.1)";
      });

      markerEl.addEventListener("mouseleave", () => {
        markerEl.style.transform = "scale(1)";
      });

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([plot.gpsLng, plot.gpsLat])
        .addTo(map.current!);

      markersRef.current.set(plot.id, marker);
    });
  }, [plots, selectedPlotId, mapLoaded, onSelectPlot]);

  // Handle user location tracking
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported");
      return;
    }

    setTrackingUser(true);
    setGpsError(null);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentUserLocation({ lat: latitude, lng: longitude });

        if (map.current) {
          // Update or create user marker
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([longitude, latitude]);
          } else {
            const userEl = document.createElement("div");
            userEl.innerHTML = `
              <div style="
                width: 20px;
                height: 20px;
                background: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                animation: pulse 2s infinite;
              "></div>
              <style>
                @keyframes pulse {
                  0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
                  50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
                }
              </style>
            `;

            userMarkerRef.current = new maplibregl.Marker({ element: userEl })
              .setLngLat([longitude, latitude])
              .addTo(map.current);
          }

          // Center map on user
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 17,
            duration: 1000,
          });
        }
      },
      (error) => {
        setGpsError(error.message);
        setTrackingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleZoom = (delta: number) => {
    if (map.current) {
      map.current.zoomTo(map.current.getZoom() + delta, { duration: 300 });
    }
  };

  const handleLightCandle = (plot: MemorialPlot) => {
    setCandlePlot(plot);
    setShowCandleLighting(true);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleCandleLit = (duration: string) => {
    // In real app, would call API to light candle
    console.log(`Candle lit for ${duration} on plot ${candlePlot?.id}`);
    setShowCandleLighting(false);
    setCandlePlot(null);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }
  };

  const selectedPlot = plots.find(p => p.id === selectedPlotId);

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-lg ${className}`}>
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full min-h-[500px]" />

      {/* Zoom indicator */}
      <div className="absolute top-4 left-4">
        <Badge variant="secondary" className="bg-white/90 shadow-sm backdrop-blur-sm">
          {currentZoom}x
        </Badge>
      </div>

      {/* Custom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleZoom(1)}
          className="w-10 h-10 p-0 bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleZoom(-1)}
          className="w-10 h-10 p-0 bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </Button>
        {showUserLocation && (
          <Button
            variant="secondary"
            size="sm"
            onClick={startLocationTracking}
            className={`w-10 h-10 p-0 shadow-sm backdrop-blur-sm ${
              trackingUser ? "bg-blue-100 hover:bg-blue-200" : "bg-white/90 hover:bg-white"
            }`}
            aria-label="Find my location"
          >
            <Locate className={`w-5 h-5 ${trackingUser ? "text-blue-600" : ""}`} />
          </Button>
        )}
      </div>

      {/* Selected plot info card */}
      <AnimatePresence>
        {selectedPlot && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-sage-pale/50">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`relative w-16 h-16 rounded-${selectedPlot.type === 'pet' ? 'xl' : 'full'} overflow-hidden ring-2 ring-${selectedPlot.type === 'pet' ? 'gold' : 'sage'} flex-shrink-0`}>
                  {selectedPlot.profilePhoto ? (
                    <img
                      src={selectedPlot.profilePhoto}
                      alt={selectedPlot.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      selectedPlot.hasMemorial
                        ? selectedPlot.type === 'pet' ? 'bg-gold-light' : 'bg-sage-pale'
                        : 'bg-gray-100'
                    }`}>
                      {selectedPlot.type === 'pet' ? (
                        <PawPrint className="w-6 h-6 text-gold-dark" />
                      ) : (
                        <span className="text-lg font-serif font-semibold text-sage-dark">
                          {selectedPlot.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      )}
                    </div>
                  )}
                  {selectedPlot.hasActiveCandle && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-sm" />
                      <Flame className="w-4 h-4 text-amber-500 relative z-10" />
                    </motion.div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-dark truncate">{selectedPlot.name}</h3>
                  {selectedPlot.birthYear && selectedPlot.deathYear && (
                    <p className="text-sm text-gray-body">
                      {selectedPlot.birthYear} – {selectedPlot.deathYear}
                    </p>
                  )}
                  {selectedPlot.cemeteryName && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {selectedPlot.cemeteryName}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-body">
                    {selectedPlot.activeCandleCount !== undefined && selectedPlot.activeCandleCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        {selectedPlot.activeCandleCount}
                      </span>
                    )}
                    {selectedPlot.recentVisitors !== undefined && selectedPlot.recentVisitors > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        {selectedPlot.recentVisitors}
                      </span>
                    )}
                    {selectedPlot.hasMemorial && (
                      <span className="flex items-center gap-1">
                        <Flower2 className="w-3 h-3 text-sage" />
                        Memorial
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => handleLightCandle(selectedPlot)}
                  className="flex-1"
                >
                  <Flame className="w-4 h-4 mr-1" />
                  Light Candle
                </Button>
                {selectedPlot.hasMemorial && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Flower2 className="w-4 h-4 mr-1" />
                    View Memorial
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS Error */}
      {gpsError && (
        <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto">
          <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg shadow">
            {gpsError}
          </div>
        </div>
      )}

      {/* Candle lighting modal */}
      {candlePlot && (
        <MapCandleLighting
          plot={candlePlot}
          isOpen={showCandleLighting}
          onClose={() => {
            setShowCandleLighting(false);
            setCandlePlot(null);
          }}
          onLightCandle={handleCandleLit}
        />
      )}
    </div>
  );
}
