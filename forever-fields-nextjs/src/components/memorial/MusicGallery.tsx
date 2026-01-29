"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Disc3, Heart, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

interface FavoriteMusic {
  id: string;
  songTitle: string;
  artist: string;
  genre?: string;
  significance?: string;
  addedBy: string;
}

interface MusicGalleryProps {
  favorites: FavoriteMusic[];
  name: string;
  canEdit?: boolean;
  onAdd?: () => void;
  onEdit?: (music: FavoriteMusic) => void;
  onDelete?: (id: string) => void;
}

const genreColors: Record<string, string> = {
  jazz: "bg-indigo-100 text-indigo-700",
  classical: "bg-purple-100 text-purple-700",
  rock: "bg-red-100 text-red-700",
  pop: "bg-pink-100 text-pink-700",
  country: "bg-amber-100 text-amber-700",
  gospel: "bg-sky-100 text-sky-700",
  hymn: "bg-sky-100 text-sky-700",
  folk: "bg-green-100 text-green-700",
  soul: "bg-orange-100 text-orange-700",
  blues: "bg-blue-100 text-blue-700",
  "r&b": "bg-violet-100 text-violet-700",
  "hip hop": "bg-gray-100 text-gray-700",
  electronic: "bg-cyan-100 text-cyan-700",
  reggae: "bg-emerald-100 text-emerald-700",
  latin: "bg-rose-100 text-rose-700",
  world: "bg-teal-100 text-teal-700",
  soundtrack: "bg-slate-100 text-slate-700",
};

export function MusicGallery({
  favorites,
  name,
  canEdit = false,
  onAdd,
  onEdit,
  onDelete,
}: MusicGalleryProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    onDelete?.(id);
    setDeleteConfirmId(null);
  };

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-12 h-12 text-sage-light mx-auto mb-4" />
        <h3 className="font-serif text-lg text-sage-dark mb-2">
          {name}&apos;s Soundtrack
        </h3>
        <p className="text-sage-dark/70 max-w-md mx-auto mb-6">
          What songs remind you of {name}? Share the music that was special to them
          or brings back memories.
        </p>
        {canEdit && onAdd && (
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Song
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      {canEdit && onAdd && (
        <div className="flex justify-end">
          <Button onClick={onAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Song
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {favorites.map((song, index) => {
          const genreClass = song.genre
            ? genreColors[song.genre.toLowerCase()] || "bg-gray-100 text-gray-700"
            : null;
          const isConfirmingDelete = deleteConfirmId === song.id;

          return (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-white to-sage-pale/30 rounded-xl p-4 border border-sage-light/30 hover:shadow-md transition-shadow relative"
            >
              {/* Delete Confirmation Overlay */}
              <AnimatePresence>
                {isConfirmingDelete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center p-4 rounded-xl"
                  >
                    <p className="text-gray-700 text-center mb-4 text-sm">
                      Delete &ldquo;{song.songTitle}&rdquo;?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(song.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-start gap-3">
                {/* Vinyl/Music Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-inner">
                  <Disc3 className="w-6 h-6 text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Song Title */}
                  <h3 className="font-serif text-base text-gray-900 truncate">
                    {song.songTitle}
                  </h3>

                  {/* Artist */}
                  <p className="text-sm text-gray-600">{song.artist}</p>

                  {/* Genre Badge */}
                  {song.genre && genreClass && (
                    <span
                      className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${genreClass}`}
                    >
                      {song.genre}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {canEdit ? (
                    <>
                      <button
                        onClick={() => onEdit?.(song)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(song.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                  )}
                </div>
              </div>

              {/* Significance */}
              {song.significance && (
                <p className="mt-3 text-sm text-gray-600 italic pl-15">
                  &ldquo;{song.significance}&rdquo;
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
