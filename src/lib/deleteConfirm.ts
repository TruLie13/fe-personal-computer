import {
  canDeleteIcon,
  countFolderChildren,
} from "@/lib/storage";
import type { DesktopIcon } from "@/types/desktop";

export function buildDeleteConfirmMessage(
  icon: DesktopIcon,
  icons: DesktopIcon[],
): { title: string; message: string } {
  if (icon.type === "folder") {
    const childCount = countFolderChildren(icons, icon.id);
    if (childCount > 0) {
      return {
        title: "Confirm Folder Delete",
        message: `The folder "${icon.label}" contains ${childCount} ${
          childCount === 1 ? "item" : "items"
        }. Are you sure you want to remove the folder and everything in it?`,
      };
    }
    return {
      title: "Confirm Folder Delete",
      message: `Are you sure you want to delete the folder "${icon.label}"?`,
    };
  }

  return {
    title: "Confirm File Delete",
    message: `Are you sure you want to delete "${icon.label}"?`,
  };
}

export { canDeleteIcon };
