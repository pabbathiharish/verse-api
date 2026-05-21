import { OpenAPIRoute }
	from "chanfana";

import { z }
	from "zod";

import { getVerseById }
	from "../services/verse";

import { sendVersePush }
	from "../services/push";

export class SendVersePush
	extends OpenAPIRoute {

	schema = {

		request: {

			body: {

				content: {

					"application/json": {

						schema:
							z.object({

								verseId:
									z.string()
							})
					}
				}
			}
		}
	};

	async handle(c: any) {

		const auth =
			c.req.header(
				"Authorization"
			);

		if (
			auth !==
			`Bearer ${c.env.INTERNAL_API_KEY}`
		) {

			return c.json(
				{
					error:
						"Unauthorized"
				},
				401
			);
		}

		const data =
			await this.getValidatedData<
				typeof this.schema
			>();

		const verse =
			await getVerseById(
				c.env,
				data.body.verseId
			);

		if (!verse) {

			return c.json(
				{
					error:
						"Verse not found"
				},
				404
			);
		}

		c.executionCtx.waitUntil(

			sendVersePush(
				c.env,
				verse
			)
		);

		return c.json({

			success: true,

			message:
				"Push started"
		});
	}
}