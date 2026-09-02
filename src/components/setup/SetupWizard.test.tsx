import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { LOCAL_SESSION_STORAGE_KEY } from "@/lib/setupAccount";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderWizard() {
  return render(
    <SetupWizard analyzeTickMs={1} analyzeIncrement={100} analyzeHoldMs={1} />,
  );
}

describe("SetupWizard", () => {
  beforeEach(() => {
    push.mockClear();
    resetDesktopStore();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "available", message: null }),
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("starts on the welcome step with the next parts of Setup", () => {
    renderWizard();
    expect(
      screen.getByRole("dialog", { name: /setup wizard/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/collecting information about you/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/preparing your personal computer/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /back/i }),
    ).toBeDisabled();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("moves to user information and back", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(
      screen.getByRole("heading", { name: /user information/i }),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText(/username/i), "Ada");
    expect(screen.getByText(/C:\\users\\ada/i)).toBeInTheDocument();
    expect(screen.getByText(/permanent URL/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(
      screen.getByText(/the next three parts of setup are/i),
    ).toBeInTheDocument();
  });

  it("validates user information before analyzing", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/username/i);

    await user.type(screen.getByLabelText(/username/i), "ada");
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/e-mail/i);
  });

  it("shows reserved username feedback when the username field loses focus", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.type(screen.getByLabelText(/username/i), "setup");
    await user.tab();
    expect(screen.getByRole("alert")).toHaveTextContent(/not available/i);
  });

  it("blocks Next when the username is already taken", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "taken",
        message: "That username is already taken.",
      }),
    });
    renderWizard();
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.type(screen.getByLabelText(/username/i), "claimed");
    await user.type(screen.getByLabelText(/e-mail/i), "claimed@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret1");
    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/already taken/i);
    expect(
      screen.queryByRole("heading", { name: /analyzing your computer/i }),
    ).not.toBeInTheDocument();
  });

  it("asks before exiting Setup", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.getByRole("alertdialog", { name: /setup wizard/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "No" }));
    expect(push).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("analyzes then opens the local desktop without storing a password", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.type(screen.getByLabelText(/username/i), "Ada");
    await user.type(screen.getByLabelText(/e-mail/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret1");
    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(
      screen.getByRole("heading", { name: /analyzing your computer/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/C/users/local");
    });

    expect(useDesktopStore.getState().localProfile.displayName).toBe("Ada");
    expect(useDesktopStore.getState().localProfile.computerName).toBe("ADA-PC");
    const session = window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY);
    expect(session).toContain("ada@example.com");
    expect(session).not.toContain("secret1");
  });
});
