//
// Noon push time-zone schedule (impressions-driven)
// -------------------------------------------------
// Fires the midday image push (the "daily_verse_image_*" topics in
// topicLanguageMap) at ~12:00 (noon) LOCAL time for each app's audience.
//
// Unlike a generic "one representative offset per language", the timezone
// for each topic is chosen from the country where that app gets the MOST
// ad impressions (AdMob report). Where several apps share one language
// topic (e.g. 4 French apps), impressions are combined and the top country
// wins — because an FCM topic push reaches all its subscribers at once and
// cannot be split by country.
//
// Each key is a Cloudflare cron (UTC); the value is the region codes (topic
// suffixes) whose top-impressions country hits local 12:00 at that UTC time.
// Every cron here MUST also be in wrangler.jsonc `triggers.crons`.
//
// NOTE: "daily_verse_image_te" (Telugu) is intentionally NOT here — it is
// pushed on verse creation (see src/endpoints/createVerse.ts) and is also
// filtered out in noonPush.ts.
//
// Representative country offsets (standard time; DST not tracked):
//   Philippines/China UTC+8 | Indonesia UTC+7 | India UTC+5:30 |
//   Armenia UTC+4 | Tanzania UTC+3 | S.Africa/Finland/Greece UTC+2 |
//   Italy/Austria/Spain UTC+1 | United States UTC-5
//
export const noonCronSchedule: Record<string, string[]> = {

	// UTC+8 — Philippines (tl/fil), China (ko top country) — 12:00 local
	"0 4 * * *": ["tl", "fil", "ko"],

	// UTC+7 — Indonesia — 12:00 local
	"0 5 * * *": ["id"],

	// UTC+5:30 — India (top country for all these) — 12:00 local
	// (ne = Nepali grouped with India; no separate impressions data)
	"30 6 * * *": ["hi", "ta", "kn", "ml", "gu", "or", "pa", "bn", "ne"],

	// UTC+4 — Armenia (ru top country) — 12:00 local
	"0 8 * * *": ["ru"],

	// UTC+3 — Tanzania (sw top country) — 12:00 local
	"0 9 * * *": ["sw"],

	// UTC+2 — South Africa (zu/st/af), Finland (fi), Greece (el) — 12:00 local
	"0 10 * * *": ["zu", "st", "af", "fi", "el"],

	// UTC+1 — Italy (it), Austria (de), Spain (eo) — 12:00 local
	"0 11 * * *": ["it", "de", "eo"],

	// UTC-5 — United States (top country for all these, mostly diaspora)
	// — 12:00 US Eastern
	"0 17 * * *": ["es", "fr", "pt", "ar", "ro", "en", "vi"]
};

//
// Extract the region code from an image-push topic name.
// "daily_verse_image_it" -> "it"
//
export function getRegionFromTopic(topic: string): string {
	return topic.replace(/^daily_verse_image_/, "");
}
