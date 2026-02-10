"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import {
  Eye,
  Users,
  Flame,
  MessageCircle,
  Share2,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface AnalyticsData {
  summary: {
    totalViews: number;
    periodViews: number;
    uniqueVisitors: number;
    candlesLit: number;
    storiesShared: number;
    guestbookSigned: number;
    shares: number;
  };
  dailyViews: Array<{ date: string; views: number; uniqueVisitors?: number }>;
  topReferrers: Array<{ source: string; count: number }>;
  deviceBreakdown: Record<string, number>;
  topCountries?: Array<{ country: string; count: number }>;
}

interface AnalyticsDashboardProps {
  memorialId: string;
  className?: string;
}

type Period = "7d" | "30d" | "90d";

export function AnalyticsDashboard({ memorialId, className }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/memorials/${memorialId}/analytics?period=${period}`
      );
      if (response.ok) {
        const analytics = await response.json();
        setData(analytics);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [memorialId, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const periodLabels: Record<Period, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-sage border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-gray-500">
          Unable to load analytics data
        </CardContent>
      </Card>
    );
  }

  const { summary, dailyViews, topReferrers, deviceBreakdown, topCountries } = data;

  // Calculate max for chart scaling
  const maxViews = Math.max(...dailyViews.map((d) => d.views), 1);

  // Device icons
  const deviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    mobile: Smartphone,
    desktop: Monitor,
    tablet: Tablet,
  };

  const totalDeviceViews = Object.values(deviceBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-sage" />
          Analytics
        </h2>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-sage text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.periodViews}</p>
              <p className="text-xs text-gray-500">Views</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.uniqueVisitors}</p>
              <p className="text-xs text-gray-500">Unique Visitors</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.candlesLit}</p>
              <p className="text-xs text-gray-500">Candles Lit</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {summary.storiesShared + summary.guestbookSigned}
              </p>
              <p className="text-xs text-gray-500">Stories & Messages</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Views Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Daily Views
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-end gap-1">
            {dailyViews.slice(-30).map((day) => {
              const height = (day.views / maxViews) * 100;
              const date = new Date(day.date);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center group"
                >
                  <div className="relative w-full flex justify-center">
                    <div
                      className={`w-full max-w-[12px] rounded-t transition-all ${
                        isWeekend ? "bg-sage-light" : "bg-sage"
                      } hover:opacity-80`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${day.date}: ${day.views} views`}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {day.date}: {day.views} views
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{dailyViews[0]?.date.slice(5)}</span>
            <span>{dailyViews[dailyViews.length - 1]?.date.slice(5)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Top Referrers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Top Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topReferrers.length === 0 ? (
              <p className="text-sm text-gray-500">No referrer data</p>
            ) : (
              <div className="space-y-2">
                {topReferrers.slice(0, 5).map((ref) => (
                  <div key={ref.source} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate">{ref.source}</span>
                    <span className="text-sm font-medium text-gray-900">{ref.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(deviceBreakdown).map(([device, count]) => {
                const Icon = deviceIcons[device] || Monitor;
                const percentage = totalDeviceViews > 0
                  ? Math.round((count / totalDeviceViews) * 100)
                  : 0;

                return (
                  <div key={device} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize text-gray-700">{device}</span>
                        <span className="text-gray-500">{percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sage rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!topCountries || topCountries.length === 0 ? (
              <p className="text-sm text-gray-500">No location data</p>
            ) : (
              <div className="space-y-2">
                {topCountries.slice(0, 5).map((loc) => (
                  <div key={loc.country} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{loc.country}</span>
                    <span className="text-sm font-medium text-gray-900">{loc.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Total Stats */}
      <Card className="bg-sage-pale/30 border-sage-light">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-sage-dark">{summary.totalViews}</p>
              <p className="text-sm text-gray-600">All-time views</p>
            </div>
            <div className="h-12 w-px bg-sage-light" />
            <div>
              <p className="text-3xl font-bold text-sage-dark">{summary.shares}</p>
              <p className="text-sm text-gray-600">Shares</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
