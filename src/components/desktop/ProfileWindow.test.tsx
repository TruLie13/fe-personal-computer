import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileWindow } from "@/components/desktop/ProfileWindow";
import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
} from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";

describe("ProfileWindow", () => {
  beforeEach(() => {
    useDesktopStore.setState({
      icons: DEFAULT_ICONS,
      documents: DEFAULT_DOCUMENTS,
      windows: [],
      documentWindowFifo: [],
      wallpaper: DEFAULT_WALLPAPER,
      titleBarColor: DEFAULT_TITLE_BAR_COLOR,
      contentDark: false,
      taskbarHeight: 36,
      selectedIconId: null,
      selectedIconIds: [],
      renamingIconId: null,
      isStartMenuOpen: false,
      nextZIndex: 1,
      hydrated: false,
      viewMode: "local",
      remoteUserId: null,
      favorites: [],
      localBbsNotes: [],
    localStoryComments: [],
      localProfile: {
        displayName: "Writer",
        computerName: "WRITER-PC",
        bio: "test",
        avatarColor: "#000080",
        avatarUrl: null,
      },
    });
    window.localStorage.clear();
  });

  it("saves local display name and bio", async () => {
    const user = userEvent.setup();
    render(<ProfileWindow />);

    const nameInput = screen.getByDisplayValue("Writer");
    await user.clear(nameInput);
    await user.type(nameInput, "Truth");
    await user.clear(screen.getByLabelText("Bio"));
    await user.type(screen.getByLabelText("Bio"), "Hello from my PC.");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const { localProfile, icons } = useDesktopStore.getState();
    expect(localProfile.displayName).toBe("Truth");
    expect(localProfile.bio).toBe("Hello from my PC.");
    expect(icons.find((icon) => icon.id === "profile")?.label).toBe(
      "Truth's PC",
    );
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("clamps bio to the character limit", async () => {
    const user = userEvent.setup();
    render(<ProfileWindow />);

    const bio = screen.getByLabelText("Bio");
    await user.clear(bio);
    await user.click(bio);
    await user.paste("x".repeat(600));

    expect(bio).toHaveValue("x".repeat(500));
    expect(screen.getByLabelText("Bio character count")).toHaveTextContent(
      "500/500 (limit reached)",
    );
  });

  it("keeps the saved identity preview until Save", async () => {
    const user = userEvent.setup();
    render(<ProfileWindow />);

    const preview = () =>
      screen.getByText("WRITER-PC").parentElement?.textContent ?? "";

    expect(preview()).toContain("Writer's PC");

    const nameInput = screen.getByDisplayValue("Writer");
    await user.clear(nameInput);
    await user.type(nameInput, "Zay");

    expect(preview()).toContain("Writer's PC");
    expect(preview()).not.toContain("Zay's PC");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(preview()).toContain("Zay's PC");
    expect(preview()).toContain("WRITER-PC");
  });

  it("shows the permanent URL note on the local profile card", () => {
    render(<ProfileWindow />);

    expect(screen.getByText(/permanent/i)).toBeInTheDocument();
    expect(screen.getByText("/C/users/local")).toBeInTheDocument();
    expect(
      screen.getByText(/You can edit your display name anytime/i),
    ).toBeInTheDocument();
  });

  it("shows remote bio actions and can go home", async () => {
    const user = userEvent.setup();
    useDesktopStore.getState().visitRemotePc("maya");
    render(<ProfileWindow />);

    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    expect(screen.getByText("Read-only visit")).toBeInTheDocument();
    expect(screen.getByText(/Poet of buses/i)).toBeInTheDocument();
    expect(screen.queryByText(/permanent/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add to Network" }));
    expect(useDesktopStore.getState().favorites).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Go Home" }));
    expect(useDesktopStore.getState().viewMode).toBe("local");
    expect(useDesktopStore.getState().remoteUserId).toBeNull();
  });
});
