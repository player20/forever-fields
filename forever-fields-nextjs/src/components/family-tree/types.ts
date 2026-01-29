// Family Tree Types

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  birthYear?: number;
  deathYear?: number;
  profilePhoto?: string;
  hasMemorial: boolean;
  memorialId?: string;
  generation: number; // 0 = oldest shown, increases going down
  // Relationships
  spouseId?: string;
  parentIds?: string[];
  childIds?: string[];
  petIds?: string[];
}

export interface Pet {
  id: string;
  name: string;
  species: "dog" | "cat" | "bird" | "horse" | "other";
  birthYear?: number;
  deathYear?: number;
  profilePhoto?: string;
  hasMemorial: boolean;
  memorialId?: string;
  ownerId: string; // FamilyMember who owns this pet
}

export interface FamilyTreeData {
  members: FamilyMember[];
  pets: Pet[];
  rootMemberIds: string[]; // Top generation members
}

export interface TreeNodePosition {
  id: string;
  x: number;
  y: number;
  type: "person" | "pet";
}

export interface Connection {
  fromId: string;
  toId: string;
  type: "parent-child" | "spouse" | "pet-owner";
}

// Demo data for development - Simple 3-generation family
export function generateDemoFamilyTree(): FamilyTreeData {
  const members: FamilyMember[] = [
    // Generation 0 - Grandparents
    {
      id: "g1",
      firstName: "James",
      lastName: "Anderson",
      birthYear: 1945,
      deathYear: 2020,
      hasMemorial: true,
      memorialId: "mem-g1",
      generation: 0,
      spouseId: "g2",
      childIds: ["p1", "p2"],
      petIds: ["pet1"],
    },
    {
      id: "g2",
      firstName: "Dorothy",
      lastName: "Anderson",
      nickname: "Dotty",
      birthYear: 1948,
      deathYear: 2022,
      hasMemorial: true,
      memorialId: "mem-g2",
      generation: 0,
      spouseId: "g1",
      childIds: ["p1", "p2"],
    },

    // Generation 1 - Parents
    {
      id: "p1",
      firstName: "Michael",
      lastName: "Anderson",
      birthYear: 1970,
      hasMemorial: false,
      generation: 1,
      parentIds: ["g1", "g2"],
      spouseId: "p1s",
      childIds: ["c1", "c2"],
    },
    {
      id: "p1s",
      firstName: "Sarah",
      lastName: "Anderson",
      birthYear: 1972,
      hasMemorial: false,
      generation: 1,
      spouseId: "p1",
      childIds: ["c1", "c2"],
    },
    {
      id: "p2",
      firstName: "Elizabeth",
      lastName: "Martinez",
      nickname: "Beth",
      birthYear: 1973,
      hasMemorial: false,
      generation: 1,
      parentIds: ["g1", "g2"],
      spouseId: "p2s",
      childIds: ["c3"],
    },
    {
      id: "p2s",
      firstName: "Carlos",
      lastName: "Martinez",
      birthYear: 1971,
      hasMemorial: false,
      generation: 1,
      spouseId: "p2",
      childIds: ["c3"],
    },

    // Generation 2 - Grandchildren
    {
      id: "c1",
      firstName: "Emma",
      lastName: "Anderson",
      birthYear: 1998,
      hasMemorial: false,
      generation: 2,
      parentIds: ["p1", "p1s"],
    },
    {
      id: "c2",
      firstName: "Noah",
      lastName: "Anderson",
      birthYear: 2001,
      hasMemorial: false,
      generation: 2,
      parentIds: ["p1", "p1s"],
    },
    {
      id: "c3",
      firstName: "Sofia",
      lastName: "Martinez",
      birthYear: 2000,
      hasMemorial: false,
      generation: 2,
      parentIds: ["p2", "p2s"],
    },
  ];

  const pets: Pet[] = [
    {
      id: "pet1",
      name: "Max",
      species: "dog",
      birthYear: 2005,
      deathYear: 2018,
      hasMemorial: true,
      memorialId: "mem-pet1",
      ownerId: "g1",
    },
  ];

  return {
    members,
    pets,
    rootMemberIds: ["g1", "g2"],
  };
}
