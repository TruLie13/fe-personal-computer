import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
  STORAGE_KEY,
  folderWindowTitle,
} from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";

describe("desktopStore", () => {
  beforeEach(() => {
    useDesktopStore.setState({
      icons: DEFAULT_ICONS,
      documents: DEFAULT_DOCUMENTS,
      windows: [],
      wallpaper: DEFAULT_WALLPAPER,
      titleBarColor: DEFAULT_TITLE_BAR_COLOR,
      contentDark: false,
      taskbarHeight: 36,
      selectedIconId: null,
      renamingIconId: null,
      isStartMenuOpen: false,
      nextZIndex: 1,
      hydrated: false,
      viewMode: "local",
      remoteUserId: null,
      favorites: [],
      localBbsNotes: [],
      localProfile: {
        displayName: "Writer",
        computerName: "WRITER-PC",
        bio: "test",
        avatarColor: "#000080",
        avatarUrl: null,
      },
    });
    window.localStorage.clear();
  });

  it("opens a window from an icon and focuses it", () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow("profile");

    const { windows, selectedIconId } = useDesktopStore.getState();
    expect(windows).toHaveLength(1);
    expect(windows[0]?.iconId).toBe("profile");
    expect(windows[0]?.type).toBe("profile");
    expect(windows[0]?.isOpen).toBe(true);
    expect(windows[0]?.isFocused).toBe(true);
    expect(windows[0]?.zIndex).toBe(1);
    expect(selectedIconId).toBe("profile");
  });

  it("opens a fresh Notepad window every time", () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow("notepad");
    openWindow("notepad");

    const { windows } = useDesktopStore.getState();
    const editors = windows.filter(
      (window) => window.type === "editor" && window.isOpen,
    );
    expect(editors).toHaveLength(2);
    expect(editors[0]?.id).not.toBe(editors[1]?.id);
    expect(editors[0]?.documentId).toBeNull();
    expect(editors[1]?.documentId).toBeNull();
  });

  it("reuses an existing window and raises z-index on reopen", () => {
    const { openWindow, closeWindow } = useDesktopStore.getState();
    openWindow("profile");
    const firstId = useDesktopStore.getState().windows[0]?.id;
    expect(firstId).toBeDefined();

    closeWindow(firstId!);
    openWindow("profile");

    const { windows, nextZIndex } = useDesktopStore.getState();
    expect(windows).toHaveLength(1);
    expect(windows[0]?.isOpen).toBe(true);
    expect(windows[0]?.isFocused).toBe(true);
    expect(windows[0]?.zIndex).toBe(2);
    expect(nextZIndex).toBe(3);
  });

  it("closes a window", () => {
    const { openWindow, closeWindow } = useDesktopStore.getState();
    openWindow("profile");
    const windowId = useDesktopStore.getState().windows[0]?.id;
    closeWindow(windowId!);

    const windowState = useDesktopStore.getState().windows[0];
    expect(windowState?.isOpen).toBe(false);
    expect(windowState?.isFocused).toBe(false);
  });

  it("does not refocus a closed window", () => {
    const { openWindow, closeWindow, focusWindow } = useDesktopStore.getState();
    openWindow("profile");
    const windowId = useDesktopStore.getState().windows[0]?.id;
    closeWindow(windowId!);
    focusWindow(windowId!);

    expect(useDesktopStore.getState().windows[0]?.isOpen).toBe(false);
  });

  it("focuses a window and bumps its z-index", () => {
    const { openWindow, focusWindow } = useDesktopStore.getState();
    openWindow("profile");
    openWindow("documents");

    const [first, second] = useDesktopStore.getState().windows;
    expect(second?.isFocused).toBe(true);

    focusWindow(first!.id);
    const updated = useDesktopStore.getState().windows;
    const focused = updated.find((window) => window.id === first!.id);
    const other = updated.find((window) => window.id === second!.id);

    expect(focused?.isFocused).toBe(true);
    expect(focused?.zIndex).toBeGreaterThan(other?.zIndex ?? 0);
    expect(other?.isFocused).toBe(false);
  });

  it("updates window position immutably", () => {
    const { openWindow, updateWindowPosition } = useDesktopStore.getState();
    openWindow("notepad");
    const before = useDesktopStore.getState().windows[0];
    updateWindowPosition(before!.id, 200, 150);

    const after = useDesktopStore.getState().windows[0];
    expect(after).not.toBe(before);
    expect(after?.x).toBe(200);
    expect(after?.y).toBe(150);
  });

  it("updates icon position and persists to localStorage", () => {
    const { updateIconPosition } = useDesktopStore.getState();
    updateIconPosition("notepad", 40, 220);

    const icon = useDesktopStore
      .getState()
      .icons.find((item) => item.id === "notepad");
    expect(icon?.x).toBe(40);
    expect(icon?.y).toBe(220);

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as {
      icons: Array<{ id: string; x: number; y: number }>;
    };
    const saved = parsed.icons.find((item) => item.id === "notepad");
    expect(saved?.x).toBe(40);
    expect(saved?.y).toBe(220);
  });

  it("saves a new document onto the desktop", () => {
    const { openWindow, saveDocumentFromWindow } = useDesktopStore.getState();
    openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]?.id;
    saveDocumentFromWindow(windowId!, "poem", "roses are red");

    const { documents, icons, windows } = useDesktopStore.getState();
    expect(documents).toHaveLength(1);
    expect(documents[0]?.title).toBe("poem");
    expect(documents[0]?.content).toBe("roses are red");

    const fileIcon = icons.find((icon) => icon.documentId === documents[0]?.id);
    expect(fileIcon?.label).toBe("poem");
    expect(fileIcon?.type).toBe("text");
    expect(windows[0]?.documentId).toBe(documents[0]?.id);
    expect(windows[0]?.title).toBe("poem - Notepad");
  });

  it("strips .txt from filenames on save", () => {
    const { openWindow, saveDocumentFromWindow } = useDesktopStore.getState();
    openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]?.id;
    saveDocumentFromWindow(windowId!, "verse.txt", "hello");

    const { documents, windows } = useDesktopStore.getState();
    expect(documents[0]?.title).toBe("verse");
    expect(windows[0]?.title).toBe("verse - Notepad");
  });

  it("opens a saved document in the editor", () => {
    const { openWindow, saveDocumentFromWindow } = useDesktopStore.getState();
    openWindow("notepad");
    const editorId = useDesktopStore.getState().windows[0]?.id;
    saveDocumentFromWindow(editorId!, "story.txt", "once upon a time");
    const fileIconId = useDesktopStore
      .getState()
      .icons.find((icon) => icon.type === "text")?.id;

    openWindow(fileIconId!);
    const editors = useDesktopStore
      .getState()
      .windows.filter((window) => window.type === "editor" && window.isOpen);
    // Original notepad still open + document opens (or focuses same if linked)
    expect(editors.length).toBeGreaterThanOrEqual(1);
    const docWindow = editors.find((window) => window.documentId);
    expect(docWindow?.title).toBe("story - Notepad");
  });

  it("reopens a closed text file without duplicating window ids", () => {
    const { openWindow, saveDocumentFromWindow, closeWindow, moveIconToFolder, createFolder } =
      useDesktopStore.getState();
    openWindow("notepad");
    const editorId = useDesktopStore.getState().windows[0]?.id;
    saveDocumentFromWindow(editorId!, "nested", "inside a folder");
    const fileIconId = useDesktopStore
      .getState()
      .icons.find((icon) => icon.type === "text")?.id;
    expect(fileIconId).toBeTruthy();

    const folderId = createFolder("Hold");
    moveIconToFolder(fileIconId!, folderId!);

    closeWindow(editorId!);
    openWindow(fileIconId!);
    openWindow(fileIconId!);

    const { windows } = useDesktopStore.getState();
    const ids = windows.map((window) => window.id);
    expect(new Set(ids).size).toBe(ids.length);

    const docWindows = windows.filter(
      (window) =>
        window.documentId &&
        window.documentId ===
          useDesktopStore.getState().icons.find((icon) => icon.id === fileIconId)
            ?.documentId,
    );
    expect(docWindows).toHaveLength(1);
    expect(docWindows[0]?.isOpen).toBe(true);
  });

  it("toggles the start menu", () => {
    const { toggleStartMenu, closeStartMenu } = useDesktopStore.getState();
    toggleStartMenu();
    expect(useDesktopStore.getState().isStartMenuOpen).toBe(true);
    closeStartMenu();
    expect(useDesktopStore.getState().isStartMenuOpen).toBe(false);
  });

  it("creates a unique folder on the desktop", () => {
    const { createFolder } = useDesktopStore.getState();
    const firstId = createFolder();
    const secondId = createFolder();
    expect(firstId).toBeTruthy();
    expect(secondId).toBeTruthy();

    const { icons, renamingIconId } = useDesktopStore.getState();
    const first = icons.find((icon) => icon.id === firstId);
    const second = icons.find((icon) => icon.id === secondId);

    expect(first?.type).toBe("folder");
    expect(first?.label).toBe("New Folder");
    expect(first?.parentId).toBeNull();
    expect(second?.label).toBe("New Folder (2)");
    expect(renamingIconId).toBe(secondId);
  });

  it("creates a folder and text file inside a parent folder", () => {
    const { createFolder, createTextFile } = useDesktopStore.getState();
    const parentId = createFolder("Bundle");
    expect(parentId).toBeTruthy();

    const nestedFolderId = createFolder(undefined, undefined, parentId);
    const fileId = createTextFile(parentId);
    expect(nestedFolderId).toBeTruthy();
    expect(fileId).toBeTruthy();

    const { icons, documents, renamingIconId } = useDesktopStore.getState();
    const nested = icons.find((icon) => icon.id === nestedFolderId);
    const file = icons.find((icon) => icon.id === fileId);
    const doc = documents.find((item) => item.id === file?.documentId);

    expect(nested?.parentId).toBe(parentId);
    expect(nested?.label).toBe("New Folder");
    expect(file?.parentId).toBe(parentId);
    expect(file?.type).toBe("text");
    expect(file?.label).toBe("New Text Document");
    expect(doc?.content).toBe("");
    expect(renamingIconId).toBe(fileId);

    // Same name allowed on desktop vs inside folder
    const desktopFolderId = createFolder();
    const desktop = useDesktopStore
      .getState()
      .icons.find((icon) => icon.id === desktopFolderId);
    expect(desktop?.label).toBe("New Folder");
    expect(desktop?.parentId).toBeNull();
  });

  it("renames a folder and open window title", () => {
    const { createFolder, openWindow, renameIcon } =
      useDesktopStore.getState();
    const folderId = createFolder("Poems");
    expect(folderId).toBeTruthy();
    openWindow(folderId!);
    renameIcon(folderId!, "Sonnets");

    const { icons, windows, renamingIconId } = useDesktopStore.getState();
    expect(icons.find((icon) => icon.id === folderId)?.label).toBe("Sonnets");
    expect(windows.find((window) => window.iconId === folderId)?.title).toBe(
      "Sonnets",
    );
    expect(renamingIconId).toBeNull();
  });

  it("shows a path title for nested folders and Up opens the parent", () => {
    const { createFolder, openWindow } = useDesktopStore.getState();
    const parentId = createFolder("Archive");
    const childId = createFolder("Poems", undefined, parentId);
    expect(parentId).toBeTruthy();
    expect(childId).toBeTruthy();

    openWindow(childId!);
    const { icons, windows } = useDesktopStore.getState();
    expect(windows.find((window) => window.iconId === childId)?.title).toBe(
      folderWindowTitle(icons, childId!),
    );
    expect(folderWindowTitle(icons, childId!)).toBe("Archive\\Poems");

    openWindow(parentId!);
    const after = useDesktopStore.getState().windows;
    expect(after.find((window) => window.iconId === parentId)?.isOpen).toBe(
      true,
    );
    expect(after.find((window) => window.iconId === parentId)?.isFocused).toBe(
      true,
    );
  });

  it("renames a text file and its document", () => {
    const { openWindow, saveDocumentFromWindow, renameIcon } =
      useDesktopStore.getState();
    openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]?.id;
    saveDocumentFromWindow(windowId!, "draft", "hello");
    const fileId = useDesktopStore
      .getState()
      .icons.find((icon) => icon.type === "text")?.id;

    renameIcon(fileId!, "final");
    const state = useDesktopStore.getState();
    expect(state.icons.find((icon) => icon.id === fileId)?.label).toBe("final");
    expect(state.documents[0]?.title).toBe("final");
    expect(state.windows[0]?.title).toBe("final - Notepad");
  });

  it("auto-suffixes duplicate text names on save and move", () => {
    const { openWindow, saveDocumentFromWindow, moveIconToFolder, createFolder } =
      useDesktopStore.getState();

    openWindow("notepad");
    saveDocumentFromWindow(
      useDesktopStore.getState().windows[0]!.id,
      "notes",
      "one",
    );
    openWindow("notepad");
    saveDocumentFromWindow(
      useDesktopStore.getState().windows.find((window) => !window.documentId)!
        .id,
      "notes",
      "two",
    );

    const desktopTexts = useDesktopStore
      .getState()
      .icons.filter((icon) => icon.type === "text" && icon.parentId == null);
    expect(desktopTexts.map((icon) => icon.label).sort()).toEqual([
      "notes",
      "notes (2)",
    ]);

    const folderId = createFolder("Bundle");
    const firstNotesId = useDesktopStore
      .getState()
      .icons.find((icon) => icon.label === "notes")?.id;
    moveIconToFolder(firstNotesId!, folderId!);

    const secondNotesId = useDesktopStore
      .getState()
      .icons.find((icon) => icon.label === "notes (2)")?.id;
    moveIconToFolder(secondNotesId!, folderId!);

    const inFolder = useDesktopStore
      .getState()
      .icons.filter((icon) => icon.parentId === folderId);
    // Second file keeps "notes (2)" — free in the folder — then collide a third.
    expect(inFolder.map((icon) => icon.label).sort()).toEqual([
      "notes",
      "notes (2)",
    ]);

    openWindow("notepad");
    saveDocumentFromWindow(
      useDesktopStore.getState().windows.find((window) => !window.documentId)!
        .id,
      "notes",
      "three",
    );
    const thirdId = useDesktopStore
      .getState()
      .icons.find(
        (icon) =>
          icon.type === "text" &&
          icon.parentId == null &&
          icon.label === "notes",
      )?.id;
    expect(thirdId).toBeTruthy();
    moveIconToFolder(thirdId!, folderId!);

    const after = useDesktopStore
      .getState()
      .icons.filter((icon) => icon.parentId === folderId)
      .map((icon) => icon.label)
      .sort();
    expect(after).toEqual(["notes", "notes (2)", "notes (3)"]);
  });

  it("moves a file into a folder and back to the desktop", () => {
    const { openWindow, saveDocumentFromWindow, moveIconToFolder } =
      useDesktopStore.getState();
    openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]?.id;
    saveDocumentFromWindow(windowId!, "sonnet", "shall I compare thee");

    const fileId = useDesktopStore
      .getState()
      .icons.find((icon) => icon.documentId)?.id;
    expect(fileId).toBeDefined();

    moveIconToFolder(fileId!, "documents");
    let file = useDesktopStore.getState().icons.find((icon) => icon.id === fileId);
    expect(file?.parentId).toBe("documents");

    moveIconToFolder(fileId!, null);
    file = useDesktopStore.getState().icons.find((icon) => icon.id === fileId);
    expect(file?.parentId).toBeNull();
  });

  it("moves a nested folder to the desktop and into another folder", () => {
    const { createFolder, createTextFile, moveIconToFolder } =
      useDesktopStore.getState();
    const parentId = createFolder("Outer");
    const nestedId = createFolder("Inner", undefined, parentId);
    const fileId = createTextFile(nestedId!, "kept");
    expect(parentId).toBeTruthy();
    expect(nestedId).toBeTruthy();

    moveIconToFolder(nestedId!, null, { x: 200, y: 120 });
    let nested = useDesktopStore.getState().icons.find((icon) => icon.id === nestedId);
    expect(nested?.parentId).toBeNull();
    expect(nested?.x).toBe(200);
    expect(nested?.y).toBe(120);
    // Children stay with the folder
    expect(
      useDesktopStore.getState().icons.find((icon) => icon.id === fileId)?.parentId,
    ).toBe(nestedId);

    moveIconToFolder(nestedId!, parentId!);
    nested = useDesktopStore.getState().icons.find((icon) => icon.id === nestedId);
    expect(nested?.parentId).toBe(parentId);

    // Refuse nesting a folder inside itself / its descendant
    moveIconToFolder(parentId!, nestedId!);
    expect(
      useDesktopStore.getState().icons.find((icon) => icon.id === parentId)
        ?.parentId,
    ).toBeNull();
  });

  it("places a file at a drop position when moved to the desktop", () => {
    const { openWindow, saveDocumentFromWindow, moveIconToFolder } =
      useDesktopStore.getState();
    openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]?.id;
    saveDocumentFromWindow(windowId!, "ode", "beauty is truth");
    const fileId = useDesktopStore
      .getState()
      .icons.find((icon) => icon.documentId)?.id;

    moveIconToFolder(fileId!, "documents");
    moveIconToFolder(fileId!, null, { x: 240, y: 160 });

    const file = useDesktopStore.getState().icons.find((icon) => icon.id === fileId);
    expect(file?.parentId).toBeNull();
    expect(file?.x).toBe(240);
    expect(file?.y).toBe(160);
  });

  it("opens Documents with the folder label as the title", () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow("documents");
    expect(useDesktopStore.getState().windows[0]?.title).toBe("Documents");
  });

  it("deletes a file and closes its editor window", () => {
    const { openWindow, saveDocumentFromWindow, deleteIcon } =
      useDesktopStore.getState();
    openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]?.id;
    saveDocumentFromWindow(windowId!, "temp", "bye");
    const fileId = useDesktopStore
      .getState()
      .icons.find((icon) => icon.type === "text")?.id;

    deleteIcon(fileId!);
    const state = useDesktopStore.getState();
    expect(state.icons.find((icon) => icon.id === fileId)).toBeUndefined();
    expect(state.documents).toHaveLength(0);
    expect(state.windows[0]?.isOpen).toBe(false);
  });

  it("deletes a folder and everything inside it", () => {
    const {
      openWindow,
      saveDocumentFromWindow,
      moveIconToFolder,
      createFolder,
      deleteIcon,
    } = useDesktopStore.getState();
    const folderId = createFolder("Bundle");
    expect(folderId).toBeTruthy();
    openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]?.id;
    saveDocumentFromWindow(windowId!, "inside", "nested");
    const fileId = useDesktopStore
      .getState()
      .icons.find((icon) => icon.type === "text")?.id;
    moveIconToFolder(fileId!, folderId!);

    deleteIcon(folderId!);
    const state = useDesktopStore.getState();
    expect(state.icons.find((icon) => icon.id === folderId)).toBeUndefined();
    expect(state.icons.find((icon) => icon.id === fileId)).toBeUndefined();
    expect(state.documents).toHaveLength(0);
  });

  it("does not delete default app icons", () => {
    const { deleteIcon } = useDesktopStore.getState();
    deleteIcon("documents");
    deleteIcon("notepad");
    expect(
      useDesktopStore.getState().icons.find((icon) => icon.id === "documents"),
    ).toBeDefined();
    expect(
      useDesktopStore.getState().icons.find((icon) => icon.id === "notepad"),
    ).toBeDefined();
  });

  it("updates wallpaper and title bar color in localStorage", () => {
    const { setWallpaper, setTitleBarColor, resetTheme } =
      useDesktopStore.getState();
    setWallpaper("#800080");
    setTitleBarColor("#008000");

    expect(useDesktopStore.getState().wallpaper).toBe("#800080");
    expect(useDesktopStore.getState().titleBarColor).toBe("#008000");

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as {
      wallpaper: string;
      titleBarColor: string;
    };
    expect(parsed.wallpaper).toBe("#800080");
    expect(parsed.titleBarColor).toBe("#008000");

    resetTheme();
    expect(useDesktopStore.getState().wallpaper).toBe(DEFAULT_WALLPAPER);
    expect(useDesktopStore.getState().titleBarColor).toBe(
      DEFAULT_TITLE_BAR_COLOR,
    );
    expect(useDesktopStore.getState().contentDark).toBe(false);
  });

  it("toggles content dark mode in localStorage", () => {
    const { setContentDark, resetTheme } = useDesktopStore.getState();
    setContentDark(true);
    expect(useDesktopStore.getState().contentDark).toBe(true);
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!) as {
      contentDark: boolean;
    };
    expect(parsed.contentDark).toBe(true);
    resetTheme();
    expect(useDesktopStore.getState().contentDark).toBe(false);
  });

  it("resizes the taskbar within Win95-like bounds", () => {
    const { setTaskbarHeight } = useDesktopStore.getState();
    setTaskbarHeight(48);
    expect(useDesktopStore.getState().taskbarHeight).toBe(48);
    setTaskbarHeight(10);
    expect(useDesktopStore.getState().taskbarHeight).toBe(28);
    setTaskbarHeight(200);
    expect(useDesktopStore.getState().taskbarHeight).toBe(72);
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!) as {
      taskbarHeight: number;
    };
    expect(parsed.taskbarHeight).toBe(72);
  });

  it("opens Display Properties", () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow("display-properties");
    const windowState = useDesktopStore.getState().windows[0];
    expect(windowState?.type).toBe("display");
    expect(windowState?.title).toBe("Display Properties");
  });

  it("minimizes a window and restores it on focus", () => {
    const { openWindow, minimizeWindow, focusWindow } =
      useDesktopStore.getState();
    openWindow("profile");
    const windowId = useDesktopStore.getState().windows[0]!.id;

    minimizeWindow(windowId);
    let windowState = useDesktopStore.getState().windows[0];
    expect(windowState?.isMinimized).toBe(true);
    expect(windowState?.isFocused).toBe(false);
    expect(windowState?.isOpen).toBe(true);

    focusWindow(windowId);
    windowState = useDesktopStore.getState().windows[0];
    expect(windowState?.isMinimized).toBe(false);
    expect(windowState?.isFocused).toBe(true);
  });

  it("selects icons and clears rename when selecting another", () => {
    const { createFolder, startRename, selectIcon } =
      useDesktopStore.getState();
    const folderId = createFolder("Drafts")!;
    startRename(folderId);
    expect(useDesktopStore.getState().renamingIconId).toBe(folderId);
    expect(useDesktopStore.getState().selectedIconId).toBe(folderId);

    selectIcon("notepad");
    expect(useDesktopStore.getState().selectedIconId).toBe("notepad");
    expect(useDesktopStore.getState().renamingIconId).toBeNull();
    expect(useDesktopStore.getState().isStartMenuOpen).toBe(false);
  });

  it("starts and cancels rename only for folders and text files", () => {
    const { createFolder, startRename, cancelRename } =
      useDesktopStore.getState();
    const folderId = createFolder("Poems")!;
    cancelRename();
    expect(useDesktopStore.getState().renamingIconId).toBeNull();

    startRename("notepad");
    expect(useDesktopStore.getState().renamingIconId).toBeNull();

    startRename(folderId);
    expect(useDesktopStore.getState().renamingIconId).toBe(folderId);

    cancelRename();
    expect(useDesktopStore.getState().renamingIconId).toBeNull();
  });

  it("updates an existing document from the editor and persists", () => {
    const { openWindow, saveDocumentFromWindow, updateDocumentContent } =
      useDesktopStore.getState();
    openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]!.id;
    saveDocumentFromWindow(windowId, "draft", "first line");

    updateDocumentContent(windowId, "second line", "draft-v2");

    const { documents, icons } = useDesktopStore.getState();
    expect(documents[0]?.content).toBe("second line");
    expect(documents[0]?.title).toBe("draft-v2");

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as {
      documents: Array<{ content: string; title: string }>;
    };
    expect(parsed.documents[0]?.content).toBe("second line");
    expect(parsed.documents[0]?.title).toBe("draft-v2");
    // Icon label is not rewritten by live content updates
    expect(icons.find((icon) => icon.type === "text")?.label).toBe("draft");
  });

  it("ignores document updates without a linked document", () => {
    const { openWindow, updateDocumentContent } = useDesktopStore.getState();
    openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]!.id;
    updateDocumentContent(windowId, "orphan", "nope");
    expect(useDesktopStore.getState().documents).toHaveLength(0);
  });

  it("opens the local profile window via openProfile", () => {
    useDesktopStore.getState().openProfile();
    const { windows } = useDesktopStore.getState();
    expect(windows.some((window) => window.type === "profile" && window.isOpen))
      .toBe(true);
  });
});
