// Reset demo data to defaults
// Only available in demo mode

import { NextResponse } from "next/server";
import { DEMO_MODE } from "@/lib/constants";
import { resetDemoData } from "@/lib/demo-store";

export async function POST() {
  if (!DEMO_MODE) {
    return NextResponse.json(
      { error: "This endpoint is only available in demo mode" },
      { status: 403 }
    );
  }

  try {
    resetDemoData();
    return NextResponse.json({
      success: true,
      message: "Demo data has been reset to defaults",
    });
  } catch (error) {
    console.error("Error resetting demo data:", error);
    return NextResponse.json(
      { error: "Failed to reset demo data" },
      { status: 500 }
    );
  }
}
