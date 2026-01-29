/**
 * Arweave Verification
 *
 * Utilities for verifying archived memorials on the blockchain.
 */

import {
  PermanenceRecord,
  VerificationResult,
  ARWEAVE_GATEWAYS,
} from "./types";
import { fetchFromArweave, hashData as _hashData } from "./client";

// Demo mode
const DEMO_MODE = !process.env.DATABASE_URL;

// In-memory storage for demo mode
const demoPermanenceRecords: Map<string, PermanenceRecord> = new Map();

/**
 * Store a permanence record
 */
export async function storePermanenceRecord(
  record: PermanenceRecord
): Promise<void> {
  if (DEMO_MODE) {
    demoPermanenceRecords.set(record.memorialId, record);
    return;
  }

  // Production: Store in database via Prisma
  // await prisma.permanenceRecord.create({ data: record });
}

/**
 * Get permanence record for a memorial
 */
export async function getPermanenceRecord(
  memorialId: string
): Promise<PermanenceRecord | null> {
  if (DEMO_MODE) {
    return demoPermanenceRecords.get(memorialId) || null;
  }

  // Production: Query database
  return null;
}

/**
 * Update verification status
 */
export async function updateVerificationStatus(
  memorialId: string,
  status: "pending" | "verified" | "failed",
  error?: string
): Promise<void> {
  const record = await getPermanenceRecord(memorialId);
  if (!record) return;

  record.verificationStatus = status;
  record.lastVerifiedAt = new Date();
  record.verificationError = error;

  if (DEMO_MODE) {
    demoPermanenceRecords.set(memorialId, record);
    return;
  }

  // Production: Update database
}

/**
 * Verify a single permanence record
 */
export async function verifyPermanenceRecord(
  record: PermanenceRecord
): Promise<VerificationResult> {
  try {
    // Fetch from Arweave
    const arweaveData = await fetchFromArweave(record.arweaveTxId);

    if (!arweaveData) {
      await updateVerificationStatus(
        record.memorialId,
        "failed",
        "Could not fetch from Arweave"
      );

      return {
        verified: false,
        status: "failed",
        error: "Archive not found on Arweave. Gateway may be temporarily unavailable.",
        checkedAt: new Date(),
      };
    }

    // Verify hash matches
    const arweaveHash = arweaveData.signatures.dataHash;

    if (arweaveHash !== record.contentHash) {
      await updateVerificationStatus(
        record.memorialId,
        "failed",
        "Hash mismatch - local data may have changed"
      );

      return {
        verified: false,
        status: "mismatch",
        arweaveData,
        arweaveHash,
        localHash: record.contentHash,
        error:
          "Content hash mismatch. This may indicate local data has changed since archiving.",
        checkedAt: new Date(),
      };
    }

    // Verification successful
    await updateVerificationStatus(record.memorialId, "verified");

    return {
      verified: true,
      status: "verified",
      arweaveData,
      arweaveHash,
      localHash: record.contentHash,
      checkedAt: new Date(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Verification failed";

    await updateVerificationStatus(record.memorialId, "failed", errorMessage);

    return {
      verified: false,
      status: "failed",
      error: errorMessage,
      checkedAt: new Date(),
    };
  }
}

/**
 * Verify all pending permanence records
 * (Would be called by a cron job in production)
 */
export async function verifyAllPending(): Promise<{
  verified: number;
  failed: number;
  total: number;
}> {
  let verified = 0;
  let failed = 0;

  if (DEMO_MODE) {
    const records = Array.from(demoPermanenceRecords.values()).filter(
      (r) => r.verificationStatus === "pending"
    );

    for (const record of records) {
      const result = await verifyPermanenceRecord(record);
      if (result.verified) {
        verified++;
      } else {
        failed++;
      }
    }

    return { verified, failed, total: records.length };
  }

  // Production: Query database for pending records
  return { verified: 0, failed: 0, total: 0 };
}

/**
 * Check if archive is accessible from multiple gateways
 */
export async function checkGatewayAvailability(
  txId: string
): Promise<{
  available: boolean;
  gateways: Array<{ url: string; available: boolean; responseTime?: number }>;
}> {
  const results: Array<{
    url: string;
    available: boolean;
    responseTime?: number;
  }> = [];

  for (const gateway of ARWEAVE_GATEWAYS) {
    const startTime = Date.now();
    try {
      const response = await fetch(`${gateway}/${txId}`, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      results.push({
        url: gateway,
        available: response.ok,
        responseTime: Date.now() - startTime,
      });
    } catch {
      results.push({
        url: gateway,
        available: false,
      });
    }
  }

  return {
    available: results.some((r) => r.available),
    gateways: results,
  };
}

/**
 * Get all permanence records for admin dashboard
 */
export async function getAllPermanenceRecords(): Promise<PermanenceRecord[]> {
  if (DEMO_MODE) {
    return Array.from(demoPermanenceRecords.values());
  }

  // Production: Query database
  return [];
}

/**
 * Get permanence statistics
 */
export async function getPermanenceStats(): Promise<{
  total: number;
  verified: number;
  pending: number;
  failed: number;
  totalBytes: number;
  totalCostUsd: number;
}> {
  const records = await getAllPermanenceRecords();

  return {
    total: records.length,
    verified: records.filter((r) => r.verificationStatus === "verified").length,
    pending: records.filter((r) => r.verificationStatus === "pending").length,
    failed: records.filter((r) => r.verificationStatus === "failed").length,
    totalBytes: records.reduce((sum, r) => sum + r.bytesStored, 0),
    totalCostUsd: records.reduce((sum, r) => sum + r.costUsd, 0),
  };
}
