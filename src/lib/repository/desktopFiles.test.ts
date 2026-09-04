import {
  defaultDocumentsFolderDoc,
  desktopFsToFileDocs,
  DOCUMENTS_FOLDER_ID,
  fileDocsToDesktopFs,
  isPersistedFsIcon,
  parseFirestoreFileDoc,
} from "@/lib/repository/desktopFiles";
import type { DesktopIcon, TextDocument } from "@/types/desktop";

describe("desktopFiles mapping", () => {
  it("maps text + folder icons to Firestore docs keyed by file id", () => {
    const icons: DesktopIcon[] = [
      {
        id: DOCUMENTS_FOLDER_ID,
        label: "Documents",
        type: "folder",
        x: 16,
        y: 112,
      },
      {
        id: "folder-1",
        label: "Drafts",
        type: "folder",
        x: 120,
        y: 20,
        parentId: null,
      },
      {
        id: "file-doc-1",
        label: "Poem",
        type: "text",
        x: 40,
        y: 40,
        documentId: "doc-1",
        parentId: "folder-1",
      },
      {
        id: "notepad",
        label: "Notepad",
        type: "editor",
        x: 16,
        y: 208,
      },
    ];
    const documents: TextDocument[] = [
      {
        id: "doc-1",
        title: "Poem",
        slug: "poem",
        content: "hello",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ];

    const mapped = desktopFsToFileDocs(icons, documents);
    expect(mapped.has("notepad")).toBe(false);
    expect(mapped.get(DOCUMENTS_FOLDER_ID)?.type).toBe("folder");
    expect(mapped.get("folder-1")).toMatchObject({
      type: "folder",
      title: "Drafts",
    });
    expect(mapped.get("doc-1")).toMatchObject({
      type: "text",
      title: "Poem",
      slug: "poem",
      content: "hello",
      parentId: "folder-1",
      desktopX: 40,
      desktopY: 40,
    });
  });

  it("round-trips Firestore files into icons + documents", () => {
    const snap = fileDocsToDesktopFs([
      {
        id: DOCUMENTS_FOLDER_ID,
        data: defaultDocumentsFolderDoc("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "doc-9",
        data: {
          type: "text",
          title: "Notes",
          slug: "notes",
          content: "body",
          parentId: DOCUMENTS_FOLDER_ID,
          desktopX: 10,
          desktopY: 20,
          isPublic: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    ]);

    expect(snap.documents).toEqual([
      expect.objectContaining({ id: "doc-9", slug: "notes", content: "body" }),
    ]);
    expect(snap.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: DOCUMENTS_FOLDER_ID, type: "folder" }),
        expect.objectContaining({
          id: "file-doc-9",
          documentId: "doc-9",
          parentId: DOCUMENTS_FOLDER_ID,
        }),
      ]),
    );
  });

  it("parses Firestore payloads and recognizes persisted icons", () => {
    expect(
      parseFirestoreFileDoc({
        type: "text",
        title: "A",
        slug: "a",
        parentId: null,
        desktopX: 1,
        desktopY: 2,
        isPublic: false,
      }),
    ).toMatchObject({ type: "text", title: "A", slug: "a" });

    expect(
      isPersistedFsIcon({
        id: "notepad",
        label: "Notepad",
        type: "editor",
        x: 0,
        y: 0,
      }),
    ).toBe(false);
    expect(
      isPersistedFsIcon({
        id: DOCUMENTS_FOLDER_ID,
        label: "Documents",
        type: "folder",
        x: 0,
        y: 0,
      }),
    ).toBe(true);
  });
});
