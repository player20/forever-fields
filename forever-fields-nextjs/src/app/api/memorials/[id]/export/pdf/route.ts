// Memorial PDF Export API
// Generate a printable PDF of a memorial

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// PDF generation would use a library like @react-pdf/renderer or puppeteer
// For now, return a simple HTML that can be printed/saved as PDF

// GET /api/memorials/[id]/export/pdf - Generate PDF export
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "html"; // html, json
  const includePhotos = searchParams.get("photos") !== "false";
  const includeMemories = searchParams.get("memories") !== "false";
  const includeTimeline = searchParams.get("timeline") !== "false";

  // Demo data
  const demoMemorial = {
    id: memorialId,
    firstName: "Eleanor",
    lastName: "Thompson",
    birthDate: "1940-03-15",
    deathDate: "2020-11-20",
    biography: "Eleanor was a beloved mother, grandmother, and community leader. She touched countless lives with her warmth, wisdom, and unwavering love for her family.",
    profilePhotoUrl: null,
    photos: [
      { id: "1", url: "/demo/photo1.jpg", caption: "At the beach, 1985" },
      { id: "2", url: "/demo/photo2.jpg", caption: "Family reunion, 2010" },
    ],
    memories: [
      {
        id: "1",
        content: "Grandma always made the best chocolate chip cookies. I still miss the smell of her kitchen on Sunday afternoons.",
        authorName: "Sarah",
        relationship: "Granddaughter",
        createdAt: "2024-01-15",
      },
      {
        id: "2",
        content: "Mom taught me that love is shown through actions, not just words. She was there for everyone who needed her.",
        authorName: "Michael",
        relationship: "Son",
        createdAt: "2024-01-10",
      },
    ],
    events: [
      { id: "1", title: "Born in Brooklyn, NY", eventDate: "1940-03-15" },
      { id: "2", title: "Married Robert Thompson", eventDate: "1962-06-20" },
      { id: "3", title: "First child born", eventDate: "1965-08-12" },
      { id: "4", title: "Retired from teaching", eventDate: "2005-06-01" },
    ],
  };

  if (DEMO_MODE) {
    if (format === "json") {
      return NextResponse.json({
        memorial: demoMemorial,
        exportedAt: new Date().toISOString(),
      });
    }

    // Return printable HTML
    const html = generatePrintableHTML(demoMemorial, {
      includePhotos,
      includeMemories,
      includeTimeline,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="${demoMemorial.firstName}-${demoMemorial.lastName}-memorial.html"`,
      },
    });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await optionalAuth();

    // Fetch memorial with related data
    const { data: memorial, error } = await supabase
      .from("memorials")
      .select(`
        *,
        photos (id, url, caption, taken_at),
        stories (id, content, author_name, author_relationship, created_at),
        events (id, title, description, event_date)
      `)
      .eq("id", memorialId)
      .single();

    if (error || !memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Check visibility
    if (!memorial.is_public && memorial.user_id !== user?.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const memorialData = {
      id: memorial.id,
      firstName: memorial.first_name,
      lastName: memorial.last_name,
      birthDate: memorial.birth_date,
      deathDate: memorial.death_date,
      biography: memorial.biography,
      profilePhotoUrl: memorial.profile_photo_url,
      photos: memorial.photos || [],
      memories: (memorial.stories || []).map((s: { id: string; content: string; author_name: string; author_relationship: string | null; created_at: string }) => ({
        id: s.id,
        content: s.content,
        authorName: s.author_name,
        relationship: s.author_relationship,
        createdAt: s.created_at,
      })),
      events: (memorial.events || []).map((e: { id: string; title: string; event_date: string }) => ({
        id: e.id,
        title: e.title,
        eventDate: e.event_date,
      })),
    };

    if (format === "json") {
      return NextResponse.json({
        memorial: memorialData,
        exportedAt: new Date().toISOString(),
      });
    }

    const html = generatePrintableHTML(memorialData, {
      includePhotos,
      includeMemories,
      includeTimeline,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="${memorialData.firstName}-${memorialData.lastName}-memorial.html"`,
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

interface Memorial {
  firstName: string;
  lastName: string;
  birthDate: string | null;
  deathDate: string | null;
  biography: string | null;
  profilePhotoUrl: string | null;
  photos: Array<{ id: string; url: string; caption?: string | null }>;
  memories: Array<{
    id: string;
    content: string;
    authorName: string;
    relationship?: string | null;
    createdAt: string;
  }>;
  events: Array<{ id: string; title: string; eventDate: string }>;
}

function generatePrintableHTML(
  memorial: Memorial,
  options: {
    includePhotos: boolean;
    includeMemories: boolean;
    includeTimeline: boolean;
  }
): string {
  const fullName = `${memorial.firstName} ${memorial.lastName}`;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const lifespan = [
    memorial.birthDate ? formatDate(memorial.birthDate) : "",
    memorial.deathDate ? formatDate(memorial.deathDate) : "",
  ]
    .filter(Boolean)
    .join(" - ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>In Loving Memory of ${fullName}</title>
  <style>
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #fafaf8;
    }
    .header {
      text-align: center;
      padding: 40px 0;
      border-bottom: 2px solid #6b7c5e;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 32px;
      color: #4a5a3f;
      margin-bottom: 8px;
    }
    .header .dates {
      font-size: 18px;
      color: #666;
      font-style: italic;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      font-size: 20px;
      color: #4a5a3f;
      border-bottom: 1px solid #d4c9a8;
      padding-bottom: 8px;
      margin-bottom: 20px;
    }
    .biography {
      font-size: 16px;
      text-align: justify;
      line-height: 1.8;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .photo-item {
      break-inside: avoid;
    }
    .photo-item img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 8px;
    }
    .photo-item .caption {
      font-size: 12px;
      color: #666;
      text-align: center;
      margin-top: 4px;
      font-style: italic;
    }
    .memory {
      padding: 20px;
      background: #fff;
      border-left: 4px solid #6b7c5e;
      margin-bottom: 16px;
      break-inside: avoid;
    }
    .memory .content {
      font-size: 15px;
      font-style: italic;
      margin-bottom: 12px;
    }
    .memory .attribution {
      font-size: 13px;
      color: #666;
    }
    .timeline {
      position: relative;
      padding-left: 30px;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #d4c9a8;
    }
    .timeline-item {
      position: relative;
      margin-bottom: 20px;
      break-inside: avoid;
    }
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -34px;
      top: 4px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #6b7c5e;
    }
    .timeline-item .date {
      font-size: 12px;
      color: #6b7c5e;
      font-weight: bold;
    }
    .timeline-item .title {
      font-size: 15px;
    }
    .footer {
      text-align: center;
      padding: 40px 0;
      border-top: 2px solid #6b7c5e;
      margin-top: 40px;
      font-size: 12px;
      color: #888;
    }
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #6b7c5e;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }
    .print-button:hover { background: #5a6b4e; }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>

  <div class="header">
    <h1>In Loving Memory of<br>${fullName}</h1>
    ${lifespan ? `<p class="dates">${lifespan}</p>` : ""}
  </div>

  ${memorial.biography ? `
  <div class="section">
    <h2>Biography</h2>
    <p class="biography">${memorial.biography}</p>
  </div>
  ` : ""}

  ${options.includeTimeline && memorial.events.length > 0 ? `
  <div class="section">
    <h2>Life Timeline</h2>
    <div class="timeline">
      ${memorial.events
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
        .map((event) => `
          <div class="timeline-item">
            <div class="date">${formatDate(event.eventDate)}</div>
            <div class="title">${event.title}</div>
          </div>
        `).join("")}
    </div>
  </div>
  ` : ""}

  ${options.includeMemories && memorial.memories.length > 0 ? `
  <div class="section page-break">
    <h2>Shared Memories</h2>
    ${memorial.memories.map((memory) => `
      <div class="memory">
        <p class="content">"${memory.content}"</p>
        <p class="attribution">
          — ${memory.authorName}${memory.relationship ? `, ${memory.relationship}` : ""}
        </p>
      </div>
    `).join("")}
  </div>
  ` : ""}

  ${options.includePhotos && memorial.photos.length > 0 ? `
  <div class="section page-break">
    <h2>Photo Gallery</h2>
    <div class="photo-grid">
      ${memorial.photos.map((photo) => `
        <div class="photo-item">
          <img src="${photo.url}" alt="${photo.caption || "Memorial photo"}" />
          ${photo.caption ? `<p class="caption">${photo.caption}</p>` : ""}
        </div>
      `).join("")}
    </div>
  </div>
  ` : ""}

  <div class="footer">
    <p>Created with Forever Fields</p>
    <p>www.foreverfields.com</p>
  </div>
</body>
</html>`;
}
