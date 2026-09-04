"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LocalPcRow,
  NetworkPcRow,
} from "@/components/desktop/NetworkPcRow";
import { isFavorite } from "@/lib/favorites";
import { pullNetworkNeighborhoodUsers } from "@/lib/networkDirectory";
import { NETWORK_USERS } from "@/lib/networkSeed";
import { useDesktopStore } from "@/store/desktopStore";
import type { NetworkUser } from "@/types/network";

export function NetworkNeighborhood() {
  const favorites = useDesktopStore((state) => state.favorites);
  const addFavorite = useDesktopStore((state) => state.addFavorite);
  const removeFavorite = useDesktopStore((state) => state.removeFavorite);
  const [networkUsers, setNetworkUsers] = useState<NetworkUser[]>(NETWORK_USERS);
  const [directoryStatus, setDirectoryStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");

  useEffect(() => {
    let cancelled = false;
    setDirectoryStatus("loading");
    void pullNetworkNeighborhoodUsers()
      .then((users) => {
        if (cancelled) {
          return;
        }
        setNetworkUsers(users);
        setDirectoryStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setDirectoryStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const claimedCount = networkUsers.length - NETWORK_USERS.length;

  const usersById = useMemo(() => {
    const map = new Map<string, NetworkUser>();
    for (const user of networkUsers) {
      map.set(user.id, user);
    }
    return map;
  }, [networkUsers]);

  const favoriteUsers = favorites
    .map((favorite) => usersById.get(favorite.userId))
    .filter((user): user is NetworkUser => Boolean(user));

  return (
    <div className="flex h-full min-h-0 flex-col bg-win-face text-[12px]">
      <div className="border-b border-win-dark px-2 py-1 text-win-dark">
        Network Neighborhood — browse PCs and keep Favorites
        {directoryStatus === "loading" ? " (loading network…)" : null}
        {directoryStatus === "error"
          ? " (could not reach network directory)"
          : null}
        {directoryStatus === "ready" && claimedCount > 0
          ? ` (${claimedCount} claimed PC${claimedCount === 1 ? "" : "s"} online)`
          : null}
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
              {networkUsers.map((user) => {
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
