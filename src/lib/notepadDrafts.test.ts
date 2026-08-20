import {
  claimLatestUntitledDraft,
  clearNotepadDraft,
  draftStorageKey,
  loadNotepadDraft,
  NOTEPAD_DRAFTS_STORAGE_KEY,
  resolveNotepadDraft,
  saveNotepadDraft,
} from "@/lib/notepadDrafts";

describe("notepadDrafts", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and loads a document draft", () => {
    saveNotepadDraft({
      windowId: "w1",
      documentId: "doc-1",
      title: "chapter",
      content: "once upon a time",
    });

    expect(loadNotepadDraft("w1", "doc-1")).toEqual(
      expect.objectContaining({
        documentId: "doc-1",
        title: "chapter",
        content: "once upon a time",
      }),
    );
    expect(draftStorageKey("w1", "doc-1")).toBe("doc:doc-1");
    expect(window.localStorage.getItem(NOTEPAD_DRAFTS_STORAGE_KEY)).toContain(
      "once upon a time",
    );
  });

  it("clears drafts on discard/save", () => {
    saveNotepadDraft({
      windowId: "w1",
      documentId: null,
      title: "scratch",
      content: "temp",
    });
    clearNotepadDraft("w1", null);
    expect(loadNotepadDraft("w1", null)).toBeNull();
  });

  it("claims orphaned untitled drafts after refresh", () => {
    saveNotepadDraft({
      windowId: "old-window",
      documentId: null,
      title: "recovered",
      content: "still here",
    });

    const claimed = claimLatestUntitledDraft("new-window", []);
    expect(claimed?.content).toBe("still here");
    expect(claimed?.windowId).toBe("new-window");
    expect(loadNotepadDraft("old-window", null)).toBeNull();
    expect(loadNotepadDraft("new-window", null)?.title).toBe("recovered");
  });

  it("does not steal untitled drafts from other open windows", () => {
    saveNotepadDraft({
      windowId: "open-a",
      documentId: null,
      title: "A",
      content: "aaa",
    });

    expect(claimLatestUntitledDraft("open-b", ["open-a"])).toBeNull();
    expect(loadNotepadDraft("open-a", null)?.content).toBe("aaa");
  });

  it("resolveNotepadDraft prefers the document draft", () => {
    saveNotepadDraft({
      windowId: "w1",
      documentId: "doc-9",
      title: "named",
      content: "body",
    });
    expect(resolveNotepadDraft("w1", "doc-9")?.title).toBe("named");
  });
});
