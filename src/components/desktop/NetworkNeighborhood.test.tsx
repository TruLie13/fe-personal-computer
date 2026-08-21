import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NetworkNeighborhood } from "@/components/desktop/NetworkNeighborhood";
import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
} from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";

describe("NetworkNeighborhood", () => {
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
    localGuestbookEntries: [],
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

  it("adds and removes a favorite PC", async () => {
    const user = userEvent.setup();
    render(<NetworkNeighborhood />);

    expect(screen.getByText(/No favorites yet/i)).toBeInTheDocument();

    const addButtons = screen.getAllByRole("button", {
      name: "Add to Favorites",
    });
    await user.click(addButtons[0]!);

    expect(useDesktopStore.getState().favorites).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Unfavorite" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(useDesktopStore.getState().favorites).toHaveLength(0);
    expect(screen.getByText(/No favorites yet/i)).toBeInTheDocument();
  });

  it("visits a remote PC from the network list", async () => {
    const user = userEvent.setup();
    render(<NetworkNeighborhood />);

    const visitButtons = screen.getAllByRole("button", { name: /Visit PC/i });
    await user.click(visitButtons[0]!);

    const state = useDesktopStore.getState();
    expect(state.viewMode).toBe("remote");
    expect(state.remoteUserId).toBe("maya");
  });
});
