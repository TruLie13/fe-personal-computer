/**
 * @jest-environment jsdom
 */
import {
  clearDropTargetHighlight,
  DESKTOP_ATTR,
  DROP_ATTR,
  DROP_ACTIVE_CLASS,
  resolveFileDropTarget,
  resolveFolderDropTarget,
  setDropTargetHighlight,
} from "@/lib/dragDrop";

function attachDesktop(): HTMLElement {
  const desktop = document.createElement("main");
  desktop.setAttribute(DESKTOP_ATTR, "true");
  desktop.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  Object.defineProperty(desktop, "clientWidth", { value: 800 });
  Object.defineProperty(desktop, "clientHeight", { value: 600 });
  document.body.appendChild(desktop);
  return desktop;
}

describe("dragDrop", () => {
  afterEach(() => {
    clearDropTargetHighlight();
    document.body.innerHTML = "";
  });

  it("resolves a folder drop target under the pointer", () => {
    const folder = document.createElement("div");
    folder.setAttribute(DROP_ATTR, "documents");
    document.body.appendChild(folder);

    const drag = document.createElement("button");
    document.body.appendChild(drag);

    document.elementFromPoint = () => folder;

    const resolved = resolveFolderDropTarget(10, 10, drag);
    expect(resolved?.folderId).toBe("documents");
    expect(resolved?.element).toBe(folder);
  });

  it("resolves a desktop drop when not over a window", () => {
    const desktop = attachDesktop();
    const drag = document.createElement("button");
    document.body.appendChild(drag);
    document.elementFromPoint = () => desktop;

    const resolved = resolveFileDropTarget(120, 80, drag, {
      excludeFolderId: "documents",
    });
    expect(resolved?.kind).toBe("desktop");
    if (resolved?.kind === "desktop") {
      expect(resolved.x).toBe(82);
      expect(resolved.y).toBe(60);
    }
  });

  it("treats the excluded source folder as a desktop drop so files can leave", () => {
    const desktop = attachDesktop();
    const windowEl = document.createElement("div");
    windowEl.className = "win-window";
    desktop.appendChild(windowEl);

    const folder = document.createElement("div");
    folder.setAttribute(DROP_ATTR, "documents");
    windowEl.appendChild(folder);

    const drag = document.createElement("button");
    document.body.appendChild(drag);
    document.elementFromPoint = () => folder;

    const resolved = resolveFileDropTarget(120, 80, drag, {
      excludeFolderId: "documents",
    });
    expect(resolved?.kind).toBe("desktop");
    if (resolved?.kind === "desktop") {
      expect(resolved.element).toBe(desktop);
    }
  });

  it("still blocks drops over unrelated windows", () => {
    const desktop = attachDesktop();
    const otherWindow = document.createElement("div");
    otherWindow.className = "win-window";
    desktop.appendChild(otherWindow);

    const drag = document.createElement("button");
    document.body.appendChild(drag);
    document.elementFromPoint = () => otherWindow;

    expect(
      resolveFileDropTarget(10, 10, drag, { excludeFolderId: "documents" }),
    ).toBeNull();
  });

  it("returns null when nothing is under the pointer", () => {
    const drag = document.createElement("button");
    document.body.appendChild(drag);
    document.elementFromPoint = () => null;

    expect(resolveFolderDropTarget(10, 10, drag)).toBeNull();
  });

  it("toggles the active drop highlight class", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    setDropTargetHighlight(el);
    expect(el.classList.contains(DROP_ACTIVE_CLASS)).toBe(true);
    clearDropTargetHighlight();
    expect(el.classList.contains(DROP_ACTIVE_CLASS)).toBe(false);
  });
});
