import { a as __toESM } from "../_runtime.mjs";
import { c as LayoutGroup, i as domAnimation, l as AnimatePresence, n as useTransform, r as useMotionValue, s as LazyMotion, t as useDragControls } from "../_libs/framer-motion.mjs";
import { D as isRedirect, _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as TSS_SERVER_FUNCTION, l as createServerFn } from "./esm-Dova13aH.mjs";
import { n as objectType, r as stringType, t as numberType } from "../_libs/zod.mjs";
import { i as require_react, r as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-yNyqv20j.mjs";
import { A as CreditCard, C as Library, D as Eye, E as FileText, F as Bell, I as AudioLines, M as CircleQuestionMark, N as ChevronLeft, O as Ellipsis, P as Check, S as ListMusic, T as Headphones, _ as Music2, a as SkipBack, b as LogOut, c as Search, d as Radio, f as Plus, g as Music, h as Palette, i as SkipForward, j as Cog, k as Download, l as Repeat, m as Pause, n as User, o as Shuffle, p as Play, r as Trash2, s as Shield, t as X, u as Repeat1, v as Moon, w as Heart, x as ListOrdered, y as Mic } from "../_libs/lucide-react.mjs";
import { n as motion, t as m } from "../_libs/motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DiB4tHaz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
var cache = /* @__PURE__ */ new Map();
var inflight = /* @__PURE__ */ new Map();
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
function cleanQuery(s) {
	if (!s) return "";
	return s.replace(/\s*[\(\[][^\)\]]*?(officialsic |muvideo|lyric|audio|video|m\/v|hd|4k|hq|visualizer|audio only|prod[\.\s][^)\]]*)[^\)\]]*?[\)\]]/gi, "").replace(/\s*[\(\[][^\)\]]+[\)\]]/g, "").replace(/\s*[-|]\s*topic\s*$/i, "").replace(/\s+ft\.?\s+[^|\-]+$/i, "").replace(/\s+feat\.?\s+[^|\-]+$/i, "").replace(/\s*\|\s*[^|\-]+$/, "").replace(/\s+/g, " ").trim();
}
/** Cap on individual query terms to stay inside iTunes Search's URL limits. */
function safeTerm(...parts) {
	return parts.filter((p) => !!p && !!p.trim()).map((p) => p.trim()).join(" ").slice(0, 200);
}
/**
* One iTunes Search call. Returns the upgraded artwork URL or null.
*/
async function fetchItunesArtwork(term) {
	if (!term) return null;
	const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`;
	const res = await fetch(url, { headers: { accept: "application/json" } });
	if (!res.ok) return null;
	const artwork100 = (await res.json()).results?.[0]?.artworkUrl100;
	if (!artwork100) return null;
	return artwork100.replace(/100x100bb\.(jpg|png|jpeg|webp)/i, "600x600bb.$1");
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
async function lookupHighResArtwork(title, artist) {
	const key = `${title}::${artist}`;
	if (cache.has(key)) return cache.get(key);
	const existing = inflight.get(key);
	if (existing) return existing;
	const promise = (async () => {
		const cleanTitle = cleanQuery(title);
		const cleanArtist = cleanQuery(artist).replace(/\s+-\s+topic$/i, "");
		const queries = [];
		const full = safeTerm(cleanTitle, cleanArtist);
		const justTitle = safeTerm(cleanTitle);
		const justArtist = safeTerm(cleanArtist);
		if (full) queries.push(full);
		if (justTitle && justTitle !== full) queries.push(justTitle);
		if (justArtist && justArtist !== full && justArtist !== justTitle) queries.push(justArtist);
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
var PlayerContext = (0, import_react.createContext)(null);
var ytReadyPromise = null;
function loadYT() {
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
function PlayerProvider({ children }) {
	const [queue, setQueue] = (0, import_react.useState)([]);
	const [index, setIndex] = (0, import_react.useState)(0);
	const [isPlaying, setIsPlaying] = (0, import_react.useState)(false);
	const [position, setPosition] = (0, import_react.useState)(0);
	const [duration, setDuration] = (0, import_react.useState)(0);
	const [showFull, setShowFull] = (0, import_react.useState)(false);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [shuffle, setShuffle] = (0, import_react.useState)(false);
	const [repeat, setRepeat] = (0, import_react.useState)("off");
	const [volume, setVolumeState] = (0, import_react.useState)(100);
	const playerRef = (0, import_react.useRef)(null);
	const containerId = "yt-player-host";
	const audioRef = (0, import_react.useRef)(null);
	(0, import_react.useRef)(null);
	const [isCurrentFromCache, setIsCurrentFromCache] = (0, import_react.useState)(false);
	const [downloadStates, setDownloadStates] = (0, import_react.useState)({});
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
	const queueRef = (0, import_react.useRef)(queue);
	const indexRef = (0, import_react.useRef)(index);
	const shuffleRef = (0, import_react.useRef)(shuffle);
	const repeatRef = (0, import_react.useRef)(repeat);
	(0, import_react.useEffect)(() => {
		queueRef.current = queue;
	}, [queue]);
	(0, import_react.useEffect)(() => {
		indexRef.current = index;
	}, [index]);
	(0, import_react.useEffect)(() => {
		shuffleRef.current = shuffle;
	}, [shuffle]);
	(0, import_react.useEffect)(() => {
		repeatRef.current = repeat;
	}, [repeat]);
	const upcoming = queue.length === 0 ? [] : shuffle && repeat === "off" ? queue.filter((_, i) => i !== index) : queue.slice(index + 1);
	const advance = (0, import_react.useCallback)(() => {
		const q = queueRef.current;
		const i = indexRef.current;
		if (!q.length) return;
		if (repeatRef.current === "one") {
			try {
				playerRef.current?.seekTo(0, true);
				playerRef.current?.playVideo();
			} catch {}
			return;
		}
		if (shuffleRef.current && q.length > 1) {
			let r = i;
			while (r === i) r = Math.floor(Math.random() * q.length);
			setIndex(r);
			return;
		}
		if (i + 1 < q.length) setIndex(i + 1);
		else if (repeatRef.current === "all") setIndex(0);
	}, []);
	const goBack = (0, import_react.useCallback)(() => {
		const q = queueRef.current;
		const i = indexRef.current;
		if (!q.length) return;
		if (repeatRef.current === "one") {
			try {
				playerRef.current?.seekTo(0, true);
				playerRef.current?.playVideo();
			} catch {}
			return;
		}
		if (shuffleRef.current && q.length > 1) {
			let r = i;
			while (r === i) r = Math.floor(Math.random() * q.length);
			setIndex(r);
			return;
		}
		if (i > 0) setIndex(i - 1);
		else if (repeatRef.current === "all") setIndex(q.length - 1);
	}, []);
	const advanceRef = (0, import_react.useRef)(advance);
	const goBackRef = (0, import_react.useRef)(goBack);
	(0, import_react.useEffect)(() => {
		advanceRef.current = advance;
	}, [advance]);
	(0, import_react.useEffect)(() => {
		goBackRef.current = goBack;
	}, [goBack]);
	(0, import_react.useEffect)(() => {
		if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
		const handlePlay = () => {
			try {
				playerRef.current?.playVideo();
			} catch {}
		};
		const handlePause = () => {
			try {
				playerRef.current?.pauseVideo();
			} catch {}
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
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		let mounted = true;
		loadYT().then(() => {
			if (!mounted) return;
			playerRef.current = new window.YT.Player(containerId, {
				height: "0",
				width: "0",
				playerVars: {
					playsinline: 1,
					controls: 0,
					disablekb: 1
				},
				events: {
					onReady: () => setReady(true),
					onStateChange: (e) => {
						const YTState = window.YT.PlayerState;
						if (e.data === YTState.PLAYING) setIsPlaying(true);
						else if (e.data === YTState.PAUSED) setIsPlaying(false);
						else if (e.data === YTState.ENDED) advance();
					}
				}
			});
		});
		return () => {
			mounted = false;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const id = setInterval(() => {
			const p = playerRef.current;
			if (p && p.getCurrentTime) try {
				const pos = p.getCurrentTime() || 0;
				const dur = p.getDuration() || 0;
				setPosition(pos);
				setDuration(dur);
				if (typeof navigator !== "undefined" && "mediaSession" in navigator && dur > 0) try {
					navigator.mediaSession.setPositionState({
						duration: dur,
						position: Math.min(pos, dur),
						playbackRate: 1
					});
				} catch {}
			} catch {}
		}, 500);
		return () => clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
		navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
	}, [isPlaying]);
	(0, import_react.useEffect)(() => {
		if (!ready || !current || !playerRef.current) return;
		try {
			playerRef.current.loadVideoById(current.id);
			playerRef.current.playVideo();
		} catch {}
	}, [ready, current?.id]);
	const disableSeekControls = () => {
		if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
		try {
			navigator.mediaSession.setActionHandler("seekbackward", null);
			navigator.mediaSession.setActionHandler("seekforward", null);
		} catch {}
	};
	(0, import_react.useEffect)(() => {
		disableSeekControls();
	}, []);
	(0, import_react.useEffect)(() => {
		disableSeekControls();
	}, [isPlaying]);
	(0, import_react.useEffect)(() => {
		if (!current || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
		navigator.mediaSession.metadata = new MediaMetadata({
			title: current.title,
			artist: current.artist,
			artwork: [{
				src: current.thumbnail,
				sizes: "512x512",
				type: "image/jpeg"
			}]
		});
		disableSeekControls();
		try {
			navigator.mediaSession.setActionHandler("seekto", (details) => {
				if (details.seekTime != null) playerRef.current?.seekTo(details.seekTime, true);
			});
		} catch {}
	}, [current]);
	(0, import_react.useEffect)(() => {
		if (!current) return;
		const timers = [
			200,
			600,
			1200,
			2500
		].map((ms) => setTimeout(disableSeekControls, ms));
		return () => timers.forEach(clearTimeout);
	}, [current?.id, isPlaying]);
	(0, import_react.useEffect)(() => {
		if (typeof document === "undefined") return;
		if (showFull) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = prev;
			};
		}
	}, [showFull]);
	const applyArtwork = (0, import_react.useCallback)((id, newThumb) => {
		setQueue((q) => {
			const idx = q.findIndex((t) => t.id === id);
			if (idx === -1 || q[idx].thumbnail === newThumb) return q;
			const next = q.slice();
			next[idx] = {
				...next[idx],
				thumbnail: newThumb
			};
			return next;
		});
	}, []);
	const queueArtworkSeenRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const pendingArtworkIds = [];
	for (const t of queue) {
		if (!t.title || !t.artist) continue;
		const key = `${t.title}::${t.artist}`;
		if (queueArtworkSeenRef.current.has(key)) continue;
		queueArtworkSeenRef.current.add(key);
		pendingArtworkIds.push(t.id);
	}
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		if (pendingArtworkIds.length === 0) return;
		const byId = new Map(queue.map((t) => [t.id, t]));
		const pending = [];
		for (const id of pendingArtworkIds) {
			const t = byId.get(id);
			if (t && t.title && t.artist) pending.push({
				id: t.id,
				title: t.title,
				artist: t.artist
			});
		}
		if (pending.length === 0) return;
		let cancelled = false;
		const MAX_CONCURRENT = 4;
		let cursor = 0;
		let active = 0;
		const pump = () => {
			while (!cancelled && active < MAX_CONCURRENT && cursor < pending.length) {
				const t = pending[cursor++];
				active++;
				lookupHighResArtwork(t.title, t.artist).then((hd) => {
					if (!cancelled && hd) applyArtwork(t.id, hd);
				}).finally(() => {
					active--;
					pump();
				});
			}
		};
		pump();
		return () => {
			cancelled = true;
		};
	}, [pendingArtworkIds.join("|")]);
	const playTrack = (0, import_react.useCallback)((track, q) => {
		const newQueue = q && q.length ? q : [track];
		const idx = newQueue.findIndex((t) => t.id === track.id);
		setQueue(newQueue);
		setIndex(idx >= 0 ? idx : 0);
		const title = track.title;
		const artist = track.artist;
		if (title && artist) lookupHighResArtwork(title, artist).then((hd) => {
			if (hd) applyArtwork(track.id, hd);
		});
	}, [applyArtwork]);
	const playAt = (0, import_react.useCallback)((i) => {
		const q = queueRef.current;
		if (i < 0 || i >= q.length) return;
		setIndex(i);
	}, []);
	const removeFromQueue = (0, import_react.useCallback)((i) => {
		setQueue((q) => {
			const cur = indexRef.current;
			if (i === cur) return q;
			if (i < cur) {
				setIndex(cur - 1);
				return q.filter((_, k) => k !== i);
			}
			return q.filter((_, k) => k !== i);
		});
	}, []);
	const setVolume = (0, import_react.useCallback)((v) => {
		const clamped = Math.max(0, Math.min(100, v));
		setVolumeState(clamped);
		try {
			playerRef.current?.setVolume?.(clamped);
		} catch {}
	}, []);
	const toggle = (0, import_react.useCallback)(() => {
		const p = playerRef.current;
		if (!p) return;
		if (isPlaying) p.pauseVideo();
		else p.playVideo();
	}, [isPlaying]);
	const next = (0, import_react.useCallback)(() => advance(), [advance]);
	const prev = (0, import_react.useCallback)(() => {
		if (position > 3) playerRef.current?.seekTo(0, true);
		else setIndex((i) => Math.max(0, i - 1));
	}, [position]);
	const seek = (0, import_react.useCallback)((s) => {
		playerRef.current?.seekTo(s, true);
		setPosition(s);
	}, []);
	const close = (0, import_react.useCallback)(() => {
		try {
			playerRef.current?.stopVideo?.();
		} catch {}
		setIsPlaying(false);
		setPosition(0);
		setDuration(0);
		setShowFull(false);
		setQueue([]);
		setIndex(0);
	}, []);
	const toggleShuffle = (0, import_react.useCallback)(() => setShuffle((s) => !s), []);
	const cycleRepeat = (0, import_react.useCallback)(() => setRepeat((r) => r === "off" ? "all" : r === "all" ? "one" : "off"), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PlayerContext.Provider, {
		value: {
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
			setVolume
		},
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				position: "fixed",
				left: -9999,
				top: -9999,
				width: 0,
				height: 0,
				overflow: "hidden"
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { id: containerId })
		})]
	});
}
function usePlayer() {
	const ctx = (0, import_react.useContext)(PlayerContext);
	if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
	return ctx;
}
function formatTime(s) {
	if (!isFinite(s) || s < 0) s = 0;
	return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}
var KEY$1 = "music-library-v1";
var Ctx$1 = (0, import_react.createContext)(null);
var empty = {
	tracks: {},
	favorites: [],
	playlists: [],
	songs: []
};
function load$1() {
	if (typeof window === "undefined") return empty;
	try {
		const raw = localStorage.getItem(KEY$1);
		if (!raw) return empty;
		return {
			...empty,
			...JSON.parse(raw)
		};
	} catch {
		return empty;
	}
}
function LibraryProvider({ children }) {
	const [state, setState] = (0, import_react.useState)(empty);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setState(load$1());
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		try {
			localStorage.setItem(KEY$1, JSON.stringify(state));
		} catch {}
	}, [state, hydrated]);
	const addToLibrary = (0, import_react.useCallback)((t) => {
		setState((s) => ({
			...s,
			tracks: {
				...s.tracks,
				[t.id]: t
			},
			songs: s.songs.includes(t.id) ? s.songs : [t.id, ...s.songs]
		}));
	}, []);
	const removeFromLibrary = (0, import_react.useCallback)((id) => {
		setState((s) => ({
			...s,
			songs: s.songs.filter((x) => x !== id)
		}));
	}, []);
	const toggleFavorite = (0, import_react.useCallback)((t) => {
		setState((s) => {
			const has = s.favorites.includes(t.id);
			return {
				...s,
				tracks: {
					...s.tracks,
					[t.id]: t
				},
				favorites: has ? s.favorites.filter((x) => x !== t.id) : [t.id, ...s.favorites]
			};
		});
	}, []);
	const isFavorite = (0, import_react.useCallback)((id) => state.favorites.includes(id), [state.favorites]);
	const isInLibrary = (0, import_react.useCallback)((id) => state.songs.includes(id), [state.songs]);
	const createPlaylist = (0, import_react.useCallback)((name) => {
		const pl = {
			id: crypto.randomUUID(),
			name: name.trim() || "New Playlist",
			trackIds: [],
			createdAt: Date.now()
		};
		setState((s) => ({
			...s,
			playlists: [pl, ...s.playlists]
		}));
		return pl;
	}, []);
	const deletePlaylist = (0, import_react.useCallback)((id) => {
		setState((s) => ({
			...s,
			playlists: s.playlists.filter((p) => p.id !== id)
		}));
	}, []);
	const renamePlaylist = (0, import_react.useCallback)((id, name) => {
		setState((s) => ({
			...s,
			playlists: s.playlists.map((p) => p.id === id ? {
				...p,
				name
			} : p)
		}));
	}, []);
	const addToPlaylist = (0, import_react.useCallback)((playlistId, t) => {
		setState((s) => ({
			...s,
			tracks: {
				...s.tracks,
				[t.id]: t
			},
			playlists: s.playlists.map((p) => p.id === playlistId && !p.trackIds.includes(t.id) ? {
				...p,
				trackIds: [...p.trackIds, t.id]
			} : p)
		}));
	}, []);
	const removeFromPlaylist = (0, import_react.useCallback)((playlistId, trackId) => {
		setState((s) => ({
			...s,
			playlists: s.playlists.map((p) => p.id === playlistId ? {
				...p,
				trackIds: p.trackIds.filter((x) => x !== trackId)
			} : p)
		}));
	}, []);
	const getTracks = (0, import_react.useCallback)((ids) => ids.map((id) => state.tracks[id]).filter(Boolean), [state.tracks]);
	const setTrackArtwork = (0, import_react.useCallback)((id, thumbnail) => {
		setState((s) => {
			const existing = s.tracks[id];
			if (!existing || existing.thumbnail === thumbnail) return s;
			return {
				...s,
				tracks: {
					...s.tracks,
					[id]: {
						...existing,
						thumbnail
					}
				}
			};
		});
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ctx$1.Provider, {
		value: {
			...state,
			addToLibrary,
			removeFromLibrary,
			toggleFavorite,
			isFavorite,
			isInLibrary,
			createPlaylist,
			deletePlaylist,
			renamePlaylist,
			addToPlaylist,
			removeFromPlaylist,
			getTracks,
			setTrackArtwork
		},
		children
	});
}
function useLibrary() {
	const ctx = (0, import_react.useContext)(Ctx$1);
	if (!ctx) throw new Error("useLibrary must be used inside LibraryProvider");
	return ctx;
}
var KEY = "music-theme-v1";
var Ctx = (0, import_react.createContext)(null);
function load() {
	if (typeof window === "undefined") return "apple-music";
	try {
		const raw = localStorage.getItem(KEY);
		if (raw === "apple-music" || raw === "youtube-music") return raw;
	} catch {}
	return "apple-music";
}
function ThemeProvider({ children }) {
	const [theme, setThemeState] = (0, import_react.useState)("apple-music");
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setThemeState(load());
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		const root = document.documentElement;
		root.dataset.theme = theme;
		root.classList.toggle("dark", theme === "youtube-music");
		try {
			localStorage.setItem(KEY, theme);
		} catch {}
	}, [theme, hydrated]);
	const setTheme = (0, import_react.useCallback)((t) => setThemeState(t), []);
	const toggleTheme = (0, import_react.useCallback)(() => setThemeState((t) => t === "apple-music" ? "youtube-music" : "apple-music"), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ctx.Provider, {
		value: {
			theme,
			setTheme,
			toggleTheme
		},
		children
	});
}
function useTheme() {
	const ctx = (0, import_react.useContext)(Ctx);
	if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
	return ctx;
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function formatViews(n) {
	if (!n || n <= 0) return "";
	if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
	if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
	if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
	return `${n}`;
}
/** Fallback URL used by <img onError> when YouTube maxres is missing. */
function fallbackArtwork(url) {
	const m = url.match(/\/vi\/([^/]+)\/[^/]+\.(?:jpg|webp|png)/i);
	if (m) return `https://i.ytimg.com/vi/${m[1]}/sddefault.jpg`;
	return url;
}
var searchMusic = createServerFn({ method: "POST" }).inputValidator(objectType({ query: stringType().min(1).max(200) })).handler(createSsrRpc("b18c935d511bf2d5175d91a5fb21457b513bfe85576e00f6d1c189d046b32e5f"));
createServerFn({ method: "POST" }).inputValidator(objectType({ videoId: stringType().min(1).max(32) })).handler(createSsrRpc("56ec3e356adce4b5e87fc9492ad7cc97b52d82dd7076c21febb0178f4f1da8fe"));
var getTrending = createServerFn({ method: "GET" }).handler(createSsrRpc("7d4ed48efd6c466ffe6a6e1858b4e339f65a540c916b35154d2fd29c3fe65cbc"));
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
function useUpgradeArtwork(tracks, onArtwork) {
	const seenRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const onArtworkRef = (0, import_react.useRef)(onArtwork);
	(0, import_react.useEffect)(() => {
		onArtworkRef.current = onArtwork;
	}, [onArtwork]);
	const freshIds = [];
	for (const t of tracks) {
		if (!t?.title || !t?.artist) continue;
		const key = `${t.title}::${t.artist}`;
		if (seenRef.current.has(key)) continue;
		seenRef.current.add(key);
		freshIds.push(t.id);
	}
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		if (freshIds.length === 0) return;
		const byId = new Map(tracks.map((t) => [t.id, t]));
		const fresh = [];
		for (const id of freshIds) {
			const t = byId.get(id);
			if (t && t.title && t.artist) fresh.push({
				id: t.id,
				title: t.title,
				artist: t.artist
			});
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
				lookupHighResArtwork(t.title, t.artist).then((hd) => {
					if (!cancelled && hd) onArtworkRef.current(t.id, hd);
				}).finally(() => {
					active--;
					pump();
				});
			}
		};
		pump();
		return () => {
			cancelled = true;
		};
	}, [freshIds.join("|")]);
}
/** iOS-style deceleration curve (matches UIKit default) */
var appleEase = [
	.32,
	.72,
	0,
	1
];
/** Snappy spring — buttons, tabs, micro-interactions */
var springSnappy = {
	type: "spring",
	stiffness: 520,
	damping: 38,
	mass: .65
};
/** Primary spring — player expand/collapse, sheets */
var springPlayer = {
	type: "spring",
	stiffness: 380,
	damping: 42,
	mass: .85
};
/** Gentle spring — list items, cards */
var springGentle = {
	type: "spring",
	stiffness: 300,
	damping: 32,
	mass: .9
};
/** Smooth tween for opacity-only fades */
var fadeTween = {
	duration: .35,
	ease: appleEase
};
var tapScale = { scale: .92 };
var tapScaleSoft = { scale: .97 };
/** Staggered list entrance */
var staggerContainer = {
	hidden: {},
	visible: { transition: {
		staggerChildren: .045,
		delayChildren: .06
	} }
};
var fadeScaleItem = {
	hidden: {
		opacity: 0,
		scale: .94,
		y: 12
	},
	visible: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: springGentle
	}
};
({ ...fadeTween });
/** GPU-friendly layout transition for shared elements */
var layoutTransition = {
	type: "spring",
	stiffness: 420,
	damping: 44,
	mass: .75
};
function PlayingBars() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "flex items-end gap-[2px] h-3",
		children: [
			0,
			1,
			2
		].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
			className: "block w-[3px] bg-white rounded-sm",
			animate: { height: [
				"30%",
				"100%",
				"50%",
				"80%",
				"30%"
			] },
			transition: {
				duration: .9,
				repeat: Infinity,
				ease: "easeInOut",
				delay: i * .12
			},
			style: { height: "30%" }
		}, i))
	});
}
var MINI_BOTTOM = "calc(env(safe-area-inset-bottom) + 58px)";
function Player({ onMore, onShowLyrics }) {
	const { current, isPlaying, toggle, next, prev, position, duration, seek, showFull, setShowFull, close, shuffle, repeat, toggleShuffle, cycleRepeat, queue, index, playAt } = usePlayer();
	const lib = useLibrary();
	const [showQueue, setShowQueue] = (0, import_react.useState)(false);
	const dragControls = useDragControls();
	const dragY = useMotionValue(0);
	const dismissOpacity = useTransform(dragY, [0, 180], [1, .35]);
	const contentScale = useTransform(dragY, [0, 220], [1, .94]);
	const openFull = (0, import_react.useCallback)(() => setShowFull(true), [setShowFull]);
	const closeFull = (0, import_react.useCallback)(() => setShowFull(false), [setShowFull]);
	(0, import_react.useEffect)(() => {
		if (!showFull) dragY.set(0);
		if (!showFull) setShowQueue(false);
	}, [showFull, dragY]);
	if (!current) return null;
	const fav = lib.isFavorite(current.id);
	const views = formatViews(current.views);
	const pct = duration > 0 ? Math.min(position / duration, 1) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: !showFull && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
		initial: {
			opacity: 0,
			y: 24
		},
		animate: {
			opacity: 1,
			y: 0
		},
		exit: {
			opacity: 0,
			y: 16,
			transition: {
				duration: .22,
				ease: [
					.32,
					.72,
					0,
					1
				]
			}
		},
		transition: springPlayer,
		drag: "y",
		dragConstraints: {
			top: 0,
			bottom: 0
		},
		dragElastic: {
			top: .5,
			bottom: .6
		},
		onDragEnd: (_, info) => {
			if (info.offset.y < -50 || info.velocity.y < -350) openFull();
		},
		className: "fixed left-2 right-2 z-40 gpu-layer",
		style: {
			bottom: MINI_BOTTOM,
			touchAction: "pan-y"
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
			layoutId: "player-card",
			transition: layoutTransition,
			onClick: openFull,
			whileTap: tapScaleSoft,
			className: "glass-strong shadow-2xl border border-border overflow-hidden text-left cursor-pointer rounded-[30px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 px-2 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.img, {
						layoutId: "player-artwork",
						transition: layoutTransition,
						src: current.thumbnail,
						onError: (e) => {
							const el = e.currentTarget;
							const next = fallbackArtwork(el.src);
							if (next && next !== el.src) el.src = next;
						},
						alt: "",
						className: "h-12 w-12 rounded-2xl object-cover bg-muted shrink-0 gpu-layer"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
							layoutId: "player-track-title",
							transition: layoutTransition,
							className: "text-[14px] font-semibold truncate text-foreground",
							children: current.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[12px] text-muted-foreground truncate flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: current.artist
							}), views && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-0.5 shrink-0 text-muted-foreground/80",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3 w-3" }),
									" ",
									views
								]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
						whileTap: tapScale,
						transition: springSnappy,
						onClick: (e) => {
							e.stopPropagation();
							toggle();
						},
						className: "p-2 text-foreground",
						"aria-label": isPlaying ? "Pause" : "Play",
						children: isPlaying ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "h-6 w-6 fill-current" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-6 w-6 fill-current" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
						whileTap: tapScale,
						transition: springSnappy,
						onClick: (e) => {
							e.stopPropagation();
							next();
						},
						className: "p-2 pr-3 text-foreground",
						"aria-label": "Next",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, { className: "h-5 w-5 fill-current" })
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-[2px] bg-white/10 overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
					className: "h-full w-full origin-left bg-white/80 gpu-layer",
					style: { scaleX: pct },
					transition: {
						duration: .35,
						ease: [
							.32,
							.72,
							0,
							1
						]
					}
				})
			})]
		})
	}, "mini") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: showFull && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
		layoutId: "player-card",
		transition: layoutTransition,
		drag: showQueue ? false : "y",
		dragControls,
		dragConstraints: {
			top: 0,
			bottom: 0
		},
		dragElastic: {
			top: .05,
			bottom: .35
		},
		dragListener: true,
		style: {
			y: dragY,
			opacity: dismissOpacity,
			borderRadius: 0,
			touchAction: "pan-y"
		},
		onDragEnd: (_, info) => {
			if (showQueue) return;
			if (info.offset.y > 100 || info.velocity.y > 400) closeFull();
		},
		className: "fixed inset-0 z-50 text-foreground overflow-hidden bg-black gpu-layer",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
			initial: { opacity: 0 },
			animate: { opacity: 1 },
			exit: { opacity: 0 },
			transition: fadeTween,
			className: "absolute inset-0 pointer-events-none gpu-layer",
			"aria-hidden": true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 scale-[1.2]",
				style: {
					backgroundImage: `url(${current.thumbnail})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					filter: "blur(64px) saturate(160%)",
					transform: "translateZ(0)"
				}
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-black/62" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
			style: { scale: contentScale },
			className: "relative h-full flex flex-col pt-safe pb-safe px-6 gpu-layer",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col items-center pt-5 pb-5 touch-none select-none",
				onPointerDown: (e) => dragControls.start(e),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1.5 w-10 rounded-full bg-white/40" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
				variants: staggerContainer,
				initial: "hidden",
				animate: "visible",
				className: "flex-1 flex flex-col min-h-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 min-h-0 flex flex-col relative",
						children: !showQueue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 flex items-center justify-center my-2 min-h-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.img, {
								layoutId: "player-artwork",
								transition: layoutTransition,
								src: current.thumbnail,
								onError: (e) => {
									const el = e.currentTarget;
									const next = fallbackArtwork(el.src);
									if (next && next !== el.src) el.src = next;
								},
								alt: "",
								animate: { scale: isPlaying ? 1 : .92 },
								style: { willChange: "transform" },
								className: "w-full max-w-[320px] aspect-square rounded-[24px] object-cover shadow-[0_24px_70px_rgba(0,0,0,0.65)] gpu-layer"
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 flex flex-col min-h-0 pt-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3 mb-3 shrink-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1 flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.img, {
												layoutId: "player-artwork-thumb",
												src: current.thumbnail,
												onError: (e) => {
													const el = e.currentTarget;
													const next = fallbackArtwork(el.src);
													if (next && next !== el.src) el.src = next;
												},
												alt: "",
												className: "h-12 w-12 rounded-lg object-cover bg-muted shrink-0 shadow"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0 flex-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
													layoutId: "player-track-title",
													transition: layoutTransition,
													className: "leading-tight truncate text-[16px] font-semibold",
													children: current.title
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "truncate text-[13px] text-white/65",
													children: current.artist
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
											whileTap: tapScale,
											transition: springSnappy,
											onClick: () => setShowQueue((v) => !v),
											className: "p-2 rounded-full bg-primary text-primary-foreground",
											"aria-label": "Playing Next",
											"aria-pressed": showQueue,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListOrdered, { className: "h-5 w-5" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
											whileTap: tapScale,
											transition: springSnappy,
											onClick: () => lib.toggleFavorite(current),
											className: "p-2 rounded-full bg-white/15",
											"aria-label": "Favorite",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: `h-5 w-5 ${fav ? "fill-current text-primary" : ""}` })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
											whileTap: tapScale,
											transition: springSnappy,
											onClick: onMore,
											className: "p-2 rounded-full bg-white/15",
											"aria-label": "More",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "h-5 w-5" })
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-3 shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[20px] font-semibold",
										children: "Playing Next"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
											whileTap: tapScale,
											transition: springSnappy,
											onClick: toggleShuffle,
											className: `p-2 ${shuffle ? "text-primary" : "text-white/70"}`,
											"aria-label": "Shuffle",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shuffle, { className: "h-5 w-5" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
											whileTap: tapScale,
											transition: springSnappy,
											onClick: cycleRepeat,
											className: `p-2 ${repeat !== "off" ? "text-primary" : "text-white/70"}`,
											"aria-label": "Repeat",
											children: repeat === "one" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat1, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat, { className: "h-5 w-5" })
										})]
									})]
								}),
								queue.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex-1 flex items-center justify-center text-center text-white/55 text-[14px] px-6",
									children: "Your queue is empty. Play a song to start filling it up."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex-1 overflow-y-auto -mx-2 px-2 pb-4",
									children: queue.map((t, i) => {
										const isCurrent = i === index;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.button, {
											initial: {
												opacity: 0,
												y: 8
											},
											animate: {
												opacity: 1,
												y: 0
											},
											transition: {
												...springSnappy,
												delay: i * .015
											},
											whileTap: tapScaleSoft,
											onClick: () => {
												playAt(i);
											},
											"aria-label": `Play ${t.title}`,
											"aria-current": isCurrent ? "true" : void 0,
											className: `w-full flex items-center gap-3 py-1.5 px-2 rounded-lg text-left my-0.5 ${isCurrent ? "bg-white/10 ring-1 ring-primary/40" : "active:bg-white/5"}`,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "relative shrink-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														src: t.thumbnail,
														alt: "",
														className: "h-11 w-11 rounded-md object-cover bg-muted"
													}), isCurrent && isPlaying && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "absolute inset-0 grid place-items-center bg-black/40 rounded-md",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingBars, {})
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0 flex-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: `text-[15px] truncate ${isCurrent ? "text-primary font-semibold" : "text-white/95"}`,
														children: t.title
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-[12px] text-white/55 truncate",
														children: t.artist
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[12px] text-white/44 tabular-nums shrink-0",
													children: formatTime(t.duration || 0)
												})
											]
										}, `${t.id}-${i}`);
									})
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "shrink-0",
						children: [
							!showQueue && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3 mb-3 mt-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1 flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.img, {
											layoutId: "player-artwork-thumb",
											src: current.thumbnail,
											onError: (e) => {
												const el = e.currentTarget;
												const next = fallbackArtwork(el.src);
												if (next && next !== el.src) el.src = next;
											},
											alt: "",
											className: "h-12 w-12 rounded-lg object-cover bg-muted shrink-0 shadow"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
												layoutId: "player-track-title",
												transition: layoutTransition,
												className: "leading-tight truncate text-[16px] font-semibold",
												children: current.title
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "truncate text-[13px] text-white/65",
												children: current.artist
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
										whileTap: tapScale,
										transition: springSnappy,
										onClick: () => setShowQueue((v) => !v),
										className: "p-2 rounded-full bg-white/15",
										"aria-label": "Playing Next",
										"aria-pressed": showQueue,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListOrdered, { className: "h-5 w-5" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
										whileTap: tapScale,
										transition: springSnappy,
										onClick: () => lib.toggleFavorite(current),
										className: "p-2 rounded-full bg-white/15",
										"aria-label": "Favorite",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: `h-5 w-5 ${fav ? "fill-current text-primary" : ""}` })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
										whileTap: tapScale,
										transition: springSnappy,
										onClick: onMore,
										className: "p-2 rounded-full bg-white/15",
										"aria-label": "More",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "h-5 w-5" })
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
								variants: fadeUpVariant,
								className: "mb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "range",
									className: "am-slider",
									min: 0,
									max: duration || 0,
									step: 1,
									value: Math.min(position, duration || 0),
									onChange: (e) => seek(Number(e.target.value))
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-[11px] text-white/60 mt-1 tabular-nums",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatTime(position) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["-", formatTime(Math.max(0, (duration || 0) - position))] })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
								variants: fadeUpVariant,
								className: "flex items-center justify-between mb-4 px-8",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
										whileTap: tapScale,
										transition: springSnappy,
										onClick: prev,
										className: "p-3",
										"aria-label": "Previous",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipBack, { className: "h-8 w-8 fill-current" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
										whileTap: { scale: .88 },
										transition: springSnappy,
										onClick: toggle,
										className: "p-3",
										"aria-label": isPlaying ? "Pause" : "Play",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
											mode: "wait",
											initial: false,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
												initial: {
													opacity: 0,
													scale: .7
												},
												animate: {
													opacity: 1,
													scale: 1
												},
												exit: {
													opacity: 0,
													scale: .7
												},
												transition: {
													duration: .15,
													ease: [
														.32,
														.72,
														0,
														1
													]
												},
												className: "block",
												children: isPlaying ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "h-14 w-14 fill-current" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-14 w-14 fill-current" })
											}, isPlaying ? "pause" : "play")
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
										whileTap: tapScale,
										transition: springSnappy,
										onClick: next,
										className: "p-3",
										"aria-label": "Next",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, { className: "h-8 w-8 fill-current" })
									})
								]
							})
						]
					}),
					!showQueue && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
						variants: fadeUpVariant,
						className: "flex items-center justify-between text-white/70 pb-4 mt-2 shrink-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
								whileTap: tapScale,
								transition: springSnappy,
								onClick: toggleShuffle,
								className: `p-2 ${shuffle ? "text-primary" : ""}`,
								"aria-label": "Shuffle",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shuffle, { className: "h-5 w-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.button, {
								whileTap: tapScaleSoft,
								transition: springSnappy,
								onClick: onShowLyrics,
								className: "flex items-center gap-1.5 text-[12px] uppercase tracking-wide",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" }), " Lyrics"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
								whileTap: tapScale,
								transition: springSnappy,
								onClick: cycleRepeat,
								className: `p-2 ${repeat !== "off" ? "text-primary" : ""}`,
								"aria-label": "Repeat",
								children: repeat === "one" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat1, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat, { className: "h-5 w-5" })
							})
						]
					})
				]
			})]
		})]
	}, "full") })] });
}
var fadeUpVariant = {
	hidden: {
		opacity: 0,
		y: 16
	},
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			stiffness: 340,
			damping: 34,
			mass: .85
		}
	}
};
/** Lightweight Motion bundle — only DOM animation features loaded */
function MotionProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyMotion, {
		features: domAnimation,
		children
	});
}
/** Apple logo glyph + "Music" wordmark, centered. */
function AppleMusicLogo({ className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		initial: {
			opacity: 0,
			y: -8
		},
		animate: {
			opacity: 1,
			y: 0
		},
		transition: {
			duration: .5,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		className: `flex items-center justify-center gap-1.5 ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			viewBox: "0 0 384 512",
			className: "h-[22px] w-[22px] text-primary",
			fill: "currentColor",
			"aria-hidden": true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[19px] font-semibold tracking-tight text-foreground",
			children: "Music"
		})]
	});
}
var TAB_ORDER = [
	"listen",
	"recognize",
	"library",
	"search"
];
function getTabDirection(from, to) {
	return TAB_ORDER.indexOf(to) >= TAB_ORDER.indexOf(from) ? 1 : -1;
}
function TabBar({ tab, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border pb-safe gpu-layer",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutGroup, {
			id: "tab-bar",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-stretch justify-around relative",
				children: [
					{
						id: "listen",
						label: "Listen Now",
						icon: Radio
					},
					{
						id: "recognize",
						label: "Recognize",
						icon: Mic
					},
					{
						id: "library",
						label: "Library",
						icon: Library
					},
					{
						id: "search",
						label: "Search",
						icon: Search
					}
				].map(({ id, label, icon: Icon }) => {
					const active = tab === id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.button, {
						onClick: () => onChange(id),
						whileTap: { scale: .88 },
						transition: springSnappy,
						className: `relative flex-1 flex flex-col items-center justify-center gap-1 py-2 ${active ? "text-primary" : "text-muted-foreground"}`,
						children: [
							active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
								layoutId: "tab-pill",
								transition: springSnappy,
								className: "absolute inset-x-3 inset-y-1.5 rounded-xl bg-primary/12"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "relative h-[22px] w-[22px]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "relative text-[10px] font-medium",
								children: label
							})
						]
					}, id);
				})
			})
		})
	});
}
function TrackRow({ track, index, onPlay, onMore, delay = 0 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
		initial: {
			opacity: 0,
			x: -8
		},
		animate: {
			opacity: 1,
			x: 0
		},
		transition: {
			...springSnappy,
			delay
		},
		className: "w-full flex items-center gap-3 py-2 px-1 active:bg-white/5 rounded-md text-left",
		children: [
			typeof index === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "w-5 text-center text-muted-foreground text-[14px] tabular-nums",
				children: index
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.button, {
				whileTap: tapScaleSoft,
				transition: springSnappy,
				onClick: onPlay,
				className: "flex items-center gap-3 flex-1 min-w-0 text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: track.thumbnail,
					alt: "",
					className: "h-12 w-12 rounded-md object-cover bg-muted"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-w-0 border-b border-border pb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[15px] truncate text-foreground",
						children: track.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[13px] text-muted-foreground truncate",
						children: track.artist
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
				whileTap: tapScaleSoft,
				transition: springSnappy,
				onClick: () => onMore?.(track),
				className: "p-2 text-muted-foreground",
				"aria-label": "More",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "h-5 w-5" })
			})
		]
	});
}
function LibraryView({ onMore }) {
	const lib = useLibrary();
	const { playTrack } = usePlayer();
	const [view, setView] = (0, import_react.useState)({ kind: "root" });
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const upgradeArtwork = (0, import_react.useCallback)((id, newThumb) => {
		lib.setTrackArtwork(id, newThumb);
	}, [lib]);
	useUpgradeArtwork(useAllLibraryTracks(lib), upgradeArtwork);
	if (view.kind === "playlist") {
		const pl = lib.playlists.find((p) => p.id === view.id);
		if (!pl) {
			setView({ kind: "playlists" });
			return null;
		}
		const tracks = lib.getTracks(pl.trackIds);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubHeader, {
			title: pl.name,
			onBack: () => setView({ kind: "playlists" }),
			right: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => {
					lib.deletePlaylist(pl.id);
					setView({ kind: "playlists" });
				},
				className: "p-2 text-destructive",
				"aria-label": "Delete",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-5 w-5" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-4",
			children: tracks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListMusic, {}),
				title: "No songs yet",
				sub: "Tap ••• on any song to add it here."
			}) : tracks.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackRow, {
				track: t,
				index: i + 1,
				onPlay: () => playTrack(t, tracks),
				onMore
			}, t.id))
		})] });
	}
	if (view.kind === "playlists") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubHeader, {
		title: "Playlists",
		onBack: () => setView({ kind: "root" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4",
		children: [
			creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						autoFocus: true,
						value: name,
						onChange: (e) => setName(e.target.value),
						placeholder: "Playlist name",
						className: "flex-1 bg-secondary rounded-lg px-3 py-2 text-[15px] outline-none"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "px-3 py-2 rounded-lg bg-primary text-primary-foreground text-[14px] font-medium",
						onClick: () => {
							if (!name.trim()) return;
							lib.createPlaylist(name);
							setName("");
							setCreating(false);
						},
						children: "Create"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "px-3 py-2 text-muted-foreground",
						onClick: () => {
							setCreating(false);
							setName("");
						},
						children: "Cancel"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setCreating(true),
				className: "w-full flex items-center gap-3 py-3 text-primary text-[15px] font-medium",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-5 w-5" }), " New Playlist"]
			}),
			lib.playlists.length === 0 && !creating && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListMusic, {}),
				title: "No playlists yet",
				sub: "Create your first playlist."
			}),
			lib.playlists.map((p) => {
				const cover = lib.getTracks(p.trackIds.slice(0, 1))[0]?.thumbnail;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setView({
						kind: "playlist",
						id: p.id
					}),
					className: "w-full flex items-center gap-3 py-2 active:bg-white/5 rounded-md text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-12 w-12 rounded-md bg-muted overflow-hidden flex items-center justify-center",
						children: cover ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: cover,
							alt: "",
							className: "h-full w-full object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListMusic, { className: "h-5 w-5 text-muted-foreground" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0 border-b border-border pb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[15px] truncate",
							children: p.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[13px] text-muted-foreground",
							children: [p.trackIds.length, " songs"]
						})]
					})]
				}, p.id);
			})
		]
	})] });
	if (view.kind === "favorites") {
		const tracks = lib.getTracks(lib.favorites);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubHeader, {
			title: "Favorites",
			onBack: () => setView({ kind: "root" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-4",
			children: tracks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {}),
				title: "No favorites yet",
				sub: "Tap ••• → Add to Favorites."
			}) : tracks.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackRow, {
				track: t,
				index: i + 1,
				onPlay: () => playTrack(t, tracks),
				onMore
			}, t.id))
		})] });
	}
	if (view.kind === "songs") {
		const tracks = lib.getTracks(lib.songs);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubHeader, {
			title: "Songs",
			onBack: () => setView({ kind: "root" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-4",
			children: tracks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music2, {}),
				title: "No songs in your library",
				sub: "Tap ••• → Add to Library."
			}) : tracks.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackRow, {
				track: t,
				index: i + 1,
				onPlay: () => playTrack(t, tracks),
				onMore
			}, t.id))
		})] });
	}
	const items = [
		{
			label: "Playlists",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListMusic, { className: "h-5 w-5" }),
			onClick: () => setView({ kind: "playlists" }),
			count: lib.playlists.length
		},
		{
			label: "Favorites",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "h-5 w-5" }),
			onClick: () => setView({ kind: "favorites" }),
			count: lib.favorites.length
		},
		{
			label: "Songs",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music2, { className: "h-5 w-5" }),
			onClick: () => setView({ kind: "songs" }),
			count: lib.songs.length
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-[28px] font-bold tracking-tight px-4 pt-3 pb-2",
			children: "Library"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-4",
			children: items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: it.onClick,
				className: "w-full flex items-center gap-4 py-3 border-b border-border active:bg-white/5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-primary",
						children: it.icon
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex-1 text-left text-[17px]",
						children: it.label
					}),
					typeof it.count === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground text-[14px]",
						children: it.count
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground",
						children: "›"
					})
				]
			}, it.label))
		}),
		lib.songs.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-4 pt-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-[20px] font-bold mb-2",
				children: "Recently Added"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-3",
				children: lib.getTracks(lib.songs).slice(0, 6).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => playTrack(t, lib.getTracks(lib.songs)),
					className: "text-left active:opacity-70",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: t.thumbnail,
							alt: "",
							className: "w-full aspect-square rounded-xl object-cover bg-muted"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[14px] font-medium mt-2 line-clamp-1",
							children: t.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[12px] text-muted-foreground line-clamp-1",
							children: t.artist
						})
					]
				}, t.id))
			})]
		})
	] });
}
function SubHeader({ title, onBack, right }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-1 px-2 pt-2 pb-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: onBack,
				className: "p-2 text-primary flex items-center text-[15px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-5 w-5" }), " Library"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1" }),
			right
		]
	});
}
function Empty({ icon, title, sub }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "text-center py-16 text-muted-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto mb-3 h-12 w-12 flex items-center justify-center rounded-full bg-secondary",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[15px] text-foreground font-medium",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[13px] mt-1",
				children: sub
			})
		]
	});
}
function useAllLibraryTracks(lib) {
	const ids = (0, import_react.useMemo)(() => {
		const set = /* @__PURE__ */ new Set();
		for (const id of lib.songs) set.add(id);
		for (const id of lib.favorites) set.add(id);
		for (const p of lib.playlists) for (const id of p.trackIds) set.add(id);
		return Array.from(set);
	}, [
		lib.songs,
		lib.favorites,
		lib.playlists
	]);
	return (0, import_react.useMemo)(() => ids.map((id) => lib.tracks[id]).filter(Boolean), [ids, lib.tracks]);
}
function ActionSheet({ track, onClose, onShowLyrics }) {
	const lib = useLibrary();
	const { playTrack } = usePlayer();
	const [view, setView] = (0, import_react.useState)("main");
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const close = () => {
		setView("main");
		setCreating(false);
		setName("");
		onClose();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: track && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[60] flex items-end",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
			initial: { opacity: 0 },
			animate: { opacity: 1 },
			exit: { opacity: 0 },
			transition: { duration: .25 },
			className: "absolute inset-0 bg-black/60",
			onClick: close,
			"aria-label": "Close"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
			initial: { y: "100%" },
			animate: { y: 0 },
			exit: { y: "100%" },
			transition: springPlayer,
			drag: "y",
			dragConstraints: {
				top: 0,
				bottom: 0
			},
			dragElastic: {
				top: 0,
				bottom: .4
			},
			onDragEnd: (_, info) => {
				if (info.offset.y > 80 || info.velocity.y > 350) close();
			},
			className: "relative w-full bg-popover rounded-t-3xl pb-safe gpu-layer",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-center pt-2.5 pb-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1 w-9 rounded-full bg-muted-foreground/30" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 p-4 border-b border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: track.thumbnail,
							alt: "",
							className: "h-14 w-14 rounded-lg object-cover bg-muted"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[15px] font-semibold truncate",
								children: track.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[13px] text-muted-foreground truncate",
								children: track.artist
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
							whileTap: tapScaleSoft,
							transition: springSnappy,
							onClick: close,
							className: "p-2 text-muted-foreground",
							"aria-label": "Close",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
					mode: "wait",
					initial: false,
					children: view === "main" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
						initial: {
							opacity: 0,
							x: -12
						},
						animate: {
							opacity: 1,
							x: 0
						},
						exit: {
							opacity: 0,
							x: 12
						},
						transition: {
							duration: .22,
							ease: [
								.32,
								.72,
								0,
								1
							]
						},
						className: "py-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-5 w-5" }),
								label: "Play",
								onClick: () => {
									playTrack(track, [track]);
									close();
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: `h-5 w-5 ${lib.isFavorite(track.id) ? "fill-primary text-primary" : ""}` }),
								label: lib.isFavorite(track.id) ? "Remove from Favorites" : "Add to Favorites",
								onClick: () => {
									const fav = lib.isFavorite(track.id);
									lib.toggleFavorite(track);
									toast.success(fav ? "Removed from Favorites" : "Added to Favorites");
									close();
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-5 w-5" }),
								label: lib.isInLibrary(track.id) ? "Remove from Library" : "Add to Library",
								onClick: () => {
									if (lib.isInLibrary(track.id)) {
										lib.removeFromLibrary(track.id);
										toast.success("Removed from Library");
									} else {
										lib.addToLibrary(track);
										toast.success("Added to Library");
									}
									close();
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListMusic, { className: "h-5 w-5" }),
								label: "Add to a Playlist…",
								onClick: () => setView("playlists"),
								chevron: true
							}),
							onShowLyrics && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-5 w-5" }),
								label: "Show Lyrics",
								onClick: () => {
									onShowLyrics(track);
									close();
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-5 w-5" }),
								label: "Download",
								onClick: () => {
									toast.info("Downloading isn't available", { description: "YouTube's terms prevent direct downloads from the browser." });
								}
							})
						]
					}, "main") : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
						initial: {
							opacity: 0,
							x: 12
						},
						animate: {
							opacity: 1,
							x: 0
						},
						exit: {
							opacity: 0,
							x: -12
						},
						transition: {
							duration: .22,
							ease: [
								.32,
								.72,
								0,
								1
							]
						},
						className: "py-1 max-h-[60vh] overflow-y-auto",
						children: [
							creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-4 py-3 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									autoFocus: true,
									value: name,
									onChange: (e) => setName(e.target.value),
									placeholder: "Playlist name",
									className: "flex-1 bg-secondary rounded-lg px-3 py-2 text-[15px] outline-none"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "px-3 py-2 rounded-lg bg-primary text-primary-foreground text-[14px] font-medium",
									onClick: () => {
										const pl = lib.createPlaylist(name);
										lib.addToPlaylist(pl.id, track);
										toast.success(`Added to ${pl.name}`);
										close();
									},
									children: "Create"
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-5 w-5" }),
								label: "New Playlist",
								onClick: () => setCreating(true)
							}),
							lib.playlists.length === 0 && !creating && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-4 py-6 text-center text-[13px] text-muted-foreground",
								children: "No playlists yet"
							}),
							lib.playlists.map((p) => {
								const has = p.trackIds.includes(track.id);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListMusic, { className: "h-5 w-5" }),
									label: p.name,
									trailing: has ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-5 w-5 text-primary" }) : null,
									onClick: () => {
										if (has) return close();
										lib.addToPlaylist(p.id, track);
										toast.success(`Added to ${p.name}`);
										close();
									}
								}, p.id);
							})
						]
					}, "playlists")
				})
			]
		})]
	}, track.id) });
}
function Row({ icon, label, onClick, chevron, trailing }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.button, {
		whileTap: tapScaleSoft,
		transition: springSnappy,
		onClick,
		className: "w-full flex items-center gap-4 px-5 py-3 active:bg-white/5 text-left",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-foreground",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1 text-[15px]",
				children: label
			}),
			trailing,
			chevron && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted-foreground",
				children: "›"
			})
		]
	});
}
var getLyrics = createServerFn({ method: "POST" }).inputValidator(objectType({
	title: stringType().min(1).max(300),
	artist: stringType().min(1).max(300),
	duration: numberType().optional()
})).handler(createSsrRpc("36a7be5fce9b11b0b679b0679f54ff45fc3036e66ce634e3f2c42eccb02a10d3"));
function LyricsView({ track, onClose }) {
	const fetchLyrics = useServerFn(getLyrics);
	const { position, seek } = usePlayer();
	const containerRef = (0, import_react.useRef)(null);
	const [activeIdx, setActiveIdx] = (0, import_react.useState)(-1);
	const { data, isLoading } = useQuery({
		queryKey: ["lyrics", track?.id],
		queryFn: () => fetchLyrics({ data: {
			title: track.title,
			artist: track.artist,
			duration: track.duration
		} }),
		enabled: !!track,
		staleTime: Infinity
	});
	(0, import_react.useEffect)(() => {
		if (!data?.synced) return;
		let idx = -1;
		for (let i = 0; i < data.synced.length; i++) if (data.synced[i].time <= position) idx = i;
		else break;
		if (idx !== activeIdx) {
			setActiveIdx(idx);
			(containerRef.current?.querySelector(`[data-line="${idx}"]`))?.scrollIntoView({
				block: "center",
				behavior: "smooth"
			});
		}
	}, [
		position,
		data,
		activeIdx
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: track && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
		initial: {
			opacity: 0,
			y: 24
		},
		animate: {
			opacity: 1,
			y: 0
		},
		exit: {
			opacity: 0,
			y: 32
		},
		transition: springPlayer,
		className: "fixed inset-0 z-[70] text-foreground gpu-layer",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute inset-0 pointer-events-none",
			"aria-hidden": true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 scale-[1.25] gpu-layer",
				style: {
					backgroundImage: `url(${track.thumbnail})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					filter: "blur(64px) saturate(160%)"
				}
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-black/70" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative h-full flex flex-col pt-safe pb-safe",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-5 pt-3 pb-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[16px] font-semibold truncate",
						children: track.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[13px] text-white/60 truncate",
						children: track.artist
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
					whileTap: tapScaleSoft,
					transition: springSnappy,
					onClick: onClose,
					className: "p-2 text-white/80",
					"aria-label": "Close",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-6 w-6" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: containerRef,
				className: "flex-1 overflow-y-auto px-6 pb-32 pt-24 space-y-5",
				children: [
					isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
						initial: { opacity: 0 },
						animate: { opacity: 1 },
						transition: fadeTween,
						className: "text-center text-white/60 text-[14px]",
						children: "Loading lyrics…"
					}),
					!isLoading && !data?.synced && !data?.plain && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center text-white/60 text-[14px]",
						children: "No lyrics found for this track."
					}),
					!isLoading && data?.synced && data.synced.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
						"data-line": i,
						onClick: () => seek(l.time),
						animate: {
							opacity: i === activeIdx ? 1 : .35,
							scale: i === activeIdx ? 1 : .98
						},
						transition: {
							duration: .35,
							ease: [
								.32,
								.72,
								0,
								1
							]
						},
						className: `block w-full text-left text-[24px] font-bold leading-snug ${i === activeIdx ? "text-white" : "text-white/35"}`,
						children: l.text || "♪"
					}, i)),
					!isLoading && !data?.synced && data?.plain && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "whitespace-pre-wrap text-[16px] leading-relaxed text-white/85 font-sans",
						children: data.plain
					})
				]
			})]
		})]
	}, track.id) });
}
var recognizeAudio = createServerFn({ method: "POST" }).inputValidator(objectType({
	audioBase64: stringType().min(100).max(1e7),
	mime: stringType().min(3).max(64)
})).handler(createSsrRpc("c415311005042a443a3ad669ccb2343a3d56f9ed3d8fed3f7af0a607ad46773a"));
var RECENT_KEY = "recognize.recent.v1";
function RecognizeView() {
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [recent, setRecent] = (0, import_react.useState)([]);
	const recognize = useServerFn(recognizeAudio);
	const search = useServerFn(searchMusic);
	const { playTrack } = usePlayer();
	const recorderRef = (0, import_react.useRef)(null);
	const streamRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem(RECENT_KEY);
			if (raw) setRecent(JSON.parse(raw));
		} catch {}
	}, []);
	const saveRecent = (item) => {
		const next = [item, ...recent.filter((r) => r.title !== item.title)].slice(0, 8);
		setRecent(next);
		try {
			localStorage.setItem(RECENT_KEY, JSON.stringify(next));
		} catch {}
	};
	const cleanup = (0, import_react.useCallback)(() => {
		try {
			recorderRef.current?.stop();
		} catch {}
		streamRef.current?.getTracks().forEach((t) => t.stop());
		recorderRef.current = null;
		streamRef.current = null;
	}, []);
	(0, import_react.useEffect)(() => cleanup, [cleanup]);
	const start = (0, import_react.useCallback)(async () => {
		if (phase !== "idle") {
			cleanup();
			setPhase("idle");
			return;
		}
		let stream;
		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch {
			toast.error("Microphone permission denied");
			return;
		}
		streamRef.current = stream;
		const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
		const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : void 0);
		recorderRef.current = rec;
		const chunks = [];
		rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
		rec.onstop = async () => {
			stream.getTracks().forEach((t) => t.stop());
			setPhase("matching");
			try {
				const buf = await new Blob(chunks, { type: rec.mimeType || "audio/webm" }).arrayBuffer();
				const b64 = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ""));
				const result = await recognize({ data: {
					audioBase64: b64,
					mime: rec.mimeType || "audio/webm"
				} });
				if (!result.ok) {
					toast.error("Couldn't recognize that. Try again with clearer audio.");
					setPhase("idle");
					return;
				}
				const { title, artist } = result.song;
				saveRecent({
					title,
					artist,
					at: Date.now()
				});
				toast.success(`${title} — ${artist}`);
				const q = `${title} ${artist}`;
				const sr = await search({ data: { query: q } });
				const top = (sr.tracks ?? [])[0];
				if (top) playTrack(top, sr.tracks);
				else toast.error("Found it, but couldn't locate audio");
			} catch (e) {
				toast.error(e?.message ?? "Recognition failed");
			} finally {
				setPhase("idle");
			}
		};
		rec.start();
		setPhase("listening");
		setTimeout(() => {
			if (recorderRef.current && recorderRef.current.state === "recording") recorderRef.current.stop();
		}, 7e3);
	}, [
		phase,
		cleanup,
		recognize,
		search,
		playTrack,
		recent
	]);
	const listening = phase === "listening";
	const matching = phase === "matching";
	const active = listening || matching;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-[calc(100vh-160px)] flex flex-col items-center px-6 pt-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-2 text-[22px] font-bold",
				children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioLines, { className: "h-6 w-6" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: matching ? "Matching…" : "Listening for music" })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Headphones, { className: "h-6 w-6" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Tap to Recognize" })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mt-16 mb-4 grid place-items-center",
				style: {
					width: 280,
					height: 280
				},
				children: [active && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 rounded-full bg-foreground/10 animate-ping" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute rounded-full bg-foreground/[0.06]",
						style: {
							inset: -40,
							animation: "ping 2.4s cubic-bezier(0,0,0.2,1) infinite"
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute rounded-full bg-foreground/[0.04]",
						style: {
							inset: -80,
							animation: "ping 3s cubic-bezier(0,0,0.2,1) infinite"
						}
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: start,
					"aria-label": active ? "Cancel" : "Start recognition",
					className: "relative h-44 w-44 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-2xl ring-1 ring-white/10 grid place-items-center active:scale-95 transition",
					style: { boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)" },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShazamLikeGlyph, {})
				})]
			}),
			matching && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[14px] text-muted-foreground mt-2",
				children: "Finding the song…"
			}),
			listening && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[14px] text-muted-foreground mt-2 text-center max-w-[260px]",
				children: "Make sure your device can hear the song clearly"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full mt-14",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-[18px] font-bold mb-3",
					children: "Recently Found"
				}), recent.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl bg-card/60 border border-border/60 p-6 text-center text-[13px] text-muted-foreground",
					children: "Songs you recognize will appear here"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2",
					children: recent.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: async () => {
							const sr = await search({ data: { query: `${r.title} ${r.artist}` } });
							const top = (sr.tracks ?? [])[0];
							if (top) playTrack(top, sr.tracks);
						},
						className: "shrink-0 w-44 text-left rounded-2xl bg-card/60 border border-border/60 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-24 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 mb-2 grid place-items-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioLines, { className: "h-6 w-6 text-white/70" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[14px] font-semibold line-clamp-1",
								children: r.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[12px] text-muted-foreground line-clamp-1",
								children: r.artist
							})
						]
					}, r.at))
				})]
			})
		]
	});
}
function ShazamLikeGlyph() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 100 100",
		className: "h-20 w-20",
		fill: "none",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M68 30c-5-6-13-9-21-7-10 2-17 11-15 21 1 7 7 11 15 13l8 2c6 1 10 5 11 10 1 9-8 16-19 14-7-1-13-5-16-12",
			stroke: "white",
			strokeWidth: "11",
			strokeLinecap: "round"
		})
	});
}
function ProfileMenu({ open, onClose }) {
	const { theme, setTheme } = useTheme();
	const dragControls = useDragControls();
	const dragY = useMotionValue(0);
	const scrimOpacity = useTransform(dragY, [0, 320], [1, 0]);
	const bottomRadius = useTransform(dragY, [0, 200], [36, 12]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);
	const isApple = theme === "apple-music";
	const themeRow = {
		key: "theme",
		label: "Theme Settings",
		icon: Palette,
		trailing: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			role: "switch",
			"aria-checked": !isApple,
			"aria-label": "Toggle theme",
			className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isApple ? "bg-white/15" : "bg-primary"}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
				layout: true,
				transition: springSnappy,
				className: `inline-block h-5 w-5 rounded-full bg-white shadow ${isApple ? "translate-x-0.5" : "translate-x-[22px]"}`
			})
		}),
		onClick: () => setTheme(isApple ? "youtube-music" : "apple-music")
	};
	const general = [
		{
			key: "account",
			label: "Account",
			icon: User
		},
		{
			key: "billing",
			label: "Subscription",
			icon: CreditCard
		},
		themeRow,
		{
			key: "notifications",
			label: "Notifications",
			icon: Bell
		}
	];
	const preferences = [
		{
			key: "playback",
			label: "Playback",
			icon: Music
		},
		{
			key: "appearance",
			label: "Appearance",
			icon: Moon
		},
		{
			key: "privacy",
			label: "Privacy & Security",
			icon: Shield
		}
	];
	const support = [
		{
			key: "help",
			label: "Help Center",
			icon: CircleQuestionMark
		},
		{
			key: "settings",
			label: "Settings",
			icon: Cog
		},
		{
			key: "signout",
			label: "Sign Out",
			icon: LogOut,
			destructive: true
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: {
			opacity: 0,
			transition: {
				duration: .22,
				ease: appleEase
			}
		},
		transition: {
			duration: .28,
			ease: appleEase
		},
		onClick: onClose,
		"aria-hidden": true,
		className: "fixed inset-0 z-40 bg-black/55 gpu-layer",
		style: { opacity: scrimOpacity }
	}, "scrim"), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
		role: "dialog",
		"aria-modal": "true",
		"aria-label": "User menu",
		initial: { y: "-100%" },
		animate: { y: 0 },
		exit: {
			y: "-100%",
			transition: {
				type: "spring",
				stiffness: 360,
				damping: 38,
				mass: .9
			}
		},
		transition: springPlayer,
		drag: "y",
		dragControls,
		dragListener: true,
		dragConstraints: {
			top: 0,
			bottom: 0
		},
		dragElastic: {
			top: .02,
			bottom: .35
		},
		onDragEnd: (_, info) => {
			if (info.offset.y < -120 || info.velocity.y < -500) onClose();
		},
		style: {
			y: dragY,
			touchAction: "pan-y"
		},
		className: "fixed inset-0 z-50 flex flex-col text-foreground overflow-hidden gpu-layer",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
				style: {
					borderBottomLeftRadius: bottomRadius,
					borderBottomRightRadius: bottomRadius
				},
				className: "absolute inset-0 border-b border-white/15 shadow-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0",
					style: {
						background: "rgba(255, 255, 255, 0.10)",
						backdropFilter: "blur(20px) saturate(180%)",
						WebkitBackdropFilter: "blur(20px) saturate(180%)"
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"aria-hidden": true,
					className: "absolute inset-x-0 top-0 h-px",
					style: { background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)" }
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative flex flex-col items-center pt-2.5 pb-1 touch-none select-none",
				onPointerDown: (e) => dragControls.start(e),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1.5 w-10 rounded-full bg-white/30" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative px-4 pt-2 pb-3 flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[12px] uppercase tracking-[0.16em] text-white/55 font-semibold",
						children: "Account"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-[28px] font-bold tracking-tight text-white",
						children: "Profile"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
					whileTap: tapScale,
					transition: springSnappy,
					onClick: onClose,
					"aria-label": "Close profile menu",
					className: "h-9 w-9 grid place-items-center rounded-full bg-white/10 active:bg-white/20 text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
				initial: {
					opacity: 0,
					y: 10
				},
				animate: {
					opacity: 1,
					y: 0,
					transition: {
						...springSnappy,
						delay: .05
					}
				},
				className: "relative mx-4 mb-4 flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-12 w-12 rounded-full bg-secondary grid place-items-center text-[14px] font-semibold text-foreground/90 ring-1 ring-white/15",
						children: "GK"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[15px] font-semibold truncate text-white",
							children: "Gaurrav Kumawat"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[12px] text-white/65 truncate",
							children: "gaurrav@applemusic.app"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 text-[10px] uppercase tracking-wider text-white/75 px-2 py-1 rounded-full bg-white/12",
						children: isApple ? "Apple Music" : "YouTube Music"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
				variants: staggerContainer,
				initial: "hidden",
				animate: "visible",
				className: "relative flex-1 overflow-y-auto px-4 pb-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "General",
						rows: general,
						onClose
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "Preferences",
						rows: preferences,
						onClose
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "Support",
						rows: support,
						onClose,
						last: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 text-[11px] text-white/45 text-center",
						children: "Music Web Player · v1.0"
					})
				]
			})
		]
	}, "sheet")] }) });
}
function Section({ title, rows, onClose, last }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.section, {
		variants: {
			hidden: {
				opacity: 0,
				y: 10
			},
			visible: {
				opacity: 1,
				y: 0,
				transition: springSnappy
			}
		},
		className: `mb-3 rounded-2xl border border-white/10 bg-white/5 overflow-hidden ${last ? "" : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.14em] text-white/45 font-semibold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "px-1 pb-2",
			children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowItem, {
				row,
				onClose
			}, row.key))
		})]
	});
}
function RowItem({ row, onClose }) {
	const Icon = row.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.button, {
		role: "menuitem",
		whileTap: tapScale,
		transition: springSnappy,
		onClick: () => {
			row.onClick?.();
			if (row.key !== "theme") onClose();
		},
		className: `w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left active:bg-white/10 ${row.destructive ? "text-red-300" : "text-white"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `grid place-items-center h-8 w-8 rounded-lg ${row.destructive ? "bg-red-500/15" : "bg-white/10"}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1 text-[15px] font-medium truncate",
				children: row.label
			}),
			row.trailing
		]
	}) });
}
function App() {
	const [tab, setTab] = (0, import_react.useState)("listen");
	const prevTab = (0, import_react.useRef)("listen");
	const direction = getTabDirection(prevTab.current, tab);
	const { current } = usePlayer();
	const [moreFor, setMoreFor] = (0, import_react.useState)(null);
	const [lyricsFor, setLyricsFor] = (0, import_react.useState)(null);
	const [profileOpen, setProfileOpen] = (0, import_react.useState)(false);
	const handleTabChange = (next) => {
		prevTab.current = tab;
		setTab(next);
	};
	(0, import_react.useEffect)(() => {
		setProfileOpen(false);
	}, [tab]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
				mode: "wait",
				initial: false,
				children: tab === "listen" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.header, {
					initial: {
						opacity: 0,
						y: -8
					},
					animate: {
						opacity: 1,
						y: 0
					},
					exit: {
						opacity: 0,
						y: -8
					},
					transition: {
						duration: .22,
						ease: [
							.32,
							.72,
							0,
							1
						]
					},
					className: "sticky top-0 z-30 glass pt-safe",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 items-center px-4 h-12",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppleMusicLogo, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex justify-end",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.button, {
									whileTap: tapScale,
									transition: springSnappy,
									onClick: () => setProfileOpen((v) => !v),
									"aria-label": "Open profile menu",
									"aria-expanded": profileOpen,
									"aria-haspopup": "menu",
									className: `h-8 w-8 rounded-full bg-secondary grid place-items-center text-[12px] font-semibold text-foreground/80 transition-colors ${profileOpen ? "ring-2 ring-primary" : ""}`,
									children: "GK"
								})
							})
						]
					})
				}, "listen-header")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileMenu, {
				open: profileOpen,
				onClose: () => setProfileOpen(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: tab === "listen" ? "" : "pt-safe",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
					mode: "wait",
					custom: direction,
					initial: false,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
						custom: direction,
						variants: {
							enter: (d) => ({
								opacity: 0,
								x: d * 20
							}),
							center: {
								opacity: 1,
								x: 0,
								transition: {
									duration: .28,
									ease: [
										.32,
										.72,
										0,
										1
									]
								}
							},
							exit: (d) => ({
								opacity: 0,
								x: d * -16,
								transition: {
									duration: .2,
									ease: [
										.32,
										.72,
										0,
										1
									]
								}
							})
						},
						initial: "enter",
						animate: "center",
						exit: "exit",
						children: [
							tab === "listen" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListenNow, { onMore: setMoreFor }),
							tab === "search" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchView, { onMore: setMoreFor }),
							tab === "library" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LibraryView, { onMore: setMoreFor }),
							tab === "recognize" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecognizeView, {})
						]
					}, tab)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: current ? 140 : 80 } }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutGroup, {
				id: "player",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Player, {
					onMore: () => current && setMoreFor(current),
					onShowLyrics: () => current && setLyricsFor(current)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabBar, {
				tab,
				onChange: handleTabChange
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionSheet, {
				track: moreFor,
				onClose: () => setMoreFor(null),
				onShowLyrics: (t) => setLyricsFor(t)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LyricsView, {
				track: lyricsFor,
				onClose: () => setLyricsFor(null)
			})
		]
	});
}
function SectionHeader({ title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
		className: "text-[28px] font-bold tracking-tight px-4 pt-3 pb-2",
		children: title
	});
}
function ListenNow({ onMore }) {
	const trending = useServerFn(getTrending);
	const { data, isLoading } = useQuery({
		queryKey: ["trending"],
		queryFn: () => trending(),
		staleTime: 300 * 1e3
	});
	const { playTrack } = usePlayer();
	const [tracks, setTracks] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		const next = data?.tracks ?? [];
		setTracks((prev) => {
			const prevById = new Map(prev.map((t) => [t.id, t]));
			return next.map((t) => {
				const carry = prevById.get(t.id);
				return carry && carry.thumbnail && carry.thumbnail !== t.thumbnail ? {
					...t,
					thumbnail: carry.thumbnail
				} : t;
			});
		});
	}, [data]);
	useUpgradeArtwork(tracks, (0, import_react.useCallback)((id, newThumb) => {
		setTracks((prev) => {
			const idx = prev.findIndex((t) => t.id === id);
			if (idx === -1 || prev[idx].thumbnail === newThumb) return prev;
			const next = prev.slice();
			next[idx] = {
				...next[idx],
				thumbnail: newThumb
			};
			return next;
		});
	}, []));
	const dateLabel = (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, {
		weekday: "long",
		month: "long",
		day: "numeric"
	}).toUpperCase();
	const gradients = [
		"linear-gradient(160deg, #ff2d55, #7a0b2e)",
		"linear-gradient(160deg, #fa8c1f, #7a2e00)",
		"linear-gradient(160deg, #5e5ce6, #1a1240)",
		"linear-gradient(160deg, #30d158, #0b3a1f)",
		"linear-gradient(160deg, #64d2ff, #093a55)"
	];
	const labels = [
		"Top Hits 2025",
		"New Music Mix",
		"Chill Vibes",
		"Throwback",
		"Discovery"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-4 pt-3 pb-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[12px] uppercase tracking-wider text-muted-foreground font-semibold",
				children: dateLabel
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-[30px] font-bold tracking-tight",
				children: "Listen Now"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-[20px] font-bold px-4 mb-2 mt-2",
			children: "Top Picks"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
			variants: staggerContainer,
			initial: "hidden",
			animate: "visible",
			className: "flex gap-3 overflow-x-auto no-scrollbar px-4 pb-4 snap-x snap-mandatory",
			children: (isLoading ? Array.from({ length: 4 }) : tracks.slice(0, 5)).map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.button, {
				variants: fadeScaleItem,
				whileTap: tapScaleSoft,
				onClick: () => t && playTrack(t, tracks),
				className: "snap-start shrink-0 w-[280px] h-[340px] rounded-[26px] overflow-hidden relative text-left shadow-xl gpu-layer",
				style: { background: gradients[i % gradients.length] },
				children: [
					t?.thumbnail && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: t.thumbnail,
						alt: "",
						className: "absolute inset-0 w-full h-full object-cover opacity-25"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute top-5 left-5 right-5 text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-white text-[15px] font-semibold drop-shadow",
							children: labels[i % labels.length]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute bottom-5 left-5 right-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] uppercase tracking-wider text-white/70 font-semibold mb-1",
								children: "Playlist"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-white text-[22px] font-bold leading-tight line-clamp-2",
								children: t?.title ?? "Loading…"
							}),
							t?.artist && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-white/80 text-[14px] truncate",
								children: t.artist
							})
						]
					})
				]
			}, t?.id ?? i))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-[20px] font-bold px-4 mb-2",
			children: "Trending Now"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex gap-3 overflow-x-auto no-scrollbar px-4 pb-4",
			children: isLoading ? Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "shrink-0 w-40",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-40 h-40 rounded-xl bg-muted animate-pulse" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 mt-2 w-32 rounded bg-muted animate-pulse" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 mt-1 w-20 rounded bg-muted animate-pulse" })
				]
			}, i)) : tracks.slice(1, 12).map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.button, {
				initial: {
					opacity: 0,
					y: 14
				},
				animate: {
					opacity: 1,
					y: 0
				},
				transition: {
					delay: i * .035,
					type: "spring",
					stiffness: 300,
					damping: 32,
					mass: .9
				},
				whileTap: tapScaleSoft,
				onClick: () => playTrack(t, tracks),
				className: "shrink-0 w-40 text-left gpu-layer",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: t.thumbnail,
						alt: "",
						className: "w-40 h-40 rounded-xl object-cover bg-muted"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[14px] font-medium mt-2 line-clamp-1",
						children: t.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[12px] text-muted-foreground line-clamp-1 flex items-center gap-1",
						children: formatViews(t.views) ? `${formatViews(t.views)} plays` : t.artist
					})
				]
			}, t.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-[20px] font-bold px-4 mb-2 mt-2",
			children: "Made For You"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-4",
			children: tracks.slice(0, 10).map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackRow, {
				track: t,
				index: i + 1,
				delay: i * .03,
				onPlay: () => playTrack(t, tracks),
				onMore
			}, t.id + i))
		})
	] });
}
function SearchView({ onMore }) {
	const [q, setQ] = (0, import_react.useState)("");
	const [submitted, setSubmitted] = (0, import_react.useState)("");
	const search = useServerFn(searchMusic);
	const { data, isFetching } = useQuery({
		queryKey: ["search", submitted],
		queryFn: () => search({ data: { query: submitted } }),
		enabled: submitted.length > 0
	});
	const { playTrack } = usePlayer();
	(0, import_react.useEffect)(() => {
		const id = setTimeout(() => setSubmitted(q.trim()), 350);
		return () => clearTimeout(id);
	}, [q]);
	const serverTracks = data?.tracks ?? [];
	const [tracks, setTracks] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		setTracks((prev) => {
			const prevById = new Map(prev.map((t) => [t.id, t]));
			return serverTracks.map((t) => {
				const carry = prevById.get(t.id);
				return carry && carry.thumbnail && carry.thumbnail !== t.thumbnail ? {
					...t,
					thumbnail: carry.thumbnail
				} : t;
			});
		});
	}, [serverTracks]);
	useUpgradeArtwork(tracks, (0, import_react.useCallback)((id, newThumb) => {
		setTracks((prev) => {
			const idx = prev.findIndex((t) => t.id === id);
			if (idx === -1 || prev[idx].thumbnail === newThumb) return prev;
			const next = prev.slice();
			next[idx] = {
				...next[idx],
				thumbnail: newThumb
			};
			return next;
		});
	}, []));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, { title: "Search" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-4 pb-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 bg-secondary rounded-xl px-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 text-muted-foreground" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Artists, Songs, Lyrics, and More",
						className: "flex-1 bg-transparent outline-none text-[15px] placeholder:text-muted-foreground"
					}),
					q && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setQ(""),
						"aria-label": "Clear",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4 text-muted-foreground" })
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-4",
			children: [
				!submitted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pt-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-2",
						children: "Try Searching For"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							"Taylor Swift",
							"Drake",
							"The Weeknd",
							"Billie Eilish",
							"SZA",
							"Bad Bunny",
							"Lo-fi",
							"Jazz"
						].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setQ(s),
							className: "px-3 py-1.5 rounded-full bg-secondary text-[13px]",
							children: s
						}, s))
					})]
				}),
				submitted && isFetching && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2 pt-2",
					children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-12 w-12 rounded-md bg-muted animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-3/4 bg-muted rounded animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-1/2 bg-muted rounded animate-pulse" })]
						})]
					}, i))
				}),
				submitted && !isFetching && tracks.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center text-muted-foreground py-12 text-[14px]",
					children: "No results"
				}),
				tracks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackRow, {
					track: t,
					onPlay: () => playTrack(t, tracks),
					onMore
				}, t.id))
			]
		})
	] });
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MotionProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LibraryProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {}) }) }) }) });
//#endregion
export { SplitComponent as component };
