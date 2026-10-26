// The confirmation email, sent through Resend with the inquiry form's settings.
// It carries the member's private edit link, so one email does both jobs.
import { PRIVACY_LINE } from '../../lib/where-we-play/shared.ts';
import type { WwpEnv } from './env.ts';

export interface Confirmation {
  to: string;
  firstName: string | null;
  editUrl: string;
  /** True when the submission updated an existing entry. */
  updated: boolean;
}

export const CONFIRMATION_SUBJECT = 'We got your Where We Play submission';

export function confirmationText(c: Confirmation): string {
  const hello = c.firstName ? `Hi ${c.firstName},` : 'Hi,';
  const what = c.updated
    ? 'Your Where We Play entry is updated. Thanks for keeping it current.'
    : 'Thanks for sharing where you live. Your drive times to every candidate venue are being worked out now, and they will shape where the Cube Commonwealth meets next.';
  return [
    hello,
    '',
    what,
    '',
    'Your private link, to update or delete your entry any time:',
    c.editUrl,
    '',
    PRIVACY_LINE,
    '',
    'The Ludarium',
    'https://theludarium.com',
  ].join('\n');
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function confirmationHtml(c: Confirmation): string {
  const hello = c.firstName ? `Hi ${escape(c.firstName)},` : 'Hi,';
  const what = c.updated
    ? 'Your Where We Play entry is updated. Thanks for keeping it current.'
    : 'Thanks for sharing where you live. Your drive times to every candidate venue are being worked out now, and they will shape where the Cube Commonwealth meets next.';
  return `<!doctype html><html><body style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#2b1e16;line-height:1.6;max-width:36em;margin:0 auto;padding:1.5em">
<p>${hello}</p>
<p>${what}</p>
<p><strong>Your private link</strong>, to update or delete your entry any time:<br>
<a href="${escape(c.editUrl)}">${escape(c.editUrl)}</a></p>
<p style="color:#6b5d4f;font-size:0.95em">${escape(PRIVACY_LINE)}</p>
<p>The Ludarium<br><a href="https://theludarium.com">theludarium.com</a></p>
</body></html>`;
}

/** Sends the email. Without a Resend key (local dev) it logs instead and reports success. */
export async function sendConfirmation(env: WwpEnv, c: Confirmation): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.log(`[where-we-play] no RESEND_API_KEY; would email ${c.to}:\n${confirmationText(c)}`);
    return true;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.INQUIRY_FROM || 'The Ludarium <onboarding@resend.dev>',
        to: [c.to],
        subject: CONFIRMATION_SUBJECT,
        text: confirmationText(c),
        html: confirmationHtml(c),
      }),
    });
    if (!res.ok) console.error('Resend rejected the confirmation email', res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error('Resend call failed', err);
    return false;
  }
}
