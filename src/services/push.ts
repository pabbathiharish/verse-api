import { getAccessToken }
	from "./firebaseAuth";

import { getTokensByLanguage }
	from "./firestore";

import { chunkArray }
	from "../utils/chunks";

import { processWithConcurrency }
	from "../utils/concurrency";

import { getLocalizedTitle }
	from "../services/localization";

import type { Env }
	from "../types";

const LANGUAGES = [
	"es", "pt", "fr",
	"de", "ru", "eng",
	"hi", "te", "ta",
	"ko", "ar"
];

export async function sendVersePush(
	env: Env,
	verse: any
) {

	console.log("===== PUSH STARTED =====");

	const accessToken =
		await getAccessToken(env);

	console.log(
		"Firebase access token generated successfully"
	);

	for (
		const language
		of LANGUAGES
	) {

		console.log(
			`Processing language: ${language}`
		);

		const translation =
			verse.translations[
				language
			];

		if (!translation) {

			console.log(
				`No translation found for language: ${language}`
			);

			continue;
		}

		console.log(
			`Fetching tokens for language: ${language}`
		);

		const tokens =
			await getTokensByLanguage(
				env,
				accessToken,
				language
			);
		const limitedTokens = tokens.slice(0, 20);

		console.log(
			`Found ${tokens.length} tokens for ${language}`
		);

		if (!tokens.length) {

			console.log(
				`Skipping ${language} because no tokens found`
			);

			continue;
		}

		const batches = chunkArray(limitedTokens, 5);

		console.log(
			`${language} split into ${batches.length} batches`
		);

		await processWithConcurrency(
	batches,
	1,

	async (batch: any[]) => {

		console.log(
			`Starting batch with ${batch.length} tokens for ${language}`
		);

		await processWithConcurrency(
			batch,
			1,

			async (item: any) => {

				try {

					await sendSinglePush(
						env,
						accessToken,
						item.token,
						item.bundleId,
						language,
						translation,
						verse.image_url
					);

					console.log(
						`Push success for ${language}`
					);
				}
				catch (error: any) {

					console.error(
						`Push failed for ${language}`,
						error?.message || error
					);
				}
			}
		);

		console.log(
			`Completed batch for ${language}`
		);
	}
);

		console.log(
			`Completed language: ${language}`
		);
	}

	console.log("===== PUSH COMPLETED =====");
}

async function sendSinglePush(
	env: Env,
	accessToken: string,
	token: string,
	bundleId: string,
	language: string,
	translation: any,
	imageUrl: string
) {

	const title =
		getLocalizedTitle(
			language
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

						token,

						notification: {

							title,

							body:
`${translation.short_text}\n— ${translation.reference}`
						},

						data: {

							image_url:
								imageUrl
						},

						android: {

							notification: {

								image:
									imageUrl
							}
						},

						apns: {

							headers: {

								"apns-topic":
									bundleId
							},

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
			"FCM PUSH ERROR:",
			text
		);

		throw new Error(text);
	}

	console.log(
		"FCM push sent successfully"
	);
}