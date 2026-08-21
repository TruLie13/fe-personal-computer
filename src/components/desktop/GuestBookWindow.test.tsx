import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuestBookWindow } from "@/components/desktop/GuestBookWindow";
import { MAX_GUESTBOOK_ENTRY_CHARS } from "@/lib/guestbook";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("GuestBookWindow", () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it("shows own-book empty state without a Sign composer", () => {
    render(<GuestBookWindow />);
    expect(
      screen.getByText(/No signatures yet\. Visitors leave messages/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your book — visitors sign when they Visit PC/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign" }),
    ).not.toBeInTheDocument();
  });

  it("signs a remote Guest Book as a wall entry", async () => {
    const user = userEvent.setup();
    useDesktopStore.setState({
      viewMode: "remote",
      remoteUserId: "maya",
    });
    render(<GuestBookWindow />);

    expect(
      screen.getByText(/signed pages for Maya Chen/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Rex Ortega/i)).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Guest Book message"),
      "Loved the purple wallpaper.",
    );
    expect(screen.getByLabelText("Character count")).toHaveTextContent(
      `Loved the purple wallpaper.`.length + `/${MAX_GUESTBOOK_ENTRY_CHARS}`,
    );
    await user.click(screen.getByRole("button", { name: "Sign" }));

    expect(useDesktopStore.getState().localGuestbookEntries).toHaveLength(1);
    expect(
      screen.getByText("Loved the purple wallpaper."),
    ).toBeInTheDocument();
  });

  it("uses theme paper tokens for the wall (respects content dark mode)", () => {
    const { container } = render(<GuestBookWindow />);
    const wall = container.querySelector(".win-guestbook-wall");
    expect(wall).toBeTruthy();
    expect(wall?.className).toContain("bg-win-paper");
    expect(wall?.className).toContain("text-win-ink");
  });
});
