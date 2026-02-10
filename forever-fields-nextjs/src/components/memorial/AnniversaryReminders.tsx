"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Bell, BellOff, Calendar, Plus, Trash2, X } from "lucide-react";

interface Reminder {
  id: string;
  type: "birth" | "death" | "custom";
  customDate?: string | null;
  customLabel?: string | null;
  reminderDaysBefore: number;
  isEnabled: boolean;
  nextSendAt?: string | null;
}

interface AnniversaryRemindersProps {
  memorialId: string;
  memorialName: string;
  birthDate?: string | null;
  deathDate?: string | null;
  className?: string;
}

export function AnniversaryReminders({
  memorialId,
  memorialName: _memorialName,
  birthDate,
  deathDate,
  className,
}: AnniversaryRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New reminder form state
  const [newType, setNewType] = useState<"birth" | "death" | "custom">("death");
  const [newDaysBefore, setNewDaysBefore] = useState(7);
  const [newCustomDate, setNewCustomDate] = useState("");
  const [newCustomLabel, setNewCustomLabel] = useState("");

  const fetchReminders = useCallback(async () => {
    try {
      const response = await fetch(`/api/memorials/${memorialId}/reminders`);
      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  }, [memorialId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleAddReminder = async () => {
    if (newType === "custom" && !newCustomDate) {
      toast.error("Please select a date for the custom reminder");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/memorials/${memorialId}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          reminderDaysBefore: newDaysBefore,
          ...(newType === "custom" && {
            customDate: newCustomDate,
            customLabel: newCustomLabel || undefined,
          }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create reminder");
      }

      const { reminder } = await response.json();
      setReminders((prev) => [...prev, reminder]);
      toast.success("Reminder created!");
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create reminder");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReminder = async (reminder: Reminder) => {
    try {
      const response = await fetch(
        `/api/memorials/${memorialId}/reminders/${reminder.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isEnabled: !reminder.isEnabled }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update reminder");
      }

      setReminders((prev) =>
        prev.map((r) =>
          r.id === reminder.id ? { ...r, isEnabled: !r.isEnabled } : r
        )
      );

      toast.success(reminder.isEnabled ? "Reminder paused" : "Reminder enabled");
    } catch {
      toast.error("Failed to update reminder");
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      const response = await fetch(
        `/api/memorials/${memorialId}/reminders/${reminderId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete reminder");
      }

      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
      toast.success("Reminder deleted");
    } catch {
      toast.error("Failed to delete reminder");
    }
  };

  const resetForm = () => {
    setNewType("death");
    setNewDaysBefore(7);
    setNewCustomDate("");
    setNewCustomLabel("");
  };

  const getTypeLabel = (type: string, customLabel?: string | null) => {
    switch (type) {
      case "birth":
        return "Birthday";
      case "death":
        return "Anniversary of Passing";
      case "custom":
        return customLabel || "Custom Date";
      default:
        return type;
    }
  };

  const getNextReminderText = (reminder: Reminder) => {
    if (!reminder.nextSendAt) return "Date not set";
    const date = new Date(reminder.nextSendAt);
    const now = new Date();
    const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 0) return "Overdue";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days < 7) return `In ${days} days`;
    if (days < 30) return `In ${Math.ceil(days / 7)} weeks`;
    return date.toLocaleDateString();
  };

  // Check which reminder types are available
  const availableTypes: Array<{ value: "birth" | "death" | "custom"; label: string; disabled: boolean }> = [
    { value: "birth", label: "Birthday", disabled: !birthDate || reminders.some((r) => r.type === "birth") },
    { value: "death", label: "Anniversary of Passing", disabled: !deathDate || reminders.some((r) => r.type === "death") },
    { value: "custom", label: "Custom Date", disabled: false },
  ];

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-sage border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-sage" />
            Anniversary Reminders
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <BellOff className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No reminders set</p>
              <p className="text-xs mt-1">
                Get notified before important dates
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    reminder.isEnabled
                      ? "bg-sage-pale/30 border-sage-light"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleReminder(reminder)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        reminder.isEnabled
                          ? "bg-sage text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {reminder.isEnabled ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {getTypeLabel(reminder.type, reminder.customLabel)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reminder.reminderDaysBefore} day
                        {reminder.reminderDaysBefore !== 1 ? "s" : ""} before •{" "}
                        {getNextReminderText(reminder)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Reminder
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Reminder Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Type
                </label>
                <div className="space-y-2">
                  {availableTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        newType === type.value
                          ? "border-sage bg-sage-pale/30"
                          : "border-gray-200 hover:border-sage-light"
                      } ${type.disabled && type.value !== "custom" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        name="reminderType"
                        value={type.value}
                        checked={newType === type.value}
                        onChange={(e) => setNewType(e.target.value as typeof newType)}
                        disabled={type.disabled && type.value !== "custom"}
                        className="sr-only"
                      />
                      <Calendar className="w-4 h-4 text-sage mr-3" />
                      <span className="text-sm text-gray-700">{type.label}</span>
                      {type.disabled && type.value !== "custom" && (
                        <span className="ml-auto text-xs text-gray-400">
                          {reminders.some((r) => r.type === type.value) ? "Already set" : "No date"}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Date Fields */}
              {newType === "custom" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newCustomDate}
                      onChange={(e) => setNewCustomDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label (optional)
                    </label>
                    <input
                      type="text"
                      value={newCustomLabel}
                      onChange={(e) => setNewCustomLabel(e.target.value)}
                      placeholder="e.g., Wedding Anniversary"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage"
                    />
                  </div>
                </>
              )}

              {/* Days Before */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remind me
                </label>
                <select
                  value={newDaysBefore}
                  onChange={(e) => setNewDaysBefore(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage"
                >
                  <option value={1}>1 day before</option>
                  <option value={3}>3 days before</option>
                  <option value={7}>1 week before</option>
                  <option value={14}>2 weeks before</option>
                  <option value={30}>1 month before</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddReminder}
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Create Reminder"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
