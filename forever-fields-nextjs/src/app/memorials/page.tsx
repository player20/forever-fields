"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Card, Avatar, Badge } from "@/components/ui";
import { Header } from "@/components/layout";
import { FadeIn, SlideUp, Stagger, StaggerItem } from "@/components/motion";
import {
  Heart,
  Search,
  Filter,
  Plus,
  MapPin,
  Users,
  Flower2,
} from "lucide-react";
import { useState } from "react";

// Sample memorials data
const sampleMemorials = [
  {
    id: "1",
    name: "Margaret Rose Sullivan",
    dates: "1932 - 2023",
    location: "Boston, MA",
    photo: null,
    contributorsCount: 12,
    memoriesCount: 47,
    relationship: "Grandmother",
  },
  {
    id: "2",
    name: "Robert James Williams",
    dates: "1945 - 2022",
    location: "Chicago, IL",
    photo: null,
    contributorsCount: 8,
    memoriesCount: 31,
    relationship: "Father",
  },
  {
    id: "3",
    name: "Eleanor Grace Chen",
    dates: "1958 - 2024",
    location: "San Francisco, CA",
    photo: null,
    contributorsCount: 15,
    memoriesCount: 62,
    relationship: "Mother",
  },
  {
    id: "4",
    name: "Thomas Edward Murphy",
    dates: "1940 - 2021",
    location: "New York, NY",
    photo: null,
    contributorsCount: 6,
    memoriesCount: 24,
    relationship: "Grandfather",
  },
  {
    id: "5",
    name: "Patricia Ann Johnson",
    dates: "1950 - 2023",
    location: "Denver, CO",
    photo: null,
    contributorsCount: 10,
    memoriesCount: 38,
    relationship: "Aunt",
  },
  {
    id: "6",
    name: "William Henry Thompson",
    dates: "1935 - 2020",
    location: "Seattle, WA",
    photo: null,
    contributorsCount: 4,
    memoriesCount: 19,
    relationship: "Great-Uncle",
  },
];

export default function MemorialsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMemorials = sampleMemorials.filter((memorial) =>
    memorial.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sage-pale/50 to-cream py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto">
              <Badge
                variant="outline"
                pill
                icon={<Heart className="w-4 h-4" />}
                className="mb-4"
              >
                Your Memorials
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-dark mb-4">
                Cherished Memories
              </h1>
              <p className="text-lg text-gray-body mb-8">
                View and manage the memorials you&apos;ve created or been invited to
                contribute to.
              </p>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-body" />
                  <input
                    type="text"
                    placeholder="Search memorials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-sage-pale bg-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Create New Memorial CTA */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <Card className="p-6 bg-gradient-to-r from-sage-pale/50 to-gold/10 border-sage-pale">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sage flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-gray-dark">
                      Create a New Memorial
                    </h3>
                    <p className="text-sm text-gray-body">
                      Honor someone special with a beautiful digital memorial
                    </p>
                  </div>
                </div>
                <Link href="/create"><Button>Get Started</Button></Link>
              </div>
            </Card>
          </SlideUp>
        </div>
      </section>

      {/* Memorials Grid */}
      <section className="py-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Stagger staggerDelay={0.05}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMemorials.map((memorial) => (
                <StaggerItem key={memorial.id}>
                  <Link href={`/memorial/${memorial.id}`}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="h-full p-6 hover:shadow-hover transition-shadow cursor-pointer">
                        <div className="flex items-start gap-4 mb-4">
                          <Avatar name={memorial.name} size="lg" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif font-semibold text-gray-dark truncate">
                              {memorial.name}
                            </h3>
                            <p className="text-sm text-gray-body">
                              {memorial.dates}
                            </p>
                            <Badge variant="secondary" size="sm" className="mt-1">
                              {memorial.relationship}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-body mb-4">
                          <MapPin className="w-4 h-4" />
                          {memorial.location}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-sage-pale/50">
                          <div className="flex items-center gap-4 text-sm text-gray-body">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4 text-sage" />
                              {memorial.memoriesCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-sage" />
                              {memorial.contributorsCount}
                            </span>
                          </div>
                          <Flower2 className="w-5 h-5 text-sage" />
                        </div>
                      </Card>
                    </motion.div>
                  </Link>
                </StaggerItem>
              ))}
            </div>
          </Stagger>

          {filteredMemorials.length === 0 && (
            <FadeIn>
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-sage-pale flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-sage" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-gray-dark mb-2">
                  No memorials found
                </h3>
                <p className="text-gray-body mb-6">
                  Try adjusting your search or create a new memorial
                </p>
                <Link href="/create"><Button>Create Memorial</Button></Link>
              </div>
            </FadeIn>
          )}
        </div>
      </section>
    </div>
  );
}
