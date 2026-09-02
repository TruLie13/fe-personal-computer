"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import { ContextMenu } from "@/components/desktop/ContextMenu";
import { DesktopIcon } from "@/components/desktop/DesktopIcon";
import { GuestChromeBanner } from "@/components/desktop/GuestChromeBanner";
import { Taskbar } from "@/components/desktop/Taskbar";
import { WindowFrame } from "@/components/desktop/WindowFrame";
import { useContextMenuState } from "@/hooks/useContextMenuState";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { useDesktopMarquee } from "@/hooks/useDesktopMarquee";
import { useFolderCreateGuard } from "@/hooks/useFolderCreateGuard";
import { useGuestChrome } from "@/hooks/useGuestChrome";
import { useDesktopUrlSync } from "@/hooks/useDesktopUrlSync";
import { clampIconPosition } from "@/lib/desktopBounds";
import { DESKTOP_ATTR } from "@/lib/dragDrop";
import { DEFAULT_WALLPAPER } from "@/lib/storage";
import { saveWindowSession } from "@/lib/windowSession";
import {
  selectActiveIcons,
  selectActiveTitleBarColor,
  selectActiveWallpaper,
  selectDesktopIcons,
  useDesktopStore,
} from "@/store/desktopStore";

export interface DesktopProps {
  /** Public PC username from `/C/users/[username]`. */
  deepLinkUsername?: string;
  /** Optional file slug from `/C/users/[username]/[fileSlug]`. */
  deepLinkFileSlug?: string;
}

