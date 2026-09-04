"use client";

import { useCallback, useEffect, useState } from "react";
import {
  resendVerificationEmail,
  subscribeAuthState,
  type AuthUser,
} from "@/lib/firebase/auth";

/** Signed-in Auth user whose e-mail is not verified yet. */
export function useEmailVerification() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      return subscribeAuthState(setUser);
    } catch {
      return undefined;
    }
  }, []);

  const resend = useCallback(async () => {
    try {
      await resendVerificationEmail();
      setStatus("Verification mail sent.");
    } catch {
      setStatus("Could not send mail.");
    }
  }, []);

  return {
    needsVerification: Boolean(user && !user.emailVerified),
    resend,
    status,
  };
}
