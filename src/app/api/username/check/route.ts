import { resolveUsernameAvailability } from "@/lib/usernameAvailabilityCore";

export async function GET(request: Request): Promise<Response> {
  const username = new URL(request.url).searchParams.get("username") ?? "";
  const result = resolveUsernameAvailability(username);
  return Response.json(result);
}
