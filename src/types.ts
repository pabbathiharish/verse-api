import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const Task = z.object({
	name: z.string().openapi({ example: "lorem" }),
	slug: z.string(),
	description: z.string().optional(),
	completed: z.boolean().default(false),
	due_date: z.iso.date(),
});


export interface Env {

	DB: D1Database;

	FIREBASE_PROJECT_ID: string;

	FIREBASE_CLIENT_EMAIL: string;

	FIREBASE_PRIVATE_KEY: string;

	INTERNAL_API_KEY: string;
}