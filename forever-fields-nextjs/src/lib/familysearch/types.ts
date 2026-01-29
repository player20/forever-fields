/**
 * FamilySearch API Types
 *
 * TypeScript types for the FamilySearch API integration.
 * Based on the FamilySearch GEDCOM X API specification.
 */

// OAuth types
export interface FamilySearchTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
}

export interface FamilySearchUser {
  id: string;
  displayName: string;
  email?: string;
  personId?: string; // The user's own person ID in their tree
}

// Person types (GEDCOM X format)
export interface FamilySearchPerson {
  id: string;
  living?: boolean;
  gender?: {
    type: string; // "http://gedcomx.org/Male" | "http://gedcomx.org/Female" | "http://gedcomx.org/Unknown"
  };
  names?: FamilySearchName[];
  facts?: FamilySearchFact[];
  display?: {
    name?: string;
    gender?: string;
    lifespan?: string;
    birthDate?: string;
    birthPlace?: string;
    deathDate?: string;
    deathPlace?: string;
  };
  links?: Record<string, { href: string }>;
}

export interface FamilySearchName {
  type?: string;
  nameForms?: Array<{
    fullText?: string;
    parts?: Array<{
      type: string; // "http://gedcomx.org/Given" | "http://gedcomx.org/Surname"
      value: string;
    }>;
  }>;
  preferred?: boolean;
}

export interface FamilySearchFact {
  type: string; // "http://gedcomx.org/Birth" | "http://gedcomx.org/Death" | etc.
  date?: {
    original?: string;
    formal?: string; // ISO format
  };
  place?: {
    original?: string;
    description?: string;
  };
  value?: string;
}

// Relationship types
export interface FamilySearchRelationship {
  id: string;
  type: string; // "http://gedcomx.org/Couple" | "http://gedcomx.org/ParentChild"
  person1: { resource: string; resourceId: string };
  person2: { resource: string; resourceId: string };
  facts?: FamilySearchFact[];
}

// Ancestry response
export interface FamilySearchAncestryResponse {
  persons?: FamilySearchPerson[];
  relationships?: FamilySearchRelationship[];
  childAndParentsRelationships?: Array<{
    id: string;
    parent1?: { resource: string; resourceId: string };
    parent2?: { resource: string; resourceId: string };
    child: { resource: string; resourceId: string };
  }>;
}

// Descendancy response
export interface FamilySearchDescendancyResponse {
  persons?: FamilySearchPerson[];
  relationships?: FamilySearchRelationship[];
}

// Person with relationships response
export interface FamilySearchPersonWithRelationshipsResponse {
  persons?: FamilySearchPerson[];
  relationships?: FamilySearchRelationship[];
  childAndParentsRelationships?: Array<{
    id: string;
    parent1?: { resource: string; resourceId: string };
    parent2?: { resource: string; resourceId: string };
    child: { resource: string; resourceId: string };
  }>;
}

// Search types
export interface FamilySearchSearchQuery {
  givenName?: string;
  surname?: string;
  birthLikeDate?: string;
  birthLikePlace?: string;
  deathLikeDate?: string;
  deathLikePlace?: string;
  gender?: "male" | "female";
  count?: number;
}

export interface FamilySearchSearchResult {
  id: string;
  score?: number;
  title?: string;
  content?: {
    gedcomx: {
      persons?: FamilySearchPerson[];
    };
  };
}

// Memory types (photos, stories, etc.)
export interface FamilySearchMemory {
  id: string;
  mediaType?: string;
  about?: string;
  titles?: Array<{ value: string }>;
  descriptions?: Array<{ value: string }>;
  links?: {
    image?: { href: string };
    thumbnail?: { href: string };
  };
}

// Simplified types for our application
export interface SimplifiedPerson {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: "male" | "female" | "unknown";
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  isLiving: boolean;
  displayName: string;
  lifespan?: string;
}

export interface SimplifiedRelationship {
  id: string;
  type: "parent" | "child" | "spouse" | "sibling";
  personId: string;
  relatedPersonId: string;
}

export interface FamilyTreeData {
  rootPerson: SimplifiedPerson;
  ancestors: SimplifiedPerson[];
  descendants: SimplifiedPerson[];
  spouses: SimplifiedPerson[];
  relationships: SimplifiedRelationship[];
  generationsUp: number;
  generationsDown: number;
}

// Connection status
export interface FamilySearchConnection {
  id: string;
  userId: string;
  connected: boolean;
  displayName?: string;
  personId?: string;
  lastSyncAt?: Date;
  expiresAt?: Date;
}

// Import options
export interface FamilySearchImportOptions {
  includeAncestors: boolean;
  ancestorGenerations: number; // 1-8
  includeDescendants: boolean;
  descendantGenerations: number; // 1-4
  includeSpouses: boolean;
  excludeLiving: boolean;
}

// API error types
export interface FamilySearchError {
  code: string;
  message: string;
  details?: string;
}

// Helper functions
export function extractName(person: FamilySearchPerson): {
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName: string;
} {
  const preferredName = person.names?.find((n) => n.preferred) || person.names?.[0];
  const parts = preferredName?.nameForms?.[0]?.parts || [];

  let firstName = "";
  let middleName: string | undefined;
  let lastName = "";

  for (const part of parts) {
    if (part.type?.includes("Given")) {
      const givenParts = part.value.split(" ");
      firstName = givenParts[0] || "";
      if (givenParts.length > 1) {
        middleName = givenParts.slice(1).join(" ");
      }
    } else if (part.type?.includes("Surname")) {
      lastName = part.value;
    }
  }

  const displayName =
    person.display?.name ||
    preferredName?.nameForms?.[0]?.fullText ||
    `${firstName} ${lastName}`.trim();

  return { firstName, middleName, lastName, displayName };
}

export function extractGender(
  person: FamilySearchPerson
): "male" | "female" | "unknown" {
  const genderType = person.gender?.type || "";
  if (genderType.includes("Male")) return "male";
  if (genderType.includes("Female")) return "female";
  return "unknown";
}

export function extractDate(
  person: FamilySearchPerson,
  factType: "Birth" | "Death"
): string | undefined {
  const fact = person.facts?.find((f) => f.type?.includes(factType));
  return fact?.date?.formal || fact?.date?.original || person.display?.[`${factType.toLowerCase()}Date` as "birthDate" | "deathDate"];
}

export function extractPlace(
  person: FamilySearchPerson,
  factType: "Birth" | "Death"
): string | undefined {
  const fact = person.facts?.find((f) => f.type?.includes(factType));
  return (
    fact?.place?.description ||
    fact?.place?.original ||
    person.display?.[`${factType.toLowerCase()}Place` as "birthPlace" | "deathPlace"]
  );
}

export function simplifyPerson(person: FamilySearchPerson): SimplifiedPerson {
  const { firstName, middleName, lastName, displayName } = extractName(person);

  return {
    id: person.id,
    firstName,
    middleName,
    lastName,
    displayName,
    gender: extractGender(person),
    birthDate: extractDate(person, "Birth"),
    birthPlace: extractPlace(person, "Birth"),
    deathDate: extractDate(person, "Death"),
    deathPlace: extractPlace(person, "Death"),
    isLiving: person.living ?? false,
    lifespan: person.display?.lifespan,
  };
}
