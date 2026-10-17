import type { APIRoute } from 'astro';
import { logoPng, pngResponse } from '@/lib/og';

// 512 x 512 raster logo: search engines want a PNG for Organization structured data.
export const GET: APIRoute = () => pngResponse(logoPng(512));
