import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoryExplorer } from "@/components/desktop/StoryExplorer";
import { listPublicStoriesNewestFirst } from "@/lib/networkSeed";

describe("StoryExplorer", () => {
  it("lists public stories and shows selected content", async () => {
    const user = userEvent.setup();
    const stories = listPublicStoriesNewestFirst();
    expect(stories.length).toBeGreaterThan(1);

    render(<StoryExplorer />);

    expect(
      screen.getByText(/public writing from the network/i),
    ).toBeInTheDocument();

    const first = stories[0]!;
    expect(
      screen.getByRole("button", { name: new RegExp(first.title, "i") }),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, node) => {
        return (
          node?.classList.contains("whitespace-pre-wrap") === true &&
          (node.textContent?.includes(first.content.slice(0, 24)) ?? false)
        );
      }),
    ).toBeInTheDocument();

    const second = stories[1]!;
    await user.click(
      screen.getByRole("button", { name: new RegExp(second.title, "i") }),
    );
    expect(
      screen.getByText((_, node) => {
        return (
          node?.classList.contains("whitespace-pre-wrap") === true &&
          (node.textContent?.includes(second.content.slice(0, 24)) ?? false)
        );
      }),
    ).toBeInTheDocument();
  });
});
