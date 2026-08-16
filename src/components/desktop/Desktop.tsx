"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import {
  ContextMenu,
  type ContextMenuEntry,
} from "@/components/desktop/ContextMenu";
import { DesktopIcon } from "@/components/desktop/DesktopIcon";
import { Taskbar } from "@/components/desktop/Taskbar";
import { WindowFrame } from "@/components/desktop/WindowFrame";
import { clampIconPosition } from "@/lib/desktopBounds";
import { buildDeleteConfirmMessage } from "@/lib/deleteConfirm";
import { DESKTOP_ATTR } from "@/lib/dragDrop";
import {
  selectActiveIcons,
  selectActiveTitleBarColor,
  selectActiveWallpaper,
  selectDesktopIcons,
  useDesktopStore,
} from "@/store/desktopStore";

interface MenuState {
  x: number;
  y: number;
  entries: ContextMenuEntry[];
}

export function Desktop() {
  const storeIcons = useDesktopStore((state) => state.icons);
  const viewMode = useDesktopStore((state) => state.viewMode);
  const icons = useDesktopStore(selectActiveIcons);
  const windows = useDesktopStore((state) => state.windows);
  const wallpaper = useDesktopStore(selectActiveWallpaper);
  const titleBarColor = useDesktopStore(selectActiveTitleBarColor);
  const contentDark = useDesktopStore((state) => state.contentDark);
  const hydrate = useDesktopStore((state) => state.hydrate);
  const selectIcon = useDesktopStore((state) => state.selectIcon);
  const closeStartMenu = useDesktopStore((state) => state.closeStartMenu);
  const createFolder = useDesktopStore((state) => state.createFolder);
  const deleteIcon = useDesktopStore((state) => state.deleteIcon);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const goHome = useDesktopStore((state) => state.goHome);

  const isRemote = viewMode === "remote";

  const desktopIcons = selectDesktopIcons(icons);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenu = useCallback(
    (event: React.MouseEvent, entries: ContextMenuEntry[]) => {
      setMenu({
        x: event.clientX,
        y: event.clientY,
        entries,
      });
    },
    [],
  );

  const pendingDeleteIcon = pendingDeleteId
    ? storeIcons.find((icon) => icon.id === pendingDeleteId)
    : undefined;
  const deletePrompt = pendingDeleteIcon
    ? buildDeleteConfirmMessage(pendingDeleteIcon, storeIcons)
    : null;

  return (
    <div
      className="flex h-dvh w-screen flex-col overflow-hidden"
      data-content-theme={contentDark ? "dark" : "light"}
      style={
        {
          "--color-win-navy": titleBarColor,
          "--color-win-desktop": wallpaper,
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
          setMenu(null);
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
            onRequestDelete={(iconId) => setPendingDeleteId(iconId)}
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
            deleteIcon(pendingDeleteId);
            setPendingDeleteId(null);
          }}
          onCancel={() => setPendingDeleteId(null)}
        />
      ) : null}
    </div>
  );
}
