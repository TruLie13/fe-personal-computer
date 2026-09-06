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

jest.mock("@/lib/server/resolveProfileUsername", () => ({
  ProfileUsernameError: class ProfileUsernameError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ProfileUsernameError";
    }
  },
  requireUsernameForUid: jest.fn(async () => "alice"),
  resolveGuestbookHost: jest.fn(async (hostId: string) => ({
    hostUid: hostId === "maya" ? "maya" : "uid-bob",
    hostUsername: hostId === "maya" ? "maya" : "bob",
  })),
}));

jest.mock("@/lib/server/adminSocialCreates", () => ({
  adminCreateBbsNote: jest.fn(),
  adminCreateStoryComment: jest.fn(),
  adminCreateGuestbookEntry: jest.fn(),
}));

import { requireUidFromBearer } from "@/lib/server/requireUidFromBearer";
import {
  requireUsernameForUid,
  resolveGuestbookHost,
} from "@/lib/server/resolveProfileUsername";
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
    jest.mocked(requireUsernameForUid).mockResolvedValue("alice");
  });

  it("creates a BBS note using server-resolved username, not the body", async () => {
    jest.mocked(adminCreateBbsNote).mockResolvedValue({
      id: "bbs-1",
      authorId: "alice",
      title: "Hi",
      content: "There",
      createdAt: "2026-09-04T00:00:00.000Z",
    });

    const response = await postBbsNote(
      jsonRequest({
        username: "spoofed-name",
        title: "Hi",
        body: "There",
      }),
    );

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(201);
    expect(requireUsernameForUid).toHaveBeenCalledWith("uid-alice");
    expect(adminCreateBbsNote).toHaveBeenCalledWith({
      authorUid: "uid-alice",
      username: "alice",
      title: "Hi",
      body: "There",
    });
  });

  it("resolves guestbook host without trusting client hostUsername", async () => {
    jest.mocked(adminCreateGuestbookEntry).mockResolvedValue({
      id: "gb-1",
      hostUserId: "bob",
      authorId: "alice",
      content: "Yo",
      createdAt: "2026-09-04T00:00:00.000Z",
    });

    const response = await postGuestbookEntry(
      jsonRequest({
        username: "spoofed",
        hostUid: "uid-bob",
        hostUsername: "evil-label",
        content: "Yo",
      }),
    );

    expect(response.status).toBe(201);
    expect(resolveGuestbookHost).toHaveBeenCalledWith("uid-bob");
    expect(adminCreateGuestbookEntry).toHaveBeenCalledWith({
      authorUid: "uid-alice",
      username: "alice",
      hostUid: "uid-bob",
      hostUsername: "bob",
      content: "Yo",
    });
  });

  it("returns 429 when quota is exceeded", async () => {
    jest
      .mocked(adminCreateStoryComment)
      .mockRejectedValue(new QuotaExceededError("storyComment", 20, 20));

    const response = await postStoryComment(
      jsonRequest({
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
        hostUid: "uid-bob",
        content: "Yo",
      }),
    );

    expect(response.status).toBe(401);
    expect(adminCreateGuestbookEntry).not.toHaveBeenCalled();
  });
});
