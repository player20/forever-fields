// Cemetery detail API
// Get and update individual cemetery data

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import { getCemeteryById, type CemeterySearchResult } from "@/lib/cemetery/search";

// Demo cemetery data
const demoCemeteryDetails: Record<string, CemeterySearchResult & {
  description?: string;
  hours?: string;
  services?: string[];
  hasGpsMapping?: boolean;
  hasVirtualTours?: boolean;
}> = {
  "demo-1": {
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
    description: "Evergreen Memorial Gardens has been serving the Seattle community since 1952. Our beautifully landscaped grounds offer a peaceful setting for families to honor their loved ones.",
    hours: "Daily 8:00 AM - 6:00 PM",
    services: ["Burials", "Cremation", "Mausoleum", "Columbarium", "Memorial Services"],
    hasGpsMapping: true,
    hasVirtualTours: true,
  },
  "demo-2": {
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
    description: "A historic cemetery established in 1890, featuring beautiful rose gardens and Victorian-era monuments.",
    hours: "Dawn to Dusk",
    services: ["Burials", "Memorial Services"],
    hasGpsMapping: false,
    hasVirtualTours: false,
  },
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/cemeteries/[id] - Get cemetery details
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  if (DEMO_MODE) {
    const cemetery = demoCemeteryDetails[id];
    if (cemetery) {
      return NextResponse.json({ cemetery });
    }

    // Try external lookup
    const external = await getCemeteryById(id);
    if (external) {
      return NextResponse.json({ cemetery: external });
    }

    return NextResponse.json(
      { error: "Cemetery not found" },
      { status: 404 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Check if it's a local cemetery
    // Type assertion needed as cemeteries may not be in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cemetery, error } = await (supabase as any)
      .from("cemeteries")
      .select("*")
      .eq("id", id)
      .single();

    if (cemetery) {
      return NextResponse.json({
        cemetery: {
          id: cemetery.id,
          name: cemetery.name,
          address: cemetery.address,
          city: cemetery.city,
          state: cemetery.state,
          country: cemetery.country,
          postalCode: cemetery.postal_code,
          lat: cemetery.gps_lat,
          lng: cemetery.gps_lng,
          phone: cemetery.phone,
          email: cemetery.email,
          website: cemetery.website,
          source: "local",
          isPartner: cemetery.is_partner,
          plotCount: cemetery.total_plots,
          hasGpsMapping: cemetery.has_gps_mapping,
          hasVirtualTours: cemetery.has_virtual_tours,
        },
      });
    }

    if (error && error.code !== "PGRST116") {
      console.error("Database error:", error);
    }

    // Try external lookup
    const external = await getCemeteryById(id);
    if (external) {
      return NextResponse.json({ cemetery: external });
    }

    return NextResponse.json(
      { error: "Cemetery not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Cemetery fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cemetery" },
      { status: 500 }
    );
  }
}

// Helper function - Get memorials at this cemetery
// (Would be called via /api/cemeteries/[id]/memorials route if needed)
async function _getMemorials(
  cemeteryId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;

  if (DEMO_MODE) {
    return { memorials: [], total: 0 };
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data: memorials, error, count } = await supabase
      .from("memorials")
      .select("id, first_name, last_name, birth_date, death_date, profile_photo_url, slug", {
        count: "exact",
      })
      .eq("cemetery_id", cemeteryId)
      .eq("is_public", true)
      .order("last_name")
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Memorials fetch error:", error);
      return { memorials: [], total: 0 };
    }

    return {
      memorials: memorials || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("Memorials fetch error:", error);
    return { memorials: [], total: 0 };
  }
}
