"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import ReactFamilyTree from "react-family-tree";
import type { Node as FamilyTreeNode } from "relatives-tree/lib/types";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

// Types for family tree nodes - extends the library's node type
type FamilyNode = FamilyTreeNode;

interface Person {
  id: string;
  name: string;
  birthYear?: string;
  deathYear?: string;
  photoUrl?: string;
  memorialId?: string;
  isDeceased?: boolean;
  relationship?: string;
}

interface FamilyTreeProps {
  rootPersonId: string;
  nodes: FamilyNode[];
  people: Record<string, Person>;
  onPersonClick?: (personId: string) => void;
  width?: number;
  height?: number;
}

// Custom node component
function FamilyTreeNode({
  node,
  person,
  isRoot,
  onClick,
}: {
  node: FamilyNode;
  person: Person;
  isRoot: boolean;
  onClick?: () => void;
}) {
  const isDeceased = person.isDeceased || !!person.deathYear;
  const lifespan = person.birthYear
    ? `${person.birthYear}${person.deathYear ? ` - ${person.deathYear}` : ""}`
    : "";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      aria-label={`View ${person.name}'s memorial`}
      className={`relative cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 rounded-lg ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div
        className={`p-2 rounded-lg text-center min-w-[100px] ${
          isRoot
            ? "bg-sage text-white shadow-lg ring-2 ring-gold"
            : isDeceased
            ? "bg-sage-pale border-2 border-sage"
            : "bg-white border border-gray-200"
        }`}
      >
        {/* Photo */}
        <div
          className={`w-12 h-12 mx-auto rounded-full overflow-hidden mb-1 ${
            isDeceased ? "grayscale" : ""
          } ${!person.photoUrl ? "bg-gray-200 flex items-center justify-center" : ""}`}
        >
          {person.photoUrl ? (
            <Image
              src={person.photoUrl}
              alt={person.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized={person.photoUrl.startsWith("blob:") || person.photoUrl.startsWith("data:")}
            />
          ) : (
            <span className="text-xl">
              {node.gender === "female" ? "👩" : "👨"}
            </span>
          )}
        </div>

        {/* Name */}
        <p
          className={`font-medium text-sm truncate ${
            isRoot ? "text-white" : "text-sage-dark"
          }`}
        >
          {person.name}
        </p>

        {/* Lifespan */}
        {lifespan && (
          <p
            className={`text-xs ${isRoot ? "text-sage-pale" : "text-gray-500"}`}
          >
            {lifespan}
          </p>
        )}

        {/* Relationship badge */}
        {person.relationship && (
          <span className="absolute -top-2 -right-2 bg-gold text-white text-xs px-2 py-0.5 rounded-full">
            {person.relationship}
          </span>
        )}

        {/* Memorial link indicator */}
        {person.memorialId && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-sage rounded-full flex items-center justify-center">
            <span className="text-white text-xs">📖</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function FamilyTree({
  rootPersonId,
  nodes,
  people,
  onPersonClick,
  width = 800,
  height = 600,
}: FamilyTreeProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  const handlePersonClick = useCallback(
    (personId: string) => {
      setSelectedPerson(personId);
      onPersonClick?.(personId);
    },
    [onPersonClick]
  );

  const renderNode = useCallback(
    (node: FamilyNode) => {
      const person = people[node.id];
      if (!person) return null;

      return (
        <FamilyTreeNode
          key={node.id}
          node={node}
          person={person}
          isRoot={node.id === rootPersonId}
          onClick={() => handlePersonClick(node.id)}
        />
      );
    },
    [people, rootPersonId, handlePersonClick]
  );

  if (nodes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <span className="text-5xl block mb-4">🌳</span>
          <p className="text-gray-600 mb-4">No family tree data yet.</p>
          <Button>Add Family Members</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Family Tree</CardTitle>
            <CardDescription>
              Click any person to view their memorial
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            >
              −
            </Button>
            <span className="px-2 py-1 text-sm text-gray-500">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            >
              +
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="overflow-auto bg-sage-pale/20 rounded-lg"
          style={{ height: height }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              minWidth: width,
              padding: "2rem",
            }}
          >
            <ReactFamilyTree
              nodes={nodes}
              rootId={rootPersonId}
              width={width}
              height={height}
              renderNode={renderNode}
            />
          </div>
        </div>

        {/* Selected person details */}
        {selectedPerson && people[selectedPerson] && (
          <div className="mt-4 p-4 bg-sage-pale rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                {people[selectedPerson].photoUrl ? (
                  <Image
                    src={people[selectedPerson].photoUrl}
                    alt={people[selectedPerson].name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized={people[selectedPerson].photoUrl.startsWith("blob:") || people[selectedPerson].photoUrl.startsWith("data:")}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl text-sage-dark">
                  {people[selectedPerson].name}
                </h3>
                {people[selectedPerson].birthYear && (
                  <p className="text-gray-600">
                    {people[selectedPerson].birthYear}
                    {people[selectedPerson].deathYear &&
                      ` - ${people[selectedPerson].deathYear}`}
                  </p>
                )}
              </div>
              {people[selectedPerson].memorialId && (
                <Button
                  onClick={() =>
                    (window.location.href = `/memorial/${people[selectedPerson].memorialId}`)
                  }
                >
                  View Memorial
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-sage rounded" />
            <span>Featured person</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-sage-pale border-2 border-sage rounded" />
            <span>Deceased</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-white border border-gray-200 rounded" />
            <span>Living</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📖</span>
            <span>Has memorial</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simpler tree for when react-family-tree doesn't work
export function SimpleFamilyTree({
  people,
  rootPersonId,
  onPersonClick,
}: {
  people: Person[];
  rootPersonId: string;
  onPersonClick?: (personId: string) => void;
}) {
  const _rootPerson = people.find((p) => p.id === rootPersonId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Members</CardTitle>
        <CardDescription>People connected to this memorial</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {people.map((person) => (
            <button
              key={person.id}
              onClick={() => onPersonClick?.(person.id)}
              className={`p-4 rounded-lg text-center transition-all hover:shadow-md ${
                person.id === rootPersonId
                  ? "bg-sage text-white"
                  : person.isDeceased
                  ? "bg-sage-pale"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div
                className={`w-16 h-16 mx-auto rounded-full overflow-hidden mb-2 ${
                  person.isDeceased ? "grayscale" : ""
                } ${!person.photoUrl ? "bg-gray-200 flex items-center justify-center" : ""}`}
              >
                {person.photoUrl ? (
                  <Image
                    src={person.photoUrl}
                    alt={person.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized={person.photoUrl.startsWith("blob:") || person.photoUrl.startsWith("data:")}
                  />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <p
                className={`font-medium ${
                  person.id === rootPersonId ? "text-white" : "text-sage-dark"
                }`}
              >
                {person.name}
              </p>
              {person.relationship && (
                <p
                  className={`text-sm ${
                    person.id === rootPersonId ? "text-sage-pale" : "text-gray-500"
                  }`}
                >
                  {person.relationship}
                </p>
              )}
              {person.birthYear && (
                <p
                  className={`text-xs ${
                    person.id === rootPersonId ? "text-sage-light" : "text-gray-400"
                  }`}
                >
                  {person.birthYear}
                  {person.deathYear && ` - ${person.deathYear}`}
                </p>
              )}
              {person.memorialId && person.id !== rootPersonId && (
                <span className="inline-block mt-1 text-xs bg-sage/20 text-sage-dark px-2 py-0.5 rounded">
                  View Memorial
                </span>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
