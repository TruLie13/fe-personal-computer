import { create } from "zustand";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import { createBbsSlice } from "@/store/slices/bbsSlice";
import { createCommentsSlice } from "@/store/slices/commentsSlice";
import { createFsSlice } from "@/store/slices/fsSlice";
import { createNetworkSlice } from "@/store/slices/networkSlice";
import { createProfileSlice } from "@/store/slices/profileSlice";
import { createSessionSlice } from "@/store/slices/sessionSlice";
import { createThemeSlice } from "@/store/slices/themeSlice";
import { createWindowSlice } from "@/store/slices/windowSlice";

export type { DesktopStore } from "@/store/desktopStoreTypes";

export {
  selectActiveIcons,
  selectActiveDocuments,
  selectActiveTextFileCount,
  selectActiveTitleBarColor,
  selectActiveWallpaper,
  selectDesktopIcons,
  selectFolderContents,
} from "@/store/desktopSelectors";

export const useDesktopStore = create<DesktopStore>()((...a) => ({
  ...createSessionSlice(...a),
  ...createThemeSlice(...a),
  ...createWindowSlice(...a),
  ...createFsSlice(...a),
  ...createBbsSlice(...a),
  ...createCommentsSlice(...a),
  ...createNetworkSlice(...a),
  ...createProfileSlice(...a),
}));
