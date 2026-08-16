"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import {
  ContextMenu,
  type ContextMenuEntry,
} from "@/components/desktop/ContextMenu";
import { FolderIcon, TextFileIcon } from "@/components/desktop/icons";
import { buildDeleteConfirmMessage, canDeleteIcon } from "@/lib/deleteConfirm";
import {
  clearDropTargetHighlight,
  DROP_ATTR,
  resolveFileDropTarget,
  setDropTargetHighlight,
} from "@/lib/dragDrop";
import { isOnDesktop } from "@/lib/storage";
import {
  selectFolderContents,
  useDesktopStore,
} from "@/store/desktopStore";
import type { DesktopIcon as DesktopIconType } from "@/types/desktop";

interface FolderWindowProps {
  folderId: string;
}

interface DragGhost {
  icon: DesktopIconType;
  x: number;
  y: number;
}

interface MenuState {
  x: number;
  y: number;
  entries: ContextMenuEntry[];
}

const DRAG_THRESHOLD_PX = 4;

export function FolderWindow({ folderId }: FolderWindowProps) {
  const icons = useDesktopStore((state) => state.icons);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const moveIconToFolder = useDesktopStore((state) => state.moveIconToFolder);
  const selectIcon = useDesktopStore((state) => state.selectIcon);
  const renamingIconId = useDesktopStore((state) => state.renamingIconId);
  const startRename = useDesktopStore((state) => state.startRename);
  const renameIcon = useDesktopStore((state) => state.renameIcon);
  const cancelRename = useDesktopStore((state) => state.cancelRename);
  const deleteIcon = useDesktopStore((state) => state.deleteIcon);

  const contents = selectFolderContents(icons, folderId);
  const desktopFiles = icons.filter(
    (icon) => icon.documentId && isOnDesktop(icon),
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [ghost, setGhost] = useState<DragGhost | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const dragIconId = useRef<string | null>(null);
  const dragStarted = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const ghostRef = useRef<HTMLDivElement>(null);

  const selected = contents.find((icon) => icon.id === selectedId);
  const renamingItem = contents.find((icon) => icon.id === renamingIconId);
  const pendingDeleteIcon = pendingDeleteId
    ? icons.find((icon) => icon.id === pendingDeleteId)
    : undefined;
  const deletePrompt = pendingDeleteIcon
    ? buildDeleteConfirmMessage(pendingDeleteIcon, icons)
    : null;

  useEffect(() => {
    if (!renamingItem) {
      return;
    }
    setDraftName(renamingItem.label);
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(id);
  }, [renamingItem?.id, renamingItem?.label]);

  const closeMenu = useCallback(() => setMenu(null), []);

  const endDrag = () => {
    dragIconId.current = null;
    dragStarted.current = false;
    setGhost(null);
    clearDropTargetHighlight();
  };

  const onItemPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    item: DesktopIconType,
  ) => {
    if (event.button !== 0 || !item.documentId || renamingIconId === item.id) {
      return;
    }
    event.stopPropagation();
    setSelectedId(item.id);
    selectIcon(item.id);
    dragIconId.current = item.id;
    dragStarted.current = false;
    origin.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onItemPointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
    item: DesktopIconType,
  ) => {
    if (dragIconId.current !== item.id) {
      return;
    }

    const dx = event.clientX - origin.current.x;
    const dy = event.clientY - origin.current.y;
    if (!dragStarted.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
      return;
    }

    dragStarted.current = true;
    setGhost({
      icon: item,
      x: event.clientX,
      y: event.clientY,
    });

    const probe = ghostRef.current ?? event.currentTarget;
    const drop = resolveFileDropTarget(event.clientX, event.clientY, probe, {
      excludeFolderId: folderId,
    });
    if (drop?.kind === "folder") {
      setDropTargetHighlight(drop.element);
    } else if (drop?.kind === "desktop") {
      setDropTargetHighlight(drop.element);
    } else {
      clearDropTargetHighlight();
    }
  };

  const onItemPointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
    item: DesktopIconType,
  ) => {
    if (dragIconId.current !== item.id) {
      return;
    }

    const wasDragging = dragStarted.current;
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (!wasDragging) {
      endDrag();
      return;
    }

    const probe = ghostRef.current ?? event.currentTarget;
    const drop = resolveFileDropTarget(event.clientX, event.clientY, probe, {
      excludeFolderId: folderId,
    });
    clearDropTargetHighlight();

    if (drop?.kind === "folder") {
      moveIconToFolder(item.id, drop.folderId);
    } else if (drop?.kind === "desktop") {
      moveIconToFolder(item.id, null, { x: drop.x, y: drop.y });
    }

    endDrag();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-win-face">
      <div className="flex flex-wrap items-center gap-2 border-b border-win-dark px-2 py-1">
        <button
          type="button"
          className="win-raised px-2 py-0.5 disabled:opacity-50"
          disabled={!selected}
          onClick={() => {
            if (!selected) {
              return;
            }
            moveIconToFolder(selected.id, null);
            setSelectedId(null);
          }}
        >
          Move to Desktop
        </button>
        <button
          type="button"
          className="win-raised px-2 py-0.5 disabled:opacity-50"
          disabled={desktopFiles.length === 0}
          onClick={() => setAdding((value) => !value)}
        >
          {adding ? "Cancel" : "Add from Desktop..."}
        </button>
      </div>

      {adding ? (
        <div className="win-sunken m-1 max-h-28 overflow-auto bg-white p-1">
          {desktopFiles.length === 0 ? (
            <p className="px-1 text-win-dark">No files on the desktop.</p>
          ) : (
            desktopFiles.map((file) => (
              <button
                key={file.id}
                type="button"
                className="flex w-full items-center gap-2 px-1 py-0.5 text-left hover:bg-win-navy hover:text-white"
                onClick={() => {
                  moveIconToFolder(file.id, folderId);
                  setAdding(false);
                }}
              >
                <TextFileIcon size={16} />
                <span className="truncate">{file.label}</span>
              </button>
            ))
          )}
        </div>
      ) : null}

      <div
        className="win-sunken m-1 min-h-0 flex-1 overflow-auto bg-white"
        {...{ [DROP_ATTR]: folderId }}
      >
        {contents.length === 0 ? (
          <div className="p-3 text-[12px] text-win-dark">
            This folder is empty. Drag files in from the desktop, or drag them
            out onto the desktop to remove them.
          </div>
        ) : (
          <ul className="p-1">
            {contents.map((item) => {
              const active = selectedId === item.id;
              const isRenaming = renamingIconId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 px-1 py-1 text-left ${
                      active
                        ? "bg-win-navy text-white"
                        : "hover:bg-win-face-light"
                    }`}
                    onClick={() => {
                      setSelectedId(item.id);
                      selectIcon(item.id);
                    }}
                    onDoubleClick={() => {
                      if (!isRenaming) {
                        openWindow(item.id);
                      }
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setSelectedId(item.id);
                      selectIcon(item.id);
                      const entries: ContextMenuEntry[] = [
                        {
                          id: "open",
                          label: "Open",
                          onSelect: () => openWindow(item.id),
                        },
                      ];
                      if (item.type === "text" || item.type === "folder") {
                        entries.push({ id: "sep", separator: true });
                        entries.push({
                          id: "rename",
                          label: "Rename",
                          onSelect: () => startRename(item.id),
                        });
                      }
                      if (canDeleteIcon(item)) {
                        entries.push({ id: "sep-delete", separator: true });
                        entries.push({
                          id: "delete",
                          label: "Delete",
                          onSelect: () => setPendingDeleteId(item.id),
                        });
                      }
                      setMenu({
                        x: event.clientX,
                        y: event.clientY,
                        entries,
                      });
                    }}
                    onPointerDown={(event) => onItemPointerDown(event, item)}
                    onPointerMove={(event) => onItemPointerMove(event, item)}
                    onPointerUp={(event) => onItemPointerUp(event, item)}
                  >
                    {item.type === "folder" ? (
                      <FolderIcon size={16} />
                    ) : (
                      <TextFileIcon size={16} />
                    )}
                    {isRenaming ? (
                      <input
                        ref={inputRef}
                        className="win-icon-rename min-w-0 flex-1 text-left"
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            renameIcon(item.id, draftName);
                          }
                          if (event.key === "Escape") {
                            event.preventDefault();
                            cancelRename();
                          }
                        }}
                        onBlur={() => renameIcon(item.id, draftName)}
                      />
                    ) : (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {ghost ? (
        <div
          ref={ghostRef}
          className="win-desktop-icon pointer-events-none fixed z-[20000]"
          style={{
            left: ghost.x - 38,
            top: ghost.y - 20,
          }}
        >
          <TextFileIcon />
          <span className="win-desktop-icon-label">{ghost.icon.label}</span>
        </div>
      ) : null}

      {menu ? (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          entries={menu.entries}
          onClose={closeMenu}
        />
      ) : null}

      {deletePrompt && pendingDeleteId ? (
        <ConfirmDialog
          title={deletePrompt.title}
          message={deletePrompt.message}
          onConfirm={() => {
            deleteIcon(pendingDeleteId);
            setPendingDeleteId(null);
            if (selectedId === pendingDeleteId) {
              setSelectedId(null);
            }
          }}
          onCancel={() => setPendingDeleteId(null)}
        />
      ) : null}
    </div>
  );
}
