// What the calendar's functions read from the Pages project, and the slice of
// the request context they use. The database and Turnstile settings are the
// ones Where We Play already has; the calendar adds only the email binding.
import type { NotifyBinding } from '../notify.ts';
import type { WwpEnv } from '../where-we-play/env.ts';

export interface CalEnv extends WwpEnv {
  /** The ludarium-notify Worker. It emails Levi when a visitor suggests an event. */
  NOTIFY?: NotifyBinding;
}

/** The part of a Pages context the calendar routes use. Tests build one by hand. */
export interface CalContext<Params = Record<string, string>> {
  request: Request;
  env: CalEnv;
  params: Params;
}
