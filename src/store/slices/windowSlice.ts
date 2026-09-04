import type { StateCreator } from "zustand";
import { fitWindowInDesktop, maximizedWindowBounds } from "@/lib/desktopBounds";
import {
  countsTowardOpenDocumentCap,
  MAX_OPEN_DOCUMENT_WINDOWS,
} from "@/lib/windowKinds";
import { folderWindowTitle, stripTextExtension } from "@/lib/storage";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import { isRemote, selectActiveIcons } from "@/store/desktopSelectors";
import { createWindowFromIcon } from "@/store/desktopWindowFactory";
import { selectionFromIcon } from "@/store/selectionState";
import type { DesktopWindow, WindowType } from "@/types/desktop";

export type WindowSlice = Pick<
  DesktopStore,
  | "windows"
  | "documentWindowFifo"
  | "nextZIndex"
  | "openWindow"
  | "closeWindow"
  | "closeAllWindows"
  | "minimizeWindow"
  | "toggleMaximizeWindow"
  | "syncMaximizedWindows"
  | "focusWindow"
  | "updateWindowPosition"
>;

function syncFifo(
  windows: DesktopWindow[],
  fifo: string[],
): string[] {
  const openIds = new Set(
    windows
      .filter(
        (window) =>
          window.isOpen && countsTowardOpenDocumentCap(window.type),
      )
      .map((window) => window.id),
  );
  const kept = fifo.filter((id) => openIds.has(id));
  for (const id of openIds) {
    if (!kept.includes(id)) {
      kept.push(id);
    }
  }
  return kept;
}

function reopenWindowBounds(
  window: DesktopWindow,
  taskbarHeight: number,
): Pick<DesktopWindow, "x" | "y" | "width" | "height"> {
  if (window.isMaximized) {
    return maximizedWindowBounds(taskbarHeight);
  }
  return fitWindowInDesktop(
    { x: window.x, y: window.y },
    { width: window.width, height: window.height },
    taskbarHeight,
  );
}
function makeRoomForDocumentWindow(
  windows: DesktopWindow[],
  fifo: string[],
  openingId: string,
  openingType: WindowType,
): { windows: DesktopWindow[]; fifo: string[] } {
  if (!countsTowardOpenDocumentCap(openingType)) {
    return { windows, fifo: syncFifo(windows, fifo) };
  }

  let nextWindows = windows;
  let nextFifo = syncFifo(windows, fifo).filter((id) => id !== openingId);

  const otherOpenCount = () =>
    nextWindows.filter(
      (window) =>
        window.isOpen &&
        window.id !== openingId &&
        countsTowardOpenDocumentCap(window.type),
    ).length;

  while (
    otherOpenCount() >= MAX_OPEN_DOCUMENT_WINDOWS &&
    nextFifo.length > 0
  ) {
    const oldestId = nextFifo[0]!;
    nextFifo = nextFifo.slice(1);
    nextWindows = nextWindows.map((window) =>
      window.id === oldestId
        ? {
            ...window,
            isOpen: false,
            isFocused: false,
            isMinimized: false,
          }
        : window,
    );
  }

  return {
    windows: nextWindows,
    fifo: [...nextFifo, openingId],
  };
}

export const createWindowSlice: StateCreator<
  DesktopStore,
  [],
  [],
  WindowSlice
