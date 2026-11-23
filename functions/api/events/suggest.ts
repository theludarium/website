// POST /api/events/suggest: a visitor suggests an event from /cube-commonwealth/events/suggest/.
// It is saved as pending and Levi gets an email with a link to the admin page. Nothing
// appears on the calendar until Levi approves it. No email goes to the person who sent it.
import { formatDate, formatTimeRange, todayIn } from '../../../src/lib/calendar/dates.ts';
import { CAL_ADMIN, CAL_SUGGEST, CAL_TZ, kindLabel, type EventSuggestion, type SUGGEST_MESSAGES } from '../../../src/lib/calendar/shared.ts';
import { parseEventSuggestion } from '../../../src/lib/calendar/validate.ts';
import { saveSuggestedEvent } from '../../../src/server/calendar/actions.ts';
import type { CalContext } from '../../../src/server/calendar/env.ts';
import { allow, isHuman, isPreviewHost } from '../../../src/server/calendar/guard.ts';
import { notify } from '../../../src/server/notify.ts';
import { clientIp, field, redirect } from '../../../src/server/where-we-play/http.ts';

export function emailText(e: EventSuggestion, id: number | null, adminUrl: string): string {
  return [
    'A new event is waiting for your approval.',
    '',
    `Title:    ${e.title}`,
    `Kind:     ${kindLabel(e.kind)}`,
    `Date:     ${formatDate(e.date, 'long')}`,
    `Time:     ${formatTimeRange(e.startTime, e.endTime)}${e.endTime <= e.startTime ? ' (ends the next day)' : ''}`,
    `Place:    ${e.locationName ?? '(not given)'}`,
    `Address:  ${e.locationAddress ?? '(not given)'}`,
    `Cube:     ${e.cubeMode === 'vote' ? 'People will draft a Cube. Attendees vote on which one.' : 'No Cube draft.'}`,
    `From:     ${e.submitterName}`,
    `Email:    ${e.submitterEmail ?? '(not given)'}`,
    // Every line is fenced, so a visitor's words cannot pass for the real approve link below.
    `About:    ${(e.description ?? '(none)').replace(/\n/g, '\n        | ')}`,
    '',
    `Approve, edit, or reject it here${id ? ` (event #${id})` : ''}:`,
    adminUrl,
  ].join('\n');
}

export async function onRequestPost({ request, env }: CalContext): Promise<Response> {
  const now = new Date();
  const back = (code: keyof typeof SUGGEST_MESSAGES) => redirect(request, `${CAL_SUGGEST}?event_error=${code}#form`);
  const sent = () => redirect(request, `${CAL_SUGGEST}?event=sent#form`);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back('missing');
  }
  // Honeypot: people never see this field; bots tend to fill it. Pretend it worked.
  if (field(form, 'website')) return sent();
  if (!env.DB) {
    console.error('The suggest form needs the DB binding');
    return back('unavailable');
  }
  if (isPreviewHost(request)) return back('unavailable');

  const ip = clientIp(request);
  if (!(await isHuman(env, field(form, 'cf-turnstile-response'), ip))) return back('verify');

  const event = parseEventSuggestion(form, todayIn(CAL_TZ, now));
  if ('error' in event) return back(event.error);

  let id: number;
  try {
    // Counted last, so a typo sent back for fixing does not use up the hour.
    if (!(await allow(env.DB, env, 'suggest', ip, now))) return back('slow');
    id = await saveSuggestedEvent(env.DB, event, now);
  } catch (err) {
    console.error('Saving a suggested event failed', err);
    return back('unavailable');
  }

  // The event is saved by now, so a failed email does not turn the visitor away.
  await notify(env.NOTIFY, {
    replyTo: event.submitterEmail ?? undefined,
    // Cut by whole characters, so an emoji in a long title is never split in two.
    subject: `Event to approve: ${[...event.title].slice(0, 60).join('')} (${formatDate(event.date, 'short')})`,
    text: emailText(event, id, new URL(CAL_ADMIN, request.url).toString()),
  });
  return sent();
}
