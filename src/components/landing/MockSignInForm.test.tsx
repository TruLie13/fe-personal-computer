import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockSignInForm } from "@/components/landing/MockSignInForm";

const push = jest.fn();
const signInToPc = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/lib/firebase/signInPc", () => ({
  ProfileMissingError: class ProfileMissingError extends Error {},
  signInToPc: (...args: unknown[]) => signInToPc(...args),
}));

describe("MockSignInForm", () => {
  beforeEach(() => {
    push.mockClear();
    signInToPc.mockReset();
    signInToPc.mockResolvedValue({
      username: "ada",
      uid: "uid-1",
      emailVerified: true,
    });
    window.localStorage.clear();
  });

  it("submits to the claimed desktop", async () => {
    const user = userEvent.setup();
    render(<MockSignInForm />);
    await user.type(screen.getByLabelText(/email/i), "writer@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret1");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(signInToPc).toHaveBeenCalledWith({
      email: "writer@example.com",
      password: "secret1",
    });
    expect(push).toHaveBeenCalledWith("/C/users/ada");
  });

  it("links new users to Setup", () => {
    render(<MockSignInForm />);
    expect(
      screen.getByRole("link", { name: /get your pc/i }),
    ).toHaveAttribute("href", "/setup");
  });
});
