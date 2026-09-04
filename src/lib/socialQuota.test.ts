import {
  assertWithinDailyQuota,
  isWithinDailyQuota,
  QuotaExceededError,
  quotaMax,
} from "@/lib/socialQuota";
import { CONTENT_LIMITS } from "@/lib/contentLimits";
import { utcDayKey, utcDayRange } from "@/lib/utcDay";

describe("socialQuota", () => {
  it("maps kinds to CONTENT_LIMITS daily caps", () => {
    expect(quotaMax("bbs")).toBe(CONTENT_LIMITS.bbsNotesPerUtcDay);
    expect(quotaMax("storyComment")).toBe(
      CONTENT_LIMITS.storyCommentsPerUtcDay,
    );
    expect(quotaMax("guestbook")).toBe(
      CONTENT_LIMITS.guestbookSignsPerHostPerUtcDay,
    );
  });

  it("allows creates under the cap and rejects at the cap", () => {
    expect(isWithinDailyQuota(0, 5)).toBe(true);
    expect(isWithinDailyQuota(4, 5)).toBe(true);
    expect(isWithinDailyQuota(5, 5)).toBe(false);
    expect(() => assertWithinDailyQuota("bbs", 5)).toThrow(QuotaExceededError);
  });
});

describe("utcDay", () => {
  it("formats UTC day keys and ranges", () => {
    expect(utcDayKey("2026-09-04T01:00:00.000Z")).toBe("2026-09-04");
    const range = utcDayRange("2026-09-04");
    expect(range.startIso).toBe("2026-09-04T00:00:00.000Z");
    expect(range.endExclusiveIso).toBe("2026-09-05T00:00:00.000Z");
  });
});
