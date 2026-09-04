import { FirebaseError } from "firebase/app";
import { mapAuthError } from "@/lib/firebase/mapAuthError";
import { UsernameTakenError } from "@/lib/repository/UsernameTakenError";

describe("mapAuthError", () => {
  it("maps common Auth codes", () => {
    expect(
      mapAuthError(new FirebaseError("auth/email-already-in-use", "x")),
    ).toMatch(/already has a PC/i);
    expect(
      mapAuthError(new FirebaseError("auth/invalid-credential", "x")),
    ).toMatch(/not correct/i);
    expect(
      mapAuthError(new FirebaseError("auth/network-request-failed", "x")),
    ).toMatch(/emulator/i);
  });

  it("maps username taken", () => {
    expect(mapAuthError(new UsernameTakenError())).toMatch(/already taken/i);
  });
});
