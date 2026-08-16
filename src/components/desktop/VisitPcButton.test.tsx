import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VisitPcButton } from "@/components/desktop/VisitPcButton";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("VisitPcButton", () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it("visits the requested remote PC", async () => {
    const user = userEvent.setup();
    render(<VisitPcButton userId="rex" />);

    await user.click(screen.getByRole("button", { name: /Visit PC/i }));
    expect(useDesktopStore.getState().viewMode).toBe("remote");
    expect(useDesktopStore.getState().remoteUserId).toBe("rex");
  });
});
