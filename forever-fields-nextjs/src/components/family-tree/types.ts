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

// Demo data for development
export function generateDemoFamilyTree(): FamilyTreeData {
  const members: FamilyMember[] = [
    // Generation 0 - Great Grandparents
    {
      id: "gg1",
      firstName: "William",
      lastName: "Anderson",
      birthYear: 1920,
      deathYear: 1995,
      hasMemorial: true,
      memorialId: "mem-gg1",
      generation: 0,
      spouseId: "gg2",
      childIds: ["g1"],
    },
    {
      id: "gg2",
      firstName: "Margaret",
      lastName: "Anderson",
      nickname: "Maggie",
      birthYear: 1924,
      deathYear: 2001,
      hasMemorial: true,
      memorialId: "mem-gg2",
      generation: 0,
      spouseId: "gg1",
      childIds: ["g1"],
    },
    {
      id: "gg3",
      firstName: "Robert",
      lastName: "Thompson",
      birthYear: 1918,
      deathYear: 1988,
      hasMemorial: true,
      memorialId: "mem-gg3",
      generation: 0,
      spouseId: "gg4",
      childIds: ["g2"],
    },
    {
      id: "gg4",
      firstName: "Eleanor",
      lastName: "Thompson",
      birthYear: 1922,
      deathYear: 2010,
      hasMemorial: true,
      memorialId: "mem-gg4",
      generation: 0,
      spouseId: "gg3",
      childIds: ["g2"],
    },

    // Generation 1 - Grandparents
    {
      id: "g1",
      firstName: "James",
      lastName: "Anderson",
      birthYear: 1945,
      deathYear: 2020,
      hasMemorial: true,
      memorialId: "mem-g1",
      generation: 1,
      parentIds: ["gg1", "gg2"],
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
      generation: 1,
      parentIds: ["gg3", "gg4"],
      spouseId: "g1",
      childIds: ["p1", "p2"],
    },

    // Generation 2 - Parents
    {
      id: "p1",
      firstName: "Michael",
      lastName: "Anderson",
      birthYear: 1970,
      hasMemorial: false,
      generation: 2,
      parentIds: ["g1", "g2"],
      spouseId: "p1s",
      childIds: ["c1", "c2"],
      petIds: ["pet2", "pet3"],
    },
    {
      id: "p1s",
      firstName: "Sarah",
      lastName: "Anderson",
      birthYear: 1972,
      hasMemorial: false,
      generation: 2,
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
      generation: 2,
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
      generation: 2,
      spouseId: "p2",
      childIds: ["c3"],
    },

    // Generation 3 - Children
    {
      id: "c1",
      firstName: "Emma",
      lastName: "Anderson",
      birthYear: 1998,
      hasMemorial: false,
      generation: 3,
      parentIds: ["p1", "p1s"],
    },
    {
      id: "c2",
      firstName: "Noah",
      lastName: "Anderson",
      birthYear: 2001,
      hasMemorial: false,
      generation: 3,
      parentIds: ["p1", "p1s"],
    },
    {
      id: "c3",
      firstName: "Sofia",
      lastName: "Martinez",
      birthYear: 2000,
      hasMemorial: false,
      generation: 3,
      parentIds: ["p2", "p2s"],
      petIds: ["pet4"],
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
    {
      id: "pet2",
      name: "Whiskers",
      species: "cat",
      birthYear: 2015,
      deathYear: 2023,
      hasMemorial: true,
      memorialId: "mem-pet2",
      ownerId: "p1",
    },
    {
      id: "pet3",
      name: "Buddy",
      species: "dog",
      birthYear: 2018,
      hasMemorial: false,
      ownerId: "p1",
    },
    {
      id: "pet4",
      name: "Luna",
      species: "cat",
      birthYear: 2020,
      hasMemorial: false,
      ownerId: "c3",
    },
  ];

  return {
    members,
    pets,
    rootMemberIds: ["gg1", "gg2", "gg3", "gg4"],
  };
}
