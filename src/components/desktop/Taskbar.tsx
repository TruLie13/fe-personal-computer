"use client";

import { Clock } from "@/components/desktop/Clock";
import { ComputerIcon, StartLogo, iconForType } from "@/components/desktop/icons";
import { ProfileAvatar } from "@/components/desktop/ProfileAvatar";
import { StartMenu } from "@/components/desktop/StartMenu";
import { getNetworkUser } from "@/lib/networkSeed";
import { displayWindowTitle } from "@/lib/storage";
import { selectActiveIcons, useDesktopStore } from "@/store/desktopStore";

export function Taskbar() {
  const windows = useDesktopStore((state) => state.windows);
  const icons = useDesktopStore(selectActiveIcons);
  const isStartMenuOpen = useDesktopStore((state) => state.isStartMenuOpen);
  const viewMode = useDesktopStore((state) => state.viewMode);
  const remoteUserId = useDesktopStore((state) => state.remoteUserId);
  const localProfile = useDesktopStore((state) => state.localProfile);
  const toggleStartMenu = useDesktopStore((state) => state.toggleStartMenu);
  const focusWindow = useDesktopStore((state) => state.focusWindow);
  const minimizeWindow = useDesktopStore((state) => state.minimizeWindow);
  const goHome = useDesktopStore((state) => state.goHome);
  const openProfile = useDesktopStore((state) => state.openProfile);

  const visibleTasks = windows.filter((window) => window.isOpen);
  const isRemote = viewMode === "remote";
  const remoteUser =
    isRemote && remoteUserId ? getNetworkUser(remoteUserId) : undefined;
  const identityName = remoteUser?.displayName ?? localProfile.displayName;
  const identityAvatarUrl = remoteUser?.avatarUrl ?? localProfile.avatarUrl;

  return (
    <footer className="win-taskbar relative z-[150]">
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
          className="win-raised ml-1 flex items-center gap-1 px-2 py-0.5 text-[11px]"
          onClick={goHome}
        >
          <ComputerIcon size={14} />
          Go Home
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden px-1">
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
                if (active) {
                  minimizeWindow(window.id);
                } else {
                  focusWindow(window.id);
                }
              }}
            >
              <Icon className="shrink-0" size={16} />
              <span className="truncate">{title}</span>
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 pr-1">
        <button
          type="button"
          className="win-tray-identity win-sunken flex max-w-[140px] items-center gap-1 px-1 py-0.5 text-[11px]"
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
    </footer>
  );
}
