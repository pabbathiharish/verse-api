import { getAccessToken }
	from "./firebaseAuth";

import {
	getLocalizedTitle,
	getLocalizedPushBody
}
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
	verse: any,
	onlyTopics?: string[]
) {

	console.log(
		`====== ALL TRANSLATIONS:\n ===== ${verse.translations}`
	);
	console.log(
		"===== TOPIC PUSH STARTED ====="
	);

	// Optionally restrict to specific topic(s). When omitted, send to all.
	const topicsToSend =
		onlyTopics && onlyTopics.length > 0
			? topicLanguageMap.filter(
				(item) => onlyTopics.includes(item.topic)
			)
			: topicLanguageMap;

	console.log(
		`Sending to ${topicsToSend.length} topic(s)` +
		(onlyTopics ? ` (filtered: ${onlyTopics.join(", ")})` : " (all)")
	);

	for (
		const item
		of topicsToSend
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


	const title = getLocalizedTitle(language);
	const pushBody = getLocalizedPushBody(language);
	const localizedImage = translation.rendered_image_url ?? imageUrl;

	console.log(`Translation: ${JSON.stringify(translation)}`);

	console.log(
		`Sending topic push to Topi:${topic}\n 
		 language:${language}\n
		 PushTitle:${title}\n
		 PushBody:${pushBody}\n
		 renderedImageURL:${localizedImage}`
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
