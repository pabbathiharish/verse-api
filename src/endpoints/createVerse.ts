import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { sendVersePush }
	from "../services/push";

export class CreateVerse extends OpenAPIRoute {
	schema = {
		tags: ["Verses"],
		summary: "Create a verse",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							verse_text: z.string().min(1),
							reference: z.string().min(1),
							category: z.string().min(1),
							language: z.string().min(1),
							image_url: z.string().url(),

							// Optional AI fields
							theme: z.string().optional(),
							scene: z.string().optional(),
							mood: z.string().optional(),
							tone: z.string().optional(),
							tags: z.string().optional(),
							translations: z.record(
								z.string(),   // key type (language code)
								z.object({
									verse_text: z.string(),
									reference: z.string(),
									rendered_image_url: z.string().url().optional()
								})
							)
						})
					}
				}
			}
		},
		responses: {
			"200": {
				description: "Verse created successfully"
			},
			"400": {
				description: "Invalid request"
			},
			"500": {
				description: "Server error"
			}
		}
	};

	async handle(c: any) {
		try {
			const data = await this.getValidatedData<typeof this.schema>();

			const {
				verse_text,
				reference,
				category,
				language,
				image_url,
				theme,
				scene,
				mood,
				tone,
				tags,
				translations
			} = data.body;

			if (!verse_text || !reference || !image_url) {
				return c.json(
					{ success: false, error: "Missing required fields" },
					400
				);
			}

			// 🔍 Check if already exists
			const existing = await c.env.DB.prepare(`
			SELECT id FROM verses
			WHERE verse_text = ? AND reference = ? AND language = ?
			LIMIT 1
		`).bind(verse_text, reference, language).first();

			if (existing) {
				return c.json({
					success: true,
					message: "Verse already exists",
					id: existing.id
				});
			}
			const verseId = crypto.randomUUID();
			// ✅ Insert if not exists
			await c.env.DB.prepare(`
			INSERT INTO verses 
			(id, verse_text, reference, category, language, image_url, tags, theme, scene, mood, tone, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(
				verseId,
				verse_text,
				reference,
				category,
				language,
				image_url,
				tags ?? "[]",
				theme ?? "",
				scene ?? "",
				mood ?? "",
				tone ?? "",
				new Date().toISOString()
			).run();

			// 2. Insert translations
			for (const [lang, data] of Object.entries(translations)) {
				await c.env.DB.prepare(`
    INSERT OR IGNORE INTO verse_translations
    (id, verse_id, language, verse_text, reference, rendered_image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
					crypto.randomUUID(),
					verseId,
					lang,
					data.verse_text,
					data.reference,
					data.rendered_image_url ?? null
				).run();
			}

			// AUTO PUSH — disabled.
			// The image push is now sent by the scheduled noon cron
			// (see src/services/noonPush.ts), split per timezone like the
			// morning/evening pushes, instead of firing on verse creation.
			// c.executionCtx.waitUntil(
			//
			// 	sendVersePush(
			// 		c.env,
			// 		{
			// 			image_url:
			// 				image_url,
			// 			translations:
			// 				translations
			// 		}
			// 	)
			// );

			return c.json({
				success: true,
				verseId: verseId,
				message: "Verse created successfully"
			});

		} catch (error: any) {
			console.error("CreateVerse Error:", error);

			return c.json(
				{
					success: false,
					error: "Internal server error",
					details: error?.message
				},
				500
			);
		}
	}
}