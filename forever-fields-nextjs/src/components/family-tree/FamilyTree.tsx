"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Home } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { PersonNode } from "./PersonNode";
import { PetNode } from "./PetNode";
import type {
  FamilyTreeData,
  FamilyMember,
  Pet,
  TreeNodePosition,
  Connection,
} from "./types";

interface FamilyTreeProps {
  data: FamilyTreeData;
  selectedId?: string;
  onSelectPerson?: (member: FamilyMember) => void;
  onSelectPet?: (pet: Pet) => void;
  className?: string;
}

// Layout constants - improved spacing for less crowded look
const NODE_WIDTH = 140;
const NODE_HEIGHT = 110;
const VERTICAL_GAP = 120; // More space between generations
const SIBLING_GAP = 60; // More space between siblings
const COUPLE_GAP = 24; // Space between spouses
const BRANCH_GAP = 100; // Space between family branches
const PET_SIZE = 65;
const PET_OFFSET_Y = 95;

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const nodeVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

export function FamilyTree({
  data,
  selectedId,
  onSelectPerson,
  onSelectPet,
  className = "",
}: FamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate positions using generation-based layout with proper tree structure
  const { positions, connections, dimensions } = useMemo(() => {
    const positions = new Map<string, TreeNodePosition>();
    const connections: Connection[] = [];
    const memberMap = new Map(data.members.map(m => [m.id, m]));

    // Group members by generation
    const generations = new Map<number, FamilyMember[]>();
    data.members.forEach(member => {
      const gen = generations.get(member.generation) || [];
      gen.push(member);
      generations.set(member.generation, gen);
    });

    const sortedGens = Array.from(generations.entries()).sort(([a], [b]) => a - b);

    // Build family units (couples/singles) for each generation
    interface Unit {
      id: string;
      members: FamilyMember[];
      parentUnitIds: string[]; // Which parent units this belongs under (can be multiple for marriage merge)
    }

    const unitsByGen = new Map<number, Unit[]>();

    sortedGens.forEach(([genNum, members]) => {
      const processed = new Set<string>();
      const units: Unit[] = [];

      members.forEach(member => {
        if (processed.has(member.id)) return;

        const unitMembers: FamilyMember[] = [member];
        processed.add(member.id);

        // Add spouse if in same generation
        if (member.spouseId) {
          const spouse = memberMap.get(member.spouseId);
          if (spouse && spouse.generation === genNum && !processed.has(spouse.id)) {
            unitMembers.push(spouse);
            processed.add(spouse.id);
          }
        }

        // Determine ALL parent units (for marriage merge cases)
        const parentUnitIds: string[] = [];
        const prevUnits = unitsByGen.get(genNum - 1) || [];

        unitMembers.forEach(m => {
          if (m.parentIds && m.parentIds.length > 0) {
            for (const pu of prevUnits) {
              if (pu.members.some(pm => m.parentIds!.includes(pm.id))) {
                if (!parentUnitIds.includes(pu.id)) {
                  parentUnitIds.push(pu.id);
                }
              }
            }
          }
        });

        units.push({
          id: unitMembers.map(m => m.id).join('-'),
          members: unitMembers,
          parentUnitIds,
        });
      });

      unitsByGen.set(genNum, units);
    });

    // Calculate positions generation by generation
    // For proper tree layout, we need to handle "marriage merge" cases where
    // a couple's members come from different family lines

    // First pass: calculate width requirements for each unit (based on descendants)
    const unitWidths = new Map<string, number>();

    function getUnitWidth(unitId: string, genNum: number): number {
      if (unitWidths.has(unitId)) return unitWidths.get(unitId)!;

      const unit = unitsByGen.get(genNum)?.find(u => u.id === unitId);
      if (!unit) return NODE_WIDTH;

      const baseWidth = unit.members.length === 2 ? NODE_WIDTH * 2 + COUPLE_GAP : NODE_WIDTH;

      // Find children of this unit (only count units with single parent - merged couples are positioned separately)
      const nextGen = unitsByGen.get(genNum + 1) || [];
      const childUnits = nextGen.filter(cu =>
        cu.parentUnitIds.length === 1 && cu.parentUnitIds[0] === unitId
      );

      if (childUnits.length === 0) {
        unitWidths.set(unitId, baseWidth);
        return baseWidth;
      }

      const childrenWidth = childUnits.reduce((sum, cu, i) => {
        return sum + getUnitWidth(cu.id, genNum + 1) + (i > 0 ? SIBLING_GAP : 0);
      }, 0);

      const width = Math.max(baseWidth, childrenWidth);
      unitWidths.set(unitId, width);
      return width;
    }

    // Calculate widths starting from root units
    const rootUnits = unitsByGen.get(sortedGens[0]?.[0]) || [];
    rootUnits.forEach(unit => getUnitWidth(unit.id, sortedGens[0]?.[0] || 0));

    // Position units
    const unitPositions = new Map<string, { x: number; y: number; centerX: number }>();

    // Helper to position a unit's members
    function positionUnitMembers(unit: Unit, centerX: number, y: number) {
      if (unit.members.length === 2) {
        const [m1, m2] = unit.members;
        positions.set(m1.id, {
          id: m1.id,
          x: centerX - COUPLE_GAP / 2 - NODE_WIDTH / 2,
          y,
          type: "person",
        });
        positions.set(m2.id, {
          id: m2.id,
          x: centerX + COUPLE_GAP / 2 + NODE_WIDTH / 2,
          y,
          type: "person",
        });
        connections.push({ fromId: m1.id, toId: m2.id, type: "spouse" });
      } else {
        positions.set(unit.members[0].id, {
          id: unit.members[0].id,
          x: centerX,
          y,
          type: "person",
        });
      }
    }

    // Position root generation first
    let currentX = 80;
    const startY = 60;

    rootUnits.forEach((unit) => {
      const width = unitWidths.get(unit.id) || NODE_WIDTH;
      const centerX = currentX + width / 2;

      unitPositions.set(unit.id, { x: currentX, y: startY, centerX });
      positionUnitMembers(unit, centerX, startY);

      currentX += width + BRANCH_GAP;
    });

    // Position subsequent generations
    for (let i = 1; i < sortedGens.length; i++) {
      const [genNum] = sortedGens[i];
      const units = unitsByGen.get(genNum) || [];
      const y = startY + i * (NODE_HEIGHT + VERTICAL_GAP);

      // Separate units into: single-parent (normal), multi-parent (merged couples), orphans
      const singleParentUnits: Unit[] = [];
      const mergedUnits: Unit[] = [];
      const orphanUnits: Unit[] = [];

      units.forEach(unit => {
        if (unit.parentUnitIds.length === 0) {
          orphanUnits.push(unit);
        } else if (unit.parentUnitIds.length === 1) {
          singleParentUnits.push(unit);
        } else {
          mergedUnits.push(unit);
        }
      });

      // Position single-parent units centered under their parent
      const unitsByParent = new Map<string, Unit[]>();
      singleParentUnits.forEach(unit => {
        const parentId = unit.parentUnitIds[0];
        const siblings = unitsByParent.get(parentId) || [];
        siblings.push(unit);
        unitsByParent.set(parentId, siblings);
      });

      unitsByParent.forEach((siblings, parentId) => {
        const parentPos = unitPositions.get(parentId);
        if (!parentPos) return;

        const totalWidth = siblings.reduce((sum, sib, idx) => {
          return sum + (unitWidths.get(sib.id) || NODE_WIDTH) + (idx > 0 ? SIBLING_GAP : 0);
        }, 0);

        let sibX = parentPos.centerX - totalWidth / 2;

        siblings.forEach(unit => {
          const width = unitWidths.get(unit.id) || NODE_WIDTH;
          const centerX = sibX + width / 2;

          unitPositions.set(unit.id, { x: sibX, y, centerX });
          positionUnitMembers(unit, centerX, y);

          // Create parent-child connection
          connections.push({
            fromId: `${parentId}-center`,
            toId: unit.members[0].id,
            type: "parent-child",
          });

          sibX += width + SIBLING_GAP;
        });

        // Add center point for parent unit
        positions.set(`${parentId}-center`, {
          id: `${parentId}-center`,
          x: parentPos.centerX,
          y: parentPos.y,
          type: "person",
        });
      });

      // Position merged couples (those with multiple parent units) centered between their parents
      mergedUnits.forEach(unit => {
        const parentPositions = unit.parentUnitIds
          .map(pid => unitPositions.get(pid))
          .filter(Boolean);

        if (parentPositions.length === 0) return;

        // Center between all parent units
        const avgCenterX = parentPositions.reduce((sum, p) => sum + p!.centerX, 0) / parentPositions.length;
        const width = unitWidths.get(unit.id) || NODE_WIDTH;

        unitPositions.set(unit.id, { x: avgCenterX - width / 2, y, centerX: avgCenterX });
        positionUnitMembers(unit, avgCenterX, y);

        // Create connections from EACH parent unit to this merged couple
        unit.parentUnitIds.forEach(parentId => {
          const parentPos = unitPositions.get(parentId);
          if (parentPos) {
            // Add center point for parent if not exists
            if (!positions.has(`${parentId}-center`)) {
              positions.set(`${parentId}-center`, {
                id: `${parentId}-center`,
                x: parentPos.centerX,
                y: parentPos.y,
                type: "person",
              });
            }

            // Find which member of this unit belongs to which parent
            unit.members.forEach(member => {
              const parentUnit = unitsByGen.get(sortedGens[i - 1][0])?.find(u => u.id === parentId);
              if (parentUnit && member.parentIds?.some(pid => parentUnit.members.some(pm => pm.id === pid))) {
                connections.push({
                  fromId: `${parentId}-center`,
                  toId: member.id,
                  type: "parent-child",
                });
              }
            });
          }
        });
      });

      // Handle orphan units (those without any parent in the tree)
      orphanUnits.forEach(unit => {
        let maxX = 0;
        positions.forEach(pos => { if (!pos.id.includes('-center')) maxX = Math.max(maxX, pos.x); });

        const width = unitWidths.get(unit.id) || NODE_WIDTH;
        const x = maxX + BRANCH_GAP;
        const centerX = x + width / 2;

        unitPositions.set(unit.id, { x, y, centerX });
        positionUnitMembers(unit, centerX, y);
      });
    }

    // Calculate dimensions
    let maxX = 0;
    let maxY = 0;
    positions.forEach(pos => {
      if (!pos.id.includes('-center')) {
        maxX = Math.max(maxX, pos.x + NODE_WIDTH);
        maxY = Math.max(maxY, pos.y + NODE_HEIGHT);
      }
    });

    // Position pets near their owners
    data.pets.forEach(pet => {
      const ownerPos = positions.get(pet.ownerId);
      if (ownerPos) {
        const ownerPets = data.pets.filter(p => p.ownerId === pet.ownerId);
        const indexAmongOwnerPets = ownerPets.indexOf(pet);
        const petX = ownerPos.x + (indexAmongOwnerPets - (ownerPets.length - 1) / 2) * (PET_SIZE + 10);

        positions.set(pet.id, {
          id: pet.id,
          x: petX,
          y: ownerPos.y + PET_OFFSET_Y,
          type: "pet",
        });
        connections.push({
          fromId: pet.ownerId,
          toId: pet.id,
          type: "pet-owner",
        });

        maxY = Math.max(maxY, ownerPos.y + PET_OFFSET_Y + PET_SIZE);
      }
    });

    return {
      positions,
      connections,
      dimensions: {
        width: Math.max(maxX + 150, 900),
        height: maxY + 150,
      },
    };
  }, [data]);

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.3, Math.min(2, prev + delta)));
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.3, Math.min(2, prev + delta)));
  }, []);

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 50, y: 20 });
  };

  // Generate SVG path for connections with highlighting
  const renderConnections = () => {
    // Group parent-child connections by parent to draw proper tree structure
    const parentChildGroups = new Map<string, Connection[]>();

    connections.forEach(conn => {
      if (conn.type === "parent-child") {
        const existing = parentChildGroups.get(conn.fromId) || [];
        existing.push(conn);
        parentChildGroups.set(conn.fromId, existing);
      }
    });

    const paths: JSX.Element[] = [];

    // Draw spouse connections
    connections.filter(c => c.type === "spouse").forEach((connection) => {
      const from = positions.get(connection.fromId);
      const to = positions.get(connection.toId);
      if (!from || !to) return;

      const isHighlighted = !selectedId || (connectedNodeIds.has(connection.fromId) && connectedNodeIds.has(connection.toId));

      // Horizontal line connecting spouses at their midpoint
      const y = from.y + NODE_HEIGHT / 2;
      const fromX = from.x + NODE_WIDTH / 2 - 10;
      const toX = to.x - NODE_WIDTH / 2 + 10;

      paths.push(
        <path
          key={`spouse-${connection.fromId}-${connection.toId}`}
          d={`M ${fromX} ${y} L ${toX} ${y}`}
          fill="none"
          stroke={isHighlighted ? "#5a7d5a" : "#6b8e6b"}
          strokeWidth={isHighlighted ? 4 : 3}
          strokeLinecap="round"
          opacity={isHighlighted ? 0.9 : 0.3}
          filter={isHighlighted && selectedId ? "url(#glow)" : undefined}
          style={{ transition: "all 0.3s ease" }}
        />
      );
    });

    // Draw parent-child connections with tree structure
    parentChildGroups.forEach((childConns, parentId) => {
      const parentPos = positions.get(parentId);
      if (!parentPos) return;

      const children = childConns
        .map(c => ({ conn: c, pos: positions.get(c.toId) }))
        .filter(c => c.pos);

      if (children.length === 0) return;

      // Start point (below parent center)
      const startX = parentPos.x;
      const startY = parentPos.y + NODE_HEIGHT / 2 + 10;

      // Vertical drop distance
      const dropY = startY + VERTICAL_GAP / 2 - 20;

      // Check if this parent group involves selected node
      const parentMemberId = parentId.replace('-center', '').split('-')[0];
      const hasSelectedChild = children.some(c => connectedNodeIds.has(c.conn.toId));
      const isGroupHighlighted = !selectedId || (connectedNodeIds.has(parentMemberId) && hasSelectedChild);

      // Draw vertical line from parent
      paths.push(
        <path
          key={`parent-drop-${parentId}`}
          d={`M ${startX} ${startY} L ${startX} ${dropY}`}
          fill="none"
          stroke={isGroupHighlighted ? "#5a7d5a" : "#6b8e6b"}
          strokeWidth={isGroupHighlighted ? 3 : 2}
          strokeLinecap="round"
          opacity={isGroupHighlighted ? 0.8 : 0.25}
          filter={isGroupHighlighted && selectedId ? "url(#glow)" : undefined}
          style={{ transition: "all 0.3s ease" }}
        />
      );

      // If multiple children, draw horizontal line connecting them
      if (children.length > 1) {
        const childXs = children.map(c => c.pos!.x).sort((a, b) => a - b);
        const leftX = childXs[0];
        const rightX = childXs[childXs.length - 1];

        paths.push(
          <path
            key={`sibling-bar-${parentId}`}
            d={`M ${leftX} ${dropY} L ${rightX} ${dropY}`}
            fill="none"
            stroke={isGroupHighlighted ? "#5a7d5a" : "#6b8e6b"}
            strokeWidth={isGroupHighlighted ? 3 : 2}
            strokeLinecap="round"
            opacity={isGroupHighlighted ? 0.8 : 0.25}
            style={{ transition: "all 0.3s ease" }}
          />
        );
      }

      // Draw vertical lines down to each child
      children.forEach(({ conn, pos }) => {
        if (!pos) return;
        const childTopY = pos.y - 10;
        const isChildHighlighted = !selectedId || connectedNodeIds.has(conn.toId);

        paths.push(
          <path
            key={`child-line-${conn.toId}`}
            d={`M ${pos.x} ${dropY} L ${pos.x} ${childTopY}`}
            fill="none"
            stroke={isChildHighlighted ? "#5a7d5a" : "#6b8e6b"}
            strokeWidth={isChildHighlighted ? 3 : 2}
            strokeLinecap="round"
            opacity={isChildHighlighted ? 0.8 : 0.25}
            filter={isChildHighlighted && selectedId ? "url(#glow)" : undefined}
            style={{ transition: "all 0.3s ease" }}
          />
        );
      });
    });

    // Draw pet connections
    connections.filter(c => c.type === "pet-owner").forEach((connection) => {
      const from = positions.get(connection.fromId);
      const to = positions.get(connection.toId);
      if (!from || !to) return;

      const isHighlighted = !selectedId || (connectedNodeIds.has(connection.fromId) && connectedNodeIds.has(connection.toId));

      const startY = from.y + NODE_HEIGHT / 2 + 20;
      const endY = to.y - 5;

      paths.push(
        <path
          key={`pet-${connection.fromId}-${connection.toId}`}
          d={`M ${from.x} ${startY} L ${to.x} ${endY}`}
          fill="none"
          stroke={isHighlighted ? "#d4af37" : "#b38f1f"}
          strokeWidth={isHighlighted ? 2.5 : 1.5}
          strokeDasharray="6 4"
          strokeLinecap="round"
          opacity={isHighlighted ? 0.8 : 0.25}
          filter={isHighlighted && selectedId ? "url(#glow)" : undefined}
          style={{ transition: "all 0.3s ease" }}
        />
      );
    });

    return paths;
  };

  // Get connected node IDs for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedId) return new Set<string>();

    const connected = new Set<string>();
    connected.add(selectedId);

    // Find the selected member
    const selectedMember = data.members.find(m => m.id === selectedId);
    if (selectedMember) {
      // Add parents
      selectedMember.parentIds?.forEach(id => connected.add(id));
      // Add spouse
      if (selectedMember.spouseId) connected.add(selectedMember.spouseId);
      // Add children
      selectedMember.childIds?.forEach(id => connected.add(id));
      // Add pets
      selectedMember.petIds?.forEach(id => connected.add(id));
    }

    // Check if it's a pet
    const selectedPet = data.pets.find(p => p.id === selectedId);
    if (selectedPet) {
      connected.add(selectedPet.ownerId);
    }

    return connected;
  }, [selectedId, data.members, data.pets]);

  // Calculate dynamic container height
  const containerHeight = Math.min(Math.max(dimensions.height + 100, 500), 800);

  return (
    <div className={`relative ${className}`}>
      {/* Tree container with atmospheric background */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl border border-sage-pale/50 shadow-lg cursor-grab active:cursor-grabbing relative"
        style={{ height: containerHeight }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Atmospheric gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-sage-pale/20 via-cream to-white" />

        {/* Decorative blur circles for atmosphere */}
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-sage/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          className="relative"
          style={{
            width: dimensions.width,
            height: dimensions.height,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "top left",
          }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Connection lines SVG */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={dimensions.width}
            height={dimensions.height}
            style={{ overflow: "visible" }}
          >
            <defs>
              {/* Glow filter for highlighted connections */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {renderConnections()}
          </svg>

          {/* Person nodes with stagger animation */}
          <AnimatePresence>
            {data.members.map((member) => {
              const pos = positions.get(member.id);
              if (!pos) return null;

              const isConnected = connectedNodeIds.has(member.id);
              const isHighlighted = selectedId ? isConnected : true;

              return (
                <motion.div
                  key={member.id}
                  className="absolute"
                  style={{
                    left: pos.x - NODE_WIDTH / 2,
                    top: pos.y,
                    width: NODE_WIDTH,
                    opacity: isHighlighted ? 1 : 0.4,
                    transition: "opacity 0.3s ease",
                  }}
                  variants={nodeVariants}
                  custom={member.generation}
                >
                  <PersonNode
                    member={member}
                    isSelected={selectedId === member.id}
                    isHighlighted={isConnected}
                    onClick={onSelectPerson}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Pet nodes with stagger animation */}
          <AnimatePresence>
            {data.pets.map((pet) => {
              const pos = positions.get(pet.id);
              if (!pos) return null;

              const isConnected = connectedNodeIds.has(pet.id);
              const isHighlighted = selectedId ? isConnected : true;

              return (
                <motion.div
                  key={pet.id}
                  className="absolute"
                  style={{
                    left: pos.x - 35,
                    top: pos.y,
                    width: 75,
                    opacity: isHighlighted ? 1 : 0.4,
                    transition: "opacity 0.3s ease",
                  }}
                  variants={nodeVariants}
                >
                  <PetNode
                    pet={pet}
                    isSelected={selectedId === pet.id}
                    onClick={onSelectPet}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleZoom(0.15)}
          className="w-10 h-10 p-0 bg-white/90 hover:bg-white shadow-sm"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleZoom(-0.15)}
          className="w-10 h-10 p-0 bg-white/90 hover:bg-white shadow-sm"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          className="w-10 h-10 p-0 bg-white/90 hover:bg-white shadow-sm"
          aria-label="Reset view"
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-4 left-4">
        <Badge variant="secondary" className="bg-white/90 shadow-sm">
          {Math.round(zoom * 100)}%
        </Badge>
      </div>
    </div>
  );
}
