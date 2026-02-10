// Cemetery search integration
// Provides unified search across local database and external APIs

export interface CemeterySearchResult {
  id: string;
  name: string;
  address?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  source: "local" | "findagrave" | "billiongraves" | "openstreetmap";
  externalId?: string;
  plotCount?: number;
  isPartner?: boolean;
}

export interface CemeterySearchOptions {
  query?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  radius?: number; // km
  limit?: number;
}

// External API clients (placeholder implementations)
const FIND_A_GRAVE_API = process.env.FIND_A_GRAVE_API_KEY;
const BILLION_GRAVES_API = process.env.BILLION_GRAVES_API_KEY;

// Search FindAGrave API
async function searchFindAGrave(
  options: CemeterySearchOptions
): Promise<CemeterySearchResult[]> {
  if (!FIND_A_GRAVE_API) {
    return [];
  }

  try {
    // FindAGrave doesn't have an official API, so this would use
    // their partner API or web scraping with permission
    // Placeholder implementation
    const params = new URLSearchParams();
    if (options.query) params.set("name", options.query);
    if (options.city) params.set("city", options.city);
    if (options.state) params.set("state", options.state);

    // Would call actual API here
    console.log("Would search FindAGrave with:", params.toString());

    return [];
  } catch (error) {
    console.error("FindAGrave search error:", error);
    return [];
  }
}

// Search BillionGraves API
async function searchBillionGraves(
  _options: CemeterySearchOptions
): Promise<CemeterySearchResult[]> {
  if (!BILLION_GRAVES_API) {
    return [];
  }

  try {
    // BillionGraves has a partner API
    // Placeholder implementation
    console.log("Would search BillionGraves");

    return [];
  } catch (error) {
    console.error("BillionGraves search error:", error);
    return [];
  }
}

// Search OpenStreetMap for cemeteries
async function searchOpenStreetMap(
  options: CemeterySearchOptions
): Promise<CemeterySearchResult[]> {
  try {
    const { query, lat, lng, radius = 50 } = options;

    // Use Nominatim API for cemetery search
    let url = "https://nominatim.openstreetmap.org/search?";
    const params = new URLSearchParams({
      format: "json",
      limit: String(options.limit || 20),
      addressdetails: "1",
    });

    if (query) {
      params.set("q", `cemetery ${query}`);
    } else if (lat && lng) {
      // Use Overpass API for nearby search
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["landuse"="cemetery"](around:${radius * 1000},${lat},${lng});
          way["landuse"="cemetery"](around:${radius * 1000},${lat},${lng});
          relation["landuse"="cemetery"](around:${radius * 1000},${lat},${lng});
        );
        out center;
      `;

      const overpassUrl = "https://overpass-api.de/api/interpreter";
      const response = await fetch(overpassUrl, {
        method: "POST",
        body: overpassQuery,
        headers: {
          "Content-Type": "text/plain",
        },
      });

      if (!response.ok) {
        throw new Error("Overpass API error");
      }

      const data = await response.json();
      return (data.elements || []).map((elem: {
        id: number;
        tags?: { name?: string };
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
      }) => ({
        id: `osm-${elem.id}`,
        name: elem.tags?.name || "Unnamed Cemetery",
        city: "", // Would need reverse geocoding
        country: "",
        lat: elem.lat || elem.center?.lat,
        lng: elem.lon || elem.center?.lon,
        source: "openstreetmap" as const,
        externalId: String(elem.id),
      }));
    } else if (options.city || options.state) {
      params.set(
        "q",
        `cemetery ${options.city || ""} ${options.state || ""}`.trim()
      );
    }

    url += params.toString();

    const response = await fetch(url, {
      headers: {
        "User-Agent": "ForeverFields/1.0 (memorial platform)",
      },
    });

    if (!response.ok) {
      throw new Error("Nominatim API error");
    }

    const data = await response.json();

    return data.map((result: {
      place_id: number;
      display_name: string;
      address: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
        postcode?: string;
      };
      lat: string;
      lon: string;
    }) => ({
      id: `osm-${result.place_id}`,
      name: result.display_name.split(",")[0],
      address: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village || "",
      state: result.address?.state || "",
      country: result.address?.country || "",
      postalCode: result.address?.postcode,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      source: "openstreetmap" as const,
      externalId: String(result.place_id),
    }));
  } catch (error) {
    console.error("OpenStreetMap search error:", error);
    return [];
  }
}

// Merge and deduplicate results
function mergeResults(
  ...resultSets: CemeterySearchResult[][]
): CemeterySearchResult[] {
  const merged = new Map<string, CemeterySearchResult>();

  for (const results of resultSets) {
    for (const result of results) {
      // Use name + city as key for deduplication
      const key = `${result.name.toLowerCase()}-${result.city.toLowerCase()}`;

      if (!merged.has(key)) {
        merged.set(key, result);
      } else {
        // Merge data from multiple sources
        const existing = merged.get(key)!;

        // Prefer local data, then partner APIs, then OSM
        if (
          result.source === "local" ||
          (existing.source === "openstreetmap" && result.source !== "openstreetmap")
        ) {
          merged.set(key, {
            ...existing,
            ...result,
            // Keep partner status
            isPartner: existing.isPartner || result.isPartner,
          });
        }
      }
    }
  }

  return Array.from(merged.values());
}

// Main search function
export async function searchCemeteries(
  options: CemeterySearchOptions
): Promise<CemeterySearchResult[]> {
  const limit = options.limit || 20;

  // Search all sources in parallel
  const [findAGraveResults, billionGravesResults, osmResults] =
    await Promise.all([
      searchFindAGrave(options),
      searchBillionGraves(options),
      searchOpenStreetMap(options),
    ]);

  // Merge and deduplicate
  const results = mergeResults(
    findAGraveResults,
    billionGravesResults,
    osmResults
  );

  // Sort by relevance (partners first, then by name)
  results.sort((a, b) => {
    if (a.isPartner && !b.isPartner) return -1;
    if (!a.isPartner && b.isPartner) return 1;
    return a.name.localeCompare(b.name);
  });

  return results.slice(0, limit);
}

// Get cemetery details by ID
export async function getCemeteryById(
  id: string
): Promise<CemeterySearchResult | null> {
  // Parse source from ID
  const [source] = id.split("-");

  switch (source) {
    case "osm": {
      // Fetch from OSM
      const osmId = id.replace("osm-", "");
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/lookup?osm_ids=N${osmId},W${osmId},R${osmId}&format=json&addressdetails=1`,
          {
            headers: {
              "User-Agent": "ForeverFields/1.0",
            },
          }
        );

        if (!response.ok) return null;

        const data = await response.json();
        if (data.length === 0) return null;

        const result = data[0];
        return {
          id,
          name: result.display_name.split(",")[0],
          address: result.display_name,
          city: result.address?.city || result.address?.town || "",
          state: result.address?.state || "",
          country: result.address?.country || "",
          postalCode: result.address?.postcode,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          source: "openstreetmap",
          externalId: osmId,
        };
      } catch {
        return null;
      }
    }

    default:
      // Local or partner API lookup would go here
      return null;
  }
}

// Calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
