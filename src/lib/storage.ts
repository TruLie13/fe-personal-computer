import type {
  DesktopIcon,
  DesktopPersistedState,
  TextDocument,
} from "@/types/desktop";

export const STORAGE_KEY = "personal-computer-desktop-v2";

/** Desktop grid pitch — leaves room for 2-line labels like "Network Neighborhood". */
export const ICON_SLOT_WIDTH = 88;
export const ICON_SLOT_HEIGHT = 96;

export const DEFAULT_ICONS: DesktopIcon[] = [
  { id: "my-computer", label: "My Computer", type: "system", x: 16, y: 16 },
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

  for (const app of DEFAULT_ICONS) {
    const existing = byId.get(app.id);
    if (!existing) {
      const occupied = Array.from(byId.values())
        .filter(isOnDesktop)
        .map((icon) => ({ x: icon.x, y: icon.y }));
      const slot = findOpenDesktopSlot(occupied, { x: app.x, y: app.y });
      byId.set(app.id, { ...app, x: slot.x, y: slot.y });
      continue;
    }
    byId.set(app.id, {
      ...existing,
      type: app.type,
      label: existing.label || app.label,
      parentId: null,
    });
  }

  const merged = Array.from(byId.values()).filter((icon) => {
    if (icon.id === "readme" && !icon.documentId) {
      return false;
    }
    return true;
  });

  return merged;
}

export function nextDesktopIconPosition(
  icons: DesktopIcon[],
  kind: "file" | "folder" = "file",
): { x: number; y: number } {
  const placed = icons.filter((icon) => {
    if (!isOnDesktop(icon)) {
      return false;
    }
    if (kind === "file") {
      return Boolean(icon.documentId);
    }
    return icon.type === "folder" && !APP_ICON_IDS.has(icon.id);
  });
  const index = placed.length;
  return {
    x: 104 + (index % 4) * ICON_SLOT_WIDTH,
    y: 16 + Math.floor(index / 4) * ICON_SLOT_HEIGHT,
  };
}

/** @deprecated use nextDesktopIconPosition */
export function nextDocumentIconPosition(icons: DesktopIcon[]): {
  x: number;
  y: number;
} {
  return nextDesktopIconPosition(icons, "file");
}

export function uniqueFolderName(icons: DesktopIcon[], base = "New Folder"): string {
  const names = new Set(
    icons.filter((icon) => icon.type === "folder").map((icon) => icon.label),
  );
  if (!names.has(base)) {
    return base;
  }
  let n = 2;
  while (names.has(`${base} (${n})`)) {
    n += 1;
  }
  return `${base} (${n})`;
}

function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : fallback;
}

export function loadDesktopState(): DesktopPersistedState {
  if (typeof window === "undefined") {
    return {
      icons: DEFAULT_ICONS,
      documents: DEFAULT_DOCUMENTS,
      wallpaper: DEFAULT_WALLPAPER,
      titleBarColor: DEFAULT_TITLE_BAR_COLOR,
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
      documents: Array.isArray(parsed.documents)
        ? parsed.documents
        : DEFAULT_DOCUMENTS,
      wallpaper: normalizeHexColor(parsed.wallpaper, DEFAULT_WALLPAPER),
      titleBarColor: normalizeHexColor(
        parsed.titleBarColor,
        DEFAULT_TITLE_BAR_COLOR,
      ),
    };
  } catch {
    return {
      icons: DEFAULT_ICONS,
      documents: DEFAULT_DOCUMENTS,
      wallpaper: DEFAULT_WALLPAPER,
      titleBarColor: DEFAULT_TITLE_BAR_COLOR,
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
