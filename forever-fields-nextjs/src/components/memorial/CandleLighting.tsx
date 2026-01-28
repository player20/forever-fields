"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket, type CandleEvent } from "@/lib/socket";
import { Button, Card, Badge } from "@/components/ui";
import { Flame, Clock, User } from "lucide-react";

interface CandleLightingProps {
  memorialId: string;
  memorialName: string;
  userId?: string;
  userName?: string;
  initialCandles?: CandleEvent[];
  demoMode?: boolean;
}

// Demo candles for offline mode
const DEMO_CANDLES: CandleEvent[] = [
  {
    memorialId: "demo",
    userId: "user-1",
    userName: "Sarah Mitchell",
    message: "Thinking of you always",
    duration: 24,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    memorialId: "demo",
    userId: "user-2",
    userName: "James Wilson",
    message: "Forever in our hearts",
    duration: 168,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    memorialId: "demo",
    userId: "user-3",
    userName: "Emily Chen",
    duration: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

const CANDLE_DURATIONS = [
  { hours: 1, label: "1 Hour", price: "Free" },
  { hours: 24, label: "24 Hours", price: "$1.99" },
  { hours: 168, label: "1 Week", price: "$4.99" },
  { hours: 720, label: "30 Days", price: "$9.99" },
];

export function CandleLighting({
  memorialId,
  memorialName,
  userId = "anonymous",
  userName = "A visitor",
  initialCandles = [],
  demoMode = true,
}: CandleLightingProps) {
  const [candles, setCandles] = useState<CandleEvent[]>(
    initialCandles.length > 0 ? initialCandles : demoMode ? DEMO_CANDLES : []
  );
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [message, setMessage] = useState("");
  const [isLighting, setIsLighting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { isConnected, lightCandle, onCandleLit } = useSocket({
    memorialId,
  });

  // Listen for new candles
  useEffect(() => {
    const unsubscribe = onCandleLit((event) => {
      if (event.memorialId === memorialId) {
        setCandles((prev) => [event, ...prev].slice(0, 10));
      }
    });
    return unsubscribe;
  }, [onCandleLit, memorialId]);

  const handleLightCandle = async () => {
    setIsLighting(true);

    // Emit socket event
    lightCandle({
      memorialId,
      userId,
      userName,
      message: message || undefined,
      duration: selectedDuration,
    });

    // Optimistic update for demo
    const newCandle: CandleEvent = {
      memorialId,
      userId,
      userName,
      message: message || undefined,
      duration: selectedDuration,
      timestamp: new Date().toISOString(),
    };
    setCandles((prev) => [newCandle, ...prev].slice(0, 10));

    setTimeout(() => {
      setIsLighting(false);
      setShowSuccess(true);
      setMessage("");
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <Flame className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-lg font-serif font-semibold text-gray-dark">
            Light a Candle
          </h3>
          <p className="text-sm text-gray-body">
            for {memorialName}
          </p>
        </div>
        {isConnected && (
          <Badge variant="secondary" className="ml-auto text-xs">
            Live
          </Badge>
        )}
      </div>

      {/* Candle animation */}
      <div className="flex justify-center mb-6">
        <motion.div
          className="relative"
          animate={isLighting ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          {/* Candle base */}
          <div className="w-12 h-24 bg-gradient-to-b from-amber-100 to-amber-200 rounded-t-lg rounded-b-sm mx-auto" />

          {/* Flame */}
          <AnimatePresence>
            {(candles.length > 0 || isLighting) && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [-2, 2, -2],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5,
                  }}
                  className="w-6 h-10 bg-gradient-to-t from-orange-500 via-yellow-400 to-yellow-200 rounded-full blur-[2px]"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glow effect */}
          {(candles.length > 0 || isLighting) && (
            <div className="absolute -inset-4 bg-amber-400/20 rounded-full blur-xl -z-10" />
          )}
        </motion.div>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center"
          >
            <p className="text-green-700 text-sm font-medium">
              Your candle has been lit for {memorialName}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duration selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-dark mb-2">
          Duration
        </label>
        <div className="grid grid-cols-4 gap-2">
          {CANDLE_DURATIONS.map((option) => (
            <button
              key={option.hours}
              onClick={() => setSelectedDuration(option.hours)}
              className={`p-2 rounded-lg border text-center transition-colors ${
                selectedDuration === option.hours
                  ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-gray-200 hover:border-amber-300"
              }`}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block text-xs text-gray-500">{option.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-dark mb-2">
          Add a message (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share a thought or memory..."
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
          rows={2}
        />
      </div>

      {/* Light candle button */}
      <Button
        onClick={handleLightCandle}
        disabled={isLighting}
        className="w-full"
      >
        {isLighting ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Flame className="w-5 h-5" />
            </motion.span>
            Lighting...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Flame className="w-5 h-5" />
            Light a Candle
          </span>
        )}
      </Button>

      {/* Recent candles */}
      {candles.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-dark mb-3">
            Recently Lit ({candles.length})
          </h4>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {candles.map((candle, index) => (
              <motion.div
                key={`${candle.userId}-${candle.timestamp}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-dark">
                    <span className="font-medium">{candle.userName}</span> lit a candle
                  </p>
                  {candle.message && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      &ldquo;{candle.message}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{candle.duration}h</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
