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
	QUIZ_DB: D1Database; // New database
	AI_BOOK_CHAPTER_REVIEWS_DB: D1Database // new Database for chapter and book short summery


	// Santa Bible
	SANTA_FIREBASE_PROJECT_ID: string;
	SANTA_FIREBASE_CLIENT_EMAIL: string;
	SANTA_FIREBASE_PRIVATE_KEY: string;

	// Portuguese Bible
	PORTUGUESE_FIREBASE_PROJECT_ID: string;
	PORTUGUESE_FIREBASE_CLIENT_EMAIL: string;
	PORTUGUESE_FIREBASE_PRIVATE_KEY: string;

	INTERNAL_API_KEY: string;
	OPENAI_API_KEY: string;
}
