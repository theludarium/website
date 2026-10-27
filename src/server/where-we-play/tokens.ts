// Private edit tokens. A member's edit link carries the token; the database
// stores only its hash, so a database read alone cannot forge a link.
import { sha256Hex } from './http.ts';

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** 32 random bytes, base64url: 43 characters. */
export function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

export function hashToken(token: string): Promise<string> {
  return sha256Hex(`wwp-edit:${token}`);
}

export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,48}$/;
