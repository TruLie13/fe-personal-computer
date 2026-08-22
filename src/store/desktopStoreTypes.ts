import type {
  DesktopIcon,
  DesktopWindow,
  TextDocument,
} from "@/types/desktop";
import type {
  BbsPost,
  DesktopViewMode,
  FavoritePc,
  GuestbookEntry,
  NetworkUserId,
  StoryComment,
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
  localStoryComments: StoryComment[];
  localGuestbookEntries: GuestbookEntry[];
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
  /** Toggle fill-desktop maximize / restore previous size. */
  toggleMaximizeWindow: (windowId: string) => void;
  /** Keep maximized windows fitted after viewport / taskbar changes. */
  syncMaximizedWindows: () => void;
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
  postStoryComment: (documentId: string, content: string) => string;
/** Soft-delete own comment; does not refund the UTC daily create quota. */
  deleteStoryComment: (commentId: string) => boolean;
  /** One Comments window per story `documentId` (focus if already open). */
  openStoryComments: (input: {
    documentId: string;
    storyTitle: string;
  }) => void;
  /** Leave a message on another user's Guest Book (remote visit only). */
  signGuestbook: (hostUserId: NetworkUserId, content: string) => string;
  /** Soft-delete; host (own PC) or author. Does not refund daily sign quota. */
  deleteGuestbookEntry: (entryId: string) => boolean;
  updateLocalProfile: (patch: Partial<UserProfile>) => void;
  openProfile: () => void;
}
