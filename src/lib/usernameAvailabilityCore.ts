import { NETWORK_USERS } from "@/lib/networkSeed";
import { normalizeUsername, usernameError } from "@/lib/setupAccount";
import {
  isReservedUsername,
  USERNAME_TAKEN_MESSAGE,
  USERNAME_UNAVAILABLE_MESSAGE,
} from "@/lib/usernames";

export type UsernameAvailabilityStatus =
  | "available"
  | "invalid"
  | "reserved"
  | "taken";

export interface UsernameAvailabilityResult {
  status: UsernameAvailabilityStatus;
  message: string | null;
}

/**
 * Shared username availability logic for the Setup Wizard API and tests.
 * Swap the taken check to Firestore `usernames/{username}` when auth lands.
 */
export function resolveUsernameAvailability(
  raw: string,
): UsernameAvailabilityResult {
  const formatError = usernameError(raw);
  if (formatError) {
    return { status: "invalid", message: formatError };
  }

  const username = normalizeUsername(raw);
  if (isReservedUsername(username)) {
    return { status: "reserved", message: USERNAME_UNAVAILABLE_MESSAGE };
  }

  if (NETWORK_USERS.some((user) => user.id === username)) {
    return { status: "taken", message: USERNAME_TAKEN_MESSAGE };
  }

  return { status: "available", message: null };
}
