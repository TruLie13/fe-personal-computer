import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WindowFrame } from "@/components/desktop/WindowFrame";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("WindowFrame", () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it("renders an open window and closes it", async () => {
    const user = userEvent.setup();
    useDesktopStore.getState().openWindow("notepad");
    const win = useDesktopStore.getState().windows[0]!;

    render(<WindowFrame window={win} />);

    expect(
      screen.getByRole("dialog", { name: /Notepad/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(useDesktopStore.getState().windows[0]?.isOpen).toBe(false);
  });

  it("minimizes an open window", async () => {
    const user = userEvent.setup();
    useDesktopStore.getState().openWindow("bulletin-board");
    const win = useDesktopStore.getState().windows[0]!;

    const { rerender } = render(<WindowFrame window={win} />);
    await user.click(screen.getByRole("button", { name: "Minimize" }));

    const minimized = useDesktopStore.getState().windows[0]!;
    expect(minimized.isMinimized).toBe(true);
    rerender(<WindowFrame window={minimized} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("returns null when the window is closed", () => {
    useDesktopStore.getState().openWindow("notepad");
    const win = useDesktopStore.getState().windows[0]!;
    useDesktopStore.getState().closeWindow(win.id);
    const closed = useDesktopStore.getState().windows[0]!;

    const { container } = render(<WindowFrame window={closed} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the Guest Book wall body", () => {
    useDesktopStore.getState().openWindow("guestbook");
    const win = useDesktopStore.getState().windows[0]!;
    const { container } = render(<WindowFrame window={win} />);

    expect(
      screen.getByRole("dialog", { name: /Guest Book/i }),
    ).toBeInTheDocument();
    expect(container.querySelector(".win-guestbook-wall")).toBeTruthy();
    expect(
      screen.getByText(/Your book — visitors sign when they Visit PC/i),
    ).toBeInTheDocument();
  });
});
