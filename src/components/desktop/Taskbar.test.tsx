import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Taskbar } from "@/components/desktop/Taskbar";
import { markMockSignedIn } from "@/lib/ownPc";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("Taskbar", () => {
  beforeEach(() => {
    push.mockClear();
    resetDesktopStore();
  });

  it("toggles the Start menu", async () => {
    const user = userEvent.setup();
    render(<Taskbar />);

    await user.click(screen.getByRole("button", { name: /Start/i }));
    expect(useDesktopStore.getState().isStartMenuOpen).toBe(true);
    expect(screen.getByRole("menu", { name: "Start" })).toBeInTheDocument();
  });

  it("shows guest chrome while visiting without a PC", () => {
    useDesktopStore.getState().visitRemotePc("maya");
    render(<Taskbar />);

    expect(screen.getByRole("button", { name: /Get your PC/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Go Home/i })).not.toBeInTheDocument();
  });

  it("shows Go Home while visiting when the user already has a PC", async () => {
    const user = userEvent.setup();
    markMockSignedIn();
    useDesktopStore.getState().visitRemotePc("maya");
    render(<Taskbar />);

    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Get your PC/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Go Home/i }));
    expect(useDesktopStore.getState().viewMode).toBe("local");
  });

  it("focuses a task button for an open window", async () => {
    const user = userEvent.setup();
    useDesktopStore.getState().openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]!.id;
    useDesktopStore.getState().minimizeWindow(windowId);

    render(<Taskbar />);
    await user.click(screen.getByRole("button", { name: /Untitled - Notepad/i }));
    expect(useDesktopStore.getState().windows[0]?.isMinimized).toBe(false);
    expect(useDesktopStore.getState().windows[0]?.isFocused).toBe(true);
  });

  it("closes a window from the task button context menu", async () => {
    const user = userEvent.setup();
    useDesktopStore.getState().openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]!.id;

    render(<Taskbar />);
    await user.pointer({
      keys: "[MouseRight]",
      target: screen.getByRole("button", { name: /Untitled - Notepad/i }),
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Untitled - Notepad" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("menuitem", { name: "Close" }));

    expect(
      useDesktopStore.getState().windows.find((window) => window.id === windowId)
        ?.isOpen,
    ).toBe(false);
  });
});
