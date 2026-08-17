import {
  ensureDocumentSlugs,
  isReservedFileSlug,
  slugifyTitle,
  uniqueDocumentSlug,
} from "@/lib/seo/slugs";

describe("slugifyTitle", () => {
  it("normalizes titles into URL slugs", () => {
    expect(slugifyTitle("Window Seat")).toBe("window-seat");
    expect(slugifyTitle("notes.txt")).toBe("notes");
    expect(slugifyTitle("  ")).toBe("untitled");
  });
});

describe("uniqueDocumentSlug", () => {
  it("avoids collisions and reserved names", () => {
    expect(uniqueDocumentSlug("welcome", [])).toBe("welcome");
    expect(uniqueDocumentSlug("welcome", ["welcome"])).toBe("welcome-2");
    expect(isReservedFileSlug("desktop")).toBe(true);
    expect(uniqueDocumentSlug("desktop", [])).toBe("desktop-file");
    expect(uniqueDocumentSlug("desktop", ["desktop-file"])).toBe(
      "desktop-file-2",
    );
  });
});

describe("ensureDocumentSlugs", () => {
  it("fills missing slugs and preserves stable ones", () => {
    const docs = ensureDocumentSlugs([
      { title: "rain-notes", slug: "rain-notes" },
      { title: "New Doc" },
      { title: "desktop" },
    ]);
    expect(docs[0]?.slug).toBe("rain-notes");
    expect(docs[1]?.slug).toBe("new-doc");
    expect(docs[2]?.slug).toBe("desktop-file");
  });
});
