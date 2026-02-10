# Memorial API Routes

This directory contains all API routes for memorial-related functionality in Forever Fields.

## Architecture Overview

### Route Structure

```
/api/memorials/
├── route.ts                      # List/create memorials
├── [id]/
│   ├── route.ts                  # Get/update/delete single memorial
│   ├── analytics/route.ts        # Memorial view/engagement analytics
│   ├── candles/route.ts          # Candle lighting feature
│   ├── donations/route.ts        # Donation management
│   ├── export/pdf/route.ts       # PDF/printable export
│   ├── guestbook/
│   │   ├── route.ts              # List/create guestbook entries
│   │   └── [entryId]/route.ts    # Update/delete entries
│   ├── merge/route.ts            # Find duplicates & merge memorials
│   ├── photos/
│   │   ├── route.ts              # List/upload photos
│   │   └── [photoId]/route.ts    # Update/delete photos
│   ├── playlist/
│   │   ├── route.ts              # List/add/reorder playlist items
│   │   └── [itemId]/route.ts     # Update/delete playlist items
│   ├── qr/route.ts               # QR code token management
│   ├── reminders/
│   │   ├── route.ts              # Anniversary reminder settings
│   │   └── [reminderId]/route.ts # Update/delete reminders
│   ├── stories/
│   │   ├── route.ts              # List/create stories/memories
│   │   └── [storyId]/route.ts    # Update/delete stories
│   ├── time-capsules/
│   │   ├── route.ts              # List/create time capsules
│   │   └── [capsuleId]/route.ts  # Update/delete capsules
│   └── videos/
│       ├── route.ts              # List/add videos
│       └── [videoId]/route.ts    # Update/delete videos
```

## Common Patterns

### Authentication

Routes use two authentication helpers from `@/lib/supabase/server`:

- `requireAuth()` - Returns `{ user }`, user is null if not authenticated (returns 401)
- `optionalAuth()` - Returns `{ user }`, user may be null (allows anonymous access)

### Demo Mode

All routes support `DEMO_MODE` (from `@/lib/constants`) for local testing:

```typescript
import { DEMO_MODE } from "@/lib/constants";

if (DEMO_MODE) {
  // Return mock data from in-memory stores
  return NextResponse.json({ ... });
}

// Real database operations
const supabase = await createServerSupabaseClient();
```

Demo stores are `Map` objects that persist during the server lifetime. They're automatically seeded with sample data on first access.

### Response Format

All API responses follow a consistent format:

**Success:**
```json
{
  "items": [...],       // For list endpoints
  "item": {...},        // For single item endpoints
  "total": 10,          // Pagination info
  "success": true       // For mutation endpoints
}
```

**Error:**
```json
{
  "error": "Human readable error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created (POST success)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (auth required)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `500` - Internal Server Error

### Route Handler Signature

All route handlers follow Next.js 14+ App Router patterns:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

## Key Features

### Analytics (`/analytics`)
Tracks page views, engagement, device types, referrers, and geographic data. Provides summary statistics and daily breakdowns.

### Candles (`/candles`)
Virtual candle lighting feature with optional messages. Candles expire after 24 hours.

### Donations (`/donations`)
Stripe-integrated donation system. Supports anonymous donations and custom causes.

### Export PDF (`/export/pdf`)
Generates printable HTML that can be saved as PDF. Includes biography, timeline, memories, and photos.

### Merge (`/merge`)
Finds potential duplicate memorials using name similarity (Levenshtein distance) and date matching. Merges photos, stories, events, and candles.

### Playlist (`/playlist`)
Tribute music from Spotify, YouTube, Apple Music, or SoundCloud. Auto-parses URLs to extract track IDs and thumbnails.

### QR Codes (`/qr`)
Generates short URL tokens for QR codes. The `/qr/[token]` page redirects to the memorial and tracks scans.

### Time Capsules (`/time-capsules`)
Messages set to unlock on a future date. Supports private (specific recipients) or public visibility.

### Videos (`/videos`)
Supports uploaded videos and embedded content from YouTube/Vimeo. Auto-extracts thumbnails for YouTube.

## Database Schema

Key tables (see `prisma/schema.prisma`):
- `memorials` - Core memorial data
- `photos`, `videos` - Media
- `stories` - Shared memories
- `candle_lightings` - Virtual candles
- `donations` - Financial contributions
- `tribute_playlist_items` - Music playlist
- `anniversary_reminders` - Email reminders
- `time_capsules` - Scheduled messages
- `analytics_events` - Engagement tracking

## Testing Locally

1. Set `DEMO_MODE=true` in `.env.local`
2. All API routes will use in-memory stores
3. Sample data is auto-seeded on first access
4. No database connection required

## Regenerating Supabase Types

If you see TypeScript errors about properties not existing on `never`:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

This regenerates database types from your actual Supabase schema.
