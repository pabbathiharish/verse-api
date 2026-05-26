import {
	SignJWT,
	importPKCS8
} from "jose";

import type { Env }
	from "../types";

import {
	getFirebaseConfig
} from "../utils/firebaseConfig";

const GOOGLE_TOKEN_URL =
	"https://oauth2.googleapis.com/token";

export async function getAccessToken(
	env: Env,
	project: string
): Promise<string> {

	const firebaseConfig =
		getFirebaseConfig(
			env,
			project
		);

	const now =
		Math.floor(Date.now() / 1000);

	const privateKey =
		firebaseConfig.privateKey
			.replace(/\\n/g, "\n");

	const alg = "RS256";

	const key =
		await importPKCS8(
			privateKey,
			alg
		);

	const jwt =
		await new SignJWT({
			scope:
				"https://www.googleapis.com/auth/cloud-platform"
		})
			.setProtectedHeader({ alg })
			.setIssuedAt(now)
			.setExpirationTime(now + 3600)
			.setIssuer(
				firebaseConfig.clientEmail
			)
			.setSubject(
				firebaseConfig.clientEmail
			)
			.setAudience(
				GOOGLE_TOKEN_URL
			)
			.sign(key);

	const response =
		await fetch(
			GOOGLE_TOKEN_URL,
			{
				method: "POST",

				headers: {
					"Content-Type":
						"application/x-www-form-urlencoded"
				},

				body:
					new URLSearchParams({

						grant_type:
							"urn:ietf:params:oauth:grant-type:jwt-bearer",

						assertion:
							jwt
					})
			}
		);

	const data: any =
		await response.json();

	return data.access_token;
}
