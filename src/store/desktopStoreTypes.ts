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
  wallpaper: string;
  titleBarColor: string;
  contentDark: boolean;
  taskbarHeight: number;
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
  setWallpaper: (color: string) => void;
  setTitleBarColor: (color: string) => void;
  setContentDark: (enabled: boolean) => void;
  setTaskbarHeight: (height: number) => void;
  resetTheme: () => void;
  visitRemotePc: (userId: NetworkUserId) => void;
  goHome: () => void;
  addFavorite: (userId: NetworkUserId) => void;
  removeFavorite: (userId: NetworkUserId) => void;
  postBbsNote: (title: string, content: string) => string;
  updateLocalProfile: (patch: Partial<UserProfile>) => void;
  openProfile: () => void;
}
