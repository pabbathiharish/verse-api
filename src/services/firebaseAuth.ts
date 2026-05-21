import {
	SignJWT,
	importPKCS8
} from "jose";

import type { Env }
	from "../types";

const GOOGLE_TOKEN_URL =
	"https://oauth2.googleapis.com/token";

export async function getAccessToken(
	env: Env
): Promise<string> {

	const now =
		Math.floor(Date.now() / 1000);

	const privateKey =
		env.FIREBASE_PRIVATE_KEY
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
				env.FIREBASE_CLIENT_EMAIL
			)
			.setSubject(
				env.FIREBASE_CLIENT_EMAIL
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