import { userDocFromClaim, parseUserDoc, profileFromUserDoc } from "@/lib/repository/userDoc";

describe("userDoc mapping", () => {
  it("builds a profile doc from a username claim", () => {
    const doc = userDocFromClaim({
      uid: "uid-1",
      username: "ada",
      email: "ada@example.com",
      displayName: "Ada",
    });
    expect(doc.username).toBe("ada");
    expect(doc.displayName).toBe("Ada");
    expect(doc.computerName).toBe("ADA-PC");
    expect(doc.avatarUrl).toBeNull();
  });

  it("parses Firestore payloads including Timestamp-like createdAt", () => {
    const parsed = parseUserDoc({
      username: "ada",
      displayName: "Ada",
      computerName: "ADA-PC",
      bio: "hello",
      avatarColor: "#000080",
      avatarUrl: null,
      wallpaper: "#008080",
      titleBarColor: "#000080",
      contentDark: false,
      createdAt: { toDate: () => new Date("2026-01-01T00:00:00.000Z") },
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(parsed?.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(parsed?.updatedAt).toBe("2026-01-02T00:00:00.000Z");
    expect(profileFromUserDoc(parsed!)).toMatchObject({
      displayName: "Ada",
      computerName: "ADA-PC",
      bio: "hello",
    });
  });

  it("returns null for invalid payloads", () => {
    expect(parseUserDoc(null)).toBeNull();
    expect(parseUserDoc({ displayName: "Ada" })).toBeNull();
  });
});
