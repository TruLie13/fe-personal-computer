"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import { ComputerIcon } from "@/components/desktop/icons";
import { SetupSidebarArt } from "@/components/setup/SetupSidebarArt";
import { SPOKEN_NAME } from "@/lib/seo/brand";
import { homePath } from "@/lib/seo/paths";
import {
  analyzingStatus,
  applyLocalSetupAccount,
  normalizeUsername,
  userInfoError,
} from "@/lib/setupAccount";
import { checkUsernameAvailabilityOnNext } from "@/lib/usernameAvailabilityClient";
import { usernameBlurError } from "@/lib/usernames";

export type SetupStep = "welcome" | "user-info" | "analyzing";

export interface SetupWizardProps {
  /** Test hook: ms between analyzing progress ticks. */
  analyzeTickMs?: number;
  /** Test hook: percent added each tick. */
  analyzeIncrement?: number;
  /** Test hook: pause at 100% before opening the desktop. */
  analyzeHoldMs?: number;
}

const WIZARD_TITLE = `${SPOKEN_NAME} Setup Wizard`;

export function SetupWizard({
  analyzeTickMs = 80,
  analyzeIncrement = 4,
  analyzeHoldMs = 450,
}: SetupWizardProps = {}) {
  const router = useRouter();
  const titleId = useId();
  const cancelledRef = useRef(false);
  const finishedRef = useRef(false);

  const [step, setStep] = useState<SetupStep>("welcome");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [usernameFieldError, setUsernameFieldError] = useState<string | null>(
    null,
  );
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exitOpen, setExitOpen] = useState(false);

  const backDisabled = step === "welcome" || step === "analyzing";
  const nextDisabled = step === "analyzing" || checkingUsername;
  const nextIsDefault = step !== "analyzing";

  useEffect(() => {
    if (step !== "analyzing") {
      return;
    }
    setProgress(0);
    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(100, current + analyzeIncrement);
        if (next >= 100) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, analyzeTickMs);
    return () => window.clearInterval(interval);
  }, [step, analyzeTickMs, analyzeIncrement]);

  useEffect(() => {
    if (step !== "analyzing" || progress < 100 || finishedRef.current) {
      return;
    }
    const timeout = window.setTimeout(() => {
      if (cancelledRef.current || finishedRef.current) {
        return;
      }
      finishedRef.current = true;
      applyLocalSetupAccount({
        username,
        email,
        displayName: username.trim(),
      });
      router.push(homePath());
    }, analyzeHoldMs);
    return () => window.clearTimeout(timeout);
  }, [step, progress, analyzeHoldMs, username, email, router]);

  function requestExit() {
    if (finishedRef.current) {
      return;
    }
    setExitOpen(true);
  }

  function confirmExit() {
    cancelledRef.current = true;
    setExitOpen(false);
    router.push("/");
  }

  function goBack() {
    if (backDisabled) {
      return;
    }
    setFormError(null);
    setUsernameFieldError(null);
    if (step === "user-info") {
      setStep("welcome");
    }
  }

  async function goNext() {
    if (nextDisabled) {
      return;
    }
    if (step === "welcome") {
      setStep("user-info");
      return;
    }
    if (step === "user-info") {
      const error = userInfoError({ username, email, password });
      if (error) {
        setFormError(error);
        return;
      }

      const reservedOrFormat = usernameBlurError(username);
      if (reservedOrFormat) {
        setUsernameFieldError(reservedOrFormat);
        setFormError(reservedOrFormat);
        return;
      }

      setCheckingUsername(true);
      setFormError(null);
      try {
        const availabilityError = await checkUsernameAvailabilityOnNext(username);
        if (availabilityError) {
          setFormError(availabilityError);
          return;
        }
        setUsernameFieldError(null);
        setStep("analyzing");
      } finally {
        setCheckingUsername(false);
      }
    }
  }

  function onUserInfoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void goNext();
  }

  function onUsernameBlur() {
    setUsernameFieldError(usernameBlurError(username));
  }

  const handle = normalizeUsername(username);

  return (
    <div className="flex min-h-dvh items-center justify-center p-3">
      <div
        className="win-window win-wizard flex w-[640px] max-w-full flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="win-titlebar">
          <ComputerIcon size={16} />
          <span id={titleId} className="min-w-0 flex-1 truncate">
            {WIZARD_TITLE}
          </span>
        </div>

        <div className="flex min-h-[360px]">
          <div className="flex w-[140px] shrink-0 items-stretch bg-win-teal">
            <SetupSidebarArt className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1 bg-win-face px-5 py-4 text-[15px] leading-[1.45]">
            {step === "welcome" ? <WelcomeStep /> : null}
            {step === "user-info" ? (
              <UserInfoStep
                username={username}
                email={email}
                password={password}
                handle={handle}
                formError={formError}
                usernameFieldError={usernameFieldError}
                checkingUsername={checkingUsername}
                onUsernameChange={(value) => {
                  setUsername(value);
                  setFormError(null);
                  setUsernameFieldError(null);
                }}
                onUsernameBlur={onUsernameBlur}
                onEmailChange={(value) => {
                  setEmail(value);
                  setFormError(null);
                }}
                onPasswordChange={(value) => {
                  setPassword(value);
                  setFormError(null);
                }}
                onSubmit={onUserInfoSubmit}
              />
            ) : null}
            {step === "analyzing" ? (
              <AnalyzingStep progress={progress} />
            ) : null}
          </div>
        </div>

        <div
          className="mx-2 mt-1 h-[2px] border-b border-win-white border-t border-win-dark"
          aria-hidden="true"
        />

        <div className="flex justify-end gap-2 px-4 py-3">
          <button
            type="button"
            className="win-raised win-btn"
            disabled={backDisabled}
            accessKey="b"
            aria-label="Back"
            onClick={goBack}
          >
            &lt; <u>B</u>ack
          </button>
          <button
            type="button"
            className={`win-raised win-btn ${nextIsDefault ? "win-btn-default" : ""}`}
            disabled={nextDisabled}
            accessKey="n"
            aria-label="Next"
            onClick={() => {
              void goNext();
            }}
          >
            {checkingUsername ? "Checking…" : (
              <>
                <u>N</u>ext &gt;
              </>
            )}
          </button>
          <button
            type="button"
            className={`win-raised win-btn ${step === "analyzing" ? "win-btn-default" : ""}`}
            accessKey="c"
            aria-label="Cancel"
            onClick={requestExit}
          >
            <u>C</u>ancel
          </button>
        </div>
      </div>

      {exitOpen ? (
        <ConfirmDialog
          title={WIZARD_TITLE}
          message="Are you sure you want to exit Setup?"
          confirmLabel="Yes"
          cancelLabel="No"
          onConfirm={confirmExit}
          onCancel={() => setExitOpen(false)}
        />
      ) : null}
    </div>
  );
}

