import { NextRequest, NextResponse } from "next/server";

// Cemetery database search API
// Integrates with Find A Grave, BillionGraves, and other databases
// Note: In production, these would use official APIs or authorized scraping

interface CemeteryResult {
  id: string;
  source: "findagrave" | "billiongraves" | "interment";
  sourceUrl?: string;
  firstName: string;
  lastName: string;
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
    const { query, source = "all" } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Check for API keys for real integrations
    const hasFindAGraveKey = !!process.env.FINDAGRAVE_API_KEY;
    const hasBillionGravesKey = !!process.env.BILLIONGRAVES_API_KEY;

    // If no API keys, return demo mode
    if (!hasFindAGraveKey && !hasBillionGravesKey) {
      return NextResponse.json({
        success: true,
        demo: true,
        message: "Running in demo mode. Configure API keys for real cemetery searches.",
        results: [],
      });
    }

    const results: CemeteryResult[] = [];

    // Search Find A Grave
    if ((source === "all" || source === "findagrave") && hasFindAGraveKey) {
      try {
        // Find A Grave API integration
        // Note: Find A Grave has a limited API - may need to use web scraping
        // This is a placeholder for the actual integration
        const fagResults = await searchFindAGrave(query, process.env.FINDAGRAVE_API_KEY!);
        results.push(...fagResults);
      } catch (err) {
        console.error("Find A Grave search error:", err);
      }
    }

    // Search BillionGraves
    if ((source === "all" || source === "billiongraves") && hasBillionGravesKey) {
      try {
        // BillionGraves has a public API
        const bgResults = await searchBillionGraves(query, process.env.BILLIONGRAVES_API_KEY!);
        results.push(...bgResults);
      } catch (err) {
        console.error("BillionGraves search error:", err);
      }
    }

    // Search Interment.net (free, no key required)
    if (source === "all" || source === "interment") {
      try {
        const intResults = await searchInterment(query);
        results.push(...intResults);
      } catch (err) {
        console.error("Interment search error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      query,
      source,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error("Cemetery search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

// Find A Grave search implementation
async function searchFindAGrave(query: string, apiKey: string): Promise<CemeteryResult[]> {
  // Find A Grave doesn't have an official public API
  // Options:
  // 1. Use their affiliate/partner API (requires partnership agreement)
  // 2. Use web scraping (against TOS but commonly done)
  // 3. Use the mobile app's internal API

  // Placeholder - in production, would implement actual search
  // For now, return empty array
  console.log("Find A Grave search:", query, "with key:", apiKey.substring(0, 4) + "...");
  return [];
}

// BillionGraves search implementation
async function searchBillionGraves(query: string, apiKey: string): Promise<CemeteryResult[]> {
  // BillionGraves API endpoint
  // Documentation: https://billiongraves.com/api/docs

  try {
    const response = await fetch(
      `https://billiongraves.com/api/search?name=${encodeURIComponent(query)}&api_key=${apiKey}`,
      {
        headers: {
          Accept: "application/json",
        },
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

// Interment.net search implementation
async function searchInterment(query: string): Promise<CemeteryResult[]> {
  // Interment.net is a free database
  // No official API, but data is publicly accessible

  // Placeholder - would need web scraping or data dump access
  console.log("Interment search:", query);
  return [];
}
