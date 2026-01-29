"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Textarea } from "@/components/ui";
import {
  Baby,
  Home,
  GraduationCap,
  Briefcase,
  Heart,
  Plane,
  Star,
  MapPin,
  type LucideIcon,
} from "lucide-react";

interface MemoryLocation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  year?: string;
  type: "birth" | "home" | "school" | "work" | "wedding" | "travel" | "special" | "other";
  photos?: string[];
  addedBy: string;
  addedAt: Date;
}

interface MemoryMapProps {
  ancestorName: string;
  locations?: MemoryLocation[];
  onAddLocation?: (location: Omit<MemoryLocation, "id" | "addedAt">) => void;
  currentUser?: string;
}

const locationTypes: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  birth: { icon: Baby, label: "Birthplace", color: "#FFD700" },
  home: { icon: Home, label: "Home", color: "#4CAF50" },
  school: { icon: GraduationCap, label: "School", color: "#2196F3" },
  work: { icon: Briefcase, label: "Work", color: "#9C27B0" },
  wedding: { icon: Heart, label: "Wedding", color: "#E91E63" },
  travel: { icon: Plane, label: "Travel", color: "#00BCD4" },
  special: { icon: Star, label: "Special Place", color: "#FF9800" },
  other: { icon: MapPin, label: "Other", color: "#607D8B" },
};

// Sample locations for demo
const sampleLocations: MemoryLocation[] = [
  {
    id: "1",
    lat: 40.7128,
    lng: -74.006,
    title: "Where She Was Born",
    description: "Margaret was born in a small apartment in Brooklyn. Her mother always said she came into the world on the coldest day of 1942.",
    year: "1942",
    type: "birth",
    addedBy: "Mom",
    addedAt: new Date(),
  },
  {
    id: "2",
    lat: 40.758,
    lng: -73.9855,
    title: "First Teaching Job",
    description: "PS 142 - where she taught 3rd grade for 15 years. She still remembered every student's name.",
    year: "1965",
    type: "work",
    addedBy: "Uncle Jim",
    addedAt: new Date(),
  },
  {
    id: "3",
    lat: 41.0082,
    lng: -74.1228,
    title: "The Lake House",
    description: "Every summer, the whole family would spend two weeks here. Best memories of catching fireflies and grandma's lemonade.",
    year: "1970s-2010s",
    type: "special",
    addedBy: "Sarah",
    addedAt: new Date(),
  },
  {
    id: "4",
    lat: 40.6892,
    lng: -74.0445,
    title: "Wedding Day",
    description: "She married Robert at St. Mary's Church on June 15, 1963. 'The happiest day of my life,' she always said.",
    year: "1963",
    type: "wedding",
    addedBy: "Mom",
    addedAt: new Date(),
  },
];

