// Visiting-company tracker for the corporate events pages.
//
// A Cloudflare Pages middleware. Because this file sits in
// functions/corporate-events/, it runs only for /corporate-events/* and no
// other page ever invokes a function. The page is served first; the logging
// happens afterwards inside waitUntil, and any error is swallowed, so a
// visitor never waits on it or sees it fail.
//
// Settings live in the Cloudflare Pages project (Settings > Bindings and
// Settings > Variables and Secrets). See README.md, "Visiting companies".

import { trackVisit, type TrackEnv } from '../../src/server/visitors/track.ts';
import type { CfData } from '../../src/server/visitors/lookup.ts';

interface Context {
  request: Request & { cf?: CfData };
  env: TrackEnv;
  next(): Promise<Response>;
  waitUntil(promise: Promise<unknown>): void;
}

export async function onRequest(context: Context): Promise<Response> {
  const response = await context.next();
  try {
    context.waitUntil(
      trackVisit(context.request, context.env).catch((err) => console.error('Visitor tracking failed', err)),
    );
  } catch (err) {
    console.error('Visitor tracking could not start', err);
  }
  return response;
}
