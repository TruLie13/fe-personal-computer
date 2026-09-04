import {
  bbsPostFromFirestoreFields,
  favoriteFromFirestoreDoc,
} from "@/lib/repository/socialMapping";

describe("socialMapping", () => {
  it("maps favorite docs", () => {
    expect(favoriteFromFirestoreDoc("maya", "2026-01-01T00:00:00.000Z")).toEqual({
      userId: "maya",
      addedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("maps bbs notes with username as authorId", () => {
    expect(
      bbsPostFromFirestoreFields({
        id: "n1",
        username: "ada",
        title: "Hello",
        body: "World",
        createdAt: "2026-01-01T00:00:00.000Z",
        deletedAt: null,
      }),
    ).toEqual({
      id: "n1",
      authorId: "ada",
      title: "Hello",
      content: "World",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });
});
