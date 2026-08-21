import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartMenu } from "@/components/desktop/StartMenu";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("StartMenu", () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<StartMenu />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens Notepad from the local menu", async () => {
    const user = userEvent.setup();
    useDesktopStore.setState({ isStartMenuOpen: true });
    render(<StartMenu />);

    await user.click(screen.getByRole("menuitem", { name: /Notepad/i }));
    expect(
      useDesktopStore.getState().windows.some(
        (window) => window.iconId === "notepad" && window.isOpen,
      ),
    ).toBe(true);
    expect(useDesktopStore.getState().isStartMenuOpen).toBe(false);
  });

  it("opens Guest Book from the local menu", async () => {
    const user = userEvent.setup();
    useDesktopStore.setState({ isStartMenuOpen: true });
    render(<StartMenu />);

    await user.click(screen.getByRole("menuitem", { name: /Guest Book/i }));
    expect(
      useDesktopStore.getState().windows.some(
        (window) =>
          window.iconId === "guestbook" &&
          window.type === "guestbook" &&
          window.isOpen,
      ),
    ).toBe(true);
  });

  it("offers Go Home while visiting remotely", async () => {
    const user = userEvent.setup();
    useDesktopStore.getState().visitRemotePc("maya");
    useDesktopStore.setState({ isStartMenuOpen: true });
    render(<StartMenu />);

    await user.click(screen.getByRole("menuitem", { name: /Go Home/i }));
    expect(useDesktopStore.getState().viewMode).toBe("local");
  });
});
