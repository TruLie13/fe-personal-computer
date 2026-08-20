import type {
  DesktopIcon,
  DesktopPersistedState,
  TextDocument,
} from "@/types/desktop";
import { computerLabel, DEFAULT_LOCAL_PROFILE } from "@/lib/profile";
import { ensureDocumentSlugs } from "@/lib/seo/slugs";

export const STORAGE_KEY = "personal-computer-desktop-v2";

/** Desktop grid pitch — leaves room for 2-line labels like "Network Neighborhood". */
export const ICON_SLOT_WIDTH = 88;
export const ICON_SLOT_HEIGHT = 96;

export const PROFILE_ICON_ID = "profile";

/** Locked top-left slot for every user's PC identity icon. */
export const PROFILE_ICON_POSITION = { x: 16, y: 16 } as const;

export const DEFAULT_ICONS: DesktopIcon[] = [
  {
    id: PROFILE_ICON_ID,
    label: computerLabel(DEFAULT_LOCAL_PROFILE.displayName),
    type: "profile",
    x: PROFILE_ICON_POSITION.x,
    y: PROFILE_ICON_POSITION.y,
  },
  { id: "documents", label: "Documents", type: "folder", x: 16, y: 112 },
  { id: "notepad", label: "Notepad", type: "editor", x: 16, y: 208 },
  {
    id: "display-properties",
    label: "Display",
    type: "display",
    x: 16,
    y: 304,
  },
  {
    id: "bulletin-board",
    label: "Bulletin Board",
    type: "bbs",
    x: 104,
    y: 16,
  },
  {
    id: "story-explorer",
    label: "Story Explorer",
    type: "stories",
    x: 104,
    y: 112,
  },
  {
    id: "network-neighborhood",
    label: "Network Neighborhood",
    type: "network",
    x: 104,
    y: 208,
  },
];

export const DEFAULT_DOCUMENTS: TextDocument[] = [];

export const DEFAULT_WALLPAPER = "#008080";
export const DEFAULT_TITLE_BAR_COLOR = "#000080";
export const DEFAULT_CONTENT_DARK = false;
export const DEFAULT_TASKBAR_HEIGHT = 36;
export const MIN_TASKBAR_HEIGHT = 28;
export const MAX_TASKBAR_HEIGHT = 72;
export const MAX_TEXT_FILE_CHARS = 20_000;
/** Text documents only — folders are not counted. */
export const MAX_TEXT_FILES_PER_USER = 50;
/** Folder icons / FS folder nodes (includes default Documents). */
export const MAX_FOLDERS_PER_USER = 25;
/** File / folder display titles (Notepad name, rename, create). */
export const MAX_FILE_TITLE_CHARS = 120;

export function clampFileTitle(title: string): string {
  if (title.length <= MAX_FILE_TITLE_CHARS) {
    return title;
  }
  return title.slice(0, MAX_FILE_TITLE_CHARS);
}

export function countTextFiles(documents: ReadonlyArray<TextDocument>): number {
  return documents.length;
}

export function countFolders(
  icons: ReadonlyArray<{ type: string }>,
): number {
  return icons.filter((icon) => icon.type === "folder").length;
}

export function canCreateTextFile(
  documents: ReadonlyArray<TextDocument>,
): boolean {
  return countTextFiles(documents) < MAX_TEXT_FILES_PER_USER;
}

export function canCreateFolder(
  icons: ReadonlyArray<{ type: string }>,
): boolean {
  return countFolders(icons) < MAX_FOLDERS_PER_USER;
}

export function clampTextFileContent(content: string): string {
  if (content.length <= MAX_TEXT_FILE_CHARS) {
    return content;
  }
  return content.slice(0, MAX_TEXT_FILE_CHARS);
}

export function clampTaskbarHeight(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TASKBAR_HEIGHT;
  }
  return Math.min(
    MAX_TASKBAR_HEIGHT,
    Math.max(MIN_TASKBAR_HEIGHT, Math.round(value)),
  );
}

