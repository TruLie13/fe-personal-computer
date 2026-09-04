import {
  fileMetaTitle,
  notFoundMetaTitle,
  PRODUCT_NAME,
  profileMetaTitle,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SPOKEN_NAME,
  TITLE_TEMPLATE,
} from "@/lib/seo/brand";

describe("seo brand", () => {
  it("locks spoken and product names", () => {
    expect(SPOKEN_NAME).toBe("Teal95");
    expect(PRODUCT_NAME).toBe("Teal95");
    expect(SITE_TITLE).toBe("Teal95 — A social desktop for writers");
    expect(TITLE_TEMPLATE).toBe("%s — Teal95");
    expect(SITE_DESCRIPTION).toContain("Teal95");
    expect(SITE_DESCRIPTION).toContain("social desktop for writers");
  });

  it("builds profile and file meta titles", () => {
    expect(profileMetaTitle("Maya")).toBe("Maya's PC");
    expect(fileMetaTitle("rain-notes", "Maya")).toBe(
      "rain-notes — Maya's PC",
    );
    expect(notFoundMetaTitle("pc")).toBe("PC not found");
    expect(notFoundMetaTitle("file")).toBe("File not found");
  });
});
