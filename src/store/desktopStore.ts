import { create } from "zustand";
import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
  canDeleteIcon,
  isOnDesktop,
  loadDesktopState,
  nextDesktopIconPosition,
  saveDesktopState,
  stripTextExtension,
  uniqueFolderName,
} from "@/lib/storage";
import type {
  DesktopIcon,
  DesktopWindow,
  TextDocument,
  WindowType,
} from "@/types/desktop";

const WINDOW_DEFAULTS: Record<
  WindowType,
  { title: string; width: number; height: number }
> = {
  about: { title: "About Personal Computer", width: 360, height: 240 },
  folder: { title: "Folder", width: 420, height: 300 },
  text: { title: "Untitled", width: 440, height: 320 },
  editor: { title: "Untitled - Notepad", width: 440, height: 320 },
  system: { title: "My Computer", width: 380, height: 280 },
  display: { title: "Display Properties", width: 420, height: 460 },
};

interface DesktopStore {
  icons: DesktopIcon[];
  documents: TextDocument[];
  windows: DesktopWindow[];
  wallpaper: string;
  titleBarColor: string;
  selectedIconId: string | null;
  isStartMenuOpen: boolean;
  nextZIndex: number;
  hydrated: boolean;
  hydrate: () => void;
  selectIcon: (iconId: string | null) => void;
  toggleStartMenu: () => void;
  closeStartMenu: () => void;
  openWindow: (iconId: string) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, x: number, y: number) => void;
  updateIconPosition: (iconId: string, x: number, y: number) => void;
  updateDocumentContent: (
    windowId: string,
    content: string,
    title?: string,
  ) => void;
  saveDocumentFromWindow: (windowId: string, title: string, content: string) => void;
  createFolder: (
    name?: string,
    position?: { x: number; y: number },
  ) => string;
  moveIconToFolder: (
    iconId: string,
    folderId: string | null,
    position?: { x: number; y: number },
  ) => void;
  renamingIconId: string | null;
  startRename: (iconId: string) => void;
  cancelRename: () => void;
  renameIcon: (iconId: string, label: string) => void;
  deleteIcon: (iconId: string) => void;
  setWallpaper: (color: string) => void;
  setTitleBarColor: (color: string) => void;
  resetTheme: () => void;
}

