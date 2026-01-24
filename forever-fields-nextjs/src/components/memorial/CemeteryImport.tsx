"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@/components/ui";

interface CemeteryRecord {
  id: string;
  source: "findagrave" | "billiongraves" | "interment" | "manual";
  sourceUrl?: string;

  // Person info
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;

  // Cemetery info
  cemeteryName: string;
  cemeteryAddress?: string;
  cemeteryCity?: string;
  cemeteryState?: string;
  cemeteryCountry?: string;

  // Grave location
  section?: string;
  lot?: string;
  plot?: string;
  gpsLat?: number;
  gpsLng?: number;

  // Media
  headstonePhotoUrl?: string;

  // Additional
  epitaph?: string;
  familyLinks?: Array<{ name: string; relationship: string; recordId?: string }>;
}

interface CemeteryImportProps {
  onImport: (record: CemeteryRecord) => void;
  onCancel?: () => void;
  defaultName?: string;
}

type SearchSource = "all" | "findagrave" | "billiongraves" | "interment";

const sourceInfo = {
  findagrave: {
    name: "Find A Grave",
    icon: "🪦",
    description: "World's largest grave database (245M+ memorials)",
    color: "#1a5f7a",
  },
  billiongraves: {
    name: "BillionGraves",
    icon: "📍",
    description: "GPS-located graves with photos",
    color: "#e74c3c",
  },
  interment: {
    name: "Interment.net",
    icon: "📜",
    description: "Free cemetery transcription records",
    color: "#27ae60",
  },
  manual: {
    name: "Manual Entry",
    icon: "✏️",
    description: "Enter cemetery details yourself",
    color: "#7f8c8d",
  },
};

// Demo search results
const demoResults: CemeteryRecord[] = [
  {
    id: "fg-12345",
    source: "findagrave",
    sourceUrl: "https://www.findagrave.com/memorial/12345",
    firstName: "Margaret",
    lastName: "Johnson",
    birthDate: "March 15, 1942",
    deathDate: "January 8, 2023",
    cemeteryName: "Greenwood Memorial Park",
    cemeteryAddress: "123 Memorial Lane",
    cemeteryCity: "Brooklyn",
    cemeteryState: "NY",
    cemeteryCountry: "USA",
    section: "Garden of Peace",
    lot: "A",
    plot: "142",
    gpsLat: 40.6501,
    gpsLng: -73.9496,
    headstonePhotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    epitaph: "Forever in our hearts",
    familyLinks: [
      { name: "Robert Johnson", relationship: "Husband", recordId: "fg-12346" },
    ],
  },
  {
    id: "bg-67890",
    source: "billiongraves",
    sourceUrl: "https://billiongraves.com/grave/67890",
    firstName: "Margaret",
    lastName: "Johnson",
    birthDate: "1942",
    deathDate: "2023",
    cemeteryName: "Evergreen Cemetery",
    cemeteryCity: "Queens",
    cemeteryState: "NY",
    cemeteryCountry: "USA",
    gpsLat: 40.7128,
    gpsLng: -73.8060,
  },
  {
    id: "int-11111",
    source: "interment",
    firstName: "Margaret Ann",
    lastName: "Johnson",
    birthDate: "1942",
    deathDate: "2023",
    cemeteryName: "St. Mary's Catholic Cemetery",
    cemeteryCity: "Staten Island",
    cemeteryState: "NY",
    cemeteryCountry: "USA",
    section: "Section 12",
    lot: "Row B",
    plot: "Grave 7",
  },
];

