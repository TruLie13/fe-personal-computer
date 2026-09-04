import { CONTENT_LIMITS } from "@/lib/contentLimits";

export type SocialQuotaKind = "bbs" | "storyComment" | "guestbook";

const QUOTA_MAX: Record<SocialQuotaKind, number> = {
  bbs: CONTENT_LIMITS.bbsNotesPerUtcDay,
  storyComment: CONTENT_LIMITS.storyCommentsPerUtcDay,
  guestbook: CONTENT_LIMITS.guestbookSignsPerHostPerUtcDay,
};

export function quotaMax(kind: SocialQuotaKind): number {
  return QUOTA_MAX[kind];
}

export function isWithinDailyQuota(used: number, max: number): boolean {
  return used >= 0 && used < max;
}

export function assertWithinDailyQuota(
  kind: SocialQuotaKind,
  used: number,
): void {
  const max = quotaMax(kind);
  if (!isWithinDailyQuota(used, max)) {
    throw new QuotaExceededError(kind, used, max);
  }
}

export class QuotaExceededError extends Error {
  readonly kind: SocialQuotaKind;
  readonly used: number;
  readonly max: number;

  constructor(kind: SocialQuotaKind, used: number, max: number) {
    super(
      `Daily ${kind} quota exceeded (${used}/${max}). Resets at midnight UTC.`,
    );
    this.name = "QuotaExceededError";
    this.kind = kind;
    this.used = used;
    this.max = max;
  }
}

export function isQuotaExceededError(
  value: unknown,
): value is QuotaExceededError {
  return value instanceof QuotaExceededError;
}
