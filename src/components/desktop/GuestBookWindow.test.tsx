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

  it("lets a visitor delete their own signature", async () => {
    const user = userEvent.setup();
    useDesktopStore.setState({
      viewMode: "remote",
      remoteUserId: "maya",
      localGuestbookEntries: [
        {
          id: "mine",
          hostUserId: "maya",
          authorId: "local",
          content: "I was here",
          createdAt: "2026-08-20T10:00:00.000Z",
        },
      ],
    });
    render(<GuestBookWindow />);

    expect(screen.getByText("I was here")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete signature" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.queryByText("I was here")).not.toBeInTheDocument();
    expect(
      useDesktopStore.getState().localGuestbookEntries.find((e) => e.id === "mine")
        ?.deletedAt,
    ).toBeTruthy();
  });

  it("shows Visit PC on another author's seed signature", () => {
    useDesktopStore.setState({
      viewMode: "remote",
      remoteUserId: "maya",
    });
    render(<GuestBookWindow />);
    expect(screen.getByText(/Rex Ortega/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Visit PC/i }),
    ).toBeInTheDocument();
  });
});
