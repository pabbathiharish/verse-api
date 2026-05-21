import type { Env }
	from "../types";

export async function getVerseById(
	env: Env,
	verseId: string
) {

	console.log("===== FETCHING VERSE FROM DB =====");
	console.log(`VERSE ID: ${verseId}`);
	const verse =
		await env.DB.prepare(`
		SELECT *
		FROM verses
		WHERE id = ?
		LIMIT 1
	`)
			.bind(verseId)
			.first();

	const translations =
		await env.DB.prepare(`
		SELECT *
		FROM verse_translations
		WHERE verse_id = ?
	`)
			.bind(verseId)
			.all();

	const mapped: Record<
		string,
		any
	> = {};

	for (
	const item of
	translations.results as any[]
) {

	mapped[item.language as string] = {

		verse_text:
			item.verse_text,

		short_text:
			item.short_text,

		reference:
			item.reference
	};
}
	console.log(`===== FETCHING VERSE SUCCESS: ===== \n ${mapped}`);
	return {
		...verse,
		translations: mapped
	};
}