import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

import {
  getChapterReview,
  generateChapterReview,
  saveChapterReview
} from "../services/chapterReview";

export class CreateChapterReview extends OpenAPIRoute {

  schema = {
    tags: ["Chapter Review"],

    summary: "Create or Get Chapter Review",

    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              book: z.string().min(1),

              chapter: z.number().int().positive(),

              language: z.string().min(2),

              chapterText: z.string().min(20)
            })
          }
        }
      }
    },

    responses: {
      "200": {
        description: "Chapter Review"
      },

      "500": {
        description: "Internal Server Error"
      }
    }
  };

  async handle(c: any) {

    const start = Date.now();
    try {

      const data =
        await this.getValidatedData<typeof this.schema>();

      const {
        book,
        chapter,
        language,
        chapterText
      } = data.body;

      console.log(
        `Chapter Review: ${book} ${chapter} (${language})`
      );
      //-------------------------------------
      // Check Cache
      //-------------------------------------

      const existing =
        await getChapterReview(
          c.env,
          book,
          chapter,
          language
        );

      if (existing) {

        return c.json({

          success: true,

          cached: true,

          source: "cache",

          data: existing,

          generatedAt: null

        }, 200);

      }

      //-------------------------------------
      // Generate
      //-------------------------------------

      const review =
        await generateChapterReview(
          c.env,
          book,
          chapter,
          language,
          chapterText
        );

      //-------------------------------------
      // Save
      //-------------------------------------

      try {

        await saveChapterReview(
          c.env,
          book,
          chapter,
          language,
          review
        );

      } catch (err) {

        console.error(
          "Failed to save chapter review",
          err
        );

      }

      //-------------------------------------
      // Return
      //-------------------------------------

      return c.json({

        success: true,

        cached: false,

        source: "openai",

        data: review,

        generatedAt: new Date().toISOString()

      }, 201);

    }
    catch (error: any) {

      console.error(
        "CreateChapterReview Error:",
        error
      );

      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Internal Server Error"
        },
        500
      );

    }

  }

}