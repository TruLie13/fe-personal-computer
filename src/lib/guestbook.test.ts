import {
  canSignGuestbookToday,
  clampGuestbookEntryContent,
  countGuestbookSignsOnHostUtcDay,
  GUESTBOOK_STORAGE_KEY,
  loadLocalGuestbookEntries,
  MAX_GUESTBOOK_ENTRY_CHARS,
  MAX_GUESTBOOK_SIGNS_PER_HOST_PER_UTC_DAY,
  saveLocalGuestbookEntries,
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

  it("blocks a fourth sign on the same host the same UTC day", () => {
    const day = "2026-08-20";
    const entries: GuestbookEntry[] = Array.from(
      { length: MAX_GUESTBOOK_SIGNS_PER_HOST_PER_UTC_DAY },
      (_, i) => ({
        id: String(i),
        hostUserId: "maya",
        authorId: "local",
        content: `msg ${i}`,
        createdAt: `${day}T0${i}:00:00.000Z`,
      }),
    );
    expect(
      canSignGuestbookToday(
        entries,
        "maya",
        "local",
        new Date(`${day}T20:00:00.000Z`),
      ),
    ).toBe(false);
    expect(
      canSignGuestbookToday(
        entries,
        "rex",
        "local",
        new Date(`${day}T20:00:00.000Z`),
      ),
    ).toBe(true);
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

  it("persists only entries involving the local user", () => {
    window.localStorage.clear();
    const entries: GuestbookEntry[] = [
      {
        id: "keep-author",
        hostUserId: "maya",
        authorId: "local",
        content: "hi maya",
        createdAt: "2026-08-20T10:00:00.000Z",
      },
      {
        id: "keep-host",
        hostUserId: "local",
        authorId: "maya",
        content: "hi local",
        createdAt: "2026-08-20T11:00:00.000Z",
      },
      {
        id: "drop",
        hostUserId: "maya",
        authorId: "rex",
        content: "noise",
        createdAt: "2026-08-20T12:00:00.000Z",
      },
    ];
    saveLocalGuestbookEntries(entries);
    const raw = JSON.parse(
      window.localStorage.getItem(GUESTBOOK_STORAGE_KEY)!,
    ) as GuestbookEntry[];
    expect(raw.map((entry) => entry.id).sort()).toEqual([
      "keep-author",
      "keep-host",
    ]);
    expect(loadLocalGuestbookEntries().map((entry) => entry.id).sort()).toEqual(
      ["keep-author", "keep-host"],
    );
  });
});
