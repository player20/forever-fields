"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Card, Badge, Avatar } from "@/components/ui";
import { Header } from "@/components/layout";
import { FadeIn, SlideUp, Stagger, StaggerItem } from "@/components/motion";
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Heart,
  Users,
  Flower2,
  Clock,
} from "lucide-react";
import { useState } from "react";

// Sample search results
const searchResults = [
  {
    id: "1",
    type: "memorial",
    name: "Margaret Rose Sullivan",
    dates: "1932 - 2023",
    location: "Boston, MA",
    memoriesCount: 47,
  },
  {
    id: "2",
    type: "memorial",
    name: "Robert James Williams",
    dates: "1945 - 2022",
    location: "Chicago, IL",
    memoriesCount: 31,
  },
  {
    id: "3",
    type: "memorial",
    name: "Eleanor Grace Chen",
    dates: "1958 - 2024",
    location: "San Francisco, CA",
    memoriesCount: 62,
  },
];

const recentSearches = [
  "Sullivan family",
  "Boston memorials",
  "1940s birth year",
  "Williams",
];

const filters = [
  { id: "all", label: "All" },
  { id: "memorials", label: "Memorials" },
  { id: "people", label: "People" },
  { id: "stories", label: "Stories" },
  { id: "photos", label: "Photos" },
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setHasSearched(true);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Search Header */}
      <section className="bg-gradient-to-b from-sage-pale/50 to-cream py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-dark mb-4">
                Search Memorials
              </h1>
              <p className="text-gray-body">
                Find memorials, stories, and photos across Forever Fields
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-body" />
              <input
                type="text"
                placeholder="Search by name, location, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-32 py-5 rounded-2xl border border-sage-pale bg-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-lg shadow-soft"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                Search
              </Button>
            </form>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeFilter === filter.id ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Content Area */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hasSearched ? (
            /* Recent Searches & Suggestions */
            <SlideUp>
              <div className="space-y-8">
                {/* Recent Searches */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-dark mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-sage" />
                    Recent Searches
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => {
                          setSearchQuery(search);
                          setHasSearched(true);
                        }}
                        className="px-4 py-2 rounded-full bg-white border border-sage-pale hover:border-sage hover:bg-sage-pale/30 transition-colors text-sm text-gray-body"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Browse Suggestions */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-dark mb-4">
                    Browse by Category
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      {
                        icon: MapPin,
                        label: "Browse by Location",
                        desc: "Find memorials near you",
                      },
                      {
                        icon: Calendar,
                        label: "Browse by Date",
                        desc: "Search by year or decade",
                      },
                      {
                        icon: Users,
                        label: "Public Memorials",
                        desc: "Explore shared tributes",
                      },
                      {
                        icon: Heart,
                        label: "Featured Memorials",
                        desc: "Inspiring life stories",
                      },
                    ].map((item) => (
                      <Card
                        key={item.label}
                        className="p-4 hover:shadow-hover transition-shadow cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
                            <item.icon className="w-5 h-5 text-sage" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-dark">
                              {item.label}
                            </h3>
                            <p className="text-sm text-gray-body">{item.desc}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </SlideUp>
          ) : (
            /* Search Results */
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-body">
                  Found <span className="font-medium text-gray-dark">3 results</span>{" "}
                  for &ldquo;{searchQuery}&rdquo;
                </p>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  More Filters
                </Button>
              </div>

              <Stagger staggerDelay={0.05}>
                <div className="space-y-4">
                  {searchResults.map((result) => (
                    <StaggerItem key={result.id}>
                      <Link href={`/memorial/${result.id}`}>
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className="p-4 hover:shadow-hover transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                              <Avatar name={result.name} size="lg" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" size="sm">
                                    Memorial
                                  </Badge>
                                </div>
                                <h3 className="font-serif font-semibold text-gray-dark truncate">
                                  {result.name}
                                </h3>
                                <p className="text-sm text-gray-body">
                                  {result.dates}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-body">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {result.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Heart className="w-4 h-4 text-sage" />
                                    {result.memoriesCount} memories
                                  </span>
                                </div>
                              </div>
                              <Flower2 className="w-6 h-6 text-sage shrink-0" />
                            </div>
                          </Card>
                        </motion.div>
                      </Link>
                    </StaggerItem>
                  ))}
                </div>
              </Stagger>

              {/* No More Results */}
              <div className="text-center py-12">
                <p className="text-gray-body mb-4">
                  Can&apos;t find what you&apos;re looking for?
                </p>
                <Link href="/create"><Button variant="outline">Create a Memorial</Button></Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
