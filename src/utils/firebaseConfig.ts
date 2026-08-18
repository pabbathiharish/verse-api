import type { Env }
	from "../types";

export interface FirebaseProjectConfig {

	projectId: string;

	clientEmail: string;

	privateKey: string;
}

export function getFirebaseConfig(
	env: Env,
	project: string
): FirebaseProjectConfig {

	switch (project) {

		case "santa":

			return {

				projectId:
					env.SANTA_FIREBASE_PROJECT_ID,

				clientEmail:
					env.SANTA_FIREBASE_CLIENT_EMAIL,

				privateKey:
					env.SANTA_FIREBASE_PRIVATE_KEY
			};

		case "portuguese":

			return {

				projectId:
					env.PORTUGUESE_FIREBASE_PROJECT_ID,

				clientEmail:
					env.PORTUGUESE_FIREBASE_CLIENT_EMAIL,

				privateKey:
					env.PORTUGUESE_FIREBASE_PRIVATE_KEY
			};

		case "ANDROID_APPS":

			return {

				projectId:
					env.ANDROID_APPS_FIREBASE_PROJECT_ID,

				clientEmail:
					env.ANDROID_APPS_FIREBASE_CLIENT_EMAIL,

				privateKey:
					env.ANDROID_APPS_FIREBASE_PRIVATE_KEY
			};

		case "ANDROID_APPS1":

			return {

				projectId:
					env.ANDROID_APPS1_FIREBASE_PROJECT_ID,

				clientEmail:
					env.ANDROID_APPS1_FIREBASE_CLIENT_EMAIL,

				privateKey:
					env.ANDROID_APPS1_FIREBASE_PRIVATE_KEY
			};	

		default:

			throw new Error(
				`Unknown firebase project: ${project}`
			);
	}
}
