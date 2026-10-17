import type { APIRoute } from 'astro';
import { pngResponse, shareCard } from '@/lib/og';
import { SITE } from '@/lib/site';

// The default share image for any page without its own.
export const GET: APIRoute = async () =>
  pngResponse(await shareCard({ eyebrow: 'Togethering for a lifetime', title: SITE.tagline }));
