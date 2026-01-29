"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout";
import { FadeIn } from "@/components/motion";
import { Button, Badge } from "@/components/ui";
import {
  FamilyTree,
  MemorialSidebar,
  generateDemoFamilyTree,
  type FamilyMember,
  type Pet,
} from "@/components/family-tree";
import {
  TreeDeciduous,
  Users,
  Flower2,
  Plus,
} from "lucide-react";

export default function FamilyTreePage() {
  const [familyData] = useState(() => generateDemoFamilyTree());
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleSelectPerson = useCallback((member: FamilyMember) => {
    setSelectedMember(member);
    setSelectedPet(null);
    setShowSidebar(true);
  }, []);

  const handleSelectPet = useCallback((pet: Pet) => {
    setSelectedPet(pet);
    setSelectedMember(null);
    setShowSidebar(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setShowSidebar(false);
  }, []);

  // Calculate stats
  const totalMembers = familyData.members.length;
  const membersWithMemorials = familyData.members.filter((m) => m.hasMemorial).length;
  const petsWithMemorials = familyData.pets.filter((p) => p.hasMemorial).length;
  const generations = Math.max(...familyData.members.map((m) => m.generation)) + 1;

  const selectedId = selectedMember?.id || selectedPet?.id;

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section - Simplified */}
      <section className="bg-gradient-to-b from-sage-pale/30 to-cream py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sage flex items-center justify-center">
                  <TreeDeciduous className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-serif font-bold text-gray-dark">
                    Family Tree
                  </h1>
                  <p className="text-sm text-gray-body">
                    Click anyone to view their memorial
                  </p>
                </div>
              </div>

              {/* Stats inline */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sage" />
                  <span className="text-gray-dark font-medium">{totalMembers}</span>
                  <span className="text-gray-body hidden sm:inline">members</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flower2 className="w-4 h-4 text-sage" />
                  <span className="text-gray-dark font-medium">{membersWithMemorials + petsWithMemorials}</span>
                  <span className="text-gray-body hidden sm:inline">memorials</span>
                </div>
                <Badge variant="outline" size="sm">
                  {generations} generations
                </Badge>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Family Tree - Full Width */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn delay={0.1}>
            <FamilyTree
              data={familyData}
              selectedId={selectedId}
              onSelectPerson={handleSelectPerson}
              onSelectPet={handleSelectPet}
              className="w-full"
            />
          </FadeIn>

          {/* Simple action bar */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Drag to pan • Scroll to zoom • Click to view memorial
            </p>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Member
            </Button>
          </div>
        </div>
      </section>

      {/* Memorial Sidebar */}
      {showSidebar && (
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
