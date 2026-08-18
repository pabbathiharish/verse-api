import { getAccessToken }
	from "./firebaseAuth";

import {
	morningTitles,
	getLocalizedPushBody
}
	from "../services/localization";

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

	const verse =
		await getLatestVerse(env);

	if (!verse) {

		console.log(
			"No latest verse found"
		);

		return;
	}

	console.log(
		`Latest verse: ${JSON.stringify(verse)}`
	);


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

		const translation =
			verse.translations?.[language];

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

			const accessToken =
				await getAccessToken(
					env,
					project
				);


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
// Get latest verse
// ==================================================

async function getLatestVerse(
	env: Env
) {

	const result =
		await env.DB
			.prepare(`
				SELECT *
				FROM verses
				ORDER BY created_at DESC
				LIMIT 1
			`)
			.first<any>();


	if (!result) {

		return null;
	}


	// If translations is stored as JSON
	if (
		typeof result.translations === "string"
	) {

		result.translations =
			JSON.parse(
				result.translations
			);
	}


	return result;
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

	const title =
	morningTitles[language]
	?? morningTitles.eng;

	const pushBody =
	`"${translation.verse_text}" — ${translation.reference}`;


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