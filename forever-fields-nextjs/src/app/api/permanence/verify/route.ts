import { NextRequest, NextResponse } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";
import {
  getPermanenceRecord,
  verifyPermanenceRecord,
  checkGatewayAvailability,
  fetchFromArweave,
} from "@/lib/arweave";

// Demo mode
const DEMO_MODE = !process.env.DATABASE_URL;

/**
 * POST /api/permanence/verify - Verify a memorial's archive
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to verify an archive" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { memorialId } = body;

    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    // Get permanence record
    const record = await getPermanenceRecord(memorialId);

    if (!record) {
      return NextResponse.json(
        { error: "Memorial has not been archived" },
        { status: 404 }
      );
    }

    // Verify the archive
    const verificationResult = await verifyPermanenceRecord(record);

    return NextResponse.json({
      verified: verificationResult.verified,
      status: verificationResult.status,
      details: {
        arweaveHash: verificationResult.arweaveHash,
        localHash: verificationResult.localHash,
        checkedAt: verificationResult.checkedAt,
        error: verificationResult.error,
      },
      arweaveUrl: record.arweaveUrl,
    });
  } catch (error) {
    console.error("Error verifying archive:", error);
    return NextResponse.json(
      { error: "Failed to verify archive" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/permanence/verify - Check gateway availability for a transaction
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txId = searchParams.get("txId");
    const memorialId = searchParams.get("memorialId");

    // If memorialId provided, look up the txId
    let transactionId = txId;
    if (!transactionId && memorialId) {
      const record = await getPermanenceRecord(memorialId);
      if (record) {
        transactionId = record.arweaveTxId;
      }
    }

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID or Memorial ID is required" },
        { status: 400 }
      );
    }

    // Check gateway availability
    const availability = await checkGatewayAvailability(transactionId);

    // Try to fetch the actual data
    const archiveData = await fetchFromArweave(transactionId);

    return NextResponse.json({
      transactionId,
      available: availability.available,
      gateways: availability.gateways,
      hasValidData: !!archiveData,
      archivePreview: archiveData
        ? {
            schema: archiveData.schema,
            schemaVersion: archiveData.schemaVersion,
            archivedAt: archiveData.archivedAt,
            memorialName: archiveData.memorial.fullName,
            dataHash: archiveData.signatures.dataHash,
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking gateway availability:", error);
    return NextResponse.json(
      { error: "Failed to check gateway availability" },
      { status: 500 }
    );
  }
}
