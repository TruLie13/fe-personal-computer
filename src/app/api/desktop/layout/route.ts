import { NextResponse } from "next/server";
import { adminSaveDesktopLayout } from "@/lib/server/adminDesktopLayout";
import {
  requireUidFromBearer,
  UnauthorizedError,
} from "@/lib/server/requireUidFromBearer";
import {
  isDesktopFsLimitError,
  DesktopFsLimitError,
} from "@/lib/desktopFsLimits";
import type { DesktopIcon, TextDocument } from "@/types/desktop";

function isIcon(value: unknown): value is DesktopIcon {
  if (!value || typeof value !== "object") {
    return false;
  }
  const icon = value as DesktopIcon;
  return typeof icon.id === "string" && typeof icon.type === "string";
}

function isDocument(value: unknown): value is TextDocument {
  if (!value || typeof value !== "object") {
    return false;
  }
  const doc = value as TextDocument;
  return (
    typeof doc.id === "string" &&
    typeof doc.title === "string" &&
    typeof doc.content === "string"
  );
}

export async function POST(request: Request): Promise<Response> {
  try {
    const uid = await requireUidFromBearer(request);
    const body = (await request.json()) as {
      icons?: unknown;
      documents?: unknown;
    };
    const icons = Array.isArray(body.icons)
      ? body.icons.filter(isIcon)
      : [];
    const documents = Array.isArray(body.documents)
      ? body.documents.filter(isDocument)
      : [];

    await adminSaveDesktopLayout({ uid, icons, documents });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (isDesktopFsLimitError(err) || err instanceof DesktopFsLimitError) {
      return NextResponse.json(
        {
          error: err.message,
          code: "fs_limit_exceeded",
          kind: err.kind,
          used: err.used,
          max: err.max,
        },
        { status: 413 },
      );
    }
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
