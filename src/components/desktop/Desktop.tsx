"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import { ContextMenu } from "@/components/desktop/ContextMenu";
import { DesktopIcon } from "@/components/desktop/DesktopIcon";
import { Taskbar } from "@/components/desktop/Taskbar";
import { WindowFrame } from "@/components/desktop/WindowFrame";
import { useContextMenuState } from "@/hooks/useContextMenuState";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { usePcRoutes } from "@/hooks/usePcRoutes";
import { useDesktopUrlSync } from "@/hooks/useDesktopUrlSync";
import { clampIconPosition } from "@/lib/desktopBounds";
import { DESKTOP_ATTR } from "@/lib/dragDrop";
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
  const applyDeepLink = useDesktopStore((state) => state.applyDeepLink);
  const selectIcon = useDesktopStore((state) => state.selectIcon);
  const closeStartMenu = useDesktopStore((state) => state.closeStartMenu);
  const createFolder = useDesktopStore((state) => state.createFolder);
  const deleteIcon = useDesktopStore((state) => state.deleteIcon);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const { goHome } = usePcRoutes();
  const appliedDeepLinkKey = useRef<string | null>(null);
  const [urlSyncReady, setUrlSyncReady] = useState(!deepLinkUsername);

  useDesktopUrlSync({ enabled: hydrated && urlSyncReady });

  const isRemote = viewMode === "remote";
  const desktopIcons = selectDesktopIcons(icons);

  const { menu, openMenu, closeMenu } = useContextMenuState();
  const {
    pendingDeleteId,
    deletePrompt,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useDeleteConfirm(storeIcons);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
        onMouseDown={() => {
          selectIcon(null);
          closeStartMenu();
          closeMenu();
        }}
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

          if (isRemote) {
            openMenu(event, [
              {
                id: "go-home",
                label: "Go Home (My Computer)",
                onSelect: () => goHome(),
              },
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
                  onSelect: () => createFolder(undefined, place),
                },
              ],
            },
            { id: "sep-props", separator: true },
            {
              id: "properties",
              label: "Properties",
              onSelect: () => openWindow("display-properties"),
            },
          ]);
        }}
      >
        {desktopIcons.map((icon) => (
          <DesktopIcon
            key={icon.id}
            icon={icon}
            onRequestMenu={openMenu}
            onRequestDelete={requestDelete}
          />
        ))}
        {windows.map((window) => (
          <WindowFrame key={window.id} window={window} />
        ))}
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
      {deletePrompt && pendingDeleteId && !isRemote ? (
        <ConfirmDialog
          title={deletePrompt.title}
          message={deletePrompt.message}
          onConfirm={() => {
            const id = confirmDelete();
            if (id) {
              deleteIcon(id);
            }
          }}
          onCancel={cancelDelete}
        />
      ) : null}
    </div>
  );
}
