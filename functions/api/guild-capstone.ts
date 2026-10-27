// Guild of Game Guides capstone submissions: POST /api/guild-capstone
//
// A Cloudflare Pages Function, the same shape as functions/api/inquiry.ts.
// 1. Drops obvious bots (hidden honeypot field) and checks Cloudflare Turnstile.
// 2. Validates the submission: the student's details, the ten Self-Assessment
//    scores, and the newcomer's Feedback Card answers.
// 3. Emails it to Levi through the ludarium-notify Worker (Cloudflare Email
//    Routing), with reply-to set to the student, so he can review it and send
//    the Expert Game Guide certificate.
// 4. Redirects to /academy/guild/capstone/thanks/, or back to the form with an error code.
//
// It reuses the inquiry form's settings in the Cloudflare Pages project:
//   NOTIFY (service binding to ludarium-notify) and TURNSTILE_SECRET_KEY.
import { notify, type NotifyBinding } from '../../src/server/notify.ts';

export interface Env {
  NOTIFY?: NotifyBinding;
  TURNSTILE_SECRET_KEY?: string;
}

interface Context {
  request: Request;
  env: Env;
}

/** The ten lines of the Self-Assessment, scored 1 to 5. Field names are rubric_<key>. */
export const RUBRIC = [
  { key: 'hook', name: 'Hook', five: 'You opened with the theme in one sentence: who they are and what they want, in under twenty seconds.' },
  { key: 'goal', name: 'Goal', five: 'You said how the game ends and how to win before any other rule.' },
  { key: 'turn', name: 'Turn demo', five: 'You showed one turn with real pieces, saying "you," not "a player."' },
  { key: 'gotcha', name: 'Gotcha', five: 'You named the one surprising rule up front, and again when it first came up.' },
  { key: 'holdback', name: 'Holding back', five: 'No rare rule came before it mattered, and nothing was read aloud from the rulebook.' },
  { key: 'pace', name: 'Pace', five: 'The first move came less than five minutes after everyone sat down.' },
  { key: 'checks', name: 'Checks', five: 'You asked "What questions do you have?" and waited for the answer.' },
  { key: 'open', name: 'Open round', five: 'The first round was played with open hands or as a practice round.' },
  { key: 'blowout', name: 'Blowout control', five: 'The newcomer was in the game to the end, and the final scores were close enough to feel fair.' },
  { key: 'close', name: 'Close', five: 'You asked a debrief question and proposed the next game before anyone stood up.' },
] as const;

/** The Newcomer Feedback Card: five questions a new player answers in a minute. Field names are fb_<key>. */
export const FEEDBACK = [
  { key: 'fun', question: 'What was your favorite moment?', kind: 'text' },
  { key: 'lost', question: 'Was there a point where you felt lost? When?', kind: 'text' },
  { key: 'length', question: 'How did the explanation feel?', kind: 'choice', options: ['Too short', 'About right', 'Too long'] },
  { key: 'about', question: 'How would you describe this game to a friend?', kind: 'text' },
  { key: 'again', question: 'Would you play this game, or another one, with me again?', kind: 'choice', options: ['Yes', 'Maybe', 'No'] },
] as const;

export const RELATIONSHIPS = ['Partner', 'Family member', 'Friend', 'Coworker', 'Someone else'];

