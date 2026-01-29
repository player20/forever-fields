/**
 * Arweave/Blockchain Permanence Types
 *
 * Type definitions for permanent memorial storage on Arweave.
 */

// Archive schema version
export const ARCHIVE_SCHEMA_VERSION = "1.0";

/**
 * The permanent archive structure stored on Arweave
 */
export interface PermanentArchive {
  schema: "forever-fields-archive-v1";
  schemaVersion: string;
  archivedAt: string; // ISO timestamp
  foreverFieldsUrl: string; // Current access URL

  // Core memorial data
  memorial: {
    id: string;
    fullName: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    nickname?: string;
    birthDate: string | null;
    deathDate: string | null;
    birthPlace: string | null;
    restingPlace: string | null;
    obituary: string | null;
    profilePhoto: string | null; // Base64 encoded thumbnail (if under 100KB)
  };

  // Family connections (IDs only, not full data)
  familyTree: {
    parents: string[];
    children: string[];
    spouses: string[];
    siblings: string[];
  };

  // Content hashes (for verification, not the content itself)
  contentHashes: {
    photos: string[]; // SHA-256 hashes
    stories: string[];
    voiceProfile: string | null;
  };

  // Verification signatures
  signatures: {
    dataHash: string; // SHA-256 of the memorial data
    timestamp: string;
    ownerPublicKey: string | null; // Optional signing by owner
  };

  // Recovery instructions
  recovery: {
    message: string;
    exportFormat: string;
    mediaRecovery: string;
  };

  // Metadata
  metadata: {
    createdBy: string; // User ID (anonymized)
    memorialCreatedAt: string;
    lastUpdatedAt: string;
    viewCount: number;
    isPublic: boolean;
  };
}

/**
 * Simplified memorial data for archiving
 */
export interface MemorialArchiveData {
  id: string;
  fullName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nickname?: string;
  birthDate?: Date | null;
  deathDate?: Date | null;
  birthPlace?: string | null;
  restingPlace?: string | null;
  obituary?: string | null;
  profilePhotoUrl?: string | null;
  isPublic: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Arweave transaction response
 */
export interface ArweaveTransactionResponse {
  id: string;
  owner: string;
  tags: Array<{ name: string; value: string }>;
  data: string;
  signature: string;
}

/**
 * Bundlr upload response
 */
export interface BundlrUploadResponse {
  id: string;
  timestamp: number;
  version: string;
  deadlineHeight: number;
  public: string;
  signature: string;
}

/**
 * Archive result
 */
export interface ArchiveResult {
  success: boolean;
  transactionId?: string;
  arweaveUrl?: string;
  contentHash?: string;
  bytesStored?: number;
  costUsd?: number;
  error?: string;
}

/**
 * Verification result
 */
export interface VerificationResult {
  verified: boolean;
  status: "verified" | "pending" | "failed" | "mismatch";
  arweaveData?: PermanentArchive;
  localHash?: string;
  arweaveHash?: string;
  error?: string;
  checkedAt: Date;
}

/**
 * Permanence record (database model)
 */
export interface PermanenceRecord {
  id: string;
  memorialId: string;
  userId: string;
  arweaveTxId: string;
  arweaveUrl: string;
  bundlrId?: string;
  contentHash: string;
  profilePhotoHash?: string;
  archiveVersion: string;
  archivedAt: Date;
  bytesStored: number;
  costUsd: number;
  lastVerifiedAt?: Date;
  verificationStatus: "pending" | "verified" | "failed";
  verificationError?: string;
  previousVersionId?: string;
}

/**
 * Archive options
 */
export interface ArchiveOptions {
  includeProfilePhoto: boolean;
  maxPhotoSize: number; // bytes, default 100KB
  signWithOwnerKey: boolean;
}

/**
 * Pricing tiers for permanence feature
 */
export const PERMANENCE_PRICING = {
  oneTime: 2.99, // USD, one-time fee
  includedInTiers: ["heritage", "legacy"],
  storageCostPerKB: 0.0001, // USD per KB on Arweave
} as const;

/**
 * Arweave gateway URLs
 */
export const ARWEAVE_GATEWAYS = [
  "https://arweave.net",
  "https://gateway.irys.xyz", // Bundlr/Irys gateway
  "https://arweave.dev",
] as const;

/**
 * Default recovery message
 */
export const RECOVERY_MESSAGE = `If Forever Fields is no longer available, this data can be used to reconstruct the memorial.
The data is stored permanently on the Arweave blockchain and will remain accessible for 200+ years.
To verify authenticity, compare the dataHash in signatures with a SHA-256 hash of the memorial object.`;

/**
 * Helper to create archive URL from transaction ID
 */
export function getArweaveUrl(
  txId: string,
  gateway: string = ARWEAVE_GATEWAYS[0]
): string {
  return `${gateway}/${txId}`;
}

/**
 * Check if a tier includes permanence
 */
export function tierIncludesPermanence(tier: string): boolean {
  return (PERMANENCE_PRICING.includedInTiers as readonly string[]).includes(tier);
}
