import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
  STORAGE_KEY,
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
      selectedIconId: null,
      renamingIconId: null,
      isStartMenuOpen: false,
      nextZIndex: 1,
      hydrated: false,
    });
    window.localStorage.clear();
  });

  it("opens a window from an icon and focuses it", () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow("my-computer");

    const { windows, selectedIconId } = useDesktopStore.getState();
    expect(windows).toHaveLength(1);
    expect(windows[0]?.iconId).toBe("my-computer");
    expect(windows[0]?.isOpen).toBe(true);
    expect(windows[0]?.isFocused).toBe(true);
    expect(windows[0]?.zIndex).toBe(1);
    expect(selectedIconId).toBe("my-computer");
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
    openWindow("my-computer");
    const firstId = useDesktopStore.getState().windows[0]?.id;
    expect(firstId).toBeDefined();

    closeWindow(firstId!);
    openWindow("my-computer");

    const { windows, nextZIndex } = useDesktopStore.getState();
    expect(windows).toHaveLength(1);
    expect(windows[0]?.isOpen).toBe(true);
    expect(windows[0]?.isFocused).toBe(true);
    expect(windows[0]?.zIndex).toBe(2);
    expect(nextZIndex).toBe(3);
  });

  it("closes a window", () => {
    const { openWindow, closeWindow } = useDesktopStore.getState();
    openWindow("my-computer");
    const windowId = useDesktopStore.getState().windows[0]?.id;
    closeWindow(windowId!);

    const windowState = useDesktopStore.getState().windows[0];
    expect(windowState?.isOpen).toBe(false);
    expect(windowState?.isFocused).toBe(false);
  });

  it("does not refocus a closed window", () => {
    const { openWindow, closeWindow, focusWindow } = useDesktopStore.getState();
    openWindow("my-computer");
    const windowId = useDesktopStore.getState().windows[0]?.id;
    closeWindow(windowId!);
    focusWindow(windowId!);

    expect(useDesktopStore.getState().windows[0]?.isOpen).toBe(false);
  });

  it("focuses a window and bumps its z-index", () => {
    const { openWindow, focusWindow } = useDesktopStore.getState();
    openWindow("my-computer");
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

    const { icons, renamingIconId } = useDesktopStore.getState();
    const first = icons.find((icon) => icon.id === firstId);
    const second = icons.find((icon) => icon.id === secondId);

    expect(first?.type).toBe("folder");
    expect(first?.label).toBe("New Folder");
    expect(first?.parentId).toBeNull();
    expect(second?.label).toBe("New Folder (2)");
    expect(renamingIconId).toBe(secondId);
  });

  it("renames a folder and open window title", () => {
    const { createFolder, openWindow, renameIcon } =
      useDesktopStore.getState();
    const folderId = createFolder("Poems");
    openWindow(folderId);
    renameIcon(folderId, "Sonnets");

    const { icons, windows, renamingIconId } = useDesktopStore.getState();
    expect(icons.find((icon) => icon.id === folderId)?.label).toBe("Sonnets");
    expect(windows.find((window) => window.iconId === folderId)?.title).toBe(
      "Sonnets",
    );
    expect(renamingIconId).toBeNull();
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
    openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]?.id;
    saveDocumentFromWindow(windowId!, "inside", "nested");
    const fileId = useDesktopStore
      .getState()
      .icons.find((icon) => icon.type === "text")?.id;
    moveIconToFolder(fileId!, folderId);

    deleteIcon(folderId);
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
  });

  it("opens Display Properties", () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow("display-properties");
    const windowState = useDesktopStore.getState().windows[0];
    expect(windowState?.type).toBe("display");
    expect(windowState?.title).toBe("Display Properties");
  });
});