export function Desktop({
  deepLinkUsername,
  deepLinkFileSlug,
}: DesktopProps = {}) {
  const storeIcons = useDesktopStore((state) => state.icons);
  const viewMode = useDesktopStore((state) => state.viewMode);
  const icons = useDesktopStore(selectActiveIcons);
  const windows = useDesktopStore((state) => state.windows);
  const wallpaper = useDesktopStore(selectActiveWallpaper);
  const titleBarColor = useDesktopStore(selectActiveTitleBarColor);
  const contentDark = useDesktopStore((state) => state.contentDark);
  const taskbarHeight = useDesktopStore((state) => state.taskbarHeight);
  const hydrate = useDesktopStore((state) => state.hydrate);
  const hydrated = useDesktopStore((state) => state.hydrated);
  const syncMaximizedWindows = useDesktopStore(
    (state) => state.syncMaximizedWindows,
  );
  const applyDeepLink = useDesktopStore((state) => state.applyDeepLink);
  const selectIcon = useDesktopStore((state) => state.selectIcon);
  const setSelectedIcons = useDesktopStore((state) => state.setSelectedIcons);
  const closeStartMenu = useDesktopStore((state) => state.closeStartMenu);
  const deleteIcons = useDesktopStore((state) => state.deleteIcons);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const closeAllWindows = useDesktopStore((state) => state.closeAllWindows);
  const { showGuestChrome, goHome, goToSetup, goToSignIn } = useGuestChrome();
  const appliedDeepLinkKey = useRef<string | null>(null);
  const [urlSyncReady, setUrlSyncReady] = useState(!deepLinkUsername);

  useDesktopUrlSync({
    enabled: hydrated && urlSyncReady,
    deepLinkUsername,
  });

  const isRemote = viewMode === "remote";
  const desktopIcons = selectDesktopIcons(icons);

  const { menu, openMenu, closeMenu } = useContextMenuState();
  const {
    pendingDeleteIds,
    deletePrompt,
    requestDelete,
    requestDeleteMany,
    cancelDelete,
    confirmDelete,
  } = useDeleteConfirm(storeIcons);
  const { tryCreateFolder, folderLimitDialog } = useFolderCreateGuard();

  const marquee = useDesktopMarquee({
    enabled: true,
    onClearSelection: () => selectIcon(null),
    onSelectIds: setSelectedIcons,
    onCloseMenus: () => {
      closeStartMenu();
      closeMenu();
    },
  });

  useLayoutEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    syncMaximizedWindows();
    const onResize = () => syncMaximizedWindows();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncMaximizedWindows, taskbarHeight]);

  // Persist open windows / positions for the local desktop only.
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const persist = () => {
      const state = useDesktopStore.getState();
      if (state.viewMode !== "local") {
        return;
      }
      saveWindowSession({
        windows: state.windows,
        documentWindowFifo: state.documentWindowFifo,
        nextZIndex: state.nextZIndex,
      });
    };
    persist();
    const unsubscribe = useDesktopStore.subscribe((state, prev) => {
      if (state.viewMode !== "local") {
        return;
      }
      if (
        state.windows === prev.windows &&
        state.documentWindowFifo === prev.documentWindowFifo &&
        state.nextZIndex === prev.nextZIndex
      ) {
        return;
      }
      saveWindowSession({
        windows: state.windows,
        documentWindowFifo: state.documentWindowFifo,
        nextZIndex: state.nextZIndex,
      });
    });
    const onPageHide = () => persist();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      unsubscribe();
      window.removeEventListener("pagehide", onPageHide);
      persist();
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!deepLinkUsername) {
      setUrlSyncReady(true);
      return;
    }
    const key = `${deepLinkUsername}:${deepLinkFileSlug ?? ""}`;
    if (appliedDeepLinkKey.current !== key) {
      appliedDeepLinkKey.current = key;
      applyDeepLink({
        username: deepLinkUsername,
        fileSlug: deepLinkFileSlug,
      });
    }
    setUrlSyncReady(true);
  }, [hydrated, deepLinkUsername, deepLinkFileSlug, applyDeepLink]);

  if (!hydrated) {
    return (
      <div
        className="h-dvh w-screen"
        style={{ background: DEFAULT_WALLPAPER }}
        aria-busy="true"
        aria-label="Loading desktop"
      />
    );
  }

  return (
    <div
      className="flex h-dvh w-screen flex-col overflow-hidden"
      data-content-theme={contentDark ? "dark" : "light"}
      style={
        {
          "--color-win-navy": titleBarColor,
          "--color-win-desktop": wallpaper,
          "--win-taskbar-height": `${taskbarHeight}px`,
        } as CSSProperties
      }
    >
      <main
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{ background: wallpaper }}
        {...{ [DESKTOP_ATTR]: "true" }}
        onPointerDown={marquee.onPointerDown}
        onPointerMove={marquee.onPointerMove}
        onPointerUp={marquee.onPointerUp}
        onPointerCancel={marquee.onPointerCancel}
        onContextMenu={(event) => {
          event.preventDefault();
          const target = event.target as HTMLElement;
          if (
            target.closest(".win-desktop-icon") ||
            target.closest(".win-window")
          ) {
            return;
          }
          selectIcon(null);
          closeStartMenu();

          const hasOpenWindows = windows.some((window) => window.isOpen);
          const closeAllEntry = {
            id: "close-all",
            label: "Close all windows",
            disabled: !hasOpenWindows,
            onSelect: () => closeAllWindows(),
          };

          if (isRemote) {
            openMenu(event, [
              closeAllEntry,
              { id: "sep-guest", separator: true },
              ...(showGuestChrome
                ? [
                    {
                      id: "get-pc",
                      label: "Get your PC",
                      onSelect: () => goToSetup(),
                    },
                    {
                      id: "sign-in",
                      label: "Sign in",
                      onSelect: () => goToSignIn(),
                    },
                  ]
                : [
                    {
                      id: "go-home",
                      label: "Go Home (My Computer)",
                      onSelect: () => goHome(),
                    },
                  ]),
            ]);
            return;
          }

          const desktop = event.currentTarget;
          const rect = desktop.getBoundingClientRect();
          const place = clampIconPosition(
            {
              x: event.clientX - rect.left - 38,
              y: event.clientY - rect.top - 20,
            },
            { width: 76, height: 64 },
            { width: desktop.clientWidth, height: desktop.clientHeight },
          );

          openMenu(event, [
            {
              id: "new",
              label: "New",
              submenu: [
                {
                  id: "new-folder",
                  label: "Folder",
                  onSelect: () => tryCreateFolder(undefined, place),
                },
              ],
            },
            { id: "sep-close", separator: true },
            closeAllEntry,
            { id: "sep-props", separator: true },
            {
              id: "properties",
              label: "Properties",
              onSelect: () => openWindow("display-properties"),
            },
          ]);
        }}
      >
        <GuestChromeBanner />
        {desktopIcons.map((icon) => (
          <DesktopIcon
            key={icon.id}
            icon={icon}
            onRequestMenu={openMenu}
            onRequestDelete={requestDelete}
            onRequestDeleteMany={requestDeleteMany}
          />
        ))}
        {windows.map((window) => (
          <WindowFrame key={window.id} window={window} />
        ))}
        {marquee.marquee ? (
          <div
            className="win-marquee pointer-events-none absolute z-[5000]"
            style={{
              left: marquee.marquee.left,
              top: marquee.marquee.top,
              width: marquee.marquee.width,
              height: marquee.marquee.height,
            }}
            aria-hidden
          />
        ) : null}
      </main>
      <Taskbar />
      {menu ? (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          entries={menu.entries}
          onClose={closeMenu}
        />
      ) : null}
      {deletePrompt && pendingDeleteIds.length > 0 && !isRemote ? (
        <ConfirmDialog
          title={deletePrompt.title}
          message={deletePrompt.message}
          onConfirm={() => {
            const ids = confirmDelete();
            if (ids.length > 0) {
              deleteIcons(ids);
            }
          }}
          onCancel={cancelDelete}
        />
      ) : null}
      {folderLimitDialog}
    </div>
  );
}
