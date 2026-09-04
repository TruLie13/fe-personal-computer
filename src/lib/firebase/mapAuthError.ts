import { FirebaseError } from "firebase/app";
import { UsernameTakenError } from "@/lib/repository/UsernameTakenError";

export function mapAuthError(error: unknown): string {
  if (error instanceof UsernameTakenError) {
    return error.message;
  }
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "That e-mail already has a PC. Sign in instead.";
      case "auth/invalid-email":
        return "Type a valid e-mail address.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "That e-mail or password is not correct.";
      case "auth/too-many-requests":
        return "Too many tries. Wait a moment and try again.";
      case "auth/network-request-failed":
        return "Could not reach Firebase. Is the emulator running?";
      default:
        return error.message || "Could not log on.";
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Could not log on.";
}
