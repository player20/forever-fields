import { NextResponse } from "next/server";

// Return the VAPID public key for push subscriptions
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    // In demo mode, return a placeholder that signals notifications aren't configured
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      return NextResponse.json({
        publicKey: "demo-vapid-key-notifications-not-configured",
        demo: true,
      });
    }

    return NextResponse.json(
      { error: "Push notifications not configured" },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey });
}
