import { DOCUMENTS_FOLDER_ID } from "@/lib/repository/desktopFiles";
import type { DesktopIcon, TextDocument, WindowType } from "@/types/desktop";

const WINDOW_TYPES = new Set<WindowType>([
  "about",
  "folder",
  "text",
  "system",
  "editor",
  "display",
  "bbs",
  "network",
  "stories",
  "comments",
  "guestbook",
  "profile",
]);

export class DesktopLayoutPayloadError extends Error {
  readonly code = "invalid_layout_payload";

  constructor(message: string) {
    super(message);
    this.name = "DesktopLayoutPayloadError";
  }
}

export function isDesktopLayoutPayloadError(
  value: unknown,
): value is DesktopLayoutPayloadError {
  return value instanceof DesktopLayoutPayloadError;
}

function isWindowType(value: unknown): value is WindowType {
  return typeof value === "string" && WINDOW_TYPES.has(value as WindowType);
}

function parseIcon(value: unknown, index: number): DesktopIcon {
  if (!value || typeof value !== "object") {
    throw new DesktopLayoutPayloadError(`icons[${index}] must be an object`);
  }
  const icon = value as Record<string, unknown>;
  if (typeof icon.id !== "string" || !icon.id) {
    throw new DesktopLayoutPayloadError(`icons[${index}].id is required`);
  }
  if (!isWindowType(icon.type)) {
    throw new DesktopLayoutPayloadError(`icons[${index}].type is invalid`);
  }
  if (typeof icon.label !== "string") {
    throw new DesktopLayoutPayloadError(`icons[${index}].label is required`);
  }
  if (typeof icon.x !== "number" || typeof icon.y !== "number") {
    throw new DesktopLayoutPayloadError(
      `icons[${index}] requires numeric x and y`,
    );
  }
  const parsed: DesktopIcon = {
    id: icon.id,
    label: icon.label,
    type: icon.type,
    x: icon.x,
    y: icon.y,
  };
  if (typeof icon.documentId === "string") {
    parsed.documentId = icon.documentId;
  }
  if (icon.parentId === null) {
    parsed.parentId = null;
  } else if (typeof icon.parentId === "string") {
    parsed.parentId = icon.parentId;
  }
  return parsed;
}

function parseDocument(value: unknown, index: number): TextDocument {
  if (!value || typeof value !== "object") {
    throw new DesktopLayoutPayloadError(
      `documents[${index}] must be an object`,
    );
  }
  const doc = value as Record<string, unknown>;
  if (typeof doc.id !== "string" || !doc.id) {
    throw new DesktopLayoutPayloadError(`documents[${index}].id is required`);
  }
  if (typeof doc.title !== "string") {
    throw new DesktopLayoutPayloadError(
      `documents[${index}].title is required`,
    );
  }
  if (typeof doc.slug !== "string" || !doc.slug) {
    throw new DesktopLayoutPayloadError(
      `documents[${index}].slug is required`,
    );
  }
  if (typeof doc.content !== "string") {
    throw new DesktopLayoutPayloadError(
      `documents[${index}].content is required`,
    );
  }
  if (typeof doc.createdAt !== "string" || typeof doc.updatedAt !== "string") {
    throw new DesktopLayoutPayloadError(
      `documents[${index}] requires createdAt and updatedAt`,
    );
  }
  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    content: doc.content,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    ...(doc.isPublic === true ? { isPublic: true } : {}),
  };
}

/**
 * Fail-closed parse for /api/desktop/layout.
 * Rejects missing arrays, empty icons, invalid rows, or missing Documents folder
 * so a bad payload cannot wipe the Firestore FS down to Documents-only.
 */
export function parseDesktopLayoutBody(body: unknown): {
  icons: DesktopIcon[];
  documents: TextDocument[];
} {
  if (!body || typeof body !== "object") {
    throw new DesktopLayoutPayloadError("Body must be a JSON object");
  }
  const record = body as Record<string, unknown>;
  if (!Array.isArray(record.icons)) {
    throw new DesktopLayoutPayloadError("icons must be an array");
  }
  if (!Array.isArray(record.documents)) {
    throw new DesktopLayoutPayloadError("documents must be an array");
  }
  if (record.icons.length === 0) {
    throw new DesktopLayoutPayloadError("icons must not be empty");
  }

  const icons = record.icons.map((item, index) => parseIcon(item, index));
  const documents = record.documents.map((item, index) =>
    parseDocument(item, index),
  );

  const hasDocumentsFolder = icons.some(
    (icon) => icon.id === DOCUMENTS_FOLDER_ID && icon.type === "folder",
  );
  if (!hasDocumentsFolder) {
    throw new DesktopLayoutPayloadError(
      "icons must include the Documents folder",
    );
  }

  return { icons, documents };
}
