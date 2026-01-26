"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Card, Badge, Avatar, Skeleton } from "@/components/ui";
import { Header } from "@/components/layout";
import { FadeIn, SlideUp, Stagger, StaggerItem } from "@/components/motion";
import { useAuth, useRequireAuth } from "@/hooks/useAuth";
import {
  Plus,
  Heart,
  Users,
  Eye,
  Bell,
  Settings,
  ChevronRight,
  Flower2,
  MapPin,
  TrendingUp,
  Clock,
  MessageSquare,
  Image as ImageIcon,
  Gift,
  Star,
} from "lucide-react";

interface Memorial {
  id: string;
  slug: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  birth_date: string | null;
  death_date: string | null;
  birth_place: string | null;
  resting_place: string | null;
  profile_photo_url: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  photos?: { id: string }[];
  stories?: { id: string }[];
  candle_lightings?: { id: string }[];
  collaborators?: { role: string; user_id: string }[];
}

const recentActivity = [
  {
    id: "1",
    type: "candle",
    memorial: "Margaret Rose Sullivan",
    user: "Sarah Johnson",
    message: "lit a candle",
    time: "2 hours ago",
  },
  {
    id: "2",
    type: "memory",
    memorial: "Eleanor Grace Chen",
    user: "Michael Chen",
    message: "shared a new memory",
    time: "5 hours ago",
  },
  {
    id: "3",
    type: "photo",
    memorial: "Margaret Rose Sullivan",
    user: "Tom Sullivan",
    message: "added 3 photos",
    time: "1 day ago",
  },
  {
    id: "4",
    type: "candle",
    memorial: "Robert James Williams",
    user: "Anonymous",
    message: "lit a candle with a message",
    time: "2 days ago",
  },
];

const quickActions = [
  {
    icon: Plus,
    label: "Create Memorial",
    description: "Honor a loved one",
    href: "/create",
    color: "bg-sage",
  },
  {
    icon: ImageIcon,
    label: "Upload Photos",
    description: "Add new memories",
    href: "/memorials",
    color: "bg-blue-500",
  },
  {
    icon: Gift,
    label: "Send Flowers",
    description: "Shop memorial gifts",
    href: "/shop",
    color: "bg-pink-500",
  },
  {
    icon: Users,
    label: "Invite Family",
    description: "Share access",
    href: "/family",
    color: "bg-purple-500",
  },
];

