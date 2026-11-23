// The scheduled entry point. A Worker's main file may only export handlers, so the logic is in refresh.ts.
import { refreshCubes, slotFor, type Env } from './refresh.ts';

export default {
  async scheduled(event: { scheduledTime: number }, env: Env): Promise<void> {
    const slot = slotFor(event.scheduledTime);
    console.log('Cube refresh', slot, JSON.stringify(await refreshCubes(env, slot)));
  },
};
