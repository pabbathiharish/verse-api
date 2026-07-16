import type { Env } from "../types";
import { buildChapterReviewPrompt } from "../utils/chapterPrompt";
import { z } from "zod";


const ChapterReviewSchema = z.object({
    title: z.string().min(1),
    theme: z.string().min(1),
    summary: z.string().min(1),
    estimated_read_time: z.string().min(1)
});

export interface ChapterReview {
    title: string;
    theme: string;
    summary: string;
    estimated_read_time: string;
}

/**
 * Returns cached review if available.
 */
export async function getChapterReview(
    env: Env,
    book: string,
    chapter: number,
    language: string
): Promise<ChapterReview | null> {

    const review = await env.AI_BOOK_CHAPTER_REVIEWS_DB.prepare(`
      SELECT
          title,
          theme,
          summary,
          estimated_read_time
      FROM chapter_reviews
      WHERE
          book = ?
          AND chapter = ?
          AND language = ?
      LIMIT 1
  `)
        .bind(
            book,
            chapter,
            language
        )
        .first<ChapterReview>();

    return review ?? null;
}



/**
 * Saves review.
 * If the review already exists it updates it.
 */
export async function saveChapterReview(
    env: Env,
    book: string,
    chapter: number,
    language: string,
    review: ChapterReview
) {

    return env.AI_BOOK_CHAPTER_REVIEWS_DB.prepare(`
      INSERT INTO chapter_reviews (
          book,
          chapter,
          language,
          title,
          theme,
          summary,
          estimated_read_time
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(book, chapter, language)
      DO UPDATE SET
          title = excluded.title,
          theme = excluded.theme,
          summary = excluded.summary,
          estimated_read_time = excluded.estimated_read_time
  `)
        .bind(
            book,
            chapter,
            language,
            review.title,
            review.theme,
            review.summary,
            review.estimated_read_time
        )
        .run();

}

/**
 * Generates a chapter review using OpenAI
 */
export async function generateChapterReview(
    env: Env,
    book: string,
    chapter: number,
    language: string,
    chapterText: string
): Promise<ChapterReview> {

    const prompt = buildChapterReviewPrompt(
        book,
        chapter,
        language,
        chapterText
    );

    let response: Response | null = null;

    // Retry up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {

        response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gpt-5.5-mini",

                    temperature: 0.2,

                    response_format: {
                        type: "json_object"
                    },

                    messages: [
                        {
                            role: "system",
                            content:
                                "You are an expert Biblical scholar. Return ONLY valid JSON matching the requested schema."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        );

        // Success
        if (response.ok) {
            break;
        }

        // Retry only these errors
        if (![429, 500, 502, 503, 504].includes(response.status)) {
            break;
        }

        if (attempt < 3) {
            await delay(Math.pow(2, attempt) * 500);
        }
    }

    if (!response || !response.ok) {

        const error =
            response
                ? await response.text()
                : "Unknown error";

        throw new Error(
            `OpenAI Error: ${error}`
        );
    }

    const json: any = await response.json();

    const content = json.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error("OpenAI returned empty content.");
    }

    let review: ChapterReview;

    try {

        review = ChapterReviewSchema.parse(
            JSON.parse(content)
        );

    } catch (error) {

        console.error(error);

        throw new Error(
            "Invalid JSON returned by OpenAI."
        );

    }

    return review;

}


async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}