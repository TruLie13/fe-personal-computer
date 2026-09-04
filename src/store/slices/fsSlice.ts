import type { StateCreator } from "zustand";
import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  canCreateFolder,
  canCreateTextFile,
  canDeleteIcon,
  clampFileTitle,
  clampTextFileContent,
  folderWindowTitle,
  isPinnedProfileIcon,
  nextDesktopIconPosition,
  uniqueFolderName,
  uniqueTextFileName,
} from "@/lib/storage";
import { uniqueDocumentSlug } from "@/lib/seo/slugs";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import {
  assertLocalWritable,
  commitDesktopPatch,
} from "@/store/desktopWrite";
import { createId } from "@/store/desktopWindowFactory";
import {
  selectionFromIcon,
  selectionFromIds,
} from "@/store/selectionState";
import type { DesktopIcon, TextDocument } from "@/types/desktop";

function slugForNewDocument(
  documents: TextDocument[],
  title: string,
): string {
  return uniqueDocumentSlug(
    title,
    documents.map((doc) => doc.slug),
  );
}

/** Roots to delete, skipping items already covered by a selected parent folder. */
function planIconRemoval(
  icons: DesktopIcon[],
  rootIds: ReadonlyArray<string>,
): { removedIconIds: Set<string>; removedDocumentIds: Set<string> } {
  const candidates = rootIds
    .map((id) => icons.find((item) => item.id === id))
    .filter(
      (icon): icon is DesktopIcon =>
        icon !== undefined && canDeleteIcon(icon),
    );

  const candidateIds = new Set(candidates.map((icon) => icon.id));
  const effective = candidates.filter((icon) => {
    let parentId = icon.parentId ?? null;
    while (parentId) {
      if (candidateIds.has(parentId)) {
        return false;
      }
      parentId =
        icons.find((item) => item.id === parentId)?.parentId ?? null;
    }
    return true;
  });

  const removedIconIds = new Set<string>();
  const removedDocumentIds = new Set<string>();

  for (const icon of effective) {
    removedIconIds.add(icon.id);
    if (icon.documentId) {
      removedDocumentIds.add(icon.documentId);
    }
    if (icon.type === "folder") {
      for (const child of icons) {
        if (child.parentId !== icon.id) {
          continue;
        }
        removedIconIds.add(child.id);
        if (child.documentId) {
          removedDocumentIds.add(child.documentId);
        }
      }
    }
  }

  return { removedIconIds, removedDocumentIds };
}

export type FsSlice = Pick<
  DesktopStore,
  | "icons"
  | "documents"
  | "updateIconPosition"
  | "updateDocumentContent"
  | "saveDocumentFromWindow"
  | "setDocumentPublic"
  | "createFolder"
  | "createTextFile"
  | "moveIconToFolder"
  | "startRename"
  | "cancelRename"
  | "renameIcon"
  | "deleteIcon"
  | "deleteIcons"
>;

