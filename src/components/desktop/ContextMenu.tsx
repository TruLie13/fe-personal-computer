"use client";

import { useEffect, useRef, useState } from "react";

export interface ContextMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  submenu?: ContextMenuItem[];
  onSelect?: () => void;
}

export interface ContextMenuSeparator {
  id: string;
  separator: true;
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

interface ContextMenuProps {
  x: number;
  y: number;
  entries: ContextMenuEntry[];
  onClose: () => void;
}

function isSeparator(entry: ContextMenuEntry): entry is ContextMenuSeparator {
  return "separator" in entry && entry.separator;
}

export function ContextMenu({ x, y, entries, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) {
      return;
    }
    const rect = menu.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - rect.width - 4);
    const top = Math.min(y, window.innerHeight - rect.height - 4);
    setPosition({
      left: Math.max(0, left),
      top: Math.max(0, top),
    });
  }, [x, y, entries]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="win-menu win-raised fixed z-[30000] min-w-[160px]"
      style={{ left: position.left, top: position.top }}
      role="menu"
      onContextMenu={(event) => event.preventDefault()}
    >
      {entries.map((entry) => {
        if (isSeparator(entry)) {
          return <div key={entry.id} className="win-menu-separator" />;
        }

        const hasSubmenu = Boolean(entry.submenu?.length);
        const submenuOpen = openSubmenuId === entry.id;

        return (
          <div
            key={entry.id}
            className="relative"
            onMouseEnter={() => {
              if (hasSubmenu && !entry.disabled) {
                setOpenSubmenuId(entry.id);
              } else {
                setOpenSubmenuId(null);
              }
            }}
          >
            <button
              type="button"
              role="menuitem"
              className="win-menu-item justify-between"
              disabled={entry.disabled}
              onClick={() => {
                if (entry.disabled) {
                  return;
                }
                if (hasSubmenu) {
                  setOpenSubmenuId(entry.id);
                  return;
                }
                entry.onSelect?.();
                onClose();
              }}
            >
              <span>{entry.label}</span>
              {hasSubmenu ? <span aria-hidden="true">▸</span> : null}
            </button>

            {hasSubmenu && submenuOpen && entry.submenu ? (
              <div className="win-menu win-raised absolute top-0 left-full z-[30001] ml-[-2px] min-w-[140px]">
                {entry.submenu.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    role="menuitem"
                    className="win-menu-item"
                    disabled={sub.disabled}
                    onClick={() => {
                      if (sub.disabled) {
                        return;
                      }
                      sub.onSelect?.();
                      onClose();
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
