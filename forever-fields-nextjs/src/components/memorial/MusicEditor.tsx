"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Disc3 } from "lucide-react";
import { Button } from "@/components/ui";

interface FavoriteMusic {
  id: string;
  songTitle: string;
  artist: string;
  genre?: string;
  significance?: string;
  addedBy: string;
}

interface MusicEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (music: Omit<FavoriteMusic, "id"> & { id?: string }) => void;
  music?: FavoriteMusic | null; // If provided, editing mode
  userName?: string;
}

const genres = [
  "Jazz",
  "Classical",
  "Rock",
  "Pop",
  "Country",
  "Gospel",
  "Folk",
  "Blues",
  "Soul",
  "R&B",
  "Hip Hop",
  "Electronic",
  "Reggae",
  "Latin",
  "World",
  "Soundtrack",
  "Other",
];

export function MusicEditor({
  isOpen,
  onClose,
  onSave,
  music,
  userName = "Family Member",
}: MusicEditorProps) {
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [significance, setSignificance] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when editing
  useEffect(() => {
    if (music) {
      setSongTitle(music.songTitle);
      setArtist(music.artist);
      setGenre(music.genre || "");
      setSignificance(music.significance || "");
    } else {
      setSongTitle("");
      setArtist("");
      setGenre("");
      setSignificance("");
    }
    setErrors({});
  }, [music, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!songTitle.trim()) {
      newErrors.songTitle = "Song title is required";
    }

    if (!artist.trim()) {
      newErrors.artist = "Artist is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSave({
      id: music?.id,
      songTitle: songTitle.trim(),
      artist: artist.trim(),
      genre: genre || undefined,
      significance: significance.trim() || undefined,
      addedBy: music?.addedBy || userName,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <Music className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="font-serif text-xl text-gray-900">
                  {music ? "Edit" : "Add"} Favorite Song
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Song Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Song Title
                </label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="What a Wonderful World"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sage focus:border-sage ${
                    errors.songTitle ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {errors.songTitle && (
                  <p className="text-red-500 text-xs mt-1">{errors.songTitle}</p>
                )}
              </div>

              {/* Artist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Artist
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Louis Armstrong"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sage focus:border-sage ${
                    errors.artist ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {errors.artist && (
                  <p className="text-red-500 text-xs mt-1">{errors.artist}</p>
                )}
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genre (optional)
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-sage bg-white"
                >
                  <option value="">Select a genre...</option>
                  {genres.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Significance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why was this song special? (optional)
                </label>
                <textarea
                  value={significance}
                  onChange={(e) => setSignificance(e.target.value)}
                  placeholder="Would hum this while gardening..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-sage resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When would they listen to it? What memories does it bring?
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Disc3 className="w-4 h-4 mr-2" />
                {music ? "Save Changes" : "Add Song"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
