"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface CandleLighting {
  id: string;
  memorial_id: string;
  lighter_name: string;
  message?: string;
  created_at: string;
  duration_hours?: number;
}

interface UseRealtimeCandlesOptions {
  /** Initial candles to display (from server-side fetch) */
  initialCandles?: CandleLighting[];
  /** Callback when a new candle is lit */
  onNewCandle?: (candle: CandleLighting) => void;
}

interface UseRealtimeCandlesReturn {
  /** List of candles (newest first) */
  candles: CandleLighting[];
  /** Number of new candles since component mounted */
  newCandleCount: number;
  /** Reset the new candle count (e.g., after user acknowledges) */
  resetNewCandleCount: () => void;
  /** Whether connected to realtime */
  isConnected: boolean;
  /** Light a new candle */
  lightCandle: (lighterName: string, message?: string, durationHours?: number) => Promise<CandleLighting | null>;
  /** Loading state for lightCandle */
  isLighting: boolean;
  /** Error from last operation */
  error: string | null;
}

/**
 * Hook for real-time candle lighting using Supabase Realtime.
 * Automatically subscribes to new candle events for a memorial.
 */
export function useRealtimeCandles(
  memorialId: string,
  options: UseRealtimeCandlesOptions = {}
): UseRealtimeCandlesReturn {
  const { initialCandles = [], onNewCandle } = options;

  const [candles, setCandles] = useState<CandleLighting[]>(initialCandles);
  const [newCandleCount, setNewCandleCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLighting, setIsLighting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = getSupabaseClient();

  // Subscribe to realtime updates
  useEffect(() => {
    if (!memorialId) return;

    // Create channel for this memorial's candles
    const channel = supabase
      .channel(`candles:${memorialId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "candle_lightings",
          filter: `memorial_id=eq.${memorialId}`,
        },
        (payload) => {
          const newCandle = payload.new as CandleLighting;

          // Add to candles list (newest first)
          setCandles((prev) => {
            // Avoid duplicates
            if (prev.some((c) => c.id === newCandle.id)) {
              return prev;
            }
            return [newCandle, ...prev];
          });

          // Increment new candle count
          setNewCandleCount((prev) => prev + 1);

          // Call callback if provided
          onNewCandle?.(newCandle);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
        if (status === "CHANNEL_ERROR") {
          console.error("[RealtimeCandles] Channel error");
          setError("Failed to connect to realtime updates");
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount or memorial change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [memorialId, supabase, onNewCandle]);

  // Light a new candle
  const lightCandle = useCallback(
    async (
      lighterName: string,
      message?: string,
      durationHours: number = 24
    ): Promise<CandleLighting | null> => {
      if (!memorialId) {
        setError("No memorial ID provided");
        return null;
      }

      setIsLighting(true);
      setError(null);

      try {
        // Calculate expiration
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + durationHours);

        const { data, error: insertError } = await supabase
          .from("candle_lightings")
          .insert({
            memorial_id: memorialId,
            lighter_name: lighterName,
            message: message || null,
            duration_hours: durationHours,
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          // In demo mode or if table doesn't exist, simulate success
          if (insertError.code === "PGRST116" || insertError.code === "42P01") {
            const mockCandle: CandleLighting = {
              id: `local-${Date.now()}`,
              memorial_id: memorialId,
              lighter_name: lighterName,
              message,
              created_at: new Date().toISOString(),
              duration_hours: durationHours,
            };

            // Add locally since realtime won't trigger
            setCandles((prev) => [mockCandle, ...prev]);
            setNewCandleCount((prev) => prev + 1);

            return mockCandle;
          }

          throw new Error(insertError.message);
        }

        // Note: We don't add to state here because the realtime subscription
        // will handle it automatically
        return data as CandleLighting;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to light candle";
        setError(message);
        console.error("[RealtimeCandles] Light candle error:", err);
        return null;
      } finally {
        setIsLighting(false);
      }
    },
    [memorialId, supabase]
  );

  // Reset new candle count
  const resetNewCandleCount = useCallback(() => {
    setNewCandleCount(0);
  }, []);

  return {
    candles,
    newCandleCount,
    resetNewCandleCount,
    isConnected,
    lightCandle,
    isLighting,
    error,
  };
}

/**
 * Hook for real-time guestbook entries using Supabase Realtime.
 */
export function useRealtimeGuestbook(memorialId: string) {
  const [entries, setEntries] = useState<Array<{
    id: string;
    memorial_id: string;
    guest_name: string;
    guest_email?: string;
    message: string;
    created_at: string;
    is_approved: boolean;
  }>>([]);
  const [isConnected, setIsConnected] = useState(false);

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!memorialId) return;

    const channel = supabase
      .channel(`guestbook:${memorialId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guestbook_entries",
          filter: `memorial_id=eq.${memorialId}`,
        },
        (payload) => {
          const newEntry = payload.new as typeof entries[0];
          // Only show approved entries
          if (newEntry.is_approved) {
            setEntries((prev) => [newEntry, ...prev]);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memorialId, supabase]);

  return { entries, isConnected };
}

/**
 * Hook for real-time flower placements using Supabase Realtime.
 */
export function useRealtimeFlowers(memorialId: string) {
  const [flowers, setFlowers] = useState<Array<{
    id: string;
    memorial_id: string;
    flower_type: string;
    placer_name: string;
    message?: string;
    created_at: string;
  }>>([]);
  const [newFlowerCount, setNewFlowerCount] = useState(0);

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!memorialId) return;

    const channel = supabase
      .channel(`flowers:${memorialId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "flower_placements",
          filter: `memorial_id=eq.${memorialId}`,
        },
        (payload) => {
          const newFlower = payload.new as typeof flowers[0];
          setFlowers((prev) => [newFlower, ...prev]);
          setNewFlowerCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memorialId, supabase]);

  const resetNewFlowerCount = useCallback(() => {
    setNewFlowerCount(0);
  }, []);

  return { flowers, newFlowerCount, resetNewFlowerCount };
}
