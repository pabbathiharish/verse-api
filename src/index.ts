import { fromHono } from "chanfana";
import { Hono } from "hono";

import { CreateVerse } from "./endpoints/createVerse";
import { GetVerses } from "./endpoints/getVerses";
import { SendVersePush } from "./endpoints/sendVersePush";

import { CreateQuiz } from "./endpoints/createQuiz";
import { GetQuizzes } from "./endpoints/getQuizzes";

import { CreateChapterReview } from "./endpoints/createChapterReview";

import type { Env } from "./types";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
});

//
// Verse APIs
//
openapi.post("/api/verses", CreateVerse);

openapi.post(
  "/api/verses/send-push",
  SendVersePush
);

openapi.get(
  "/api/verses/feed",
  GetVerses
);

//
// Quiz APIs
//
openapi.post(
  "/api/quizzes",
  CreateQuiz
);

openapi.get(
  "/api/quizzes",
  GetQuizzes
);

//
// Chapter Review APIs
//
openapi.post(
  "/api/chapter-review",
  CreateChapterReview
);

// Export the Hono app
export default app;