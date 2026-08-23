import { getAccessToken }
	from "./firebaseAuth";

import {
	eveningTitles,
	genericEveningTitles
}
	from "../utils/devotional_titles";

import type { Env }
	from "../types";

import {
	getFirebaseConfig
} from "../utils/firebaseConfig";

import {
	eveningTopicLanguageMap
} from "../utils/eveningTopicLanguageMap";


export async function sendEveningPush(
	env: Env
) {

	console.log(
		"===== EVENING PUSH STARTED ====="
	);

	// --------------------------------------------------
	// 1. Fetch latest verse
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
	// 2. Loop through all evening topics
	// --------------------------------------------------

	for (
		const item
		of eveningTopicLanguageMap
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
			// 4. Firebase access token
			// --------------------------------------------------

			let accessToken =
				accessTokenMap.get(
					project
				);

			if (!accessToken) {

				accessToken =
					await getAccessToken(
						env,
						project
					);

				accessTokenMap.set(
					project,
					accessToken
				);
			}


			// --------------------------------------------------
			// 5. Send notification
			// --------------------------------------------------

			await sendEveningTopicPush(
				env,
				accessToken,
				project,
				topic,
				language,
				translation,
				schema
			);


			console.log(
				`EVENING push success: ${topic}`
			);

		}
		catch (error: any) {

			console.error(
				`Evening push failed: ${topic}`,
				error?.message || error
			);
		}
	}

	console.log(
		"===== EVENING PUSH COMPLETED ====="
	);
}

// ==================================================
// Get latest verse with translations
// ==================================================

async function getLatestVerse(
	env: Env
) {

	// 1. Get latest verse
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


	// 2. Get all translations for this verse
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


	// 3. Create language lookup
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
// Send Evening Topic Push
// ==================================================

async function sendEveningTopicPush(
	env: Env,
	accessToken: string,
	project: string,
	topic: string,
	language: string,
	translation: any,
	schema: string
) {

	const dayIndex = new Date().getUTCDate() - 1;

	const titles =
		eveningTitles[language] ??
		eveningTitles.en;

	const title =
		titles?.[dayIndex] ?? genericEveningTitles[language];

	const pushBody =
		`"${translation.verse_text}"\n — ${translation.reference}`;


	console.log(
		`Sending Evening push:
		Topic: ${topic}
		Language: ${language}
		Title: ${title}
		Body: ${pushBody}`
	);


	const firebaseConfig =
		getFirebaseConfig(
			env,
			project
		);


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

							body:
								pushBody
						},

						data: {

							verse_text:
								translation.verse_text,

							reference:
								translation.reference,

							deep_link:
								`${schema}://home/verse`
						}

					}

				})
			}
		);


	const text =
		await response.text();


	if (!response.ok) {

		console.error(
			"EVENING FCM ERROR:",
			text
		);

		throw new Error(text);
	}


	console.log(
		`Evening push sent successfully to ${topic}`
	);
}