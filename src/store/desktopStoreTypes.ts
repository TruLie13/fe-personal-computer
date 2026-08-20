import type {
  DesktopIcon,
  DesktopWindow,
  TextDocument,
} from "@/types/desktop";
import type {
  BbsPost,
  DesktopViewMode,
  FavoritePc,
  NetworkUserId,
  UserProfile,
} from "@/types/network";

export interface DesktopStore {
  icons: DesktopIcon[];
  documents: TextDocument[];
  windows: DesktopWindow[];
  /**
   * FIFO of open document-window ids (folder / text / editor).
   * Apps are excluded. Used to close the oldest when over the open cap.
   */
  documentWindowFifo: string[];
  wallpaper: string;
  titleBarColor: string;
  contentDark: boolean;
  taskbarHeight: number;
  selectedIconId: string | null;
  /** Multi-select (marquee / additive). Primary is still `selectedIconId`. */
  selectedIconIds: string[];
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
  setSelectedIcons: (iconIds: string[]) => void;
  toggleStartMenu: () => void;
  closeStartMenu: () => void;
  openWindow: (iconId: string) => void;
  closeWindow: (windowId: string) => void;
  /** Close every open window (taskbar + desktop). */
  closeAllWindows: () => void;
  minimizeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, x: number, y: number) => void;
  updateIconPosition: (iconId: string, x: number, y: number) => void;
  updateDocumentContent: (
    windowId: string,
    content: string,
    title?: string,
  ) => void;
  saveDocumentFromWindow: (
    windowId: string,
    title: string,
    content: string,
  ) => void;
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
  /** Delete many deletable icons in one FS write (skips pinned / apps). */
  deleteIcons: (iconIds: ReadonlyArray<string>) => void;
  setWallpaper: (color: string) => void;
  setTitleBarColor: (color: string) => void;
  setContentDark: (enabled: boolean) => void;
  setTaskbarHeight: (height: number) => void;
  resetTheme: () => void;
  visitRemotePc: (userId: NetworkUserId) => void;
  goHome: () => void;
  /** Deep-link entry: visit PC and optionally open a file (+ parent folder). */
  applyDeepLink: (input: {
    username: string;
    fileSlug?: string;
  }) => void;
  addFavorite: (userId: NetworkUserId) => void;
  removeFavorite: (userId: NetworkUserId) => void;
  postBbsNote: (title: string, content: string) => string;
  /** Soft-delete own post; does not refund the UTC daily create quota. */
  deleteBbsNote: (postId: string) => boolean;
  updateLocalProfile: (patch: Partial<UserProfile>) => void;
  openProfile: () => void;
}
