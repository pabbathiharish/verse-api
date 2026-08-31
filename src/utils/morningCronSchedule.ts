//
// Morning push time-zone schedule (impressions-based) — CURRENTLY DISABLED
// -----------------------------------------------------------------------
// Morning is presently sent as a single GLOBAL IST blast (all topics) at
// 7:30 AM IST — see src/index.ts (the "0 2 * * *" branch) which calls
// sendMorningPush(env) with NO cron. While that is the case this map is
// intentionally EMPTY, so it is not consulted at runtime.
//
// The block below is the FUTURE per-timezone schedule: fire the morning
// push at ~08:00 LOCAL time of each topic's top-impressions country
// (from the AdMob report — same method as noonCronSchedule.ts).
//
// TO ENABLE the per-timezone morning push:
//   1. Uncomment the entries in the object below.
//   2. In src/index.ts, disable the global "0 2 * * *" branch and
//      uncomment the `morningCronSchedule[controller.cron]` branch.
//   3. Add these cron keys to wrangler.jsonc `triggers.crons`
//      (0 0, 0 1, 30 2, 0 4, 0 5, 0 6, 0 7, 0 13) and remove "0 2".
//
// Representative country offsets (standard time; DST not tracked):
//   Philippines/China +8 | Indonesia +7 | India +5:30 | Armenia +4 |
//   Tanzania +3 | S.Africa/Finland/Greece +2 | Italy/Austria/Spain +1 |
//   United States -5
//
// NOTE: unlike noon, "te" (Telugu) IS included here — the on-create push
// exclusion applies only to the noon image push.
//
export const morningCronSchedule: Record<string, string[]> = {

	// ---- FUTURE: impressions-based 8:00 AM local buckets ----
	// "0 0 * * *":  ["ko", "tl", "fil"],                                   // UTC+8 (Philippines/China) 8 AM
	// "0 1 * * *":  ["id"],                                                // UTC+7 (Indonesia) 8 AM
	// "30 2 * * *": ["hi", "te", "ta", "ml", "kn", "bn", "or", "gu", "pa", "ne"], // UTC+5:30 (India) 8 AM
	// "0 4 * * *":  ["ru"],                                                // UTC+4 (Armenia) 8 AM
	// "0 5 * * *":  ["sw"],                                                // UTC+3 (Tanzania) 8 AM
	// "0 6 * * *":  ["zu", "st", "af", "fi", "el"],                        // UTC+2 8 AM
	// "0 7 * * *":  ["it", "de", "eo"],                                    // UTC+1 8 AM
	// "0 13 * * *": ["es", "fr", "pt", "ar", "ro", "en", "vi"]             // UTC-5 (US) 8 AM ET
};

//
// Extract the region code from a morning topic name.
// "morning_verse_it" -> "it"
//
export function getRegionFromTopic(topic: string): string {
	return topic.replace(/^morning_verse_/, "");
}
