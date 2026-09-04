"use client";

import {
  BulletinBoardIcon,
  ComputerIcon,
  DisplayIcon,
  FolderIcon,
  GuestBookIcon,
  NetworkIcon,
  NotepadIcon,
  StoryExplorerIcon,
} from "@/components/desktop/icons";
import { ProfileAvatar } from "@/components/desktop/ProfileAvatar";
import { requestVerifyEmailDialog } from "@/components/desktop/VerifyEmailDialog";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import { useFolderCreateGuard } from "@/hooks/useFolderCreateGuard";
import { useGuestChrome } from "@/hooks/useGuestChrome";
import { getNetworkUser } from "@/lib/networkSeed";
import { computerLabel } from "@/lib/profile";
import { SPOKEN_NAME } from "@/lib/seo/brand";
import { PROFILE_ICON_ID } from "@/lib/storage";
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
  const { showGuestChrome, hasOwnPc, goHome, goToSetup, goToSignIn, signOut } =
    useGuestChrome();
  const { needsVerification } = useEmailVerification();
  const { tryCreateFolder, folderLimitDialog } = useFolderCreateGuard();

  if (!isStartMenuOpen) {
    return folderLimitDialog;
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
        <span className="win-menu-spine-label">{SPOKEN_NAME}</span>
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
            {showGuestChrome ? (
              <>
                <button
                  type="button"
                  className="win-menu-item"
                  role="menuitem"
                  onClick={() => {
                    goToSetup();
                    closeStartMenu();
                  }}
                >
                  <ComputerIcon size={16} />
                  Get your PC
                </button>
                <button
                  type="button"
                  className="win-menu-item"
                  role="menuitem"
                  onClick={() => {
                    goToSignIn();
                    closeStartMenu();
                  }}
                >
                  Sign in
                </button>
              </>
            ) : (
              <button
                type="button"
                className="win-menu-item"
                role="menuitem"
                onClick={() => goHome()}
              >
                <ComputerIcon size={16} />
                Go Home
              </button>
            )}
            {hasOwnPc ? (
              <>
                <div className="win-menu-separator" />
                {needsVerification ? (
                  <button
                    type="button"
                    className="win-menu-item"
                    role="menuitem"
                    onClick={() => {
                      requestVerifyEmailDialog();
                      closeStartMenu();
                    }}
                  >
                    Verify e-mail...
                  </button>
                ) : null}
                <button
                  type="button"
                  className="win-menu-item"
                  role="menuitem"
                  onClick={() => {
                    signOut();
                    closeStartMenu();
                  }}
                >
                  Sign out
                </button>
              </>
            ) : null}
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
              onClick={() => openWindow("guestbook")}
            >
              <GuestBookIcon size={16} />
              Guest Book
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
                tryCreateFolder();
              }}
            >
              <FolderIcon size={16} />
              New Folder
            </button>
            <div className="win-menu-separator" />
            {needsVerification ? (
              <button
                type="button"
                className="win-menu-item"
                role="menuitem"
                onClick={() => {
                  requestVerifyEmailDialog();
                  closeStartMenu();
                }}
              >
                Verify e-mail...
              </button>
            ) : null}
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={() => {
                signOut();
                closeStartMenu();
              }}
            >
              Sign out
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
      {folderLimitDialog}
    </div>
  );
}
