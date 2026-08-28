import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

import { sendMorningPush } from "../services/morningPush";
import { sendNoonPush } from "../services/noonPush";
import { sendEveningPush } from "../services/eveningPush";

//
// Fallback trigger for the scheduled pushes.
// ------------------------------------------
// If the Cloudflare cron for a morning / noon / evening push does not fire
// (or fails), this endpoint re-runs it on demand. It sends to ALL topics at
// once, independent of the timezone cron schedule — like the original single
// morning / evening run before the split.
//
// It reuses the exact same service functions the scheduled handler calls;
// invoking them WITHOUT a cron argument disables the per-timezone filter and
// sends to every topic directly.
//
// POST /api/push/trigger
//   Authorization: Bearer <INTERNAL_API_KEY>
//   Body: { "type": "morning" | "noon" | "evening" | "all" }
//

type PushType = "morning" | "noon" | "evening";

const senders: Record<
	PushType,
	(env: any) => Promise<void>
> = {
	morning: (env) => sendMorningPush(env),
	noon: (env) => sendNoonPush(env),
	evening: (env) => sendEveningPush(env)
};

export class TriggerPush extends OpenAPIRoute {

	schema = {
		tags: ["Push"],
		summary: "Manually trigger a push to ALL topics (cron fallback)",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							type: z.enum([
								"morning",
								"noon",
								"evening",
								"all"
							])
						})
					}
				}
			}
		},
		responses: {
			"200": { description: "Push run(s) started" },
			"401": { description: "Unauthorized" }
		}
	};

	async handle(c: any) {

		// ------------------------------------------
		// Auth (same scheme as /api/verses/send-push)
		// ------------------------------------------
		const auth = c.req.header("Authorization");

		if (auth !== `Bearer ${c.env.INTERNAL_API_KEY}`) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const data =
			await this.getValidatedData<typeof this.schema>();

		const { type } = data.body;

		const types: PushType[] =
			type === "all"
				? ["morning", "noon", "evening"]
				: [type];

		// Fire each requested push to ALL topics, in the background.
		for (const t of types) {
			c.executionCtx.waitUntil(senders[t](c.env));
		}

		return c.json({
			success: true,
			message: "Push run(s) started (all topics)",
			triggered: types
		});
	}
}
