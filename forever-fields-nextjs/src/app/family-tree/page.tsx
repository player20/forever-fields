"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout";
import { FadeIn } from "@/components/motion";
import { Card, Button } from "@/components/ui";
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
  PawPrint,
  Plus,
  Info,
} from "lucide-react";

export default function FamilyTreePage() {
  const [familyData] = useState(() => generateDemoFamilyTree());
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null
  );
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
  const totalPets = familyData.pets.length;
  const membersWithMemorials = familyData.members.filter(
    (m) => m.hasMemorial
  ).length;
  const petsWithMemorials = familyData.pets.filter((p) => p.hasMemorial).length;
  const generations =
    Math.max(...familyData.members.map((m) => m.generation)) + 1;

  const selectedId = selectedMember?.id || selectedPet?.id;

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-sage-pale/30 to-cream py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-sage flex items-center justify-center">
                    <TreeDeciduous className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-dark">
                      Family Tree
                    </h1>
                    <p className="text-gray-body">
                      Explore your family's history and memories
                    </p>
                  </div>
                </div>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Family Member
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-sage-pale/50 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <FadeIn delay={0.1}>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sage" />
                <span className="text-gray-body">
                  <strong className="text-gray-dark">{totalMembers}</strong>{" "}
                  family members
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-gold" />
                <span className="text-gray-body">
                  <strong className="text-gray-dark">{totalPets}</strong> pets
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Flower2 className="w-4 h-4 text-sage" />
                <span className="text-gray-body">
                  <strong className="text-gray-dark">
                    {membersWithMemorials + petsWithMemorials}
                  </strong>{" "}
                  memorials
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TreeDeciduous className="w-4 h-4 text-sage" />
                <span className="text-gray-body">
                  <strong className="text-gray-dark">{generations}</strong>{" "}
                  generations
                </span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Family Tree Canvas */}
            <div className="lg:col-span-3">
              <FadeIn delay={0.2}>
                <FamilyTree
                  data={familyData}
                  selectedId={selectedId}
                  onSelectPerson={handleSelectPerson}
                  onSelectPet={handleSelectPet}
                  className="w-full"
                />
              </FadeIn>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <FadeIn delay={0.3}>
                {/* Quick Guide */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-sage" />
                    <h3 className="text-lg font-serif font-semibold text-gray-dark">
                      How to Use
                    </h3>
                  </div>
                  <ul className="space-y-3 text-sm text-gray-body">
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-sage-pale flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-sage text-xs font-medium">1</span>
                      </div>
                      <span>
                        Click on any family member to view their memorial
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-sage-pale flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-sage text-xs font-medium">2</span>
                      </div>
                      <span>Drag to pan around the tree</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-sage-pale flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-sage text-xs font-medium">3</span>
                      </div>
                      <span>Use zoom controls for larger families</span>
                    </li>
                  </ul>
                </Card>

                {/* Legend */}
                <Card className="p-6">
                  <h3 className="text-lg font-serif font-semibold text-gray-dark mb-4">
                    Legend
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sage-pale ring-2 ring-sage flex items-center justify-center">
                        <span className="text-sm font-semibold text-sage-dark">
                          JD
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-dark">
                          Has Memorial
                        </p>
                        <p className="text-xs text-gray-body">
                          Click to view
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 ring-2 ring-gray-200 flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-dark">
                          No Memorial Yet
                        </p>
                        <p className="text-xs text-gray-body">
                          Click to create
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gold-light ring-2 ring-gold flex items-center justify-center relative">
                        <PawPrint className="w-5 h-5 text-gold-dark" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-dark">
                          Pet Memorial
                        </p>
                        <p className="text-xs text-gray-body">
                          Beloved companions
                        </p>
                      </div>
                    </div>
                    <hr className="my-3 border-sage-pale" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-0.5 bg-sage/50 rounded" />
                      <p className="text-xs text-gray-body">Family connection</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-0.5 rounded"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(90deg, #b38f1f80 0, #b38f1f80 4px, transparent 4px, transparent 8px)",
                        }}
                      />
                      <p className="text-xs text-gray-body">Pet connection</p>
                    </div>
                  </div>
                </Card>

                {/* Family Stats */}
                <Card className="p-6 bg-sage-pale/30">
                  <h3 className="text-lg font-serif font-semibold text-gray-dark mb-4">
                    Anderson Family
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-body">Earliest record</span>
                      <span className="font-medium text-gray-dark">1918</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-body">Family members</span>
                      <span className="font-medium text-gray-dark">
                        {totalMembers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-body">Memorials created</span>
                      <span className="font-medium text-sage">
                        {membersWithMemorials + petsWithMemorials}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-body">Pets remembered</span>
                      <span className="font-medium text-gold-dark">
                        {petsWithMemorials}
                      </span>
                    </div>
                  </div>
                </Card>
              </FadeIn>
            </div>
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
