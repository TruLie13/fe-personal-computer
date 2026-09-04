export type WindowType =
  | "about"
  | "folder"
  | "text"
  | "system"
  | "editor"
  | "display"
  | "bbs"
  | "network"
  | "stories"
  | "comments"
  | "guestbook"
  | "profile";

export interface DesktopIcon {
  id: string;
  label: string;
  type: WindowType;
  x: number;
  y: number;
  /** Present when this icon is a saved text document. */
  documentId?: string;
  /**
   * Folder that contains this icon. `undefined` / omitted means the desktop.
   * Only text document icons are moved into folders in the MVP.
   */
  parentId?: string | null;
}

export interface TextDocument {
  id: string;
  title: string;
  /** Stable public URL segment; set at create and not changed on rename. */
  slug: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  /** When true, indexed in Story Explorer / `publicStories`. */
  isPublic?: boolean;
}

export interface DesktopWindow {
  id: string;
  title: string;
  type: WindowType;
  iconId: string;
  documentId: string | null;
  isOpen: boolean;
  isFocused: boolean;
  isMinimized: boolean;
  /** Fills the desktop area above the taskbar. */
  isMaximized: boolean;
  /**
   * Geometry to restore when leaving maximized.
   * Only set while `isMaximized` is true.
   */
  restoreBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface DesktopPersistedState {
  icons: DesktopIcon[];
  documents: TextDocument[];
  wallpaper: string;
  titleBarColor: string;
  /** Near-black paper / white ink inside apps, folders, and editors. */
  contentDark: boolean;
  /** Taskbar height in px (Win95-style resizable). */
  taskbarHeight: number;
}
