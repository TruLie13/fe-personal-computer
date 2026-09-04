/**
 * @jest-environment node
 */
import { NextResponse } from "next/server";
import {
  postBbsNote,
  postGuestbookEntry,
  postStoryComment,
} from "@/lib/server/socialCreateHandlers";
import { QuotaExceededError } from "@/lib/socialQuota";

jest.mock("@/lib/server/requireUidFromBearer", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = "Unauthorized") {
      super(message);
      this.name = "UnauthorizedError";
    }
  },
  requireUidFromBearer: jest.fn(async () => "uid-alice"),
}));

jest.mock("@/lib/server/adminSocialCreates", () => ({
  adminCreateBbsNote: jest.fn(),
  adminCreateStoryComment: jest.fn(),
  adminCreateGuestbookEntry: jest.fn(),
}));

import { requireUidFromBearer } from "@/lib/server/requireUidFromBearer";
import {
  adminCreateBbsNote,
  adminCreateGuestbookEntry,
  adminCreateStoryComment,
} from "@/lib/server/adminSocialCreates";

function jsonRequest(body: Record<string, string>): Request {
  return new Request("http://localhost/api/social/bbs", {
    method: "POST",
    headers: {
      Authorization: "Bearer test",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("socialCreateHandlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requireUidFromBearer).mockResolvedValue("uid-alice");
  });

  it("creates a BBS note for the authenticated uid", async () => {
    jest.mocked(adminCreateBbsNote).mockResolvedValue({
      id: "bbs-1",
      authorId: "alice",
      title: "Hi",
      content: "There",
      createdAt: "2026-09-04T00:00:00.000Z",
    });

    const response = await postBbsNote(
      jsonRequest({
        username: "alice",
        title: "Hi",
        body: "There",
      }),
    );

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(201);
    expect(adminCreateBbsNote).toHaveBeenCalledWith({
      authorUid: "uid-alice",
      username: "alice",
      title: "Hi",
      body: "There",
    });
  });

  it("returns 429 when quota is exceeded", async () => {
    jest
      .mocked(adminCreateStoryComment)
      .mockRejectedValue(new QuotaExceededError("storyComment", 20, 20));

    const response = await postStoryComment(
      jsonRequest({
        username: "alice",
        documentId: "doc-1",
        ownerUid: "uid-bob",
        content: "Nice",
      }),
    );

    expect(response.status).toBe(429);
    const payload = await response.json();
    expect(payload.code).toBe("quota_exceeded");
  });

  it("returns 401 when bearer auth fails", async () => {
    const { UnauthorizedError } = await import(
      "@/lib/server/requireUidFromBearer"
    );
    jest
      .mocked(requireUidFromBearer)
      .mockRejectedValue(new UnauthorizedError());

    const response = await postGuestbookEntry(
      jsonRequest({
        username: "alice",
        hostUid: "uid-bob",
        hostUsername: "bob",
        content: "Yo",
      }),
    );

    expect(response.status).toBe(401);
    expect(adminCreateGuestbookEntry).not.toHaveBeenCalled();
  });
});
