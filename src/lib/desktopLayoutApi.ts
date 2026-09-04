"use client";

import { postAuthedJson } from "@/lib/clientApi";
import type { DesktopIcon, TextDocument } from "@/types/desktop";

export async function apiSaveDesktopLayout(input: {
  icons: DesktopIcon[];
  documents: TextDocument[];
}): Promise<void> {
  await postAuthedJson("/api/desktop/layout", input);
}
