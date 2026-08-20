import {
  clampFileTitle,
  clampTextFileContent,
} from "@/lib/storage";

export const NOTEPAD_DRAFTS_STORAGE_KEY =
  "personal-computer-notepad-drafts-v1";

export interface NotepadDraft {
  windowId: string;
  documentId: string | null;
  title: string;
  content: string;
  updatedAt: string;
}

type DraftMap = Record<string, NotepadDraft>;

function docKey(documentId: string): string {
  return `doc:${documentId}`;
}

function untitledKey(windowId: string): string {
  return `untitled:${windowId}`;
}

export function draftStorageKey(
  windowId: string,
  documentId: string | null,
): string {
  return documentId ? docKey(documentId) : untitledKey(windowId);
}

function readMap(): DraftMap {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(NOTEPAD_DRAFTS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const result: DraftMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!isNotepadDraft(value)) {
        continue;
      }
      result[key] = {
        ...value,
        title: clampFileTitle(value.title),
        content: clampTextFileContent(value.content),
      };
    }
    return result;
  } catch {
    return {};
  }
}

function writeMap(map: DraftMap): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      NOTEPAD_DRAFTS_STORAGE_KEY,
      JSON.stringify(map),
    );
  } catch {
    // Quota / private mode — ignore
  }
}

function isNotepadDraft(value: unknown): value is NotepadDraft {
  if (!value || typeof value !== "object") {
    return false;
  }
  const draft = value as NotepadDraft;
  return (
    typeof draft.windowId === "string" &&
    (draft.documentId === null || typeof draft.documentId === "string") &&
    typeof draft.title === "string" &&
    typeof draft.content === "string" &&
    typeof draft.updatedAt === "string"
  );
}

export function loadNotepadDraft(
  windowId: string,
  documentId: string | null,
): NotepadDraft | null {
  const map = readMap();
  return map[draftStorageKey(windowId, documentId)] ?? null;
}

/**
 * After a refresh, untitled window ids are gone. Claim the newest *orphaned*
 * untitled draft for a newly opened blank Notepad and re-key it to `windowId`.
 */
export function claimLatestUntitledDraft(
  windowId: string,
  openUntitledWindowIds: ReadonlyArray<string> = [],
): NotepadDraft | null {
  const map = readMap();
  const existing = map[untitledKey(windowId)];
  if (existing) {
    return existing;
  }

  const liveKeys = new Set(
    openUntitledWindowIds.map((id) => untitledKey(id)),
  );

  const orphans = Object.entries(map)
    .filter(
      ([key]) => key.startsWith("untitled:") && !liveKeys.has(key),
    )
    .map(([key, draft]) => ({ key, draft }))
    .sort((a, b) =>
      b.draft.updatedAt.localeCompare(a.draft.updatedAt),
    );

  const latest = orphans[0];
  if (!latest) {
    return null;
  }

  delete map[latest.key];

  const claimed: NotepadDraft = {
    ...latest.draft,
    windowId,
    documentId: null,
    title: clampFileTitle(latest.draft.title),
    content: clampTextFileContent(latest.draft.content),
    updatedAt: new Date().toISOString(),
  };
  map[untitledKey(windowId)] = claimed;
  writeMap(map);
  return claimed;
}

export function saveNotepadDraft(input: {
  windowId: string;
  documentId: string | null;
  title: string;
  content: string;
}): void {
  const map = readMap();
  const key = draftStorageKey(input.windowId, input.documentId);
  map[key] = {
    windowId: input.windowId,
    documentId: input.documentId,
    title: clampFileTitle(input.title),
    content: clampTextFileContent(input.content),
    updatedAt: new Date().toISOString(),
  };

  if (input.documentId) {
    delete map[untitledKey(input.windowId)];
  }

  writeMap(map);
}

export function clearNotepadDraft(
  windowId: string,
  documentId: string | null,
): void {
  const map = readMap();
  delete map[draftStorageKey(windowId, documentId)];
  delete map[untitledKey(windowId)];
  if (documentId) {
    delete map[docKey(documentId)];
  }
  writeMap(map);
}

export function resolveNotepadDraft(
  windowId: string,
  documentId: string | null,
  openUntitledWindowIds: ReadonlyArray<string> = [],
): NotepadDraft | null {
  if (documentId) {
    return loadNotepadDraft(windowId, documentId);
  }
  return (
    loadNotepadDraft(windowId, null) ??
    claimLatestUntitledDraft(windowId, openUntitledWindowIds)
  );
}
