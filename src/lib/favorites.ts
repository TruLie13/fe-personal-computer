import type { FavoritePc, NetworkUserId } from "@/types/network";

export const FAVORITES_STORAGE_KEY = "personal-computer-favorites-v1";

export function loadFavorites(): FavoritePc[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const favorites: FavoritePc[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as FavoritePc).userId === "string" &&
        typeof (item as FavoritePc).addedAt === "string"
      ) {
        favorites.push({
          userId: (item as FavoritePc).userId,
          addedAt: (item as FavoritePc).addedAt,
        });
      }
    }
    return favorites;
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: FavoritePc[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

export function isFavorite(
  favorites: FavoritePc[],
  userId: NetworkUserId,
): boolean {
  return favorites.some((favorite) => favorite.userId === userId);
}
