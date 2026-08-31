//
// Evening push time-zone schedule (impressions-based) — CURRENTLY DISABLED
// -----------------------------------------------------------------------
// Evening is presently sent as a single GLOBAL IST blast (all topics) at
// 6:30 PM IST — see src/index.ts (the "0 13 * * *" branch) which calls
// sendEveningPush(env) with NO cron. While that is the case this map is
// intentionally EMPTY, so it is not consulted at runtime.
//
// The block below is the FUTURE per-timezone schedule: fire the evening
// push at ~19:00 (7 PM) LOCAL time of each topic's top-impressions country
// (from the AdMob report — same method as noonCronSchedule.ts).
//
// TO ENABLE the per-timezone evening push:
//   1. Uncomment the entries in the object below.
//   2. In src/index.ts, disable the global "0 13 * * *" branch and
//      uncomment the `eveningCronSchedule[controller.cron]` branch.
//   3. Add these cron keys to wrangler.jsonc `triggers.crons`
//      (0 0, 0 11, 0 12, 30 13, 0 15, 0 16, 0 17, 0 18) and remove "0 13".
//
// Representative country offsets (standard time; DST not tracked):
//   Philippines/China +8 | Indonesia +7 | India +5:30 | Armenia +4 |
//   Tanzania +3 | S.Africa/Finland/Greece +2 | Italy/Austria/Spain +1 |
//   United States -5
//
// NOTE: unlike noon, "te" (Telugu) IS included here — the on-create push
// exclusion applies only to the noon image push.
//
export const eveningCronSchedule: Record<string, string[]> = {

	// ---- FUTURE: impressions-based 7:00 PM (19:00) local buckets ----
	// "0 11 * * *": ["ko", "tl", "fil"],                                    // UTC+8 (Philippines/China) 7 PM
	// "0 12 * * *": ["id"],                                                 // UTC+7 (Indonesia) 7 PM
	// "30 13 * * *": ["hi", "te", "ta", "ml", "kn", "bn", "or", "gu", "pa", "ne"], // UTC+5:30 (India) 7 PM
	// "0 15 * * *": ["ru"],                                                 // UTC+4 (Armenia) 7 PM
	// "0 16 * * *": ["sw"],                                                 // UTC+3 (Tanzania) 7 PM
	// "0 17 * * *": ["zu", "st", "af", "fi", "el"],                         // UTC+2 7 PM
	// "0 18 * * *": ["it", "de", "eo"],                                     // UTC+1 7 PM
	// "0 0 * * *":  ["es", "fr", "pt", "ar", "ro", "en", "vi"]              // UTC-5 (US) 7 PM ET
};

//
// Extract the region code from an evening topic name.
// "evening_verse_it" -> "it"
//
export function getRegionFromTopic(topic: string): string {
	return topic.replace(/^evening_verse_/, "");
}
