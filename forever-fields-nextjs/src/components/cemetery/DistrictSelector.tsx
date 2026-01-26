"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import {
  Flower2,
  TreePine,
  Sun,
  Star,
  Heart,
  Cloud,
  Mountain,
  Sparkles,
  Lock,
  Check,
} from "lucide-react";

export interface District {
  id: string;
  name: string;
  description: string;
  theme: "garden" | "forest" | "sunset" | "celestial" | "heritage" | "serenity" | "mountain" | "premium";
  icon: React.ReactNode;
  plotsAvailable: number;
  totalPlots: number;
  features: string[];
  tier: "free" | "remember" | "heritage" | "legacy";
  gradient: string;
  bgPattern?: string;
}

const defaultDistricts: District[] = [
  {
    id: "garden-of-peace",
    name: "Garden of Peace",
    description: "A tranquil garden setting with blooming flowers and gentle pathways",
    theme: "garden",
    icon: <Flower2 className="w-6 h-6" />,
    plotsAvailable: 847,
    totalPlots: 1000,
    features: ["Flower arrangements", "Memorial bench nearby", "Bird sanctuary view"],
    tier: "free",
    gradient: "from-green-100 to-emerald-200",
  },
  {
    id: "whispering-pines",
    name: "Whispering Pines",
    description: "Nestled among ancient evergreens with peaceful forest sounds",
    theme: "forest",
    icon: <TreePine className="w-6 h-6" />,
    plotsAvailable: 523,
    totalPlots: 800,
    features: ["Forest canopy", "Nature trails", "Wildlife sanctuary"],
    tier: "free",
    gradient: "from-emerald-100 to-green-300",
  },
  {
    id: "sunset-hills",
    name: "Sunset Hills",
    description: "Rolling hills with stunning sunset views over the valley",
    theme: "sunset",
    icon: <Sun className="w-6 h-6" />,
    plotsAvailable: 312,
    totalPlots: 600,
    features: ["Panoramic views", "Evening reflection area", "Golden hour lighting"],
    tier: "remember",
    gradient: "from-orange-100 to-amber-200",
  },
  {
    id: "celestial-meadow",
    name: "Celestial Meadow",
    description: "Open meadow perfect for stargazing and celestial remembrance",
    theme: "celestial",
    icon: <Star className="w-6 h-6" />,
    plotsAvailable: 189,
    totalPlots: 400,
    features: ["Night sky viewing", "Star dedication plaques", "Moonlit paths"],
    tier: "remember",
    gradient: "from-indigo-100 to-purple-200",
  },
  {
    id: "heritage-grove",
    name: "Heritage Grove",
    description: "A distinguished area honoring family legacies and traditions",
    theme: "heritage",
    icon: <Heart className="w-6 h-6" />,
    plotsAvailable: 156,
    totalPlots: 300,
    features: ["Family plots", "Legacy monuments", "Heritage garden"],
    tier: "heritage",
    gradient: "from-amber-100 to-yellow-200",
  },
  {
    id: "serenity-lake",
    name: "Serenity Lake",
    description: "Peaceful lakeside setting with reflective waters and waterfowl",
    theme: "serenity",
    icon: <Cloud className="w-6 h-6" />,
    plotsAvailable: 98,
    totalPlots: 250,
    features: ["Waterfront view", "Meditation gazebo", "Koi pond"],
    tier: "heritage",
    gradient: "from-sky-100 to-blue-200",
  },
  {
    id: "mountain-vista",
    name: "Mountain Vista",
    description: "Elevated grounds with majestic mountain views and alpine gardens",
    theme: "mountain",
    icon: <Mountain className="w-6 h-6" />,
    plotsAvailable: 67,
    totalPlots: 200,
    features: ["Mountain panorama", "Alpine flowers", "Elevated terraces"],
    tier: "legacy",
    gradient: "from-slate-100 to-gray-200",
  },
  {
    id: "eternal-gardens",
    name: "Eternal Gardens",
    description: "Our most prestigious district with premium amenities and exclusive features",
    theme: "premium",
    icon: <Sparkles className="w-6 h-6" />,
    plotsAvailable: 23,
    totalPlots: 100,
    features: ["Private gardens", "Custom monuments", "VIP maintenance", "24/7 virtual visits"],
    tier: "legacy",
    gradient: "from-violet-100 to-purple-200",
  },
];

