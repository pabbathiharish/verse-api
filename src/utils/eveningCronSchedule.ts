//
// Evening push time-zone schedule
// -------------------------------
// Mirror of morningCronSchedule.ts, but for the evening push at roughly
// 20:00 (8 PM) local time per region. Region is taken from the topic
// suffix (e.g. "evening_verse_it" -> "it" -> Italy), NOT the `language`
// field (most entries are `language: "eng"`).
//
// Each key is a Cloudflare cron expression (UTC). The value is the list of
// region codes whose local ~20:00 falls at that UTC time. Every cron listed
// here MUST also be declared under `triggers.crons` in wrangler.jsonc.
//
// Representative offsets match morningCronSchedule.ts so a region keeps the
// same timezone assumption for both pushes.
//
//   Region examples          Offset      Local 20:00 -> UTC cron
//   -----------------------  ----------  -----------------------
//   ko (Korea)               UTC+9       11:00   (same time as pt morning)
//   tl, fil (Philippines)    UTC+8       12:00
//   id, vi (Indonesia/VN)    UTC+7       13:00
//   India group              UTC+5:30    14:30
//   ru, ar, sw               UTC+3       17:00
//   zu, st, af, ro, el, fi   UTC+2       18:00
//   es, fr, de, it           UTC+1       19:00
//   en, eo                   UTC+0       20:00
//   pt (Brazil)              UTC-3       23:00   (same time as ko morning)
//
export const eveningCronSchedule: Record<string, string[]> = {

	// UTC+9 — Korea (shares 11:00 UTC with pt morning)
	"0 11 * * *": ["ko"],

	// UTC+8 — Philippines
	"0 12 * * *": ["tl", "fil"],

	// UTC+7 — Indonesia, Vietnam
	"0 13 * * *": ["id", "vi"],

	// UTC+5:30 — Indian subcontinent (Nepal/Bangladesh grouped in, ~15-30m off)
	"30 14 * * *": ["hi", "te", "ta", "ml", "kn", "bn", "or", "gu", "pa", "ne"],

	// UTC+3 — Russia (Moscow), Arabic (Gulf), Swahili (East Africa)
	"0 17 * * *": ["ru", "ar", "sw"],

	// UTC+2 — Southern Africa, Romania, Greece, Finland
	"0 18 * * *": ["zu", "st", "af", "ro", "el", "fi"],

	// UTC+1 — Western/Central Europe
	"0 19 * * *": ["es", "fr", "de", "it"],

	// UTC+0 — English (UK) / Esperanto
	"0 20 * * *": ["en", "eo"],

	// UTC-3 — Portuguese (Brazil) (shares 23:00 UTC with ko morning)
	"0 23 * * *": ["pt"]
};

//
// Extract the region code from an evening topic name.
// "evening_verse_it" -> "it"
//
export function getRegionFromTopic(topic: string): string {
	return topic.replace(/^evening_verse_/, "");
}
