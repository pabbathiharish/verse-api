import { OpenAPIRoute } from "chanfana";
import { saveQuiz } from "../services/quiz";

export class CreateQuiz extends OpenAPIRoute {
  async handle(c: any) {
    const body = await c.req.json();

    await saveQuiz(
      c.env,
      body.language,
      body.quiz
    );

    return c.json({
      success: true
    });
  }
}