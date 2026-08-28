//
// Noon push time-zone schedule
// ----------------------------
// Same idea as morningCronSchedule.ts / eveningCronSchedule.ts, but for the
// midday image push (the "daily_verse_image_*" topics in topicLanguageMap)
// fired at roughly 12:00 (noon) local time per region.
//
// Region is taken from the topic suffix (e.g. "daily_verse_image_it" -> "it"),
// NOT the `language` field (most entries are `language: "eng"`).
//
// Each key is a Cloudflare cron expression (UTC). The value is the list of
// region codes whose local ~12:00 falls at that UTC time. Every cron listed
// here MUST also be declared under `triggers.crons` in wrangler.jsonc.
//
// Representative offsets match the morning/evening schedules so a region keeps
// the same timezone assumption across all three pushes.
//
//   Region examples          Offset      Local 12:00 -> UTC cron
//   -----------------------  ----------  -----------------------
//   ko (Korea)               UTC+9       03:00
//   tl, fil (Philippines)    UTC+8       04:00
//   id, vi (Indonesia/VN)    UTC+7       05:00   (shared w/ morning ru,ar,sw)
//   India group              UTC+5:30    06:30
//   ru, ar, sw               UTC+3       09:00
//   zu, st, af, ro, el, fi   UTC+2       10:00
//   es, fr, de, it           UTC+1       11:00   (shared w/ morning pt, evening ko)
//   en, eo                   UTC+0       12:00   (shared w/ evening tl,fil)
//   pt (Brazil)              UTC-3       15:00
//
export const noonCronSchedule: Record<string, string[]> = {

	// UTC+9 — Korea
	"0 3 * * *": ["ko"],

	// UTC+8 — Philippines
	"0 4 * * *": ["tl", "fil"],

	// UTC+7 — Indonesia, Vietnam
	"0 5 * * *": ["id", "vi"],

	// UTC+5:30 — Indian subcontinent (Nepal/Bangladesh grouped in, ~15-30m off)
	"30 6 * * *": ["hi", "te", "ta", "ml", "kn", "bn", "or", "gu", "pa", "ne"],

	// UTC+3 — Russia (Moscow), Arabic (Gulf), Swahili (East Africa)
	"0 9 * * *": ["ru", "ar", "sw"],

	// UTC+2 — Southern Africa, Romania, Greece, Finland
	"0 10 * * *": ["zu", "st", "af", "ro", "el", "fi"],

	// UTC+1 — Western/Central Europe
	"0 11 * * *": ["es", "fr", "de", "it"],

	// UTC+0 — English (UK) / Esperanto
	"0 12 * * *": ["en", "eo"],

	// UTC-3 — Portuguese (Brazil)
	"0 15 * * *": ["pt"]
};

//
// Extract the region code from an image-push topic name.
// "daily_verse_image_it" -> "it"
//
export function getRegionFromTopic(topic: string): string {
	return topic.replace(/^daily_verse_image_/, "");
}