export const WALLPAPER_PRESETS: ReadonlyArray<{ label: string; color: string }> =
  [
    { label: "Teal", color: "#008080" },
    { label: "Navy", color: "#000080" },
    { label: "Sky", color: "#0080c0" },
    { label: "Purple", color: "#800080" },
    { label: "Maroon", color: "#800000" },
    { label: "Olive", color: "#808000" },
    { label: "Gray", color: "#808080" },
    { label: "Black", color: "#000000" },
  ];

export const TITLE_BAR_PRESETS: ReadonlyArray<{
  label: string;
  color: string;
}> = [
  { label: "Navy", color: "#000080" },
  { label: "Teal", color: "#008080" },
  { label: "Purple", color: "#800080" },
  { label: "Maroon", color: "#800000" },
  { label: "Green", color: "#008000" },
  { label: "Black", color: "#000000" },
];

const APP_ICON_IDS = new Set(DEFAULT_ICONS.map((icon) => icon.id));

export function isOnDesktop(icon: DesktopIcon): boolean {
  return icon.parentId == null;
}

/** Profile / "{Name}'s PC" stays pinned top-left on every PC. */
export function isPinnedProfileIcon(icon: DesktopIcon): boolean {
  return icon.type === "profile";
}

function pinProfileIcon(icon: DesktopIcon): DesktopIcon {
  if (!isPinnedProfileIcon(icon)) {
    return icon;
  }
  const needsMove =
    icon.x !== PROFILE_ICON_POSITION.x || icon.y !== PROFILE_ICON_POSITION.y;
  const needsParentClear = icon.parentId != null;
  if (!needsMove && !needsParentClear) {
    return icon;
  }
  return {
    ...icon,
    x: PROFILE_ICON_POSITION.x,
    y: PROFILE_ICON_POSITION.y,
    ...(needsParentClear ? { parentId: null } : {}),
  };
}

function iconsOverlap(
  a: { x: number; y: number },
  b: { x: number; y: number },
): boolean {
  return (
    Math.abs(a.x - b.x) < ICON_SLOT_WIDTH &&
    Math.abs(a.y - b.y) < ICON_SLOT_HEIGHT
  );
}

/** Next free desktop slot scanning down columns (Win95-ish auto arrange). */
export function findOpenDesktopSlot(
  occupied: ReadonlyArray<{ x: number; y: number }>,
  preferred?: { x: number; y: number },
): { x: number; y: number } {
  if (
    preferred &&
    !occupied.some((point) => iconsOverlap(preferred, point))
  ) {
    return preferred;
  }

  for (let col = 0; col < 8; col += 1) {
    for (let row = 0; row < 12; row += 1) {
      const candidate = {
        x: 16 + col * ICON_SLOT_WIDTH,
        y: 16 + row * ICON_SLOT_HEIGHT,
      };
      if (!occupied.some((point) => iconsOverlap(candidate, point))) {
        return candidate;
      }
    }
  }

  return preferred ?? {
    x: 16 + occupied.length * 12,
    y: 16 + occupied.length * 12,
  };
}