> = (set, get) => ({
  windows: [],
  documentWindowFifo: [],
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
      const capped = makeRoomForDocumentWindow(
        state.windows.map((window) => ({ ...window, isFocused: false })),
        state.documentWindowFifo,
        nextWindow.id,
        nextWindow.type,
      );
      set({
        windows: [...capped.windows, nextWindow],
        documentWindowFifo: capped.fifo,
        nextZIndex: zIndex + 1,
        ...selectionFromIcon(iconId),
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
      const bounds = reopenWindowBounds(existing, state.taskbarHeight);
      set({
        windows: state.windows.map((window) =>
          window.id === existing.id
            ? {
                ...window,
                ...bounds,
                isOpen: true,
                isMinimized: false,
                isFocused: true,
                zIndex,
              }
            : { ...window, isFocused: false },
        ),
        nextZIndex: zIndex + 1,
        ...selectionFromIcon(iconId),
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
        const wasOpen = existingDocWindow.isOpen;
        if (wasOpen) {
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
            ...selectionFromIcon(iconId),
            isStartMenuOpen: false,
          });
          return;
        }

        const capped = makeRoomForDocumentWindow(
          state.windows.map((window) => ({ ...window, isFocused: false })),
          state.documentWindowFifo,
          existingDocWindow.id,
          existingDocWindow.type,
        );
        set({
          windows: capped.windows.map((window) =>
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
              : window,
          ),
          documentWindowFifo: capped.fifo,
          nextZIndex: zIndex + 1,
          ...selectionFromIcon(iconId),
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
      const bounds = reopenWindowBounds(closed, state.taskbarHeight);
      const capped = makeRoomForDocumentWindow(
        state.windows.map((window) => ({ ...window, isFocused: false })),
        state.documentWindowFifo,
        closed.id,
        closed.type,
      );
      set({
        windows: capped.windows.map((window) =>
          window.id === closed.id
            ? {
                ...window,
                ...bounds,
                isOpen: true,
                isMinimized: false,
                isFocused: true,
                zIndex,
                title:
                  icon.type === "folder"
                    ? folderWindowTitle(icons, icon.id)
                    : window.title,
              }
            : window,
        ),
        documentWindowFifo: capped.fifo,
        nextZIndex: zIndex + 1,
        ...selectionFromIcon(iconId),
        isStartMenuOpen: false,
      });
      return;
    }

    const zIndex = state.nextZIndex;
    const openCount = state.windows.filter((window) => window.isOpen).length;
    const nextWindow = createWindowFromIcon(icon, zIndex, openCount, icons);
    const capped = makeRoomForDocumentWindow(
      state.windows.map((window) => ({ ...window, isFocused: false })),
      state.documentWindowFifo,
      nextWindow.id,
      nextWindow.type,
    );

    set({
      windows: [...capped.windows, nextWindow],
      documentWindowFifo: capped.fifo,
      nextZIndex: zIndex + 1,
      ...selectionFromIcon(iconId),
      isStartMenuOpen: false,
    });
  },

  closeWindow: (windowId) => {
    set((state) => {
      const windows = state.windows.map((window) =>
        window.id === windowId
          ? { ...window, isOpen: false, isFocused: false, isMinimized: false, isMaximized: false, restoreBounds: undefined }
          : window,
      );
      return {
        windows,
        documentWindowFifo: state.documentWindowFifo.filter(
          (id) => id !== windowId,
        ),
      };
    });
  },

  closeAllWindows: () => {
    set((state) => ({
      windows: state.windows.map((window) =>
        window.isOpen
          ? {
              ...window,
              isOpen: false,
              isFocused: false,
              isMinimized: false,
              isMaximized: false,
              restoreBounds: undefined,
            }
          : window,
      ),
      documentWindowFifo: [],
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

  toggleMaximizeWindow: (windowId) => {
    const state = get();
    const target = state.windows.find((window) => window.id === windowId);
    if (!target || !target.isOpen) {
      return;
    }
    const zIndex = state.nextZIndex;
    if (target.isMaximized && target.restoreBounds) {
      const { x, y, width, height } = target.restoreBounds;
      set({
        windows: state.windows.map((window) =>
          window.id === windowId
            ? {
                ...window,
                isMaximized: false,
                restoreBounds: undefined,
                isFocused: true,
                isMinimized: false,
                x,
                y,
                width,
                height,
                zIndex,
              }
            : { ...window, isFocused: false },
        ),
        nextZIndex: zIndex + 1,
        isStartMenuOpen: false,
      });
      return;
    }

    const bounds = maximizedWindowBounds(state.taskbarHeight);
    set({
      windows: state.windows.map((window) =>
        window.id === windowId
          ? {
              ...window,
              isMaximized: true,
              restoreBounds: {
                x: window.x,
                y: window.y,
                width: window.width,
                height: window.height,
              },
              isFocused: true,
              isMinimized: false,
              ...bounds,
              zIndex,
            }
          : { ...window, isFocused: false },
      ),
      nextZIndex: zIndex + 1,
      isStartMenuOpen: false,
    });
  },

  syncMaximizedWindows: () => {
    const state = get();
    if (!state.windows.some((window) => window.isMaximized && window.isOpen)) {
      return;
    }
    const bounds = maximizedWindowBounds(state.taskbarHeight);
    set({
      windows: state.windows.map((window) =>
        window.isMaximized && window.isOpen
          ? { ...window, ...bounds }
          : window,
      ),
    });
  },

  focusWindow: (windowId) => {
    const state = get();
    const target = state.windows.find((window) => window.id === windowId);
    if (!target || !target.isOpen) {
      return;
    }

    const zIndex = state.nextZIndex;
    const bounds = reopenWindowBounds(target, state.taskbarHeight);
    set({
      windows: state.windows.map((window) =>
        window.id === windowId
          ? {
              ...window,
              ...bounds,
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
      windows: state.windows.map((window) => {
        if (window.id !== windowId || window.isMaximized) {
          return window;
        }
        return { ...window, x, y };
      }),
    }));
  },
});
