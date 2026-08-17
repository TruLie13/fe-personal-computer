"use client";

import {
  BulletinBoardIcon,
  ComputerIcon,
  DisplayIcon,
  FolderIcon,
  NetworkIcon,
  NotepadIcon,
  StoryExplorerIcon,
} from "@/components/desktop/icons";
import { ProfileAvatar } from "@/components/desktop/ProfileAvatar";
import { getNetworkUser } from "@/lib/networkSeed";
import { computerLabel } from "@/lib/profile";
import { PROFILE_ICON_ID } from "@/lib/storage";
import { usePcRoutes } from "@/hooks/usePcRoutes";
import { useDesktopStore } from "@/store/desktopStore";

export function StartMenu() {
  const isStartMenuOpen = useDesktopStore((state) => state.isStartMenuOpen);
  const viewMode = useDesktopStore((state) => state.viewMode);
  const remoteUserId = useDesktopStore((state) => state.remoteUserId);
  const localProfile = useDesktopStore((state) => state.localProfile);
  const taskbarHeight = useDesktopStore((state) => state.taskbarHeight);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const openProfile = useDesktopStore((state) => state.openProfile);
  const closeStartMenu = useDesktopStore((state) => state.closeStartMenu);
  const createFolder = useDesktopStore((state) => state.createFolder);
  const { goHome } = usePcRoutes();

  if (!isStartMenuOpen) {
    return null;
  }

  const isRemote = viewMode === "remote";
  const remoteUser =
    isRemote && remoteUserId ? getNetworkUser(remoteUserId) : undefined;
  const identityName = remoteUser?.displayName ?? localProfile.displayName;
  const identityAvatarUrl = remoteUser?.avatarUrl ?? localProfile.avatarUrl;
  const identityLabel = computerLabel(identityName);

  return (
    <div
      className="win-menu win-raised absolute left-0 z-[200] flex"
      style={{ bottom: taskbarHeight }}
      role="menu"
      aria-label="Start"
    >
      <div className="win-menu-spine" aria-hidden="true">
        <span className="win-menu-spine-label">Personal Computer</span>
      </div>
      <div className="flex min-w-[220px] flex-col py-1">
        {isRemote ? (
          <>
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={() => {
                openProfile();
                closeStartMenu();
              }}
            >
              <ProfileAvatar
                displayName={identityName}
                avatarUrl={identityAvatarUrl}
                size={16}
              />
              {identityLabel}
            </button>
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={() => goHome()}
            >
              <ComputerIcon size={16} />
              Go Home
            </button>
            <div className="win-menu-separator" />
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={closeStartMenu}
            >
              Close Menu
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={() => openWindow(PROFILE_ICON_ID)}
            >
              <ProfileAvatar
                displayName={identityName}
                avatarUrl={identityAvatarUrl}
                size={16}
              />
              {identityLabel}
            </button>
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={() => openWindow("documents")}
            >
              <FolderIcon size={16} />
              Documents
            </button>
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={() => openWindow("notepad")}
            >
              <NotepadIcon size={16} />
              Notepad
            </button>
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={() => openWindow("bulletin-board")}
            >
              <BulletinBoardIcon size={16} />
              Bulletin Board
            </button>
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={() => openWindow("story-explorer")}
            >
              <StoryExplorerIcon size={16} />
              Story Explorer
            </button>
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={() => openWindow("network-neighborhood")}
            >
              <NetworkIcon size={16} />
              Network Neighborhood
            </button>
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={() => openWindow("display-properties")}
            >
              <DisplayIcon size={16} />
              Display Properties
            </button>
            <div className="win-menu-separator" />
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={() => {
                createFolder();
              }}
            >
              <FolderIcon size={16} />
              New Folder
            </button>
            <div className="win-menu-separator" />
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={closeStartMenu}
            >
              Close Menu
            </button>
          </>
        )}
      </div>
    </div>
  );
}
