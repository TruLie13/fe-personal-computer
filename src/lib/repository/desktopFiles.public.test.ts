import { desktopFsToFileDocs } from "@/lib/repository/desktopFiles";
import type { DesktopIcon, TextDocument } from "@/types/desktop";

describe("public story mapping via desktop files", () => {
  it("carries isPublic on text file docs", () => {
    const icons: DesktopIcon[] = [
      {
        id: "file-doc-1",
        label: "Poem",
        type: "text",
        x: 10,
        y: 20,
        documentId: "doc-1",
      },
    ];
    const documents: TextDocument[] = [
      {
        id: "doc-1",
        title: "Poem",
        slug: "poem",
        content: "hello world",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        isPublic: true,
      },
    ];
    const mapped = desktopFsToFileDocs(icons, documents);
    expect(mapped.get("doc-1")?.isPublic).toBe(true);
  });
});
