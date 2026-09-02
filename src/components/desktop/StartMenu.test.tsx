import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartMenu } from "@/components/desktop/StartMenu";
import { markMockSignedIn } from "@/lib/ownPc";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("StartMenu", () => {
  beforeEach(() => {
    push.mockClear();
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

  it("offers guest chrome while visiting without a PC", () => {
    useDesktopStore.getState().visitRemotePc("maya");
    useDesktopStore.setState({ isStartMenuOpen: true });
    render(<StartMenu />);

    expect(screen.getByRole("menuitem", { name: /Get your PC/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Go Home/i })).not.toBeInTheDocument();
  });

  it("offers Go Home while visiting when the user already has a PC", async () => {
    const user = userEvent.setup();
    markMockSignedIn();
    useDesktopStore.getState().visitRemotePc("maya");
    useDesktopStore.setState({ isStartMenuOpen: true });
    render(<StartMenu />);

    await user.click(screen.getByRole("menuitem", { name: /Go Home/i }));
    expect(useDesktopStore.getState().viewMode).toBe("local");
  });

  it("offers Sign out on the local menu", async () => {
    const user = userEvent.setup();
    useDesktopStore.setState({ isStartMenuOpen: true });
    render(<StartMenu />);

    expect(screen.getByRole("menuitem", { name: /Sign out/i })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: /Sign out/i }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("clears stub access when signing out with a PC", async () => {
    const user = userEvent.setup();
    markMockSignedIn();
    useDesktopStore.setState({ isStartMenuOpen: true });
    render(<StartMenu />);

    await user.click(screen.getByRole("menuitem", { name: /Sign out/i }));
    expect(push).toHaveBeenCalledWith("/");
    const { hasOwnPc } = await import("@/lib/ownPc");
    expect(hasOwnPc()).toBe(false);
  });
});
