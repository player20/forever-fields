// Socket.io event types for Forever Fields real-time features

export interface CandleEvent {
  memorialId: string;
  userId: string;
  userName: string;
  message?: string;
  duration: number; // hours the candle will burn
  timestamp: string;
}

export interface GuestbookEntry {
  id: string;
  memorialId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
}

export interface FlowerEvent {
  memorialId: string;
  userId: string;
  userName: string;
  flowerType: "rose" | "lily" | "tulip" | "daisy" | "orchid" | "sunflower";
  message?: string;
  timestamp: string;
}

export interface VisitorEvent {
  memorialId: string;
  visitorCount: number;
  timestamp: string;
}

export interface MemorialUpdate {
  memorialId: string;
  updateType: "photo_added" | "story_added" | "story_edited" | "details_updated";
  updatedBy: string;
  timestamp: string;
}

// Server -> Client events
export interface ServerToClientEvents {
  "candle:lit": (event: CandleEvent) => void;
  "candle:extinguished": (memorialId: string, candleId: string) => void;
  "guestbook:new_entry": (entry: GuestbookEntry) => void;
  "flower:placed": (event: FlowerEvent) => void;
  "visitor:count_update": (event: VisitorEvent) => void;
  "memorial:updated": (event: MemorialUpdate) => void;
  "connection:established": (data: { userId: string; connectedAt: string }) => void;
}

// Client -> Server events
export interface ClientToServerEvents {
  "candle:light": (data: Omit<CandleEvent, "timestamp">) => void;
  "guestbook:post": (data: Omit<GuestbookEntry, "id" | "timestamp">) => void;
  "flower:place": (data: Omit<FlowerEvent, "timestamp">) => void;
  "memorial:join": (memorialId: string) => void;
  "memorial:leave": (memorialId: string) => void;
  "cemetery:join": () => void;
  "cemetery:leave": () => void;
}

// Inter-server events (for Socket.io adapter)
export interface InterServerEvents {
  ping: () => void;
}

// Socket data stored with each connection
export interface SocketData {
  userId: string;
  userName: string;
  joinedMemorials: Set<string>;
}
