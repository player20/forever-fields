import { NextRequest, NextResponse } from "next/server";
import {
  findPotentialDuplicates,
  MemorialCandidate,
  generateCanonicalHash,
} from "@/lib/duplicates/detection";

// Demo mode - when true, use mock data instead of database
const DEMO_MODE = !process.env.DATABASE_URL;

// Demo memorial data for testing
const demoMemorials: MemorialCandidate[] = [
  {
    id: "demo-1",
    firstName: "John",
    middleName: "William",
    lastName: "Smith",
    birthDate: "1945-03-15",
    deathDate: "2020-08-22",
    birthPlace: "Chicago, Illinois",
    restingPlace: "Oak Hill Cemetery, Chicago",
    slug: "john-smith-memorial",
    viewCount: 156,
    profilePhotoUrl: null,
  },
  {
    id: "demo-2",
    firstName: "Mary",
    middleName: "Elizabeth",
    lastName: "Johnson",
    nickname: "Betty",
    birthDate: "1932-07-04",
    deathDate: "2019-12-01",
    birthPlace: "Boston, Massachusetts",
    restingPlace: "Forest Hills Cemetery, Boston",
    slug: "mary-johnson-memorial",
    viewCount: 89,
    profilePhotoUrl: null,
  },
  {
    id: "demo-3",
    firstName: "Robert",
    lastName: "Williams",
    birthDate: "1958-11-20",
    deathDate: "2023-04-10",
    birthPlace: "Los Angeles, California",
    restingPlace: "Hollywood Forever Cemetery",
    slug: "robert-williams-memorial",
    viewCount: 234,
    profilePhotoUrl: null,
  },
  {
    id: "demo-4",
    firstName: "John",
    lastName: "Smyth",
    birthDate: "1946-03-15",
    deathDate: "2020-09-01",
    birthPlace: "Chicago, IL",
    restingPlace: "Oak Hill Cemetery",
    slug: "john-smyth-memorial",
    viewCount: 45,
    profilePhotoUrl: null,
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      firstName,
      middleName,
      lastName,
      birthDate,
      deathDate,
      birthPlace,
      restingPlace,
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Create the input candidate
    const inputCandidate: MemorialCandidate = {
      id: "", // New memorial, no ID yet
      firstName,
      middleName,
      lastName,
      birthDate,
      deathDate,
      birthPlace,
      restingPlace,
    };

    let existingMemorials: MemorialCandidate[] = [];

    if (DEMO_MODE) {
      // Use demo data
      existingMemorials = demoMemorials;
    } else {
      // TODO: Query from database using Prisma
      // First, check for exact hash match (fast path)
      const _hash = generateCanonicalHash(
        firstName,
        lastName,
        birthDate,
        deathDate
      );

      // Then, query memorials with similar names for fuzzy matching
      // This would be a Prisma query like:
      // const memorials = await prisma.memorial.findMany({
      //   where: {
      //     OR: [
      //       { canonicalHash: hash },
      //       {
      //         firstName: { contains: firstName, mode: 'insensitive' },
      //         lastName: { contains: lastName, mode: 'insensitive' },
      //       },
      //     ],
      //   },
      //   take: 50,
      // });

      // For now, return empty in non-demo mode without DB
      existingMemorials = [];
    }

    // Find potential duplicates with fuzzy matching
    const matches = findPotentialDuplicates(
      inputCandidate,
      existingMemorials,
      0.5 // Lower threshold to catch more potential matches
    );

    return NextResponse.json({
      matches,
      total: matches.length,
      canonicalHash: generateCanonicalHash(
        firstName,
        lastName,
        birthDate,
        deathDate
      ),
    });
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return NextResponse.json(
      { error: "Failed to check for duplicates" },
      { status: 500 }
    );
  }
}
