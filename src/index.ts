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

import {
	sendMorningPush
} from "./services/morningPush";

import {
	sendEveningPush
} from "./services/eveningPush";

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

// Export Worker

export default {

  fetch: app.fetch,

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ) {

    console.log(
      `===== SCHEDULED JOB: ${controller.cron} =====`
    );

    switch (controller.cron) {

      case "30 2 * * *":

        await sendMorningPush(env);

        break;
      case "30 13 * * *":
        await sendEveningPush(env);

        break;

      default:

        console.log(
          `Unknown cron: ${controller.cron}`
        );
    }

    console.log(
      "===== SCHEDULED JOB COMPLETED ====="
    );
  }

};



