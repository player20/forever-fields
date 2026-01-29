"use client";

import { Button } from "@/components/ui/Button";

export interface BreakReminderProps {
  onDismiss: () => void;
  onTakeBreak: () => void;
  sessionMinutes: number;
  messageCount: number;
  isSecondReminder?: boolean;
}

/**
 * Gentle break reminder component (non-blocking)
 *
 * Shows as a banner suggesting the user take a break.
 * User can dismiss and continue chatting.
 */
export function BreakReminder({
  onDismiss,
  onTakeBreak,
  sessionMinutes,
  messageCount,
  isSecondReminder = false,
}: BreakReminderProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <span className="text-2xl">💙</span>
        <div className="flex-1">
          <h4 className="font-medium text-blue-800">
            {isSecondReminder ? "Gentle Reminder" : "Taking Care of You"}
          </h4>
          <p className="text-sm text-blue-700 mt-1">
            {isSecondReminder ? (
              <>
                You&apos;ve been chatting for {sessionMinutes} minutes. Processing
                grief can be emotionally draining. Consider taking a short break.
              </>
            ) : (
              <>
                You&apos;ve exchanged {messageCount} messages. Taking breaks can
                help with processing difficult emotions.
              </>
            )}
          </p>
          <p className="text-xs text-blue-600 mt-2 italic">
            This is just a gentle suggestion - feel free to continue if
            you&apos;re finding this helpful.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-blue-700 hover:bg-blue-100"
            >
              Continue chatting
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onTakeBreak}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Take a break
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
