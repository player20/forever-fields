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

// Fetch memorial from Express API (server-side)
async function getMemorial(id: string): Promise<Memorial | null> {
  const apiUrl = process.env.API_URL || "http://localhost:3001";

  try {
    const res = await fetch(`${apiUrl}/api/memorials/${id}`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch memorial");
    }

    return res.json();
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
