//
// Morning push time-zone schedule
// --------------------------------
// The single 08:00-IST cron used to fire ONE morning push for the whole
// world. That meant 08:00 IST = evening / night / pre-dawn for everyone
// outside India.
//
// This map splits the morning push by region so each audience receives it
// at roughly 08:00 in THEIR local time. The region is taken from the topic
// suffix (e.g. "morning_verse_it" -> "it" -> Italy), NOT from the `language`
// field, because most entries carry `language: "eng"` and cannot distinguish
// one region from another.
//
// Each key is a Cloudflare cron expression (always evaluated in UTC). The
// value is the list of region codes whose local ~08:00 falls at that UTC
// time. Every cron listed here MUST also be declared under
// `triggers.crons` in wrangler.jsonc, and vice-versa.
//
// NOTE on representative timezones: several "languages" span many zones
// (English, Spanish, Portuguese, Arabic, Russian). We pick one representative
// offset per region — adjust the region below to shift a group to a different
// cron bucket.
//
//   Region examples          Offset      Local 08:00 -> UTC cron
//   -----------------------  ----------  -----------------------
//   ko (Korea)               UTC+9       23:00 (previous day)
//   tl, fil (Philippines)    UTC+8       00:00
//   id, vi (Indonesia/VN)    UTC+7       01:00
//   India group              UTC+5:30    02:30
//   ru, ar, sw               UTC+3       05:00
//   zu, st, af, ro, el, fi   UTC+2       06:00
//   es, fr, de, it           UTC+1       07:00
//   en, eo                   UTC+0       08:00
//   pt (Brazil)              UTC-3       11:00
//
export const morningCronSchedule: Record<string, string[]> = {

	// UTC+9 — Korea
	"0 23 * * *": ["ko"],

	// UTC+8 — Philippines
	"0 0 * * *": ["tl", "fil"],

	// UTC+7 — Indonesia, Vietnam
	"0 1 * * *": ["id", "vi"],

	// UTC+5:30 — Indian subcontinent (Nepal/Bangladesh grouped in, ~15-30m off)
	"30 2 * * *": ["hi", "te", "ta", "ml", "kn", "bn", "or", "gu", "pa", "ne"],

	// UTC+3 — Russia (Moscow), Arabic (Gulf), Swahili (East Africa)
	"0 5 * * *": ["ru", "ar", "sw"],

	// UTC+2 — Southern Africa, Romania, Greece, Finland
	"0 6 * * *": ["zu", "st", "af", "ro", "el", "fi"],

	// UTC+1 — Western/Central Europe
	"0 7 * * *": ["es", "fr", "de", "it"],

	// UTC+0 — English (UK) / Esperanto
	"0 8 * * *": ["en", "eo"],

	// UTC-3 — Portuguese (Brazil)
	"0 11 * * *": ["pt"]
};

//
// Extract the region code from a morning topic name.
// "morning_verse_it" -> "it"
//
export function getRegionFromTopic(topic: string): string {
	return topic.replace(/^morning_verse_/, "");
}
