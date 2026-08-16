import { create } from "zustand";
import { centeredWindowPosition } from "@/lib/desktopBounds";
import { loadLocalBbsNotes, saveLocalBbsNotes } from "@/lib/bbsNotes";
import {
  isFavorite,
  loadFavorites,
  saveFavorites,
} from "@/lib/favorites";
import { getNetworkUser, LOCAL_USER_ID } from "@/lib/networkSeed";
import {
  computerLabel,
  DEFAULT_LOCAL_PROFILE,
  loadLocalProfile,
  saveLocalProfile,
} from "@/lib/profile";
import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
  DEFAULT_CONTENT_DARK,
  PROFILE_ICON_ID,
  PROFILE_ICON_POSITION,
  canDeleteIcon,
  folderWindowTitle,
  isOnDesktop,
  isPinnedProfileIcon,
  loadDesktopState,
  nextDesktopIconPosition,
  saveDesktopState,
  stripTextExtension,
  uniqueFolderName,
  uniqueTextFileName,
} from "@/lib/storage";
import type {
  DesktopIcon,
  DesktopWindow,
  TextDocument,
  WindowType,
} from "@/types/desktop";
import type {
  BbsPost,
  DesktopViewMode,
  FavoritePc,
  NetworkUserId,
  UserProfile,
} from "@/types/network";

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
  bbs: { title: "Bulletin Board", width: 520, height: 440 },
  network: { title: "Network Neighborhood", width: 480, height: 360 },
  stories: { title: "Story Explorer", width: 560, height: 420 },
  profile: { title: "Profile", width: 420, height: 360 },
};

interface DesktopStore {
  icons: DesktopIcon[];
  documents: TextDocument[];
  windows: DesktopWindow[];
  wallpaper: string;
  titleBarColor: string;
  contentDark: boolean;
  selectedIconId: string | null;
  isStartMenuOpen: boolean;
  nextZIndex: number;
  hydrated: boolean;
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  favorites: FavoritePc[];
  localBbsNotes: BbsPost[];
  localProfile: UserProfile;
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
    parentId?: string | null,
  ) => string | null;
  createTextFile: (
    parentId?: string | null,
    name?: string,
  ) => string | null;
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
  setContentDark: (enabled: boolean) => void;
  resetTheme: () => void;
  visitRemotePc: (userId: NetworkUserId) => void;
  goHome: () => void;
  addFavorite: (userId: NetworkUserId) => void;
  removeFavorite: (userId: NetworkUserId) => void;
  postBbsNote: (title: string, content: string) => string;
  updateLocalProfile: (patch: Partial<UserProfile>) => void;
  openProfile: () => void;
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
    contentDark: useDesktopStore.getState().contentDark,
  });
}

function persistFavorites(favorites: FavoritePc[]): void {
  saveFavorites(favorites);
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createWindowFromIcon(
  icon: DesktopIcon,
  zIndex: number,
  offset: number,
  allIcons: DesktopIcon[] = [],
): DesktopWindow {
  const isEditor = icon.type === "editor" || icon.type === "text";
  const defaults = WINDOW_DEFAULTS[isEditor ? "editor" : icon.type];
  const title =
    icon.type === "editor"
      ? "Untitled - Notepad"
      : icon.type === "text"
        ? `${stripTextExtension(icon.label)} - Notepad`
        : icon.type === "folder"
          ? folderWindowTitle(
              allIcons.length > 0 ? allIcons : [icon],
              icon.id,
            )
          : icon.type === "profile"
            ? icon.label
            : defaults.title;

  return {
    id:
      icon.type === "editor" || icon.type === "text" || Boolean(icon.documentId)
        ? createId("window")
        : `window-${icon.id}`,
    title,
    type: isEditor ? "editor" : icon.type,
    iconId: icon.id,
    documentId: icon.documentId ?? null,
    isOpen: true,
    isFocused: true,
    isMinimized: false,
    ...(icon.type === "profile"
      ? centeredWindowPosition({
          width: defaults.width,
          height: defaults.height,
        })
      : {
          x: 80 + offset * 24,
          y: 48 + offset * 24,
        }),
    width: defaults.width,
    height: defaults.height,
    zIndex,
  };
}

function isRemote(state: { viewMode: DesktopViewMode }): boolean {
  return state.viewMode === "remote";
}

const EMPTY_ICONS: DesktopIcon[] = [];
const EMPTY_DOCUMENTS: TextDocument[] = [];

let lastActiveIconsSource: DesktopIcon[] | null = null;
let lastActiveIconsResult: DesktopIcon[] | null = null;

export function selectActiveIcons(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  icons: DesktopIcon[];
}): DesktopIcon[] {
  const source =
    state.viewMode === "remote" && state.remoteUserId
      ? (getNetworkUser(state.remoteUserId)?.snapshot.icons ?? EMPTY_ICONS)
      : state.icons;

  // Cache by source identity — .map() would return a new array every
  // getSnapshot and trip useSyncExternalStore into an infinite loop.
  if (source === lastActiveIconsSource && lastActiveIconsResult) {
    return lastActiveIconsResult;
  }

  const needsPin = source.some(
    (icon) =>
      isPinnedProfileIcon(icon) &&
      (icon.x !== PROFILE_ICON_POSITION.x ||
        icon.y !== PROFILE_ICON_POSITION.y ||
        icon.parentId != null),
  );

  const result = needsPin
    ? source.map((icon) => {
        if (!isPinnedProfileIcon(icon)) {
          return icon;
        }
        if (
          icon.x === PROFILE_ICON_POSITION.x &&
          icon.y === PROFILE_ICON_POSITION.y &&
          icon.parentId == null
        ) {
          return icon;
        }
        return {
          ...icon,
          x: PROFILE_ICON_POSITION.x,
          y: PROFILE_ICON_POSITION.y,
          ...(icon.parentId != null ? { parentId: null } : {}),
        };
      })
    : source;

  lastActiveIconsSource = source;
  lastActiveIconsResult = result;
  return result;
}