export function mergeAppIcons(icons: DesktopIcon[]): DesktopIcon[] {
  const byId = new Map(icons.map((icon) => [icon.id, icon]));

  // Migrate legacy My Computer → profile identity icon.
  const legacy = byId.get("my-computer");
  if (legacy && !byId.has(PROFILE_ICON_ID)) {
    byId.set(PROFILE_ICON_ID, {
      ...legacy,
      id: PROFILE_ICON_ID,
      type: "profile",
      label: computerLabel(DEFAULT_LOCAL_PROFILE.displayName),
      parentId: null,
      x: PROFILE_ICON_POSITION.x,
      y: PROFILE_ICON_POSITION.y,
    });
  }
  byId.delete("my-computer");

  for (const app of DEFAULT_ICONS) {
    const existing = byId.get(app.id);
    if (!existing) {
      const occupied = Array.from(byId.values())
        .filter(isOnDesktop)
        .map((icon) => ({ x: icon.x, y: icon.y }));
      const preferred =
        app.id === PROFILE_ICON_ID
          ? { ...PROFILE_ICON_POSITION }
          : { x: app.x, y: app.y };
      const slot = findOpenDesktopSlot(occupied, preferred);
      byId.set(
        app.id,
        pinProfileIcon({ ...app, x: slot.x, y: slot.y }),
      );
      continue;
    }
    byId.set(
      app.id,
      pinProfileIcon({
        ...existing,
        type: app.type,
        label: existing.label || app.label,
        parentId: null,
      }),
    );
  }

  const merged = Array.from(byId.values())
    .filter((icon) => {
      if (icon.id === "readme" && !icon.documentId) {
        return false;
      }
      return true;
    })
    .map(pinProfileIcon);

  return merged;
}

export function nextDesktopIconPosition(
  icons: DesktopIcon[],
  _kind: "file" | "folder" = "file",
): { x: number; y: number } {
  const occupied = icons
    .filter(isOnDesktop)
    .map((icon) => ({ x: icon.x, y: icon.y }));
  return findOpenDesktopSlot(occupied);
}

/** @deprecated use nextDesktopIconPosition */
export function nextDocumentIconPosition(icons: DesktopIcon[]): {
  x: number;
  y: number;
} {
  return nextDesktopIconPosition(icons, "file");
}

export function uniqueFolderName(
  icons: DesktopIcon[],
  base = "New Folder",
  excludeIconId?: string | null,
  parentId: string | null = null,
): string {
  const cleaned = base.trim() || "New Folder";
  const parent = parentId ?? null;
  const names = new Set(
    icons
      .filter(
        (icon) =>
          icon.type === "folder" &&
          icon.id !== excludeIconId &&
          (icon.parentId ?? null) === parent,
      )
      .map((icon) => icon.label),
  );
  if (!names.has(cleaned)) {
    return cleaned;
  }
  let n = 2;
  while (names.has(`${cleaned} (${n})`)) {
    n += 1;
  }
  return `${cleaned} (${n})`;
}

/** Win95-style path for a folder window title: `Documents\\Poems`. */
export function folderWindowTitle(
  icons: ReadonlyArray<DesktopIcon>,
  folderId: string,
): string {
  const byId = new Map(icons.map((icon) => [icon.id, icon]));
  const segments: string[] = [];
  let walk: string | null = folderId;
  const seen = new Set<string>();

  while (walk && !seen.has(walk)) {
    seen.add(walk);
    const folder = byId.get(walk);
    if (!folder || folder.type !== "folder") {
      break;
    }
    segments.unshift(folder.label);
    walk = folder.parentId ?? null;
  }

  return segments.join("\\") || "Folder";
}

export function displayWindowTitle(
  window: { type: string; title: string; iconId: string },
  icons: ReadonlyArray<DesktopIcon>,
): string {
  if (window.type === "folder") {
    return folderWindowTitle(icons, window.iconId);
  }
  return window.title;
}

/**
 * Unique text filename among siblings (same parent / desktop).
 * Collision → `name (2)`, `name (3)`, … Matching is case-insensitive.
 */
export function uniqueTextFileName(
  icons: DesktopIcon[],
  parentId: string | null | undefined,
  base: string,
  excludeIconId?: string | null,
): string {
  const cleaned = stripTextExtension(base);
  const parent = parentId ?? null;
  const taken = new Set(
    icons
      .filter(
        (icon) =>
          icon.type === "text" &&
          (icon.parentId ?? null) === parent &&
          icon.id !== excludeIconId,
      )
      .map((icon) => icon.label.toLowerCase()),
  );

  if (!taken.has(cleaned.toLowerCase())) {
    return cleaned;
  }

  let n = 2;
  while (taken.has(`${cleaned} (${n})`.toLowerCase())) {
    n += 1;
  }
  return `${cleaned} (${n})`;
}

