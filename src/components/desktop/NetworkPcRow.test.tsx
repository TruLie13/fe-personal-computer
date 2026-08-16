import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LocalPcRow,
  NetworkPcRow,
} from "@/components/desktop/NetworkPcRow";
import { NETWORK_USERS } from "@/lib/networkSeed";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("NetworkPcRow", () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it("renders a network user row and visits on click", async () => {
    const user = userEvent.setup();
    const maya = NETWORK_USERS[0]!;
    const onRemove = jest.fn();

    render(
      <ul>
        <NetworkPcRow
          user={maya}
          actions={
            <button type="button" onClick={onRemove}>
              Remove
            </button>
          }
        />
      </ul>,
    );

    expect(screen.getByText(maya.displayName)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Visit PC/i }));
    expect(useDesktopStore.getState().viewMode).toBe("remote");
    expect(useDesktopStore.getState().remoteUserId).toBe(maya.id);

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("renders the local PC row without Visit PC", () => {
    render(
      <ul>
        <LocalPcRow title="This PC (you)" subtitle="Local desktop" />
      </ul>,
    );

    expect(screen.getByText("This PC (you)")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Visit PC/i }),
    ).not.toBeInTheDocument();
  });
});
