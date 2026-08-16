"use client";

import { useEffect, useState } from "react";
import { ProfileAvatar } from "@/components/desktop/ProfileAvatar";
import { useSavedFlash } from "@/hooks/useSavedFlash";
import { isFavorite } from "@/lib/favorites";
import { getNetworkUser } from "@/lib/networkSeed";
import { computerLabel } from "@/lib/profile";
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
  const goHome = useDesktopStore((state) => state.goHome);

  const isRemote = viewMode === "remote" && remoteUserId != null;
  const remoteUser = isRemote ? getNetworkUser(remoteUserId) : undefined;

  const displayName = remoteUser?.displayName ?? localProfile.displayName;
  const computerName = remoteUser?.computerName ?? localProfile.computerName;
  const avatarUrl = remoteUser?.avatarUrl ?? localProfile.avatarUrl;
  const seedBio = remoteUser?.bio ?? localProfile.bio;

  const [draftName, setDraftName] = useState(localProfile.displayName);
  const [draftBio, setDraftBio] = useState(localProfile.bio);
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

  const onSaveLocal = () => {
    updateLocalProfile({
      displayName: draftName,
      bio: draftBio,
    });
    flashSaved();
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
                  onChange={(event) => setDraftName(event.target.value)}
                  maxLength={40}
                  spellCheck={false}
                />
              </label>
              <div className="mt-1 text-win-dark">
                {computerLabel(draftName.trim() || displayName)} · \\
                <strong className="text-win-black">{computerName}</strong>
              </div>
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
          <textarea
            className="win-sunken min-h-0 flex-1 resize-none bg-win-paper p-2 leading-5 text-win-ink outline-none"
            value={draftBio}
            onChange={(event) => setDraftBio(event.target.value)}
            spellCheck={false}
            aria-label="Bio"
          />
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
            <button
              type="button"
              className="win-raised px-2 py-0.5"
              onClick={goHome}
            >
              Go Home
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="win-raised px-3 py-0.5"
              onClick={onSaveLocal}
            >
              Save
            </button>
            {savedFlash ? <span className="text-win-dark">Saved</span> : null}
          </>
        )}
      </div>
    </div>
  );
}
