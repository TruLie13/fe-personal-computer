import {
  DEFAULT_ICONS,
  MAX_TEXT_FILES_PER_USER,
} from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";
import type { DesktopIcon, TextDocument } from "@/types/desktop";

export function buildTextFileSeed(count: number): {
  documents: TextDocument[];
  icons: DesktopIcon[];
} {
  const now = new Date().toISOString();
  const documents = Array.from({ length: count }, (_, index) => ({
    id: `seed-doc-${index}`,
    title: `seed-file-${index}`,
    slug: `seed-file-${index}`,
    content: "",
    createdAt: now,
    updatedAt: now,
  }));
  const icons = documents.map((document, index) => ({
    id: `file-${document.id}`,
    label: document.title,
    type: "text" as const,
    x: 200 + (index % 5) * 88,
    y: 16 + Math.floor(index / 5) * 96,
    documentId: document.id,
    parentId: null,
  }));
  return { documents, icons };
}

export function seedTextFilesInStore(
  count = MAX_TEXT_FILES_PER_USER,
): void {
  const { documents, icons } = buildTextFileSeed(count);
  useDesktopStore.setState({
    documents,
    icons: [...DEFAULT_ICONS, ...icons],
  });
}