export function selectActiveDocuments(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  documents: TextDocument[];
}): TextDocument[] {
  if (state.viewMode === "remote" && state.remoteUserId) {
    return (
      getNetworkUser(state.remoteUserId)?.snapshot.documents ?? EMPTY_DOCUMENTS
    );
  }
  return state.documents;
}

export function selectActiveWallpaper(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  wallpaper: string;
}): string {
  if (state.viewMode === "remote" && state.remoteUserId) {
    return (
      getNetworkUser(state.remoteUserId)?.snapshot.wallpaper ?? state.wallpaper
    );
  }
  return state.wallpaper;
}

export function selectActiveTitleBarColor(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  titleBarColor: string;
}): string {
  if (state.viewMode === "remote" && state.remoteUserId) {
    return (
      getNetworkUser(state.remoteUserId)?.snapshot.titleBarColor ??
      state.titleBarColor
    );
  }
  return state.titleBarColor;
}

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  icons: DEFAULT_ICONS,
  documents: DEFAULT_DOCUMENTS,
  windows: [],
  wallpaper: DEFAULT_WALLPAPER,
  titleBarColor: DEFAULT_TITLE_BAR_COLOR,
  contentDark: DEFAULT_CONTENT_DARK,
  selectedIconId: null,
  renamingIconId: null,
  isStartMenuOpen: false,
  nextZIndex: 1,
  hydrated: false,
  viewMode: "local",
  remoteUserId: null,
  favorites: [],
  localBbsNotes: [],
  localProfile: DEFAULT_LOCAL_PROFILE,

  hydrate: () => {
    if (get().hydrated) {
      return;
    }
    const saved = loadDesktopState();
    const localProfile = loadLocalProfile();
    const icons = saved.icons.map((icon) =>
      icon.id === PROFILE_ICON_ID
        ? { ...icon, label: computerLabel(localProfile.displayName) }
        : icon,
    );
    set({
      icons,
      documents: saved.documents,
      wallpaper: saved.wallpaper,
      titleBarColor: saved.titleBarColor,
      contentDark: saved.contentDark,
      favorites: loadFavorites(),
      localBbsNotes: loadLocalBbsNotes(),
      localProfile,
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
    const icons = selectActiveIcons(state);
    const icon = icons.find((item) => item.id === iconId);
    if (!icon) {
      return;
    }

    if (icon.type === "editor") {
      if (isRemote(state)) {
        return;
      }
      const zIndex = state.nextZIndex;
      const openCount = state.windows.filter((window) => window.isOpen).length;
      const nextWindow = createWindowFromIcon(icon, zIndex, openCount, icons);
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

    if (icon.type === "display" && isRemote(state)) {
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

    if (icon.documentId) {
      const existingDocWindow = state.windows.find(
        (window) => window.documentId === icon.documentId,
      );
      if (existingDocWindow) {
        const zIndex = state.nextZIndex;
        set({
          windows: state.windows.map((window) =>
            window.id === existingDocWindow.id
              ? {
                  ...window,
                  iconId,
                  title:
                    icon.type === "text"
                      ? `${stripTextExtension(icon.label)} - Notepad`
                      : window.title,
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

    const closed = state.windows.find(
      (window) => window.iconId === iconId && !window.isOpen,
    );
    if (closed) {
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
                  icon.type === "folder"
                    ? folderWindowTitle(icons, icon.id)
                    : window.title,
              }
            : { ...window, isFocused: false },
        ),
        nextZIndex: zIndex + 1,
        selectedIconId: iconId,
        isStartMenuOpen: false,
      });
      return;
    }

    const zIndex = state.nextZIndex;
    const openCount = state.windows.filter((window) => window.isOpen).length;
    const nextWindow = createWindowFromIcon(icon, zIndex, openCount, icons);

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
    if (isRemote(get())) {
      return;
    }
    set((state) => {
      const target = state.icons.find((icon) => icon.id === iconId);
      if (!target || isPinnedProfileIcon(target)) {
        return state;
      }
      const icons = state.icons.map((icon) =>
        icon.id === iconId ? { ...icon, x, y } : icon,
      );
      persist({
        icons,
        documents: state.documents,
        wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor,
      });
      return { icons };
    });
  },

  updateDocumentContent: (windowId, content, title) => {
    if (isRemote(get())) {
      return;
    }
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
    if (isRemote(get())) {
      return;
    }
    const state = get();
    const target = state.windows.find((window) => window.id === windowId);
    if (!target) {
      return;
    }

    const now = new Date().toISOString();

    if (target.documentId) {
      const existingIcon = state.icons.find(
        (icon) => icon.documentId === target.documentId,
      );
      const fileTitle = uniqueTextFileName(
        state.icons,
        existingIcon?.parentId ?? null,
        title,
        existingIcon?.id ?? null,
      );
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
      persist({
        icons,
        documents,
        wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor,
      });
      set({ documents, icons, windows });
      return;
    }

    const fileTitle = uniqueTextFileName(state.icons, null, title);
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

    persist({
      icons,
      documents,
      wallpaper: state.wallpaper,
      titleBarColor: state.titleBarColor,
    });
    set({ documents, icons, windows });
  },

  createFolder: (name, position, parentId) => {
    if (isRemote(get())) {
      return null;
    }
    const state = get();
    const parent = parentId ?? null;

    if (parent !== null) {
      const folder = state.icons.find(
        (item) => item.id === parent && item.type === "folder",
      );
      if (!folder) {
        return null;
      }
    }

    const label = uniqueFolderName(
      state.icons,
      name?.trim() || "New Folder",
      null,
      parent,
    );
    const place =
      parent === null
        ? (position ?? nextDesktopIconPosition(state.icons, "folder"))
        : { x: 0, y: 0 };
    const id = createId("folder");
    const icon: DesktopIcon = {
      id,
      label,
      type: "folder",
      x: place.x,
      y: place.y,
      parentId: parent,
    };
    const icons = [...state.icons, icon];
    persist({
      icons,
      documents: state.documents,
      wallpaper: state.wallpaper,
      titleBarColor: state.titleBarColor,
    });
    set({
      icons,
      selectedIconId: id,
      renamingIconId: id,
      isStartMenuOpen: false,
    });
    return id;
  },

  createTextFile: (parentId, name) => {
    if (isRemote(get())) {
      return null;
    }
    const state = get();
    const parent = parentId ?? null;

    if (parent !== null) {
      const folder = state.icons.find(
        (item) => item.id === parent && item.type === "folder",
      );
      if (!folder) {
        return null;
      }
    }

    const now = new Date().toISOString();
    const label = uniqueTextFileName(
      state.icons,
      parent,
      name?.trim() || "New Text Document",
    );
    const documentId = createId("doc");
    const place =
      parent === null
        ? nextDesktopIconPosition(state.icons, "file")
        : { x: 0, y: 0 };
    const document: TextDocument = {
      id: documentId,
      title: label,
      content: "",
      createdAt: now,
      updatedAt: now,
    };
    const iconId = `file-${documentId}`;
    const icon: DesktopIcon = {
      id: iconId,
      label,
      type: "text",
      x: place.x,
      y: place.y,
      documentId,
      parentId: parent,
    };

    const documents = [...state.documents, document];
    const icons = [...state.icons, icon];
    persist({
      icons,
      documents,
      wallpaper: state.wallpaper,
      titleBarColor: state.titleBarColor,
    });
    set({
      documents,
      icons,
      selectedIconId: iconId,
      renamingIconId: iconId,
      isStartMenuOpen: false,
    });
    return iconId;
  },

  startRename: (iconId) => {
    if (isRemote(get())) {
      return;
    }
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
    if (isRemote(get())) {
      return;
    }
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
        ? uniqueTextFileName(
            state.icons,
            icon.parentId ?? null,
            label,
            icon.id,
          )
        : uniqueFolderName(
            state.icons,
            label.trim() || icon.label,
            icon.id,
            icon.parentId ?? null,
          );

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
      if (window.type === "folder") {
        return {
          ...window,
          title: folderWindowTitle(icons, window.iconId),
        };
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

    persist({
      icons,
      documents,
      wallpaper: state.wallpaper,
      titleBarColor: state.titleBarColor,
    });
    set({ icons, documents, windows, renamingIconId: null });
  },

  deleteIcon: (iconId) => {
    if (isRemote(get())) {
      return;
    }
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

    persist({
      icons,
      documents,
      wallpaper: state.wallpaper,
      titleBarColor: state.titleBarColor,
    });
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
    if (isRemote(get())) {
      return;
    }
    const state = get();
    const icon = state.icons.find((item) => item.id === iconId);
    const movable =
      icon &&
      (icon.type === "folder" ||
        icon.type === "text" ||
        Boolean(icon.documentId));
    if (!icon || !movable) {
      return;
    }

    if (folderId !== null) {
      const folder = state.icons.find(
        (item) => item.id === folderId && item.type === "folder",
      );
      if (!folder) {
        return;
      }
      // Block moving a folder into itself or one of its descendants.
      if (icon.type === "folder") {
        let walk: string | null = folderId;
        while (walk) {
          if (walk === icon.id) {
            return;
          }
          walk =
            state.icons.find((item) => item.id === walk)?.parentId ?? null;
        }
      }
    }

    const currentParent = icon.parentId ?? null;
    if (currentParent === folderId) {
      return;
    }

    const position =
      folderId === null
        ? (dropPosition ??
          nextDesktopIconPosition(
            state.icons.filter((item) => item.id !== iconId),
            icon.type === "folder" ? "folder" : "file",
          ))
        : { x: icon.x, y: icon.y };

    const nextLabel =
      icon.type === "folder"
        ? uniqueFolderName(state.icons, icon.label, icon.id, folderId)
        : uniqueTextFileName(state.icons, folderId, icon.label, icon.id);
    const renamed = nextLabel !== icon.label;

    const icons = state.icons.map((item) =>
      item.id === iconId
        ? {
            ...item,
            parentId: folderId,
            x: position.x,
            y: position.y,
            label: nextLabel,
          }
        : item,
    );

    const documents =
      renamed && icon.documentId
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

    const windows = renamed
      ? state.windows.map((window) => {
          if (window.type === "folder") {
            return {
              ...window,
              title: folderWindowTitle(icons, window.iconId),
            };
          }
          if (
            icon.documentId &&
            window.documentId === icon.documentId &&
            window.type === "editor"
          ) {
            return { ...window, title: `${nextLabel} - Notepad` };
          }
          return window;
        })
      : icon.type === "folder"
        ? state.windows.map((window) =>
            window.type === "folder"
              ? {
                  ...window,
                  title: folderWindowTitle(icons, window.iconId),
                }
              : window,
          )
        : state.windows;

    persist({
      icons,
      documents,
      wallpaper: state.wallpaper,
      titleBarColor: state.titleBarColor,
    });
    set({
      icons,
      documents,
      windows,
      selectedIconId:
        state.selectedIconId === iconId && folderId !== null
          ? null
          : state.selectedIconId,
    });
  },

  setWallpaper: (color) => {
    if (isRemote(get())) {
      return;
    }
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
    if (isRemote(get())) {
      return;
    }
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

  setContentDark: (enabled) => {
    if (isRemote(get())) {
      return;
    }
    set((state) => {
      saveDesktopState({
        icons: state.icons,
        documents: state.documents,
        wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor,
        contentDark: enabled,
      });
      return { contentDark: enabled };
    });
  },

  resetTheme: () => {
    if (isRemote(get())) {
      return;
    }
    set((state) => {
      saveDesktopState({
        icons: state.icons,
        documents: state.documents,
        wallpaper: DEFAULT_WALLPAPER,
        titleBarColor: DEFAULT_TITLE_BAR_COLOR,
        contentDark: DEFAULT_CONTENT_DARK,
      });
      return {
        wallpaper: DEFAULT_WALLPAPER,
        titleBarColor: DEFAULT_TITLE_BAR_COLOR,
        contentDark: DEFAULT_CONTENT_DARK,
      };
    });
  },

  visitRemotePc: (userId) => {
    const user = getNetworkUser(userId);
    if (!user) {
      return;
    }
    const profileIcon = user.snapshot.icons.find(
      (icon) => icon.type === "profile",
    );
    const windows: DesktopWindow[] = [];
    let nextZIndex = 1;
    if (profileIcon) {
      windows.push(createWindowFromIcon(profileIcon, 1, 0, user.snapshot.icons));
      nextZIndex = 2;
    }
    set({
      viewMode: "remote",
      remoteUserId: userId,
      windows,
      selectedIconId: profileIcon?.id ?? null,
      renamingIconId: null,
      isStartMenuOpen: false,
      nextZIndex,
    });
  },

  goHome: () => {
    set({
      viewMode: "local",
      remoteUserId: null,
      windows: [],
      selectedIconId: null,
      renamingIconId: null,
      isStartMenuOpen: false,
      nextZIndex: 1,
    });
  },

  addFavorite: (userId) => {
    if (!getNetworkUser(userId)) {
      return;
    }
    set((state) => {
      if (isFavorite(state.favorites, userId)) {
        return state;
      }
      const favorites = [
        ...state.favorites,
        { userId, addedAt: new Date().toISOString() },
      ];
      persistFavorites(favorites);
      return { favorites };
    });
  },

  removeFavorite: (userId) => {
    set((state) => {
      const favorites = state.favorites.filter(
        (favorite) => favorite.userId !== userId,
      );
      persistFavorites(favorites);
      return { favorites };
    });
  },

  postBbsNote: (title, content) => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) {
      return "";
    }
    const note: BbsPost = {
      id: createId("bbs"),
      authorId: LOCAL_USER_ID,
      title: trimmedTitle,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const localBbsNotes = [note, ...state.localBbsNotes];
      saveLocalBbsNotes(localBbsNotes);
      return { localBbsNotes };
    });
    return note.id;
  },

  updateLocalProfile: (patch) => {
    if (isRemote(get())) {
      return;
    }
    set((state) => {
      const localProfile: UserProfile = {
        ...state.localProfile,
        ...patch,
        displayName:
          patch.displayName !== undefined
            ? patch.displayName.trim() || state.localProfile.displayName
            : state.localProfile.displayName,
        computerName:
          patch.computerName !== undefined
            ? patch.computerName.trim().toUpperCase() ||
              state.localProfile.computerName
            : state.localProfile.computerName,
        bio: patch.bio !== undefined ? patch.bio : state.localProfile.bio,
        avatarColor:
          patch.avatarColor !== undefined
            ? patch.avatarColor
            : state.localProfile.avatarColor,
        avatarUrl:
          patch.avatarUrl !== undefined
            ? patch.avatarUrl
            : state.localProfile.avatarUrl,
      };
      saveLocalProfile(localProfile);
      const label = computerLabel(localProfile.displayName);
      const icons = state.icons.map((icon) =>
        icon.id === PROFILE_ICON_ID ? { ...icon, label } : icon,
      );
      const windows = state.windows.map((window) =>
        window.type === "profile" && window.iconId === PROFILE_ICON_ID
          ? { ...window, title: label }
          : window,
      );
      persist({
        icons,
        documents: state.documents,
        wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor,
      });
      return { localProfile, icons, windows };
    });
  },

  openProfile: () => {
    const state = get();
    const icons = selectActiveIcons(state);
    const profileIcon =
      icons.find((icon) => icon.type === "profile") ??
      icons.find((icon) => icon.id === PROFILE_ICON_ID);
    if (profileIcon) {
      get().openWindow(profileIcon.id);
      return;
    }
    if (state.viewMode === "local") {
      get().openWindow(PROFILE_ICON_ID);
    }
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
