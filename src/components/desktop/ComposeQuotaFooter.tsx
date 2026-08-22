"use client";

interface ComposeQuotaFooterProps {
  charCount: number;
  charMax: number;
  /** Accessible name for the daily counter (e.g. "Daily post count"). */
  dailyCountLabel: string;
  usedToday: number;
  dailyMax: number;
  submitLabel: string;
  /** When false, submit is disabled (empty draft, missing title, etc.). */
  canSubmit: boolean;
  onSubmit: () => void;
}

/** Shared char + UTC-day quota row for BBS / Guest Book / Comments compose. */
export function ComposeQuotaFooter({
  charCount,
  charMax,
  dailyCountLabel,
  usedToday,
  dailyMax,
  submitLabel,
  canSubmit,
  onSubmit,
}: ComposeQuotaFooterProps) {
  const atCharLimit = charCount >= charMax;
  return (
    <div className="flex items-center justify-between gap-2 border-t border-win-dark px-2 py-0.5">
      <span className="text-[11px] text-win-dark" aria-live="polite">
        <span aria-label="Character count">
          {charCount}/{charMax}
          {atCharLimit ? " (limit reached)" : ""}
        </span>
        <span aria-hidden="true"> · </span>
        <span aria-label={dailyCountLabel}>
          {usedToday}/{dailyMax} today
        </span>
      </span>
      <button
        type="button"
        className="win-raised px-3 py-0.5 disabled:opacity-50"
        disabled={!canSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={onSubmit}
      >
        {submitLabel}
      </button>
    </div>
  );
}
