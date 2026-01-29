import { NextRequest, NextResponse } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";
import {
  createArchiveData,
  uploadToArweave,
  estimateUploadCost,
  storePermanenceRecord,
  getPermanenceRecord,
  getArweaveUrl,
  ARCHIVE_SCHEMA_VERSION,
  PERMANENCE_PRICING,
  tierIncludesPermanence,
  MemorialArchiveData,
  PermanenceRecord,
} from "@/lib/arweave";
import { logMemorialEvent, extractRequestInfo } from "@/lib/audit";

// Demo mode
const DEMO_MODE = !process.env.DATABASE_URL;

// Demo memorial data
const demoMemorial: MemorialArchiveData = {
  id: "demo-memorial-1",
  fullName: "John William Smith",
  firstName: "John",
  middleName: "William",
  lastName: "Smith",
  birthDate: new Date("1945-03-15"),
  deathDate: new Date("2020-08-22"),
  birthPlace: "Chicago, Illinois",
  restingPlace: "Oak Hill Cemetery, Chicago",
  obituary: "John was a beloved father, grandfather, and friend...",
  profilePhotoUrl: null,
  isPublic: true,
  viewCount: 156,
  createdAt: new Date("2023-01-15"),
  updatedAt: new Date("2024-01-01"),
};

/**
 * POST /api/permanence/archive - Archive a memorial to Arweave
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to archive a memorial" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { memorialId, includeProfilePhoto = true } = body;

    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    // Check if already archived
    const existingRecord = await getPermanenceRecord(memorialId);
    if (existingRecord) {
      return NextResponse.json(
        {
          error: "Memorial is already archived",
          existingRecord: {
            arweaveTxId: existingRecord.arweaveTxId,
            arweaveUrl: existingRecord.arweaveUrl,
            archivedAt: existingRecord.archivedAt,
          },
        },
        { status: 400 }
      );
    }

    // TODO: Check user's subscription tier for pricing
    // const userTier = user?.subscriptionTier || 'free';
    // if (!tierIncludesPermanence(userTier)) {
    //   // Check if payment was made for one-time fee
    // }

    // Get memorial data
    let memorial: MemorialArchiveData;
    if (DEMO_MODE) {
      memorial = { ...demoMemorial, id: memorialId };
    } else {
      // Production: Fetch from database
      // memorial = await prisma.memorial.findUnique({ where: { id: memorialId } });
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Create archive data
    const archiveData = await createArchiveData(memorial, {
      includeProfilePhoto,
      maxPhotoSize: 100 * 1024,
      signWithOwnerKey: false,
    });

    // Upload to Arweave
    const uploadResult = await uploadToArweave(archiveData);

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "Failed to upload to Arweave" },
        { status: 500 }
      );
    }

    // Create permanence record
    const permanenceRecord: PermanenceRecord = {
      id: crypto.randomUUID(),
      memorialId,
      userId: user?.id || "demo-user",
      arweaveTxId: uploadResult.transactionId!,
      arweaveUrl: getArweaveUrl(uploadResult.transactionId!),
      contentHash: uploadResult.contentHash!,
      archiveVersion: ARCHIVE_SCHEMA_VERSION,
      archivedAt: new Date(),
      bytesStored: uploadResult.bytesStored!,
      costUsd: uploadResult.costUsd!,
      verificationStatus: "pending",
    };

    await storePermanenceRecord(permanenceRecord);

    // Log the event
    const requestInfo = extractRequestInfo(request);
    await logMemorialEvent(
      "MEMORIAL_EXPORTED",
      user?.id,
      memorialId,
      {
        action: "archived_to_blockchain",
        arweaveTxId: uploadResult.transactionId,
        bytesStored: uploadResult.bytesStored,
      },
      requestInfo
    );

    return NextResponse.json({
      success: true,
      message: "Memorial permanently archived on blockchain",
      archive: {
        transactionId: uploadResult.transactionId,
        arweaveUrl: permanenceRecord.arweaveUrl,
        contentHash: uploadResult.contentHash,
        bytesStored: uploadResult.bytesStored,
        archiveVersion: ARCHIVE_SCHEMA_VERSION,
        archivedAt: permanenceRecord.archivedAt,
      },
    });
  } catch (error) {
    console.error("Error archiving memorial:", error);
    return NextResponse.json(
      { error: "Failed to archive memorial" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/permanence/archive - Get archive status or estimate cost
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to check archive status" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memorialId = searchParams.get("memorialId");
    const estimate = searchParams.get("estimate") === "true";

    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    // Check existing archive
    const existingRecord = await getPermanenceRecord(memorialId);

    if (existingRecord) {
      return NextResponse.json({
        isArchived: true,
        record: {
          arweaveTxId: existingRecord.arweaveTxId,
          arweaveUrl: existingRecord.arweaveUrl,
          contentHash: existingRecord.contentHash,
          archiveVersion: existingRecord.archiveVersion,
          archivedAt: existingRecord.archivedAt,
          bytesStored: existingRecord.bytesStored,
          verificationStatus: existingRecord.verificationStatus,
          lastVerifiedAt: existingRecord.lastVerifiedAt,
        },
      });
    }

    // If estimate requested, calculate cost
    if (estimate) {
      let memorial: MemorialArchiveData;
      if (DEMO_MODE) {
        memorial = { ...demoMemorial, id: memorialId };
      } else {
        return NextResponse.json(
          { error: "Database not configured" },
          { status: 500 }
        );
      }

      const costEstimate = await estimateUploadCost(memorial);

      // Check user tier
      const userTier = "free"; // Would come from user data
      const includedInTier = tierIncludesPermanence(userTier);

      return NextResponse.json({
        isArchived: false,
        estimate: {
          bytes: costEstimate.bytes,
          storageCostUsd: costEstimate.costUsd,
          totalCostUsd: includedInTier ? 0 : PERMANENCE_PRICING.oneTime,
          includedInTier,
          userTier,
        },
      });
    }

    return NextResponse.json({
      isArchived: false,
      message: "Memorial has not been archived yet",
    });
  } catch (error) {
    console.error("Error checking archive status:", error);
    return NextResponse.json(
      { error: "Failed to check archive status" },
      { status: 500 }
    );
  }
}
