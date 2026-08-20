import type { UsernameAvailabilityResult } from "@/lib/usernameAvailabilityCore";
import { USERNAME_UNAVAILABLE_MESSAGE } from "@/lib/usernames";

export async function fetchUsernameAvailability(
  raw: string,
): Promise<UsernameAvailabilityResult> {
  const response = await fetch(
    `/api/username/check?username=${encodeURIComponent(raw)}`,
  );
  if (!response.ok) {
    return {
      status: "invalid",
      message: USERNAME_UNAVAILABLE_MESSAGE,
    };
  }
  return (await response.json()) as UsernameAvailabilityResult;
}

/** Returns an error message when the username cannot be claimed. */
export async function checkUsernameAvailabilityOnNext(
  raw: string,
): Promise<string | null> {
  const result = await fetchUsernameAvailability(raw);
  if (result.status === "available") {
    return null;
  }
  return result.message;
}