function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeTaskbarHeight(value: unknown): number {
  return typeof value === "number"
    ? clampTaskbarHeight(value)
    : DEFAULT_TASKBAR_HEIGHT;
}

function normalizeDocuments(value: unknown): TextDocument[] {
  if (!Array.isArray(value)) {
    return DEFAULT_DOCUMENTS;
  }
  const raw = value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const doc = item as Partial<TextDocument>;
    if (
      typeof doc.id !== "string" ||
      typeof doc.title !== "string" ||
      typeof doc.content !== "string" ||
      typeof doc.createdAt !== "string" ||
      typeof doc.updatedAt !== "string"
    ) {
      return [];
    }
    return [
      {
        id: doc.id,
        title: doc.title,
        content: clampTextFileContent(doc.content),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        slug: typeof doc.slug === "string" ? doc.slug : undefined,
      },
    ];
  });
  return ensureDocumentSlugs(raw);
}

export function loadDesktopState(): DesktopPersistedState {
  if (typeof window === "undefined") {
    return {
      icons: DEFAULT_ICONS,
      documents: DEFAULT_DOCUMENTS,
      wallpaper: DEFAULT_WALLPAPER,
      titleBarColor: DEFAULT_TITLE_BAR_COLOR,
      contentDark: DEFAULT_CONTENT_DARK,
      taskbarHeight: DEFAULT_TASKBAR_HEIGHT,
    };
  }

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem("personal-computer-desktop-v1");
    if (!raw) {
      return {
        icons: DEFAULT_ICONS,
        documents: DEFAULT_DOCUMENTS,
        wallpaper: DEFAULT_WALLPAPER,
        titleBarColor: DEFAULT_TITLE_BAR_COLOR,
        contentDark: DEFAULT_CONTENT_DARK,
        taskbarHeight: DEFAULT_TASKBAR_HEIGHT,
      };
    }

    const parsed = JSON.parse(raw) as Partial<DesktopPersistedState> & {
      icons?: DesktopIcon[];
    };

    return {
      icons: mergeAppIcons(
        Array.isArray(parsed.icons) && parsed.icons.length > 0
          ? parsed.icons
          : DEFAULT_ICONS,
      ),
      documents: normalizeDocuments(parsed.documents),
      wallpaper: normalizeHexColor(parsed.wallpaper, DEFAULT_WALLPAPER),
      titleBarColor: normalizeHexColor(
        parsed.titleBarColor,
        DEFAULT_TITLE_BAR_COLOR,
      ),
      contentDark: normalizeBoolean(parsed.contentDark, DEFAULT_CONTENT_DARK),
      taskbarHeight: normalizeTaskbarHeight(parsed.taskbarHeight),
    };
  } catch {
    return {
      icons: DEFAULT_ICONS,
      documents: DEFAULT_DOCUMENTS,
      wallpaper: DEFAULT_WALLPAPER,
      titleBarColor: DEFAULT_TITLE_BAR_COLOR,
      contentDark: DEFAULT_CONTENT_DARK,
      taskbarHeight: DEFAULT_TASKBAR_HEIGHT,
    };
  }
}

export function saveDesktopState(state: DesktopPersistedState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isAppIcon(iconId: string): boolean {
  return APP_ICON_IDS.has(iconId);
}

/** User-created folders and text files can be deleted; default apps cannot. */
export function canDeleteIcon(icon: DesktopIcon): boolean {
  if (isAppIcon(icon.id)) {
    return false;
  }
  return icon.type === "folder" || icon.type === "text";
}

export function countFolderChildren(
  icons: DesktopIcon[],
  folderId: string,
): number {
  return icons.filter((icon) => icon.parentId === folderId).length;
}

/** Display/storage name without a trailing .txt extension. */
export function stripTextExtension(name: string): string {
  return name.replace(/\.txt$/i, "").trim() || "Untitled";
}
