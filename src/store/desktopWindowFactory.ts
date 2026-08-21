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
