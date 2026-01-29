/**
 * FamilySearch API Client
 *
 * Client for interacting with the FamilySearch API to fetch
 * family tree data, ancestors, descendants, and memories.
 */

import {
  FamilySearchPerson,
  FamilySearchAncestryResponse,
  FamilySearchDescendancyResponse,
  FamilySearchPersonWithRelationshipsResponse,
  FamilySearchMemory,
  SimplifiedPerson,
  FamilyTreeData,
  FamilySearchImportOptions,
  simplifyPerson,
} from "./types";
import { getApiBaseUrl, isDemoMode, refreshAccessToken } from "./auth";

// Demo data for testing
const DEMO_ANCESTORS: SimplifiedPerson[] = [
  {
    id: "demo-person-1",
    firstName: "John",
    middleName: "William",
    lastName: "Smith",
    displayName: "John William Smith",
    gender: "male",
    birthDate: "1920-05-15",
    birthPlace: "Boston, Massachusetts",
    deathDate: "1990-08-22",
    deathPlace: "Boston, Massachusetts",
    isLiving: false,
    lifespan: "1920-1990",
  },
  {
    id: "demo-person-2",
    firstName: "Mary",
    middleName: "Elizabeth",
    lastName: "Johnson",
    displayName: "Mary Elizabeth Johnson",
    gender: "female",
    birthDate: "1925-03-10",
    birthPlace: "New York, New York",
    deathDate: "2005-12-01",
    deathPlace: "Boston, Massachusetts",
    isLiving: false,
    lifespan: "1925-2005",
  },
  {
    id: "demo-person-3",
    firstName: "Robert",
    lastName: "Smith",
    displayName: "Robert Smith",
    gender: "male",
    birthDate: "1895-11-20",
    birthPlace: "Chicago, Illinois",
    deathDate: "1965-04-10",
    deathPlace: "Boston, Massachusetts",
    isLiving: false,
    lifespan: "1895-1965",
  },
  {
    id: "demo-person-4",
    firstName: "Helen",
    lastName: "Brown",
    displayName: "Helen Brown",
    gender: "female",
    birthDate: "1898-07-04",
    birthPlace: "Philadelphia, Pennsylvania",
    deathDate: "1975-09-15",
    deathPlace: "Boston, Massachusetts",
    isLiving: false,
    lifespan: "1898-1975",
  },
];

export class FamilySearchClient {
  private accessToken: string;
  private refreshToken?: string;
  private onTokenRefresh?: (tokens: {
    accessToken: string;
    refreshToken?: string;
  }) => void;

