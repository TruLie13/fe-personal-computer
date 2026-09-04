import type { StateCreator } from "zustand";
import {
  computerLabel,
  clampBio,
  clampComputerName,
  clampDisplayName,
  DEFAULT_LOCAL_PROFILE,
  saveLocalProfile,
} from "@/lib/profile";
import { scheduleRemoteProfileSave } from "@/lib/remoteDesktopPersist";
import { PROFILE_ICON_ID } from "@/lib/storage";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import { selectActiveIcons } from "@/store/desktopSelectors";
import {
  assertLocalWritable,
  commitDesktopPatch,
} from "@/store/desktopWrite";
import type { UserProfile } from "@/types/network";

export type ProfileSlice = Pick<
  DesktopStore,
  "localProfile" | "updateLocalProfile" | "openProfile"
>;

export const createProfileSlice: StateCreator<
  DesktopStore,
  [],
  [],
  ProfileSlice
> = (set, get) => ({
  localProfile: DEFAULT_LOCAL_PROFILE,

  updateLocalProfile: (patch) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    set((state) => {
      const localProfile: UserProfile = {
        ...state.localProfile,
        ...patch,
        displayName:
          patch.displayName !== undefined
            ? clampDisplayName(
                patch.displayName.trim() || state.localProfile.displayName,
              )
            : state.localProfile.displayName,
        computerName:
          patch.computerName !== undefined
            ? clampComputerName(
                patch.computerName.trim() || state.localProfile.computerName,
              )
            : state.localProfile.computerName,
        bio:
          patch.bio !== undefined ? clampBio(patch.bio) : state.localProfile.bio,
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
      scheduleRemoteProfileSave(localProfile);
      const label = computerLabel(localProfile.displayName);
      const icons = state.icons.map((icon) =>
        icon.id === PROFILE_ICON_ID ? { ...icon, label } : icon,
      );
      const windows = state.windows.map((window) =>
        window.type === "profile" && window.iconId === PROFILE_ICON_ID
          ? { ...window, title: label }
          : window,
      );
      return commitDesktopPatch(state, { localProfile, icons, windows });
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
});
