# Verse API

A Cloudflare Worker (Hono + [chanfana](https://github.com/cloudflare/chanfana) OpenAPI) that stores daily Bible verses, quizzes and AI chapter reviews, and sends **Firebase Cloud Messaging (FCM) topic push notifications** across multiple apps and languages.

Push notifications are sent on a schedule at three times of day — **morning (~08:00)**, **noon (~12:00)** and **evening (~20:00)** — split by timezone so each language/region receives them at their own local time. A REST fallback endpoint can re-send any of them on demand.

- **Interactive API docs (Swagger UI):** open the Worker root `/`
- **OpenAPI schema:** auto-generated from the code at `/openapi.json`

---

## Contents

- [Base URL & auth](#base-url--auth)
- [Data model](#data-model)
- [Endpoints](#endpoints)
  - [Verses](#verses)
    - [Create a verse](#create-a-verse)
    - [Get the verse feed](#get-the-verse-feed)
    - [Send image push for a verse](#send-image-push-for-a-verse)
  - [Push (scheduled + fallback)](#push-scheduled--fallback)
    - [Manual push trigger (cron fallback)](#manual-push-trigger-cron-fallback)
  - [Quizzes](#quizzes)
  - [Chapter reviews](#chapter-reviews)
- [Scheduled pushes & timezones](#scheduled-pushes--timezones)
- [Local development](#local-development)
- [Deployment](#deployment)

---

## Base URL & auth

Replace `<BASE_URL>` with your deployed Worker URL (e.g. `https://verse-api.<subdomain>.workers.dev`).

Two endpoints are protected by a bearer token — the `INTERNAL_API_KEY` secret:

```
Authorization: Bearer <INTERNAL_API_KEY>
```

| Endpoint | Auth required |
| --- | --- |
| `POST /api/verses/send-push` | ✅ Yes |
| `POST /api/push/trigger` | ✅ Yes |
| everything else | ❌ No |

> Secrets (`INTERNAL_API_KEY`, `OPENAI_API_KEY`, the Firebase private keys) are stored with `wrangler secret put ...`, not in `wrangler.jsonc`.

---

## Data model

A **verse** has a base row plus one **translation** per language. The feed and pushes read translations by language code.

- `verses`: `id`, `verse_text`, `reference`, `category`, `language`, `image_url`, `tags`, `theme`, `scene`, `mood`, `tone`, `created_at`
- `verse_translations`: `id`, `verse_id`, `language`, `verse_text`, `reference`, `rendered_image_url`

---

## Endpoints

### Verses

#### Create a verse

`POST /api/verses`

Creates a verse and its translations. If a verse with the same `verse_text` + `reference` + `language` already exists, it returns the existing id instead of creating a duplicate.

> **Note:** creating a verse **no longer** sends a push automatically. The image push now goes out via the scheduled **noon** cron (or the [manual trigger](#manual-push-trigger-cron-fallback)).

**Body**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `verse_text` | string | ✅ | Base-language verse text |
| `reference` | string | ✅ | e.g. `"John 3:16"` |
| `category` | string | ✅ | e.g. `"faith"` |
| `language` | string | ✅ | Base language code |
| `image_url` | string (url) | ✅ | Base image |
| `theme`, `scene`, `mood`, `tone`, `tags` | string | ❌ | Optional AI metadata |
| `translations` | object | ✅ | Map of `languageCode -> { verse_text, reference, rendered_image_url? }` |

**Example**

```bash
curl -X POST "<BASE_URL>/api/verses" \
  -H "Content-Type: application/json" \
  -d '{
    "verse_text": "For God so loved the world...",
    "reference": "John 3:16",
    "category": "love",
    "language": "en",
    "image_url": "https://cdn.example.com/john316.jpg",
    "theme": "salvation",
    "mood": "hopeful",
    "tags": "[\"love\",\"salvation\"]",
    "translations": {
      "en":  { "verse_text": "For God so loved the world...", "reference": "John 3:16", "rendered_image_url": "https://cdn.example.com/john316_en.jpg" },
      "es":  { "verse_text": "Porque de tal manera amó Dios al mundo...", "reference": "Juan 3:16", "rendered_image_url": "https://cdn.example.com/john316_es.jpg" },
      "hi":  { "verse_text": "क्योंकि परमेश्वर ने जगत से ऐसा प्रेम रखा...", "reference": "यूहन्ना 3:16" }
    }
  }'
```

**Response**

```json
{ "success": true, "verseId": "b1e...", "message": "Verse created successfully" }
```

---

#### Get the verse feed

`GET /api/verses/feed`

Returns verses joined with the translation for the requested `language`. If none exist for that language, it falls back to English (`en`).

**Query params**

| Param | Default | Notes |
| --- | --- | --- |
| `language` | `en` | Translation language to return |
| `category` | – | Optional filter |
| `mood` | – | Optional filter |
| `tone` | – | Optional filter |
| `limit` | `20` | Page size |
| `offset` | `0` | Page offset |

**Example**

```bash
curl "<BASE_URL>/api/verses/feed?language=es&category=love&limit=10&offset=0"
```

**Response** (array)

```json
[
  {
    "id": "b1e...",
    "verse_text": "Porque de tal manera amó Dios al mundo...",
    "reference": "Juan 3:16",
    "image_url": "https://cdn.example.com/john316.jpg",
    "rendered_image_url": "https://cdn.example.com/john316_es.jpg",
    "category": "love",
    "theme": "salvation",
    "scene": "",
    "mood": "hopeful",
    "tone": "",
    "tags": ["love", "salvation"],
    "created_at": "2026-08-26T09:00:00.000Z"
  }
]
```

---

#### Send image push for a verse

`POST /api/verses/send-push` — **auth required**

Sends the **image push** for one specific verse (by id) to every topic in the map. Use this to push a particular verse on demand.

**Body**

```json
{ "verseId": "b1e..." }
```

**Example**

```bash
curl -X POST "<BASE_URL>/api/verses/send-push" \
  -H "Authorization: Bearer $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "verseId": "b1e..." }'
```

**Response**

```json
{ "success": true, "message": "Push started" }
```

Returns `401` if the token is missing/wrong, `404` if the verse id is not found.

---

### Push (scheduled + fallback)

The morning / noon / evening pushes normally run automatically on their [timezone cron schedule](#scheduled-pushes--timezones). Each scheduled run always uses the **latest** verse in the database.

#### Manual push trigger (cron fallback)

`POST /api/push/trigger` — **auth required**

Re-runs a scheduled push **on demand**, sending to **all topics at once** (independent of timezone — like a single global run). Use it if a cron fails to fire.

**Body**

| Field | Type | Values |
| --- | --- | --- |
| `type` | string | `"morning"` \| `"noon"` \| `"evening"` \| `"all"` |

- `"morning"` / `"noon"` / `"evening"` — re-send that one push to every topic.
- `"all"` — re-send morning **+** noon **+** evening.

**Examples**

Re-run the **morning** push to everyone:

```bash
curl -X POST "<BASE_URL>/api/push/trigger" \
  -H "Authorization: Bearer $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "type": "morning" }'
```

Re-run the **noon** (image) push to everyone:

```bash
curl -X POST "<BASE_URL>/api/push/trigger" \
  -H "Authorization: Bearer $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "type": "noon" }'
```

Re-run the **evening** push to everyone:

```bash
curl -X POST "<BASE_URL>/api/push/trigger" \
  -H "Authorization: Bearer $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "type": "evening" }'
```

Recover **all three** at once:

```bash
curl -X POST "<BASE_URL>/api/push/trigger" \
  -H "Authorization: Bearer $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "type": "all" }'
```

**Response** (sends run in the background)

```json
{ "success": true, "message": "Push run(s) started (all topics)", "triggered": ["morning"] }
```

> Because it ignores timezones, this fires to regions regardless of their local time — appropriate for recovery. If a run only partially failed, re-running will re-send to users who already received it.

---

### Quizzes

#### Create a quiz

`POST /api/quizzes`

**Body**

```json
{
  "language": "en",
  "quiz": {
    "difficulty": "easy",
    "verseUniqId": "john-3-16",
    "questions": [ /* ... your quiz shape ... */ ]
  }
}
```

**Example**

```bash
curl -X POST "<BASE_URL>/api/quizzes" \
  -H "Content-Type: application/json" \
  -d '{ "language": "en", "quiz": { "difficulty": "easy", "verseUniqId": "john-3-16", "questions": [] } }'
```

**Response**

```json
{ "success": true }
```

#### Get quizzes

`GET /api/quizzes`

**Query params**

| Param | Default | Notes |
| --- | --- | --- |
| `language` | – | Required in practice |
| `difficulty` | – | Optional filter |
| `limit` | `10` | Page size |

**Example**

```bash
curl "<BASE_URL>/api/quizzes?language=en&difficulty=easy&limit=5"
```

**Response** — array of the stored `quiz` objects.

---

### Chapter reviews

`POST /api/chapter-review`

Returns a cached AI review for a book + chapter + language if present; otherwise generates one with OpenAI, saves it, and returns it.

**Body**

| Field | Type | Notes |
| --- | --- | --- |
| `book` | string | e.g. `"John"` |
| `chapter` | number | positive integer |
| `language` | string | min 2 chars |
| `chapterText` | string | min 20 chars — the chapter text to summarize |

**Example**

```bash
curl -X POST "<BASE_URL>/api/chapter-review" \
  -H "Content-Type: application/json" \
  -d '{
    "book": "John",
    "chapter": 3,
    "language": "en",
    "chapterText": "There was a man of the Pharisees named Nicodemus..."
  }'
```

**Response**

```json
{
  "success": true,
  "cached": false,
  "source": "openai",
  "data": {
    "title": "New Birth",
    "theme": "Regeneration",
    "summary": "Jesus explains to Nicodemus...",
    "estimated_read_time": "4 min"
  },
  "generatedAt": "2026-08-26T09:00:00.000Z"
}
```

A cached hit returns `"cached": true`, `"source": "cache"`, `"generatedAt": null`.

---

## Scheduled pushes & timezones

Three pushes run daily, each split into per-timezone cron buckets so every region gets it at roughly its own local time:

| Push | Local target | Payload |
| --- | --- | --- |
| **Morning** | ~08:00 | Day-rotating devotional title + verse text |
| **Noon** | ~12:00 | Image push (localized title/body + rendered image) |
| **Evening** | ~20:00 | Day-rotating devotional title + verse text |

The mapping of each UTC cron to the regions it serves lives in:

- `src/utils/morningCronSchedule.ts`
- `src/utils/noonCronSchedule.ts`
- `src/utils/eveningCronSchedule.ts`

These **must stay in sync** with the `triggers.crons` list in `wrangler.jsonc`. The region for a topic is taken from its topic-name suffix (e.g. `morning_verse_it` → `it` → Italy).

> **DST caveat:** Cloudflare crons are fixed UTC and do **not** shift for daylight saving, so during summer the pushes land ~1 hour later than the target local time in DST regions. If a scheduled run is missed, use [`POST /api/push/trigger`](#manual-push-trigger-cron-fallback).

---

## Local development

```bash
npm install
npx wrangler dev
```

Then open `http://localhost:8787/` for the Swagger UI.

Regenerate Cloudflare binding types after changing `wrangler.jsonc`:

```bash
npm run cf-typegen
```

## Deployment

```bash
npx wrangler deploy
```

Set secrets once per environment:

```bash
npx wrangler secret put INTERNAL_API_KEY
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SANTA_FIREBASE_PRIVATE_KEY
npx wrangler secret put PORTUGUESE_FIREBASE_PRIVATE_KEY
npx wrangler secret put ANDROID_APPS_FIREBASE_PRIVATE_KEY
npx wrangler secret put ANDROID_APPS1_FIREBASE_PRIVATE_KEY
```
