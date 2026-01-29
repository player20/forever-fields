/**
 * Arweave Module
 *
 * Re-exports all Arweave/blockchain permanence utilities.
 */

// Types
export * from "./types";

// Client utilities
export {
  hashData,
  createArchiveData,
  uploadToArweave,
  fetchFromArweave,
  verifyArchiveIntegrity,
  estimateUploadCost,
  isArchived,
  getArchiveStatusText,
} from "./client";

// Verification utilities
export {
  storePermanenceRecord,
  getPermanenceRecord,
  updateVerificationStatus,
  verifyPermanenceRecord,
  verifyAllPending,
  checkGatewayAvailability,
  getAllPermanenceRecords,
  getPermanenceStats,
} from "./verify";
