import type { DesktopStore } from "@/store/desktopStoreTypes";

/** Keep primary `selectedIconId` and multi-select list in sync. */
export function selectionFromIds(
  ids: ReadonlyArray<string>,
): Pick<DesktopStore, "selectedIconId" | "selectedIconIds"> {
  const selectedIconIds = [...ids];
  return {
    selectedIconIds,
    selectedIconId:
      selectedIconIds.length > 0
        ? selectedIconIds[selectedIconIds.length - 1]!
        : null,
  };
}

export function selectionFromIcon(
  iconId: string | null,
): Pick<DesktopStore, "selectedIconId" | "selectedIconIds"> {
  return selectionFromIds(iconId ? [iconId] : []);
}
