import { slugifyTitle, uniqueDocumentSlug } from "@/lib/seo/slugs";
import {
  isAppIcon,
  PROFILE_ICON_POSITION,
} from "@/lib/storage";
import type { FirestoreFileDoc } from "@/types/firestore";
import type { DesktopIcon, TextDocument } from "@/types/desktop";

export const DOCUMENTS_FOLDER_ID = "documents";

export interface DesktopFsSnapshot {
  icons: DesktopIcon[];
  documents: TextDocument[];
}

/** Folder + text icons that belong in `users/{uid}/files`. */
export function isPersistedFsIcon(icon: DesktopIcon): boolean {
  if (icon.type === "text") {
    return Boolean(icon.documentId);
  }
  if (icon.type === "folder") {
    // Documents is an app icon but is also the FS root folder.
    return icon.id === DOCUMENTS_FOLDER_ID || !isAppIcon(icon.id);
  }
  return false;
}

export function defaultDocumentsFolderDoc(
  now = new Date().toISOString(),
): FirestoreFileDoc {
  return {
    type: "folder",
    title: "Documents",
    slug: DOCUMENTS_FOLDER_ID,
    parentId: null,
    desktopX: PROFILE_ICON_POSITION.x,
    desktopY: 112,
    isPublic: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Build Firestore file docs keyed by fileId (`doc-…` or folder icon id).
 */
export function desktopFsToFileDocs(
  icons: ReadonlyArray<DesktopIcon>,
  documents: ReadonlyArray<TextDocument>,
): Map<string, FirestoreFileDoc> {
  const docsById = new Map(documents.map((doc) => [doc.id, doc]));
  const out = new Map<string, FirestoreFileDoc>();
  const folderSlugTaken: string[] = [];

  for (const icon of icons) {
    if (!isPersistedFsIcon(icon)) {
      continue;
    }

    if (icon.type === "folder") {
      const now = new Date().toISOString();
      const slug =
        icon.id === DOCUMENTS_FOLDER_ID
          ? DOCUMENTS_FOLDER_ID
          : uniqueDocumentSlug(icon.label, folderSlugTaken);
      folderSlugTaken.push(slug);
      out.set(icon.id, {
        type: "folder",
        title: icon.label,
        slug,
        parentId: icon.parentId ?? null,
        desktopX: icon.x,
        desktopY: icon.y,
        isPublic: false,
        createdAt: now,
        updatedAt: now,
      });
      continue;
    }

    const documentId = icon.documentId;
    if (!documentId) {
      continue;
    }
    const document = docsById.get(documentId);
    if (!document) {
      continue;
    }
    out.set(documentId, {
      type: "text",
      title: document.title,
      slug: document.slug,
      content: document.content,
      parentId: icon.parentId ?? null,
      desktopX: icon.x,
      desktopY: icon.y,
      isPublic: document.isPublic === true,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  if (!out.has(DOCUMENTS_FOLDER_ID)) {
    out.set(DOCUMENTS_FOLDER_ID, defaultDocumentsFolderDoc());
  }

  return out;
}

function timestampToIso(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return fallback;
}

export function parseFirestoreFileDoc(
  value: unknown,
): FirestoreFileDoc | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (record.type !== "text" && record.type !== "folder") {
    return null;
  }
  if (typeof record.title !== "string" || typeof record.slug !== "string") {
    return null;
  }
  const now = new Date().toISOString();
  return {
    type: record.type,
    title: record.title,
    slug: record.slug || slugifyTitle(record.title),
    content: typeof record.content === "string" ? record.content : undefined,
    parentId: typeof record.parentId === "string" ? record.parentId : null,
    desktopX: typeof record.desktopX === "number" ? record.desktopX : 16,
    desktopY: typeof record.desktopY === "number" ? record.desktopY : 16,
    isPublic: record.isPublic === true,
    createdAt: timestampToIso(record.createdAt, now),
    updatedAt: timestampToIso(record.updatedAt, now),
  };
}

/** Convert Firestore files into FE icons + documents (no app icons). */
export function fileDocsToDesktopFs(
  files: ReadonlyArray<{ id: string; data: FirestoreFileDoc }>,
): DesktopFsSnapshot {
  const icons: DesktopIcon[] = [];
  const documents: TextDocument[] = [];

  for (const file of files) {
    if (file.data.type === "folder") {
      icons.push({
        id: file.id,
        label: file.data.title,
        type: "folder",
        x: file.data.desktopX,
        y: file.data.desktopY,
        parentId: file.data.parentId,
      });
      continue;
    }

    documents.push({
      id: file.id,
      title: file.data.title,
      slug: file.data.slug,
      content: file.data.content ?? "",
      createdAt: file.data.createdAt,
      updatedAt: file.data.updatedAt,
      isPublic: file.data.isPublic === true,
    });
    icons.push({
      id: `file-${file.id}`,
      label: file.data.title,
      type: "text",
      x: file.data.desktopX,
      y: file.data.desktopY,
      documentId: file.id,
      parentId: file.data.parentId,
    });
  }

  return { icons, documents };
}
