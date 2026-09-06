/**
 * @jest-environment node
 */
import {
  requireUsernameForUid,
  resolveGuestbookHost,
  ProfileUsernameError,
} from "@/lib/server/resolveProfileUsername";

jest.mock("@/lib/firebase/admin", () => ({
  getAdminFirestore: jest.fn(),
  adminUidForUsername: jest.fn(),
}));

import {
  adminUidForUsername,
  getAdminFirestore,
} from "@/lib/firebase/admin";

describe("resolveProfileUsername", () => {
  const docGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getAdminFirestore).mockReturnValue({
      doc: jest.fn(() => ({ get: docGet })),
    } as never);
  });

  it("loads username from users/{uid}", async () => {
    docGet.mockResolvedValue({
      exists: true,
      data: () => ({ username: "alice" }),
    });
    await expect(requireUsernameForUid("uid-1")).resolves.toBe("alice");
  });

  it("rejects missing profile username", async () => {
    docGet.mockResolvedValue({ exists: false, data: () => undefined });
    await expect(requireUsernameForUid("uid-1")).rejects.toBeInstanceOf(
      ProfileUsernameError,
    );
  });

  it("resolves claimed host uid to profile username", async () => {
    docGet.mockResolvedValue({
      exists: true,
      data: () => ({ username: "bob" }),
    });
    await expect(resolveGuestbookHost("uid-bob")).resolves.toEqual({
      hostUid: "uid-bob",
      hostUsername: "bob",
    });
  });

  it("maps seed username host ids via usernames collection", async () => {
    docGet.mockResolvedValue({ exists: false, data: () => undefined });
    jest.mocked(adminUidForUsername).mockResolvedValue("uid-maya");
    await expect(resolveGuestbookHost("maya")).resolves.toEqual({
      hostUid: "uid-maya",
      hostUsername: "maya",
    });
  });
});
