"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface PermanenceStatusProps {
  memorialId: string;
  showDetails?: boolean;
  onArchiveClick?: () => void;
  className?: string;
}

interface PermanenceData {
  isArchived: boolean;
  record?: {
    arweaveTxId: string;
    arweaveUrl: string;
    contentHash: string;
    archiveVersion: string;
    archivedAt: string;
    bytesStored: number;
    verificationStatus: "pending" | "verified" | "failed";
    lastVerifiedAt?: string;
  };
}

export function PermanenceStatus({
  memorialId,
  showDetails = false,
  onArchiveClick,
  className,
}: PermanenceStatusProps) {
  const [data, setData] = useState<PermanenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch(
          `/api/permanence/archive?memorialId=${memorialId}`
        );
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch permanence status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, [memorialId]);

  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-6 w-24 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!data?.isArchived) {
    return (
      <button
        onClick={onArchiveClick}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm",
          "border border-sage rounded-full hover:bg-sage-pale transition-colors",
          "text-sage hover:text-sage-dark",
          className
        )}
      >
        <span className="text-base">🔒</span>
        <span>Preserve Forever</span>
      </button>
    );
  }

  const { record } = data;
  const status = record?.verificationStatus;

  const statusConfig = {
    verified: {
      icon: "✓",
      label: "Permanently Preserved",
      color: "text-green-700 bg-green-50 border-green-200",
    },
    pending: {
      icon: "⏳",
      label: "Verifying...",
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    failed: {
      icon: "⚠️",
      label: "Verification Failed",
      color: "text-red-700 bg-red-50 border-red-200",
    },
  };

  const config = statusConfig[status || "pending"];

  return (
    <div className={cn("space-y-2", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm",
          "border rounded-full transition-colors",
          config.color
        )}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
        {showDetails && (
          <span className="text-xs">{isExpanded ? "▲" : "▼"}</span>
        )}
      </button>

      {showDetails && isExpanded && record && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Blockchain:</span>
            <span className="font-mono text-xs">Arweave</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Transaction:</span>
            <a
              href={record.arweaveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-sage hover:underline"
            >
              {record.arweaveTxId.slice(0, 12)}...
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Archived:</span>
            <span className="text-xs">
              {new Date(record.archivedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Size:</span>
            <span className="text-xs">
              {(record.bytesStored / 1024).toFixed(1)} KB
            </span>
          </div>
          {record.lastVerifiedAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Last Verified:</span>
              <span className="text-xs">
                {new Date(record.lastVerifiedAt).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              This memorial is permanently stored on the Arweave blockchain and
              will remain accessible for 200+ years.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact permanence badge for use in cards/lists
 */
export function PermanenceBadge({
  isArchived,
  status,
  className,
}: {
  isArchived: boolean;
  status?: "pending" | "verified" | "failed";
  className?: string;
}) {
  if (!isArchived) {
    return null;
  }

  const statusConfig = {
    verified: { icon: "🔒", title: "Permanently preserved on blockchain" },
    pending: { icon: "⏳", title: "Archive verification in progress" },
    failed: { icon: "⚠️", title: "Archive verification failed" },
  };

  const config = statusConfig[status || "pending"];

  return (
    <span className={cn("text-sm cursor-help", className)} title={config.title}>
      {config.icon}
    </span>
  );
}
