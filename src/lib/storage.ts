import type {
  DesktopIcon,
  DesktopPersistedState,
  TextDocument,
} from "@/types/desktop";

export const STORAGE_KEY = "personal-computer-desktop-v2";

export const DEFAULT_ICONS: DesktopIcon[] = [
  { id: "my-computer", label: "My Computer", type: "system", x: 16, y: 16 },
  { id: "documents", label: "Documents", type: "folder", x: 16, y: 96 },
  { id: "notepad", label: "Notepad", type: "editor", x: 16, y: 176 },
  {
    id: "display-properties",
    label: "Display",
    type: "display",
    x: 16,
    y: 256,
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

export function mergeAppIcons(icons: DesktopIcon[]): DesktopIcon[] {
  const byId = new Map(icons.map((icon) => [icon.id, icon]));

  for (const app of DEFAULT_ICONS) {
    const existing = byId.get(app.id);
    if (!existing) {
      byId.set(app.id, app);
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
    x: 100 + (index % 4) * 84,
    y: 16 + Math.floor(index / 4) * 80,
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
