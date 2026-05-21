import type { Env } from "../types";

interface FirestoreToken {
	token: string;
	bundleId: string;
}

export async function getTokensByLanguage(
	env: Env,
	accessToken: string,
	language: string
): Promise<FirestoreToken[]> {

	const url =
	`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/bibleapps/documents:runQuery`;
	

	const response = await fetch(url, {

		method: "POST",

		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json"
		},

		body: JSON.stringify({

			structuredQuery: {

				from: [
					{
						collectionId: "FcmTokens"
					}
				],

				where: {

					fieldFilter: {

						field: {
							fieldPath: "language"
						},

						op: "EQUAL",

						value: {
							stringValue: language
						}
					}
				}
			}
		})
	});

	const text = await response.text();

	console.log("Firestore RAW RESPONSE");

	if (!response.ok) {
		console.log("Invalid JSON response from Firestore: ${response}");
		throw new Error(
			`Firestore API Error (${response.status}): ${text}`
		);
	}

	let data: any;

	try {
		data = JSON.parse(text);
		console.log("Firestore JSON PARSE SUCCESS");
	}
	catch (error) {
		console.log(`Invalid JSON response from Firestore: ${text}`);
		throw new Error(
			`Invalid JSON response from Firestore: ${text}`
		);
	}

	return data
		.filter(
			(item: any) => item.document
		)
		.map((item: any) => {

			const fields =
				item.document.fields;

			return {

				token:
					fields.token?.stringValue || "",

				bundleId:
					fields.bundleId?.stringValue || ""
			};
		});
}