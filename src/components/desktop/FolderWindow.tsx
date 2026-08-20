"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import {
  ContextMenu,
  type ContextMenuEntry,
} from "@/components/desktop/ContextMenu";
import { FolderIcon, TextFileIcon, UpFolderIcon } from "@/components/desktop/icons";
import { useFolderCreateGuard } from "@/hooks/useFolderCreateGuard";
import { useContextMenuState } from "@/hooks/useContextMenuState";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { canDeleteIcon } from "@/lib/deleteConfirm";
import {
  clearDropTargetHighlight,
  DROP_ATTR,
  resolveFileDropTarget,
  setDropTargetHighlight,
} from "@/lib/dragDrop";
import { isOnDesktop, MAX_FILE_TITLE_CHARS, clampFileTitle } from "@/lib/storage";
import {
  selectActiveIcons,
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

const DRAG_THRESHOLD_PX = 4;

function canMoveIcon(icon: DesktopIconType): boolean {
  return (
    icon.type === "folder" || icon.type === "text" || Boolean(icon.documentId)
  );
}

export function FolderWindow({ folderId }: FolderWindowProps) {
  const icons = useDesktopStore(selectActiveIcons);
  const viewMode = useDesktopStore((state) => state.viewMode);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const moveIconToFolder = useDesktopStore((state) => state.moveIconToFolder);
  const createTextFile = useDesktopStore((state) => state.createTextFile);
  const selectIcon = useDesktopStore((state) => state.selectIcon);
  const renamingIconId = useDesktopStore((state) => state.renamingIconId);
  const startRename = useDesktopStore((state) => state.startRename);
  const renameIcon = useDesktopStore((state) => state.renameIcon);
  const cancelRename = useDesktopStore((state) => state.cancelRename);
  const deleteIcon = useDesktopStore((state) => state.deleteIcon);
  const { tryCreateFolder, folderLimitDialog } = useFolderCreateGuard();

  const readOnly = viewMode === "remote";
  const folder = icons.find(
    (icon) => icon.id === folderId && icon.type === "folder",
  );
  const parentId = folder?.parentId ?? null;
  const contents = selectFolderContents(icons, folderId);
  const desktopItems = icons.filter((icon) => {
    if (!isOnDesktop(icon) || !canMoveIcon(icon)) {
      return false;
    }
    // Don't offer the open folder (or an ancestor) — that would nest a parent in itself.
    if (icon.type === "folder") {
      let walk: string | null = folderId;
      while (walk) {
        if (walk === icon.id) {
          return false;
        }
        walk = icons.find((item) => item.id === walk)?.parentId ?? null;
      }
    }
    return true;
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [ghost, setGhost] = useState<DragGhost | null>(null);
  const [draftName, setDraftName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { menu, openMenu, closeMenu } = useContextMenuState();
  const {
    pendingDeleteId,
    deletePrompt,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useDeleteConfirm(icons);

  const dragIconId = useRef<string | null>(null);
  const dragStarted = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const ghostRef = useRef<HTMLDivElement>(null);
  const lastPointer = useRef({ x: 0, y: 0 });

  const selected = contents.find((icon) => icon.id === selectedId);
  const renamingItem = contents.find((icon) => icon.id === renamingIconId);

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

  const goUp = () => {
    if (parentId) {
      openWindow(parentId);
    }
  };

  const endDrag = useCallback(() => {
    dragIconId.current = null;
    dragStarted.current = false;
    setGhost(null);
    clearDropTargetHighlight();
  }, []);

  const onItemPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    item: DesktopIconType,
  ) => {
    if (
      event.button !== 0 ||
      renamingIconId === item.id ||
      (item.type !== "folder" && !item.documentId)
    ) {
      return;
    }
    event.stopPropagation();
    setSelectedId(item.id);
    selectIcon(item.id);
    dragIconId.current = item.id;
    dragStarted.current = false;
    origin.current = { x: event.clientX, y: event.clientY };
    lastPointer.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onItemPointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
    item: DesktopIconType,
  ) => {
    if (dragIconId.current !== item.id) {
      return;
    }

    lastPointer.current = { x: event.clientX, y: event.clientY };

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

  const completeDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    item: DesktopIconType,
  ) => {
    if (dragIconId.current !== item.id) {
      endDrag();
      return;
    }

    const wasDragging = dragStarted.current;
    const clientX = event.clientX || lastPointer.current.x;
    const clientY = event.clientY || lastPointer.current.y;

    if (wasDragging) {
      const probe = ghostRef.current ?? event.currentTarget;
      const drop = resolveFileDropTarget(clientX, clientY, probe, {
        excludeFolderId: folderId,
      });
      clearDropTargetHighlight();

      if (drop?.kind === "folder") {
        moveIconToFolder(item.id, drop.folderId);
      } else if (drop?.kind === "desktop") {
        moveIconToFolder(item.id, null, { x: drop.x, y: drop.y });
      }
    }

    endDrag();

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Capture may already be released (cancel / lostcapture).
    }
  };

  const onItemPointerCancel = (
    event: React.PointerEvent<HTMLButtonElement>,
    item: DesktopIconType,
  ) => {
    if (dragIconId.current !== item.id) {
      return;
    }
    endDrag();
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
  };

  const onItemLostPointerCapture = (
    _event: React.PointerEvent<HTMLButtonElement>,
    item: DesktopIconType,
  ) => {
    if (dragIconId.current === item.id) {
      endDrag();
    }
  };

  const ghostNode =
    ghost && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={ghostRef}
            className="win-desktop-icon pointer-events-none fixed z-[20000]"
            style={{
              left: ghost.x - 38,
              top: ghost.y - 20,
            }}
          >
            {ghost.icon.type === "folder" ? <FolderIcon /> : <TextFileIcon />}
            <span className="win-desktop-icon-label">{ghost.icon.label}</span>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-win-face">
      <div className="flex flex-wrap items-center gap-2 border-b border-win-dark px-2 py-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="win-raised flex items-center justify-center p-1 disabled:opacity-50"
            title="Up One Level"
            aria-label="Up One Level"
            disabled={!parentId}
            onClick={goUp}
          >
            <UpFolderIcon size={16} />
          </button>
          {!readOnly ? (
            <>
              <button
                type="button"
                className="win-raised flex items-center justify-center p-1"
                title="New Folder"
                aria-label="New Folder"
                onClick={() => {
                  const id = tryCreateFolder(undefined, undefined, folderId);
                  if (id) {
                    setSelectedId(id);
                  }
                }}
              >
                <FolderIcon size={16} />
              </button>
              <button
                type="button"
                className="win-raised flex items-center justify-center p-1"
                title="New Text Document"
                aria-label="New Text Document"
                onClick={() => {
                  const id = createTextFile(folderId);
                  if (id) {
                    setSelectedId(id);
                  }
                }}
              >
                <TextFileIcon size={16} />
              </button>
            </>
          ) : null}
        </div>
        {readOnly ? (
          <span className="text-[12px] text-win-dark">
            Read-only visit — open files to read
          </span>
        ) : (
          <>
            <span className="text-win-dark" aria-hidden="true">
              |
            </span>
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
              disabled={desktopItems.length === 0}
              onClick={() => setAdding((value) => !value)}
            >
              {adding ? "Cancel" : "Add from Desktop..."}
            </button>
          </>
        )}
      </div>

      {!readOnly && adding ? (
        <div className="win-sunken m-1 max-h-28 overflow-auto bg-win-paper p-1 text-win-ink">
          {desktopItems.length === 0 ? (
            <p className="px-1 text-win-paper-muted">Nothing movable on the desktop.</p>
          ) : (
            desktopItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center gap-2 px-1 py-0.5 text-left hover:bg-win-navy hover:text-white"
                onClick={() => {
                  moveIconToFolder(item.id, folderId);
                  setAdding(false);
                }}
              >
                {item.type === "folder" ? (
                  <FolderIcon size={16} className="shrink-0" />
                ) : (
                  <TextFileIcon size={16} className="shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate pl-1">{item.label}</span>
              </button>
            ))
          )}
        </div>
      ) : null}

      <div
        className="win-sunken m-1 min-h-0 flex-1 overflow-auto bg-win-paper text-win-ink"
        {...(readOnly ? {} : { [DROP_ATTR]: folderId })}
      >
        {contents.length === 0 ? (
          <div className="p-3 text-[12px] text-win-paper-muted">
            {readOnly
              ? "This folder is empty."
              : "This folder is empty. Use the toolbar to create a folder or text file, or drag files in from the desktop."}
          </div>
        ) : (
          <ul className="list-none p-1">
            {contents.map((item) => {
              const active = selectedId === item.id;
              const isRenaming = renamingIconId === item.id;
              const isDragSource = ghost?.icon.id === item.id;
              return (
                <li
                  key={item.id}
                  className={isDragSource ? "invisible" : undefined}
                >
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 px-1 py-1 text-left ${
                      active
                        ? "bg-win-navy text-white"
                        : "hover:bg-win-paper-hover"
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
                      if (!readOnly) {
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
                            onSelect: () => requestDelete(item.id),
                          });
                        }
                      }
                      openMenu(event, entries);
                    }}
                    onPointerDown={(event) => {
                      if (!readOnly) {
                        onItemPointerDown(event, item);
                      }
                    }}
                    onPointerMove={(event) => {
                      if (!readOnly) {
                        onItemPointerMove(event, item);
                      }
                    }}
                    onPointerUp={(event) => {
                      if (!readOnly) {
                        completeDrag(event, item);
                      }
                    }}
                    onPointerCancel={(event) => {
                      if (!readOnly) {
                        onItemPointerCancel(event, item);
                      }
                    }}
                    onLostPointerCapture={(event) => {
                      if (!readOnly) {
                        onItemLostPointerCapture(event, item);
                      }
                    }}
                  >
                    {item.type === "folder" ? (
                      <FolderIcon size={16} className="shrink-0" />
                    ) : (
                      <TextFileIcon size={16} className="shrink-0" />
                    )}
                    {isRenaming ? (
                      <input
                        ref={inputRef}
                        className="win-icon-rename min-w-0 flex-1 pl-1 text-left"
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
                      <span className="min-w-0 flex-1 truncate pl-1">
                        {item.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {ghostNode}

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
            const id = confirmDelete();
            if (!id) {
              return;
            }
            deleteIcon(id);
            if (selectedId === id) {
              setSelectedId(null);
            }
          }}
          onCancel={cancelDelete}
        />
      ) : null}
      {folderLimitDialog}
    </div>
  );
}
