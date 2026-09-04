"use client";

import { useRouter } from "next/navigation";
import { getDesktopRepository } from "@/lib/repository";
import { DOCUMENTS_FOLDER_ID } from "@/lib/repository/desktopFiles";
import { computerLabel } from "@/lib/profile";
import { getNetworkUser } from "@/lib/networkSeed";
import { clientHomePath, filePath, profilePath } from "@/lib/seo/paths";
import {
  DEFAULT_ICONS,
  isAppIcon,
  mergeAppIcons,
  PROFILE_ICON_ID,
} from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";
import type { NetworkUserId } from "@/types/network";

/**
 * Keep the address bar aligned with visit / home / file deep links.
 * Also updates the store immediately so in-app navigation feels instant.
 */
export function usePcRoutes() {
  const router = useRouter();
  const goHomeStore = useDesktopStore((state) => state.goHome);
  const visitRemotePc = useDesktopStore((state) => state.visitRemotePc);
  const visitRemoteDesktop = useDesktopStore(
    (state) => state.visitRemoteDesktop,
  );
  const applyDeepLink = useDesktopStore((state) => state.applyDeepLink);

  return {
    goHome: () => {
      goHomeStore();
      router.push(clientHomePath());
    },
    visitPc: (userId: NetworkUserId) => {
      void (async () => {
        if (getNetworkUser(userId)) {
          visitRemotePc(userId);
          router.push(profilePath(userId));
          return;
        }
        try {
          const uid = await getDesktopRepository().getUidForUsername(userId);
          if (!uid) {
            router.push(profilePath(userId));
            return;
          }
          const desktop = await getDesktopRepository().loadDesktop(uid);
          if (!desktop) {
            router.push(profilePath(userId));
            return;
          }
          const appIcons = DEFAULT_ICONS.filter(
            (icon) => isAppIcon(icon.id) && icon.id !== DOCUMENTS_FOLDER_ID,
          ).map((icon) =>
            icon.id === PROFILE_ICON_ID
              ? {
                  ...icon,
                  label: computerLabel(desktop.profile.displayName),
                }
              : icon,
          );
          const icons = mergeAppIcons([...appIcons, ...desktop.icons]).map(
            (icon) =>
              icon.id === PROFILE_ICON_ID
                ? {
                    ...icon,
                    label: computerLabel(desktop.profile.displayName),
                  }
                : icon,
          );
          visitRemoteDesktop({
            userId,
            profile: desktop.profile,
            snapshot: {
              wallpaper: desktop.theme.wallpaper,
              titleBarColor: desktop.theme.titleBarColor,
              icons,
              documents: desktop.documents,
            },
          });
        } catch {
          // Emulator down — still navigate; Desktop may show unknown PC.
        }
        router.push(profilePath(userId));
      })();
    },
    openPublicFile: (userId: NetworkUserId, fileSlug: string) => {
      applyDeepLink({ username: userId, fileSlug });
      router.push(filePath(userId, fileSlug));
    },
  };
}
