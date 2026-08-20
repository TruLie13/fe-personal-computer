"use client";

import { useCallback, useRef, useState } from "react";
import {
  MARQUEE_DRAG_THRESHOLD_PX,
  normalizeRect,
  pastMarqueeThreshold,
  rectsIntersect,
  type ClientRectLike,
} from "@/lib/marquee";

export interface MarqueeState {
  left: number;
  top: number;
  width: number;
  height: number;
}

function iconClientRect(element: Element): ClientRectLike {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  };
}

/**
 * Rubber-band (dotted rectangle) selection on the desktop surface.
 * Ignores presses that start on icons or windows (those stopPropagation).
 */
export function useDesktopMarquee(options: {
  enabled: boolean;
  onClearSelection: () => void;
  onSelectIds: (ids: string[]) => void;
  onCloseMenus: () => void;
}) {
  const { enabled, onClearSelection, onSelectIds, onCloseMenus } = options;
  const [marquee, setMarquee] = useState<MarqueeState | null>(null);
  const drag = useRef<{
    pointerId: number;
    originClient: { x: number; y: number };
    originLocal: { x: number; y: number };
    active: boolean;
  } | null>(null);

  const collectHits = useCallback(
    (desktop: HTMLElement, clientRect: ClientRectLike) => {
      const nodes = desktop.querySelectorAll<HTMLElement>(".win-desktop-icon");
      const ids: string[] = [];
      for (const node of nodes) {
        if (!rectsIntersect(clientRect, iconClientRect(node))) {
          continue;
        }
        const iconId = node.dataset.iconId;
        if (iconId) {
          ids.push(iconId);
        }
      }
      return ids;
    },
    [],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0) {
        return;
      }
      const target = event.target as HTMLElement;
      if (
        target.closest(".win-desktop-icon") ||
        target.closest(".win-window") ||
        target.closest("[data-context-menu]")
      ) {
        return;
      }

      const desktop = event.currentTarget;
      const rect = desktop.getBoundingClientRect();
      drag.current = {
        pointerId: event.pointerId,
        originClient: { x: event.clientX, y: event.clientY },
        originLocal: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        },
        active: false,
      };
      onCloseMenus();
      desktop.setPointerCapture(event.pointerId);
    },
    [enabled, onCloseMenus],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const session = drag.current;
      if (!session || session.pointerId !== event.pointerId) {
        return;
      }

      const desktop = event.currentTarget;
      const bounds = desktop.getBoundingClientRect();
      const currentClient = { x: event.clientX, y: event.clientY };
      const currentLocal = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };

      if (!session.active) {
        if (
          !pastMarqueeThreshold(
            session.originClient,
            currentClient,
            MARQUEE_DRAG_THRESHOLD_PX,
          )
        ) {
          return;
        }
        session.active = true;
        onClearSelection();
      }

      const local = normalizeRect(session.originLocal, currentLocal);
      setMarquee({
        left: local.left,
        top: local.top,
        width: local.right - local.left,
        height: local.bottom - local.top,
      });

      const client = normalizeRect(session.originClient, currentClient);
      onSelectIds(collectHits(desktop, client));
    },
    [collectHits, onClearSelection, onSelectIds],
  );

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const session = drag.current;
      if (!session || session.pointerId !== event.pointerId) {
        return;
      }
      drag.current = null;
      setMarquee(null);

      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Already released
      }

      if (!session.active) {
        onClearSelection();
      }
    },
    [onClearSelection],
  );

  return {
    marquee,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}
