"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { mapAuthError } from "@/lib/firebase/mapAuthError";
import { ProfileMissingError, signInToPc } from "@/lib/firebase/signInPc";
import { PRODUCT_NAME, SPOKEN_NAME } from "@/lib/seo/brand";
import { profilePath, setupPath } from "@/lib/seo/paths";
import { emailError, passwordError } from "@/lib/setupAccount";

export function MockSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = emailError(email) ?? passwordError(password);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await signInToPc({ email, password });
      router.push(profilePath(result.username));
    } catch (caught) {
      if (caught instanceof ProfileMissingError) {
        setError(caught.message);
        return;
      }
      setError(mapAuthError(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="landing-95">
      <main className="mx-auto max-w-[480px] px-3 py-4">
        <p className="text-[13px]">
          <Link href="/">{SPOKEN_NAME}</Link>
          {" · "}
          <Link href="/">Home</Link>
        </p>
        <h1 className="mt-2 text-[1.5em]">Sign in to {SPOKEN_NAME}</h1>
        <p className="landing-muted mt-1">
          Log on with the e-mail you used in Setup. New PCs use the{" "}
          {PRODUCT_NAME} Setup Wizard.
        </p>

        <hr />

        <form onSubmit={onSubmit} className="space-y-3 font-serif">
          <div>
            <label htmlFor="email" className="block font-bold">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full border border-[#808080] bg-white px-1 py-0.5 font-serif text-[16px] text-black"
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-bold">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full border border-[#808080] bg-white px-1 py-0.5 font-serif text-[16px] text-black"
            />
          </div>
          {error ? (
            <p role="alert" className="text-[14px]">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="border border-[#808080] bg-[#c0c0c0] px-3 py-1 font-serif text-[16px] text-black"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-[14px]">
          New here?{" "}
          <Link href={setupPath()}>Get your PC</Link> — run the Setup Wizard.
        </p>
        <p className="mt-2 text-[14px]">
          <Link href="/">← Back to home</Link>
        </p>
      </main>
    </div>
  );
}
