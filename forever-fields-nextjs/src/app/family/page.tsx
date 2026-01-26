"use client";

import { motion } from "framer-motion";
import { Button, Card, Badge, Avatar, AvatarGroup } from "@/components/ui";
import { Header } from "@/components/layout";
import { FadeIn, SlideUp, Stagger, StaggerItem } from "@/components/motion";
import {
  Users,
  TreeDeciduous,
  Heart,
  MessageSquare,
  Share2,
  Bell,
  Shield,
  Plus,
  ChevronRight,
  UserPlus,
  Mail,
} from "lucide-react";

const familyFeatures = [
  {
    icon: TreeDeciduous,
    title: "Family Tree Builder",
    description:
      "Create and visualize your family connections. Import from GEDCOM or build from scratch.",
  },
  {
    icon: Share2,
    title: "Collaborative Memories",
    description:
      "Invite family members to contribute photos, stories, and memories together.",
  },
  {
    icon: MessageSquare,
    title: "Family Chat",
    description:
      "Private discussion space for family members to share and connect.",
  },
  {
    icon: Bell,
    title: "Memory Notifications",
    description:
      "Get notified when family members add new photos or stories.",
  },
  {
    icon: Shield,
    title: "Privacy Controls",
    description:
      "Granular permissions to control who can view and contribute to each memorial.",
  },
  {
    icon: Heart,
    title: "Shared Tributes",
    description:
      "Create collaborative tribute walls where everyone can leave messages.",
  },
];

const familyMembers = [
  { name: "Sarah M.", role: "Admin", status: "online" },
  { name: "Michael T.", role: "Editor", status: "online" },
  { name: "Eleanor K.", role: "Viewer", status: "offline" },
  { name: "James R.", role: "Editor", status: "offline" },
  { name: "Linda P.", role: "Editor", status: "online" },
];

export default function FamilyPage() {
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
                icon={<Users className="w-4 h-4" />}
                className="mb-4"
              >
                Family
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-dark mb-4">
                Connect Your Family
              </h1>
              <p className="text-lg text-gray-body mb-8">
                Build your family tree, collaborate on memorials, and keep everyone
                connected across generations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  <TreeDeciduous className="w-5 h-5 mr-2" />
                  Build Family Tree
                </Button>
                <Button variant="outline" size="lg">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Invite Family
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Family Members Panel */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-serif font-semibold text-gray-dark">
                    Your Family Circle
                  </h2>
                  <p className="text-sm text-gray-body">
                    5 members connected to your memorials
                  </p>
                </div>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Invite Member
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {familyMembers.map((member) => (
                  <div
                    key={member.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-sage-pale/30"
                  >
                    <div className="relative">
                      <Avatar name={member.name} size="md" />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          member.status === "online"
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-dark truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-body">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </SlideUp>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-serif font-bold text-gray-dark mb-4">
                Family Collaboration Tools
              </h2>
              <p className="text-lg text-gray-body">
                Everything you need to keep your family connected and preserve
                memories together.
              </p>
            </div>
          </SlideUp>

          <Stagger staggerDelay={0.1}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {familyFeatures.map((feature) => (
                <StaggerItem key={feature.title}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full p-6 hover:shadow-hover transition-shadow">
                      <div className="w-12 h-12 rounded-xl bg-sage-pale flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-sage" />
                      </div>
                      <h3 className="text-lg font-serif font-semibold text-gray-dark mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-body">{feature.description}</p>
                    </Card>
                  </motion.div>
                </StaggerItem>
              ))}
            </div>
          </Stagger>
        </div>
      </section>

      {/* Family Tree Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <SlideUp>
              <div>
                <Badge variant="secondary" pill className="mb-4">
                  Family Tree
                </Badge>
                <h2 className="text-3xl font-serif font-bold text-gray-dark mb-4">
                  Visualize Your Heritage
                </h2>
                <p className="text-lg text-gray-body mb-6">
                  Build a beautiful interactive family tree that connects
                  generations. Import from GEDCOM files or start fresh.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Interactive visual tree",
                    "Import from Ancestry, FamilySearch",
                    "Connect memorials to tree nodes",
                    "Share with family members",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-sage flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-body">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button>
                  Start Building
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </SlideUp>

            <SlideUp delay={0.2}>
              <Card className="p-8 bg-sage-pale/20">
                <div className="text-center">
                  <TreeDeciduous className="w-24 h-24 text-sage mx-auto mb-4" />
                  <p className="text-gray-body">Family Tree Preview</p>
                  <div className="mt-6 flex justify-center">
                    <AvatarGroup
                      avatars={familyMembers.map((m) => ({ name: m.name }))}
                      max={5}
                    />
                  </div>
                </div>
              </Card>
            </SlideUp>
          </div>
        </div>
      </section>

      {/* Invite CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <Card className="p-8 sm:p-12 bg-gradient-to-r from-sage-pale/50 to-gold/10 text-center">
              <Mail className="w-12 h-12 text-sage mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-dark mb-4">
                Invite Your Family Members
              </h2>
              <p className="text-gray-body mb-6 max-w-xl mx-auto">
                Send invitations to family members so they can view and contribute
                to shared memorials.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  <Mail className="w-5 h-5 mr-2" />
                  Send Invitations
                </Button>
                <Button variant="outline" size="lg">
                  Copy Invite Link
                </Button>
              </div>
            </Card>
          </SlideUp>
        </div>
      </section>
    </div>
  );
}
