import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://api.piped.private.coffee",
  "https://pipedapi.reallyaweso.me",
];

export type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  views?: number;
};

export function formatViews(n?: number): string {
  if (!n || n <= 0) return "";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${n}`;
}

async function tryInstances<T>(fn: (base: string) => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (const base of PIPED_INSTANCES) {
    try {
      return await fn(base);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("All instances failed");
}

function normalizeThumb(url: string): string {
  if (!url) return url;

  // YouTube / YouTube Music thumbnails:
  //   .../vi/<id>/default.jpg     (120x90)
  //   .../vi/<id>/mqdefault.jpg   (320x180)
  //   .../vi/<id>/hqdefault.jpg   (480x360)
  //   .../vi/<id>/sddefault.jpg   (640x480)
  //   .../vi/<id>/maxresdefault.jpg (1280x720)
  // Promote everything to maxresdefault, falling back to sddefault if the
  // maxres variant 404s (YouTube returns a placeholder for some videos).
  const ytMatch = url.match(/\/vi\/([^/]+)\/[^/]+\.(?:jpg|webp|png)(?:\?.*)?$/i);
  if (ytMatch) {
    return `https://i.ytimg.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  }
  // Also handle the common "?vi=..." or "/vi_webp/..." style URLs Piped returns.
  const ytAny = url.match(/(?:i\.ytimg\.com|youtube\.com)\/.+?\/vi(?:_webp)?\/([^/]+)/);
  if (ytAny) {
    return `https://i.ytimg.com/vi/${ytAny[1]}/maxresdefault.jpg`;
  }

  // Apple Music / iTunes API artwork URLs look like:
  //   https://is1-ssl.mzstatic.com/image/thumb/.../source/{w}x{h}bb.jpg
  //   or .../{w}x{h}.jpg  (no "bb" suffix)
  // Force a high-resolution variant.
  const appleMatch = url.match(/^(.*\/)(\d+)x(\d+)(bb)?(\.[a-zA-Z0-9]+)(\?.*)?$/);
  if (appleMatch) {
    return `${appleMatch[1]}800x800bb${appleMatch[5]}${appleMatch[6] ?? ""}`;
  }

  return url;
}

/**
 * Resolve an artwork URL to the highest-quality variant we can serve.
 * YouTube "maxresdefault" sometimes 404s (returns a 120x90 grey placeholder),
 * so we expose a two-step variant: caller asks for maxres, and on `onError`
 * swaps in sddefault. Apple Music URLs are upgraded to 800x800bb in place.
 */
export function upgradeArtwork(url: string): string {
  return normalizeThumb(url);
}

/** Fallback URL used by <img onError> when YouTube maxres is missing. */
export function fallbackArtwork(url: string): string {
  const m = url.match(/\/vi\/([^/]+)\/[^/]+\.(?:jpg|webp|png)/i);
  if (m) return `https://i.ytimg.com/vi/${m[1]}/sddefault.jpg`;
  return url;
}

export const searchMusic = createServerFn({ method: "POST" })
  .inputValidator(z.object({ query: z.string().min(1).max(200) }))
  .handler(async ({ data }) => {
    const results = await tryInstances(async (base) => {
      const url = `${base}/search?q=${encodeURIComponent(data.query)}&filter=music_songs`;
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`status ${res.status}`);
      return (await res.json()) as { items: any[] };
    });

    const tracks: Track[] = (results.items || [])
      .filter((it) => it.url && (it.type === "stream" || it.url.includes("watch?v=")))
      .map((it) => {
        const id = (it.url as string).split("watch?v=")[1]?.split("&")[0] ?? "";
        return {
          id,
          title: it.title ?? "Unknown",
          artist: it.uploaderName ?? it.uploader ?? "Unknown Artist",
          duration: Number(it.duration ?? 0),
  thumbnail: upgradeArtwork(it.thumbnail ?? ""),
          views: Number(it.views ?? 0) || undefined,
        };
      })
      .filter((t) => t.id);

    return { tracks };
  });

/** Type returned by /streams/{id} that we actually consume. */
type PipedStreamResponse = {
  audioStreams?: Array<{
    url: string;
    mimeType?: string;
    bitrate?: number;
    contentLength?: string;
    quality?: string;
  }>;
  videoStreams?: unknown[];
  title?: string;
  uploader?: string;
  uploaderName?: string;
  duration?: number;
  thumbnailUrl?: string;
  // Piped sometimes returns the thumbnail under "thumbnail" too.
  thumbnail?: string;
};

/**
 * Resolve a YouTube video id to a direct audio stream URL using Piped's
 * /streams/{id} endpoint. We try each Piped instance in order and return
 * the highest-bitrate audio stream URL we can find.
 *
 * The endpoint is hit on the server (createServerFn) so the browser never
 * has to deal with CORS for the *metadata* fetch — though the resulting
 * stream URL is consumed in the browser for both live playback and caching.
 */
export const getStreamUrl = createServerFn({ method: "POST" })
  .inputValidator(z.object({ videoId: z.string().min(1).max(32) }))
  .handler(async ({ data }) => {
    const json = await tryInstances(
      async (base) => {
        const url = `${base}/streams/${encodeURIComponent(data.videoId)}`;
        const res = await fetch(url, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`status ${res.status}`);
        return (await res.json()) as PipedStreamResponse;
      },
    );

    const streams = (json.audioStreams ?? [])
      .filter((s) => s && s.url)
      // Prefer higher bitrate for the cache so re-encodes sound better.
      .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));

    if (streams.length === 0) {
      throw new Error("No audio streams returned from Piped");
    }

    return {
      streamUrl: streams[0].url,
      mimeType: streams[0].mimeType ?? "audio/mpeg",
      contentLength: streams[0].contentLength ?? null,
      bitrate: streams[0].bitrate ?? null,
    };
  });

export const getTrending = createServerFn({ method: "GET" }).handler(async () => {
  const queries = ["top hits 2026", "billboard hot 100", "trending music", "new releases"];
  const q = queries[Math.floor(Math.random() * queries.length)];
  const results = await tryInstances(async (base) => {
    const url = `${base}/search?q=${encodeURIComponent(q)}&filter=music_songs`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as { items: any[] };
  });
  const tracks: Track[] = (results.items || [])
    .slice(0, 20)
    .map((it) => {
      const id = (it.url as string)?.split("watch?v=")[1]?.split("&")[0] ?? "";
      return {
        id,
        title: it.title ?? "",
        artist: it.uploaderName ?? "",
        duration: Number(it.duration ?? 0),
        thumbnail: upgradeArtwork(it.thumbnail ?? ""),
        views: Number(it.views ?? 0) || undefined,
      };
    })
    .filter((t) => t.id);
  return { tracks };
});
