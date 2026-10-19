// GET /api/country: the visitor's two-letter country code, from Cloudflare's
// own location data for the request. Used only to decide whether to show the
// cookie banner (required in the EU/EEA, UK, and Switzerland). Nothing is
// logged or stored, and no IP address is returned.

interface Context {
  request: Request & { cf?: { country?: string } };
}

export function onRequestGet({ request }: Context): Response {
  const country = request.cf?.country ?? null;
  return new Response(JSON.stringify({ country }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}
