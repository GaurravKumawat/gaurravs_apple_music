import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
import { n as objectType, r as stringType, t as numberType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lyrics.functions-DMHl2yfi.js
function parseLRC(lrc) {
	const lines = [];
	for (const raw of lrc.split(/\r?\n/)) {
		const matches = [...raw.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
		if (!matches.length) continue;
		const text = raw.replace(/\[(\d+):(\d+(?:\.\d+)?)\]/g, "").trim();
		for (const m of matches) {
			const min = Number(m[1]);
			const sec = Number(m[2]);
			lines.push({
				time: min * 60 + sec,
				text
			});
		}
	}
	return lines.sort((a, b) => a.time - b.time);
}
var getLyrics_createServerFn_handler = createServerRpc({
	id: "36a7be5fce9b11b0b679b0679f54ff45fc3036e66ce634e3f2c42eccb02a10d3",
	name: "getLyrics",
	filename: "src/lib/lyrics.functions.ts"
}, (opts) => getLyrics.__executeServer(opts));
var getLyrics = createServerFn({ method: "POST" }).inputValidator(objectType({
	title: stringType().min(1).max(300),
	artist: stringType().min(1).max(300),
	duration: numberType().optional()
})).handler(getLyrics_createServerFn_handler, async ({ data }) => {
	const cleanTitle = data.title.replace(/\s*\(.*?\)\s*/g, "").replace(/\s*\[.*?\]\s*/g, "").trim();
	const cleanArtist = data.artist.replace(/\s*-\s*Topic\s*$/i, "").trim();
	const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
	try {
		const res = await fetch(url, { headers: { "User-Agent": "WebMusicPlayer (https://lovable.dev)" } });
		if (res.ok) {
			const json = await res.json();
			const synced = json.syncedLyrics ? parseLRC(json.syncedLyrics) : null;
			return {
				synced: synced && synced.length ? synced : null,
				plain: json.plainLyrics ?? null,
				source: "lrclib"
			};
		}
		const sUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
		const sRes = await fetch(sUrl);
		if (sRes.ok) {
			const hit = (await sRes.json())?.[0];
			if (hit) {
				const synced = hit.syncedLyrics ? parseLRC(hit.syncedLyrics) : null;
				return {
					synced: synced && synced.length ? synced : null,
					plain: hit.plainLyrics ?? null,
					source: "lrclib"
				};
			}
		}
	} catch {}
	return {
		synced: null,
		plain: null,
		source: "none"
	};
});
//#endregion
export { getLyrics_createServerFn_handler };
