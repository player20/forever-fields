import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

interface RouteParams {
  params: Promise<{ memorialId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { memorialId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const size = searchParams.get("size") || "192";

  // Get the photo URL from cookie preference
  const cookieStore = await cookies();
  const pwaIconCookie = cookieStore.get("pwa-icon-preference");

  if (!pwaIconCookie?.value) {
    // Redirect to default icon
    return NextResponse.redirect(new URL(`/icons/icon-${size}x${size}.svg`, request.url));
  }

  try {
    const preference = JSON.parse(pwaIconCookie.value);

    // Verify the memorialId matches
    if (preference.memorialId !== memorialId || !preference.photoUrl) {
      return NextResponse.redirect(new URL(`/icons/icon-${size}x${size}.svg`, request.url));
    }

    let imageUrl = preference.photoUrl;

    // If using Cloudinary, add transformations for size and circular crop
    if (imageUrl.includes("cloudinary.com")) {
      // Cloudinary URL transformation for circular crop and resize
      // Example: https://res.cloudinary.com/demo/image/upload/w_192,h_192,c_fill,g_face,r_max/sample.jpg
      const sizeNum = parseInt(size, 10);
      imageUrl = imageUrl.replace(
        "/upload/",
        `/upload/w_${sizeNum},h_${sizeNum},c_fill,g_face,r_max,f_png/`
      );
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!imageResponse.ok) {
      return NextResponse.redirect(new URL(`/icons/icon-${size}x${size}.svg`, request.url));
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch {
    // On error, redirect to default icon
    return NextResponse.redirect(new URL(`/icons/icon-${size}x${size}.svg`, request.url));
  }
}
