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
import { useDesktopStore } from "@/store/desktopStore";

export function StartMenu() {
  const isStartMenuOpen = useDesktopStore((state) => state.isStartMenuOpen);
  const viewMode = useDesktopStore((state) => state.viewMode);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const closeStartMenu = useDesktopStore((state) => state.closeStartMenu);
  const createFolder = useDesktopStore((state) => state.createFolder);
  const goHome = useDesktopStore((state) => state.goHome);

  if (!isStartMenuOpen) {
    return null;
  }

  const isRemote = viewMode === "remote";

  return (
    <div
      className="win-menu win-raised absolute bottom-[28px] left-0 z-[200] flex"
      role="menu"
      aria-label="Start"
    >
      <div className="flex w-7 items-end justify-center bg-win-dark py-2">
        <span
          className="origin-center -rotate-90 whitespace-nowrap text-[12px] font-bold tracking-wide text-win-face-light"
          aria-hidden="true"
        >
          Personal Computer
        </span>
      </div>
      <div className="flex min-w-[200px] flex-col py-1">
        {isRemote ? (
          <>
            <button
              type="button"
              className="win-menu-item"
              role="menuitem"
              onClick={() => goHome()}
            >
              <ComputerIcon size={16} />
              Go Home (My Computer)
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
              onClick={() => openWindow("my-computer")}
            >
              <ComputerIcon size={16} />
              My Computer
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
