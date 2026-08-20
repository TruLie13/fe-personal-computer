"use client";

import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { BulletinBoard } from "@/components/desktop/BulletinBoard";
import { DisplayProperties } from "@/components/desktop/DisplayProperties";
import { FolderWindow } from "@/components/desktop/FolderWindow";
import { iconForType } from "@/components/desktop/icons";
import { NetworkNeighborhood } from "@/components/desktop/NetworkNeighborhood";
import { ProfileWindow } from "@/components/desktop/ProfileWindow";
import { StoryExplorer } from "@/components/desktop/StoryExplorer";
import { TextEditor } from "@/components/desktop/TextEditor";
import { getNetworkUser } from "@/lib/networkSeed";
import { displayWindowTitle } from "@/lib/storage";
import { selectActiveIcons, useDesktopStore } from "@/store/desktopStore";
import type { DesktopWindow } from "@/types/desktop";

interface WindowFrameProps {
  window: DesktopWindow;
}

function WindowBody({
  window,
  closeInterceptorRef,
}: {
  window: DesktopWindow;
  closeInterceptorRef: MutableRefObject<(() => boolean) | null>;
}) {
  const viewMode = useDesktopStore((state) => state.viewMode);
  const remoteUserId = useDesktopStore((state) => state.remoteUserId);
  const remoteUser =
    viewMode === "remote" && remoteUserId
      ? getNetworkUser(remoteUserId)
      : undefined;

  if (window.type === "editor" || window.type === "text") {
    return (
      <TextEditor
        windowId={window.id}
        documentId={window.documentId}
        closeInterceptorRef={closeInterceptorRef}
      />
    );
  }

  if (window.type === "folder") {
    return <FolderWindow folderId={window.iconId} />;
  }

  if (window.type === "display") {
    return <DisplayProperties />;
  }

  if (window.type === "bbs") {
    return <BulletinBoard />;
  }

  if (window.type === "stories") {
    return <StoryExplorer />;
  }

  if (window.type === "network") {
    return <NetworkNeighborhood />;
  }

  if (window.type === "profile") {
    return <ProfileWindow />;
  }

  if (window.type === "system" && remoteUser) {
    return (
      <div className="flex h-full flex-col gap-3 p-3 text-[12px]">
        <p>
          You are viewing <strong>{remoteUser.displayName}</strong>&apos;s
          computer ({remoteUser.computerName}).
        </p>
        <p className="text-win-dark">
          This visit is read-only. Open folders and text files, then use Go Home
          on the taskbar to return to your desktop.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3 text-[12px]">
      <p>
        Personal Computer (MyPC) is a retro desktop for writers. Your profile is
        this machine.
      </p>
      <p className="text-win-dark">
        Open your PC profile for bio, Bulletin Board for posts, Story Explorer
        for public writing, and Network Neighborhood to visit other PCs on the
        intranet.
      </p>
    </div>
  );
}

export function WindowFrame({ window }: WindowFrameProps) {
  const focusWindow = useDesktopStore((state) => state.focusWindow);
  const closeWindow = useDesktopStore((state) => state.closeWindow);
  const minimizeWindow = useDesktopStore((state) => state.minimizeWindow);
  const updateWindowPosition = useDesktopStore(
    (state) => state.updateWindowPosition,
  );
  const icons = useDesktopStore(selectActiveIcons);
  const title = displayWindowTitle(window, icons);
  const Icon = iconForType(window.type);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const latest = useRef({ x: window.x, y: window.y });
  const closeInterceptorRef = useRef<(() => boolean) | null>(null);
  const [position, setPosition] = useState({ x: window.x, y: window.y });

  useEffect(() => {
    setPosition({ x: window.x, y: window.y });
    latest.current = { x: window.x, y: window.y };
  }, [window.x, window.y]);

  if (!window.isOpen || window.isMinimized) {
    return null;
  }

  const onTitlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest("button")) {
      return;
    }
    focusWindow(window.id);
    dragging.current = true;
    offset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onTitlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) {
      return;
    }
    // Integer coords keep text crisp and stop SVG clip from flickering mid-drag.
    const next = {
      x: Math.max(0, Math.round(event.clientX - offset.current.x)),
      y: Math.max(0, Math.round(event.clientY - offset.current.y)),
    };
    latest.current = next;
    setPosition(next);
  };

  const onTitlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) {
      return;
    }
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    updateWindowPosition(
      window.id,
      Math.round(latest.current.x),
      Math.round(latest.current.y),
    );
  };

  const stopChromePointer = (
    event: React.SyntheticEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
  };

  return (
    <div
      className="win-window absolute flex flex-col p-[2px]"
      style={{
        left: position.x,
        top: position.y,
        width: window.width,
        height: window.height,
        zIndex: window.zIndex,
      }}
      onMouseDown={() => focusWindow(window.id)}
      role="dialog"
      aria-label={title}
    >
      <div
        className={`win-titlebar ${window.isFocused ? "" : "win-titlebar-inactive"}`}
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
      >
        <Icon className="shrink-0" size={16} />
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <button
          type="button"
          className="win-title-btn"
          aria-label="Minimize"
          onPointerDown={stopChromePointer}
          onMouseDown={stopChromePointer}
          onClick={(event) => {
            event.stopPropagation();
            minimizeWindow(window.id);
          }}
        >
          _
        </button>
        <button
          type="button"
          className="win-title-btn"
          aria-label="Maximize"
          disabled
          onPointerDown={stopChromePointer}
          onMouseDown={stopChromePointer}
        >
          □
        </button>
        <button
          type="button"
          className="win-title-btn"
          aria-label="Close"
          onPointerDown={stopChromePointer}
          onMouseDown={stopChromePointer}
          onClick={(event) => {
            event.stopPropagation();
            if (closeInterceptorRef.current?.()) {
              return;
            }
            closeWindow(window.id);
          }}
        >
          ×
        </button>
      </div>
      <div className="mt-[2px] min-h-0 flex-1 p-[2px]">
        <WindowBody
          window={window}
          closeInterceptorRef={closeInterceptorRef}
        />
      </div>
    </div>
  );
}
