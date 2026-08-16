"use client";

import {
  TITLE_BAR_PRESETS,
  WALLPAPER_PRESETS,
} from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";

function ColorSwatches({
  label,
  presets,
  value,
  onChange,
}: {
  label: string;
  presets: ReadonlyArray<{ label: string; color: string }>;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="px-1 text-[12px] font-bold">{label}</legend>
      <div className="win-sunken mt-1 bg-win-paper p-2 text-win-ink">
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const selected = value.toLowerCase() === preset.color.toLowerCase();
            return (
              <button
                key={preset.color}
                type="button"
                title={preset.label}
                aria-label={preset.label}
                aria-pressed={selected}
                className={`h-6 w-6 border border-win-black ${
                  selected ? "outline outline-1 outline-offset-1 outline-win-black" : ""
                }`}
                style={{ background: preset.color }}
                onClick={() => onChange(preset.color)}
              />
            );
          })}
        </div>
        <label className="mt-2 flex items-center gap-2 text-[12px]">
          <span>Custom:</span>
          <input
            type="color"
            className="h-6 w-10 cursor-default border border-win-black bg-win-face p-0"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <span className="font-mono uppercase">{value}</span>
        </label>
      </div>
    </fieldset>
  );
}

export function DisplayProperties() {
  const wallpaper = useDesktopStore((state) => state.wallpaper);
  const titleBarColor = useDesktopStore((state) => state.titleBarColor);
  const contentDark = useDesktopStore((state) => state.contentDark);
  const setWallpaper = useDesktopStore((state) => state.setWallpaper);
  const setTitleBarColor = useDesktopStore((state) => state.setTitleBarColor);
  const setContentDark = useDesktopStore((state) => state.setContentDark);
  const resetTheme = useDesktopStore((state) => state.resetTheme);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 bg-win-face p-3">
      <p className="text-[12px] leading-5">
        Change your desktop wallpaper, window title bar, and content colors.
        Settings are saved on this computer.
      </p>

      <div className="win-sunken bg-win-paper p-2 text-win-ink">
        <div className="text-[11px] font-bold">Preview</div>
        <div
          className="win-sunken relative mt-1 h-24 overflow-hidden"
          style={{ background: wallpaper }}
        >
          <div
            className="win-window absolute top-3 left-3 h-14 w-36 p-[2px]"
            style={{ background: "#c0c0c0" }}
          >
            <div
              className="flex h-[16px] items-center px-1 text-[10px] font-bold text-white"
              style={{ background: titleBarColor }}
            >
              Untitled
            </div>
            <div
              className="p-1 text-[10px]"
              style={{
                background: contentDark ? "#121212" : "#ffffff",
                color: contentDark ? "#f5f5f5" : "#808080",
              }}
            >
              Sample window
            </div>
          </div>
        </div>
      </div>

      <ColorSwatches
        label="Wallpaper"
        presets={WALLPAPER_PRESETS}
        value={wallpaper}
        onChange={setWallpaper}
      />

      <ColorSwatches
        label="Window title bar"
        presets={TITLE_BAR_PRESETS}
        value={titleBarColor}
        onChange={setTitleBarColor}
      />

      <fieldset className="min-w-0">
        <legend className="px-1 text-[12px] font-bold">Appearance</legend>
        <div className="win-sunken mt-1 bg-win-paper p-2 text-win-ink">
          <label className="flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-win-navy"
              checked={contentDark}
              onChange={(event) => setContentDark(event.target.checked)}
            />
            <span>Dark mode (app / folder / file content)</span>
          </label>
          <p className="mt-1 text-[11px] text-win-paper-muted">
            Near-black writing surfaces with light text on your PC and when
            visiting others. Window chrome stays classic grey.
          </p>
        </div>
      </fieldset>

      <div className="mt-auto flex justify-end gap-2">
        <button
          type="button"
          className="win-raised px-3 py-1"
          onClick={resetTheme}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
