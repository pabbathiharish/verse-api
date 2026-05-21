import { fromHono } from "chanfana";
import { Hono } from "hono";
import { CreateVerse } from "./endpoints/createVerse";
import { GetVerses } from "./endpoints/getVerses";
import { SendVersePush } from "./endpoints/sendVersePush";

import type { Env }
	from "./types";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints
openapi.post("/api/verses", CreateVerse);
openapi.post(
	"/api/verses/send-push",
	SendVersePush
);

openapi.get("/api/verses/feed", GetVerses);


// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
