import { NETWORK_USERS } from "@/lib/networkSeed";
import { resolveUsernameAvailability } from "@/lib/usernameAvailabilityCore";
import { usernameBlurError } from "@/lib/usernames";

describe("usernameBlurError", () => {
  it("flags invalid and reserved usernames", () => {
    expect(usernameBlurError("")).toBe("Type a username.");
    expect(usernameBlurError("setup")).toBe("That username is not available.");
    expect(usernameBlurError("Ada")).toBeNull();
  });
});

describe("resolveUsernameAvailability", () => {
  it("rejects invalid usernames", () => {
    expect(resolveUsernameAvailability("1ada").status).toBe("invalid");
  });

  it("rejects reserved usernames", () => {
    expect(resolveUsernameAvailability("local").status).toBe("reserved");
    expect(resolveUsernameAvailability("setup").message).toMatch(
      /not available/i,
    );
  });

  it("accepts an unused username", () => {
    expect(resolveUsernameAvailability("ada").status).toBe("available");
  });

  it("rejects usernames already used by seed PCs", () => {
    const originalLength = NETWORK_USERS.length;
    NETWORK_USERS.push({
      id: "claimed",
      displayName: "Claimed User",
      computerName: "CLAIMED-PC",
      bio: "",
      avatarColor: "#000080",
      avatarUrl: null,
      snapshot: {
        wallpaper: "#008080",
        titleBarColor: "#000080",
        icons: [],
        documents: [],
      },
    });

    try {
      expect(resolveUsernameAvailability("claimed").status).toBe("taken");
    } finally {
      NETWORK_USERS.length = originalLength;
    }
  });
});
