"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import { Button, Badge } from "@/components/ui";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Home,
  Info,
  Flower2,
  Flame,
} from "lucide-react";

// Types
export interface CemeteryPlot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  occupied: boolean;
  memorial?: {
    id: string;
    name: string;
    birthYear?: number;
    deathYear?: number;
    profilePhoto?: string;
    hasCandle?: boolean;
  };
  districtId: string;
}

export interface CemeteryDistrict {
  id: string;
  name: string;
  color: number;
  x: number;
  y: number;
  width: number;
  height: number;
  plots: CemeteryPlot[];
}

interface VirtualCemeteryCanvasProps {
  districts: CemeteryDistrict[];
  selectedPlotId?: string;
  onPlotClick?: (plot: CemeteryPlot) => void;
  onPlotHover?: (plot: CemeteryPlot | null) => void;
  width?: number;
  height?: number;
  className?: string;
}

// Generate demo data
function generateDemoDistricts(): CemeteryDistrict[] {
  const districts: CemeteryDistrict[] = [
    {
      id: "garden-of-peace",
      name: "Garden of Peace",
      color: 0x90ee90,
      x: 50,
      y: 50,
      width: 400,
      height: 300,
      plots: [],
    },
    {
      id: "whispering-pines",
      name: "Whispering Pines",
      color: 0x228b22,
      x: 500,
      y: 50,
      width: 350,
      height: 300,
      plots: [],
    },
    {
      id: "sunset-hills",
      name: "Sunset Hills",
      color: 0xffa07a,
      x: 50,
      y: 400,
      width: 400,
      height: 250,
      plots: [],
    },
    {
      id: "celestial-meadow",
      name: "Celestial Meadow",
      color: 0x9370db,
      x: 500,
      y: 400,
      width: 350,
      height: 250,
      plots: [],
    },
  ];

  // Generate plots for each district
  districts.forEach((district) => {
    const plotWidth = 40;
    const plotHeight = 50;
    const padding = 15;
    const rows = Math.floor((district.height - 40) / (plotHeight + padding));
    const cols = Math.floor((district.width - 40) / (plotWidth + padding));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const isOccupied = Math.random() > 0.4;
        const plot: CemeteryPlot = {
          id: `${district.id}-${row}-${col}`,
          x: district.x + 20 + col * (plotWidth + padding),
          y: district.y + 30 + row * (plotHeight + padding),
          width: plotWidth,
          height: plotHeight,
          occupied: isOccupied,
          districtId: district.id,
        };

        if (isOccupied) {
          const names = [
            "Eleanor Smith",
            "James Wilson",
            "Mary Johnson",
            "Robert Davis",
            "Patricia Brown",
            "Michael Miller",
            "Sarah Williams",
            "David Jones",
          ];
          plot.memorial = {
            id: `memorial-${plot.id}`,
            name: names[Math.floor(Math.random() * names.length)],
            birthYear: 1920 + Math.floor(Math.random() * 60),
            deathYear: 2000 + Math.floor(Math.random() * 24),
            hasCandle: Math.random() > 0.7,
          };
        }

        district.plots.push(plot);
      }
    }
  });

  return districts;
}

