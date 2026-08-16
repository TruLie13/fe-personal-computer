import { formatShortDateTime } from "@/lib/formatDate";

describe("formatShortDateTime", () => {
  it("returns the original string when the date is invalid", () => {
    expect(formatShortDateTime("not-a-date")).toBe("not-a-date");
  });

  it("formats a valid ISO timestamp", () => {
    const formatted = formatShortDateTime("2026-03-15T14:30:00.000Z");
    expect(formatted).not.toBe("2026-03-15T14:30:00.000Z");
    expect(formatted.length).toBeGreaterThan(0);
  });
});
