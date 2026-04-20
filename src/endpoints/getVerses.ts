import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class GetVerses extends OpenAPIRoute {
	schema = {
		tags: ["Verses"],
		summary: "Get verses feed",
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

		const category = query.category || "peace";
		const language = query.language || "en";
		const mood = query.mood;
		const tone = query.tone;

		const limit = Number(query.limit) || 20;
		const offset = Number(query.offset) || 0;

		// -------------------------
		// Dynamic Query Builder
		// -------------------------
		let sql = `
			SELECT * FROM verses
			WHERE category = ? AND language = ?
		`;

		const params: any[] = [category, language];

		if (mood) {
			sql += " AND mood = ?";
			params.push(mood);
		}

		if (tone) {
			sql += " AND tone = ?";
			params.push(tone);
		}

		sql += `
			ORDER BY created_at DESC
			LIMIT ? OFFSET ?
		`;

		params.push(limit, offset);

		const { results } = await c.env.DB.prepare(sql).bind(...params).all();

		// -------------------------
		// Normalize response
		// -------------------------
		const formatted = results.map((row: any) => ({
			id: row.id,
			verse_text: row.verse_text,
			reference: row.reference,
			category: row.category,
			language: row.language,
			image_url: row.image_url,

			// Safe defaults
			theme: row.theme || "",
			scene: row.scene || "",
			mood: row.mood || "",
			tone: row.tone || "",

			// Parse tags safely
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