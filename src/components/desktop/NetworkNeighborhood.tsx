"use client";

import { ComputerIcon } from "@/components/desktop/icons";
import { isFavorite } from "@/lib/favorites";
import { NETWORK_USERS, remoteDesktopPath } from "@/lib/networkSeed";
import { useDesktopStore } from "@/store/desktopStore";
import type { NetworkUserId } from "@/types/network";

export function NetworkNeighborhood() {
  const favorites = useDesktopStore((state) => state.favorites);
  const visitRemotePc = useDesktopStore((state) => state.visitRemotePc);
  const addFavorite = useDesktopStore((state) => state.addFavorite);
  const removeFavorite = useDesktopStore((state) => state.removeFavorite);

  const favoriteUsers = favorites
    .map((favorite) =>
      NETWORK_USERS.find((user) => user.id === favorite.userId),
    )
    .filter((user): user is (typeof NETWORK_USERS)[number] => Boolean(user));

  const openPc = (userId: NetworkUserId) => {
    visitRemotePc(userId);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-win-face text-[12px]">
      <div className="border-b border-win-dark px-2 py-1 text-win-dark">
        Network Neighborhood — browse PCs and keep Favorites
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2">
        <section className="mb-3">
          <h2 className="mb-1 font-bold">Favorites</h2>
          <div className="win-sunken bg-white p-1">
            {favoriteUsers.length === 0 ? (
              <p className="px-1 py-2 text-win-dark">
                No favorites yet. Add a PC below to pin it here.
              </p>
            ) : (
              <ul>
                {favoriteUsers.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center gap-2 px-1 py-1 hover:bg-win-face-light"
                  >
                    <ComputerIcon size={16} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{user.displayName}</div>
                      <div className="truncate text-win-dark">
                        {remoteDesktopPath(user)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="win-raised px-2 py-0.5"
                      onClick={() => openPc(user.id)}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="win-raised px-2 py-0.5"
                      onClick={() => removeFavorite(user.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-1 font-bold">Entire Network</h2>
          <div className="win-sunken bg-white p-1">
            <ul>
              <li className="flex items-center gap-2 px-1 py-1 text-win-dark">
                <ComputerIcon size={16} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-black">This PC (you)</div>
                  <div>Local desktop — use Go Home while visiting others</div>
                </div>
              </li>
              {NETWORK_USERS.map((user) => {
                const favorited = isFavorite(favorites, user.id);
                return (
                  <li
                    key={user.id}
                    className="flex items-center gap-2 px-1 py-1 hover:bg-win-face-light"
                  >
                    <ComputerIcon size={16} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{user.displayName}</div>
                      <div className="truncate text-win-dark">
                        {remoteDesktopPath(user)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="win-raised px-2 py-0.5"
                      onClick={() => openPc(user.id)}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="win-raised px-2 py-0.5"
                      onClick={() =>
                        favorited
                          ? removeFavorite(user.id)
                          : addFavorite(user.id)
                      }
                    >
                      {favorited ? "Unfavorite" : "Add to Favorites"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
