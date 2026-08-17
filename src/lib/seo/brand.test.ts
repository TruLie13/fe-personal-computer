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
    expect(SPOKEN_NAME).toBe("MyPC");
    expect(PRODUCT_NAME).toBe("Personal Computer");
    expect(SITE_TITLE).toBe("MyPC — Personal Computer");
    expect(TITLE_TEMPLATE).toBe("%s — MyPC");
    expect(SITE_DESCRIPTION).toContain("MyPC");
    expect(SITE_DESCRIPTION).toContain("social network for writers");
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
