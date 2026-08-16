import { buildDeleteConfirmMessage } from "@/lib/deleteConfirm";
import type { DesktopIcon } from "@/types/desktop";

describe("buildDeleteConfirmMessage", () => {
  const folder: DesktopIcon = {
    id: "folder-1",
    label: "Poems",
    type: "folder",
    x: 0,
    y: 0,
  };

  it("warns when a folder contains items", () => {
    const icons: DesktopIcon[] = [
      folder,
      {
        id: "file-1",
        label: "a",
        type: "text",
        x: 0,
        y: 0,
        documentId: "doc-1",
        parentId: "folder-1",
      },
      {
        id: "file-2",
        label: "b",
        type: "text",
        x: 0,
        y: 0,
        documentId: "doc-2",
        parentId: "folder-1",
      },
    ];

    const prompt = buildDeleteConfirmMessage(folder, icons);
    expect(prompt.title).toBe("Confirm Folder Delete");
    expect(prompt.message).toContain("2 items");
    expect(prompt.message).toContain("Poems");
  });

  it("asks a simpler question for an empty folder", () => {
    const prompt = buildDeleteConfirmMessage(folder, [folder]);
    expect(prompt.message).toContain('delete the folder "Poems"');
    expect(prompt.message).not.toContain("contains");
  });

  it("asks about a single file", () => {
    const file: DesktopIcon = {
      id: "file-1",
      label: "draft",
      type: "text",
      x: 0,
      y: 0,
      documentId: "doc-1",
    };
    const prompt = buildDeleteConfirmMessage(file, [file]);
    expect(prompt.title).toBe("Confirm File Delete");
    expect(prompt.message).toContain("draft");
  });
});
