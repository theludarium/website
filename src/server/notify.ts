// Sends a form notice to the site owner's inbox through the ludarium-notify
// Worker (workers/notify/), bound to the Pages project as NOTIFY. Pages
// Functions cannot send email themselves; the Worker can, through Cloudflare
// Email Routing, and only to the owner's verified address.

export interface NotifyBinding {
  fetch(input: string, init?: RequestInit): Promise<Response>;
}

export interface Notice {
  subject: string;
  text: string;
  /** The person who filled out the form, so replying goes straight to them. */
  replyTo?: string;
}

/** True when the Worker accepted the notice. Never throws. */
export async function notify(binding: NotifyBinding | undefined, notice: Notice): Promise<boolean> {
  if (!binding) {
    console.error('Form notices need the NOTIFY service binding (ludarium-notify)');
    return false;
  }
  try {
    const res = await binding.fetch('https://notify/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notice),
    });
    if (!res.ok) console.error('ludarium-notify refused the notice', res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error('ludarium-notify could not be reached', err);
    return false;
  }
}
