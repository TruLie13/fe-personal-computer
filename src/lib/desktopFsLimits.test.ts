import {
  assertDesktopFsWithinLimits,
  DesktopFsLimitError,
  publicStoryExcerpt,
} from "@/lib/desktopFsLimits";
import { CONTENT_LIMITS } from "@/lib/contentLimits";
import type { DesktopIcon, TextDocument } from "@/types/desktop";

function textDoc(id: string): TextDocument {
  return {
    id,
    title: `Doc ${id}`,
    slug: id,
    content: "hi",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("desktopFsLimits", () => {
  it("accepts a desktop within caps", () => {
    const icons: DesktopIcon[] = [
      { id: "documents", label: "Documents", type: "folder", x: 0, y: 0 },
    ];
    expect(() =>
      assertDesktopFsWithinLimits(icons, [textDoc("a")]),
    ).not.toThrow();
  });

  it("rejects too many text files", () => {
    const docs = Array.from({ length: CONTENT_LIMITS.textFilesPerUser + 1 }, (_, i) =>
      textDoc(`d${i}`),
    );
    expect(() => assertDesktopFsWithinLimits([], docs)).toThrow(
      DesktopFsLimitError,
    );
  });

  it("rejects oversized content", () => {
    const doc = textDoc("big");
    doc.content = "x".repeat(CONTENT_LIMITS.textFileChars + 1);
    expect(() => assertDesktopFsWithinLimits([], [doc])).toThrow(
      DesktopFsLimitError,
    );
  });

  it("builds a short public story excerpt", () => {
    expect(publicStoryExcerpt("  hello   world  ")).toBe("hello world");
    expect(publicStoryExcerpt("a".repeat(250)).endsWith("…")).toBe(true);
  });
});
