import { ProfileMissingError, signInToPc } from "@/lib/firebase/signInPc";
import { signInWithEmail } from "@/lib/firebase/auth";
import { getDesktopRepository } from "@/lib/repository";
import { applySignedInSession } from "@/lib/setupAccount";

jest.mock("@/lib/firebase/auth", () => ({
  signInWithEmail: jest.fn(),
}));

jest.mock("@/lib/repository", () => ({
  getDesktopRepository: jest.fn(),
}));

jest.mock("@/lib/setupAccount", () => ({
  applySignedInSession: jest.fn(),
}));

const signIn = jest.mocked(signInWithEmail);
const getRepo = jest.mocked(getDesktopRepository);
const applySession = jest.mocked(applySignedInSession);

describe("signInToPc", () => {
  beforeEach(() => {
    signIn.mockReset();
    applySession.mockReset();
    getRepo.mockReset();
  });

  it("applies profile and theme from Firestore", async () => {
    signIn.mockResolvedValue({
      uid: "uid-1",
      email: "ada@example.com",
      emailVerified: true,
    } as never);
    getRepo.mockReturnValue({
      loadDesktop: jest.fn(async () => ({
        username: "ada",
        profile: {
          displayName: "Ada",
          computerName: "ADA-PC",
          bio: "hello",
          avatarColor: "#000080",
          avatarUrl: null,
        },
        theme: {
          wallpaper: "#008080",
          titleBarColor: "#800000",
          contentDark: true,
        },
        icons: [],
        documents: [],
      })),
    } as never);

    const result = await signInToPc({
      email: "ada@example.com",
      password: "secret1",
    });

    expect(result).toEqual({
      username: "ada",
      uid: "uid-1",
      emailVerified: true,
    });
    expect(applySession).toHaveBeenCalledWith({
      username: "ada",
      email: "ada@example.com",
      profile: expect.objectContaining({ displayName: "Ada" }),
      theme: {
        wallpaper: "#008080",
        titleBarColor: "#800000",
        contentDark: true,
      },
      fs: {
        icons: [],
        documents: [],
      },
    });
  });

  it("throws when the Auth user has no PC profile", async () => {
    signIn.mockResolvedValue({
      uid: "uid-1",
      email: "ada@example.com",
      emailVerified: false,
    } as never);
    getRepo.mockReturnValue({
      loadDesktop: jest.fn(async () => null),
    } as never);

    await expect(
      signInToPc({ email: "ada@example.com", password: "secret1" }),
    ).rejects.toBeInstanceOf(ProfileMissingError);
    expect(applySession).not.toHaveBeenCalled();
  });
});
