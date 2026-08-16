"use client";

import {
  LocalPcRow,
  NetworkPcRow,
} from "@/components/desktop/NetworkPcRow";
import { isFavorite } from "@/lib/favorites";
import { NETWORK_USERS } from "@/lib/networkSeed";
import { useDesktopStore } from "@/store/desktopStore";

export function NetworkNeighborhood() {
  const favorites = useDesktopStore((state) => state.favorites);
  const addFavorite = useDesktopStore((state) => state.addFavorite);
  const removeFavorite = useDesktopStore((state) => state.removeFavorite);

  const favoriteUsers = favorites
    .map((favorite) =>
      NETWORK_USERS.find((user) => user.id === favorite.userId),
    )
    .filter((user): user is (typeof NETWORK_USERS)[number] => Boolean(user));

  return (
    <div className="flex h-full min-h-0 flex-col bg-win-face text-[12px]">
      <div className="border-b border-win-dark px-2 py-1 text-win-dark">
        Network Neighborhood — browse PCs and keep Favorites
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2">
        <section className="mb-3">
          <h2 className="mb-1 font-bold">Favorites</h2>
          <div className="win-sunken bg-win-paper p-1 text-win-ink">
            {favoriteUsers.length === 0 ? (
              <p className="px-1 py-2 text-win-paper-muted">
                No favorites yet. Add a PC below to pin it here.
              </p>
            ) : (
              <ul>
                {favoriteUsers.map((user) => (
                  <NetworkPcRow
                    key={user.id}
                    user={user}
                    actions={
                      <button
                        type="button"
                        className="win-raised px-2 py-0.5"
                        onClick={() => removeFavorite(user.id)}
                      >
                        Remove
                      </button>
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-1 font-bold">Entire Network</h2>
          <div className="win-sunken bg-win-paper p-1 text-win-ink">
            <ul>
              <LocalPcRow
                title="This PC (you)"
                subtitle="Local desktop — use Go Home while visiting others"
              />
              {NETWORK_USERS.map((user) => {
                const favorited = isFavorite(favorites, user.id);
                return (
                  <NetworkPcRow
                    key={user.id}
                    user={user}
                    actions={
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
                    }
                  />
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
