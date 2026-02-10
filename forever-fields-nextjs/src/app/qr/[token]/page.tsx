// QR Code Redirect Page
// Redirects short QR URLs to full memorial pages with analytics tracking

import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";

interface QRRedirectPageProps {
  params: Promise<{ token: string }>;
}

// Demo tokens for testing
const demoTokens: Record<string, string> = {
  "demo1234": "demo-memorial-1",
  "test5678": "demo-memorial-2",
};

export default async function QRRedirectPage({ params }: QRRedirectPageProps) {
  const { token } = await params;
  const headersList = await headers();

  // Get visitor info for analytics
  const userAgent = headersList.get("user-agent") || "";

  let memorialId: string | null = null;

  if (DEMO_MODE) {
    // Check demo tokens
    memorialId = demoTokens[token] || null;

    // For demo, also accept any token and redirect to demo memorial
    if (!memorialId && token.length >= 6) {
      memorialId = "demo-memorial-1";
    }
  } else {
    try {
      const supabase = await createServerSupabaseClient();

      // Look up memorial by QR token
      const { data: memorial, error } = await supabase
        .from("memorials")
        .select("id")
        .eq("qr_code_token", token)
        .single();

      if (!error && memorial) {
        memorialId = memorial.id;
      }
    } catch (error) {
      console.error("QR lookup error:", error);
    }
  }

  if (!memorialId) {
    notFound();
  }

  // Track the QR scan event
  try {
    await trackEvent({
      memorialId,
      eventType: "qr_scanned",
      referrer: "qr_code",
      userAgent,
      metadata: {
        token,
        scanTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Don't fail redirect if tracking fails
    console.error("Failed to track QR scan:", error);
  }

  // Redirect to the memorial page with QR source parameter
  redirect(`/memorial/${memorialId}?source=qr`);
}

// Metadata for the redirect page (shown briefly during redirect)
export async function generateMetadata({ params: _params }: QRRedirectPageProps) {
  return {
    title: "Redirecting to Memorial | Forever Fields",
    description: "Redirecting you to the memorial page...",
    robots: {
      index: false,
      follow: false,
    },
  };
}
