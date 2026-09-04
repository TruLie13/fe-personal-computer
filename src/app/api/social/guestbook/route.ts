import { postGuestbookEntry } from "@/lib/server/socialCreateHandlers";

export async function POST(request: Request): Promise<Response> {
  return postGuestbookEntry(request);
}
