"use client";

import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@/components/ui";
import {
  GitMerge,
  Search,
  AlertTriangle,
  Check,
  X,
  ChevronRight,
  Image,
  BookOpen,
  Flame,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface Memorial {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  deathDate: string | null;
  profilePhotoUrl: string | null;
  biography: string | null;
}

interface PotentialDuplicate extends Memorial {
  similarityScore: number;
  matchReasons: string[];
}

interface MergeOptions {
  mergePhotos: boolean;
  mergeStories: boolean;
  mergeBiography: boolean;
  mergeTimeline: boolean;
}

interface MemorialMergeProps {
  memorialId: string;
  memorialName: string;
  className?: string;
}

export function MemorialMerge({ memorialId, memorialName, className }: MemorialMergeProps) {
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<PotentialDuplicate[]>([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState<PotentialDuplicate | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<{
    photosAdded: number;
    storiesAdded: number;
    candlesAdded: number;
    eventsAdded: number;
  } | null>(null);

  const [options, setOptions] = useState<MergeOptions>({
    mergePhotos: true,
    mergeStories: true,
    mergeBiography: false,
    mergeTimeline: true,
  });

  const searchDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/memorials/${memorialId}/merge`);
      if (response.ok) {
        const data = await response.json();
        setDuplicates(data.potentialDuplicates || []);
      }
    } catch (error) {
      console.error("Error searching for duplicates:", error);
      toast.error("Failed to search for duplicates");
    } finally {
      setLoading(false);
    }
  }, [memorialId]);

  const handleMerge = async () => {
    if (!selectedDuplicate) return;

    setMerging(true);
    try {
      const response = await fetch(`/api/memorials/${memorialId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMemorialId: selectedDuplicate.id,
          mergeOptions: options,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMergeResult(data.mergedContent);
        setDuplicates((prev) => prev.filter((d) => d.id !== selectedDuplicate.id));
        setSelectedDuplicate(null);
        setShowConfirm(false);
        toast.success("Memorials merged successfully");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to merge memorials");
      }
    } catch (error) {
      console.error("Merge error:", error);
      toast.error("Failed to merge memorials");
    } finally {
      setMerging(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-red-600 bg-red-50";
    if (score >= 0.7) return "text-orange-600 bg-orange-50";
    return "text-yellow-600 bg-yellow-50";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-sage" />
          Merge Memorials
        </CardTitle>
        <CardDescription>
          Find and merge duplicate memorials to combine photos, stories, and memories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Merge Result */}
        {mergeResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <Check className="w-5 h-5" />
              Merge Complete
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Image className="w-4 h-4" />
                {mergeResult.photosAdded} photos
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-4 h-4" />
                {mergeResult.storiesAdded} stories
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Flame className="w-4 h-4" />
                {mergeResult.candlesAdded} candles
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                {mergeResult.eventsAdded} events
              </div>
            </div>
            <button
              onClick={() => setMergeResult(null)}
              className="mt-3 text-sm text-green-700 hover:text-green-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search Button */}
        {duplicates.length === 0 && !loading && (
          <Button onClick={searchDuplicates} variant="outline" className="w-full">
            <Search className="w-4 h-4 mr-2" />
            Search for Potential Duplicates
          </Button>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-sage border-t-transparent rounded-full" />
            <span className="ml-3 text-gray-500">Searching for duplicates...</span>
          </div>
        )}

        {/* Duplicates List */}
        {duplicates.length > 0 && !showConfirm && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                {duplicates.length} Potential Duplicate{duplicates.length !== 1 ? "s" : ""} Found
              </h4>
              <button
                onClick={searchDuplicates}
                className="text-sm text-sage hover:text-sage-dark"
              >
                Refresh
              </button>
            </div>

            {duplicates.map((dup) => (
              <div
                key={dup.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-sage-pale flex items-center justify-center flex-shrink-0">
                  {dup.profilePhotoUrl ? (
                    <img
                      src={dup.profilePhotoUrl}
                      alt={`${dup.firstName} ${dup.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sage-dark font-medium">
                      {dup.firstName[0]}
                      {dup.lastName[0]}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {dup.firstName} {dup.lastName}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getScoreColor(dup.similarityScore)}`}
                    >
                      {Math.round(dup.similarityScore * 100)}% match
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(dup.birthDate)} - {formatDate(dup.deathDate)}
                  </p>
                  {dup.matchReasons.length > 0 && (
                    <div className="flex gap-2 mt-1">
                      {dup.matchReasons.map((reason, i) => (
                        <span key={i} className="text-xs text-gray-400">
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedDuplicate(dup);
                    setShowConfirm(true);
                  }}
                >
                  Merge
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* No Duplicates */}
        {!loading && duplicates.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <GitMerge className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No potential duplicates found</p>
            <p className="text-xs mt-1">
              This memorial appears to be unique
            </p>
          </div>
        )}

        {/* Merge Confirmation */}
        {showConfirm && selectedDuplicate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Confirm Merge</h4>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setSelectedDuplicate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">This action cannot be undone</p>
                  <p className="mt-1">
                    Content from <strong>{selectedDuplicate.firstName} {selectedDuplicate.lastName}</strong>{" "}
                    will be merged into <strong>{memorialName}</strong>. The source memorial will be archived.
                  </p>
                </div>
              </div>
            </div>

            {/* Merge Options */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">What to merge:</p>
              <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={options.mergePhotos}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, mergePhotos: e.target.checked }))
                  }
                  className="w-4 h-4 rounded text-sage focus:ring-sage"
                />
                <Image className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">Photos & Videos</span>
              </label>
              <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={options.mergeStories}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, mergeStories: e.target.checked }))
                  }
                  className="w-4 h-4 rounded text-sage focus:ring-sage"
                />
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">Stories & Memories</span>
              </label>
              <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={options.mergeTimeline}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, mergeTimeline: e.target.checked }))
                  }
                  className="w-4 h-4 rounded text-sage focus:ring-sage"
                />
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">Timeline Events</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setSelectedDuplicate(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMerge}
                disabled={merging}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                {merging ? "Merging..." : "Confirm Merge"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
