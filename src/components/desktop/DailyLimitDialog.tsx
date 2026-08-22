"use client";

import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";

interface DailyLimitDialogProps {
  title: string;
  /** Noun for the capped action, e.g. "posts", "comments", "messages on this PC". */
  unitLabel: string;
  usedToday: number;
  dailyMax: number;
  onDismiss: () => void;
}

/** Shared OK dialog when a UTC-day create quota is hit. */
export function DailyLimitDialog({
  title,
  unitLabel,
  usedToday,
  dailyMax,
  onDismiss,
}: DailyLimitDialogProps) {
  return (
    <ConfirmDialog
      title={title}
      message={`You have reached the daily limit of ${dailyMax} ${unitLabel} (${usedToday}/${dailyMax}).\n\nThe limit resets at midnight UTC.`}
      confirmLabel="OK"
      showCancel={false}
      onConfirm={onDismiss}
      onCancel={onDismiss}
    />
  );
}
