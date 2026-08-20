"use client";

import { useEffect, useRef, useState } from "react";
import type { ContextMenuEntry } from "@/components/desktop/ContextMenu";
import { iconForType } from "@/components/desktop/icons";
import { ProfileAvatar } from "@/components/desktop/ProfileAvatar";
import { clampIconPosition } from "@/lib/desktopBounds";
import {
  clearDropTargetHighlight,
  DROP_ATTR,
  resolveFileDropTarget,
  setDropTargetHighlight,
} from "@/lib/dragDrop";
import { getNetworkUser } from "@/lib/networkSeed";
import { canDeleteIcon, isPinnedProfileIcon, MAX_FILE_TITLE_CHARS, clampFileTitle } from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";
import type { DesktopIcon as DesktopIconType } from "@/types/desktop";

interface DesktopIconProps {
  icon: DesktopIconType;
  onRequestMenu: (
    event: React.MouseEvent,
    entries: ContextMenuEntry[],
  ) => void;
  onRequestDelete: (iconId: string) => void;
}

function measureAndClamp(
  element: HTMLElement,
  point: { x: number; y: number },
): { x: number; y: number } {
  const desktop = element.offsetParent as HTMLElement | null;
  if (!desktop || element.offsetWidth === 0 || element.offsetHeight === 0) {
    return { x: Math.max(0, point.x), y: Math.max(0, point.y) };
  }

  return clampIconPosition(
    point,
    { width: element.offsetWidth, height: element.offsetHeight },
    { width: desktop.clientWidth, height: desktop.clientHeight },
  );
}

function canRename(icon: DesktopIconType): boolean {
  return icon.type === "folder" || icon.type === "text";
}

