import { NextResponse } from "next/server";
import {
  isDesktopFsLimitError,
  DesktopFsLimitError,
} from "@/lib/desktopFsLimits";
import { adminSaveDesktopLayout } from "@/lib/server/adminDesktopLayout";
import {
  isDesktopLayoutPayloadError,
  parseDesktopLayoutBody,
} from "@/lib/server/parseDesktopLayoutBody";
import {
  requireUidFromBearer,
  UnauthorizedError,
} from "@/lib/server/requireUidFromBearer";

export async function POST(request: Request): Promise<Response> {
  try {
    const uid = await requireUidFromBearer(request);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body must be JSON", code: "invalid_layout_payload" },
        { status: 400 },
      );
    }

    const { icons, documents } = parseDesktopLayoutBody(body);
    await adminSaveDesktopLayout({ uid, icons, documents });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (isDesktopLayoutPayloadError(err)) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 },
      );
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