export default function DashboardPage() {
  // Require authentication
  const { user, isLoading: authLoading } = useRequireAuth();

  const [filter, setFilter] = useState<"all" | "creator" | "contributor">("all");
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch memorials
  useEffect(() => {
    async function fetchMemorials() {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch("/api/memorials");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch memorials");
        }

        setMemorials(data.memorials || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load memorials");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMemorials();
  }, [user]);

  // Transform memorial data for display
  const transformedMemorials = memorials.map((m) => {
    const role = m.collaborators?.find((c) => c.user_id === user?.id)?.role || "creator";
    const birthYear = m.birth_date ? new Date(m.birth_date).getFullYear() : "?";
    const deathYear = m.death_date ? new Date(m.death_date).getFullYear() : "?";

    return {
      id: m.id,
      slug: m.slug,
      name: `${m.first_name}${m.middle_name ? " " + m.middle_name : ""} ${m.last_name}`,
      dates: `${birthYear} - ${deathYear}`,
      location: m.resting_place || m.birth_place || "Location not set",
      photo: m.profile_photo_url,
      memoriesCount: m.stories?.length || 0,
      photosCount: m.photos?.length || 0,
      candlesCount: m.candle_lightings?.length || 0,
      viewsThisMonth: m.view_count,
      role: role === "owner" ? "creator" : "contributor",
      lastActivity: new Date(m.updated_at).toLocaleDateString(),
    };
  });

  const filteredMemorials = transformedMemorials.filter((m) =>
    filter === "all" ? true : m.role === filter
  );

  // Calculate stats
  const totalMemories = transformedMemorials.reduce((sum, m) => sum + m.memoriesCount, 0);
  const totalCandles = transformedMemorials.reduce((sum, m) => sum + m.candlesCount, 0);
  const totalViews = transformedMemorials.reduce((sum, m) => sum + m.viewsThisMonth, 0);

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Flower2 className="w-12 h-12 text-sage animate-pulse mx-auto mb-4" />
          <p className="text-gray-body">Loading...</p>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "candle":
        return "🕯️";
      case "memory":
        return "💭";
      case "photo":
        return "📷";
      default:
        return "✨";
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Welcome Section */}
      <section className="bg-gradient-to-b from-sage-pale/50 to-cream py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-dark">
                  Welcome back
                </h1>
                <p className="text-gray-body mt-1">
                  Manage your memorials and stay connected with family
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                  <Badge variant="default" size="sm" pill>3</Badge>
                </Button>
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-6 -mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Stagger staggerDelay={0.05}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StaggerItem>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
                      <Flower2 className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-dark">{transformedMemorials.length}</p>
                      <p className="text-sm text-gray-body">Memorials</p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-dark">{totalMemories}</p>
                      <p className="text-sm text-gray-body">Memories</p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                      <span className="text-xl">🕯️</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-dark">{totalCandles}</p>
                      <p className="text-sm text-gray-body">Candles Lit</p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-dark">{totalViews}</p>
                      <p className="text-sm text-gray-body">Views this month</p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            </div>
          </Stagger>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <h2 className="text-lg font-semibold text-gray-dark mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-xl p-4 border border-sage-pale/50 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-medium text-gray-dark">{action.label}</h3>
                    <p className="text-sm text-gray-body">{action.description}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </SlideUp>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="py-6 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Memorials List */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-dark">Your Memorials</h2>
                <div className="flex gap-2">
                  {(["all", "creator", "contributor"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                        filter === f
                          ? "bg-sage text-white"
                          : "bg-sage-pale/50 text-gray-body hover:bg-sage-pale"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-start gap-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-48 mb-2" />
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card className="p-8 text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>Try Again</Button>
                </Card>
              ) : (
              <Stagger staggerDelay={0.05}>
                <div className="space-y-4">
                  {filteredMemorials.map((memorial) => (
                    <StaggerItem key={memorial.id}>
                      <Link href={`/memorial/${memorial.slug}`}>
                        <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                          <Card className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                              <Avatar name={memorial.name} size="lg" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-serif font-semibold text-gray-dark truncate">
                                    {memorial.name}
                                  </h3>
                                  <Badge
                                    variant={memorial.role === "creator" ? "default" : "secondary"}
                                    size="sm"
                                  >
                                    {memorial.role}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-body">{memorial.dates}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-body">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {memorial.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {memorial.lastActivity}
                                  </span>
                                </div>

                                {/* Stats Row */}
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-sage-pale/50">
                                  <span className="flex items-center gap-1 text-sm">
                                    <Heart className="w-4 h-4 text-sage" />
                                    {memorial.memoriesCount}
                                  </span>
                                  <span className="flex items-center gap-1 text-sm">
                                    <ImageIcon className="w-4 h-4 text-blue-500" />
                                    {memorial.photosCount}
                                  </span>
                                  <span className="flex items-center gap-1 text-sm">
                                    <span>🕯️</span>
                                    {memorial.candlesCount}
                                  </span>
                                  <span className="flex items-center gap-1 text-sm text-green-600">
                                    <Eye className="w-4 h-4" />
                                    {memorial.viewsThisMonth}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </Card>
                        </motion.div>
                      </Link>
                    </StaggerItem>
                  ))}
                </div>
              </Stagger>
              )}

              {!isLoading && !error && filteredMemorials.length === 0 && (
                <Card className="p-8 text-center">
                  <Flower2 className="w-12 h-12 text-sage mx-auto mb-3" />
                  <h3 className="font-serif text-lg font-semibold text-gray-dark mb-2">
                    No memorials found
                  </h3>
                  <p className="text-gray-body mb-4">
                    Create a memorial to honor your loved ones.
                  </p>
                  <Link href="/create">
                    <Button>Create Memorial</Button>
                  </Link>
                </Card>
              )}
            </div>

            {/* Recent Activity Sidebar */}
            <div>
              <h2 className="text-lg font-semibold text-gray-dark mb-4">Recent Activity</h2>
              <Card className="p-4">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-dark">
                          <span className="font-medium">{activity.user}</span>{" "}
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-body truncate">
                          on {activity.memorial}
                        </p>
                        <p className="text-xs text-gray-light mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 pt-4 border-t border-sage-pale/50 text-sm text-sage hover:text-sage-dark font-medium">
                  View All Activity
                </button>
              </Card>

              {/* Premium Upsell */}
              <Card className="mt-6 p-4 bg-gradient-to-br from-gold/10 to-sage-pale/30 border-gold/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                    <Star className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-dark">Upgrade to Premium</h3>
                    <p className="text-sm text-gray-body mt-1">
                      Unlock unlimited photos, voice cloning, and more AI features.
                    </p>
                    <Button variant="outline" size="sm" className="mt-3">
                      Learn More
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Help Card */}
              <Card className="mt-6 p-4">
                <h3 className="font-medium text-gray-dark mb-2">Need Help?</h3>
                <p className="text-sm text-gray-body mb-3">
                  Our support team is here to help you create meaningful memorials.
                </p>
                <Link href="/help">
                  <Button variant="ghost" size="sm" className="w-full">
                    Visit Help Center
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
