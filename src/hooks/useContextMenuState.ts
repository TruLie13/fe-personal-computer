import { useCallback, useState } from "react";
import type { ContextMenuEntry } from "@/components/desktop/ContextMenu";

export interface ContextMenuState {
  x: number;
  y: number;
  entries: ContextMenuEntry[];
}

export function useContextMenuState() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenu = useCallback(
    (event: { clientX: number; clientY: number }, entries: ContextMenuEntry[]) => {
      setMenu({
        x: event.clientX,
        y: event.clientY,
        entries,
      });
    },
    [],
  );

  return { menu, openMenu, closeMenu, setMenu };
}