const tierLabels: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "bg-gray-100 text-gray-600" },
  remember: { label: "Remember", color: "bg-sage-pale text-sage-dark" },
  heritage: { label: "Heritage", color: "bg-amber-100 text-amber-700" },
  legacy: { label: "Legacy", color: "bg-purple-100 text-purple-700" },
};

interface DistrictSelectorProps {
  selectedDistrict?: string;
  onSelect: (district: District) => void;
  userTier?: "free" | "remember" | "heritage" | "legacy";
  districts?: District[];
  showAvailability?: boolean;
  compact?: boolean;
}

const tierOrder = ["free", "remember", "heritage", "legacy"];

function canAccessDistrict(userTier: string, districtTier: string): boolean {
  return tierOrder.indexOf(userTier) >= tierOrder.indexOf(districtTier);
}

export function DistrictSelector({
  selectedDistrict,
  onSelect,
  userTier = "free",
  districts = defaultDistricts,
  showAvailability = true,
  compact = false,
}: DistrictSelectorProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-serif font-semibold text-gray-dark">
            Select a District
          </h3>
          <p className="text-sm text-gray-body">
            Choose where your memorial will be located in the virtual cemetery
          </p>
        </div>
        <Badge variant="outline" className={tierLabels[userTier].color}>
          {tierLabels[userTier].label} Tier
        </Badge>
      </div>

      <div className={cn(
        "grid gap-4",
        compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      )}>
        {districts.map((district) => {
          const isSelected = selectedDistrict === district.id;
          const isAccessible = canAccessDistrict(userTier, district.tier);
          const isHovered = hoveredDistrict === district.id;
          const availabilityPercent = (district.plotsAvailable / district.totalPlots) * 100;

          return (
            <button
              key={district.id}
              type="button"
              onClick={() => isAccessible && onSelect(district)}
              onMouseEnter={() => setHoveredDistrict(district.id)}
              onMouseLeave={() => setHoveredDistrict(null)}
              disabled={!isAccessible}
              className={cn(
                "relative group rounded-xl border-2 text-left transition-all duration-300 overflow-hidden",
                isSelected
                  ? "border-sage ring-2 ring-sage/20 shadow-lg"
                  : isAccessible
                  ? "border-sage-pale hover:border-sage hover:shadow-md"
                  : "border-gray-200 opacity-60 cursor-not-allowed",
                compact ? "p-3" : "p-4"
              )}
            >
              {/* Background gradient */}
              <div
                className={cn(
                  "absolute inset-0 opacity-30 transition-opacity",
                  `bg-gradient-to-br ${district.gradient}`,
                  isHovered && isAccessible && "opacity-50"
                )}
              />

              {/* Content */}
              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isSelected ? "bg-sage text-white" : "bg-sage-pale text-sage"
                    )}
                  >
                    {district.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isAccessible && <Lock className="w-4 h-4 text-gray-400" />}
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-sage flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", tierLabels[district.tier].color)}
                    >
                      {tierLabels[district.tier].label}
                    </Badge>
                  </div>
                </div>

                {/* Name & Description */}
                <h4 className="font-medium text-gray-dark mb-1">
                  {district.name}
                </h4>
                {!compact && (
                  <p className="text-sm text-gray-body mb-3 line-clamp-2">
                    {district.description}
                  </p>
                )}

                {/* Features */}
                {!compact && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {district.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-2 py-0.5 rounded-full bg-white/70 text-gray-600"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                {/* Availability */}
                {showAvailability && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-body">
                        {district.plotsAvailable.toLocaleString()} plots available
                      </span>
                      <span className="text-gray-light">
                        {Math.round(availabilityPercent)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          availabilityPercent > 50
                            ? "bg-sage"
                            : availabilityPercent > 20
                            ? "bg-amber-400"
                            : "bg-red-400"
                        )}
                        style={{ width: `${availabilityPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Locked overlay */}
                {!isAccessible && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                    <div className="text-center">
                      <Lock className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">
                        Upgrade to {tierLabels[district.tier].label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected district details */}
      {selectedDistrict && !compact && (
        <div className="mt-6 p-4 bg-sage-pale/30 rounded-xl">
          {(() => {
            const selected = districts.find((d) => d.id === selectedDistrict);
            if (!selected) return null;
            return (
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-sage text-white">
                  {selected.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-dark">
                    {selected.name}
                  </h4>
                  <p className="text-sm text-gray-body mb-2">
                    {selected.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.features.map((feature) => (
                      <Badge key={feature} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export { defaultDistricts };
export type { DistrictSelectorProps };