  constructor(
    accessToken: string,
    refreshToken?: string,
    onTokenRefresh?: (tokens: {
      accessToken: string;
      refreshToken?: string;
    }) => void
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.onTokenRefresh = onTokenRefresh;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (isDemoMode()) {
      // Return demo data based on endpoint
      return this.getDemoData(endpoint) as T;
    }

    const url = `${getApiBaseUrl()}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
        ...options.headers,
      },
    });

    // Handle token refresh
    if (response.status === 401 && this.refreshToken) {
      try {
        const newTokens = await refreshAccessToken(this.refreshToken);
        this.accessToken = newTokens.access_token;
        if (newTokens.refresh_token) {
          this.refreshToken = newTokens.refresh_token;
        }
        this.onTokenRefresh?.({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
        });

        // Retry the request
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: "application/json",
            ...options.headers,
          },
        });

        if (!retryResponse.ok) {
          throw new Error(`API request failed: ${retryResponse.statusText}`);
        }

        return retryResponse.json();
      } catch {
        throw new Error("Token refresh failed. Please reconnect.");
      }
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${error}`);
    }

    return response.json();
  }

  private getDemoData(endpoint: string): unknown {
    // Return appropriate demo data based on endpoint
    if (endpoint.includes("/ancestry")) {
      return { persons: DEMO_ANCESTORS };
    }
    if (endpoint.includes("/descendancy")) {
      return { persons: [] };
    }
    if (endpoint.includes("/persons/")) {
      return {
        persons: [DEMO_ANCESTORS[0]],
        relationships: [],
        childAndParentsRelationships: [],
      };
    }
    return {};
  }

  /**
   * Get a person by ID
   */
  async getPerson(personId: string): Promise<SimplifiedPerson | null> {
    try {
      const response =
        await this.fetch<FamilySearchPersonWithRelationshipsResponse>(
          `/platform/tree/persons/${personId}`
        );

      const person = response.persons?.[0];
      if (!person) return null;

      // Don't import living persons
      if (person.living) {
        return null;
      }

      return simplifyPerson(person);
    } catch (error) {
      console.error("Failed to get person:", error);
      return null;
    }
  }

  /**
   * Get ancestors for a person (up to 8 generations)
   */
  async getAncestry(
    personId: string,
    generations: number = 4
  ): Promise<SimplifiedPerson[]> {
    // FamilySearch API limits ancestry to 8 generations
    const limitedGenerations = Math.min(Math.max(generations, 1), 8);

    try {
      const response = await this.fetch<FamilySearchAncestryResponse>(
        `/platform/tree/ancestry?person=${personId}&generations=${limitedGenerations}`
      );

      const ancestors: SimplifiedPerson[] = [];

      for (const person of response.persons || []) {
        // Skip living persons
        if (person.living) continue;
        // Skip the root person (they're not an ancestor of themselves)
        if (person.id === personId) continue;

        ancestors.push(simplifyPerson(person));
      }

      return ancestors;
    } catch (error) {
      console.error("Failed to get ancestry:", error);
      return [];
    }
  }

  /**
   * Get descendants for a person (up to 4 generations)
   */
  async getDescendancy(
    personId: string,
    generations: number = 2
  ): Promise<SimplifiedPerson[]> {
    // FamilySearch API limits descendancy
    const limitedGenerations = Math.min(Math.max(generations, 1), 4);

    try {
      const response = await this.fetch<FamilySearchDescendancyResponse>(
        `/platform/tree/descendancy?person=${personId}&generations=${limitedGenerations}`
      );

      const descendants: SimplifiedPerson[] = [];

      for (const person of response.persons || []) {
        // Skip living persons
        if (person.living) continue;
        // Skip the root person
        if (person.id === personId) continue;

        descendants.push(simplifyPerson(person));
      }

      return descendants;
    } catch (error) {
      console.error("Failed to get descendancy:", error);
      return [];
    }
  }

  /**
   * Get spouses for a person
   */
  async getSpouses(personId: string): Promise<SimplifiedPerson[]> {
    try {
      const response =
        await this.fetch<FamilySearchPersonWithRelationshipsResponse>(
          `/platform/tree/persons/${personId}?relatives`
        );

      const spouses: SimplifiedPerson[] = [];

      // Find couple relationships
      const coupleRelationships =
        response.relationships?.filter((r) =>
          r.type?.includes("Couple")
        ) || [];

      for (const rel of coupleRelationships) {
        // Find the spouse ID (the one that isn't the current person)
        const spouseRef =
          rel.person1.resourceId === personId ? rel.person2 : rel.person1;
        const spouseId = spouseRef.resourceId;

        // Find the spouse in the persons array
        const spouse = response.persons?.find((p) => p.id === spouseId);
        if (spouse && !spouse.living) {
          spouses.push(simplifyPerson(spouse));
        }
      }

      return spouses;
    } catch (error) {
      console.error("Failed to get spouses:", error);
      return [];
    }
  }

  /**
   * Get memories (photos, stories) for a person
   */
  async getMemories(personId: string): Promise<FamilySearchMemory[]> {
    try {
      const response = await this.fetch<{ sourceDescriptions?: FamilySearchMemory[] }>(
        `/platform/tree/persons/${personId}/memories`
      );

      return response.sourceDescriptions || [];
    } catch (error) {
      console.error("Failed to get memories:", error);
      return [];
    }
  }

  /**
   * Fetch complete family tree data based on import options
   */
  async getFamilyTree(
    personId: string,
    options: FamilySearchImportOptions
  ): Promise<FamilyTreeData | null> {
    try {
      // Get the root person first
      const rootPerson = await this.getPerson(personId);
      if (!rootPerson) {
        throw new Error("Could not find person or person is living");
      }

      // Fetch data in parallel where possible
      const [ancestors, descendants, spouses] = await Promise.all([
        options.includeAncestors
          ? this.getAncestry(personId, options.ancestorGenerations)
          : Promise.resolve([]),
        options.includeDescendants
          ? this.getDescendancy(personId, options.descendantGenerations)
          : Promise.resolve([]),
        options.includeSpouses
          ? this.getSpouses(personId)
          : Promise.resolve([]),
      ]);

      // Filter out living persons if requested
      const filteredAncestors = options.excludeLiving
        ? ancestors.filter((p) => !p.isLiving)
        : ancestors;
      const filteredDescendants = options.excludeLiving
        ? descendants.filter((p) => !p.isLiving)
        : descendants;
      const filteredSpouses = options.excludeLiving
        ? spouses.filter((p) => !p.isLiving)
        : spouses;

      return {
        rootPerson,
        ancestors: filteredAncestors,
        descendants: filteredDescendants,
        spouses: filteredSpouses,
        relationships: [], // Would need additional processing
        generationsUp: options.ancestorGenerations,
        generationsDown: options.descendantGenerations,
      };
    } catch (error) {
      console.error("Failed to get family tree:", error);
      return null;
    }
  }

  /**
   * Search for persons in FamilySearch
   */
  async searchPersons(query: {
    givenName?: string;
    surname?: string;
    birthLikeDate?: string;
    deathLikeDate?: string;
    birthLikePlace?: string;
    count?: number;
  }): Promise<SimplifiedPerson[]> {
    const params = new URLSearchParams();
    if (query.givenName) params.append("q.givenName", query.givenName);
    if (query.surname) params.append("q.surname", query.surname);
    if (query.birthLikeDate)
      params.append("q.birthLikeDate", query.birthLikeDate);
    if (query.deathLikeDate)
      params.append("q.deathLikeDate", query.deathLikeDate);
    if (query.birthLikePlace)
      params.append("q.birthLikePlace", query.birthLikePlace);
    params.append("count", String(query.count || 10));

    try {
      const response = await this.fetch<{
        entries?: Array<{
          content?: {
            gedcomx?: {
              persons?: FamilySearchPerson[];
            };
          };
        }>;
      }>(`/platform/tree/search?${params.toString()}`);

      const results: SimplifiedPerson[] = [];

      for (const entry of response.entries || []) {
        const persons = entry.content?.gedcomx?.persons || [];
        for (const person of persons) {
          if (!person.living) {
            results.push(simplifyPerson(person));
          }
        }
      }

      return results;
    } catch (error) {
      console.error("Failed to search persons:", error);
      return [];
    }
  }
}

/**
 * Create a FamilySearch client instance
 */
export function createFamilySearchClient(
  accessToken: string,
  refreshToken?: string,
  onTokenRefresh?: (tokens: {
    accessToken: string;
    refreshToken?: string;
  }) => void
): FamilySearchClient {
  return new FamilySearchClient(accessToken, refreshToken, onTokenRefresh);
}