export function MemoryMap({
  ancestorName,
  locations = sampleLocations,
  onAddLocation,
  currentUser = "You",
}: MemoryMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<MemoryLocation | null>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({
    title: "",
    description: "",
    year: "",
    type: "special" as MemoryLocation["type"],
    address: "",
  });
  const [viewMode, setViewMode] = useState<"map" | "list" | "timeline">("map");

  // Handle adding new location
  const handleAddLocation = useCallback(() => {
    if (!newLocation.title || !newLocation.description) return;

    onAddLocation?.({
      lat: 40.7 + Math.random() * 0.2, // Demo: random location
      lng: -74 + Math.random() * 0.2,
      title: newLocation.title,
      description: newLocation.description,
      year: newLocation.year || undefined,
      type: newLocation.type,
      addedBy: currentUser,
    });

    setNewLocation({ title: "", description: "", year: "", type: "special", address: "" });
    setIsAddingLocation(false);
  }, [newLocation, currentUser, onAddLocation]);

  // Sort locations by year for timeline
  const sortedLocations = [...locations].sort((a, b) => {
    const yearA = parseInt(a.year?.split("-")[0] || "9999");
    const yearB = parseInt(b.year?.split("-")[0] || "9999");
    return yearA - yearB;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Memory Map</CardTitle>
            <CardDescription>
              Places that mattered in {ancestorName}'s life
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(["map", "list", "timeline"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm rounded-full capitalize transition-colors ${
                  viewMode === mode
                    ? "bg-sage text-white"
                    : "bg-sage-pale text-sage-dark hover:bg-sage-light"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Map View */}
        {viewMode === "map" && (
          <div className="space-y-4">
            {/* Map placeholder - would integrate with Leaflet/Mapbox */}
            <div className="relative bg-sage-pale/30 rounded-lg overflow-hidden" style={{ height: 400 }}>
              {/* Simple visual map representation */}
              <div className="absolute inset-0 bg-gradient-to-br from-sage-pale to-sage-light opacity-50" />

              {/* Location markers */}
              {locations.map((loc, index) => {
                const type = locationTypes[loc.type];
                const top = 20 + (index % 4) * 20 + Math.random() * 10;
                const left = 15 + (index % 5) * 15 + Math.random() * 10;

                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 ${
                      selectedLocation?.id === loc.id ? "scale-125 z-10" : ""
                    }`}
                    style={{ top: `${top}%`, left: `${left}%` }}
                    title={loc.title}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                      style={{ backgroundColor: type.color }}
                    >
                      <type.icon className="w-5 h-5 text-white" />
                    </div>
                  </button>
                );
              })}

              {/* Map attribution */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
                Interactive map • {locations.length} memories
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(locationTypes).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1 text-xs text-gray-600">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: value.color }}
                  >
                    <value.icon className="w-2.5 h-2.5 text-white" />
                  </span>
                  {value.label}
                </div>
              ))}
            </div>

            {/* Selected Location Details */}
            {selectedLocation && (
              <div className="bg-white border border-sage-light rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  {(() => {
                    const TypeIcon = locationTypes[selectedLocation.type].icon;
                    return (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: locationTypes[selectedLocation.type].color }}
                      >
                        <TypeIcon className="w-6 h-6 text-white" />
                      </div>
                    );
                  })()}
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-sage-dark">
                      {selectedLocation.title}
                    </h3>
                    {selectedLocation.year && (
                      <p className="text-sm text-sage">{selectedLocation.year}</p>
                    )}
                    <p className="text-gray-600 mt-2">{selectedLocation.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Added by {selectedLocation.addedBy}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {locations.map((loc) => {
              const type = locationTypes[loc.type];
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className="w-full text-left p-3 bg-sage-pale/30 rounded-lg hover:bg-sage-pale/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: type.color }}
                    >
                      <type.icon className="w-5 h-5 text-white" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sage-dark truncate">{loc.title}</p>
                      <p className="text-sm text-gray-500 truncate">{loc.description}</p>
                    </div>
                    {loc.year && (
                      <span className="text-sm text-sage bg-white px-2 py-1 rounded">
                        {loc.year}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Timeline View */}
        {viewMode === "timeline" && (
          <div className="relative pl-8 space-y-6 max-h-96 overflow-y-auto">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-sage-light" />

            {sortedLocations.map((loc) => {
              const type = locationTypes[loc.type];
              return (
                <div key={loc.id} className="relative">
                  <div
                    className="absolute left-[-1.35rem] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
                    style={{ backgroundColor: type.color }}
                  >
                    <type.icon className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sage-dark">{loc.title}</span>
                      {loc.year && (
                        <span className="text-xs bg-sage-pale text-sage-dark px-2 py-0.5 rounded">
                          {loc.year}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{loc.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Added by {loc.addedBy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Location Form */}
        {isAddingLocation ? (
          <div className="mt-4 p-4 bg-sage-pale/30 rounded-lg space-y-4">
            <h3 className="font-medium text-sage-dark">Add a Meaningful Place</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Place Name</label>
                <Input
                  value={newLocation.title}
                  onChange={(e) => setNewLocation({ ...newLocation, title: e.target.value })}
                  placeholder="e.g., The Old Family Home"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Year(s)</label>
                <Input
                  value={newLocation.year}
                  onChange={(e) => setNewLocation({ ...newLocation, year: e.target.value })}
                  placeholder="e.g., 1965 or 1970s-1990s"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Type</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(locationTypes).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setNewLocation({ ...newLocation, type: key as MemoryLocation["type"] })}
                    className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors ${
                      newLocation.type === key
                        ? "bg-sage text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <value.icon className="w-4 h-4" />
                    {value.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Story / Memory</label>
              <Textarea
                value={newLocation.description}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                placeholder="Share the story of this place..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAddingLocation(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLocation} disabled={!newLocation.title || !newLocation.description}>
                Add to Map
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => setIsAddingLocation(true)}>
              + Add a Place to the Map
            </Button>
          </div>
        )}

        {/* Family Contributors */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            {new Set(locations.map(l => l.addedBy)).size} family members have contributed memories
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
