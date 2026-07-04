import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
import { n as objectType, r as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/music.functions-m7T64GY6.js
var PIPED_INSTANCES = [
	"https://pipedapi.kavin.rocks",
	"https://pipedapi.adminforge.de",
	"https://api.piped.private.coffee",
	"https://pipedapi.reallyaweso.me"
];
async function tryInstances(fn) {
	let lastErr;
	for (const base of PIPED_INSTANCES) try {
		return await fn(base);
	} catch (e) {
		lastErr = e;
	}
	throw lastErr ?? /* @__PURE__ */ new Error("All instances failed");
}
function normalizeThumb(url) {
	if (!url) return url;
	const ytMatch = url.match(/\/vi\/([^/]+)\/[^/]+\.(?:jpg|webp|png)(?:\?.*)?$/i);
	if (ytMatch) return `https://i.ytimg.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
	const ytAny = url.match(/(?:i\.ytimg\.com|youtube\.com)\/.+?\/vi(?:_webp)?\/([^/]+)/);
	if (ytAny) return `https://i.ytimg.com/vi/${ytAny[1]}/maxresdefault.jpg`;
	const appleMatch = url.match(/^(.*\/)(\d+)x(\d+)(bb)?(\.[a-zA-Z0-9]+)(\?.*)?$/);
	if (appleMatch) return `${appleMatch[1]}800x800bb${appleMatch[5]}${appleMatch[6] ?? ""}`;
	return url;
}
/**
* Resolve an artwork URL to the highest-quality variant we can serve.
* YouTube "maxresdefault" sometimes 404s (returns a 120x90 grey placeholder),
* so we expose a two-step variant: caller asks for maxres, and on `onError`
* swaps in sddefault. Apple Music URLs are upgraded to 800x800bb in place.
*/
function upgradeArtwork(url) {
	return normalizeThumb(url);
}
var searchMusic_createServerFn_handler = createServerRpc({
	id: "b18c935d511bf2d5175d91a5fb21457b513bfe85576e00f6d1c189d046b32e5f",
	name: "searchMusic",
	filename: "src/lib/music.functions.ts"
}, (opts) => searchMusic.__executeServer(opts));
var searchMusic = createServerFn({ method: "POST" }).inputValidator(objectType({ query: stringType().min(1).max(200) })).handler(searchMusic_createServerFn_handler, async ({ data }) => {
	return { tracks: ((await tryInstances(async (base) => {
		const url = `${base}/search?q=${encodeURIComponent(data.query)}&filter=music_songs`;
		const res = await fetch(url, { headers: { accept: "application/json" } });
		if (!res.ok) throw new Error(`status ${res.status}`);
		return await res.json();
	})).items || []).filter((it) => it.url && (it.type === "stream" || it.url.includes("watch?v="))).map((it) => {
		return {
			id: it.url.split("watch?v=")[1]?.split("&")[0] ?? "",
			title: it.title ?? "Unknown",
			artist: it.uploaderName ?? it.uploader ?? "Unknown Artist",
			duration: Number(it.duration ?? 0),
			thumbnail: upgradeArtwork(it.thumbnail ?? ""),
			views: Number(it.views ?? 0) || void 0
		};
	}).filter((t) => t.id) };
});
/**
* Resolve a YouTube video id to a direct audio stream URL using Piped's
* /streams/{id} endpoint. We try each Piped instance in order and return
* the highest-bitrate audio stream URL we can find.
*
* The endpoint is hit on the server (createServerFn) so the browser never
* has to deal with CORS for the *metadata* fetch — though the resulting
* stream URL is consumed in the browser for both live playback and caching.
*/
var getStreamUrl_createServerFn_handler = createServerRpc({
	id: "56ec3e356adce4b5e87fc9492ad7cc97b52d82dd7076c21febb0178f4f1da8fe",
	name: "getStreamUrl",
	filename: "src/lib/music.functions.ts"
}, (opts) => getStreamUrl.__executeServer(opts));
var getStreamUrl = createServerFn({ method: "POST" }).inputValidator(objectType({ videoId: stringType().min(1).max(32) })).handler(getStreamUrl_createServerFn_handler, async ({ data }) => {
	const streams = ((await tryInstances(async (base) => {
		const url = `${base}/streams/${encodeURIComponent(data.videoId)}`;
		const res = await fetch(url, { headers: { accept: "application/json" } });
		if (!res.ok) throw new Error(`status ${res.status}`);
		return await res.json();
	})).audioStreams ?? []).filter((s) => s && s.url).sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
	if (streams.length === 0) throw new Error("No audio streams returned from Piped");
	return {
		streamUrl: streams[0].url,
		mimeType: streams[0].mimeType ?? "audio/mpeg",
		contentLength: streams[0].contentLength ?? null,
		bitrate: streams[0].bitrate ?? null
	};
});
var getTrending_createServerFn_handler = createServerRpc({
	id: "7d4ed48efd6c466ffe6a6e1858b4e339f65a540c916b35154d2fd29c3fe65cbc",
	name: "getTrending",
	filename: "src/lib/music.functions.ts"
}, (opts) => getTrending.__executeServer(opts));
var getTrending = createServerFn({ method: "GET" }).handler(getTrending_createServerFn_handler, async () => {
	const queries = [
		"top hits 2026",
		"billboard hot 100",
		"trending music",
		"new releases"
	];
	const q = queries[Math.floor(Math.random() * queries.length)];
	return { tracks: ((await tryInstances(async (base) => {
		const url = `${base}/search?q=${encodeURIComponent(q)}&filter=music_songs`;
		const res = await fetch(url);
		if (!res.ok) throw new Error(`status ${res.status}`);
		return await res.json();
	})).items || []).slice(0, 20).map((it) => {
		return {
			id: it.url?.split("watch?v=")[1]?.split("&")[0] ?? "",
			title: it.title ?? "",
			artist: it.uploaderName ?? "",
			duration: Number(it.duration ?? 0),
			thumbnail: upgradeArtwork(it.thumbnail ?? ""),
			views: Number(it.views ?? 0) || void 0
		};
	}).filter((t) => t.id) };
});
//#endregion
export { getStreamUrl_createServerFn_handler, getTrending_createServerFn_handler, searchMusic_createServerFn_handler };
