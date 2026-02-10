"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import {
  Music,
  Plus,
  Trash2,
  Play,
  ExternalLink,
  GripVertical,
  X,
  Youtube,
  Music2,
} from "lucide-react";
import { toast } from "sonner";

interface PlaylistItem {
  id: string;
  memorialId: string;
  title: string;
  artist: string | null;
  albumArt: string | null;
  sourceType: string;
  sourceUrl: string;
  sourceId: string | null;
  duration: number | null;
  sortOrder: number;
  createdAt: string;
}

interface TributePlaylistProps {
  memorialId: string;
  isOwner?: boolean;
  className?: string;
}

export function TributePlaylist({ memorialId, isOwner, className }: TributePlaylistProps) {
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchPlaylist = useCallback(async () => {
    try {
      const response = await fetch(`/api/memorials/${memorialId}/playlist`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching playlist:", error);
    } finally {
      setLoading(false);
    }
  }, [memorialId]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!newTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch(`/api/memorials/${memorialId}/playlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: newUrl.trim(),
          title: newTitle.trim(),
          artist: newArtist.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setItems((prev) => [...prev, data.item]);
        setNewUrl("");
        setNewTitle("");
        setNewArtist("");
        setShowAddForm(false);
        toast.success("Track added to playlist");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to add track");
      }
    } catch (error) {
      console.error("Error adding track:", error);
      toast.error("Failed to add track");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveTrack = async (itemId: string) => {
    try {
      const response = await fetch(`/api/memorials/${memorialId}/playlist/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        toast.success("Track removed");
      } else {
        toast.error("Failed to remove track");
      }
    } catch (error) {
      console.error("Error removing track:", error);
      toast.error("Failed to remove track");
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "youtube":
        return <Youtube className="w-4 h-4 text-red-500" />;
      case "spotify":
        return <Music2 className="w-4 h-4 text-green-500" />;
      case "apple_music":
        return <Music className="w-4 h-4 text-pink-500" />;
      default:
        return <Music className="w-4 h-4 text-gray-400" />;
    }
  };

  const openTrack = (item: PlaylistItem) => {
    window.open(item.sourceUrl, "_blank");
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-sage border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0 && !isOwner) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Music className="w-5 h-5 text-sage" />
          Tribute Playlist
        </CardTitle>
        {isOwner && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 text-sm text-sage hover:text-sage-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Song
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAddTrack} className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Add a Song</h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Song URL (Spotify, YouTube, or Apple Music)
              </label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-sage focus:border-sage"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Song title"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-sage focus:border-sage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Artist
                </label>
                <input
                  type="text"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  placeholder="Artist name"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-sage focus:border-sage"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="px-4 py-1.5 text-sm bg-sage text-white rounded-lg hover:bg-sage-dark disabled:opacity-50"
              >
                {isAdding ? "Adding..." : "Add Song"}
              </button>
            </div>
          </form>
        )}

        {/* Playlist Items */}
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No songs added yet</p>
            {isOwner && (
              <p className="text-xs mt-1">Add songs to create a tribute playlist</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                {/* Drag Handle (for owners) */}
                {isOwner && (
                  <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                )}

                {/* Album Art / Index */}
                <div className="relative w-10 h-10 flex-shrink-0">
                  {item.albumArt ? (
                    <img
                      src={item.albumArt}
                      alt={item.title}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                      <Music className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  {/* Play Overlay */}
                  <button
                    onClick={() => openTrack(item)}
                    className="absolute inset-0 bg-black/50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(item.sourceType)}
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {item.title}
                    </p>
                  </div>
                  {item.artist && (
                    <p className="text-xs text-gray-500 truncate">{item.artist}</p>
                  )}
                </div>

                {/* Duration */}
                {item.duration && (
                  <span className="text-xs text-gray-400">
                    {formatDuration(item.duration)}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openTrack(item)}
                    className="p-1.5 text-gray-400 hover:text-sage transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveTrack(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Duration */}
        {items.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-500">
            <span>{items.length} song{items.length !== 1 ? "s" : ""}</span>
            <span>
              Total: {formatDuration(items.reduce((sum, i) => sum + (i.duration || 0), 0))}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
