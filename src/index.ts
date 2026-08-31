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

    // ============================================================
    // GLOBAL IST PUSH (all topics, no timezone split)
    //   Morning  7:30 AM IST = 02:00 UTC  -> "0 2 * * *"
    //   Evening  6:30 PM IST = 13:00 UTC  -> "0 13 * * *"
    // Calling sendMorningPush/sendEveningPush WITHOUT a cron sends to
    // every topic at once.
    //
    // To switch BACK to per-timezone morning/evening: comment out the
    // two branches below, uncomment the split branches, and restore the
    // morning/evening crons in wrangler.jsonc (buckets are defined in
    // src/utils/morningCronSchedule.ts and src/utils/eveningCronSchedule.ts).
    // ============================================================

    if (controller.cron === "0 2 * * *") {

      await sendMorningPush(env);        // ALL topics (global)

    } else if (controller.cron === "0 13 * * *") {

      await sendEveningPush(env);        // ALL topics (global)

    }

    // --- Per-timezone morning/evening (disabled). Uncomment to re-enable ---
    // else if (morningCronSchedule[controller.cron]) {
    //   await sendMorningPush(env, controller.cron);
    // }
    // else if (eveningCronSchedule[controller.cron]) {
    //   await sendEveningPush(env, controller.cron);
    // }
    // ----------------------------------------------------------------------

    // Noon image push stays split by timezone (local ~12:00).
    else if (noonCronSchedule[controller.cron]) {

      await sendNoonPush(env, controller.cron);

    }

    else {

      console.log(
        `Unknown cron: ${controller.cron}`
      );
    }

    console.log(
      "===== SCHEDULED JOB COMPLETED ====="
    );
  }

};



