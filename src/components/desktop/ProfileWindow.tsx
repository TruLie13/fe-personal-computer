"use client";

import { useEffect, useState } from "react";
import { ProfileAvatar } from "@/components/desktop/ProfileAvatar";
import { useSavedFlash } from "@/hooks/useSavedFlash";
import { isFavorite } from "@/lib/favorites";
import { getNetworkUser } from "@/lib/networkSeed";
import {
  clampBio,
  clampDisplayName,
  computerLabel,
  MAX_BIO_CHARS,
  MAX_DISPLAY_NAME_CHARS,
} from "@/lib/profile";
import { saveRemoteProfileNow } from "@/lib/remoteDesktopPersist";
import { currentUsername, profilePath } from "@/lib/seo/paths";
import { loadLocalSession } from "@/lib/setupAccount";
import { useGuestChrome } from "@/hooks/useGuestChrome";
import { useDesktopStore } from "@/store/desktopStore";

export function ProfileWindow() {
  const viewMode = useDesktopStore((state) => state.viewMode);
  const remoteUserId = useDesktopStore((state) => state.remoteUserId);
  const localProfile = useDesktopStore((state) => state.localProfile);
  const favorites = useDesktopStore((state) => state.favorites);
  const updateLocalProfile = useDesktopStore(
    (state) => state.updateLocalProfile,
  );
  const addFavorite = useDesktopStore((state) => state.addFavorite);
  const removeFavorite = useDesktopStore((state) => state.removeFavorite);
  const { showGuestChrome, goHome, goToSetup, goToSignIn } = useGuestChrome();

  const isRemote = viewMode === "remote" && remoteUserId != null;
  const remoteProfile = useDesktopStore((state) => state.remoteProfile);
  const seedUser = isRemote ? getNetworkUser(remoteUserId) : undefined;
  const remoteUser = seedUser
    ? seedUser
    : isRemote && remoteProfile
      ? {
          id: remoteUserId!,
          displayName: remoteProfile.displayName,
          computerName: remoteProfile.computerName,
          bio: remoteProfile.bio,
          avatarColor: remoteProfile.avatarColor,
          avatarUrl: remoteProfile.avatarUrl,
        }
      : undefined;

  const displayName = remoteUser?.displayName ?? localProfile.displayName;
  const computerName = remoteUser?.computerName ?? localProfile.computerName;
  const avatarUrl = remoteUser?.avatarUrl ?? localProfile.avatarUrl;
  const seedBio = remoteUser?.bio ?? localProfile.bio;

  const [draftName, setDraftName] = useState(localProfile.displayName);
  const [draftBio, setDraftBio] = useState(localProfile.bio);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { savedFlash, flashSaved } = useSavedFlash();

  useEffect(() => {
    if (!isRemote) {
      setDraftName(localProfile.displayName);
      setDraftBio(localProfile.bio);
    }
  }, [isRemote, localProfile.displayName, localProfile.bio]);

  const favorited =
    isRemote && remoteUserId
      ? isFavorite(favorites, remoteUserId)
      : false;

  const publicPath = profilePath(
    loadLocalSession()?.username ?? currentUsername(),
  );

  const bioCount = draftBio.length;
  const atBioLimit = bioCount >= MAX_BIO_CHARS;

  const onSaveLocal = () => {
    setSaveError(null);
    setSaving(true);
    updateLocalProfile({
      displayName: draftName,
      bio: draftBio,
    });
    const profile = useDesktopStore.getState().localProfile;
    void saveRemoteProfileNow(profile).then((status) => {
      setSaving(false);
      if (status === "saved" || status === "suppressed") {
        flashSaved();
        return;
      }
      if (status === "queued") {
        setSaveError(
          "Saved on this PC only. Sign in again (Start → Log on) so Firebase Auth can sync your bio.",
        );
        return;
      }
      setSaveError(
        "Could not sync profile to the network. Is the Auth/Firestore emulator running?",
      );
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-win-face text-[12px]">
      <div className="flex items-start gap-3 border-b border-win-dark p-3">
        <ProfileAvatar
          displayName={displayName}
          avatarUrl={avatarUrl}
          size={48}
        />
        <div className="min-w-0 flex-1">
          {isRemote ? (
            <>
              <div className="text-[14px] font-bold">{displayName}</div>
              <div className="text-win-dark">
                \\
                <strong className="text-win-black">{computerName}</strong>
                \Desktop
              </div>
              <div className="mt-1 text-win-dark">Read-only visit</div>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-win-dark">Display name</span>
                <input
                  className="win-sunken bg-win-paper px-1 py-0.5 text-win-ink outline-none"
                  value={draftName}
                  onChange={(event) =>
                    setDraftName(clampDisplayName(event.target.value))
                  }
                  maxLength={MAX_DISPLAY_NAME_CHARS}
                  spellCheck={false}
                />
              </label>
              <div className="mt-1 text-win-dark">
                {computerLabel(displayName)} · \\
                <strong className="text-win-black">{computerName}</strong>
              </div>
              <p className="mt-2 text-win-dark">
                Your URL{" "}
                <code className="text-win-black">{publicPath}</code> is permanent
                and will not change. You can edit your display name anytime.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-2">
        <div className="mb-1 font-bold">Bio</div>
        {isRemote ? (
          <div className="win-sunken min-h-0 flex-1 overflow-auto whitespace-pre-wrap bg-win-paper p-2 leading-5 text-win-ink">
            {seedBio}
          </div>
        ) : (
          <>
            <textarea
              className="win-sunken min-h-0 flex-1 resize-none bg-win-paper p-2 leading-5 text-win-ink outline-none"
              value={draftBio}
              onChange={(event) => setDraftBio(clampBio(event.target.value))}
              spellCheck={false}
              aria-label="Bio"
              maxLength={MAX_BIO_CHARS}
            />
            <div
              className="flex shrink-0 justify-end border-t border-win-dark px-1 py-0.5 text-[11px] text-win-dark"
              aria-live="polite"
            >
              <span aria-label="Bio character count">
                {bioCount}/{MAX_BIO_CHARS}
                {atBioLimit ? " (limit reached)" : ""}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-win-dark px-2 py-2">
        {isRemote && remoteUserId ? (
          <>
            <button
              type="button"
              className="win-raised px-2 py-0.5"
              onClick={() =>
                favorited
                  ? removeFavorite(remoteUserId)
                  : addFavorite(remoteUserId)
              }
            >
              {favorited ? "Remove from Network" : "Add to Network"}
            </button>
            {showGuestChrome ? (
              <>
                <button
                  type="button"
                  className="win-raised px-2 py-0.5 font-bold"
                  onClick={goToSetup}
                >
                  Get your PC
                </button>
                <button
                  type="button"
                  className="win-raised px-2 py-0.5"
                  onClick={goToSignIn}
                >
                  Sign in
                </button>
              </>
            ) : (
              <button
                type="button"
                className="win-raised px-2 py-0.5"
                onClick={goHome}
              >
                Go Home
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              className="win-raised px-3 py-0.5"
              disabled={saving}
              onClick={onSaveLocal}
            >
              Save
            </button>
            {savedFlash ? <span className="text-win-dark">Saved</span> : null}
            {saveError ? (
              <span className="max-w-[280px] text-win-dark" role="alert">
                {saveError}
              </span>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
