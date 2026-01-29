"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout";
import { FadeIn } from "@/components/motion";
import { Badge, Card } from "@/components/ui";
import {
  FamilyTree,
  MemorialSidebar,
  generateDemoFamilyTree,
  type FamilyMember,
  type Pet,
} from "@/components/family-tree";
import {
  CemeteryMap,
  generateDemoCemeteryPlots,
  type MemorialPlot,
} from "@/components/cemetery-map";
import {
  TreeDeciduous,
  Map,
  Columns,
  Users,
  Flower2,
  Filter,
  Search,
  MapPin,
} from "lucide-react";

type ViewMode = "tree" | "map" | "split";

export default function MemorialExplorerPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [familyData] = useState(() => generateDemoFamilyTree());
  const [cemeteryPlots] = useState(() => generateDemoCemeteryPlots());

  // Selection state
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<MemorialPlot | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "human" | "pet">("all");

  // Handlers for Family Tree
  const handleSelectPerson = useCallback((member: FamilyMember) => {
    setSelectedMember(member);
    setSelectedPet(null);
    setSelectedPlot(null);
    setShowSidebar(true);
  }, []);

  const handleSelectPet = useCallback((pet: Pet) => {
    setSelectedPet(pet);
    setSelectedMember(null);
    setSelectedPlot(null);
    setShowSidebar(true);
  }, []);

  // Handler for Cemetery Map
  const handleSelectPlot = useCallback((plot: MemorialPlot) => {
    setSelectedPlot(plot);
    setSelectedMember(null);
    setSelectedPet(null);
    // For map, we show inline card instead of sidebar
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setShowSidebar(false);
  }, []);

  // Calculate stats
  const totalMembers = familyData.members.length + familyData.pets.length;
  const totalPlots = cemeteryPlots.length;
  const membersWithMemorials = familyData.members.filter((m) => m.hasMemorial).length;
  const petsWithMemorials = familyData.pets.filter((p) => p.hasMemorial).length;

  const selectedId = selectedMember?.id || selectedPet?.id;

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section with View Toggle */}
      <section className="bg-gradient-to-b from-sage-pale/30 to-cream py-6 border-b border-sage-pale/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex flex-col gap-4">
              {/* Title and View Toggle Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-gray-dark">
                    Memorial Explorer
                  </h1>
                  <p className="text-sm text-gray-body mt-1">
                    Compare visualization options: Family Tree vs Cemetery Map
                  </p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 p-1 bg-white rounded-xl shadow-sm border border-sage-pale/50">
                  <button
                    onClick={() => setViewMode("tree")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === "tree"
                        ? "bg-sage text-white shadow-sm"
                        : "text-gray-600 hover:bg-sage-pale/50"
                    }`}
                  >
                    <TreeDeciduous className="w-4 h-4" />
                    <span className="hidden sm:inline">Tree</span>
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === "map"
                        ? "bg-sage text-white shadow-sm"
                        : "text-gray-600 hover:bg-sage-pale/50"
                    }`}
                  >
                    <Map className="w-4 h-4" />
                    <span className="hidden sm:inline">Map</span>
                  </button>
                  <button
                    onClick={() => setViewMode("split")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hidden lg:flex ${
                      viewMode === "split"
                        ? "bg-sage text-white shadow-sm"
                        : "text-gray-600 hover:bg-sage-pale/50"
                    }`}
                  >
                    <Columns className="w-4 h-4" />
                    <span>Split</span>
                  </button>
                </div>
              </div>

              {/* Search and Filters Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-sage-pale bg-white focus:border-sage focus:ring-1 focus:ring-sage outline-none text-sm"
                  />
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-sage-pale/50">
                    <button
                      onClick={() => setTypeFilter("all")}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        typeFilter === "all"
                          ? "bg-sage-pale text-sage-dark"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setTypeFilter("human")}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        typeFilter === "human"
                          ? "bg-sage-pale text-sage-dark"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <Users className="w-3 h-3 inline mr-1" />
                      People
                    </button>
                    <button
                      onClick={() => setTypeFilter("pet")}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        typeFilter === "pet"
                          ? "bg-gold-light text-gold-dark"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Pets
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-sm ml-auto">
                  {viewMode !== "map" && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-sage" />
                      <span className="text-gray-dark font-medium">{totalMembers}</span>
                      <span className="text-gray-body hidden sm:inline">in tree</span>
                    </div>
                  )}
                  {viewMode !== "tree" && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-sage" />
                      <span className="text-gray-dark font-medium">{totalPlots}</span>
                      <span className="text-gray-body hidden sm:inline">on map</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Flower2 className="w-4 h-4 text-sage" />
                    <span className="text-gray-dark font-medium">{membersWithMemorials + petsWithMemorials}</span>
                    <span className="text-gray-body hidden sm:inline">memorials</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {/* Tree View */}
            {viewMode === "tree" && (
              <motion.div
                key="tree"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <FamilyTree
                  data={familyData}
                  selectedId={selectedId}
                  onSelectPerson={handleSelectPerson}
                  onSelectPet={handleSelectPet}
                  className="w-full"
                />

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Drag to pan • Scroll to zoom • Click to view memorial
                  </p>
                  <Badge variant="outline" size="sm" className="text-sage">
                    <TreeDeciduous className="w-3 h-3 mr-1" />
                    Family Tree View
                  </Badge>
                </div>
              </motion.div>
            )}

            {/* Map View */}
            {viewMode === "map" && (
              <motion.div
                key="map"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <CemeteryMap
                  plots={cemeteryPlots}
                  selectedPlotId={selectedPlot?.id}
                  onSelectPlot={handleSelectPlot}
                  showUserLocation={true}
                  className="w-full h-[600px]"
                />

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Drag to pan • Pinch to zoom • Tap to select • Use location button to find your position
                  </p>
                  <Badge variant="outline" size="sm" className="text-sage">
                    <Map className="w-3 h-3 mr-1" />
                    Cemetery Map View
                  </Badge>
                </div>
              </motion.div>
            )}

            {/* Split View (Desktop only) */}
            {viewMode === "split" && (
              <motion.div
                key="split"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-6"
              >
                {/* Tree Half */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TreeDeciduous className="w-5 h-5 text-sage" />
                    <h2 className="font-semibold text-gray-dark">Family Tree</h2>
                    <Badge variant="secondary" size="sm">
                      {totalMembers} members
                    </Badge>
                  </div>
                  <FamilyTree
                    data={familyData}
                    selectedId={selectedId}
                    onSelectPerson={handleSelectPerson}
                    onSelectPet={handleSelectPet}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Relationship-focused • Shows family connections
                  </p>
                </div>

                {/* Map Half */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Map className="w-5 h-5 text-sage" />
                    <h2 className="font-semibold text-gray-dark">Cemetery Map</h2>
                    <Badge variant="secondary" size="sm">
                      {totalPlots} plots
                    </Badge>
                  </div>
                  <CemeteryMap
                    plots={cemeteryPlots}
                    selectedPlotId={selectedPlot?.id}
                    onSelectPlot={handleSelectPlot}
                    showUserLocation={true}
                    className="w-full h-[500px]"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Location-focused • GPS navigation to graves
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comparison Callout */}
          <Card className="mt-8 p-6 bg-gradient-to-r from-sage-pale/30 to-gold-light/20 border-sage-pale/50">
            <h3 className="font-semibold text-gray-dark mb-3">Which view works better?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TreeDeciduous className="w-5 h-5 text-sage" />
                  <span className="font-medium text-sage-dark">Family Tree</span>
                </div>
                <ul className="text-gray-body space-y-1 ml-7">
                  <li>• Best for understanding relationships</li>
                  <li>• Shows multi-generational connections</li>
                  <li>• Includes pets in family context</li>
                  <li>• No location data needed</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Map className="w-5 h-5 text-sage" />
                  <span className="font-medium text-sage-dark">Cemetery Map</span>
                </div>
                <ul className="text-gray-body space-y-1 ml-7">
                  <li>• Best for visiting physical locations</li>
                  <li>• GPS navigation to gravesites</li>
                  <li>• See who else is nearby</li>
                  <li>• Requires GPS coordinates</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Memorial Sidebar (for Tree view) */}
      {showSidebar && viewMode !== "map" && (
        <MemorialSidebar
          member={selectedMember}
          pet={selectedPet}
          onClose={handleCloseSidebar}
          userId="demo-user"
          userName="Demo Visitor"
        />
      )}
    </div>
  );
}
