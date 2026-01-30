import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Default manifest configuration
const defaultManifest = {
  name: "Forever Fields - Memorial Platform",
  short_name: "Forever Fields",
  description: "Create beautiful, living tribute pages for your loved ones with AI-powered memory assistance",
  start_url: "/",
  display: "standalone",
  background_color: "#fff8f0",
  theme_color: "#a7c9a2",
  orientation: "portrait-primary",
  lang: "en-US",
  categories: ["lifestyle", "social"],
  icons: [
    {
      src: "/icons/icon-192x192.svg",
      sizes: "192x192",
      type: "image/svg+xml",
      purpose: "any",
    },
    {
      src: "/icons/icon-512x512.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "any",
    },
    {
      src: "/icons/icon-192x192.svg",
      sizes: "192x192",
      type: "image/svg+xml",
      purpose: "maskable",
    },
    {
      src: "/icons/icon-512x512.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "maskable",
    },
  ],
  shortcuts: [
    {
      name: "Dashboard",
      short_name: "Dashboard",
      description: "View your memorials",
      url: "/dashboard",
      icons: [{ src: "/icons/icon-192x192.svg", sizes: "192x192" }],
    },
    {
      name: "Create Memorial",
      short_name: "Create",
      description: "Create a new memorial",
      url: "/create",
      icons: [{ src: "/icons/icon-192x192.svg", sizes: "192x192" }],
    },
  ],
  share_target: {
    action: "/share",
    method: "POST",
    enctype: "multipart/form-data",
    params: {
      title: "title",
      text: "text",
      url: "url",
      files: [
        {
          name: "images",
          accept: ["image/*"],
        },
      ],
    },
  },
};

export async function GET(_request: NextRequest) {
  // Check for PWA icon preference in cookie
  const cookieStore = await cookies();
  const pwaIconCookie = cookieStore.get("pwa-icon-preference");

  // If no custom preference, return default manifest
  if (!pwaIconCookie?.value) {
    return NextResponse.json(defaultManifest, {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  try {
    const preference = JSON.parse(pwaIconCookie.value);
    const { memorialId, photoUrl } = preference;

    if (!memorialId || !photoUrl) {
      return NextResponse.json(defaultManifest, {
        headers: {
          "Content-Type": "application/manifest+json",
        },
      });
    }

    // Generate custom manifest with user's memorial photo as icon
    const customManifest = {
      ...defaultManifest,
      icons: [
        {
          src: `/api/pwa-icon/${memorialId}?size=192`,
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: `/api/pwa-icon/${memorialId}?size=512`,
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: `/api/pwa-icon/${memorialId}?size=192&maskable=true`,
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: `/api/pwa-icon/${memorialId}?size=512&maskable=true`,
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    };

    return NextResponse.json(customManifest, {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "no-cache", // Don't cache custom manifests
      },
    });
  } catch {
    // If parsing fails, return default
    return NextResponse.json(defaultManifest, {
      headers: {
        "Content-Type": "application/manifest+json",
      },
    });
  }
}
