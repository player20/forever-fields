import { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemorialView } from "./MemorialView";

// Types matching your Prisma schema
interface Memorial {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  deathDate: string | null;
  biography: string | null;
  profilePhotoUrl: string | null;
  coverPhotoUrl: string | null;
  theme: string;
  isPublic: boolean;
  settings: Record<string, unknown>;
  user: {
    id: string;
    name: string | null;
  };
  photos: Array<{
    id: string;
    url: string;
    caption: string | null;
    takenAt: string | null;
  }>;
  memories: Array<{
    id: string;
    content: string;
    authorName: string;
    relationship: string | null;
    createdAt: string;
  }>;
  candles: Array<{
    id: string;
    message: string | null;
    lighterName: string | null;
    createdAt: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    eventDate: string;
  }>;
}

// Fetch memorial from API (server-side)
async function getMemorial(id: string): Promise<Memorial | null> {
  // Use internal Next.js API for demo mode, external API otherwise
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apiUrl = process.env.API_URL;

  // In demo mode or if no external API, use internal Next.js API routes
  const baseUrl = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !apiUrl
    ? appUrl
    : apiUrl;

  try {
    const res = await fetch(`${baseUrl}/api/memorials/${id}`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
      cache: process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? "no-store" : "default",
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch memorial");
    }

    const data = await res.json();

    // Handle different response formats (API may wrap in { memorial: ... })
    const rawMemorial = data.memorial || data;

    // Transform snake_case API response to camelCase for component
    return {
      id: rawMemorial.id,
      slug: rawMemorial.slug,
      firstName: rawMemorial.first_name || rawMemorial.firstName,
      lastName: rawMemorial.last_name || rawMemorial.lastName,
      birthDate: rawMemorial.birth_date || rawMemorial.birthDate,
      deathDate: rawMemorial.death_date || rawMemorial.deathDate,
      biography: rawMemorial.obituary || rawMemorial.biography,
      profilePhotoUrl: rawMemorial.profile_photo_url || rawMemorial.profilePhotoUrl,
      coverPhotoUrl: rawMemorial.cover_photo_url || rawMemorial.coverPhotoUrl,
      theme: rawMemorial.theme || "garden",
      isPublic: rawMemorial.is_public ?? rawMemorial.isPublic ?? true,
      settings: rawMemorial.settings || {},
      user: rawMemorial.user || { id: rawMemorial.user_id, name: null },
      photos: (rawMemorial.photos || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        url: p.url,
        caption: p.caption,
        takenAt: p.taken_at || p.takenAt,
      })),
      memories: (rawMemorial.stories || rawMemorial.memories || []).map((m: Record<string, unknown>) => ({
        id: m.id,
        content: m.content,
        authorName: m.author || m.author_name || m.authorName || "Anonymous",
        relationship: m.relationship || m.author_relationship,
        createdAt: m.created_at || m.createdAt,
      })),
      candles: (rawMemorial.candle_lightings || rawMemorial.candles || []).map((c: Record<string, unknown>) => ({
        id: c.id,
        message: c.message,
        lighterName: c.name || c.lighter_name || c.lighterName,
        createdAt: c.lit_at || c.created_at || c.createdAt,
      })),
      events: rawMemorial.events || [],
    };
  } catch (error) {
    console.error("Error fetching memorial:", error);
    return null;
  }
}

// Dynamic metadata for SEO and social sharing
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const memorial = await getMemorial(params.id);

  if (!memorial) {
    return {
      title: "Memorial Not Found | Forever Fields",
    };
  }

  const fullName = `${memorial.firstName} ${memorial.lastName}`;
  const lifespan = memorial.birthDate && memorial.deathDate
    ? `${new Date(memorial.birthDate).getFullYear()} - ${new Date(memorial.deathDate).getFullYear()}`
    : "";

  const description = memorial.biography
    ? memorial.biography.slice(0, 160) + "..."
    : `Celebrating the life of ${fullName}${lifespan ? ` (${lifespan})` : ""}. Share memories, light candles, and honor their legacy.`;

  // Dynamic OG image URL
  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/og/memorial/${memorial.id}`;

  return {
    title: `${fullName} | Forever Fields Memorial`,
    description,
    openGraph: {
      title: `Remembering ${fullName}`,
      description,
      type: "profile",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Memorial for ${fullName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Remembering ${fullName}`,
      description,
      images: [ogImageUrl],
    },
  };
}

// SSR Memorial Page
export default async function MemorialPage({
  params,
}: {
  params: { id: string };
}) {
  const memorial = await getMemorial(params.id);

  if (!memorial) {
    notFound();
  }

  // Structured data for SEO (Person schema)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `${memorial.firstName} ${memorial.lastName}`,
    birthDate: memorial.birthDate,
    deathDate: memorial.deathDate,
    image: memorial.profilePhotoUrl,
    description: memorial.biography,
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <MemorialView memorial={memorial} />
    </>
  );
}