const LIMITS = { name: 100, email: 200, game: 120, text: 1500 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Capstone = {
  name: string;
  certName: string;
  email: string;
  game: string;
  relationship: string;
  scores: Record<string, number>;
  feedback: Record<string, string>;
  change: string;
};

const field = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ');

/** Returns the cleaned submission, or the name of the first problem. */
export function parseCapstone(form: FormData): Capstone | { error: string } {
  const capstone: Capstone = {
    name: oneLine(field(form, 'name')),
    certName: oneLine(field(form, 'cert_name')) || oneLine(field(form, 'name')),
    email: oneLine(field(form, 'email')),
    game: oneLine(field(form, 'game')),
    relationship: field(form, 'relationship'),
    scores: {},
    feedback: {},
    change: field(form, 'change'),
  };
  if (!capstone.name || !capstone.email || !capstone.game) return { error: 'missing' };
  if (!EMAIL_PATTERN.test(capstone.email)) return { error: 'email' };
  if (!RELATIONSHIPS.includes(capstone.relationship)) return { error: 'missing' };
  for (const line of RUBRIC) {
    const score = Number(field(form, `rubric_${line.key}`));
    if (!Number.isInteger(score) || score < 1 || score > 5) return { error: 'scores' };
    capstone.scores[line.key] = score;
  }
  for (const q of FEEDBACK) {
    const answer = field(form, `fb_${q.key}`);
    if (!answer) return { error: 'feedback' };
    if (q.kind === 'choice' && !(q.options as readonly string[]).includes(answer)) return { error: 'feedback' };
    if (answer.length > LIMITS.text) return { error: 'long' };
    capstone.feedback[q.key] = answer;
  }
  if (
    capstone.name.length > LIMITS.name ||
    capstone.certName.length > LIMITS.name ||
    capstone.email.length > LIMITS.email ||
    capstone.game.length > LIMITS.game ||
    capstone.change.length > LIMITS.text
  ) {
    return { error: 'long' };
  }
  return capstone;
}

export const totalScore = (c: Capstone) => Object.values(c.scores).reduce((a, b) => a + b, 0);

export function emailText(c: Capstone): string {
  return [
    'New Guild of Game Guides capstone from theludarium.com',
    '',
    `Student:          ${c.name}`,
    `Name to print:    ${c.certName}`,
    `Email:            ${c.email}`,
    `Game taught:      ${c.game}`,
    `Newcomer was a:   ${c.relationship}`,
    `Second game?      ${c.feedback.again}`,
    '',
    `Self-Assessment: ${totalScore(c)} out of 50`,
    ...RUBRIC.map((line) => `  ${line.name.padEnd(16)} ${c.scores[line.key]}`),
    '',
    'Newcomer Feedback Card:',
    ...FEEDBACK.flatMap((q) => [`  ${q.question}`, `    ${c.feedback[q.key]}`]),
    '',
    'What they would change:',
    c.change || '(left blank)',
    '',
    c.feedback.again === 'Yes'
      ? 'The newcomer said yes. If the teach holds up, make the certificate at https://theludarium.com/academy/guild/certificate/ and reply with it.'
      : 'The newcomer did not say yes, so no certificate yet. Reply with encouragement and what to try next time.',
  ].join('\n');
}

async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

const redirect = (request: Request, path: string) => Response.redirect(new URL(path, request.url).toString(), 303);
const back = (request: Request, error: string) => redirect(request, `/academy/guild/capstone/?error=${error}#capstone-form`);
const THANKS = '/academy/guild/capstone/thanks/';

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back(request, 'missing');
  }

  // Honeypot: people never see this field; bots tend to fill it. Pretend it worked.
  if (field(form, 'website')) return redirect(request, THANKS);

  if (!env.NOTIFY || !env.TURNSTILE_SECRET_KEY) {
    console.error('Capstone form is missing the NOTIFY binding or TURNSTILE_SECRET_KEY');
    return back(request, 'unavailable');
  }

  const token = field(form, 'cf-turnstile-response');
  const human = token && (await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP')));
  if (!human) return back(request, 'verify');

  const capstone = parseCapstone(form);
  if ('error' in capstone) return back(request, capstone.error);

  const sent = await notify(env.NOTIFY, {
    replyTo: capstone.email,
    subject: `Guild capstone: ${capstone.name}, ${capstone.game} (${totalScore(capstone)}/50, second game: ${capstone.feedback.again})`,
    text: emailText(capstone),
  });
  if (!sent) return back(request, 'unavailable');

  return redirect(request, THANKS);
}
