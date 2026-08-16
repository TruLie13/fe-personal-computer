import {
  folderWindowTitle,
  uniqueFolderName,
  uniqueTextFileName,
} from "@/lib/storage";
import type { DesktopIcon } from "@/types/desktop";

function textIcon(
  id: string,
  label: string,
  parentId: string | null = null,
): DesktopIcon {
  return {
    id,
    label,
    type: "text",
    x: 0,
    y: 0,
    documentId: `doc-${id}`,
    parentId,
  };
}

describe("uniqueTextFileName", () => {
  it("keeps the base name when free among siblings", () => {
    const icons = [textIcon("a", "notes")];
    expect(uniqueTextFileName(icons, null, "story")).toBe("story");
  });

  it("suffixes when a sibling already uses the name", () => {
    const icons = [textIcon("a", "notes"), textIcon("b", "notes (2)")];
    expect(uniqueTextFileName(icons, null, "notes")).toBe("notes (3)");
  });

  it("ignores the same name in another folder", () => {
    const icons = [
      textIcon("a", "notes", "folder-1"),
      textIcon("b", "other", null),
    ];
    expect(uniqueTextFileName(icons, null, "notes")).toBe("notes");
  });

  it("excludes the icon being renamed", () => {
    const icons = [textIcon("a", "notes")];
    expect(uniqueTextFileName(icons, null, "notes", "a")).toBe("notes");
  });

  it("is case-insensitive for collisions", () => {
    const icons = [textIcon("a", "Notes")];
    expect(uniqueTextFileName(icons, null, "notes")).toBe("notes (2)");
  });

  it("strips .txt before uniquifying", () => {
    const icons = [textIcon("a", "draft")];
    expect(uniqueTextFileName(icons, null, "draft.txt")).toBe("draft (2)");
  });
});

describe("uniqueFolderName", () => {
  it("excludes self when renaming", () => {
    const icons: DesktopIcon[] = [
      {
        id: "f1",
        label: "Poems",
        type: "folder",
        x: 0,
        y: 0,
        parentId: null,
      },
    ];
    expect(uniqueFolderName(icons, "Poems", "f1")).toBe("Poems");
    expect(uniqueFolderName(icons, "Poems")).toBe("Poems (2)");
  });

  it("allows the same name in a different parent folder", () => {
    const icons: DesktopIcon[] = [
      {
        id: "f1",
        label: "New Folder",
        type: "folder",
        x: 0,
        y: 0,
        parentId: "parent-a",
      },
    ];
    expect(uniqueFolderName(icons, "New Folder", null, "parent-b")).toBe(
      "New Folder",
    );
    expect(uniqueFolderName(icons, "New Folder", null, "parent-a")).toBe(
      "New Folder (2)",
    );
  });
});

describe("folderWindowTitle", () => {
  it("joins nested folder labels with backslashes", () => {
    const icons: DesktopIcon[] = [
      {
        id: "outer",
        label: "Documents",
        type: "folder",
        x: 0,
        y: 0,
        parentId: null,
      },
      {
        id: "inner",
        label: "Poems",
        type: "folder",
        x: 0,
        y: 0,
        parentId: "outer",
      },
    ];
    expect(folderWindowTitle(icons, "outer")).toBe("Documents");
    expect(folderWindowTitle(icons, "inner")).toBe("Documents\\Poems");
  });
});
