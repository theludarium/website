// Visitors are stored as a salted SHA-256 of their IP, never the IP itself.
// The same IP always gives the same hash (so repeat visits and the cache
// line up), but nobody can turn the hash back into the address without the salt.

export async function hashIp(ip: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
