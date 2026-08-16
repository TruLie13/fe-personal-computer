import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Desktop } from "@/components/desktop/Desktop";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("Desktop", () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it("hydrates and shows desktop icons plus the taskbar", () => {
    render(<Desktop />);

    expect(useDesktopStore.getState().hydrated).toBe(true);
    expect(screen.getByRole("button", { name: "Notepad" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo", { name: "Taskbar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start/i })).toBeInTheDocument();
  });

  it("opens Notepad from a desktop icon double-click", async () => {
    const user = userEvent.setup();
    render(<Desktop />);

    await user.dblClick(screen.getByRole("button", { name: "Notepad" }));
    expect(
      screen.getByRole("dialog", { name: /Notepad/i }),
    ).toBeInTheDocument();
  });
});
