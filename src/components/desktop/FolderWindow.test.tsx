import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FolderWindow } from "@/components/desktop/FolderWindow";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("FolderWindow", () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it("creates a text file inside a folder", async () => {
    const user = userEvent.setup();
    const folderId = useDesktopStore.getState().createFolder("Poems")!;

    render(<FolderWindow folderId={folderId} />);

    await user.click(
      screen.getByRole("button", { name: "New Text Document" }),
    );

    const state = useDesktopStore.getState();
    const created = state.icons.find(
      (icon) =>
        icon.parentId === folderId &&
        icon.type === "text" &&
        icon.label.startsWith("New Text Document"),
    );
    expect(created).toBeDefined();
  });

  it("shows read-only toolbar when visiting remotely", () => {
    useDesktopStore.getState().visitRemotePc("maya");
    render(<FolderWindow folderId="maya-documents" />);

    expect(
      screen.getByText(/Read-only visit — open files to read/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New Folder" }),
    ).not.toBeInTheDocument();
  });
});
