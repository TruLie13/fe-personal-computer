import { useCallback, useEffect, useRef, useState } from "react";

/** Brief "Saved" indicator; auto-clears after `durationMs`. */
export function useSavedFlash(durationMs = 1200): {
  savedFlash: boolean;
  flashSaved: () => void;
} {
  const [savedFlash, setSavedFlash] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setSavedFlash(false);
      timeoutRef.current = null;
    }, durationMs);
  }, [durationMs]);

  return { savedFlash, flashSaved };
}
