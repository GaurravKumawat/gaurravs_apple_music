import { useEffect, useRef } from "react";
import { lookupHighResArtwork } from "./itunes-artwork";

/**
 * Walks every track in `tracks` and patches each thumbnail with the iTunes
 * HD variant as iTunes lookups resolve. The page paints immediately with
 * whatever artwork the caller already supplied; this only upgrades the URL
 * after-the-fact. Safe to call on every render — it self-deduplicates via
 * the shared cache inside `lookupHighResArtwork`.
 *
 * @param onArtwork  Called with (trackId, newThumbnail) whenever an upgrade
 *                   succeeds. The caller is expected to update its own list
 *                   state (and therefore the rendered <img src>).
 */
export function useUpgradeArtwork(
  tracks: Array<{ id: string; title: string; artist: string; thumbnail: string }>,
  onArtwork: (id: string, newThumb: string) => void,
): void {
  // Per-instance dedupe so we don't re-pump the same track every time the
  // parent re-renders with a fresh array reference. Critically, we mount the
  // dedupe Set ONCE — never reset it — so the pump never restarts in a loop
  // when onArtwork mutates state and re-renders us with a new tracks array.
  const seenRef = useRef<Set<string>>(new Set());
  const onArtworkRef = useRef(onArtwork);
  useEffect(() => {
    onArtworkRef.current = onArtwork;
  }, [onArtwork]);

  // Only react to NEW track IDs arriving in the array. We extract them in
  // render (cheap) and only restart the pump when the set of unseen ids
  // actually grows.
  const freshIds: string[] = [];
  for (const t of tracks) {
    if (!t?.title || !t?.artist) continue;
    const key = `${t.title}::${t.artist}`;
    if (seenRef.current.has(key)) continue;
    // Mark immediately so re-entry during render can't double-add.
    seenRef.current.add(key);
    freshIds.push(t.id);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (freshIds.length === 0) return;

    // Resolve ids → Track objects from the latest props snapshot.
    const byId = new Map(tracks.map((t) => [t.id, t]));
    const fresh: Array<{ id: string; title: string; artist: string }> = [];
    for (const id of freshIds) {
      const t = byId.get(id);
      if (t && t.title && t.artist) fresh.push({ id: t.id, title: t.title, artist: t.artist });
    }
    if (fresh.length === 0) return;

    let cancelled = false;
    const MAX_CONCURRENT = 4;
    let cursor = 0;
    let active = 0;

    const pump = () => {
      while (!cancelled && active < MAX_CONCURRENT && cursor < fresh.length) {
        const t = fresh[cursor++];
        active++;
        lookupHighResArtwork(t.title, t.artist)
          .then((hd) => {
            if (!cancelled && hd) onArtworkRef.current(t.id, hd);
          })
          .finally(() => {
            active--;
            pump();
          });
      }
    };
    pump();

    return () => {
      cancelled = true;
    };
    // Intentionally depend ONLY on `freshIds.join('|')`. We never include
    // `tracks` or `onArtwork` — every successful upgrade mutates parent
    // state, which would otherwise tear down and rebuild the pump on each
    // resolution, causing cascading re-renders and an unresponsive page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshIds.join("|")]);
}
