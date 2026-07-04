import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Track } from "./music.functions";
import { lookupHighResArtwork } from "./itunes-artwork";
import {
  cacheTrack as cacheTrackOffline,
  getCachedObjectUrl,
  isCached as isTrackCached,
  onCacheEvent,
  type CacheEvent,
} from "./offline-cache";

export type RepeatMode = "off" | "all" | "one";

type PlayerState = {
  queue: Track[];
  index: number;
  current: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  showFull: boolean;
  ready: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
};

type PlayerApi = PlayerState & {
  playTrack: (track: Track, queue?: Track[]) => void;
  playAt: (i: number) => void;
  removeFromQueue: (i: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (s: number) => void;
  setShowFull: (b: boolean) => void;
  close: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  volume: number;
  setVolume: (v: number) => void;
  upcoming: Track[];
  /**
   * Permanently download the given track to the device. Resolves once the
   * blob is fully written to the Cache Storage vault.
   */
  downloadTrack: (track: Track) => Promise<void>;
  /**
   * True when the currently-playing track is being served from the
   * offline cache (i.e. zero network usage).
   */
  isCurrentFromCache: boolean;
  /** Per-track download status, used by the UI to show a small badge. */
  downloadStates: Record<string, "idle" | "downloading" | "done" | "error">;
};

const PlayerContext = createContext<PlayerApi | null>(null);

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytReadyPromise: Promise<void> | null = null;
function loadYT(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (ytReadyPromise) return ytReadyPromise;
  ytReadyPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve();
  });
  return ytReadyPromise;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFull, setShowFull] = useState(false);
  const [ready, setReady] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [volume, setVolumeState] = useState(100);
  const playerRef = useRef<any>(null);
  const containerId = "yt-player-host";

  // ----- Offline cache plumbing -----
  // We keep a single hidden <audio> element for actual playback. The YouTube
  // IFrame API is kept around as a graceful fallback for tracks that are
  // NOT cached, since direct Piped stream URLs are usually `audio/mpeg` and
  // play perfectly in a plain <audio>.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [isCurrentFromCache, setIsCurrentFromCache] = useState(false);
  const [downloadStates, setDownloadStates] = useState<
    Record<string, "idle" | "downloading" | "done" | "error">
  >({});

  if (typeof window !== "undefined" && !audioRef.current) {
    const el = new Audio();
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.addEventListener("play", () => setIsPlaying(true));
    el.addEventListener("pause", () => setIsPlaying(false));
    el.addEventListener("ended", () => advanceRef.current());
    el.addEventListener("timeupdate", () => {
      if (!el.paused) setPosition(el.currentTime);
    });
    el.addEventListener("loadedmetadata", () => setDuration(el.duration || 0));
    el.addEventListener("durationchange", () => setDuration(el.duration || 0));
    audioRef.current = el;
  }

  const current = queue[index] ?? null;

  // Refs to always read latest in YT callbacks
  const queueRef = useRef(queue);
  const indexRef = useRef(index);
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);
  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);
  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  const upcoming =
    queue.length === 0
      ? []
      : shuffle && repeat === "off"
        ? queue.filter((_, i) => i !== index)
        : queue.slice(index + 1);

  const advance = useCallback(() => {
    const q = queueRef.current;
    const i = indexRef.current;
    if (!q.length) return;
    if (repeatRef.current === "one") {
      try {
        playerRef.current?.seekTo(0, true);
        playerRef.current?.playVideo();
      } catch {
        /* ignore */
      }
      return;
    }
    if (shuffleRef.current && q.length > 1) {
      let r = i;
      while (r === i) r = Math.floor(Math.random() * q.length);
      setIndex(r);
      return;
    }
    if (i + 1 < q.length) {
      setIndex(i + 1);
    } else if (repeatRef.current === "all") {
      // Loop the playlist so the next-track button never goes grey at the end.
      setIndex(0);
    }
    // When repeat is "off" and we're already on the last track, do nothing
    // and the next-track button is intentionally nulled out below.
  }, []);

  const goBack = useCallback(() => {
    const q = queueRef.current;
    const i = indexRef.current;
    if (!q.length) return;
    if (repeatRef.current === "one") {
      try {
        playerRef.current?.seekTo(0, true);
        playerRef.current?.playVideo();
      } catch {
        /* ignore */
      }
      return;
    }
    if (shuffleRef.current && q.length > 1) {
      let r = i;
      while (r === i) r = Math.floor(Math.random() * q.length);
      setIndex(r);
      return;
    }
    if (i > 0) {
      setIndex(i - 1);
    } else if (repeatRef.current === "all") {
      // Loop to the last track so prev stays enabled at the top of the queue.
      setIndex(q.length - 1);
    }
  }, []);

  // Stable refs to advance/goBack so the MediaSession handlers can always
  // invoke the *latest* version without iOS caching a stale closure.
  const advanceRef = useRef(advance);
  const goBackRef = useRef(goBack);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);
  useEffect(() => {
    goBackRef.current = goBack;
  }, [goBack]);

  // Registered exactly once for the lifetime of the provider. iOS Safari
  // holds onto the function reference we hand to setActionHandler, so we
  // give it one stable wrapper that reads from refs. Re-binding on every
  // effect run is what makes iOS render the arrows as greyed-out / dead.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    const handlePlay = () => {
      try {
        playerRef.current?.playVideo();
      } catch {
        /* ignore */
      }
    };
    const handlePause = () => {
      try {
        playerRef.current?.pauseVideo();
      } catch {
        /* ignore */
      }
    };
    const handleNextTrack = () => {
      advanceRef.current();
    };
    const handlePrevTrack = () => {
      goBackRef.current();
    };

    try {
      navigator.mediaSession.setActionHandler("play", handlePlay);
      navigator.mediaSession.setActionHandler("pause", handlePause);
      navigator.mediaSession.setActionHandler("nexttrack", handleNextTrack);
      navigator.mediaSession.setActionHandler("previoustrack", handlePrevTrack);
    } catch {
      /* ignore */
    }
  }, []);

  // init YT
  useEffect(() => {
    let mounted = true;
    loadYT().then(() => {
      if (!mounted) return;
      playerRef.current = new window.YT.Player(containerId, {
        height: "0",
        width: "0",
        playerVars: { playsinline: 1, controls: 0, disablekb: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: any) => {
            const YTState = window.YT.PlayerState;
            if (e.data === YTState.PLAYING) setIsPlaying(true);
            else if (e.data === YTState.PAUSED) setIsPlaying(false);
            else if (e.data === YTState.ENDED) advance();
          },
        },
      });
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const p = playerRef.current;
      if (p && p.getCurrentTime) {
        try {
          const pos = p.getCurrentTime() || 0;
          const dur = p.getDuration() || 0;
          setPosition(pos);
          setDuration(dur);
          if (typeof navigator !== "undefined" && "mediaSession" in navigator && dur > 0) {
            try {
              navigator.mediaSession.setPositionState({
                duration: dur,
                position: Math.min(pos, dur),
                playbackRate: 1,
              });
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore */
        }
      }
    }, 500);
    return () => clearInterval(id);
  }, []);

  // Keep the OS playback state in sync so the lock screen shows correct controls
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  useEffect(() => {
    if (!ready || !current || !playerRef.current) return;
    try {
      playerRef.current.loadVideoById(current.id);
      playerRef.current.playVideo();
    } catch {
      /* ignore */
    }
  }, [ready, current?.id]);

  // Force-remove the 10s seek controls. iOS auto-registers default
  // seekbackward/seekforward handlers (and re-registers them whenever
  // MediaMetadata is set or playback state changes). Clearing them on every
  // metadata update AND on every isPlaying change keeps the lock screen on the
  // native prev/next-track music layout.
  const disableSeekControls = () => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    disableSeekControls();
  }, []);

  // iOS re-installs seekbackward/seekforward whenever playback state changes.
  // Strip them again on every play/pause transition.
  useEffect(() => {
    disableSeekControls();
  }, [isPlaying]);

  useEffect(() => {
    if (!current || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      artwork: [{ src: current.thumbnail, sizes: "512x512", type: "image/jpeg" }],
    });

    // play/pause/nexttrack/previoustrack are bound exactly once in their own
    // mount-time effect above (so iOS keeps a stable, live function ref).
    // Here we only refresh metadata + scrub handler + strip 10s controls.

    // Explicitly remove the 10s skip controls so iOS shows prev/next track buttons instead
    disableSeekControls();
    try {
      navigator.mediaSession.setActionHandler("seekto", (details: any) => {
        if (details.seekTime != null) playerRef.current?.seekTo(details.seekTime, true);
      });
    } catch {
      /* ignore */
    }
  }, [current]);

  // Safety net: poll for a few seconds after each metadata update and strip any
  // seekbackward/seekforward handlers that iOS re-registers asynchronously.
  useEffect(() => {
    if (!current) return;
    const cleared = [200, 600, 1200, 2500];
    const timers = cleared.map((ms) => setTimeout(disableSeekControls, ms));
    return () => timers.forEach(clearTimeout);
  }, [current?.id, isPlaying]);

  // Lock body scroll when full player is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (showFull) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showFull]);

  // Caches iTunes Search lookups so we never re-query the same song/artist pair.
  // (State shared via the itunes-artwork module — see import above.)


  // Apply an upgraded thumbnail to a queue entry by id, preserving order.
  // Stable identity — never re-created — so it can't restart effects.
  const applyArtwork = useCallback((id: string, newThumb: string) => {
    setQueue((q) => {
      const idx = q.findIndex((t) => t.id === id);
      if (idx === -1 || q[idx].thumbnail === newThumb) return q;
      const next = q.slice();
      next[idx] = { ...next[idx], thumbnail: newThumb };
      return next;
    });
  }, []);

  // Track which queue entries we've already kicked off an iTunes lookup for.
  // Mounted once, never cleared, so the pump never restarts and the page
  // never cascades into re-render hell when an upgrade lands.
  const queueArtworkSeenRef = useRef<Set<string>>(new Set());

  // Pre-compute the list of queue entries that still need an upgrade so the
  // effect below can depend on a stable primitive (joined ids) instead of
  // the queue array identity.
  const pendingArtworkIds: string[] = [];
  for (const t of queue) {
    if (!t.title || !t.artist) continue;
    const key = `${t.title}::${t.artist}`;
    if (queueArtworkSeenRef.current.has(key)) continue;
    queueArtworkSeenRef.current.add(key);
    pendingArtworkIds.push(t.id);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pendingArtworkIds.length === 0) return;

    const byId = new Map(queue.map((t) => [t.id, t]));
    const pending: Array<{ id: string; title: string; artist: string }> = [];
    for (const id of pendingArtworkIds) {
      const t = byId.get(id);
      if (t && t.title && t.artist) pending.push({ id: t.id, title: t.title, artist: t.artist });
    }
    if (pending.length === 0) return;

    let cancelled = false;
    // Cap concurrent fetches so a 20-track trending list doesn't fire 20
    // requests at once and choke the network/main thread.
    const MAX_CONCURRENT = 4;
    let cursor = 0;
    let active = 0;

    const pump = () => {
      while (!cancelled && active < MAX_CONCURRENT && cursor < pending.length) {
        const t = pending[cursor++];
        active++;
        lookupHighResArtwork(t.title, t.artist)
          .then((hd) => {
            if (!cancelled && hd) applyArtwork(t.id, hd);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingArtworkIds.join("|")]);

  const playTrack = useCallback(
    (track: Track, q?: Track[]) => {
      const newQueue = q && q.length ? q : [track];
      const idx = newQueue.findIndex((t) => t.id === track.id);
      setQueue(newQueue);
      setIndex(idx >= 0 ? idx : 0);

      // Fire-and-forget: fetch a crisper iTunes thumbnail for this track.
      // If we get one back, patch the queue entry so `current.thumbnail`
      // automatically picks up the HD image everywhere it's used.
      const title = track.title;
      const artist = track.artist;
      if (title && artist) {
        lookupHighResArtwork(title, artist).then((hd) => {
          if (hd) applyArtwork(track.id, hd);
        });
      }
    },
    [applyArtwork],
  );

  const playAt = useCallback((i: number) => {
    const q = queueRef.current;
    if (i < 0 || i >= q.length) return;
    setIndex(i);
  }, []);

  const removeFromQueue = useCallback((i: number) => {
    setQueue((q) => {
      const cur = indexRef.current;
      if (i === cur) return q; // never remove currently playing
      if (i < cur) {
        setIndex(cur - 1);
        return q.filter((_, k) => k !== i);
      }
      return q.filter((_, k) => k !== i);
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, v));
    setVolumeState(clamped);
    try {
      playerRef.current?.setVolume?.(clamped);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) p.pauseVideo();
    else p.playVideo();
  }, [isPlaying]);

  const next = useCallback(() => advance(), [advance]);
  const prev = useCallback(() => {
    if (position > 3) {
      playerRef.current?.seekTo(0, true);
    } else {
      setIndex((i) => Math.max(0, i - 1));
    }
  }, [position]);
  const seek = useCallback((s: number) => {
    playerRef.current?.seekTo(s, true);
    setPosition(s);
  }, []);

  const close = useCallback(() => {
    try {
      playerRef.current?.stopVideo?.();
    } catch {
      /* ignore */
    }
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
    setShowFull(false);
    setQueue([]);
    setIndex(0);
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    [],
  );

  return (
    <PlayerContext.Provider
      value={{
        queue,
        index,
        current,
        isPlaying,
        position,
        duration,
        showFull,
        ready,
        shuffle,
        repeat,
        volume,
        upcoming,
        playTrack,
        playAt,
        removeFromQueue,
        toggle,
        next,
        prev,
        seek,
        setShowFull,
        close,
        toggleShuffle,
        cycleRepeat,
        setVolume,
      }}
    >
      {children}
      <div
        style={{
          position: "fixed",
          left: -9999,
          top: -9999,
          width: 0,
          height: 0,
          overflow: "hidden",
        }}
      >
        <div id={containerId} />
      </div>
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}

export function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
