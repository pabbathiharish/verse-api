import { getAccessToken }
	from "./firebaseAuth";

import { getLocalizedTitle }
	from "../services/localization";

import type { Env }
	from "../types";

const TOPIC_LANGUAGE_MAP = [

	{
		topic: "daily_verse_image_zu",
		language: "eng"
	},

	{
		topic: "daily_verse_image_fr",
		language: "fr"
	},

	{
		topic: "daily_verse_image_es",
		language: "es"
	},

	{
		topic: "daily_verse_image_se",
		language: "eng"
	},

	{
		topic: "daily_verse_image_hi",
		language: "hi"
	},

	{
		topic: "daily_verse_image_te",
		language: "te"
	},

	{
		topic: "daily_verse_image_ta",
		language: "ta"
	},

	{
		topic: "daily_verse_image_ko",
		language: "ko"
	},

	{
		topic: "daily_verse_image_ar",
		language: "ar"
	}
];

export async function sendVersePush(
	env: Env,
	verse: any
) {

	console.log(
		"===== TOPIC PUSH STARTED ====="
	);

	const accessToken =
		await getAccessToken(env);

	console.log(
		"Firebase access token generated"
	);

	for (
		const item
		of TOPIC_LANGUAGE_MAP
	) {

		
		const language = item.language;

		const topic = item.topic;

		console.log(
			`Processing language: ${language}`
		);
		const translation =
			verse.translations[
				language
			];

		if (!translation) {

			console.log(
				`No translation found for ${language}`
			);

			continue;
		}

		try {

			await sendTopicPush(
					env,
					accessToken,
					topic,
					language,
					translation,
					verse.image_url
					);

			console.log(
				`Topic push success for ${language}`
			);
		}
		catch (error: any) {

			console.error(
				`Topic push failed for ${language}`,
				error?.message || error
			);
		}
	}

	console.log(
		"===== TOPIC PUSH COMPLETED ====="
	);
}

async function sendTopicPush(
	env: Env,
	accessToken: string,
	topic: string,
	language: string,
	translation: any,
	imageUrl: string
) {

	const title =
		getLocalizedTitle(
			language
		);

	console.log(
		`Sending topic push to Topi:${topic}\n language:${language}\n Translation:${translation.short_text}\n— ${translation.reference}\n imageUrl:${imageUrl}`
	);

	const response =
		await fetch(

`https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`,

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
`${translation.short_text}\n— ${translation.reference}`
						},

						data: {

							image_url:
								imageUrl,

							reference:
								translation.reference
						},

						android: {

							notification: {

								image:
									imageUrl
							}
						},

						apns: {

							payload: {

								aps: {

									"mutable-content":
										1
								}
							},

							fcm_options: {

								image:
									imageUrl
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
			"FCM TOPIC PUSH ERROR:",
			text
		);

		throw new Error(text);
	}

	console.log(
		`Topic push sent successfully to ${topic}`
	);
}
