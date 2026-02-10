// Cemeteries API
// Search and manage cemetery data

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import { searchCemeteries, type CemeterySearchResult } from "@/lib/cemetery/search";

// Demo cemeteries
const demoCemeteries: CemeterySearchResult[] = [
  {
    id: "demo-1",
    name: "Evergreen Memorial Gardens",
    address: "1234 Memorial Drive",
    city: "Seattle",
    state: "WA",
    country: "United States",
    postalCode: "98101",
    lat: 47.6062,
    lng: -122.3321,
    phone: "(206) 555-0123",
    website: "https://example.com/evergreen",
    source: "local",
    isPartner: true,
    plotCount: 15000,
  },
  {
    id: "demo-2",
    name: "Rose Hill Cemetery",
    address: "5678 Rose Avenue",
    city: "Portland",
    state: "OR",
    country: "United States",
    postalCode: "97201",
    lat: 45.5152,
    lng: -122.6784,
    source: "local",
    isPartner: false,
    plotCount: 8500,
  },
  {
    id: "demo-3",
    name: "Green Lawn Memorial Park",
    address: "910 Oak Street",
    city: "San Francisco",
    state: "CA",
    country: "United States",
    postalCode: "94102",
    lat: 37.7749,
    lng: -122.4194,
    source: "local",
    isPartner: true,
    plotCount: 22000,
  },
  {
    id: "demo-4",
    name: "Peaceful Valley Cemetery",
    address: "234 Valley Road",
    city: "Denver",
    state: "CO",
    country: "United States",
    postalCode: "80202",
    lat: 39.7392,
    lng: -104.9903,
    source: "local",
    isPartner: false,
    plotCount: 5000,
  },
  {
    id: "demo-5",
    name: "Heritage Memorial Gardens",
    address: "567 Heritage Lane",
    city: "Austin",
    state: "TX",
    country: "United States",
    postalCode: "78701",
    lat: 30.2672,
    lng: -97.7431,
    source: "local",
    isPartner: true,
    plotCount: 12000,
  },
];

// GET /api/cemeteries - Search cemeteries
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q") || searchParams.get("query");
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const country = searchParams.get("country") || "US";
  const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
  const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;
  const radius = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : 50;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;
  const partnersOnly = searchParams.get("partners") === "true";

  // Demo mode returns mock data
  if (DEMO_MODE) {
    let results = [...demoCemeteries];

    // Filter by query
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.state?.toLowerCase().includes(q)
      );
    }

    // Filter by city
    if (city) {
      results = results.filter((c) =>
        c.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    // Filter by state
    if (state) {
      results = results.filter((c) =>
        c.state?.toLowerCase().includes(state.toLowerCase())
      );
    }

    // Filter by partners only
    if (partnersOnly) {
      results = results.filter((c) => c.isPartner);
    }

    return NextResponse.json({
      cemeteries: results.slice(0, limit),
      total: results.length,
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // First, search local database
    // Type assertion needed as cemeteries may not be in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbQuery = (supabase as any)
      .from("cemeteries")
      .select("*")
      .order("name");

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,city.ilike.%${query}%`);
    }

    if (city) {
      dbQuery = dbQuery.ilike("city", `%${city}%`);
    }

    if (state) {
      dbQuery = dbQuery.ilike("state", `%${state}%`);
    }

    if (partnersOnly) {
      dbQuery = dbQuery.eq("is_partner", true);
    }

    dbQuery = dbQuery.limit(limit);

    const { data: localCemeteries, error: dbError } = await dbQuery;

    if (dbError) {
      console.error("Database search error:", dbError);
    }

    // Convert to search result format
    const localResults: CemeterySearchResult[] = (localCemeteries || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => ({
        id: c.id,
        name: c.name,
        address: c.address,
        city: c.city,
        state: c.state,
        country: c.country || "US",
        postalCode: c.postal_code,
        lat: c.gps_lat,
        lng: c.gps_lng,
        phone: c.phone,
        website: c.website,
        source: "local" as const,
        isPartner: c.is_partner,
        plotCount: c.total_plots,
      })
    );

    // If we have enough local results, return them
    if (localResults.length >= limit) {
      return NextResponse.json({
        cemeteries: localResults,
        total: localResults.length,
      });
    }

    // Otherwise, also search external sources
    const externalResults = await searchCemeteries({
      query: query || undefined,
      city: city || undefined,
      state: state || undefined,
      country: country || undefined,
      lat,
      lng,
      radius,
      limit: limit - localResults.length,
    });

    // Merge and deduplicate
    const allResults = [...localResults];
    const localNames = new Set(localResults.map((c) => c.name.toLowerCase()));

    for (const result of externalResults) {
      if (!localNames.has(result.name.toLowerCase())) {
        allResults.push(result);
      }
    }

    return NextResponse.json({
      cemeteries: allResults.slice(0, limit),
      total: allResults.length,
    });
  } catch (error) {
    console.error("Cemetery search error:", error);
    return NextResponse.json(
      { error: "Failed to search cemeteries" },
      { status: 500 }
    );
  }
}

// POST /api/cemeteries - Add a new cemetery (admin/partner only)
export async function POST(request: NextRequest) {
  const { user } = await optionalAuth();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      address,
      city,
      state,
      country,
      postalCode,
      lat,
      lng,
      phone,
      email,
      website,
    } = body;

    if (!name || !city) {
      return NextResponse.json(
        { error: "Name and city are required" },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      const newCemetery: CemeterySearchResult = {
        id: `demo-${Date.now()}`,
        name,
        address,
        city,
        state,
        country: country || "US",
        postalCode,
        lat,
        lng,
        phone,
        website,
        source: "local",
        isPartner: false,
      };

      return NextResponse.json({ cemetery: newCemetery }, { status: 201 });
    }

    const supabase = await createServerSupabaseClient();

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Type assertion needed as cemeteries may not be in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cemetery, error } = await (supabase as any)
      .from("cemeteries")
      .insert({
        name,
        slug: `${slug}-${Date.now().toString(36)}`,
        address,
        city,
        state,
        country: country || "US",
        postal_code: postalCode,
        gps_lat: lat,
        gps_lng: lng,
        phone,
        email,
        website,
        is_partner: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Cemetery creation error:", error);
      return NextResponse.json(
        { error: "Failed to create cemetery" },
        { status: 500 }
      );
    }

    return NextResponse.json({ cemetery }, { status: 201 });
  } catch (error) {
    console.error("Cemetery creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
