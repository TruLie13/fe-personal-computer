import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { resetDesktopStore } from "@/test/resetDesktopStore";

const push = jest.fn();
const registerPcAccount = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/lib/firebase/registerPc", () => ({
  registerPcAccount: (...args: unknown[]) => registerPcAccount(...args),
}));

jest.mock("@/lib/repository", () => ({
  getDesktopRepository: () => ({
    getUidForUsername: async () => null,
  }),
}));

function renderWizard() {
  return render(
    <SetupWizard analyzeTickMs={1} analyzeIncrement={100} analyzeHoldMs={1} />,
  );
}

describe("SetupWizard", () => {
  beforeEach(() => {
    push.mockClear();
    registerPcAccount.mockReset();
    registerPcAccount.mockResolvedValue({ username: "ada", uid: "uid-1" });
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

  it("analyzes then opens the claimed desktop after Firebase register", async () => {
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
      expect(registerPcAccount).toHaveBeenCalledWith({
        username: "Ada",
        email: "ada@example.com",
        password: "secret1",
        displayName: "Ada",
      });
      expect(push).toHaveBeenCalledWith("/C/users/ada");
    });
  });
});
