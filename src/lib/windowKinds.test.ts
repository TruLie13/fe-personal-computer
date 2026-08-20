import {
  countsTowardOpenDocumentCap,
  MAX_OPEN_DOCUMENT_WINDOWS,
  windowKind,
} from "@/lib/windowKinds";

describe("windowKinds", () => {
  it("classifies apps vs document windows", () => {
    expect(windowKind("bbs")).toBe("app");
    expect(windowKind("network")).toBe("app");
    expect(windowKind("stories")).toBe("app");
    expect(windowKind("display")).toBe("app");
    expect(windowKind("profile")).toBe("app");
    expect(windowKind("folder")).toBe("document");
    expect(windowKind("text")).toBe("document");
    expect(windowKind("editor")).toBe("document");
  });

  it("only document kinds count toward the open-window cap", () => {
    expect(countsTowardOpenDocumentCap("bbs")).toBe(false);
    expect(countsTowardOpenDocumentCap("folder")).toBe(true);
    expect(MAX_OPEN_DOCUMENT_WINDOWS).toBe(15);
  });
});
