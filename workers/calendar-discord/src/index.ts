// The scheduled entry point. A Worker's main file may only export handlers, so the logic is in post.ts.
import { postDue, type Env } from './post.ts';

export default {
  async scheduled(event: { scheduledTime: number }, env: Env): Promise<void> {
    console.log('Calendar to Discord', JSON.stringify(await postDue(env, new Date(event.scheduledTime))));
  },
};