function persist(state: {
  icons: DesktopIcon[];
  documents: TextDocument[];
  wallpaper: string;
  titleBarColor: string;
}): void {
  saveDesktopState({
    icons: state.icons,
    documents: state.documents,
    wallpaper: state.wallpaper,
    titleBarColor: state.titleBarColor,
  });
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createWindowFromIcon(
  icon: DesktopIcon,
  zIndex: number,
  offset: number,
): DesktopWindow {
  const isEditor = icon.type === "editor" || icon.type === "text";
  const defaults = WINDOW_DEFAULTS[isEditor ? "editor" : icon.type];
  const title =
    icon.type === "editor"
      ? "Untitled - Notepad"
      : icon.type === "text"
        ? `${stripTextExtension(icon.label)} - Notepad`
        : icon.type === "folder"
          ? icon.label
          : defaults.title;

  return {
    id:
      icon.type === "editor"
        ? createId("window-editor")
        : `window-${icon.id}`,
    title,
    type: isEditor ? "editor" : icon.type,
    iconId: icon.id,
    documentId: icon.documentId ?? null,
    isOpen: true,
    isFocused: true,
    isMinimized: false,
    x: 80 + offset * 24,
    y: 48 + offset * 24,
    width: defaults.width,
    height: defaults.height,
    zIndex,
  };
}

export const useDesktopStore = create<DesktopStore>((set, get) => ({
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

  hydrate: () => {
    if (get().hydrated) {
      return;
    }
    const saved = loadDesktopState();
    set({
      icons: saved.icons,
      documents: saved.documents,
      wallpaper: saved.wallpaper,
      titleBarColor: saved.titleBarColor,
      hydrated: true,
    });
  },

  selectIcon: (iconId) => {
    set((state) => ({
      selectedIconId: iconId,
      isStartMenuOpen: false,
      renamingIconId:
        iconId != null && state.renamingIconId === iconId
          ? state.renamingIconId
          : null,
    }));
  },

  toggleStartMenu: () => {
    set((state) => ({ isStartMenuOpen: !state.isStartMenuOpen }));
  },

  closeStartMenu: () => {
    set({ isStartMenuOpen: false });
  },

  openWindow: (iconId) => {
    const state = get();
    const icon = state.icons.find((item) => item.id === iconId);
    if (!icon) {
      return;
    }

    if (icon.type === "editor") {
      const zIndex = state.nextZIndex;
      const openCount = state.windows.filter((window) => window.isOpen).length;
      const nextWindow = createWindowFromIcon(icon, zIndex, openCount);
      set({
        windows: [
          ...state.windows.map((window) => ({ ...window, isFocused: false })),
          nextWindow,
        ],
        nextZIndex: zIndex + 1,
        selectedIconId: iconId,
        isStartMenuOpen: false,
      });
      return;
    }

    const existing = state.windows.find(
      (window) => window.iconId === iconId && window.isOpen,
    );
    if (existing) {
      const zIndex = state.nextZIndex;
      set({
        windows: state.windows.map((window) =>
          window.id === existing.id
            ? {
                ...window,
                isOpen: true,
                isMinimized: false,
                isFocused: true,
                zIndex,
              }
            : { ...window, isFocused: false },
        ),
        nextZIndex: zIndex + 1,
        selectedIconId: iconId,
        isStartMenuOpen: false,
      });
      return;
    }

    const closed = state.windows.find(
      (window) => window.iconId === iconId && !window.isOpen,
    );
    if (closed && icon.type !== "text") {
      const zIndex = state.nextZIndex;
      set({
        windows: state.windows.map((window) =>
          window.id === closed.id
            ? {
                ...window,
                isOpen: true,
                isMinimized: false,
                isFocused: true,
                zIndex,
                title:
                  icon.type === "folder" ? icon.label : window.title,
              }
            : { ...window, isFocused: false },
        ),
        nextZIndex: zIndex + 1,
        selectedIconId: iconId,
        isStartMenuOpen: false,
      });
      return;
    }

    if (icon.documentId) {
      const openDocWindow = state.windows.find(
        (window) =>
          window.documentId === icon.documentId &&
          (window.isOpen || window.isMinimized),
      );
      if (openDocWindow) {
        const zIndex = state.nextZIndex;
        set({
          windows: state.windows.map((window) =>
            window.id === openDocWindow.id
              ? {
                  ...window,
                  isOpen: true,
                  isMinimized: false,
                  isFocused: true,
                  zIndex,
                }
              : { ...window, isFocused: false },
          ),
          nextZIndex: zIndex + 1,
          selectedIconId: iconId,
          isStartMenuOpen: false,
        });
        return;
      }
    }

    const zIndex = state.nextZIndex;
    const openCount = state.windows.filter((window) => window.isOpen).length;
    const nextWindow = createWindowFromIcon(icon, zIndex, openCount);

    set({
      windows: [
        ...state.windows.map((window) => ({ ...window, isFocused: false })),
        nextWindow,
      ],
      nextZIndex: zIndex + 1,
      selectedIconId: iconId,
      isStartMenuOpen: false,
    });
  },

  closeWindow: (windowId) => {
    set((state) => ({
      windows: state.windows.map((window) =>
        window.id === windowId
          ? { ...window, isOpen: false, isFocused: false, isMinimized: false }
          : window,
      ),
    }));
  },

  minimizeWindow: (windowId) => {
    set((state) => ({
      windows: state.windows.map((window) =>
        window.id === windowId
          ? { ...window, isMinimized: true, isFocused: false }
          : window,
      ),
    }));
  },

  focusWindow: (windowId) => {
    const state = get();
    const target = state.windows.find((window) => window.id === windowId);
    if (!target || !target.isOpen) {
      return;
    }

    const zIndex = state.nextZIndex;
    set({
      windows: state.windows.map((window) =>
        window.id === windowId
          ? {
              ...window,
              isFocused: true,
              isMinimized: false,
              isOpen: true,
              zIndex,
            }
          : { ...window, isFocused: false },
      ),
      nextZIndex: zIndex + 1,
      isStartMenuOpen: false,
    });
  },

  updateWindowPosition: (windowId, x, y) => {
    set((state) => ({
      windows: state.windows.map((window) =>
        window.id === windowId ? { ...window, x, y } : window,
      ),
    }));
  },

  updateIconPosition: (iconId, x, y) => {
    set((state) => {
      const icons = state.icons.map((icon) =>
        icon.id === iconId ? { ...icon, x, y } : icon,
      );
      persist({ icons, documents: state.documents, wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor });
      return { icons };
    });
  },

  updateDocumentContent: (windowId, content, title) => {
    set((state) => {
      const target = state.windows.find((window) => window.id === windowId);
      if (!target?.documentId) {
        return state;
      }

      const documents = state.documents.map((doc) =>
        doc.id === target.documentId
          ? {
              ...doc,
              content,
              title: title ?? doc.title,
              updatedAt: new Date().toISOString(),
            }
          : doc,
      );
      persist({
        icons: state.icons,
        documents,
        wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor,
      });
      return { documents };
    });
  },

  saveDocumentFromWindow: (windowId, title, content) => {
    const state = get();
    const target = state.windows.find((window) => window.id === windowId);
    if (!target) {
      return;
    }

    const fileTitle = stripTextExtension(title);
    const now = new Date().toISOString();

    if (target.documentId) {
      const documents = state.documents.map((doc) =>
        doc.id === target.documentId
          ? { ...doc, title: fileTitle, content, updatedAt: now }
          : doc,
      );
      const icons = state.icons.map((icon) =>
        icon.documentId === target.documentId
          ? { ...icon, label: fileTitle }
          : icon,
      );
      const windows = state.windows.map((window) =>
        window.id === windowId
          ? { ...window, title: `${fileTitle} - Notepad` }
          : window,
      );
      persist({ icons, documents, wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor });
      set({ documents, icons, windows });
      return;
    }

    const documentId = createId("doc");
    const position = nextDesktopIconPosition(state.icons, "file");
    const document: TextDocument = {
      id: documentId,
      title: fileTitle,
      content,
      createdAt: now,
      updatedAt: now,
    };
    const icon: DesktopIcon = {
      id: `file-${documentId}`,
      label: fileTitle,
      type: "text",
      x: position.x,
      y: position.y,
      documentId,
      parentId: null,
    };

    const documents = [...state.documents, document];
    const icons = [...state.icons, icon];
    const windows = state.windows.map((window) =>
      window.id === windowId
        ? {
            ...window,
            documentId,
            title: `${fileTitle} - Notepad`,
            iconId: icon.id,
          }
        : window,
    );

    persist({ icons, documents, wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor });
    set({ documents, icons, windows });
  },

  createFolder: (name, position) => {
    const state = get();
    const label = uniqueFolderName(state.icons, name?.trim() || "New Folder");
    const place =
      position ?? nextDesktopIconPosition(state.icons, "folder");
    const id = createId("folder");
    const icon: DesktopIcon = {
      id,
      label,
      type: "folder",
      x: place.x,
      y: place.y,
      parentId: null,
    };
    const icons = [...state.icons, icon];
    persist({ icons, documents: state.documents, wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor });
    set({
      icons,
      selectedIconId: id,
      renamingIconId: id,
      isStartMenuOpen: false,
    });
    return id;
  },

  startRename: (iconId) => {
    const icon = get().icons.find((item) => item.id === iconId);
    if (!icon) {
      return;
    }
    if (icon.type !== "folder" && icon.type !== "text") {
      return;
    }
    set({
      renamingIconId: iconId,
      selectedIconId: iconId,
      isStartMenuOpen: false,
    });
  },

  cancelRename: () => {
    set({ renamingIconId: null });
  },

  renameIcon: (iconId, label) => {
    const state = get();
    const icon = state.icons.find((item) => item.id === iconId);
    if (!icon) {
      return;
    }
    if (icon.type !== "folder" && icon.type !== "text") {
      return;
    }

    const nextLabel =
      icon.type === "text"
        ? stripTextExtension(label)
        : label.trim() || icon.label;

    if (!nextLabel) {
      set({ renamingIconId: null });
      return;
    }

    const icons = state.icons.map((item) =>
      item.id === iconId ? { ...item, label: nextLabel } : item,
    );

    const documents =
      icon.documentId != null
        ? state.documents.map((doc) =>
            doc.id === icon.documentId
              ? {
                  ...doc,
                  title: nextLabel,
                  updatedAt: new Date().toISOString(),
                }
              : doc,
          )
        : state.documents;

    const windows = state.windows.map((window) => {
      if (icon.type === "folder" && window.iconId === iconId) {
        return { ...window, title: nextLabel };
      }
      if (
        icon.documentId &&
        window.documentId === icon.documentId &&
        window.type === "editor"
      ) {
        return { ...window, title: `${nextLabel} - Notepad` };
      }
      return window;
    });

    persist({ icons, documents, wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor });
    set({ icons, documents, windows, renamingIconId: null });
  },

  deleteIcon: (iconId) => {
    const state = get();
    const icon = state.icons.find((item) => item.id === iconId);
    if (!icon || !canDeleteIcon(icon)) {
      return;
    }

    const removedIconIds = new Set<string>([iconId]);
    const removedDocumentIds = new Set<string>();

    if (icon.documentId) {
      removedDocumentIds.add(icon.documentId);
    }

    if (icon.type === "folder") {
      for (const child of state.icons) {
        if (child.parentId !== iconId) {
          continue;
        }
        removedIconIds.add(child.id);
        if (child.documentId) {
          removedDocumentIds.add(child.documentId);
        }
      }
    }

    const icons = state.icons.filter((item) => !removedIconIds.has(item.id));
    const documents = state.documents.filter(
      (doc) => !removedDocumentIds.has(doc.id),
    );
    const windows = state.windows.map((window) => {
      const removeWindow =
        removedIconIds.has(window.iconId) ||
        (window.documentId != null &&
          removedDocumentIds.has(window.documentId));
      if (!removeWindow) {
        return window;
      }
      return {
        ...window,
        isOpen: false,
        isFocused: false,
        isMinimized: false,
      };
    });

    persist({ icons, documents, wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor });
    set({
      icons,
      documents,
      windows,
      selectedIconId: removedIconIds.has(state.selectedIconId ?? "")
        ? null
        : state.selectedIconId,
      renamingIconId: removedIconIds.has(state.renamingIconId ?? "")
        ? null
        : state.renamingIconId,
    });
  },

  moveIconToFolder: (iconId, folderId, dropPosition) => {
    const state = get();
    const icon = state.icons.find((item) => item.id === iconId);
    if (!icon || !icon.documentId) {
      return;
    }

    if (folderId !== null) {
      const folder = state.icons.find(
        (item) => item.id === folderId && item.type === "folder",
      );
      if (!folder) {
        return;
      }
    }

    const position =
      folderId === null
        ? (dropPosition ??
          nextDesktopIconPosition(
            state.icons.filter((item) => item.id !== iconId),
            "file",
          ))
        : { x: icon.x, y: icon.y };

    const icons = state.icons.map((item) =>
      item.id === iconId
        ? {
            ...item,
            parentId: folderId,
            x: position.x,
            y: position.y,
          }
        : item,
    );

    persist({ icons, documents: state.documents, wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor });
    set({
      icons,
      selectedIconId:
        state.selectedIconId === iconId && folderId !== null
          ? null
          : state.selectedIconId,
    });
  },

  setWallpaper: (color) => {
    set((state) => {
      const wallpaper = color.toLowerCase();
      persist({
        icons: state.icons,
        documents: state.documents,
        wallpaper,
        titleBarColor: state.titleBarColor,
      });
      return { wallpaper };
    });
  },

  setTitleBarColor: (color) => {
    set((state) => {
      const titleBarColor = color.toLowerCase();
      persist({
        icons: state.icons,
        documents: state.documents,
        wallpaper: state.wallpaper,
        titleBarColor,
      });
      return { titleBarColor };
    });
  },

  resetTheme: () => {
    set((state) => {
      persist({
        icons: state.icons,
        documents: state.documents,
        wallpaper: DEFAULT_WALLPAPER,
        titleBarColor: DEFAULT_TITLE_BAR_COLOR,
      });
      return {
        wallpaper: DEFAULT_WALLPAPER,
        titleBarColor: DEFAULT_TITLE_BAR_COLOR,
      };
    });
  },
}));

export function selectDesktopIcons(icons: DesktopIcon[]): DesktopIcon[] {
  return icons.filter(isOnDesktop);
}

export function selectFolderContents(
  icons: DesktopIcon[],
  folderId: string,
): DesktopIcon[] {
  return icons.filter((icon) => icon.parentId === folderId);
}
