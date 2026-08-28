import { fromHono } from "chanfana";
import { Hono } from "hono";

import { CreateVerse } from "./endpoints/createVerse";
import { GetVerses } from "./endpoints/getVerses";
import { SendVersePush } from "./endpoints/sendVersePush";

import { CreateQuiz } from "./endpoints/createQuiz";
import { GetQuizzes } from "./endpoints/getQuizzes";

import { CreateChapterReview } from "./endpoints/createChapterReview";

import { TriggerPush } from "./endpoints/triggerPush";

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

import {
	morningCronSchedule
} from "./utils/morningCronSchedule";

import {
	eveningCronSchedule
} from "./utils/eveningCronSchedule";

import {
	sendNoonPush
} from "./services/noonPush";

import {
	noonCronSchedule
} from "./utils/noonCronSchedule";

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
// Push fallback (manual cron re-run)
//
openapi.post(
  "/api/push/trigger",
  TriggerPush
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

    // Both pushes are split across many crons — one per timezone bucket.
    // The two schedules are checked independently because a single UTC time
    // can be morning for one region and evening for another (e.g. 23:00 UTC
    // is Korea's morning and Brazil's evening).
    const isMorningCron =
      Boolean(morningCronSchedule[controller.cron]);

    const isNoonCron =
      Boolean(noonCronSchedule[controller.cron]);

    const isEveningCron =
      Boolean(eveningCronSchedule[controller.cron]);

    if (isMorningCron) {

      await sendMorningPush(env, controller.cron);

    }

    if (isNoonCron) {

      await sendNoonPush(env, controller.cron);

    }

    if (isEveningCron) {

      await sendEveningPush(env, controller.cron);

    }

    if (!isMorningCron && !isNoonCron && !isEveningCron) {

      console.log(
        `Unknown cron: ${controller.cron}`
      );
    }

    console.log(
      "===== SCHEDULED JOB COMPLETED ====="
    );
  }

};



