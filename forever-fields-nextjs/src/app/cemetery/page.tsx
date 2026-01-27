"use client";

import { useState } from "react";
import { Header } from "@/components/layout";
import { FadeIn } from "@/components/motion";
import { Card, Badge, Button } from "@/components/ui";
import {
  VirtualCemeteryCanvas,
  DistrictSelector,
  PlotDetailsSidebar,
  type CemeteryPlot,
  type District,
} from "@/components/cemetery";
import {
  Map,
  Flower2,
  Flame,
  MessageSquare,
  Share2,
  X,
} from "lucide-react";

export default function VirtualCemeteryPage() {
  const [selectedPlot, setSelectedPlot] = useState<CemeteryPlot | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [showDistrictSelector, setShowDistrictSelector] = useState(false);
  const [showPlotDetails, setShowPlotDetails] = useState(false);

  const handlePlotClick = (plot: CemeteryPlot) => {
    setSelectedPlot(plot);
    setShowPlotDetails(true);
  };

  const handleClosePlotDetails = () => {
    setShowPlotDetails(false);
    // Keep selectedPlot so the canvas still highlights it
  };

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
    setShowDistrictSelector(false);
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-sage-pale/30 to-cream py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-sage flex items-center justify-center">
                    <Map className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-3xl font-serif font-bold text-gray-dark">
                    Virtual Cemetery
                  </h1>
                </div>
                <p className="text-gray-body">
                  Explore our peaceful grounds and visit the memorials of loved ones
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDistrictSelector(!showDistrictSelector)}
              >
                {showDistrictSelector ? "Hide Districts" : "Browse Districts"}
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cemetery Canvas */}
            <div className="lg:col-span-2">
              <FadeIn delay={0.1}>
                <VirtualCemeteryCanvas
                  districts={[]}
                  selectedPlotId={selectedPlot?.id}
                  onPlotClick={handlePlotClick}
                  className="w-full"
                />
              </FadeIn>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <FadeIn delay={0.2}>
                {/* Selected Plot Details */}
                {selectedPlot ? (
                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-serif font-semibold text-gray-dark">
                        {selectedPlot.memorial
                          ? selectedPlot.memorial.name
                          : "Available Plot"}
                      </h3>
                      <button
                        onClick={() => setSelectedPlot(null)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 rounded"
                        aria-label="Close plot details"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {selectedPlot.memorial ? (
                      <>
                        {/* Memorial info */}
                        <div className="mb-4">
                          <p className="text-gray-body">
                            {selectedPlot.memorial.birthYear} -{" "}
                            {selectedPlot.memorial.deathYear}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {selectedPlot.districtId
                              .split("-")
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(" ")}
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" className="flex items-center gap-2">
                            <Flower2 className="w-4 h-4" />
                            Leave Flower
                          </Button>
                          <Button variant="outline" className="flex items-center gap-2">
                            <Flame className="w-4 h-4" />
                            Light Candle
                          </Button>
                          <Button variant="outline" className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Guestbook
                          </Button>
                          <Button variant="outline" className="flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Share
                          </Button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-sage-pale">
                          <Button className="w-full">View Full Memorial</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-body mb-4">
                          This plot is available for a new memorial. Select a
                          subscription tier to claim this plot.
                        </p>
                        <Button className="w-full">Create Memorial Here</Button>
                      </>
                    )}
                  </Card>
                ) : (
                  <Card className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-sage-pale mx-auto mb-4 flex items-center justify-center">
                      <Map className="w-8 h-8 text-sage" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-dark mb-2">
                      Explore the Cemetery
                    </h3>
                    <p className="text-sm text-gray-body">
                      Click on any plot to view details or find an available
                      spot for a new memorial.
                    </p>
                  </Card>
                )}

                {/* District Selector */}
                {showDistrictSelector && (
                  <Card className="p-6">
                    <DistrictSelector
                      selectedDistrict={selectedDistrict?.id}
                      onSelect={handleDistrictSelect}
                      userTier="free"
                      compact
                    />
                  </Card>
                )}

                {/* Quick Stats */}
                <Card className="p-6">
                  <h3 className="text-lg font-serif font-semibold text-gray-dark mb-4">
                    Cemetery Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-body">Total Memorials</span>
                      <span className="font-medium text-gray-dark">2,847</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-body">Available Plots</span>
                      <span className="font-medium text-sage">1,653</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-body">Candles Lit Today</span>
                      <span className="font-medium text-amber-500">423</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-body">Districts</span>
                      <span className="font-medium text-gray-dark">8</span>
                    </div>
                  </div>
                </Card>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Plot Details Sidebar with AI Integration */}
      {showPlotDetails && (
        <PlotDetailsSidebar
          plot={selectedPlot}
          onClose={handleClosePlotDetails}
          userId="demo-user"
          userName="Demo Visitor"
        />
      )}
    </div>
  );
}
