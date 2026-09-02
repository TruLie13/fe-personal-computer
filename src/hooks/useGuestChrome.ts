"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearOwnPcAccess,
  hasOwnPc as readHasOwnPc,
  OWN_PC_CHANGED_EVENT,
} from "@/lib/ownPc";
import { setupPath, signInPath } from "@/lib/seo/paths";
import { useDesktopStore } from "@/store/desktopStore";
import { usePcRoutes } from "@/hooks/usePcRoutes";

/**
 * Remote-visit chrome: guests without their own PC see setup/sign-in prompts
 * instead of Go Home (which would land on an unclaimed desktop).
 */
export function useGuestChrome() {
  const router = useRouter();
  const { goHome } = usePcRoutes();
  const viewMode = useDesktopStore((state) => state.viewMode);
  const isRemote = viewMode === "remote";
  const [hasOwnPc, setHasOwnPc] = useState(false);

  const syncHasOwnPc = useCallback(() => {
    setHasOwnPc(readHasOwnPc());
  }, []);

  useEffect(() => {
    syncHasOwnPc();
    window.addEventListener(OWN_PC_CHANGED_EVENT, syncHasOwnPc);
    return () => window.removeEventListener(OWN_PC_CHANGED_EVENT, syncHasOwnPc);
  }, [syncHasOwnPc]);

  const showGuestChrome = isRemote && !hasOwnPc;

  return {
    isRemote,
    hasOwnPc,
    showGuestChrome,
    goHome,
    goToSetup: () => router.push(setupPath()),
    goToSignIn: () => router.push(signInPath()),
    signOut: () => {
      if (readHasOwnPc()) {
        clearOwnPcAccess();
      }
      router.push("/");
    },
  };
}
