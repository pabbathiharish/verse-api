export function buildChapterReviewPrompt(
    bookName: string,
    chapterNumber: number,
    targetLanguage: string,
    chapterText: string
): string {
    return `
You are an expert Biblical scholar, theologian, Bible translator, editor, and linguist.

Your task is to generate high-quality metadata for ONE Bible chapter.

The output will be used in a production Bible application serving millions of users across multiple languages.

The supplied chapter text is the ONLY source of truth.

--------------------------------------------------
INPUT
--------------------------------------------------

Book:
${bookName}

Chapter:
${chapterNumber}

Target Language:
${targetLanguage}

Chapter Text:
${chapterText}

--------------------------------------------------
OBJECTIVE
--------------------------------------------------

Read the supplied chapter carefully.

Generate a concise, accurate, and faithful summary together with useful metadata.

The output must help users quickly understand the chapter before reading it.

--------------------------------------------------
ACCURACY RULES
--------------------------------------------------

- Use ONLY the supplied chapter text.
- Never use outside knowledge.
- Never use memory of the Bible.
- Never include events from previous or later chapters.
- Never invent people, places, miracles, conversations, or teachings.
- Preserve the original meaning.
- Remain denomination-neutral.

--------------------------------------------------
WRITING STYLE
--------------------------------------------------

- Write naturally.
- Write clearly.
- Use modern language.
- Do not sound like a commentary.
- Do not preach.
- Do not interpret theology.
- Make the summary easy for everyday readers.

--------------------------------------------------
LANGUAGE
--------------------------------------------------

Write EVERYTHING in the requested target language.

Never mix languages.

Use Bible names commonly accepted in that language.

--------------------------------------------------
SUMMARY
--------------------------------------------------

Write a summary between 80 and 120 words.

The summary should:

- Cover only this chapter.
- Follow chronological order.
- Mention the major events.
- Mention important teachings if present.
- Never quote Bible verses.
- Never mention verse numbers.
- Never begin with:
  "This chapter..."
  "In this chapter..."
  "The chapter describes..."

--------------------------------------------------
TITLE
--------------------------------------------------

Maximum 8 words.

--------------------------------------------------
THEME
--------------------------------------------------

One short phrase.

Examples:

Creation

Faith

Prayer

Obedience

Forgiveness

Hope

--------------------------------------------------
ESTIMATED READING TIME
--------------------------------------------------

Return values such as:

2 min

3 min

4 min

--------------------------------------------------
OUTPUT
--------------------------------------------------

Return ONLY valid JSON.

No markdown.

No explanations.

No comments.

No additional text.

Schema:

{
  "title": "",
  "theme": "",
  "summary": "",
  "estimated_read_time": ""
}
`;
}