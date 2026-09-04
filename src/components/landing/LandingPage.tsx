import { DesktopPreview } from "@/components/landing/DesktopPreview";
import { DevDesktopFloat } from "@/components/landing/DevDesktopFloat";
import {
  LANDING_PITCH,
  LANDING_TAGLINE,
  SPOKEN_NAME,
} from "@/lib/seo/brand";
import { samplePcPath, setupPath, signInPath } from "@/lib/seo/paths";

export function LandingPage() {
  const sampleHref = samplePcPath();
  const signInHref = signInPath();
  const setupHref = setupPath();

  return (
    <div className="landing-95">
      <main className="mx-auto max-w-[720px] px-3 py-4">
        <header className="mb-3">
          <p className="text-[13px]">
            <a href="/">{SPOKEN_NAME}</a>
            {" · "}
            <a href={signInHref}>Sign in</a>
            {" · "}
            <a href={setupHref}>Get your PC</a>
          </p>
          <h1 className="mt-2 text-[1.75em] leading-tight">
            Welcome to {SPOKEN_NAME}!
          </h1>
          <p className="landing-muted mt-1">{LANDING_TAGLINE}</p>
        </header>

        <hr />

        <section className="mb-4">
          <p>{LANDING_PITCH}</p>
          <p className="mt-2">
            You do <strong>not</strong> need an account to visit someone&apos;s
            PC and read their stories. Creating a PC is how you publish your
            own.
          </p>
          <p className="mt-3">
            <a href={setupHref}>
              <strong>Get your PC</strong>
            </a>
            {" — "}
            run Setup and claim a username.
            <br />
            {/* Plain <a>: full load into the desktop shell (no soft-nav race). */}
            <a href={sampleHref}>
              <strong>Visit a sample PC</strong>
            </a>
            {" — "}
            open Maya&apos;s desktop and read files (guest OK).
          </p>
          <DesktopPreview />
        </section>

        <hr />

        <section className="mb-4">
          <h2 className="landing-section-title">How it works</h2>
          <ol className="list-decimal pl-6">
            <li>
              <strong>Write</strong> - use the text editor on your desktop.
            </li>
            <li>
              <strong>Save</strong> — the story becomes a file on your PC (
              <code className="text-[0.9em]">C:\users\you\…</code>).
            </li>
            <li>
              <strong>Others visit</strong> - your PC on the network and open
              those files. Read-only for guests and other writers.
            </li>
          </ol>
        </section>

        <hr />

        <section className="mb-4">
          <h2 className="landing-section-title">Features</h2>
          <p>
            <a href={setupHref}>Your own PC</a>
            <br />
            A retro desktop that <em>is</em> your writer profile — wallpaper,
            folders, and story files.
          </p>
          <p className="mt-2">
            <a href={sampleHref}>Visit other PCs</a>
            <br />
            Browse Network Neighborhood. Open someone&apos;s documents the way
            you&apos;d open a shared folder.
          </p>
          <p className="mt-2">
            <strong>Bulletin Board &amp; Story Explorer</strong>
            <br />
            Discover public writing without a noisy feed.
          </p>
          <p className="mt-2">
            <strong>Coming later</strong>
            <br />
            Paint for sharing images, maybe a game or two on the desk — still a
            social network for storytellers, not a fake OS for its own sake.
          </p>
        </section>

        <hr />

        <section className="mb-4">
          <h2 className="landing-section-title">Your account</h2>
          <p>
            Please note: you do not need an account to visit a PC and read.
            When you are ready to write and publish,{" "}
            <a href={setupHref}>get your PC</a>.
          </p>
        </section>

        <hr />

        <footer className="landing-footer-nav pb-8 text-[14px]">
          <p>
            [
            <a href="/">Home</a>
            {" | "}
            <a href={sampleHref}>Sample PC</a>
            {" | "}
            <a href={signInHref}>Sign in</a>
            {" | "}
            <a href={setupHref}>Get your PC</a>]
          </p>
          <p className="mt-3 text-[13px]">
            Copyright © {new Date().getFullYear()} {SPOKEN_NAME}.
            <br />
            A social desktop for writers.
          </p>
        </footer>
      </main>
      <DevDesktopFloat />
    </div>
  );
}
