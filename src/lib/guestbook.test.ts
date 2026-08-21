import {
  canSignGuestbookToday,
  clampGuestbookEntryContent,
  countGuestbookSignsOnHostUtcDay,
  MAX_GUESTBOOK_ENTRY_CHARS,
  MAX_GUESTBOOK_SIGNS_PER_HOST_PER_UTC_DAY,
} from "@/lib/guestbook";
import { mergeGuestbookOldestFirst } from "@/lib/networkSeed";
import type { GuestbookEntry } from "@/types/network";

describe("guestbook limits", () => {
  it("clamps entry content", () => {
    const long = "x".repeat(MAX_GUESTBOOK_ENTRY_CHARS + 40);
    expect(clampGuestbookEntryContent(long)).toHaveLength(
      MAX_GUESTBOOK_ENTRY_CHARS,
    );
  });

  it("counts signs per host per UTC day", () => {
    const entries: GuestbookEntry[] = [
      {
        id: "1",
        hostUserId: "maya",
        authorId: "local",
        content: "a",
        createdAt: "2026-08-20T10:00:00.000Z",
      },
      {
        id: "2",
        hostUserId: "maya",
        authorId: "local",
        content: "b",
        createdAt: "2026-08-20T12:00:00.000Z",
      },
      {
        id: "3",
        hostUserId: "rex",
        authorId: "local",
        content: "c",
        createdAt: "2026-08-20T12:00:00.000Z",
      },
    ];
    expect(
      countGuestbookSignsOnHostUtcDay(entries, "maya", "local", "2026-08-20"),
    ).toBe(2);
    expect(
      canSignGuestbookToday(
        entries,
        "maya",
        "local",
        new Date("2026-08-20T15:00:00.000Z"),
      ),
    ).toBe(MAX_GUESTBOOK_SIGNS_PER_HOST_PER_UTC_DAY > 2);
  });

  it("merges seed and local, hiding soft-deleted seed", () => {
    const tombstone: GuestbookEntry = {
      id: "gb-rex-on-maya",
      hostUserId: "maya",
      authorId: "rex",
      content: "gone",
      createdAt: "2026-08-12T16:30:00.000Z",
      deletedAt: "2026-08-20T01:00:00.000Z",
    };
    const live = mergeGuestbookOldestFirst("maya", []);
    expect(live.some((entry) => entry.id === "gb-rex-on-maya")).toBe(true);
    const after = mergeGuestbookOldestFirst("maya", [tombstone]);
    expect(after.some((entry) => entry.id === "gb-rex-on-maya")).toBe(false);
  });
});