export function VirtualCemeteryCanvas({
  districts: initialDistricts,
  selectedPlotId,
  onPlotClick,
  onPlotHover,
  width = 900,
  height = 700,
  className = "",
}: VirtualCemeteryCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const viewportRef = useRef<PIXI.Container | null>(null);
  const [hoveredPlot, setHoveredPlot] = useState<CemeteryPlot | null>(null);
  const [zoom, setZoom] = useState(1);
  const [districts] = useState(() =>
    initialDistricts?.length > 0 ? initialDistricts : generateDemoDistricts()
  );

  // Initialize PIXI Application
  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    const app = new PIXI.Application();

    const initApp = async () => {
      await app.init({
        width,
        height,
        backgroundColor: 0xf5f5dc,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
      }

      appRef.current = app;

      // Create viewport container for pan/zoom
      const viewport = new PIXI.Container();
      viewport.eventMode = "static";
      app.stage.addChild(viewport);
      viewportRef.current = viewport;

      // Draw cemetery
      drawCemetery(viewport);
    };

    initApp();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [width, height]);

  // Draw cemetery elements
  const drawCemetery = useCallback(
    (viewport: PIXI.Container) => {
      // Clear existing graphics
      viewport.removeChildren();

      // Draw grass background
      const grass = new PIXI.Graphics();
      grass.rect(0, 0, 900, 700);
      grass.fill(0x7cba6d);
      viewport.addChild(grass);

      // Draw paths
      const paths = new PIXI.Graphics();
      paths.rect(440, 0, 30, 700);
      paths.fill(0xd4a574);
      paths.rect(0, 340, 900, 25);
      paths.fill(0xd4a574);
      viewport.addChild(paths);

      // Draw districts
      districts.forEach((district) => {
        // District background
        const districtBg = new PIXI.Graphics();
        districtBg.roundRect(district.x, district.y, district.width, district.height, 10);
        districtBg.fill({ color: district.color, alpha: 0.3 });
        districtBg.stroke({ color: district.color, width: 2 });
        viewport.addChild(districtBg);

        // District label
        const label = new PIXI.Text({
          text: district.name,
          style: {
            fontFamily: "serif",
            fontSize: 14,
            fontWeight: "bold",
            fill: 0x333333,
          },
        });
        label.x = district.x + 10;
        label.y = district.y + 8;
        viewport.addChild(label);

        // Draw plots
        district.plots.forEach((plot) => {
          const plotGraphic = new PIXI.Graphics();
          const isSelected = selectedPlotId === plot.id;

          // Plot background
          if (plot.occupied) {
            plotGraphic.roundRect(0, 0, plot.width, plot.height, 4);
            plotGraphic.fill(0x808080);
            plotGraphic.stroke({
              color: isSelected ? 0x4caf50 : 0x606060,
              width: isSelected ? 3 : 1
            });

            // Headstone shape
            plotGraphic.roundRect(8, 5, plot.width - 16, plot.height - 15, 4);
            plotGraphic.fill(0xa0a0a0);
          } else {
            plotGraphic.roundRect(0, 0, plot.width, plot.height, 4);
            plotGraphic.fill({ color: 0x90ee90, alpha: 0.5 });
            plotGraphic.stroke({
              color: isSelected ? 0x4caf50 : 0x228b22,
              width: isSelected ? 3 : 1,
              alpha: 0.5
            });
          }

          plotGraphic.x = plot.x;
          plotGraphic.y = plot.y;
          plotGraphic.eventMode = "static";
          plotGraphic.cursor = "pointer";

          // Add candle indicator
          if (plot.memorial?.hasCandle) {
            const candle = new PIXI.Graphics();
            candle.circle(plot.width - 8, 8, 5);
            candle.fill(0xffa500);
            plotGraphic.addChild(candle);
          }

          // Hover effects
          plotGraphic.on("pointerover", () => {
            plotGraphic.alpha = 0.8;
            setHoveredPlot(plot);
            onPlotHover?.(plot);
          });

          plotGraphic.on("pointerout", () => {
            plotGraphic.alpha = 1;
            setHoveredPlot(null);
            onPlotHover?.(null);
          });

          plotGraphic.on("pointertap", () => {
            onPlotClick?.(plot);
          });

          viewport.addChild(plotGraphic);
        });
      });

      // Add decorative elements (trees)
      const treePositions = [
        [20, 20],
        [860, 20],
        [20, 660],
        [860, 660],
        [450, 10],
        [450, 670],
      ];
      treePositions.forEach(([x, y]) => {
        const tree = new PIXI.Graphics();
        tree.circle(0, 0, 15);
        tree.fill(0x228b22);
        tree.x = x;
        tree.y = y;
        viewport.addChild(tree);
      });
    },
    [districts, selectedPlotId, onPlotClick, onPlotHover]
  );

  // Redraw when selection changes
  useEffect(() => {
    if (viewportRef.current) {
      drawCemetery(viewportRef.current);
    }
  }, [selectedPlotId, drawCemetery]);

  // Zoom controls
  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.5, Math.min(2, zoom + delta));
    setZoom(newZoom);
    if (viewportRef.current) {
      viewportRef.current.scale.set(newZoom);
    }
  };

  const handleResetView = () => {
    setZoom(1);
    if (viewportRef.current) {
      viewportRef.current.scale.set(1);
      viewportRef.current.position.set(0, 0);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Canvas container */}
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-sage-pale shadow-soft"
        style={{ width, height }}
      />

      {/* Controls overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleZoom(0.2)}
          className="w-10 h-10 p-0"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleZoom(-0.2)}
          className="w-10 h-10 p-0"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetView}
          className="w-10 h-10 p-0"
          aria-label="Reset view"
        >
          <Home className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0"
          aria-label="Full screen"
        >
          <Maximize2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-4 left-4">
        <Badge variant="secondary" className="bg-white/90">
          {Math.round(zoom * 100)}%
        </Badge>
      </div>

      {/* Hovered plot info */}
      {hoveredPlot && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                hoveredPlot.occupied ? "bg-gray-200" : "bg-sage-pale"
              }`}
            >
              {hoveredPlot.occupied ? (
                <Flower2 className="w-5 h-5 text-gray-600" />
              ) : (
                <span className="text-sage text-lg">+</span>
              )}
            </div>
            <div>
              {hoveredPlot.memorial ? (
                <>
                  <h4 className="font-medium text-gray-dark">
                    {hoveredPlot.memorial.name}
                  </h4>
                  <p className="text-sm text-gray-body">
                    {hoveredPlot.memorial.birthYear} -{" "}
                    {hoveredPlot.memorial.deathYear}
                  </p>
                  {hoveredPlot.memorial.hasCandle && (
                    <div className="flex items-center gap-1 mt-1 text-amber-500">
                      <Flame className="w-4 h-4" />
                      <span className="text-xs">Candle lit</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h4 className="font-medium text-gray-dark">Available Plot</h4>
                  <p className="text-sm text-gray-body">
                    Click to select this plot
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-3">
        <p className="text-xs font-medium text-gray-dark mb-2">Legend</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-body">
            <div className="w-4 h-4 bg-gray-400 rounded" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-body">
            <div className="w-4 h-4 bg-green-200 border border-green-400 rounded" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-body">
            <div className="w-4 h-4 bg-amber-400 rounded-full" />
            <span>Lit candle</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { generateDemoDistricts };
