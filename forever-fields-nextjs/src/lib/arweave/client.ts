/**
 * Arweave Client
 *
 * Client for interacting with Arweave blockchain for permanent storage.
 * Uses Bundlr/Irys for easier uploads with instant finality.
 *
 * In production, this would use:
 * - @irys/sdk for uploads
 * - arweave-js for verification
 */

import {
  PermanentArchive,
  MemorialArchiveData,
  ArchiveResult,
  ArchiveOptions,
  ARCHIVE_SCHEMA_VERSION,
  ARWEAVE_GATEWAYS,
  RECOVERY_MESSAGE,
  getArweaveUrl,
} from "./types";

// Demo mode
const DEMO_MODE = !process.env.ARWEAVE_WALLET_KEY;

// In-memory storage for demo mode
const demoArchives: Map<string, PermanentArchive> = new Map();
const demoTransactions: Map<string, string> = new Map(); // txId -> memorialId

/**
 * Create a SHA-256 hash of data
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create a permanent archive structure from memorial data
 */
export async function createArchiveData(
  memorial: MemorialArchiveData,
  options: ArchiveOptions = {
    includeProfilePhoto: true,
    maxPhotoSize: 100 * 1024, // 100KB
    signWithOwnerKey: false,
  }
): Promise<PermanentArchive> {
  const fullName = [memorial.firstName, memorial.middleName, memorial.lastName]
    .filter(Boolean)
    .join(" ");

  // Convert profile photo to base64 if small enough
  let profilePhotoBase64: string | null = null;
  if (options.includeProfilePhoto && memorial.profilePhotoUrl) {
    // In production, fetch and check size
    // For demo, just note it's available
    profilePhotoBase64 = null; // Would be base64 encoded
  }

  const archiveData: PermanentArchive = {
    schema: "forever-fields-archive-v1",
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    archivedAt: new Date().toISOString(),
    foreverFieldsUrl: `https://foreverfields.com/memorial/${memorial.id}`,

    memorial: {
      id: memorial.id,
      fullName,
      firstName: memorial.firstName,
      middleName: memorial.middleName,
      lastName: memorial.lastName,
      nickname: memorial.nickname,
      birthDate: memorial.birthDate?.toISOString().split("T")[0] || null,
      deathDate: memorial.deathDate?.toISOString().split("T")[0] || null,
      birthPlace: memorial.birthPlace || null,
      restingPlace: memorial.restingPlace || null,
      obituary: memorial.obituary || null,
      profilePhoto: profilePhotoBase64,
    },

    familyTree: {
      parents: [], // Would be populated from family tree data
      children: [],
      spouses: [],
      siblings: [],
    },

    contentHashes: {
      photos: [], // Would contain hashes of all photos
      stories: [], // Would contain hashes of all stories
      voiceProfile: null, // Would contain hash if voice profile exists
    },

    signatures: {
      dataHash: "", // Will be filled after creation
      timestamp: new Date().toISOString(),
      ownerPublicKey: null,
    },

    recovery: {
      message: RECOVERY_MESSAGE,
      exportFormat: "JSON",
      mediaRecovery:
        "Contact arweave gateway operators for media files using the hashes in contentHashes.",
    },

    metadata: {
      createdBy: "anonymized", // Don't store actual user ID
      memorialCreatedAt: memorial.createdAt.toISOString(),
      lastUpdatedAt: memorial.updatedAt.toISOString(),
      viewCount: memorial.viewCount,
      isPublic: memorial.isPublic,
    },
  };

  // Calculate data hash
  const memorialJson = JSON.stringify(archiveData.memorial);
  archiveData.signatures.dataHash = await hashData(memorialJson);

  return archiveData;
}

/**
 * Upload archive to Arweave
 */
