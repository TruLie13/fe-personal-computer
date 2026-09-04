import { adminUidForUsername } from "@/lib/firebase/admin";
import { resolveUsernameAvailability } from "@/lib/usernameAvailabilityCore";
import { normalizeUsername } from "@/lib/setupAccount";
import { USERNAME_TAKEN_MESSAGE } from "@/lib/usernames";

export async function GET(request: Request): Promise<Response> {
  const username = new URL(request.url).searchParams.get("username") ?? "";
  const result = resolveUsernameAvailability(username);
  if (result.status !== "available") {
    return Response.json(result);
  }

  try {
    const claimed = await adminUidForUsername(normalizeUsername(username));
    if (claimed) {
      return Response.json({
        status: "taken",
        message: USERNAME_TAKEN_MESSAGE,
      });
    }
  } catch {
    // Emulator/Admin unavailable — format/reserved checks already passed.
  }

  return Response.json(result);
}
