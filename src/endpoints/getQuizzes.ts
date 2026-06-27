import { OpenAPIRoute } from "chanfana";
import { getQuizzes } from "../services/quiz";

export class GetQuizzes extends OpenAPIRoute {
  async handle(c: any) {
    const language =
      c.req.query("language");

    const difficulty =
      c.req.query("difficulty");

    const limit = Number(
      c.req.query("limit") || "10"
    );

    const quizzes = await getQuizzes(
      c.env,
      language,
      limit,
      difficulty
    );

    return c.json(quizzes);
  }
}