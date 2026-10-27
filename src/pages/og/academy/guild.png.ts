import type { APIRoute } from 'astro';
import { pngResponse, shareCard } from '@/lib/og';

// Share image for the Guild of Game Guides program page.
export const GET: APIRoute = async () =>
  pngResponse(await shareCard({ eyebrow: 'The Ludarium Guild of Game Guides', title: 'Teach any board game in five minutes.' }));
