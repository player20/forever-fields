// Anniversary Reminders Cron Job
// Called by scheduler (Vercel cron, external service, etc.) to send due reminders

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sender";
import { DEMO_MODE } from "@/lib/constants";

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET || "demo-secret";

// Calculate next year's reminder date
function calculateNextYearSendAt(
  currentSendAt: Date,
  _reminderDaysBefore: number
): Date {
  const nextYear = new Date(currentSendAt);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  return nextYear;
}

// POST /api/cron/anniversary-reminders - Process and send due reminders
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  if (DEMO_MODE) {
    console.log("[CronJob] Anniversary reminders - DEMO MODE");
    return NextResponse.json({
      success: true,
      message: "Demo mode - no reminders sent",
      results,
    });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const now = new Date();

    // Find all due reminders
    // Type assertion needed as anniversary_reminders may not be in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dueReminders, error: fetchError } = await (supabase as any)
      .from("anniversary_reminders")
      .select(`
        *,
        user:users (
          id,
          email,
          name
        ),
        memorial:memorials (
          id,
          first_name,
          last_name,
          birth_date,
          death_date,
          profile_photo_url,
          slug
        )
      `)
      .eq("is_enabled", true)
      .lte("next_send_at", now.toISOString())
      .not("next_send_at", "is", null);

    if (fetchError) {
      console.error("Error fetching due reminders:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch reminders", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!dueReminders || dueReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No reminders due",
        results,
      });
    }

    console.log(`[CronJob] Found ${dueReminders.length} due reminders`);

    // Process each reminder
    for (const reminder of dueReminders) {
      results.processed++;

      try {
        const user = reminder.user;
        const memorial = reminder.memorial;

        if (!user?.email || !memorial) {
          results.errors.push(`Reminder ${reminder.id}: Missing user email or memorial`);
          results.failed++;
          continue;
        }

        // Determine the anniversary date and type
        const anniversaryType = reminder.type;
        let anniversaryDate: Date | null = null;
        let dateLabel = "";

        if (anniversaryType === "birth" && memorial.birth_date) {
          anniversaryDate = new Date(memorial.birth_date);
          const age = now.getFullYear() - anniversaryDate.getFullYear();
          dateLabel = `${age}${getOrdinalSuffix(age)} birthday`;
        } else if (anniversaryType === "death" && memorial.death_date) {
          anniversaryDate = new Date(memorial.death_date);
          const years = now.getFullYear() - anniversaryDate.getFullYear();
          dateLabel = `${years}${getOrdinalSuffix(years)} anniversary of passing`;
        } else if (anniversaryType === "custom" && reminder.custom_date) {
          anniversaryDate = new Date(reminder.custom_date);
          dateLabel = reminder.custom_label || "Special day";
        }

        if (!anniversaryDate) {
          results.errors.push(`Reminder ${reminder.id}: Could not determine anniversary date`);
          results.failed++;
          continue;
        }

        // Set anniversary to this year
        anniversaryDate.setFullYear(now.getFullYear());

        // Format for display
        const formattedDate = anniversaryDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

        const daysUntil = Math.ceil(
          (anniversaryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const memorialUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://foreverfields.com"}/memorial/${memorial.slug}`;

        // Send the email
        const emailResult = await sendEmail({
          to: user.email,
          template: "anniversary_reminder",
          data: {
            recipientName: user.name || "Friend",
            memorialName: `${memorial.first_name} ${memorial.last_name}`,
            memorialUrl,
            anniversaryType: dateLabel,
            anniversaryDate: formattedDate,
            daysUntil,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        if (emailResult.success) {
          results.sent++;

          // Update reminder: set last_sent_at and calculate next year's date
          const nextSendAt = calculateNextYearSendAt(
            new Date(reminder.next_send_at),
            reminder.reminder_days_before
          );

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("anniversary_reminders")
            .update({
              last_sent_at: now.toISOString(),
              next_send_at: nextSendAt.toISOString(),
            })
            .eq("id", reminder.id);
        } else {
          results.errors.push(`Reminder ${reminder.id}: Email send failed - ${emailResult.error}`);
          results.failed++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Reminder ${reminder.id}: ${errorMessage}`);
        results.failed++;
      }
    }

    console.log(`[CronJob] Completed: ${results.sent} sent, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Anniversary reminders cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/cron/anniversary-reminders - Status check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "anniversary-reminders",
    description: "Send POST with Bearer authorization to trigger reminder processing",
    demoMode: DEMO_MODE,
  });
}

// Helper to get ordinal suffix
function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
