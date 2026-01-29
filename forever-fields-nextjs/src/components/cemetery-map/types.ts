export interface MemorialPlot {
  id: string;
  memorialId?: string;
  name: string;
  type: "human" | "pet";
  // GPS coordinates
  gpsLat: number;
  gpsLng: number;
  // Optional cemetery details
  cemeteryName?: string;
  section?: string;
  plot?: string;
  // Memorial info
  birthYear?: number;
  deathYear?: number;
  profilePhoto?: string;
  hasMemorial: boolean;
  // Real-time data
  hasActiveCandle?: boolean;
  activeCandleCount?: number;
  recentVisitors?: number;
}

export interface CemeteryMapProps {
  plots: MemorialPlot[];
  selectedPlotId?: string;
  onSelectPlot?: (plot: MemorialPlot) => void;
  showUserLocation?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
}

export interface MapCandleLightingProps {
  plot: MemorialPlot;
  isOpen: boolean;
  onClose: () => void;
  onLightCandle: (duration: string) => void;
}

// Demo data for development
export function generateDemoCemeteryPlots(): MemorialPlot[] {
  return [
    {
      id: "plot-1",
      memorialId: "mem-g1",
      name: "James Anderson",
      type: "human",
      gpsLat: 40.7128,
      gpsLng: -74.006,
      cemeteryName: "Greenwood Memorial Park",
      section: "Section A",
      plot: "Plot 142",
      birthYear: 1945,
      deathYear: 2020,
      hasMemorial: true,
      hasActiveCandle: true,
      activeCandleCount: 3,
      recentVisitors: 12,
    },
    {
      id: "plot-2",
      memorialId: "mem-g2",
      name: "Dorothy Anderson",
      type: "human",
      gpsLat: 40.7131,
      gpsLng: -74.0055,
      cemeteryName: "Greenwood Memorial Park",
      section: "Section A",
      plot: "Plot 143",
      birthYear: 1948,
      deathYear: 2022,
      hasMemorial: true,
      hasActiveCandle: false,
      activeCandleCount: 0,
      recentVisitors: 8,
    },
    {
      id: "plot-3",
      memorialId: "mem-pet1",
      name: "Max",
      type: "pet",
      gpsLat: 40.7125,
      gpsLng: -74.0065,
      cemeteryName: "Peaceful Paws Garden",
      section: "Pet Section",
      plot: "Plot 28",
      birthYear: 2005,
      deathYear: 2018,
      hasMemorial: true,
      hasActiveCandle: true,
      activeCandleCount: 1,
      recentVisitors: 5,
    },
    {
      id: "plot-4",
      name: "Robert Williams",
      type: "human",
      gpsLat: 40.7135,
      gpsLng: -74.007,
      cemeteryName: "Greenwood Memorial Park",
      section: "Section B",
      plot: "Plot 87",
      birthYear: 1932,
      deathYear: 2015,
      hasMemorial: false,
      hasActiveCandle: false,
      activeCandleCount: 0,
      recentVisitors: 2,
    },
    {
      id: "plot-5",
      memorialId: "mem-5",
      name: "Eleanor Thompson",
      type: "human",
      gpsLat: 40.7122,
      gpsLng: -74.0052,
      cemeteryName: "Greenwood Memorial Park",
      section: "Section C",
      plot: "Plot 201",
      birthYear: 1940,
      deathYear: 2019,
      hasMemorial: true,
      hasActiveCandle: true,
      activeCandleCount: 7,
      recentVisitors: 15,
    },
  ];
}
