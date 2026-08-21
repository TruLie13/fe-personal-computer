import {
  canPostStoryCommentToday,
  clampStoryCommentContent,
  countStoryCommentsOnUtcDay,
  MAX_STORY_COMMENT_CHARS,
  MAX_STORY_COMMENTS_PER_UTC_DAY,
} from "@/lib/storyComments";

describe("storyComments limits", () => {
  it("clamps comment body", () => {
    expect(
      clampStoryCommentContent("x".repeat(MAX_STORY_COMMENT_CHARS + 50)),
    ).toHaveLength(MAX_STORY_COMMENT_CHARS);
  });

  it("counts comments for the UTC day and gates posting", () => {
    const day = "2026-08-20";
    const comments = Array.from(
      { length: MAX_STORY_COMMENTS_PER_UTC_DAY },
      (_, i) => ({
        createdAt: `${day}T${String(i).padStart(2, "0")}:00:00.000Z`,
      }),
    );
    expect(countStoryCommentsOnUtcDay(comments, day)).toBe(
      MAX_STORY_COMMENTS_PER_UTC_DAY,
    );
    expect(
      canPostStoryCommentToday(comments, new Date(`${day}T12:00:00.000Z`)),
    ).toBe(false);
    expect(
      canPostStoryCommentToday(
        comments,
        new Date("2026-08-21T00:00:00.000Z"),
      ),
    ).toBe(true);
  });
});
