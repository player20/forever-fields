/**
 * OpenStreetMap Cemetery Search
 *
 * Uses Nominatim (free, no API key required) to search for cemeteries.
 * Rate limit: 1 request per second (enforced by User-Agent requirement).
 */

export interface OSMCemetery {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  type?: string;
  importance?: number;
}

interface NominatimResult {
  osm_id: number;
  osm_type: string;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
  importance?: number;
  address?: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface SearchOptions {
  /** Latitude for location-based search */
  lat?: number;
  /** Longitude for location-based search */
  lon?: number;
  /** Search radius in kilometers */
  radius?: number;
  /** Maximum results to return */
  limit?: number;
  /** Country code to restrict search (e.g., "us", "gb") */
  countryCode?: string;
}

/**
 * Search for cemeteries using OpenStreetMap Nominatim
 */
export async function searchCemeteriesOSM(
  query: string,
  options: SearchOptions = {}
): Promise<OSMCemetery[]> {
  const { lat, lon, radius = 50, limit = 20, countryCode } = options;

  // Build search params
  const params = new URLSearchParams({
    q: query.toLowerCase().includes("cemetery") ? query : `${query} cemetery`,
    format: "json",
    limit: String(limit),
    addressdetails: "1",
  });

  // Add country filter if specified
  if (countryCode) {
    params.append("countrycodes", countryCode);
  }

  // Add bounding box if location provided
  if (lat !== undefined && lon !== undefined && radius > 0) {
    // Convert km to degrees (rough approximation: 1 degree ≈ 111 km)
    const radiusDeg = radius / 111;
    const viewbox = [
      lon - radiusDeg, // min_lon
      lat + radiusDeg, // max_lat
      lon + radiusDeg, // max_lon
      lat - radiusDeg, // min_lat
    ].join(",");

    params.append("viewbox", viewbox);
    params.append("bounded", "1");
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          // Nominatim requires a User-Agent
          "User-Agent": "ForeverFields/1.0 (https://foreverfields.com; support@foreverfields.com)",
          Accept: "application/json",
        },
        // Cache for 1 hour
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error(`OSM search failed: ${response.status} ${response.statusText}`);
    }

    const results: NominatimResult[] = await response.json();

    // Filter and transform results
    return results
      .filter((r) => isCemeteryResult(r))
      .map((r) => transformResult(r));
  } catch (error) {
    console.error("[OSM Cemetery Search] Error:", error);

    // In case of error, return empty array (graceful degradation)
    return [];
  }
}

/**
 * Check if a result is a cemetery
 */
function isCemeteryResult(result: NominatimResult): boolean {
  const displayName = result.display_name?.toLowerCase() || "";
  const type = result.type?.toLowerCase() || "";
  const classType = result.class?.toLowerCase() || "";

  return (
    type === "cemetery" ||
    type === "grave_yard" ||
    classType === "cemetery" ||
    displayName.includes("cemetery") ||
    displayName.includes("graveyard") ||
    displayName.includes("memorial park") ||
    displayName.includes("burial ground")
  );
}

/**
 * Transform Nominatim result to OSMCemetery format
 */
function transformResult(result: NominatimResult): OSMCemetery {
  // Extract name from display_name (first part before comma)
  const nameParts = result.display_name?.split(",") || [];
  const name = nameParts[0]?.trim() || "Unknown Cemetery";

  return {
    id: `osm-${result.osm_type}-${result.osm_id}`,
    name,
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    address: result.address?.road,
    city:
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      result.address?.county,
    state: result.address?.state,
    country: result.address?.country,
    type: result.type,
    importance: result.importance,
  };
}

/**
 * Search for cemeteries near a specific location
 */
export async function searchCemeteriesNearby(
  lat: number,
  lon: number,
  radiusKm: number = 25
): Promise<OSMCemetery[]> {
  // Reverse geocode to get area name
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      {
        headers: {
          "User-Agent": "ForeverFields/1.0 (https://foreverfields.com; support@foreverfields.com)",
        },
      }
    );

    if (!response.ok) {
      // Fallback to coordinate-based search
      return searchCemeteriesOSM("cemetery", { lat, lon, radius: radiusKm });
    }

    const locationData = await response.json();
    const area =
      locationData.address?.city ||
      locationData.address?.town ||
      locationData.address?.county ||
      "";

    // Search for cemeteries in the area
    return searchCemeteriesOSM(`${area} cemetery`, {
      lat,
      lon,
      radius: radiusKm,
    });
  } catch (error) {
    console.error("[OSM Nearby Search] Error:", error);
    return searchCemeteriesOSM("cemetery", { lat, lon, radius: radiusKm });
  }
}

/**
 * Get cemetery details by ID
 */
export async function getCemeteryDetails(
  osmId: string
): Promise<OSMCemetery | null> {
  // Parse OSM ID (format: osm-node-12345 or osm-way-12345)
  const parts = osmId.split("-");
  if (parts.length !== 3) return null;

  const [, osmType, id] = parts;

  const params = new URLSearchParams({
    osm_type: osmType[0].toUpperCase(), // N, W, or R
    osm_id: id,
    format: "json",
    addressdetails: "1",
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/lookup?osm_ids=${osmType[0].toUpperCase()}${id}&${params}`,
      {
        headers: {
          "User-Agent": "ForeverFields/1.0 (https://foreverfields.com; support@foreverfields.com)",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const results: NominatimResult[] = await response.json();
    if (results.length === 0) return null;

    return transformResult(results[0]);
  } catch (error) {
    console.error("[OSM Details] Error:", error);
    return null;
  }
}

/**
 * Deduplicate cemeteries by proximity (within 100m considered same)
 */
export function deduplicateCemeteries(
  cemeteries: OSMCemetery[],
  thresholdMeters: number = 100
): OSMCemetery[] {
  const deduplicated: OSMCemetery[] = [];

  for (const cemetery of cemeteries) {
    const isDuplicate = deduplicated.some((existing) => {
      const distance = calculateDistance(
        existing.lat,
        existing.lon,
        cemetery.lat,
        cemetery.lon
      );
      return distance < thresholdMeters;
    });

    if (!isDuplicate) {
      deduplicated.push(cemetery);
    }
  }

  return deduplicated;
}

/**
 * Calculate distance between two points in meters (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