function WelcomeStep() {
  return (
    <div>
      <h1 className="win-wizard-title mb-3">{SPOKEN_NAME} Setup Wizard</h1>
      <p>
        Welcome to the {SPOKEN_NAME} Setup Wizard, which will guide you through
        setting up your personal computer. To begin, click Next.
      </p>
      <p className="mt-4">The next three parts of Setup are:</p>
      <ol className="mt-2 space-y-1 pl-1">
        <li className="flex gap-2 font-bold">
          <span aria-hidden="true">▶</span>
          <span>1. Collecting information about you</span>
        </li>
        <li className="flex gap-2 pl-[1.15rem]">
          <span>2. Preparing your personal computer</span>
        </li>
        <li className="flex gap-2 pl-[1.15rem]">
          <span>3. Starting your personal computer</span>
        </li>
      </ol>
      <p className="mt-6">
        Note: You do not need an account to visit someone else&apos;s PC and
        read. Setup is how you get a PC of your own.
      </p>
    </div>
  );
}

function UserInfoStep({
  username,
  email,
  password,
  handle,
  formError,
  usernameFieldError,
  checkingUsername,
  onUsernameChange,
  onUsernameBlur,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: {
  username: string;
  email: string;
  password: string;
  handle: string;
  formError: string | null;
  usernameFieldError: string | null;
  checkingUsername: boolean;
  onUsernameChange: (value: string) => void;
  onUsernameBlur: () => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <fieldset disabled={checkingUsername} className="min-w-0 border-0 p-0">
      <h1 className="win-wizard-title mb-3">User Information</h1>
      <p>
        Type a username for this computer. You can also type an e-mail address
        and a password so you can log on later.
      </p>
      <p className="mt-3 text-win-dark">
        Your username becomes your permanent URL.
      </p>
      <div className="mt-5 grid grid-cols-[104px_minmax(0,1fr)] items-start gap-x-3 gap-y-3">
        <label htmlFor="setup-username" className="pt-1">
          <u>U</u>sername:
        </label>
        <div className="min-w-0">
          <input
            id="setup-username"
            name="username"
            autoComplete="username"
            accessKey="u"
            aria-label="Username"
            aria-invalid={usernameFieldError ? true : undefined}
            aria-describedby={
              usernameFieldError ? "setup-username-error" : undefined
            }
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            onBlur={onUsernameBlur}
            className="win-sunken w-full bg-win-white px-1.5 py-1 text-[15px] text-win-black outline-none"
          />
          {usernameFieldError ? (
            <p id="setup-username-error" className="mt-1" role="alert">
              {usernameFieldError}
            </p>
          ) : null}
        </div>
        <label htmlFor="setup-email" className="pt-1">
          <u>E</u>-mail:
        </label>
        <input
          id="setup-email"
          name="email"
          type="email"
          autoComplete="email"
          accessKey="e"
          aria-label="E-mail"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="win-sunken bg-win-white px-1.5 py-1 text-[15px] text-win-black outline-none"
        />
        <label htmlFor="setup-password">
          <u>P</u>assword:
        </label>
        <input
          id="setup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          accessKey="p"
          aria-label="Password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          className="win-sunken bg-win-white px-1.5 py-1 text-[15px] text-win-black outline-none"
        />
      </div>
      <p className="mt-3 text-win-dark">
        This computer will appear as{" "}
        <code className="text-win-black">
          C:\users\{handle || "…"}
        </code>{" "}
        on the network.
      </p>
      {formError && formError !== usernameFieldError ? (
        <p className="mt-3" role="alert">
          {formError}
        </p>
      ) : null}
      </fieldset>
    </form>
  );
}

function AnalyzingStep({ progress }: { progress: number }) {
  return (
    <div>
      <h1 className="win-wizard-title mb-3">Analyzing Your Computer</h1>
      <p>Setup is preparing your personal computer.</p>
      <p className="mt-3">{analyzingStatus(progress)}</p>
      <p className="mt-6">
        Note: This may take a few seconds. Do not turn off your computer.
      </p>
      <div className="mt-8">
        <div className="mb-1">Progress...</div>
        <div
          className="win-sunken relative h-[22px] bg-win-white"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Setup progress"
        >
          <div
            className="h-full bg-win-navy"
            style={{ width: `${progress}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-end pr-2 text-[13px]">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