export async function uploadToArweave(
  archive: PermanentArchive
): Promise<ArchiveResult> {
  if (DEMO_MODE) {
    // Demo mode: store locally and generate fake transaction
    const txId = `demo-tx-${crypto.randomUUID().slice(0, 8)}`;
    const archiveJson = JSON.stringify(archive);

    demoArchives.set(txId, archive);
    demoTransactions.set(txId, archive.memorial.id);

    console.log(`[ARWEAVE DEMO] Stored archive with txId: ${txId}`);

    return {
      success: true,
      transactionId: txId,
      arweaveUrl: getArweaveUrl(txId),
      contentHash: archive.signatures.dataHash,
      bytesStored: new TextEncoder().encode(archiveJson).length,
      costUsd: 0.01, // Demo cost
    };
  }

  // Production: Use Bundlr/Irys SDK
  // This is a placeholder for the actual implementation
  try {
    // const irys = new Irys({
    //   url: "https://node2.irys.xyz",
    //   token: "arweave",
    //   key: process.env.ARWEAVE_WALLET_KEY,
    // });
    //
    // const tags = [
    //   { name: "Content-Type", value: "application/json" },
    //   { name: "App-Name", value: "Forever Fields" },
    //   { name: "App-Version", value: "1.0" },
    //   { name: "Archive-Type", value: "memorial" },
    //   { name: "Memorial-ID", value: archive.memorial.id },
    //   { name: "Schema-Version", value: archive.schemaVersion },
    // ];
    //
    // const receipt = await irys.upload(JSON.stringify(archive), { tags });
    //
    // return {
    //   success: true,
    //   transactionId: receipt.id,
    //   arweaveUrl: `https://arweave.net/${receipt.id}`,
    //   contentHash: archive.signatures.dataHash,
    //   bytesStored: receipt.size,
    //   costUsd: Number(irys.utils.fromAtomic(receipt.price)) * arweaveUsdPrice,
    // };

    return {
      success: false,
      error: "Production Arweave upload not implemented. Set ARWEAVE_WALLET_KEY.",
    };
  } catch (error) {
    console.error("Arweave upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Fetch archive from Arweave
 */
export async function fetchFromArweave(
  txId: string
): Promise<PermanentArchive | null> {
  if (DEMO_MODE) {
    return demoArchives.get(txId) || null;
  }

  // Try multiple gateways for reliability
  for (const gateway of ARWEAVE_GATEWAYS) {
    try {
      const response = await fetch(`${gateway}/${txId}`, {
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        return data as PermanentArchive;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${gateway}:`, error);
      continue;
    }
  }

  return null;
}

/**
 * Verify archive integrity
 */
export async function verifyArchiveIntegrity(
  txId: string,
  currentMemorial: MemorialArchiveData
): Promise<{
  verified: boolean;
  matches: boolean;
  arweaveHash?: string;
  currentHash?: string;
  error?: string;
}> {
  try {
    // Fetch from Arweave
    const arweaveData = await fetchFromArweave(txId);

    if (!arweaveData) {
      return {
        verified: false,
        matches: false,
        error: "Could not fetch archive from Arweave",
      };
    }

    const arweaveHash = arweaveData.signatures.dataHash;

    // Calculate current hash
    const currentArchive = await createArchiveData(currentMemorial);
    const currentHash = currentArchive.signatures.dataHash;

    return {
      verified: true,
      matches: arweaveHash === currentHash,
      arweaveHash,
      currentHash,
    };
  } catch (error) {
    return {
      verified: false,
      matches: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

/**
 * Estimate upload cost
 */
export async function estimateUploadCost(
  memorial: MemorialArchiveData
): Promise<{
  bytes: number;
  costUsd: number;
  costAr?: number;
}> {
  const archive = await createArchiveData(memorial);
  const archiveJson = JSON.stringify(archive);
  const bytes = new TextEncoder().encode(archiveJson).length;

  // Arweave cost is roughly $0.0001 per KB
  const costUsd = (bytes / 1024) * 0.0001;

  return {
    bytes,
    costUsd: Math.max(costUsd, 0.01), // Minimum $0.01
  };
}

/**
 * Check if memorial has been archived
 */
export function isArchived(txId: string | null | undefined): boolean {
  return !!txId && txId.length > 0;
}

/**
 * Get archive status text
 */
export function getArchiveStatusText(
  status: "pending" | "verified" | "failed" | null
): string {
  switch (status) {
    case "verified":
      return "Permanently preserved on blockchain";
    case "pending":
      return "Verification in progress";
    case "failed":
      return "Verification failed - please contact support";
    default:
      return "Not yet preserved";
  }
}