export function CemeteryImport({
  onImport,
  onCancel,
  defaultName = "",
}: CemeteryImportProps) {
  const [step, setStep] = useState<"search" | "results" | "details" | "manual">("search");
  const [searchQuery, setSearchQuery] = useState(defaultName);
  const [searchSource, setSearchSource] = useState<SearchSource>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<CemeteryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CemeteryRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual entry form
  const [manualRecord, setManualRecord] = useState<Partial<CemeteryRecord>>({
    source: "manual",
    firstName: "",
    lastName: "",
    cemeteryName: "",
  });

  // Search cemetery databases
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch("/api/cemetery/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          source: searchSource,
        }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (data.demo) {
        // Filter demo results based on search query
        const filtered = demoResults.filter((r) =>
          `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setResults(filtered.length > 0 ? filtered : demoResults);
      } else {
        setResults(data.results || []);
      }

      setStep("results");
    } catch (err) {
      console.error("Search error:", err);
      // Fallback to demo results
      setResults(demoResults);
      setStep("results");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchSource]);

  // Select a record to view details
  const handleSelectRecord = useCallback((record: CemeteryRecord) => {
    setSelectedRecord(record);
    setStep("details");
  }, []);

  // Import the selected record
  const handleImport = useCallback(() => {
    if (selectedRecord) {
      onImport(selectedRecord);
    }
  }, [selectedRecord, onImport]);

  // Import manual record
  const handleManualImport = useCallback(() => {
    if (!manualRecord.firstName || !manualRecord.lastName || !manualRecord.cemeteryName) {
      setError("Please fill in name and cemetery");
      return;
    }

    onImport({
      id: `manual-${Date.now()}`,
      source: "manual",
      firstName: manualRecord.firstName,
      lastName: manualRecord.lastName,
      birthDate: manualRecord.birthDate,
      deathDate: manualRecord.deathDate,
      cemeteryName: manualRecord.cemeteryName,
      cemeteryAddress: manualRecord.cemeteryAddress,
      cemeteryCity: manualRecord.cemeteryCity,
      cemeteryState: manualRecord.cemeteryState,
      cemeteryCountry: manualRecord.cemeteryCountry,
      section: manualRecord.section,
      lot: manualRecord.lot,
      plot: manualRecord.plot,
      gpsLat: manualRecord.gpsLat,
      gpsLng: manualRecord.gpsLng,
      epitaph: manualRecord.epitaph,
    });
  }, [manualRecord, onImport]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Cemetery Data</CardTitle>
        <CardDescription>
          Search Find A Grave, BillionGraves, and other databases
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search Step */}
        {step === "search" && (
          <div className="space-y-6">
            {/* Source Selection */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Search in:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["all", "findagrave", "billiongraves", "interment"] as const).map((source) => (
                  <button
                    key={source}
                    onClick={() => setSearchSource(source)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      searchSource === source
                        ? "border-sage bg-sage-pale"
                        : "border-gray-200 hover:border-sage-light"
                    }`}
                  >
                    <div className="text-xl mb-1">
                      {source === "all" ? "🔍" : sourceInfo[source].icon}
                    </div>
                    <div className="text-sm font-medium text-sage-dark">
                      {source === "all" ? "All Sources" : sourceInfo[source].name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Search by name
              </label>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter name (e.g., Margaret Johnson)"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>

            {/* Info about sources */}
            <div className="bg-sage-pale/30 rounded-lg p-4">
              <h4 className="font-medium text-sage-dark mb-2">About Cemetery Databases</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Find A Grave:</strong> 245+ million memorials, photos, family links</p>
                <p><strong>BillionGraves:</strong> GPS coordinates for precise grave location</p>
                <p><strong>Interment.net:</strong> Cemetery transcription records</p>
              </div>
            </div>

            {/* Manual Entry Option */}
            <div className="text-center pt-4 border-t">
              <button
                onClick={() => setStep("manual")}
                className="text-sage hover:underline text-sm"
              >
                Or enter cemetery details manually →
              </button>
            </div>

            {onCancel && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results Step */}
        {step === "results" && (
          <div className="space-y-4">
            <button
              onClick={() => setStep("search")}
              className="text-sage hover:underline text-sm flex items-center gap-1"
            >
              ← New Search
            </button>

            <div className="text-sm text-gray-500">
              Found {results.length} result{results.length !== 1 ? "s" : ""} for "{searchQuery}"
            </div>

            {results.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-gray-500">No results found</p>
                <button
                  onClick={() => setStep("manual")}
                  className="text-sage hover:underline text-sm mt-2"
                >
                  Enter details manually instead
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((record) => {
                  const source = sourceInfo[record.source];
                  return (
                    <button
                      key={record.id}
                      onClick={() => handleSelectRecord(record)}
                      className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-sage hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                          style={{ backgroundColor: source.color }}
                        >
                          {source.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sage-dark">
                              {record.firstName} {record.lastName}
                            </span>
                            {record.gpsLat && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                📍 GPS
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {record.birthDate && `${record.birthDate} - `}
                            {record.deathDate}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {record.cemeteryName}
                            {record.cemeteryCity && `, ${record.cemeteryCity}`}
                            {record.cemeteryState && `, ${record.cemeteryState}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Source: {source.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Details Step */}
        {step === "details" && selectedRecord && (
          <div className="space-y-6">
            <button
              onClick={() => setStep("results")}
              className="text-sage hover:underline text-sm flex items-center gap-1"
            >
              ← Back to Results
            </button>

            {/* Record Header */}
            <div className="flex items-start gap-4">
              {selectedRecord.headstonePhotoUrl ? (
                <img
                  src={selectedRecord.headstonePhotoUrl}
                  alt="Headstone"
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-4xl">
                  🪦
                </div>
              )}
              <div>
                <h2 className="font-display text-xl text-sage-dark">
                  {selectedRecord.firstName} {selectedRecord.lastName}
                </h2>
                <p className="text-gray-600">
                  {selectedRecord.birthDate} — {selectedRecord.deathDate}
                </p>
                {selectedRecord.epitaph && (
                  <p className="text-sm italic text-gray-500 mt-1">
                    "{selectedRecord.epitaph}"
                  </p>
                )}
              </div>
            </div>

            {/* Cemetery Details */}
            <div className="bg-sage-pale/30 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-sage-dark flex items-center gap-2">
                <span>🏛️</span> Cemetery Information
              </h3>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Cemetery:</span>
                  <p className="font-medium">{selectedRecord.cemeteryName}</p>
                </div>
                {selectedRecord.cemeteryAddress && (
                  <div>
                    <span className="text-gray-500">Address:</span>
                    <p>{selectedRecord.cemeteryAddress}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Location:</span>
                  <p>
                    {[selectedRecord.cemeteryCity, selectedRecord.cemeteryState, selectedRecord.cemeteryCountry]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>

              {/* Plot Location */}
              {(selectedRecord.section || selectedRecord.lot || selectedRecord.plot) && (
                <div className="pt-3 border-t border-sage-light">
                  <span className="text-gray-500 text-sm">Plot Location:</span>
                  <p className="font-medium">
                    {[
                      selectedRecord.section && `Section: ${selectedRecord.section}`,
                      selectedRecord.lot && `Lot: ${selectedRecord.lot}`,
                      selectedRecord.plot && `Plot: ${selectedRecord.plot}`,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                </div>
              )}

              {/* GPS Coordinates */}
              {selectedRecord.gpsLat && selectedRecord.gpsLng && (
                <div className="pt-3 border-t border-sage-light">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 text-sm">GPS Coordinates:</span>
                      <p className="font-mono text-sm">
                        {selectedRecord.gpsLat.toFixed(6)}, {selectedRecord.gpsLng.toFixed(6)}
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedRecord.gpsLat},${selectedRecord.gpsLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-sage text-white rounded-lg text-sm hover:bg-sage-dark transition-colors"
                    >
                      📍 Open in Maps
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Family Links */}
            {selectedRecord.familyLinks && selectedRecord.familyLinks.length > 0 && (
              <div>
                <h3 className="font-medium text-sage-dark mb-2">Family Members Found</h3>
                <div className="space-y-2">
                  {selectedRecord.familyLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                      <span>👤</span>
                      <span>{link.name}</span>
                      <span className="text-gray-400">({link.relationship})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Link */}
            {selectedRecord.sourceUrl && (
              <div className="text-sm">
                <a
                  href={selectedRecord.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sage hover:underline flex items-center gap-1"
                >
                  View original record on {sourceInfo[selectedRecord.source].name} →
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setStep("results")}>
                Choose Different
              </Button>
              <Button onClick={handleImport}>
                Import This Record
              </Button>
            </div>
          </div>
        )}

        {/* Manual Entry Step */}
        {step === "manual" && (
          <div className="space-y-6">
            <button
              onClick={() => setStep("search")}
              className="text-sage hover:underline text-sm flex items-center gap-1"
            >
              ← Back to Search
            </button>

            <div className="bg-sage-pale/30 rounded-lg p-4">
              <h3 className="font-medium text-sage-dark mb-1">Manual Entry</h3>
              <p className="text-sm text-gray-500">
                Enter cemetery details if you couldn't find them in the database
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">First Name *</label>
                <Input
                  value={manualRecord.firstName}
                  onChange={(e) => setManualRecord({ ...manualRecord, firstName: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Last Name *</label>
                <Input
                  value={manualRecord.lastName}
                  onChange={(e) => setManualRecord({ ...manualRecord, lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Birth Date</label>
                <Input
                  value={manualRecord.birthDate}
                  onChange={(e) => setManualRecord({ ...manualRecord, birthDate: e.target.value })}
                  placeholder="e.g., March 15, 1942"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Death Date</label>
                <Input
                  value={manualRecord.deathDate}
                  onChange={(e) => setManualRecord({ ...manualRecord, deathDate: e.target.value })}
                  placeholder="e.g., January 8, 2023"
                />
              </div>
            </div>

            {/* Cemetery */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Cemetery Name *</label>
              <Input
                value={manualRecord.cemeteryName}
                onChange={(e) => setManualRecord({ ...manualRecord, cemeteryName: e.target.value })}
                placeholder="Cemetery name"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">City</label>
                <Input
                  value={manualRecord.cemeteryCity}
                  onChange={(e) => setManualRecord({ ...manualRecord, cemeteryCity: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">State</label>
                <Input
                  value={manualRecord.cemeteryState}
                  onChange={(e) => setManualRecord({ ...manualRecord, cemeteryState: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Country</label>
                <Input
                  value={manualRecord.cemeteryCountry}
                  onChange={(e) => setManualRecord({ ...manualRecord, cemeteryCountry: e.target.value })}
                  placeholder="Country"
                />
              </div>
            </div>

            {/* Plot Location */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Section</label>
                <Input
                  value={manualRecord.section}
                  onChange={(e) => setManualRecord({ ...manualRecord, section: e.target.value })}
                  placeholder="Section"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Lot</label>
                <Input
                  value={manualRecord.lot}
                  onChange={(e) => setManualRecord({ ...manualRecord, lot: e.target.value })}
                  placeholder="Lot"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Plot/Grave</label>
                <Input
                  value={manualRecord.plot}
                  onChange={(e) => setManualRecord({ ...manualRecord, plot: e.target.value })}
                  placeholder="Plot"
                />
              </div>
            </div>

            {/* GPS */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">GPS Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={manualRecord.gpsLat || ""}
                  onChange={(e) => setManualRecord({ ...manualRecord, gpsLat: parseFloat(e.target.value) || undefined })}
                  placeholder="e.g., 40.6501"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">GPS Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={manualRecord.gpsLng || ""}
                  onChange={(e) => setManualRecord({ ...manualRecord, gpsLng: parseFloat(e.target.value) || undefined })}
                  placeholder="e.g., -73.9496"
                />
              </div>
            </div>

            {/* Epitaph */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Epitaph (inscription on headstone)</label>
              <Input
                value={manualRecord.epitaph}
                onChange={(e) => setManualRecord({ ...manualRecord, epitaph: e.target.value })}
                placeholder="Forever in our hearts"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleManualImport}>
                Save Cemetery Info
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