export const createFsSlice: StateCreator<DesktopStore, [], [], FsSlice> = (
  set,
  get,
) => ({
  icons: DEFAULT_ICONS,
  documents: DEFAULT_DOCUMENTS,
  updateIconPosition: (iconId, x, y) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    set((state) => {
      const target = state.icons.find((icon) => icon.id === iconId);
      if (!target || isPinnedProfileIcon(target)) {
        return state;
      }
      const icons = state.icons.map((icon) =>
        icon.id === iconId ? { ...icon, x, y } : icon,
      );
      return commitDesktopPatch(state, { icons });
    });
  },

  updateDocumentContent: (windowId, content, title) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    const nextContent = clampTextFileContent(content);
    set((state) => {
      const target = state.windows.find((window) => window.id === windowId);
      if (!target?.documentId) {
        return state;
      }

      const documents = state.documents.map((doc) =>
        doc.id === target.documentId
          ? {
              ...doc,
              content: nextContent,
              title: title ?? doc.title,
              updatedAt: new Date().toISOString(),
            }
          : doc,
      );
      return commitDesktopPatch(state, { documents });
    });
  },

  saveDocumentFromWindow: (windowId, title, content) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    const state = get();
    const target = state.windows.find((window) => window.id === windowId);
    if (!target) {
      return;
    }

    const now = new Date().toISOString();
    const nextContent = clampTextFileContent(content);

    if (!target.documentId && !canCreateTextFile(state.documents)) {
      return;
    }

    if (target.documentId) {
      const existingIcon = state.icons.find(
        (icon) => icon.documentId === target.documentId,
      );
      const fileTitle = uniqueTextFileName(
        state.icons,
        existingIcon?.parentId ?? null,
        clampFileTitle(title),
        existingIcon?.id ?? null,
      );
      const documents = state.documents.map((doc) =>
        doc.id === target.documentId
          ? { ...doc, title: fileTitle, content: nextContent, updatedAt: now }
          : doc,
      );
      const icons = state.icons.map((icon) =>
        icon.documentId === target.documentId
          ? { ...icon, label: fileTitle }
          : icon,
      );
      const windows = state.windows.map((window) =>
        window.id === windowId
          ? { ...window, title: `${fileTitle} - Notepad` }
          : window,
      );
      set(commitDesktopPatch(state, { documents, icons, windows }));
      return;
    }

    const fileTitle = uniqueTextFileName(
      state.icons,
      null,
      clampFileTitle(title),
    );
    const documentId = createId("doc");
    const position = nextDesktopIconPosition(state.icons, "file");
    const document: TextDocument = {
      id: documentId,
      title: fileTitle,
      slug: slugForNewDocument(state.documents, fileTitle),
      content: nextContent,
      createdAt: now,
      updatedAt: now,
    };
    const icon: DesktopIcon = {
      id: `file-${documentId}`,
      label: fileTitle,
      type: "text",
      x: position.x,
      y: position.y,
      documentId,
      parentId: null,
    };

    const documents = [...state.documents, document];
    const icons = [...state.icons, icon];
    const windows = state.windows.map((window) =>
      window.id === windowId
        ? {
            ...window,
            documentId,
            title: `${fileTitle} - Notepad`,
            iconId: icon.id,
          }
        : window,
    );

    set(commitDesktopPatch(state, { documents, icons, windows }));
  },

  setDocumentPublic: (documentId, isPublic) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    set((state) => {
      const existing = state.documents.find((doc) => doc.id === documentId);
      if (!existing || existing.isPublic === isPublic) {
        return state;
      }
      const now = new Date().toISOString();
      const documents = state.documents.map((doc) =>
        doc.id === documentId
          ? { ...doc, isPublic, updatedAt: now }
          : doc,
      );
      return commitDesktopPatch(state, { documents });
    });
  },

  createFolder: (name, position, parentId) => {
    if (!assertLocalWritable(get)) {
      return null;
    }
    const state = get();
    if (!canCreateFolder(state.icons)) {
      return null;
    }
    const parent = parentId ?? null;

    if (parent !== null) {
      const folder = state.icons.find(
        (item) => item.id === parent && item.type === "folder",
      );
      if (!folder) {
        return null;
      }
    }

    const label = uniqueFolderName(
      state.icons,
      clampFileTitle(name?.trim() || "New Folder"),
      null,
      parent,
    );
    const place =
      parent === null
        ? (position ?? nextDesktopIconPosition(state.icons, "folder"))
        : { x: 0, y: 0 };
    const id = createId("folder");
    const icon: DesktopIcon = {
      id,
      label,
      type: "folder",
      x: place.x,
      y: place.y,
      parentId: parent,
    };
    const icons = [...state.icons, icon];
    set(commitDesktopPatch(state, {
      icons,
      ...selectionFromIcon(id),
      renamingIconId: id,
      isStartMenuOpen: false,
    }));
    return id;
  },

  createTextFile: (parentId, name) => {
    if (!assertLocalWritable(get)) {
      return null;
    }
    const state = get();
    if (!canCreateTextFile(state.documents)) {
      return null;
    }
    const parent = parentId ?? null;

    if (parent !== null) {
      const folder = state.icons.find(
        (item) => item.id === parent && item.type === "folder",
      );
      if (!folder) {
        return null;
      }
    }

    const now = new Date().toISOString();
    const label = uniqueTextFileName(
      state.icons,
      parent,
      clampFileTitle(name?.trim() || "New Text Document"),
    );
    const documentId = createId("doc");
    const place =
      parent === null
        ? nextDesktopIconPosition(state.icons, "file")
        : { x: 0, y: 0 };
    const document: TextDocument = {
      id: documentId,
      title: label,
      slug: slugForNewDocument(state.documents, label),
      content: "",
      createdAt: now,
      updatedAt: now,
    };
    const iconId = `file-${documentId}`;
    const icon: DesktopIcon = {
      id: iconId,
      label,
      type: "text",
      x: place.x,
      y: place.y,
      documentId,
      parentId: parent,
    };

    const documents = [...state.documents, document];
    const icons = [...state.icons, icon];
    set(commitDesktopPatch(state, {
      documents,
      icons,
      ...selectionFromIcon(iconId),
      renamingIconId: iconId,
      isStartMenuOpen: false,
    }));
    return iconId;
  },

  startRename: (iconId) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    const icon = get().icons.find((item) => item.id === iconId);
    if (!icon) {
      return;
    }
    if (icon.type !== "folder" && icon.type !== "text") {
      return;
    }
    set({
      renamingIconId: iconId,
      ...selectionFromIcon(iconId),
      isStartMenuOpen: false,
    });
  },

  cancelRename: () => {
    set({ renamingIconId: null });
  },

  renameIcon: (iconId, label) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    const state = get();
    const icon = state.icons.find((item) => item.id === iconId);
    if (!icon) {
      return;
    }
    if (icon.type !== "folder" && icon.type !== "text") {
      return;
    }

    const nextLabel =
      icon.type === "text"
        ? uniqueTextFileName(
            state.icons,
            icon.parentId ?? null,
            clampFileTitle(label),
            icon.id,
          )
        : uniqueFolderName(
            state.icons,
            clampFileTitle(label.trim() || icon.label),
            icon.id,
            icon.parentId ?? null,
          );

    if (!nextLabel) {
      set({ renamingIconId: null });
      return;
    }

    const icons = state.icons.map((item) =>
      item.id === iconId ? { ...item, label: nextLabel } : item,
    );

    const documents =
      icon.documentId != null
        ? state.documents.map((doc) =>
            doc.id === icon.documentId
              ? {
                  ...doc,
                  title: nextLabel,
                  updatedAt: new Date().toISOString(),
                }
              : doc,
          )
        : state.documents;

    const windows = state.windows.map((window) => {
      if (window.type === "folder") {
        return {
          ...window,
          title: folderWindowTitle(icons, window.iconId),
        };
      }
      if (
        icon.documentId &&
        window.documentId === icon.documentId &&
        window.type === "editor"
      ) {
        return { ...window, title: `${nextLabel} - Notepad` };
      }
      return window;
    });

    set(commitDesktopPatch(state, { icons, documents, windows, renamingIconId: null }));
  },

  deleteIcon: (iconId) => {
    get().deleteIcons([iconId]);
  },

  deleteIcons: (iconIds) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    const state = get();
    const { removedIconIds, removedDocumentIds } = planIconRemoval(
      state.icons,
      iconIds,
    );
    if (removedIconIds.size === 0) {
      return;
    }

    const icons = state.icons.filter((item) => !removedIconIds.has(item.id));
    const documents = state.documents.filter(
      (doc) => !removedDocumentIds.has(doc.id),
    );
    const windows = state.windows.map((window) => {
      const removeWindow =
        removedIconIds.has(window.iconId) ||
        (window.documentId != null &&
          removedDocumentIds.has(window.documentId));
      if (!removeWindow) {
        return window;
      }
      return {
        ...window,
        isOpen: false,
        isFocused: false,
        isMinimized: false,
        isMaximized: false,
        restoreBounds: undefined,
      };
    });

    const nextSelectedIds = state.selectedIconIds.filter(
      (id) => !removedIconIds.has(id),
    );

    set(commitDesktopPatch(state, {
      icons,
      documents,
      windows,
      ...selectionFromIds(nextSelectedIds),
      renamingIconId: removedIconIds.has(state.renamingIconId ?? "")
        ? null
        : state.renamingIconId,
    }));
  },

  moveIconToFolder: (iconId, folderId, dropPosition) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    const state = get();
    const icon = state.icons.find((item) => item.id === iconId);
    const movable =
      icon &&
      (icon.type === "folder" ||
        icon.type === "text" ||
        Boolean(icon.documentId));
    if (!icon || !movable) {
      return;
    }

    if (folderId !== null) {
      const folder = state.icons.find(
        (item) => item.id === folderId && item.type === "folder",
      );
      if (!folder) {
        return;
      }
      // Block moving a folder into itself or one of its descendants.
      if (icon.type === "folder") {
        let walk: string | null = folderId;
        while (walk) {
          if (walk === icon.id) {
            return;
          }
          walk =
            state.icons.find((item) => item.id === walk)?.parentId ?? null;
        }
      }
    }

    const currentParent = icon.parentId ?? null;
    if (currentParent === folderId) {
      return;
    }

    const position =
      folderId === null
        ? (dropPosition ??
          nextDesktopIconPosition(
            state.icons.filter((item) => item.id !== iconId),
            icon.type === "folder" ? "folder" : "file",
          ))
        : { x: icon.x, y: icon.y };

    const nextLabel =
      icon.type === "folder"
        ? uniqueFolderName(state.icons, icon.label, icon.id, folderId)
        : uniqueTextFileName(state.icons, folderId, icon.label, icon.id);
    const renamed = nextLabel !== icon.label;

    const icons = state.icons.map((item) =>
      item.id === iconId
        ? {
            ...item,
            parentId: folderId,
            x: position.x,
            y: position.y,
            label: nextLabel,
          }
        : item,
    );

    const documents =
      renamed && icon.documentId
        ? state.documents.map((doc) =>
            doc.id === icon.documentId
              ? {
                  ...doc,
                  title: nextLabel,
                  updatedAt: new Date().toISOString(),
                }
              : doc,
          )
        : state.documents;

    const windows = renamed
      ? state.windows.map((window) => {
          if (window.type === "folder") {
            return {
              ...window,
              title: folderWindowTitle(icons, window.iconId),
            };
          }
          if (
            icon.documentId &&
            window.documentId === icon.documentId &&
            window.type === "editor"
          ) {
            return { ...window, title: `${nextLabel} - Notepad` };
          }
          return window;
        })
      : icon.type === "folder"
        ? state.windows.map((window) =>
            window.type === "folder"
              ? {
                  ...window,
                  title: folderWindowTitle(icons, window.iconId),
                }
              : window,
          )
        : state.windows;

    set(commitDesktopPatch(state, {
      icons,
      documents,
      windows,
      ...(state.selectedIconId === iconId && folderId !== null
        ? selectionFromIcon(null)
        : state.selectedIconIds.includes(iconId) && folderId !== null
          ? selectionFromIds(
              state.selectedIconIds.filter((id) => id !== iconId),
            )
          : {}),
    }));
  },
});
