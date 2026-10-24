export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  USER_AGENT?: string;
  /** "true" opens the week, game and feed routes. Keep "false" until BGG grants the commercial license. */
  PUBLIC_API?: string;
  BGG_TOKEN?: string;
  ADMIN_TOKEN?: string;
  EVENTS_TOKEN?: string;
  KIT_WEBHOOK_KEY?: string;
  /** Optional. When set, Kit deliveries must carry a valid X-Kit-Signature. */
  KIT_WEBHOOK_SECRET?: string;
}

export const ATTRIBUTION = {
  text: 'Powered by BGG',
  url: 'https://boardgamegeek.com',
  termsOfUse: 'https://boardgamegeek.com/xmlapi/termsofuse',
  note: 'BGG Hotness ranks and stats come from BoardGameGeek, unchanged. The Ludometer score is The Ludarium\'s own.',
};
