import { NextRequest, NextResponse } from "next/server";
import {
  searchCemeteriesOSM,
  searchCemeteriesNearby,
  deduplicateCemeteries,
  type OSMCemetery,
} from "@/lib/cemetery/osm";

// Cemetery database search API
// Primary source: OpenStreetMap (free, no API key required)
// Secondary: BillionGraves, Find A Grave (with API keys)

interface CemeteryResult {
  id: string;
  source: "osm" | "findagrave" | "billiongraves" | "google";
  sourceUrl?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  deathDate?: string;
  cemeteryName: string;
  cemeteryCity?: string;
  cemeteryState?: string;
  cemeteryCountry?: string;
  section?: string;
  lot?: string;
  plot?: string;
  gpsLat?: number;
  gpsLng?: number;
  headstonePhotoUrl?: string;
  epitaph?: string;
  familyLinks?: Array<{ name: string; relationship: string; recordId?: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, lat, lon, radius = 50, source = "all" } = body;

    if (!query && lat === undefined) {
      return NextResponse.json(
        { error: "Search query or location is required" },
        { status: 400 }
      );
    }

    const results: CemeteryResult[] = [];

    // 1. Search OpenStreetMap (always available, no API key needed)
    if (source === "all" || source === "osm") {
      try {
        let osmResults: OSMCemetery[];

        if (lat !== undefined && lon !== undefined && !query) {
          // Location-based search
          osmResults = await searchCemeteriesNearby(lat, lon, radius);
        } else {
          // Query-based search (with optional location)
          osmResults = await searchCemeteriesOSM(query, { lat, lon, radius });
        }

        // Transform OSM results to CemeteryResult format
        const transformedOsm = osmResults.map((c) => ({
          id: c.id,
          source: "osm" as const,
          cemeteryName: c.name,
          cemeteryCity: c.city,
          cemeteryState: c.state,
          cemeteryCountry: c.country,
          gpsLat: c.lat,
          gpsLng: c.lon,
        }));

        results.push(...transformedOsm);
      } catch (err) {
        console.error("OpenStreetMap search error:", err);
      }
    }

    // 2. Search BillionGraves (if API key available)
    const hasBillionGravesKey = !!process.env.BILLIONGRAVES_API_KEY;
    if ((source === "all" || source === "billiongraves") && hasBillionGravesKey && query) {
      try {
        const bgResults = await searchBillionGraves(query, process.env.BILLIONGRAVES_API_KEY!);
        results.push(...bgResults);
      } catch (err) {
        console.error("BillionGraves search error:", err);
      }
    }

    // 3. Search Google Places (if API key available)
    const hasGoogleKey = !!process.env.GOOGLE_PLACES_API_KEY;
    if ((source === "all" || source === "google") && hasGoogleKey && query) {
      try {
        const googleResults = await searchCemeteriesGoogle(query, { lat, lon, radius });
        results.push(...googleResults);
      } catch (err) {
        console.error("Google Places search error:", err);
      }
    }

    // Deduplicate results by proximity (within 100m = same cemetery)
    const deduped = deduplicateResults(results);

    return NextResponse.json({
      success: true,
      query,
      location: lat !== undefined ? { lat, lon, radius } : null,
      results: deduped,
      total: deduped.length,
      sources: {
        osm: source === "all" || source === "osm",
        billiongraves: (source === "all" || source === "billiongraves") && hasBillionGravesKey,
        google: (source === "all" || source === "google") && hasGoogleKey,
      },
    });
  } catch (error) {
    console.error("Cemetery search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

// Deduplicate cemetery results by proximity
function deduplicateResults(results: CemeteryResult[]): CemeteryResult[] {
  // Convert to OSMCemetery format for deduplication
  const osmFormat = results
    .filter((r) => r.gpsLat !== undefined && r.gpsLng !== undefined)
    .map((r) => ({
      id: r.id,
      name: r.cemeteryName,
      lat: r.gpsLat!,
      lon: r.gpsLng!,
      city: r.cemeteryCity,
      state: r.cemeteryState,
      country: r.cemeteryCountry,
    }));

  const dedupedOsm = deduplicateCemeteries(osmFormat);
  const dedupedIds = new Set(dedupedOsm.map((c) => c.id));

  // Keep results that passed deduplication, plus those without GPS
  return results.filter(
    (r) =>
      dedupedIds.has(r.id) ||
      r.gpsLat === undefined ||
      r.gpsLng === undefined
  );
}

// BillionGraves search implementation
async function searchBillionGraves(
  query: string,
  apiKey: string
): Promise<CemeteryResult[]> {
  try {
    const response = await fetch(
      `https://billiongraves.com/api/search?name=${encodeURIComponent(query)}&api_key=${apiKey}`,
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`BillionGraves API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.records || []).map((record: Record<string, unknown>) => ({
      id: `bg-${record.id}`,
      source: "billiongraves" as const,
      sourceUrl: `https://billiongraves.com/grave/${record.id}`,
      firstName: record.given_names as string,
      lastName: record.family_name as string,
      birthDate: record.birth_date as string,
      deathDate: record.death_date as string,
      cemeteryName: record.cemetery_name as string,
      cemeteryCity: record.cemetery_city as string,
      cemeteryState: record.cemetery_state as string,
      cemeteryCountry: record.cemetery_country as string,
      gpsLat: record.latitude as number,
      gpsLng: record.longitude as number,
      headstonePhotoUrl: record.headstone_image_url as string,
    }));
  } catch (err) {
    console.error("BillionGraves API error:", err);
    return [];
  }
}

// Google Places search for cemeteries
async function searchCemeteriesGoogle(
  query: string,
  options?: { lat?: number; lon?: number; radius?: number }
): Promise<CemeteryResult[]> {
  const params = new URLSearchParams({
    query: query.toLowerCase().includes("cemetery") ? query : `${query} cemetery`,
    key: process.env.GOOGLE_PLACES_API_KEY!,
  });

  if (options?.lat !== undefined && options?.lon !== undefined) {
    params.append("location", `${options.lat},${options.lon}`);
    params.append("radius", String((options.radius || 50) * 1000)); // Convert km to meters
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API status:", data.status);
      return [];
    }

    return (data.results || []).map((place: Record<string, unknown>) => {
      const addressParts = (place.formatted_address as string)?.split(",") || [];

      return {
        id: `google-${place.place_id}`,
        source: "google" as const,
        cemeteryName: place.name as string,
        cemeteryCity: addressParts[1]?.trim(),
        cemeteryState: addressParts[2]?.trim()?.split(" ")[0],
        cemeteryCountry: addressParts[addressParts.length - 1]?.trim(),
        gpsLat: (place.geometry as Record<string, unknown>)?.location
          ? ((place.geometry as Record<string, Record<string, number>>).location.lat)
          : undefined,
        gpsLng: (place.geometry as Record<string, unknown>)?.location
          ? ((place.geometry as Record<string, Record<string, number>>).location.lng)
          : undefined,
      };
    });
  } catch (err) {
    console.error("Google Places API error:", err);
    return [];
  }
}
