import { centeredWindowPosition } from "@/lib/desktopBounds";
import { folderWindowTitle, stripTextExtension } from "@/lib/storage";
import type { DesktopIcon, DesktopWindow, WindowType } from "@/types/desktop";

export const WINDOW_DEFAULTS: Record<
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
  comments: { title: "Comments", width: 420, height: 360 },
  guestbook: { title: "Guest Book", width: 520, height: 420 },
  profile: { title: "Profile", width: 420, height: 360 },
};

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Cascade offset used by icon-backed and typed (non-icon) windows. */
export function cascadedWindowPosition(openCount: number): {
  x: number;
  y: number;
} {
  return {
    x: 80 + openCount * 24,
    y: 48 + openCount * 24,
  };
}

/**
 * Create an app window that is not backed by a desktop icon
 * (e.g. Comments opened from Story Explorer / Notepad).
 */
export function createTypedWindow(input: {
  type: WindowType;
  title: string;
  iconId: string;
  documentId?: string | null;
  zIndex: number;
  openCount: number;
  idPrefix?: string;
}): DesktopWindow {
  const defaults = WINDOW_DEFAULTS[input.type];
  const position =
    input.openCount === 0
      ? centeredWindowPosition({
          width: defaults.width,
          height: defaults.height,
        })
      : cascadedWindowPosition(input.openCount);

  return {
    id: createId(input.idPrefix ?? `window-${input.type}`),
    title: input.title,
    type: input.type,
    iconId: input.iconId,
    documentId: input.documentId ?? null,
    isOpen: true,
    isFocused: true,
    isMinimized: false,
    isMaximized: false,
    ...position,
    width: defaults.width,
    height: defaults.height,
    zIndex: input.zIndex,
  };
}

export function createWindowFromIcon(
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
    isMaximized: false,
    ...(icon.type === "profile"
      ? centeredWindowPosition({
          width: defaults.width,
          height: defaults.height,
        })
      : cascadedWindowPosition(offset)),
    width: defaults.width,
    height: defaults.height,
    zIndex,
  };
}
