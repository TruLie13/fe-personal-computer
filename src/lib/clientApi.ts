"use client";

import { getCurrentAuthUser } from "@/lib/firebase/auth";

export class ClientApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ClientApiError";
    this.status = status;
    this.code = code;
  }
}

/** @deprecated Use ClientApiError — kept for existing social call sites. */
export class SocialApiError extends ClientApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code);
    this.name = "SocialApiError";
  }
}

export async function bearerAuthHeaders(): Promise<HeadersInit> {
  const user = getCurrentAuthUser();
  if (!user) {
    throw new Error("Not signed in");
  }
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function postAuthedJson<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: await bearerAuthHeaders(),
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  };
  if (!response.ok) {
    throw new ClientApiError(
      payload.error ?? `Request failed (${response.status})`,
      response.status,
      payload.code,
    );
  }
  return payload as T;
}