export function DesktopIcon({
  icon,
  onRequestMenu,
  onRequestDelete,
}: DesktopIconProps) {
  const selectedIconId = useDesktopStore((state) => state.selectedIconId);
  const renamingIconId = useDesktopStore((state) => state.renamingIconId);
  const viewMode = useDesktopStore((state) => state.viewMode);
  const remoteUserId = useDesktopStore((state) => state.remoteUserId);
  const localProfile = useDesktopStore((state) => state.localProfile);
  const selectIcon = useDesktopStore((state) => state.selectIcon);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const startRename = useDesktopStore((state) => state.startRename);
  const renameIcon = useDesktopStore((state) => state.renameIcon);
  const cancelRename = useDesktopStore((state) => state.cancelRename);
  const updateIconPosition = useDesktopStore(
    (state) => state.updateIconPosition,
  );
  const moveIconToFolder = useDesktopStore((state) => state.moveIconToFolder);
  const Icon = iconForType(icon.type);
  const selected = selectedIconId === icon.id;
  const isRenaming = renamingIconId === icon.id;
  const readOnly = viewMode === "remote";
  const pinned = isPinnedProfileIcon(icon);
  const canDropIntoFolders =
    !readOnly && (icon.type === "folder" || Boolean(icon.documentId));
  const remoteUser =
    viewMode === "remote" && remoteUserId
      ? getNetworkUser(remoteUserId)
      : undefined;
  const profileAvatar =
    icon.type === "profile"
      ? {
          displayName: remoteUser?.displayName ?? localProfile.displayName,
          avatarUrl: remoteUser?.avatarUrl ?? localProfile.avatarUrl,
        }
      : null;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragging = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const latest = useRef({ x: icon.x, y: icon.y });
  const [position, setPosition] = useState({ x: icon.x, y: icon.y });
  const [draftName, setDraftName] = useState(icon.label);

  useEffect(() => {
    const element = buttonRef.current;
    if (!element) {
      setPosition({ x: icon.x, y: icon.y });
      latest.current = { x: icon.x, y: icon.y };
      return;
    }

    const clamped = measureAndClamp(element, { x: icon.x, y: icon.y });
    setPosition(clamped);
    latest.current = clamped;

    if (clamped.x !== icon.x || clamped.y !== icon.y) {
      if (viewMode !== "remote" && !isPinnedProfileIcon(icon)) {
        updateIconPosition(icon.id, clamped.x, clamped.y);
      }
    }
  }, [icon.id, icon.x, icon.y, icon.type, updateIconPosition, viewMode]);

  useEffect(() => {
    const onResize = () => {
      const element = buttonRef.current;
      if (!element || dragging.current || viewMode === "remote") {
        return;
      }
      const clamped = measureAndClamp(element, latest.current);
      if (clamped.x === latest.current.x && clamped.y === latest.current.y) {
        return;
      }
      latest.current = clamped;
      setPosition(clamped);
      updateIconPosition(icon.id, clamped.x, clamped.y);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [icon.id, updateIconPosition, viewMode]);

  useEffect(() => {
    return () => {
      clearDropTargetHighlight();
    };
  }, []);

  useEffect(() => {
    if (!isRenaming) {
      return;
    }
    setDraftName(icon.label);
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(id);
  }, [isRenaming, icon.label]);

  const commitRename = () => {
    renameIcon(icon.id, draftName);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || isRenaming || readOnly || pinned) {
      if (event.button === 0 && !isRenaming) {
        event.stopPropagation();
        selectIcon(icon.id);
      }
      return;
    }
    event.stopPropagation();
    selectIcon(icon.id);
    dragging.current = true;
    setIsDragging(true);
    offset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) {
      return;
    }
    const next = measureAndClamp(event.currentTarget, {
      x: Math.round(event.clientX - offset.current.x),
      y: Math.round(event.clientY - offset.current.y),
    });
    latest.current = next;
    setPosition(next);

    if (canDropIntoFolders) {
      const drop = resolveFileDropTarget(
        event.clientX,
        event.clientY,
        event.currentTarget,
      );
      if (drop?.kind === "folder") {
        setDropTargetHighlight(drop.element);
      } else {
        clearDropTargetHighlight();
      }
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) {
      return;
    }
    dragging.current = false;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (canDropIntoFolders) {
      const drop = resolveFileDropTarget(
        event.clientX,
        event.clientY,
        event.currentTarget,
      );
      clearDropTargetHighlight();
      if (drop?.kind === "folder") {
        setPosition({ x: icon.x, y: icon.y });
        latest.current = { x: icon.x, y: icon.y };
        moveIconToFolder(icon.id, drop.folderId);
        return;
      }
    } else {
      clearDropTargetHighlight();
    }

    const clamped = measureAndClamp(event.currentTarget, latest.current);
    latest.current = clamped;
    setPosition(clamped);
    updateIconPosition(icon.id, clamped.x, clamped.y);
  };

  const dropProps =
    icon.type === "folder" && !readOnly
      ? { [DROP_ATTR]: icon.id }
      : undefined;

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`win-desktop-icon absolute ${selected ? "win-desktop-icon-selected" : ""}`}
      style={{
        left: position.x,
        top: position.y,
        zIndex: isDragging ? 10000 : undefined,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={() => {
        if (!isRenaming) {
          openWindow(icon.id);
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        selectIcon(icon.id);
        const entries: ContextMenuEntry[] = [
          {
            id: "open",
            label: "Open",
            onSelect: () => openWindow(icon.id),
          },
        ];
        if (!readOnly && canRename(icon)) {
          entries.push({ id: "sep-rename", separator: true });
          entries.push({
            id: "rename",
            label: "Rename",
            onSelect: () => startRename(icon.id),
          });
        }
        if (!readOnly && canDeleteIcon(icon)) {
          entries.push({ id: "sep-delete", separator: true });
          entries.push({
            id: "delete",
            label: "Delete",
            onSelect: () => onRequestDelete(icon.id),
          });
        }
        onRequestMenu(event, entries);
      }}
      aria-label={icon.label}
      {...dropProps}
    >
      {profileAvatar ? (
        <ProfileAvatar
          displayName={profileAvatar.displayName}
          avatarUrl={profileAvatar.avatarUrl}
          size={32}
        />
      ) : (
        <Icon />
      )}
      {isRenaming ? (
        <input
          ref={inputRef}
          className="win-icon-rename"
          value={draftName}
          onChange={(event) =>
            setDraftName(clampFileTitle(event.target.value))
          }
          maxLength={MAX_FILE_TITLE_CHARS}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitRename();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              cancelRename();
            }
          }}
          onBlur={commitRename}
        />      ) : (
        <span className="win-desktop-icon-label">{icon.label}</span>
      )}
    </button>
  );
}
