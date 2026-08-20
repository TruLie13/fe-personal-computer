"use client";

import { useRef } from "react";
import { ContextMenu } from "@/components/desktop/ContextMenu";
import { Clock } from "@/components/desktop/Clock";
import { ComputerIcon, StartLogo, iconForType } from "@/components/desktop/icons";
import { ProfileAvatar } from "@/components/desktop/ProfileAvatar";
import { StartMenu } from "@/components/desktop/StartMenu";
import { useContextMenuState } from "@/hooks/useContextMenuState";
import { getNetworkUser } from "@/lib/networkSeed";
import {
  clampTaskbarHeight,
  displayWindowTitle,
  MAX_TASKBAR_HEIGHT,
  MIN_TASKBAR_HEIGHT,
} from "@/lib/storage";
import { selectActiveIcons, useDesktopStore } from "@/store/desktopStore";
import { usePcRoutes } from "@/hooks/usePcRoutes";

export function Taskbar() {
  const windows = useDesktopStore((state) => state.windows);
  const icons = useDesktopStore(selectActiveIcons);
  const isStartMenuOpen = useDesktopStore((state) => state.isStartMenuOpen);
  const viewMode = useDesktopStore((state) => state.viewMode);
  const remoteUserId = useDesktopStore((state) => state.remoteUserId);
  const localProfile = useDesktopStore((state) => state.localProfile);
  const taskbarHeight = useDesktopStore((state) => state.taskbarHeight);
  const setTaskbarHeight = useDesktopStore((state) => state.setTaskbarHeight);
  const toggleStartMenu = useDesktopStore((state) => state.toggleStartMenu);
  const focusWindow = useDesktopStore((state) => state.focusWindow);
  const minimizeWindow = useDesktopStore((state) => state.minimizeWindow);
  const closeWindow = useDesktopStore((state) => state.closeWindow);
  const openProfile = useDesktopStore((state) => state.openProfile);
  const { goHome } = usePcRoutes();
  const { menu, openMenu, closeMenu } = useContextMenuState();

  const dragOrigin = useRef<{ y: number; height: number } | null>(null);

  const visibleTasks = windows.filter((window) => window.isOpen);
  const isRemote = viewMode === "remote";
  const remoteUser =
    isRemote && remoteUserId ? getNetworkUser(remoteUserId) : undefined;
  const identityName = remoteUser?.displayName ?? localProfile.displayName;
  const identityAvatarUrl = remoteUser?.avatarUrl ?? localProfile.avatarUrl;

  const onResizePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dragOrigin.current = { y: event.clientY, height: taskbarHeight };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onResizePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!dragOrigin.current) {
      return;
    }
    // Dragging up increases height (Win95 taskbar grows upward).
    const delta = dragOrigin.current.y - event.clientY;
    setTaskbarHeight(
      clampTaskbarHeight(dragOrigin.current.height + delta),
    );
  };

  const onResizePointerUp = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!dragOrigin.current) {
      return;
    }
    dragOrigin.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
  };

  return (
    <footer
      className="win-taskbar relative z-[150]"
      style={{ height: taskbarHeight }}
      aria-label="Taskbar"
    >
      <div
        className="win-taskbar-resize"
        role="separator"
        aria-orientation="horizontal"
        aria-valuemin={MIN_TASKBAR_HEIGHT}
        aria-valuemax={MAX_TASKBAR_HEIGHT}
        aria-valuenow={taskbarHeight}
        aria-label="Resize taskbar"
        title="Drag to resize taskbar"
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
      />

      <button
        type="button"
        className={`win-start-btn win-raised ${isStartMenuOpen ? "win-raised-active" : ""}`}
        onClick={toggleStartMenu}
        aria-expanded={isStartMenuOpen}
        aria-haspopup="menu"
      >
        <StartLogo />
        Start
      </button>

      {isRemote ? (
        <button
          type="button"
          className="win-raised ml-1 flex items-center gap-1 px-2 text-[11px]"
          onClick={goHome}
        >
          <ComputerIcon size={14} />
          Go Home
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 items-stretch gap-1 overflow-hidden px-1">
        {visibleTasks.map((window) => {
          const Icon = iconForType(window.type);
          const active = window.isFocused && !window.isMinimized;
          const title = displayWindowTitle(window, icons);
          return (
            <button
              key={window.id}
              type="button"
              className={`win-task-btn ${active ? "win-sunken win-task-btn-active" : "win-raised"}`}
              onClick={() => {
                closeMenu();
                if (active) {
                  minimizeWindow(window.id);
                } else {
                  focusWindow(window.id);
                }
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openMenu(event, [
                  {
                    id: "task-title",
                    label: title,
                    disabled: true,
                  },
                  { id: "task-sep", separator: true },
                  {
                    id: "task-close",
                    label: "Close",
                    onSelect: () => closeWindow(window.id),
                  },
                ]);
              }}
            >
              <Icon className="shrink-0" size={16} />
              <span className="truncate">{title}</span>
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex shrink-0 items-stretch gap-1 pr-1">
        <button
          type="button"
          className="win-tray-identity win-sunken flex max-w-[140px] items-center gap-1 px-1 text-[11px]"
          onClick={openProfile}
          title={identityName}
        >
          <ProfileAvatar
            displayName={identityName}
            avatarUrl={identityAvatarUrl}
            size={14}
          />
          <span className="truncate">{identityName}</span>
        </button>

        <Clock />
      </div>
      <StartMenu />
      {menu ? (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          entries={menu.entries}
          onClose={closeMenu}
        />
      ) : null}
    </footer>
  );
}
