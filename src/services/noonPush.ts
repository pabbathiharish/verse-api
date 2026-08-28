import { getAccessToken }
	from "./firebaseAuth";

import {
	getLocalizedTitle,
	getLocalizedPushBody
}
	from "./localization";

import type { Env }
	from "../types";

import {
	getFirebaseConfig
} from "../utils/firebaseConfig";

import {
	topicLanguageMap
} from "../utils/topicLanguageMap";

import {
	noonCronSchedule,
	getRegionFromTopic
} from "../utils/noonCronSchedule";


export async function sendNoonPush(
	env: Env,
	cron: string
) {

	console.log(
		`===== NOON PUSH STARTED (cron: ${cron}) =====`
	);

	// --------------------------------------------------
	// 0. Only send to the regions whose local noon
	//    matches this cron's UTC time.
	// --------------------------------------------------

	const allowedRegions =
		new Set(noonCronSchedule[cron] ?? []);

	if (allowedRegions.size === 0) {

		console.log(
			`No noon regions mapped for cron: ${cron}`
		);

		return;
	}

	const topicsForThisRun =
		topicLanguageMap.filter(
			(item) =>
				allowedRegions.has(
					getRegionFromTopic(item.topic)
				)
		);

	console.log(
		`Regions for this run: [${[...allowedRegions].join(", ")}] -> ${topicsForThisRun.length} topics`
	);

	// --------------------------------------------------
	// 1. Fetch latest verse + translations
	// --------------------------------------------------

	const latest =
		await getLatestVerse(env);

	if (!latest) {

		console.log(
			"No latest verse found"
		);

		return;
	}

	const verse =
		latest.verse;

	const translationMap =
		latest.translations;

	// Cache Firebase tokens per project
	const accessTokenMap =
		new Map<string, string>();

	// --------------------------------------------------
	// 2. Loop through this bucket's topics
	// --------------------------------------------------

	for (
		const item
		of topicsForThisRun
	) {

		const language =
			item.language;

		const topic =
			item.topic;

		const project =
			item.project;

		const schema =
			item.deeplinkSchema;

		// --------------------------------------------------
		// 3. Get translation
		// --------------------------------------------------
		const translation = translationMap.get(language);

		if (!translation) {

			console.log(
				`No translation found for ${language}`
			);

			continue;
		}

		try {

			// --------------------------------------------------
			// 4. Firebase access token (cached per project)
			// --------------------------------------------------

			let accessToken =
				accessTokenMap.get(project);

			if (!accessToken) {

				accessToken =
					await getAccessToken(env, project);

				accessTokenMap.set(project, accessToken);
			}

			// --------------------------------------------------
			// 5. Send notification
			// --------------------------------------------------

			await sendNoonTopicPush(
				env,
				accessToken,
				project,
				topic,
				language,
				translation,
				verse.image_url,
				schema
			);

			console.log(
				`Noon push success: ${topic}`
			);

		}
		catch (error: any) {

			console.error(
				`Noon push failed: ${topic}`,
				error?.message || error
			);
		}
	}

	console.log(
		"===== NOON PUSH COMPLETED ====="
	);
}

// ==================================================
// Get latest verse with translations
// ==================================================

async function getLatestVerse(
	env: Env
) {

	const latestVerse = await env.DB
		.prepare(`
			SELECT *
			FROM verses
			ORDER BY created_at DESC
			LIMIT 1
		`)
		.first<any>();

	if (!latestVerse) {

		console.log(
			"No latest verse found"
		);

		return null;
	}

	console.log(
		`Latest verse: ${JSON.stringify(latestVerse)}`
	);

	const translations = await env.DB
		.prepare(`
			SELECT *
			FROM verse_translations
			WHERE verse_id = ?
		`)
		.bind(latestVerse.id)
		.all<any>();

	console.log(
		`Found ${translations.results.length} translations`
	);

	const translationMap =
		new Map(
			translations.results.map(
				(translation: any) => [
					translation.language,
					translation
				]
			)
		);

	return {
		verse: latestVerse,
		translations: translationMap
	};
}

// ==================================================
// Send Noon Topic Push (image push — mirrors push.ts)
// ==================================================

async function sendNoonTopicPush(
	env: Env,
	accessToken: string,
	project: string,
	topic: string,
	language: string,
	translation: any,
	imageUrl: string,
	schema: string
) {

	const title = getLocalizedTitle(language);
	const pushBody = getLocalizedPushBody(language);
	const localizedImage = translation.rendered_image_url ?? imageUrl;

	console.log(
		`Sending noon push:
		Topic: ${topic}
		Language: ${language}
		Title: ${title}
		Image: ${localizedImage}`
	);

	const firebaseConfig =
		getFirebaseConfig(env, project);

	const response =
		await fetch(

			`https://fcm.googleapis.com/v1/projects/${firebaseConfig.projectId}/messages:send`,

			{
				method: "POST",

				headers: {

					Authorization:
						`Bearer ${accessToken}`,

					"Content-Type":
						"application/json"
				},

				body: JSON.stringify({

					message: {

						topic,

						notification: {

							title,

							body: pushBody
						},

						data: {

							image_url: imageUrl,
							verse_text: translation.verse_text,
							reference: translation.reference,
							deep_link: `${schema}://home/verse-image-generator`
						},

						android: {

							notification: {
								title,
								body: pushBody,
								image: localizedImage,
								channel_id: "verse_notifications"
							}
						},

						apns: {

							payload: {

								aps: {

									"mutable-content": 1
								}
							},

							fcm_options: {

								image: localizedImage
							}
						}
					}
				})
			}
		);

	const text =
		await response.text();

	if (!response.ok) {

		console.error(
			"NOON FCM ERROR:",
			text
		);

		throw new Error(text);
	}

	console.log(
		`Noon push sent successfully to ${topic}`
	);
}
