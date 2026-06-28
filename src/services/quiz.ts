import type { Env } from "../types";

export async function saveQuiz(
  env: Env,
  language: string,
  quiz: any
) {
  return env.QUIZ_DB.prepare(`
      INSERT OR IGNORE INTO daily_quizzes (
          language,
          difficulty,
          verse_uniq_id,
          quiz_json
      )
      VALUES (?, ?, ?, ?)
  `)
    .bind(
      language,
      quiz.difficulty,
      quiz.verseUniqId,
      JSON.stringify(quiz)
    )
    .run();
}

export async function getQuizzes(
  env: Env,
  language: string,
  limit: number,
  difficulty?: string
) {
  let sql = `
      SELECT quiz_json
      FROM daily_quizzes
      WHERE language = ?
  `;

  const params: any[] = [language];

  if (difficulty) {
    sql += ` AND difficulty = ?`;
    params.push(difficulty);
  }

  sql += `
      ORDER BY created_at DESC
      LIMIT ?
  `;

  params.push(limit);

  const result = await env.QUIZ_DB.prepare(sql)
    .bind(...params)
    .all();

  return result.results.map(
    (row: any) => JSON.parse(row.quiz_json)
  );
}