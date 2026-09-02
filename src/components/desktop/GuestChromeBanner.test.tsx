import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuestChromeBanner } from "@/components/desktop/GuestChromeBanner";
import { markMockSignedIn } from "@/lib/ownPc";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("GuestChromeBanner", () => {
  beforeEach(() => {
    push.mockClear();
    resetDesktopStore();
  });

  it("shows setup and sign-in prompts while visiting without a PC", () => {
    useDesktopStore.getState().visitRemotePc("maya");
    render(<GuestChromeBanner />);

    expect(screen.getByRole("status")).toHaveTextContent(/visiting as a guest/i);
    expect(
      screen.getByRole("button", { name: /get your pc/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /go home/i }),
    ).not.toBeInTheDocument();
  });

  it("hides on the local desktop", () => {
    render(<GuestChromeBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("hides when the visitor already has a PC", () => {
    markMockSignedIn();
    useDesktopStore.getState().visitRemotePc("maya");
    render(<GuestChromeBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("routes guests to setup and sign-in", async () => {
    const user = userEvent.setup();
    useDesktopStore.getState().visitRemotePc("maya");
    render(<GuestChromeBanner />);

    await user.click(screen.getByRole("button", { name: /get your pc/i }));
    expect(push).toHaveBeenCalledWith("/setup");

    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(push).toHaveBeenCalledWith("/sign-in");
  });
});
