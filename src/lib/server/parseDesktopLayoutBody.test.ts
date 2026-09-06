/**
 * @jest-environment node
 */
import { DOCUMENTS_FOLDER_ID } from "@/lib/repository/desktopFiles";
import {
  DesktopLayoutPayloadError,
  parseDesktopLayoutBody,
} from "@/lib/server/parseDesktopLayoutBody";

const documentsFolder = {
  id: DOCUMENTS_FOLDER_ID,
  label: "Documents",
  type: "folder" as const,
  x: 16,
  y: 112,
};

describe("parseDesktopLayoutBody", () => {
  it("accepts a valid snapshot with Documents folder", () => {
    const parsed = parseDesktopLayoutBody({
      icons: [documentsFolder],
      documents: [],
    });
    expect(parsed.icons).toHaveLength(1);
    expect(parsed.documents).toEqual([]);
  });

  it("rejects missing icons/documents arrays", () => {
    expect(() => parseDesktopLayoutBody({})).toThrow(DesktopLayoutPayloadError);
    expect(() =>
      parseDesktopLayoutBody({ icons: [], documents: [] }),
    ).toThrow(/icons must not be empty/);
  });

  it("rejects empty icons (would wipe FS to Documents-only)", () => {
    expect(() =>
      parseDesktopLayoutBody({ icons: [], documents: [] }),
    ).toThrow(DesktopLayoutPayloadError);
  });

  it("rejects snapshots without the Documents folder", () => {
    expect(() =>
      parseDesktopLayoutBody({
        icons: [
          { id: "notepad", label: "Notepad", type: "editor", x: 0, y: 0 },
        ],
        documents: [],
      }),
    ).toThrow(/Documents folder/);
  });

  it("rejects malformed icon rows instead of filtering them", () => {
    expect(() =>
      parseDesktopLayoutBody({
        icons: [documentsFolder, { id: "bad" }],
        documents: [],
      }),
    ).toThrow(/icons\[1\]/);
  });

  it("rejects malformed document rows", () => {
    expect(() =>
      parseDesktopLayoutBody({
        icons: [documentsFolder],
        documents: [{ id: "doc-1", title: "Hi", content: "x" }],
      }),
    ).toThrow(/documents\[0\]/);
  });
});
