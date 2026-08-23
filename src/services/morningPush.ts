import { getAccessToken }
	from "./firebaseAuth";

import {
	morningTitles,
	genericMorningTitles
}
	from "../utils/devotional_titles";

import type { Env }
	from "../types";

import {
	getFirebaseConfig
} from "../utils/firebaseConfig";

import {
	morningTopicLanguageMap
} from "../utils/morningTopicLanguageMap";


export async function sendMorningPush(
	env: Env
) {

	console.log(
		"===== MORNING PUSH STARTED ====="
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
	// 2. Loop through all morning topics
	// --------------------------------------------------

	for (
		const item
		of morningTopicLanguageMap
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

			await sendMorningTopicPush(
				env,
				accessToken,
				project,
				topic,
				language,
				translation,
				schema
			);


			console.log(
				`Morning push success: ${topic}`
			);

		}
		catch (error: any) {

			console.error(
				`Morning push failed: ${topic}`,
				error?.message || error
			);
		}
	}

	console.log(
		"===== MORNING PUSH COMPLETED ====="
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
// Send Morning Topic Push
// ==================================================

async function sendMorningTopicPush(
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
		morningTitles[language] ??
		morningTitles.en;

	const title =
		titles?.[dayIndex] ?? genericMorningTitles[language];;

	const pushBody =
		`"${translation.verse_text}"\n — ${translation.reference}`;


	console.log(
		`Sending morning push:
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
			"MORNING FCM ERROR:",
			text
		);

		throw new Error(text);
	}


	console.log(
		`Morning push sent successfully to ${topic}`
	);
}