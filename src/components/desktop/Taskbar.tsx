"use client";

import { Clock } from "@/components/desktop/Clock";
import { StartLogo, iconForType } from "@/components/desktop/icons";
import { StartMenu } from "@/components/desktop/StartMenu";
import { useDesktopStore } from "@/store/desktopStore";

export function Taskbar() {
  const windows = useDesktopStore((state) => state.windows);
  const isStartMenuOpen = useDesktopStore((state) => state.isStartMenuOpen);
  const toggleStartMenu = useDesktopStore((state) => state.toggleStartMenu);
  const focusWindow = useDesktopStore((state) => state.focusWindow);
  const minimizeWindow = useDesktopStore((state) => state.minimizeWindow);

  const visibleTasks = windows.filter((window) => window.isOpen);

  return (
    <footer className="win-taskbar relative z-[150]">
      <button
        type="button"
        className={`win-start-btn win-raised ${isStartMenuOpen ? "win-raised-active" : ""}`}
        onClick={toggleStartMenu}
        aria-expanded={isStartMenuOpen}
        aria-haspopup="menu"
      >
        <StartLogo />
        Start
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden px-1">
        {visibleTasks.map((window) => {
          const Icon = iconForType(window.type);
          const active = window.isFocused && !window.isMinimized;
          return (
            <button
              key={window.id}
              type="button"
              className={`win-task-btn ${active ? "win-sunken win-task-btn-active" : "win-raised"}`}
              onClick={() => {
                if (active) {
                  minimizeWindow(window.id);
                } else {
                  focusWindow(window.id);
                }
              }}
            >
              <Icon className="shrink-0" size={16} />
              <span className="truncate">{window.title}</span>
            </button>
          );
        })}
      </div>

      <Clock />
      <StartMenu />
    </footer>
  );
}
