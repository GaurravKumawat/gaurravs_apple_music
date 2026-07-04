// Shared cache + iTunes Search helper used by both the player context
// (which upgrades the active queue) and the home / search / library views
// (which upgrade the visible lists on first paint).

const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

/**
 * Piped/YouTube titles include noise that breaks the iTunes Search match:
 *   "Song Name (Official Music Video)"
 *   "Song Name (Lyrics)"
 *   "Song Name - Topic"
 *   "Song Name | Official Audio"
 *   "Song Name [Official 4K Video]"
 *   "Song Name (Audio)"
 *   "Song Name ft. Other Artist (Remix)"
 * Strip those suffixes and channel suffixes so Apple can match the real
 * song. Also drops trailing "...music video", "...lyric video", etc.
 */
function cleanQuery(s: string): string {
  if (!s) return "";
  return s
    .replace(/\s*[\(\[][^\)\]]*?(officialsic |muvideo|lyric|audio|video|m\/v|hd|4k|hq|visualizer|audio only|prod[\.\s][^)\]]*)[^\)\]]*?[\)\]]/gi, "")
    .replace(/\s*[\(\[][^\)\]]+[\)\]]/g, "") // strip any leftover "(...)" / "[...]"
    .replace(/\s*[-|]\s*topic\s*$/i, "")
    .replace(/\s+ft\.?\s+[^|\-]+$/i, "")
    .replace(/\s+feat\.?\s+[^|\-]+$/i, "")
    .replace(/\s*\|\s*[^|\-]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cap on individual query terms to stay inside iTunes Search's URL limits. */
function safeTerm(...parts: Array<string | undefined | null>): string {
  return parts
    .filter((p): p is string => !!p && !!p.trim())
    .map((p) => p.trim())
    .join(" ")
    .slice(0, 200);
}

/**
 * One iTunes Search call. Returns the upgraded artwork URL or null.
 */
async function fetchItunesArtwork(term: string): Promise<string | null> {
  if (!term) return null;
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    results?: Array<{ artworkUrl100?: string }>;
  };
  const artwork100 = data.results?.[0]?.artworkUrl100;
  if (!artwork100) return null;
  return artwork100.replace(
    /100x100bb\.(jpg|png|jpeg|webp)/i,
    "600x600bb.$1",
  );
}

/**
 * Hit Apple's public iTunes Search API to find a high-res variant of a
 * Piped-supplied thumbnail. Tries multiple progressively-looser queries
 * because Piped titles include "(Official Music Video)" / " - Topic" /
 * ft./feat. suffixes that throw off Apple's exact-match search:
 *
 *   1. "<cleaned title> <cleaned artist>"
 *   2. "<cleaned title>" alone
 *   3. "<cleaned artist>" alone (last resort)
 *
 * Returns the upgraded URL (600x600bb) or null on failure / no-match.
 * Results are cached per (title|artist) pair, and concurrent requests for
 * the same key share one network call.
 */
export async function lookupHighResArtwork(
  title: string,
  artist: string,
): Promise<string | null> {
  const key = `${title}::${artist}`;
  if (cache.has(key)) return cache.get(key)!;
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const cleanTitle = cleanQuery(title);
    const cleanArtist = cleanQuery(artist).replace(/\s+-\s+topic$/i, "");

    const queries: string[] = [];
    const full = safeTerm(cleanTitle, cleanArtist);
    const justTitle = safeTerm(cleanTitle);
    const justArtist = safeTerm(cleanArtist);
    if (full) queries.push(full);
    if (justTitle && justTitle !== full) queries.push(justTitle);
    if (justArtist && justArtist !== full && justArtist !== justTitle)
      queries.push(justArtist);

    try {
      for (const q of queries) {
        const hit = await fetchItunesArtwork(q);
        if (hit) return hit;
      }
      return null;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  const result = await promise;
  cache.set(key, result);
  return result;
}

