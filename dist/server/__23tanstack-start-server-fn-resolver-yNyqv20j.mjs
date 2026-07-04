//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-yNyqv20j.js
var manifest = {
	"36a7be5fce9b11b0b679b0679f54ff45fc3036e66ce634e3f2c42eccb02a10d3": {
		functionName: "getLyrics_createServerFn_handler",
		importer: () => import("./_ssr/lyrics.functions-DMHl2yfi.mjs")
	},
	"56ec3e356adce4b5e87fc9492ad7cc97b52d82dd7076c21febb0178f4f1da8fe": {
		functionName: "getStreamUrl_createServerFn_handler",
		importer: () => import("./_ssr/music.functions-m7T64GY6.mjs")
	},
	"7d4ed48efd6c466ffe6a6e1858b4e339f65a540c916b35154d2fd29c3fe65cbc": {
		functionName: "getTrending_createServerFn_handler",
		importer: () => import("./_ssr/music.functions-m7T64GY6.mjs")
	},
	"b18c935d511bf2d5175d91a5fb21457b513bfe85576e00f6d1c189d046b32e5f": {
		functionName: "searchMusic_createServerFn_handler",
		importer: () => import("./_ssr/music.functions-m7T64GY6.mjs")
	},
	"c415311005042a443a3ad669ccb2343a3d56f9ed3d8fed3f7af0a607ad46773a": {
		functionName: "recognizeAudio_createServerFn_handler",
		importer: () => import("./_ssr/recognize.functions-BktkztkS.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
