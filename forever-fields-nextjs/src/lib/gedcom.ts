// GEDCOM Parser for Family Tree Import
// GEDCOM is the standard file format for genealogy data

export interface ParsedPerson {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  gender?: "male" | "female";
  birthDate?: string;
  birthYear?: string;
  birthPlace?: string;
  deathDate?: string;
  deathYear?: string;
  deathPlace?: string;
  parents?: string[];
  spouses?: string[];
  children?: string[];
  isDeceased?: boolean;
}

export interface ParsedFamily {
  id: string;
  husband?: string;
  wife?: string;
  children: string[];
}

export interface GedcomParseResult {
  people: ParsedPerson[];
  families: ParsedFamily[];
  errors: string[];
}

// Simple GEDCOM parser - handles most common genealogy exports
export function parseGedcom(content: string): GedcomParseResult {
  const lines = content.split(/\r?\n/);
  const people: Map<string, ParsedPerson> = new Map();
  const families: Map<string, ParsedFamily> = new Map();
  const errors: string[] = [];

  let currentRecord: { type: string; id: string } | null = null;
  let currentSubtag: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(/^(\d+)\s+(@\w+@|\w+)(?:\s+(.*))?$/);
    if (!match) continue;

    const level = parseInt(match[1]);
    const tag = match[2];
    const value = match[3] || "";

    // Level 0 records define individuals and families
    if (level === 0) {
      currentSubtag = null;

      if (tag.startsWith("@") && tag.endsWith("@")) {
        const id = tag;
        const recordType = value.toUpperCase();

        if (recordType === "INDI") {
          currentRecord = { type: "INDI", id };
          people.set(id, {
            id,
            name: "",
            parents: [],
            spouses: [],
            children: [],
          });
        } else if (recordType === "FAM") {
          currentRecord = { type: "FAM", id };
          families.set(id, {
            id,
            children: [],
          });
        } else {
          currentRecord = null;
        }
      } else {
        currentRecord = null;
      }
      continue;
    }

    if (!currentRecord) continue;

    // Handle individual records
    if (currentRecord.type === "INDI") {
      const person = people.get(currentRecord.id);
      if (!person) continue;

      if (level === 1) {
        currentSubtag = tag;

        switch (tag) {
          case "NAME":
            // Parse name: "First /Last/"
            const nameMatch = value.match(/^(.+?)\s*\/(.+?)\/\s*$/);
            if (nameMatch) {
              person.firstName = nameMatch[1].trim();
              person.lastName = nameMatch[2].trim();
              person.name = `${person.firstName} ${person.lastName}`;
            } else {
              person.name = value.replace(/\//g, "").trim();
            }
            break;
          case "SEX":
            person.gender = value.toUpperCase() === "F" ? "female" : "male";
            break;
          case "FAMC":
            // Family where this person is a child
            if (value.startsWith("@") && value.endsWith("@")) {
              person.parents = person.parents || [];
              // We'll resolve parents later
            }
            break;
          case "FAMS":
            // Family where this person is a spouse
            if (value.startsWith("@") && value.endsWith("@")) {
              person.spouses = person.spouses || [];
            }
            break;
        }
      } else if (level === 2 && currentSubtag) {
        switch (currentSubtag) {
          case "BIRT":
            if (tag === "DATE") {
              person.birthDate = value;
              const yearMatch = value.match(/\d{4}/);
              if (yearMatch) person.birthYear = yearMatch[0];
            } else if (tag === "PLAC") {
              person.birthPlace = value;
            }
            break;
          case "DEAT":
            person.isDeceased = true;
            if (tag === "DATE") {
              person.deathDate = value;
              const yearMatch = value.match(/\d{4}/);
              if (yearMatch) person.deathYear = yearMatch[0];
            } else if (tag === "PLAC") {
              person.deathPlace = value;
            }
            break;
        }
      }
    }

    // Handle family records
    if (currentRecord.type === "FAM") {
      const family = families.get(currentRecord.id);
      if (!family) continue;

      if (level === 1) {
        switch (tag) {
          case "HUSB":
            if (value.startsWith("@") && value.endsWith("@")) {
              family.husband = value;
            }
            break;
          case "WIFE":
            if (value.startsWith("@") && value.endsWith("@")) {
              family.wife = value;
            }
            break;
          case "CHIL":
            if (value.startsWith("@") && value.endsWith("@")) {
              family.children.push(value);
            }
            break;
        }
      }
    }
  }

  // Resolve family relationships
  families.forEach((family) => {
    // Set spouse relationships
    if (family.husband && family.wife) {
      const husband = people.get(family.husband);
      const wife = people.get(family.wife);
      if (husband && wife) {
        husband.spouses = husband.spouses || [];
        wife.spouses = wife.spouses || [];
        if (!husband.spouses.includes(family.wife)) {
          husband.spouses.push(family.wife);
        }
        if (!wife.spouses.includes(family.husband)) {
          wife.spouses.push(family.husband);
        }
      }
    }

    // Set parent/child relationships
    family.children.forEach((childId) => {
      const child = people.get(childId);
      if (child) {
        child.parents = child.parents || [];
        if (family.husband && !child.parents.includes(family.husband)) {
          child.parents.push(family.husband);
        }
        if (family.wife && !child.parents.includes(family.wife)) {
          child.parents.push(family.wife);
        }
      }

      // Add children to parents
      if (family.husband) {
        const parent = people.get(family.husband);
        if (parent) {
          parent.children = parent.children || [];
          if (!parent.children.includes(childId)) {
            parent.children.push(childId);
          }
        }
      }
      if (family.wife) {
        const parent = people.get(family.wife);
        if (parent) {
          parent.children = parent.children || [];
          if (!parent.children.includes(childId)) {
            parent.children.push(childId);
          }
        }
      }
    });
  });

  return {
    people: Array.from(people.values()),
    families: Array.from(families.values()),
    errors,
  };
}

// Convert parsed GEDCOM to our family tree format
export function convertToFamilyTreeFormat(result: GedcomParseResult): {
  nodes: Array<{
    id: string;
    gender: "male" | "female";
    parents?: { id: string; type: "blood" }[];
    spouses?: { id: string; type: "married" }[];
    children?: { id: string; type: "blood" }[];
  }>;
  people: Record<string, {
    id: string;
    name: string;
    birthYear?: string;
    deathYear?: string;
    isDeceased?: boolean;
    relationship?: string;
  }>;
} {
  const nodes: Array<{
    id: string;
    gender: "male" | "female";
    parents?: { id: string; type: "blood" }[];
    spouses?: { id: string; type: "married" }[];
    children?: { id: string; type: "blood" }[];
  }> = [];

  const people: Record<string, {
    id: string;
    name: string;
    birthYear?: string;
    deathYear?: string;
    isDeceased?: boolean;
    relationship?: string;
  }> = {};

  result.people.forEach((person) => {
    // Create node for react-family-tree
    nodes.push({
      id: person.id,
      gender: person.gender || "male",
      parents: person.parents?.map(id => ({ id, type: "blood" as const })),
      spouses: person.spouses?.map(id => ({ id, type: "married" as const })),
      children: person.children?.map(id => ({ id, type: "blood" as const })),
    });

    // Create person data
    people[person.id] = {
      id: person.id,
      name: person.name || "Unknown",
      birthYear: person.birthYear,
      deathYear: person.deathYear,
      isDeceased: person.isDeceased,
    };
  });

  return { nodes, people };
}
