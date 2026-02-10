import { NextRequest, NextResponse } from "next/server";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface SubscribeRequest {
  subscription: PushSubscriptionJSON;
  memorialId?: string;
  notificationTypes: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeRequest = await request.json();
    const { subscription, memorialId, notificationTypes } = body;

    if (!subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Demo mode - just acknowledge the subscription
    if (DEMO_MODE) {
      console.log("[Demo] Push subscription received:", {
        endpoint: subscription.endpoint.slice(0, 50) + "...",
        memorialId,
        notificationTypes,
      });

      return NextResponse.json({
        success: true,
        demo: true,
        message: "Demo mode - subscription acknowledged but not stored",
      });
    }

    // Production - store subscription in database
    const { createUntypedSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = await createUntypedSupabaseClient();

    // Get user ID if authenticated
    let userId: string | null = null;
    try {
      const { optionalAuth } = await import("@/lib/auth");
      const auth = await optionalAuth();
      userId = auth.user?.id || null;
    } catch {
      // Not authenticated, continue without user ID
    }

    // Upsert subscription (update if same endpoint exists)
    const { error: upsertError } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          expiration_time: subscription.expirationTime,
          user_id: userId,
          memorial_id: memorialId || null,
          notification_types: notificationTypes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        }
      );

    if (upsertError) {
      console.error("Failed to save push subscription:", upsertError);
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 }
      );
    }

    // If subscribing to a specific memorial, also add to memorial_subscribers
    if (memorialId) {
      await supabase.from("memorial_subscribers").upsert(
        {
          memorial_id: memorialId,
          user_id: userId,
          push_endpoint: subscription.endpoint,
          notification_types: notificationTypes,
          subscribed_at: new Date().toISOString(),
        },
        {
          onConflict: "memorial_id,push_endpoint",
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription saved successfully",
    });
  } catch (error) {
    console.error("Push subscription error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}

// Unsubscribe endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint required" },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      return NextResponse.json({
        success: true,
        demo: true,
        message: "Demo mode - unsubscribe acknowledged",
      });
    }

    const { createUntypedSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = await createUntypedSupabaseClient();

    // Remove subscription
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    if (error) {
      console.error("Failed to remove push subscription:", error);
      return NextResponse.json(
        { error: "Failed to unsubscribe" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Unsubscribed successfully",
    });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to process unsubscribe" },
      { status: 500 }
    );
  }
}
