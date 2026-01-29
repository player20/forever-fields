import { NextRequest, NextResponse } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";
import {
  createFamilySearchClient,
  isDemoMode,
  FamilySearchImportOptions,
} from "@/lib/familysearch";
import { cookies } from "next/headers";

// Demo mode
const DEMO_MODE = isDemoMode();

/**
 * GET /api/familysearch/tree - Get family tree data
 *
 * Query params:
 * - personId: The FamilySearch person ID to fetch tree for
 * - includeAncestors: Whether to include ancestors (default: true)
 * - ancestorGenerations: Number of ancestor generations (1-8, default: 4)
 * - includeDescendants: Whether to include descendants (default: false)
 * - descendantGenerations: Number of descendant generations (1-4, default: 2)
 * - includeSpouses: Whether to include spouses (default: true)
 * - excludeLiving: Whether to exclude living persons (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to fetch family tree data" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("personId");

    // Get access token
    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    if (DEMO_MODE) {
      const cookieStore = await cookies();
      accessToken = cookieStore.get("fs_access_token")?.value || "demo-token";
      refreshToken = cookieStore.get("fs_refresh_token")?.value;
    } else {
      // TODO: Get from database
      // const connection = await prisma.familySearchConnection.findUnique({
      //   where: { userId: user.id },
      // });
      // accessToken = decrypt(connection?.accessToken);
      // refreshToken = connection?.refreshToken ? decrypt(connection.refreshToken) : undefined;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "FamilySearch not connected. Please connect first." },
        { status: 401 }
      );
    }

    // If no personId provided, try to get the user's own person ID
    let targetPersonId = personId;
    if (!targetPersonId) {
      if (DEMO_MODE) {
        const cookieStore = await cookies();
        const fsUserCookie = cookieStore.get("fs_user")?.value;
        if (fsUserCookie) {
          const fsUser = JSON.parse(fsUserCookie);
          targetPersonId = fsUser.personId;
        }
      }
      // In production, get from stored connection
    }

    if (!targetPersonId) {
      return NextResponse.json(
        { error: "Person ID is required" },
        { status: 400 }
      );
    }

    // Parse import options from query params
    const options: FamilySearchImportOptions = {
      includeAncestors: searchParams.get("includeAncestors") !== "false",
      ancestorGenerations: Math.min(
        Math.max(parseInt(searchParams.get("ancestorGenerations") || "4", 10), 1),
        8
      ),
      includeDescendants: searchParams.get("includeDescendants") === "true",
      descendantGenerations: Math.min(
        Math.max(
          parseInt(searchParams.get("descendantGenerations") || "2", 10),
          1
        ),
        4
      ),
      includeSpouses: searchParams.get("includeSpouses") !== "false",
      excludeLiving: searchParams.get("excludeLiving") !== "false",
    };

    // Create client with token refresh callback
    const client = createFamilySearchClient(
      accessToken,
      refreshToken,
      async (newTokens) => {
        // Update stored tokens
        if (DEMO_MODE) {
          const cookieStore = await cookies();
          cookieStore.set("fs_access_token", newTokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 3600,
            path: "/",
          });
          if (newTokens.refreshToken) {
            cookieStore.set("fs_refresh_token", newTokens.refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30,
              path: "/",
            });
          }
        }
        // TODO: Update database in production
      }
    );

    // Fetch the family tree
    const treeData = await client.getFamilyTree(targetPersonId, options);

    if (!treeData) {
      return NextResponse.json(
        { error: "Failed to fetch family tree. Person may be living or not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tree: treeData,
      options,
    });
  } catch (error) {
    console.error("Error fetching family tree:", error);
    return NextResponse.json(
      { error: "Failed to fetch family tree data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/familysearch/tree - Search for persons in FamilySearch
 *
 * Body:
 * - givenName: First name to search
 * - surname: Last name to search
 * - birthLikeDate: Approximate birth date
 * - deathLikeDate: Approximate death date
 * - birthLikePlace: Approximate birth place
 * - count: Number of results (max 50)
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to search FamilySearch" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { givenName, surname, birthLikeDate, deathLikeDate, birthLikePlace, count } =
      body;

    // Validate at least one search parameter
    if (!givenName && !surname) {
      return NextResponse.json(
        { error: "At least a given name or surname is required" },
        { status: 400 }
      );
    }

    // Get access token
    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    if (DEMO_MODE) {
      const cookieStore = await cookies();
      accessToken = cookieStore.get("fs_access_token")?.value || "demo-token";
      refreshToken = cookieStore.get("fs_refresh_token")?.value;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "FamilySearch not connected. Please connect first." },
        { status: 401 }
      );
    }

    const client = createFamilySearchClient(accessToken, refreshToken);

    const results = await client.searchPersons({
      givenName,
      surname,
      birthLikeDate,
      deathLikeDate,
      birthLikePlace,
      count: Math.min(count || 10, 50),
    });

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error searching FamilySearch:", error);
    return NextResponse.json(
      { error: "Failed to search FamilySearch" },
      { status: 500 }
    );
  }
}
