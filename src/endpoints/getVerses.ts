import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class GetVerses extends OpenAPIRoute {
	schema = {
		tags: ["Verses"],
		summary: "Get verses feed (multi-language)",
		request: {
			query: z.object({
				category: z.string().optional(),
				language: z.string().optional(),
				mood: z.string().optional(),
				tone: z.string().optional(),
				limit: z.string().optional(),
				offset: z.string().optional()
			})
		},
		responses: {
			"200": {
				description: "List of verses"
			}
		}
	};

	async handle(c: any) {
		const query = c.req.query();

		const category = query.category;
		const language = query.language || "en";
		const mood = query.mood;
		const tone = query.tone;

		const limit = Number(query.limit) || 20;
		const offset = Number(query.offset) || 0;

		// -------------------------
		// Dynamic Query
		// -------------------------
		let sql = `
			SELECT 
				v.id,
				v.image_url,
				v.category,
				v.theme,
				v.scene,
				v.mood,
				v.tone,
				v.tags,
				v.created_at,
				t.verse_text,
				t.reference
			FROM verses v
			JOIN verse_translations t
			ON v.id = t.verse_id
			WHERE t.language = ?
		`;

		const params: any[] = [language];

		// Optional filters
		if (category) {
			sql += " AND v.category = ?";
			params.push(category);
		}

		if (mood) {
			sql += " AND v.mood = ?";
			params.push(mood);
		}

		if (tone) {
			sql += " AND v.tone = ?";
			params.push(tone);
		}

		sql += `
			ORDER BY v.created_at DESC
			LIMIT ? OFFSET ?
		`;

		params.push(limit, offset);

		const { results } = await c.env.DB.prepare(sql).bind(...params).all();

		// -------------------------
		// Fallback logic (IMPORTANT)
		// -------------------------
		// If no results for requested language → fallback to English
		let finalResults = results;

		if (results.length === 0 && language !== "en") {
			const fallback = await c.env.DB.prepare(sql)
				.bind("en", ...params.slice(1))
				.all();

			finalResults = fallback.results;
		}

		// -------------------------
		// Normalize response
		// -------------------------
		const formatted = finalResults.map((row: any) => ({
			id: row.id,
			verse_text: row.verse_text,
			reference: row.reference,
			image_url: row.image_url,
			category: row.category,

			theme: row.theme || "",
			scene: row.scene || "",
			mood: row.mood || "",
			tone: row.tone || "",

			tags: (() => {
				try {
					return row.tags ? JSON.parse(row.tags) : [];
				} catch {
					return [];
				}
			})(),

			created_at: row.created_at
		}));

		return formatted;
	}
}