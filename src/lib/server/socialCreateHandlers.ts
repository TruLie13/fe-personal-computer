import { NextResponse } from "next/server";
import {
  adminCreateBbsNote,
  adminCreateGuestbookEntry,
  adminCreateStoryComment,
} from "@/lib/server/adminSocialCreates";
import {
  requireUidFromBearer,
  UnauthorizedError,
} from "@/lib/server/requireUidFromBearer";
import {
  isQuotaExceededError,
  QuotaExceededError,
} from "@/lib/socialQuota";

type JsonRecord = Record<string, unknown>;

async function readJson(request: Request): Promise<JsonRecord> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object") {
      return {};
    }
    return body as JsonRecord;
  } catch {
    return {};
  }
}

function stringField(body: JsonRecord, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value : "";
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (isQuotaExceededError(err) || err instanceof QuotaExceededError) {
    return NextResponse.json(
      {
        error: err.message,
        code: "quota_exceeded",
        kind: err.kind,
        used: err.used,
        max: err.max,
      },
      { status: 429 },
    );
  }
  const message = err instanceof Error ? err.message : "Request failed";
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function postBbsNote(request: Request): Promise<NextResponse> {
  try {
    const uid = await requireUidFromBearer(request);
    const body = await readJson(request);
    const note = await adminCreateBbsNote({
      authorUid: uid,
      username: stringField(body, "username"),
      title: stringField(body, "title"),
      body: stringField(body, "body"),
    });
    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function postStoryComment(
  request: Request,
): Promise<NextResponse> {
  try {
    const uid = await requireUidFromBearer(request);
    const body = await readJson(request);
    const comment = await adminCreateStoryComment({
      authorUid: uid,
      username: stringField(body, "username"),
      documentId: stringField(body, "documentId"),
      ownerUid: stringField(body, "ownerUid"),
      content: stringField(body, "content"),
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function postGuestbookEntry(
  request: Request,
): Promise<NextResponse> {
  try {
    const uid = await requireUidFromBearer(request);
    const body = await readJson(request);
    const entry = await adminCreateGuestbookEntry({
      authorUid: uid,
      username: stringField(body, "username"),
      hostUid: stringField(body, "hostUid"),
      hostUsername: stringField(body, "hostUsername"),
      content: stringField(body, "content"),
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
