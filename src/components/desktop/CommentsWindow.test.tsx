import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentsWindow } from "@/components/desktop/CommentsWindow";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("CommentsWindow", () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it("lists seed comments and posts a local one", async () => {
    const user = userEvent.setup();
    render(<CommentsWindow documentId="maya-doc-poem" />);

    expect(
      screen.getByText(/The bus window line stuck with me/i),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Comment content"),
      "Quiet poem. Thank you.",
    );
    await user.click(screen.getByRole("button", { name: "Post" }));

    expect(screen.getByText("Quiet poem. Thank you.")).toBeInTheDocument();
    expect(useDesktopStore.getState().localStoryComments).toHaveLength(1);
  });

  it("reuses one Comments window per documentId", () => {
    const { openStoryComments } = useDesktopStore.getState();
    openStoryComments({
      documentId: "maya-doc-poem",
      storyTitle: "window-seat",
    });
    openStoryComments({
      documentId: "maya-doc-poem",
      storyTitle: "window-seat",
    });
    openStoryComments({
      documentId: "rex-doc-outline",
      storyTitle: "chapter-zero",
    });

    const commentWindows = useDesktopStore
      .getState()
      .windows.filter((window) => window.type === "comments" && window.isOpen);
    expect(commentWindows).toHaveLength(2);
    expect(
      commentWindows.filter((window) => window.documentId === "maya-doc-poem"),
    ).toHaveLength(1);
  });
});
