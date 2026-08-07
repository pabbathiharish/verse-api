import { getAccessToken }
	from "./firebaseAuth";

import { getLocalizedTitle }
	from "../services/localization";

import type { Env }
	from "../types";

import {
	getFirebaseConfig
} from "../utils/firebaseConfig";

import {
	topicLanguageMap
} from "../utils/topicLanguageMap";




export async function sendVersePush(
	env: Env,
	verse: any
) {

	console.log(
		"===== TOPIC PUSH STARTED ====="
	);

	for (
		const item
		of topicLanguageMap
	) {


		const language = item.language;

		const topic = item.topic;

		const project = item.project;
		const schema = item.deeplinkSchema;

		const accessToken = await getAccessToken(env, project);

		console.log("Firebase access token generated");

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
				project,
				topic,
				language,
				translation,
				verse.image_url,
				schema
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
	project: string,
	topic: string,
	language: string,
	translation: any,
	imageUrl: string,
	schema: string
) {

	const title =
		getLocalizedTitle(
			language
		);
	const localizedImage = translation.image_url ?? imageUrl;
	console.log(
		`Sending topic push to Topi:${topic}\n language:${language}\n
		 Translation:${translation.verse_text}\n
		 ${translation.reference}\n imageUrl:${localizedImage}`
	);


	const firebaseConfig = getFirebaseConfig(env, project);

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
								`${translation.verse_text}\n— ${translation.reference}`
						},

						data: {

							image_url:
								localizedImage,

							verse_text:
								translation.verse_text,
							reference: translation.reference,
							deep_link: `${schema}://home/verse-image-generator`
						},

						android: {

							notification: {

								image:
									localizedImage,
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
									localizedImage,
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
