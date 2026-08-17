"use client";

import { useRouter } from "next/navigation";
import { filePath, homePath, profilePath } from "@/lib/seo/paths";
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
  const applyDeepLink = useDesktopStore((state) => state.applyDeepLink);

  return {
    goHome: () => {
      goHomeStore();
      router.push(homePath());
    },
    visitPc: (userId: NetworkUserId) => {
      visitRemotePc(userId);
      router.push(profilePath(userId));
    },
    openPublicFile: (userId: NetworkUserId, fileSlug: string) => {
      applyDeepLink({ username: userId, fileSlug });
      router.push(filePath(userId, fileSlug));
    },
  };
}
