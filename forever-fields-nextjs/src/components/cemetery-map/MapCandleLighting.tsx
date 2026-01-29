"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, Clock, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui";
import type { MapCandleLightingProps } from "./types";

const CANDLE_DURATIONS = [
  { id: "1hour", label: "1 Hour", price: "Free" },
  { id: "24hours", label: "24 Hours", price: "$1" },
  { id: "1week", label: "1 Week", price: "$5" },
  { id: "30days", label: "30 Days", price: "$15" },
];

export function MapCandleLighting({
  plot,
  isOpen,
  onClose,
  onLightCandle,
}: MapCandleLightingProps) {
  const [selectedDuration, setSelectedDuration] = useState("1hour");
  const [message, setMessage] = useState("");
  const [isLighting, setIsLighting] = useState(false);

  const handleLight = async () => {
    setIsLighting(true);
    // Haptic feedback for button press
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Haptic feedback for success
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }

    onLightCandle(selectedDuration);
    setIsLighting(false);
    setMessage("");
    setSelectedDuration("1hour");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50"
          >
            <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with animated candle */}
              <div className="relative bg-gradient-to-b from-amber-50 to-white px-6 pt-6 pb-4">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center">
                  {/* Animated candle */}
                  <div className="relative mb-4">
                    <motion.div
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{
                        background: "radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)",
                      }}
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [-2, 2, -2],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-xl" />
                        <Flame className="w-12 h-12 text-amber-500 relative z-10" />
                      </motion.div>
                    </motion.div>
                  </div>

                  <h2 className="text-xl font-serif font-semibold text-gray-dark">
                    Light a Candle
                  </h2>
                  <p className="text-sm text-gray-body mt-1">
                    For {plot.name}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                {/* Duration selection */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-dark mb-2 block">
                    How long should it burn?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CANDLE_DURATIONS.map((duration) => (
                      <button
                        key={duration.id}
                        onClick={() => setSelectedDuration(duration.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedDuration === duration.id
                            ? "border-amber-400 bg-amber-50"
                            : "border-gray-200 hover:border-amber-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${selectedDuration === duration.id ? 'text-amber-500' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${selectedDuration === duration.id ? 'text-amber-700' : 'text-gray-600'}`}>
                              {duration.label}
                            </span>
                          </div>
                          <span className={`text-xs ${selectedDuration === duration.id ? 'text-amber-600' : 'text-gray-400'}`}>
                            {duration.price}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional message */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-dark mb-2 block flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    Add a message (optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share a thought, memory, or prayer..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none resize-none text-sm"
                    rows={3}
                    maxLength={280}
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">
                    {message.length}/280
                  </p>
                </div>

                {/* Light button */}
                <Button
                  onClick={handleLight}
                  disabled={isLighting}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-200/50"
                >
                  {isLighting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Flame className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Flame className="w-5 h-5 mr-2" />
                      Light This Candle
                    </>
                  )}
                </Button>

                {/* Bloom animation on lighting */}
                <AnimatePresence>
                  {isLighting && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0.8 }}
                      animate={{ scale: 3, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-amber-400/50 pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                {/* Help text */}
                <p className="text-xs text-gray-400 text-center mt-4">
                  <Heart className="w-3 h-3 inline mr-1" />
                  Candles are visible to all visitors of this memorial
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
