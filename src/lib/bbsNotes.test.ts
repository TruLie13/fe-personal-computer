import {
  canPostBbsNoteToday,
  clampBbsNoteContent,
  clampBbsNoteTitle,
  countBbsNotesOnUtcDay,
  MAX_BBS_NOTE_CHARS,
  MAX_BBS_NOTE_TITLE_CHARS,
  MAX_BBS_NOTES_PER_UTC_DAY,
  utcDayKey,
} from "@/lib/bbsNotes";

describe("bbsNotes limits", () => {
  it("builds a UTC day key", () => {
    expect(utcDayKey("2026-08-20T23:59:59.000Z")).toBe("2026-08-20");
    expect(utcDayKey("2026-08-21T00:00:00.000Z")).toBe("2026-08-21");
  });

  it("clamps title and body", () => {
    expect(clampBbsNoteTitle("a".repeat(MAX_BBS_NOTE_TITLE_CHARS + 10))).toHaveLength(
      MAX_BBS_NOTE_TITLE_CHARS,
    );
    expect(clampBbsNoteContent("x".repeat(MAX_BBS_NOTE_CHARS + 50))).toHaveLength(
      MAX_BBS_NOTE_CHARS,
    );
  });

  it("counts notes for the UTC day and gates posting", () => {
    const day = "2026-08-20";
    const notes = Array.from({ length: MAX_BBS_NOTES_PER_UTC_DAY }, (_, i) => ({
      createdAt: `${day}T0${i}:00:00.000Z`,
    }));
    expect(countBbsNotesOnUtcDay(notes, day)).toBe(MAX_BBS_NOTES_PER_UTC_DAY);
    expect(canPostBbsNoteToday(notes, new Date(`${day}T12:00:00.000Z`))).toBe(
      false,
    );
    expect(
      canPostBbsNoteToday(notes, new Date("2026-08-21T00:00:00.000Z")),
    ).toBe(true);
  });

  it("still counts soft-deleted posts toward the daily create quota", () => {
    const day = "2026-08-20";
    const notes = Array.from({ length: MAX_BBS_NOTES_PER_UTC_DAY }, (_, i) => ({
      createdAt: `${day}T0${i}:00:00.000Z`,
      deletedAt: `${day}T12:00:00.000Z`,
    }));
    expect(countBbsNotesOnUtcDay(notes, day)).toBe(MAX_BBS_NOTES_PER_UTC_DAY);
    expect(canPostBbsNoteToday(notes, new Date(`${day}T18:00:00.000Z`))).toBe(
      false,
    );
  });
});
