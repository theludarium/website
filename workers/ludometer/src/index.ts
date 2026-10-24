// The Ludometer Worker entry point. The Workers runtime allows only handlers as
// exports here, so the routes and jobs live in src/app.ts.
import type { Env } from './env';
import { handleFetch, handleScheduled } from './app';

export default {
  fetch: (req: Request, env: Env) => handleFetch(req, env),
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(event.cron, env, new Date(event.scheduledTime)));
  },
} satisfies ExportedHandler<Env>;
