import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
import { n as objectType, r as stringType } from "../_libs/zod.mjs";
import processModule from "node:process";
import { Buffer } from "node:buffer";
import crypto from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/recognize.functions-BktkztkS.js
var recognizeAudio_createServerFn_handler = createServerRpc({
	id: "c415311005042a443a3ad669ccb2343a3d56f9ed3d8fed3f7af0a607ad46773a",
	name: "recognizeAudio",
	filename: "src/lib/recognize.functions.ts"
}, (opts) => recognizeAudio.__executeServer(opts));
var recognizeAudio = createServerFn({ method: "POST" }).inputValidator(objectType({
	audioBase64: stringType().min(100).max(1e7),
	mime: stringType().min(3).max(64)
})).handler(recognizeAudio_createServerFn_handler, async ({ data }) => {
	const host = processModule.env.ACRCLOUD_HOST;
	const accessKey = processModule.env.ACRCLOUD_ACCESS_KEY;
	const accessSecret = processModule.env.ACRCLOUD_ACCESS_SECRET;
	if (!host || !accessKey || !accessSecret) throw new Error("ACRCloud is not configured");
	const httpMethod = "POST";
	const httpUri = "/v1/identify";
	const dataType = "audio";
	const signatureVersion = "1";
	const timestamp = Math.floor(Date.now() / 1e3).toString();
	const stringToSign = [
		httpMethod,
		httpUri,
		accessKey,
		dataType,
		signatureVersion,
		timestamp
	].join("\n");
	const signature = crypto.createHmac("sha1", accessSecret).update(Buffer.from(stringToSign, "utf-8")).digest("base64");
	const audioBuf = Buffer.from(data.audioBase64, "base64");
	const form = new FormData();
	form.append("sample", new Blob([new Uint8Array(audioBuf)], { type: data.mime }), "sample.webm");
	form.append("sample_bytes", String(audioBuf.length));
	form.append("access_key", accessKey);
	form.append("data_type", dataType);
	form.append("signature_version", signatureVersion);
	form.append("signature", signature);
	form.append("timestamp", timestamp);
	const json = await (await fetch(`https://${host}${httpUri}`, {
		method: "POST",
		body: form
	})).json();
	if (json?.status?.code !== 0) return {
		ok: false,
		message: json?.status?.msg ?? "No match",
		code: json?.status?.code ?? -1
	};
	const music = json?.metadata?.music?.[0];
	if (!music) return {
		ok: false,
		message: "No match",
		code: 1001
	};
	return {
		ok: true,
		song: {
			title: music.title ?? "Unknown",
			artist: (music.artists ?? []).map((a) => a.name).join(", ") || "Unknown",
			album: music.album?.name,
			releaseDate: music.release_date
		}
	};
});
//#endregion
export { recognizeAudio_createServerFn_handler };
