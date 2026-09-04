/** `YYYY-MM-DD` for the given instant in UTC. */
export function utcDayKey(isoOrDate: string | Date = new Date()): string {
  const date =
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

/** Inclusive start / exclusive end ISO bounds for a UTC calendar day. */
export function utcDayRange(
  dayKey: string = utcDayKey(),
): { startIso: string; endExclusiveIso: string } {
  const start = new Date(`${dayKey}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return {
    startIso: start.toISOString(),
    endExclusiveIso: end.toISOString(),
  };
}
