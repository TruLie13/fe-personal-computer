"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PRODUCT_NAME, SPOKEN_NAME } from "@/lib/seo/brand";
import { homePath } from "@/lib/seo/paths";

export function MockSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Stub auth: any submit enters the local owner desktop.
    void email;
    void password;
    router.push(homePath());
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
          Mock form — real accounts and the {PRODUCT_NAME} Setup Wizard come
          next. Submitting opens your local desktop for now.
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
          <button
            type="submit"
            className="border border-[#808080] bg-[#c0c0c0] px-3 py-1 font-serif text-[16px] text-black"
          >
            Sign in / Get your PC
          </button>
        </form>

        <p className="mt-4 text-[14px]">
          New here? Same button for now. Later this becomes the Windows 95–style
          Setup Wizard (choose username, confirm email).
        </p>
        <p className="mt-2 text-[14px]">
          <Link href="/">← Back to home</Link>
        </p>
      </main>
    </div>
  );
}
