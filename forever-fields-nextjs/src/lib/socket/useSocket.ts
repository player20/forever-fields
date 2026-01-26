"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  CandleEvent,
  GuestbookEntry,
  FlowerEvent,
  VisitorEvent,
} from "./types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  autoConnect?: boolean;
  memorialId?: string;
}

interface UseSocketReturn {
  isConnected: boolean;
  // Candle methods
  lightCandle: (data: Omit<CandleEvent, "timestamp">) => void;
  onCandleLit: (callback: (event: CandleEvent) => void) => () => void;
  // Guestbook methods
  postGuestbookEntry: (data: Omit<GuestbookEntry, "id" | "timestamp">) => void;
  onGuestbookEntry: (callback: (entry: GuestbookEntry) => void) => () => void;
  // Flower methods
  placeFlower: (data: Omit<FlowerEvent, "timestamp">) => void;
  onFlowerPlaced: (callback: (event: FlowerEvent) => void) => () => void;
  // Visitor count
  onVisitorCountUpdate: (callback: (event: VisitorEvent) => void) => () => void;
  // Memorial room management
  joinMemorial: (memorialId: string) => void;
  leaveMemorial: (memorialId: string) => void;
  // Cemetery room management
  joinCemetery: () => void;
  leaveCemetery: () => void;
}

let globalSocket: TypedSocket | null = null;

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true, memorialId } = options;
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<TypedSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<Function>>>(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    // Reuse global socket if available
    if (globalSocket?.connected) {
      socketRef.current = globalSocket;
      setIsConnected(true);
    } else {
      // Create new socket connection
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";

      // In development without a socket server, we'll skip connection
      if (!socketUrl) {
        console.log("[Socket] No socket URL configured, running in offline mode");
        return;
      }

      const socket: TypedSocket = io(socketUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socket.on("connect", () => {
        console.log("[Socket] Connected:", socket.id);
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("[Socket] Disconnected");
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("[Socket] Connection error:", error.message);
      });

      socketRef.current = socket;
      globalSocket = socket;
    }

    // Join memorial room if specified
    if (memorialId && socketRef.current?.connected) {
      socketRef.current.emit("memorial:join", memorialId);
    }

    return () => {
      // Leave memorial room on unmount
      if (memorialId && socketRef.current?.connected) {
        socketRef.current.emit("memorial:leave", memorialId);
      }
    };
  }, [autoConnect, memorialId]);

  // Register event listener helper
  const registerListener = useCallback(
    <T>(event: keyof ServerToClientEvents, callback: (data: T) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      // Add to listeners map
      if (!listenersRef.current.has(event as string)) {
        listenersRef.current.set(event as string, new Set());
      }
      listenersRef.current.get(event as string)!.add(callback);

      // Register with socket
      socket.on(event, callback as any);

      // Return cleanup function
      return () => {
        socket.off(event, callback as any);
        listenersRef.current.get(event as string)?.delete(callback);
      };
    },
    []
  );

  // Candle methods
  const lightCandle = useCallback((data: Omit<CandleEvent, "timestamp">) => {
    socketRef.current?.emit("candle:light", data);
  }, []);

  const onCandleLit = useCallback(
    (callback: (event: CandleEvent) => void) => {
      return registerListener("candle:lit", callback);
    },
    [registerListener]
  );

  // Guestbook methods
  const postGuestbookEntry = useCallback(
    (data: Omit<GuestbookEntry, "id" | "timestamp">) => {
      socketRef.current?.emit("guestbook:post", data);
    },
    []
  );

  const onGuestbookEntry = useCallback(
    (callback: (entry: GuestbookEntry) => void) => {
      return registerListener("guestbook:new_entry", callback);
    },
    [registerListener]
  );

  // Flower methods
  const placeFlower = useCallback((data: Omit<FlowerEvent, "timestamp">) => {
    socketRef.current?.emit("flower:place", data);
  }, []);

  const onFlowerPlaced = useCallback(
    (callback: (event: FlowerEvent) => void) => {
      return registerListener("flower:placed", callback);
    },
    [registerListener]
  );

  // Visitor count
  const onVisitorCountUpdate = useCallback(
    (callback: (event: VisitorEvent) => void) => {
      return registerListener("visitor:count_update", callback);
    },
    [registerListener]
  );

  // Room management
  const joinMemorial = useCallback((id: string) => {
    socketRef.current?.emit("memorial:join", id);
  }, []);

  const leaveMemorial = useCallback((id: string) => {
    socketRef.current?.emit("memorial:leave", id);
  }, []);

  const joinCemetery = useCallback(() => {
    socketRef.current?.emit("cemetery:join");
  }, []);

  const leaveCemetery = useCallback(() => {
    socketRef.current?.emit("cemetery:leave");
  }, []);

  return {
    isConnected,
    lightCandle,
    onCandleLit,
    postGuestbookEntry,
    onGuestbookEntry,
    placeFlower,
    onFlowerPlaced,
    onVisitorCountUpdate,
    joinMemorial,
    leaveMemorial,
    joinCemetery,
    leaveCemetery,
  };
}
