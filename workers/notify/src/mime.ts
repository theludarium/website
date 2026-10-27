// Builds a plain-text email as raw MIME, the format Cloudflare's send_email
// binding takes. No dependency: one text part is all the notices need.

export interface Notice {
  from: string;
  fromName: string;
  to: string;
  subject: string;
  text: string;
  replyTo?: string | null;
  messageDomain: string;
}

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

export const isEmail = (value: unknown): value is string => typeof value === 'string' && value.length <= 254 && EMAIL.test(value);

const base64 = (value: string) => {
  let binary = '';
  for (const byte of new TextEncoder().encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary);
};

/** RFC 2047 encoded word, so names like Pokémon survive in the subject. */
export const encodeHeader = (value: string) => {
  const clean = value.replace(/[\r\n]+/g, ' ').trim();
  return /^[\x20-\x7e]*$/.test(clean) ? clean : `=?UTF-8?B?${base64(clean)}?=`;
};

const wrap = (value: string, width = 76) => value.match(new RegExp(`.{1,${width}}`, 'g'))?.join('\r\n') ?? '';

export function buildMime(n: Notice, now = new Date(), id: string = crypto.randomUUID()): string {
  if (!isEmail(n.from) || !isEmail(n.to)) throw new Error('Bad from or to address');
  const headers = [
    `From: ${encodeHeader(n.fromName)} <${n.from}>`,
    `To: <${n.to}>`,
    ...(n.replyTo && isEmail(n.replyTo) ? [`Reply-To: <${n.replyTo}>`] : []),
    `Subject: ${encodeHeader(n.subject)}`,
    `Date: ${now.toUTCString()}`,
    `Message-ID: <${id}@${n.messageDomain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
  ];
  const body = n.text.replace(/\r?\n/g, '\r\n');
  return `${headers.join('\r\n')}\r\n\r\n${wrap(base64(body))}\r\n`;
}
