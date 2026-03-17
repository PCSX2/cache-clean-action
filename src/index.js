import * as core from "@actions/core"
import * as github from "@actions/github"

const failAction = core.getInput("on_failure") || "warn";
try {
	/** @type {{key: string, count: number}[]} */
	const config = JSON.parse(core.getInput("items", {required: true}));
	const token = core.getInput("token", {required: true})
	const refMode = core.getInput("branch") || "current";
	const ref = refMode === "all" ? "" : github.context.ref;
	const octokit = github.getOctokit(token);
	/** @returns {Promise<{id: number, key: string, ref: string, last_accessed_at: string}[]>} */
	async function getAllCaches() {
		let result = [];
		let caches;
		let page = 1;
		do {
			caches = await octokit.rest.actions.getActionsCacheList({
				...github.context.repo,
				ref: ref,
				page: page,
				per_page: 100,
				sort: "last_accessed_at",
				direction: "desc",
			});
			result = result.concat(caches.data.actions_caches);
			page += 1;
		} while (caches.data.actions_caches.length < caches.data.total_count);
		return result;
	}

	/**
	 * @param {string} str
	 * @returns {{key: string, value: string, count: number}?}
	 */
	function findMatch(str) {
		for (const search of config) {
			const res = str.indexOf(search.key);
			if (res >= 0) {
				return {
					key: str.substring(0, res + search.key.length),
					value: str.substring(res + search.key.length),
					count: search.count,
				};
			}
		}
		return null;
	}

	/** @type {Map<string, number>} */
	const counts = new Map();
	for (const cache of await getAllCaches()) {
		const match = findMatch(cache.key);
		if (match === null)
			continue;
		const key = cache.ref + " | " + match.key;
		const count = counts.get(key) || 0;
		counts.set(key, count + 1);
		const shouldDelete = count >= match.count;
		console.log(`${shouldDelete ? "DEL " : "KEEP"} ${cache.id} @ ${cache.last_accessed_at} on ${cache.ref}: ${match.key}[${count}]${match.value}`);
		if (shouldDelete) {
			await octokit.rest.actions.deleteActionsCacheById({...github.context.repo, cache_id: cache.id});
		}
	}
} catch (error) {
	if (failAction === "error")
		core.setFailed(error.message);
	else
		core.warning("Failed to clean caches: " + error.message);
}
