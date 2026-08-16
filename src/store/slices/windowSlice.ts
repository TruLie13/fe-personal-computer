import type { StateCreator } from "zustand";
import { folderWindowTitle, stripTextExtension } from "@/lib/storage";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import { isRemote, selectActiveIcons } from "@/store/desktopSelectors";
import { createWindowFromIcon } from "@/store/desktopWindowFactory";

export type WindowSlice = Pick<
  DesktopStore,
  | "windows"
  | "nextZIndex"
  | "openWindow"
  | "closeWindow"
  | "minimizeWindow"
  | "focusWindow"
  | "updateWindowPosition"
>;

export const createWindowSlice: StateCreator<
  DesktopStore,
  [],
  [],
  WindowSlice
> = (set, get) => ({
  windows: [],
  nextZIndex: 1,
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
});
